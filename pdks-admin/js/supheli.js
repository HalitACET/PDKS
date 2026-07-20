let currentPage = 0;
const PAGE_SIZE = 50;
let totalPages = 1;
let allAttempts = []; // Cache for current page attempts to filter client-side
let totalElements = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadAttempts();

    // Bind Client-side Search Input
    const searchInput = document.getElementById('suspicious-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderAttempts();
        });
    }

    // Bind Pagination Buttons
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadAttempts();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadAttempts();
        }
    });
});

async function loadAttempts() {
    const loadingEl = document.getElementById('attempts-loading');
    const emptyEl = document.getElementById('attempts-empty');
    const tbody = document.getElementById('attempts-tbody');
    const tableContainer = tbody.closest('.admin-table-container');
    const paginationEl = document.getElementById('pagination-controls');

    tbody.innerHTML = '';
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    tableContainer.classList.add('hidden');
    paginationEl.classList.add('hidden');

    try {
        const path = `/admin/suspicious-attempts?page=${currentPage}&size=${PAGE_SIZE}`;
        const pageData = await apiFetch(path);
        
        loadingEl.classList.add('hidden');

        allAttempts = (pageData && pageData.content) ? pageData.content : [];
        totalPages = (pageData && pageData.totalPages) ? pageData.totalPages : 1;
        totalElements = (pageData && pageData.totalElements) ? pageData.totalElements : 0;

        if (allAttempts.length === 0) {
            emptyEl.classList.remove('hidden');
            const countEl = document.getElementById('suspicious-count');
            if (countEl) countEl.innerText = '0 kayıt';
            return;
        }

        tableContainer.classList.remove('hidden');
        paginationEl.classList.remove('hidden');

        renderAttempts();
        updatePaginationUI();

    } catch (err) {
        console.error('Error loading suspicious attempts:', err);
        loadingEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
    }
}

function renderAttempts() {
    const tbody = document.getElementById('attempts-tbody');
    const searchVal = document.getElementById('suspicious-search').value.toLowerCase().trim();
    
    tbody.innerHTML = '';

    const filtered = allAttempts.filter(sa => {
        const userMatch = sa.fullName ? sa.fullName.toLowerCase().includes(searchVal) : false;
        const usernameMatch = sa.username ? sa.username.toLowerCase().includes(searchVal) : false;
        const reasonMatch = sa.reason ? sa.reason.toLowerCase().includes(searchVal) : false;
        return userMatch || usernameMatch || reasonMatch;
    });

    filtered.forEach(sa => {
        const row = document.createElement('tr');
        
        const timeStr = formatDateTime(sa.timestamp);
        const userStr = sa.fullName ? `${sa.fullName} (${sa.username})` : sa.username;
        
        // Reason Badge mapping
        const reasonBadge = getReasonBadge(sa.reason);

        // Coordinate string formatting
        const coordsStr = (sa.latitude && sa.longitude)
            ? `<span class="font-mono text-xs text-dark">${sa.latitude.toFixed(4)}, ${sa.longitude.toFixed(4)}</span>`
            : '—';

        // Shortened device UUID with hover title
        const fullId = sa.deviceId || '—';
        const shortId = fullId.length > 12 ? `${fullId.substring(0, 8)}...${fullId.slice(-4)}` : fullId;

        row.innerHTML = `
            <td class="font-medium text-xs text-[#7A7872]">${timeStr}</td>
            <td class="font-semibold text-dark">${userStr}</td>
            <td>${reasonBadge}</td>
            <td>${coordsStr}</td>
            <td class="font-mono text-xs text-[#7A7872]" title="${fullId}">${shortId}</td>
        `;
        tbody.appendChild(row);
    });

    // Update count display
    const countEl = document.getElementById('suspicious-count');
    if (countEl) {
        const startNum = totalElements === 0 ? 0 : (currentPage * PAGE_SIZE) + 1;
        const endNum = Math.min(totalElements, (currentPage + 1) * PAGE_SIZE);
        
        if (searchVal) {
            countEl.innerText = `${filtered.length} / ${allAttempts.length} eşleşen (${totalElements} toplam)`;
        } else {
            countEl.innerText = `${totalElements} kayıttan ${startNum}-${endNum}`;
        }
    }
}

function getReasonBadge(reason) {
    switch (reason) {
        case 'GEOFENCE_VIOLATION':
            return '<span class="badge" style="background-color: rgba(245, 124, 0, 0.1); color: #F57C00;">Tesis Dışı</span>';
        case 'IMPOSSIBLE_SPEED':
            return '<span class="badge badge-danger">İmkânsız Hız</span>';
        case 'FROZEN_COORDINATE':
            return '<span class="badge" style="background-color: rgba(123, 31, 162, 0.1); color: #7B1FA2;">Donmuş Koordinat</span>';
        case 'MOCK_FLAG':
        case 'MOCK_LOCATION':
            return '<span class="badge" style="background-color: rgba(183, 28, 28, 0.1); color: #B71C1C;">Sahte Konum</span>';
        default:
            return `<span class="badge badge-secondary">${reason}</span>`;
    }
}

function updatePaginationUI() {
    document.getElementById('page-info').innerText = `Sayfa ${currentPage + 1} / ${totalPages}`;
    
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}
