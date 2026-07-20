document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    const loadingEl = document.getElementById('dashboard-loading');
    const contentEl = document.getElementById('dashboard-content');

    try {
        // Fetch stats and transactions in parallel
        const [stats, txResponse] = await Promise.all([
            apiFetch('/admin/dashboard-stats'),
            apiFetch('/admin/transactions?page=0&size=10')
        ]);

        populateStats(stats);
        populateTransactions(txResponse);

        // Hide loading and show content
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

function populateStats(stats) {
    if (!stats) return;

    document.getElementById('stat-inside').innerText = stats.currentlyInsideCount || '0';
    document.getElementById('stat-entries').innerText = stats.todayEntryCount || '0';
    document.getElementById('stat-exits').innerText = stats.todayExitCount || '0';

    const attemptsVal = stats.suspiciousAttemptCount || 0;
    const attemptsEl = document.getElementById('stat-attempts');
    const attemptsCard = document.getElementById('stat-attempts-card');

    attemptsEl.innerText = attemptsVal;

    if (attemptsVal > 0) {
        // Highlight in red for active warnings
        attemptsEl.className = 'text-4xl font-extrabold text-danger';
        attemptsCard.className = 'bg-red-50 border-2 border-danger rounded-xl p-6 shadow-sm flex flex-col justify-between';
    } else {
        // Neutral gray style
        attemptsEl.className = 'text-4xl font-extrabold text-[#7A7872]';
        attemptsCard.className = 'bg-white border border-[#E0DDD5] rounded-xl p-6 shadow-sm flex flex-col justify-between';
    }
}

function populateTransactions(txResponse) {
    const tbody = document.getElementById('transactions-tbody');
    const emptyEl = document.getElementById('transactions-empty');
    const tableContainer = tbody.closest('.admin-table-container');

    tbody.innerHTML = '';

    const list = (txResponse && txResponse.content) ? txResponse.content : [];

    if (list.length === 0) {
        tableContainer.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        return;
    }

    tableContainer.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    list.forEach(tx => {
        const timeStr = formatTime(tx.timestamp);
        const nameStr = tx.fullName || tx.username || '—';
        
        // Type Badge styling
        let typeBadge = '';
        if (tx.type === 'GIRIS') {
            typeBadge = '<span class="badge badge-success">GİRİŞ</span>';
        } else {
            typeBadge = '<span class="badge badge-secondary">ÇIKIŞ</span>';
        }

        // Method Badge styling
        let methodBadge = '';
        if (tx.method === 'QR') {
            methodBadge = '<span class="badge badge-warning">QR</span>';
        } else {
            methodBadge = '<span class="badge badge-success">GPS</span>';
        }

        let locationStr = '';
        if (tx.locationName && tx.locationName !== 'Konum: Kaydedildi') {
            locationStr = tx.locationName;
        } else if (tx.latitude && tx.longitude) {
            locationStr = `<span class="text-xs text-[#7A7872] font-mono">${tx.latitude.toFixed(4)}, ${tx.longitude.toFixed(4)}</span>`;
        } else {
            locationStr = '<span class="text-xs text-[#7A7872]">Konum: Kaydedildi</span>';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="font-medium text-xs text-[#7A7872]">${timeStr}</td>
            <td class="font-semibold text-dark">${nameStr}</td>
            <td>${typeBadge}</td>
            <td>${locationStr}</td>
            <td>${methodBadge}</td>
        `;
        tbody.appendChild(row);
    });
}

function formatTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes} (${day}.${month})`;
}
