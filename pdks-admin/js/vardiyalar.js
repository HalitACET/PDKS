let allShifts = [];

document.addEventListener('DOMContentLoaded', () => {
    loadShifts();

    // Create Shift Modal toggle
    const createModal = document.getElementById('create-modal');
    document.getElementById('open-modal-btn').addEventListener('click', () => {
        document.getElementById('create-shift-form').reset();
        document.getElementById('create-shift-warning').classList.add('hidden');
        document.getElementById('modal-error').classList.add('hidden');
        createModal.classList.remove('hidden');
    });

    const closeCreateModal = () => createModal.classList.add('hidden');
    document.getElementById('close-modal-btn').addEventListener('click', closeCreateModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeCreateModal);

    // Edit Shift Modal toggle
    const editModal = document.getElementById('edit-shift-modal');
    const closeEditModal = () => editModal.classList.add('hidden');
    document.getElementById('close-edit-modal-btn').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-modal-btn').addEventListener('click', closeEditModal);

    // Warn listeners for Create Form
    const startInput = document.getElementById('startTime');
    const endInput = document.getElementById('endTime');
    const checkWarning = () => {
        if (startInput.value && endInput.value && endInput.value < startInput.value) {
            document.getElementById('create-shift-warning').classList.remove('hidden');
        } else {
            document.getElementById('create-shift-warning').classList.add('hidden');
        }
    };
    startInput.addEventListener('input', checkWarning);
    endInput.addEventListener('input', checkWarning);

    // Warn listeners for Edit Form
    const editStartInput = document.getElementById('editStartTime');
    const editEndInput = document.getElementById('editEndTime');
    const checkEditWarning = () => {
        if (editStartInput.value && editEndInput.value && editEndInput.value < editStartInput.value) {
            document.getElementById('edit-shift-warning').classList.remove('hidden');
        } else {
            document.getElementById('edit-shift-warning').classList.add('hidden');
        }
    };
    editStartInput.addEventListener('input', checkEditWarning);
    editEndInput.addEventListener('input', checkEditWarning);

    // Bind Forms
    document.getElementById('create-shift-form').addEventListener('submit', handleCreateShift);
    document.getElementById('edit-shift-form').addEventListener('submit', handleEditShift);
});

