let currentPage = 0;
const PAGE_SIZE = 50;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();

    // Bind Filter Form Submit
    document.getElementById('filter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 0;
        loadTransactions();
    });

    // Bind Export Excel Button
    const exportBtn = document.getElementById('export-excel-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const username = document.getElementById('filter-username').value.trim();
            const startDate = document.getElementById('filter-start-date').value;
            const endDate = document.getElementById('filter-end-date').value;
            
            const originalText = exportBtn.innerHTML;
            exportBtn.disabled = true;
            exportBtn.innerHTML = '⌛ AKTARILIYOR...';
            
            try {
                await exportTransactions(username, startDate, endDate);
            } catch (err) {
                console.error('Export error:', err);
                alert('Veriler dışa aktarılırken bir hata oluştu.');
            } finally {
                exportBtn.disabled = false;
                exportBtn.innerHTML = originalText;
            }
        });
    }

    // Bind Clear Filters Btn
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        document.getElementById('filter-form').reset();
        currentPage = 0;
        loadTransactions();
    });

    // Bind Pagination Buttons
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadTransactions();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadTransactions();
        }
    });

    // Bind Delete Confirmation Modal Event Listeners
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        document.getElementById('close-delete-btn').addEventListener('click', () => {
            deleteModal.classList.add('hidden');
        });
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            deleteModal.classList.add('hidden');
        });
        document.getElementById('delete-form').addEventListener('submit', handleDeleteSubmit);
    }
});

async function loadTransactions() {
    const loadingEl = document.getElementById('transactions-loading');
    const emptyEl = document.getElementById('transactions-empty');
    const tbody = document.getElementById('transactions-tbody');
    const tableContainer = tbody.closest('.admin-table-container');
    const paginationEl = document.getElementById('pagination-controls');

    tbody.innerHTML = '';
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    tableContainer.classList.add('hidden');
    paginationEl.classList.add('hidden');

    const username = document.getElementById('filter-username').value.trim();
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    try {
        let path = `/admin/transactions?page=${currentPage}&size=${PAGE_SIZE}`;
        if (username) path += `&username=${encodeURIComponent(username)}`;
        if (startDate) path += `&startDate=${startDate}`;
        if (endDate) path += `&endDate=${endDate}`;

        const pageData = await apiFetch(path);
        loadingEl.classList.add('hidden');

        const list = (pageData && pageData.content) ? pageData.content : [];
        totalPages = (pageData && pageData.totalPages) ? pageData.totalPages : 1;
        const totalElements = (pageData && pageData.totalElements) ? pageData.totalElements : 0;

        const countEl = document.getElementById('transactions-count');
        if (countEl) {
            const startNum = totalElements === 0 ? 0 : (currentPage * PAGE_SIZE) + 1;
            const endNum = Math.min(totalElements, (currentPage + 1) * PAGE_SIZE);
            countEl.innerText = `${totalElements} kayıttan ${startNum}-${endNum}`;
        }

        if (list.length === 0) {
            emptyEl.classList.remove('hidden');
            return;
        }

        tableContainer.classList.remove('hidden');
        paginationEl.classList.remove('hidden');

        list.forEach(tx => {
            const row = document.createElement('tr');
            
            const timeStr = formatDateTime(tx.timestamp);
            const userStr = tx.fullName ? `${tx.fullName} (${tx.username})` : tx.username;
            
            // Type Badge
            let typeBadge = tx.type === 'GIRIS'
                ? '<span class="badge badge-success">GİRİŞ</span>'
                : '<span class="badge badge-secondary">ÇIKIŞ</span>';

            if (tx.manual) {
                const titleAttr = tx.manualNote ? ` title="${tx.manualNote.replace(/"/g, '&quot;')}"` : '';
                typeBadge += `<span class="badge bg-purple-100 text-purple-800 border border-purple-200 ml-1.5 cursor-pointer font-bold text-[10px]"${titleAttr}>MANUEL</span>`;
            }

            // Method Badge
            let methodBadge = '';
            if (tx.method === 'QR') {
                methodBadge = '<span class="badge badge-warning">QR</span>';
            } else if (tx.method === 'GPS') {
                methodBadge = '<span class="badge badge-success">GPS</span>';
            } else if (tx.method === 'MANUAL') {
                methodBadge = '<span class="badge bg-gray-100 text-gray-800 border border-gray-200">Manuel</span>';
            } else {
                methodBadge = `<span class="badge badge-secondary">${tx.method}</span>`;
            }

            // Location coordinates rendering check
            let locationStr = '';
            if (tx.locationName && tx.locationName !== 'Konum: Kaydedildi') {
                locationStr = tx.locationName;
            } else if (tx.latitude && tx.longitude) {
                locationStr = `<span class="text-xs text-[#7A7872] font-mono">${tx.latitude.toFixed(4)}, ${tx.longitude.toFixed(4)}</span>`;
            } else {
                locationStr = '<span class="text-xs text-[#7A7872]">Konum: Kaydedildi</span>';
            }

            row.innerHTML = `
                <td class="font-medium text-xs text-[#7A7872]">${timeStr}</td>
                <td class="font-semibold text-dark">${userStr}</td>
                <td>${typeBadge}</td>
                <td>${locationStr}</td>
                <td>${methodBadge}</td>
                <td class="text-center">
                    <button
                        class="text-danger text-xs font-bold px-2 py-0.5 rounded border border-danger hover:bg-red-50 transition-colors"
                        onclick="handleDeleteTransaction(${tx.id}, '${timeStr}', '${tx.type === 'GIRIS' ? 'GİRİŞ' : 'ÇIKIŞ'}')"
                    >Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        updatePaginationUI();

    } catch (err) {
        console.error('Error loading transactions:', err);
        loadingEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
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

function handleDeleteTransaction(txId, timeStr, typeStr) {
    document.getElementById('deleteTxId').value = txId;
    document.getElementById('deleteReason').value = '';
    document.getElementById('delete-error').classList.add('hidden');
    document.getElementById('delete-target-info').innerText = `${typeStr} — ${timeStr} (ID: ${txId})`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

async function handleDeleteSubmit(e) {
    e.preventDefault();

    const txId = parseInt(document.getElementById('deleteTxId').value);
    const reason = document.getElementById('deleteReason').value.trim();

    const errorEl = document.getElementById('delete-error');
    const saveBtn = document.getElementById('confirm-delete-btn');
    const spinner = document.getElementById('delete-spinner');

    if (reason.length < 5) {
        errorEl.innerText = 'Silme gerekçesi en az 5 karakter uzunluğunda olmalıdır.';
        errorEl.classList.remove('hidden');
        return;
    }

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await deleteTransaction(txId, reason);
        document.getElementById('delete-modal').classList.add('hidden');
        loadTransactions();
    } catch (err) {
        console.error('Error deleting transaction:', err);
        errorEl.innerText = err.message || 'Kayıt silinirken bir hata oluştu.';
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}
