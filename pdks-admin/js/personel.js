let searchTimeout = null;
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Bind Search Input with Debounce (400ms)
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadUsers(searchInput.value.trim());
            }, 400);
        });
    }

    // Bind Create User Modal Toggle buttons
    const createModal = document.getElementById('create-modal');
    document.getElementById('open-modal-btn').addEventListener('click', () => {
        document.getElementById('create-user-form').reset();
        document.getElementById('modal-error').classList.add('hidden');
        createModal.classList.remove('hidden');
    });

    const closeCreateModal = () => createModal.classList.add('hidden');
    document.getElementById('close-modal-btn').addEventListener('click', closeCreateModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeCreateModal);

    // Bind Create Form Submit
    document.getElementById('create-user-form').addEventListener('submit', handleCreateUser);

    // Bind Edit Name Modal Toggle buttons
    const editModal = document.getElementById('edit-user-modal');
    const closeEditModal = () => editModal.classList.add('hidden');
    document.getElementById('close-edit-user-btn').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-user-btn').addEventListener('click', closeEditModal);

    // Bind Edit Form Submit
    document.getElementById('edit-user-form').addEventListener('submit', handleEditUser);

    // Bind Reset Password Modal Toggle buttons
    const resetModal = document.getElementById('reset-password-modal');
    const closeResetModal = () => resetModal.classList.add('hidden');
    document.getElementById('close-reset-pwd-btn').addEventListener('click', closeResetModal);
    document.getElementById('cancel-reset-pwd-btn').addEventListener('click', closeResetModal);

    // Bind Reset Password Form Submit
    document.getElementById('reset-password-form').addEventListener('submit', handleResetPwd);

    // Bind Assign Shift Modal Toggle buttons
    const assignShiftModal = document.getElementById('assign-shift-modal');
    const closeAssignShiftModal = () => assignShiftModal.classList.add('hidden');
    document.getElementById('close-assign-shift-btn').addEventListener('click', closeAssignShiftModal);
    document.getElementById('cancel-assign-shift-btn').addEventListener('click', closeAssignShiftModal);
    document.getElementById('assign-shift-form').addEventListener('submit', handleAssignShift);
});

