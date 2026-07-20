let usersList = [];

document.addEventListener('DOMContentLoaded', () => {
    populateUsers();
    setupYearMonth();

    // Bind fetch button
    document.getElementById('fetch-btn').addEventListener('click', handleFetch);

    // Bind export button
    document.getElementById('export-btn').addEventListener('click', handleExport);

    // Bind Correction Modal Close Buttons
    const corrModal = document.getElementById('correction-modal');
    const closeCorr = () => corrModal.classList.add('hidden');
    document.getElementById('close-correction-btn').addEventListener('click', closeCorr);
    document.getElementById('cancel-correction-btn').addEventListener('click', closeCorr);

    // Bind Correction Type change to adjust timestamp default hour
    const typeSelect = document.getElementById('corrType');
    const tsInput = document.getElementById('corrTimestamp');
    typeSelect.addEventListener('change', () => {
        const currentDateVal = document.getElementById('correctionDate').value;
        if (currentDateVal) {
            const timePart = typeSelect.value === 'CIKIS' ? '17:00' : '08:00';
            tsInput.value = `${currentDateVal}T${timePart}`;
        }
    });

    // Bind Correction Form Submit
    document.getElementById('correction-form').addEventListener('submit', handleCorrectionSubmit);
});

async function populateUsers() {
    const userSelect = document.getElementById('userSelect');
    try {
        const users = await apiFetch('/admin/users');
        usersList = users || [];

        usersList.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.innerText = `${u.fullName} (${u.username})`;
            userSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Error loading users for filter:', err);
        showToast('Kullanıcı listesi yüklenemedi.', 'error');
    }
}

function setupYearMonth() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    const now = new Date();
    monthSelect.value = now.getMonth() + 1;
    yearSelect.value = now.getFullYear();
}

async function handleFetch() {
    const userIdVal = document.getElementById('userSelect').value;
    if (!userIdVal) {
        showToast('Lütfen bir personel seçin.', 'error');
        return;
    }

    const userId = parseInt(userIdVal);
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);

    const infoEl = document.getElementById('timesheet-info');
    const loadingEl = document.getElementById('timesheet-loading');
    const tbody = document.getElementById('timesheet-tbody');
    const exportBtn = document.getElementById('export-btn');

    tbody.innerHTML = '';
    infoEl.classList.add('hidden');
    loadingEl.classList.remove('hidden');
    exportBtn.disabled = true;

    // Reset summary stats
    document.getElementById('stat-worked').innerText = '—';
    document.getElementById('stat-expected').innerText = '—';
    document.getElementById('stat-difference').innerText = '—';
    document.getElementById('stat-difference').className = 'text-xl font-bold text-dark';
    document.getElementById('stat-late').innerText = '—';

    try {
        const res = await getTimesheet(userId, year, month);
        loadingEl.classList.add('hidden');

        if (!res || !res.days || res.days.length === 0) {
            infoEl.innerText = 'Puantaj verisi bulunamadı.';
            infoEl.classList.remove('hidden');
            return;
        }

        // Render Summary Panel Stats
        const totals = res.totals;
        document.getElementById('stat-worked').innerText = formatMinutes(totals.workedMinutes);
        document.getElementById('stat-expected').innerText = formatMinutes(totals.expectedMinutes);
        
        const diffText = formatMinutes(totals.differenceMinutes);
        const diffEl = document.getElementById('stat-difference');
        if (totals.differenceMinutes > 0) {
            diffEl.innerText = `+${diffText}`;
            diffEl.className = 'text-xl font-bold text-success';
        } else if (totals.differenceMinutes < 0) {
            diffEl.innerText = diffText;
            diffEl.className = 'text-xl font-bold text-danger';
        } else {
            diffEl.innerText = diffText;
            diffEl.className = 'text-xl font-bold text-dark';
        }

        document.getElementById('stat-late').innerText = `${totals.lateDays} gün`;

        // Render Table Rows
        res.days.forEach(day => {
            const row = document.createElement('tr');
            
            const firstEntryStr = day.firstEntry || '—';
            const lastExitStr = day.lastExit || '—';
            const workedStr = day.workedMinutes > 0 ? formatMinutes(day.workedMinutes) : '—';
            const expectedStr = day.expectedMinutes > 0 ? formatMinutes(day.expectedMinutes) : '—';
            
            // Difference column text and style
            let diffStr = '—';
            let diffClass = 'text-[#7A7872]';
            if (day.workedMinutes > 0 || day.expectedMinutes > 0) {
                diffStr = formatMinutes(day.differenceMinutes);
                if (day.differenceMinutes > 0) {
                    diffStr = `+${diffStr}`;
                    diffClass = 'text-success font-semibold';
                } else if (day.differenceMinutes < 0) {
                    diffClass = 'text-danger font-semibold';
                }
            }

            // Durum badge
            let statusBadge = '';
            let isLate = false;
            let isAbsent = false;
            let isIncomplete = false;
            let isWeekendWork = false;
            let rowClass = '';

            if (day.status === 'COMPLETE') {
                statusBadge = '<span class="badge badge-success">Tam</span>';
            } else if (day.status === 'LATE') {
                statusBadge = `<span class="badge badge-warning">Geç Kaldı (${day.lateMinutes}dk)</span>`;
            } else if (day.status === 'INCOMPLETE') {
                statusBadge = '<span class="badge badge-danger">Eksik Kayıt</span>';
                isIncomplete = true;
            } else if (day.status === 'ABSENT') {
                statusBadge = '<span class="badge badge-secondary">Gelmedi</span>';
            } else if (day.status === 'WEEKEND_WORK') {
                statusBadge = '<span class="badge" style="background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;">Hafta Sonu Mesaisi</span>';
                isWeekendWork = true;
                rowClass = 'bg-indigo-50';
            } else {
                statusBadge = '<span class="text-[#7A7872]">—</span>';
            }

            // Anomalies warning icon
            let anomalyHtml = '';
            if (day.anomalies && day.anomalies.length > 0) {
                const tooltipText = day.anomalies.join(', ');
                anomalyHtml = `<span class="ml-2 cursor-pointer text-amber-500 font-bold" title="${tooltipText}">⚠️</span>`;
            }

            // Düzelt / Kayıt Ekle butonu — her satırda görünür
            const actionHtml = `
                <button class="text-xs font-bold px-2 py-0.5 rounded border ${isIncomplete ? 'border-danger text-danger hover:bg-red-50' : 'border-[#C2B97F] text-primary hover:bg-amber-50'} transition-colors"
                        onclick="openCorrectionModal(${userId}, '${day.date}')">
                    ${isIncomplete ? '⚠ Düzelt' : '+ Ekle'}
                </button>
            `;

            if (rowClass) row.className = rowClass;

            row.innerHTML = `
                <td class="font-semibold text-dark font-mono">${day.date}</td>
                <td class="text-[#7A7872]">${day.dayOfWeek}</td>
                <td class="font-mono text-dark">${firstEntryStr}</td>
                <td class="font-mono text-dark">${lastExitStr}</td>
                <td class="font-semibold text-dark">${workedStr}</td>
                <td class="text-[#7A7872]">${expectedStr}</td>
                <td class="${diffClass}">${diffStr}</td>
                <td>
                    <div class="flex items-center">
                        ${statusBadge}
                        ${anomalyHtml}
                    </div>
                </td>
                <td class="text-center">${actionHtml}</td>
            `;
            tbody.appendChild(row);
        });

        exportBtn.disabled = false;

    } catch (err) {
        console.error('Error loading timesheet:', err);
        loadingEl.classList.add('hidden');
        infoEl.innerText = 'Puantaj verisi alınamadı.';
        infoEl.classList.remove('hidden');
        showToast('Puantaj hesaplanırken sunucu hatası oluştu.', 'error');
    }
}