async function loadShifts() {
    const loadingEl = document.getElementById('shifts-loading');
    const emptyEl = document.getElementById('shifts-empty');
    const grid = document.getElementById('shifts-grid');
    const countEl = document.getElementById('shifts-count-container');

    grid.innerHTML = '';
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    try {
        const shifts = await getShifts();
        allShifts = shifts || [];

        loadingEl.classList.add('hidden');

        if (allShifts.length === 0) {
            emptyEl.classList.remove('hidden');
            if (countEl) countEl.innerText = '0 vardiya';
            return;
        }

        allShifts.forEach(shift => {
            const isNight = isNightShift(shift.startTime, shift.endTime);
            const timeRangeText = `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`;
            
            const card = document.createElement('div');
            card.className = 'bg-white border border-[#E0DDD5] rounded-xl p-6 shadow-sm flex flex-col justify-between';

            const activeBadge = shift.active
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Pasif</span>';

            const nightBadge = isNight
                ? '<span class="inline-flex items-center ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 tracking-wide">+1 Rozeti</span>'
                : '';

            const toggleBtnText = shift.active ? 'Pasife Al' : 'Aktife Al';
            const toggleBtnClass = shift.active
                ? 'text-danger hover:text-red-700'
                : 'text-success hover:text-green-700';

            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold text-lg text-dark">${shift.name}</h4>
                        ${activeBadge}
                    </div>
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between text-sm text-[#7A7872] font-semibold">
                            <span>Vardiya Saatleri:</span>
                            <span class="text-dark font-mono font-bold">${timeRangeText}${nightBadge}</span>
                        </div>
                        <div class="flex justify-between text-sm text-[#7A7872]">
                            <span>Mola Süresi:</span>
                            <span class="text-dark font-semibold">${shift.breakMinutes} dk</span>
                        </div>
                        <div class="flex justify-between text-sm text-[#7A7872]">
                            <span>Geç Kalma Toleransı:</span>
                            <span class="text-dark font-semibold">${shift.lateToleranceMinutes} dk</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-between border-t border-[#F2F0EB] pt-4 mt-2">
                    <button class="border border-[#E0DDD5] hover:bg-bg text-dark font-bold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm"
                            onclick="openEditShiftModal(${shift.id})">
                        DÜZENLE
                    </button>
                    <button class="${toggleBtnClass} font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                            onclick="toggleShiftActive(${shift.id}, ${shift.active})">
                        ${toggleBtnText}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        if (countEl) {
            countEl.innerText = `${allShifts.length} vardiya`;
        }
    } catch (err) {
        console.error('Error loading shifts:', err);
        loadingEl.classList.add('hidden');
        showToast('Vardiyalar yüklenemedi.', 'error');
    }
}

function isNightShift(start, end) {
    if (!start || !end) return false;
    return end < start;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    // Format "08:00:00" to "08:00"
    return timeStr.substring(0, 5);
}

async function handleCreateShift(e) {
    e.preventDefault();

    const name = document.getElementById('shiftName').value.trim();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const breakMinutes = parseInt(document.getElementById('breakMinutes').value);
    const lateToleranceMinutes = parseInt(document.getElementById('lateTolerance').value);

    const errorEl = document.getElementById('modal-error');
    const saveBtn = document.getElementById('save-shift-btn');
    const spinner = document.getElementById('save-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await createShift({
            name,
            startTime,
            endTime,
            breakMinutes,
            lateToleranceMinutes
        });

        showToast('Vardiya başarıyla oluşturuldu.', 'success');
        document.getElementById('create-modal').classList.add('hidden');
        loadShifts();
    } catch (err) {
        console.error('Error creating shift:', err);
        errorEl.innerText = err.message || 'Vardiya oluşturulurken bir hata oluştu.';
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function openEditShiftModal(id) {
    const shift = allShifts.find(s => s.id === id);
    if (!shift) return;

    document.getElementById('editShiftId').value = shift.id;
    document.getElementById('editShiftName').value = shift.name;
    document.getElementById('editStartTime').value = formatTime(shift.startTime);
    document.getElementById('editEndTime').value = formatTime(shift.endTime);
    document.getElementById('editBreakMinutes').value = shift.breakMinutes;
    document.getElementById('editLateTolerance').value = shift.lateToleranceMinutes;

    // Check warning on open
    const warnEl = document.getElementById('edit-shift-warning');
    if (formatTime(shift.endTime) < formatTime(shift.startTime)) {
        warnEl.classList.remove('hidden');
    } else {
        warnEl.classList.add('hidden');
    }

    document.getElementById('edit-modal-error').classList.add('hidden');
    document.getElementById('edit-shift-modal').classList.remove('hidden');
}

async function handleEditShift(e) {
    e.preventDefault();

    const id = document.getElementById('editShiftId').value;
    const name = document.getElementById('editShiftName').value.trim();
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const breakMinutes = parseInt(document.getElementById('editBreakMinutes').value);
    const lateToleranceMinutes = parseInt(document.getElementById('editLateTolerance').value);

    const errorEl = document.getElementById('edit-modal-error');
    const saveBtn = document.getElementById('save-edit-shift-btn');
    const spinner = document.getElementById('edit-save-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await updateShift(id, {
            name,
            startTime,
            endTime,
            breakMinutes,
            lateToleranceMinutes
        });

        showToast('Vardiya başarıyla güncellendi.', 'success');
        document.getElementById('edit-shift-modal').classList.add('hidden');
        loadShifts();
    } catch (err) {
        console.error('Error updating shift:', err);
        errorEl.innerText = err.message || 'Vardiya güncellenirken bir hata oluştu.';
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

async function toggleShiftActive(id, currentStatus) {
    const actionText = currentStatus ? 'pasif' : 'aktif';
    const ok = confirm(`Vardiyayı ${actionText} duruma getirmek istediğinize emin misiniz?`);
    if (!ok) return;

    try {
        await updateShiftStatus(id, !currentStatus);
        showToast(`Vardiya başarıyla ${actionText} yapıldı.`, 'success');
        loadShifts();
    } catch (err) {
        console.error('Error changing shift status:', err);
        showToast('Vardiya durumu güncellenemedi.', 'error');
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 bg-white border border-[#E0DDD5] rounded-xl px-4 py-3 shadow-lg pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300 max-w-sm`;
    
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `
        <span class="text-lg">${icon}</span>
        <span class="text-sm font-semibold text-dark">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Autohide
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