async function loadUsers(searchQuery = '') {
    const loadingEl = document.getElementById('users-loading');
    const emptyEl = document.getElementById('users-empty');
    const tbody = document.getElementById('users-tbody');
    const countEl = document.getElementById('users-count');

    tbody.innerHTML = '';
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    try {
        let path = '/admin/users';
        if (searchQuery) {
            path += `?search=${encodeURIComponent(searchQuery)}`;
        }
        const users = await apiFetch(path);
        allUsers = users || [];

        loadingEl.classList.add('hidden');

        if (!users || users.length === 0) {
            emptyEl.classList.remove('hidden');
            if (countEl) countEl.innerText = '0 personel';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            
            // Role badge
            const roleBadge = user.role === 'ADMIN'
                ? '<span class="badge badge-warning">ADMIN</span>'
                : '<span class="badge badge-secondary">EMPLOYEE</span>';

            // Device state
            const deviceState = user.hasDevice
                ? '<span class="text-success font-semibold">● Bağlı</span>'
                : '<span class="text-[#7A7872]">—</span>';

            // Active badge
            const activeBadge = user.active
                ? '<span class="badge badge-success">AKTİF</span>'
                : '<span class="badge badge-danger">PASİF</span>';

            // Toggle Button Label/Color
            const actionBtnClass = user.active
                ? 'bg-danger hover:bg-[#C23F34] text-white'
                : 'bg-success hover:bg-[#25814A] text-white';
            const actionBtnText = user.active ? 'Pasife Al' : 'Aktife Al';

            // Safe String for click handlers
            const safeName = user.fullName.replace(/'/g, "\\'");

            row.innerHTML = `
                <td class="font-semibold text-dark">${user.fullName}</td>
                <td class="text-[#7A7872] font-mono">${user.username}</td>
                <td>${roleBadge}</td>
                <td class="text-sm font-semibold text-dark">${user.shiftName || '—'}</td>
                <td>${deviceState}</td>
                <td>${activeBadge}</td>
                <td>
                    <div class="flex items-center justify-center gap-2 flex-wrap">
                        <button class="border border-[#E0DDD5] hover:bg-bg text-dark font-bold text-xs px-2.5 py-1.5 rounded transition-colors shadow-sm"
                                onclick="openEditUserModal(${user.id}, '${safeName}')">
                            Düzenle
                        </button>
                        <button class="border border-[#E0DDD5] hover:bg-bg text-dark font-bold text-xs px-2.5 py-1.5 rounded transition-colors shadow-sm"
                                onclick="openAssignShiftModal(${user.id})">
                            Vardiya Ata
                        </button>
                        <button class="bg-primary hover:bg-[#E5A700] text-dark font-bold text-xs px-2.5 py-1.5 rounded transition-colors shadow-sm"
                                onclick="openResetPwdModal(${user.id})">
                            Şifre Sıfırla
                        </button>
                        <button class="${actionBtnClass} text-xs font-bold px-2.5 py-1.5 rounded transition-colors shadow-sm min-w-[76px]"
                                onclick="toggleUserStatus(${user.id}, ${user.active})">
                            ${actionBtnText}
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (countEl) {
            countEl.innerText = `${users.length} personel`;
        }

    } catch (err) {
        console.error('Error loading users:', err);
        loadingEl.classList.add('hidden');
        showToast('Personel listesi yüklenemedi.', 'error');
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const actionText = currentStatus ? 'pasif' : 'aktif';
    const ok = confirm(`Personeli ${actionText} duruma getirmek istediğinize emin misiniz?`);
    if (!ok) return;

    try {
        await apiFetch(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: { active: !currentStatus }
        });

        showToast(`Personel başarıyla ${actionText} yapıldı.`, 'success');
        
        const searchInput = document.getElementById('user-search');
        loadUsers(searchInput.value.trim());
    } catch (err) {
        console.error('Error toggling status:', err);
        showToast('Kullanıcı durumu güncellenemedi.', 'error');
    }
}

async function handleCreateUser(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const initialPassword = document.getElementById('initialPassword').value;
    const role = document.getElementById('role').value;
    
    const errorEl = document.getElementById('modal-error');
    const saveBtn = document.getElementById('save-user-btn');
    const spinner = document.getElementById('save-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        const firmId = getFirmIdFromToken();
        await apiFetch('/admin/users', {
            method: 'POST',
            body: {
                firmId,
                username,
                fullName,
                initialPassword,
                role
            }
        });

        showToast('Personel başarıyla oluşturuldu.', 'success');
        
        document.getElementById('create-modal').classList.add('hidden');
        document.getElementById('create-user-form').reset();
        
        const searchInput = document.getElementById('user-search');
        loadUsers(searchInput.value.trim());

    } catch (err) {
        console.error('Error creating user:', err);
        let msg = err.message || 'Kullanıcı oluşturulurken bir hata oluştu.';
        if (msg.includes('zaten kullanımda') || msg.includes('mevcut')) {
            msg = 'Bu kullanıcı adı zaten mevcut.';
        }
        errorEl.innerText = msg;
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function openEditUserModal(id, fullName) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editFullName').value = fullName;
    document.getElementById('edit-user-error').classList.add('hidden');
    document.getElementById('edit-user-modal').classList.remove('hidden');
}

async function handleEditUser(e) {
    e.preventDefault();

    const id = document.getElementById('editUserId').value;
    const fullName = document.getElementById('editFullName').value.trim();

    const errorEl = document.getElementById('edit-user-error');
    const saveBtn = document.getElementById('save-edit-user-btn');
    const spinner = document.getElementById('edit-user-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await updateUser(id, { fullName });
        showToast('Personel başarıyla güncellendi.', 'success');
        document.getElementById('edit-user-modal').classList.add('hidden');
        
        const searchInput = document.getElementById('user-search');
        loadUsers(searchInput.value.trim());
    } catch (err) {
        console.error('Error updating user:', err);
        errorEl.innerText = err.message || 'Personel güncellenirken hata oluştu.';
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function openResetPwdModal(id) {
    document.getElementById('resetPasswordUserId').value = id;
    document.getElementById('newPassword').value = '';
    document.getElementById('reset-pwd-error').classList.add('hidden');
    document.getElementById('reset-password-modal').classList.remove('hidden');
}

async function handleResetPwd(e) {
    e.preventDefault();

    const id = document.getElementById('resetPasswordUserId').value;
    const newPassword = document.getElementById('newPassword').value;

    const errorEl = document.getElementById('reset-pwd-error');
    const saveBtn = document.getElementById('save-reset-pwd-btn');
    const spinner = document.getElementById('reset-pwd-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await resetUserPassword(id, newPassword);
        showToast('Geçici şifre belirlendi, personel ilk girişte değiştirecek.', 'success');
        document.getElementById('reset-password-modal').classList.add('hidden');
    } catch (err) {
        console.error('Error resetting password:', err);
        errorEl.innerText = err.message || 'Şifre sıfırlanırken hata oluştu.';
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

function getFirmIdFromToken() {
    const token = sessionStorage.getItem('pdks_token');
    if (!token) return 'ATLAS01';
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.firmId || 'ATLAS01';
    } catch(e) {
        return 'ATLAS01';
    }
}

async function openAssignShiftModal(userId) {
    document.getElementById('assignShiftUserId').value = userId;
    document.getElementById('assign-shift-error').classList.add('hidden');

    const user = allUsers.find(u => u.id === userId);
    const shiftSelect = document.getElementById('shiftSelect');

    // Clear dynamic options (keep first option)
    shiftSelect.innerHTML = '<option value="">— Vardiya Atamasını Kaldır —</option>';

    try {
        const shifts = await getShifts();
        const activeShifts = (shifts || []).filter(s => s.active);

        activeShifts.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = `${s.name} (${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)})`;
            shiftSelect.appendChild(opt);
        });

        // Pre-select user's current shift
        if (user && user.shiftName) {
            const currentShift = (shifts || []).find(s => s.name === user.shiftName);
            if (currentShift) {
                shiftSelect.value = currentShift.id;
            }
        }

        document.getElementById('assign-shift-modal').classList.remove('hidden');
    } catch (err) {
        console.error('Error loading shifts for assignment:', err);
        showToast('Vardiyalar yüklenemedi.', 'error');
    }
}

async function handleAssignShift(e) {
    e.preventDefault();

    const userId = document.getElementById('assignShiftUserId').value;
    const shiftIdVal = document.getElementById('shiftSelect').value;
    const shiftId = shiftIdVal ? parseInt(shiftIdVal) : null;

    const errorEl = document.getElementById('assign-shift-error');
    const saveBtn = document.getElementById('save-assign-shift-btn');
    const spinner = document.getElementById('assign-shift-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await assignShiftToUser(userId, shiftId);
        showToast('Vardiya ataması güncellendi.', 'success');
        document.getElementById('assign-shift-modal').classList.add('hidden');
        
        const searchInput = document.getElementById('user-search');
        loadUsers(searchInput.value.trim());
    } catch (err) {
        console.error('Error assigning shift:', err);
        errorEl.innerText = err.message || 'Vardiya atanırken hata oluştu.';
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}