function formatMinutes(minutes) {
    if (minutes == null) return '0dk';
    const absMins = Math.abs(minutes);
    const h = Math.floor(absMins / 60);
    const m = absMins % 60;
    const sign = minutes < 0 ? '-' : '';
    if (h > 0) {
        return `${sign}${h}s ${m}dk`;
    }
    return `${sign}${m}dk`;
}

async function handleExport() {
    const userIdVal = document.getElementById('userSelect').value;
    if (!userIdVal) return;

    const userId = parseInt(userIdVal);
    const user = usersList.find(u => u.id === userId);
    const username = user ? user.username : 'user';
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);

    try {
        await exportTimesheet(userId, username, year, month);
        showToast('Excel raporu indiriliyor.', 'success');
    } catch (err) {
        console.error('Error exporting timesheet:', err);
        showToast('Rapor dışa aktarılamadı.', 'error');
    }
}

function openCorrectionModal(userId, date) {
    document.getElementById('correctionUserId').value = userId;
    document.getElementById('correctionDate').value = date;
    document.getElementById('corrNote').value = '';
    document.getElementById('correction-error').classList.add('hidden');

    const typeSelect = document.getElementById('corrType');
    typeSelect.value = 'CIKIS'; // Default to checkout correction

    const tsInput = document.getElementById('corrTimestamp');
    tsInput.value = `${date}T17:00`; // Default to 17:00

    // Update modal title with the selected date
    const titleEl = document.getElementById('correction-modal-title');
    if (titleEl) {
        const d = new Date(date + 'T00:00:00');
        const formatted = d.toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric', weekday:'long' });
        titleEl.innerText = `Kayıt Ekle / Düzelt — ${formatted}`;
    }

    document.getElementById('correction-modal').classList.remove('hidden');
}

async function handleCorrectionSubmit(e) {
    e.preventDefault();

    const userId = parseInt(document.getElementById('correctionUserId').value);
    const type = document.getElementById('corrType').value;
    const timestamp = document.getElementById('corrTimestamp').value;
    const note = document.getElementById('corrNote').value.trim();

    const errorEl = document.getElementById('correction-error');
    const saveBtn = document.getElementById('save-correction-btn');
    const spinner = document.getElementById('correction-spinner');

    if (note.length < 5) {
        errorEl.innerText = 'Açıklama alanı en az 5 karakter uzunluğunda olmalıdır.';
        errorEl.classList.remove('hidden');
        return;
    }

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await createManualTransaction({
            userId,
            type,
            timestamp,
            note
        });

        showToast('Kayıt başarıyla eklendi, puantaj güncelleniyor.', 'success');
        document.getElementById('correction-modal').classList.add('hidden');
        
        // Reload timesheet automatically to display update
        handleFetch();
    } catch (err) {
        console.error('Error submitting correction:', err);
        errorEl.innerText = err.message || 'Kayıt eklenirken bir hata oluştu.';
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-success text-white' : 'bg-danger text-white';
    
    toast.className = `${bgClass} px-5 py-3 rounded-lg shadow-md font-bold text-sm pointer-events-auto transition-opacity duration-300 opacity-100 flex items-center gap-2 mb-2`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✗'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
