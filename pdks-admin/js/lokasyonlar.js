let allLocations = [];

document.addEventListener('DOMContentLoaded', () => {
    loadLocations();

    // Bind Search Box
    const searchInput = document.getElementById('location-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderLocations();
        });
    }

    // Bind Create Modal Toggle buttons
    const createModal = document.getElementById('create-modal');
    document.getElementById('open-modal-btn').addEventListener('click', () => {
        document.getElementById('create-location-form').reset();
        document.getElementById('modal-error').classList.add('hidden');
        createModal.classList.remove('hidden');
    });

    const closeCreateModal = () => createModal.classList.add('hidden');
    document.getElementById('close-modal-btn').addEventListener('click', closeCreateModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeCreateModal);

    // Bind Create Location Form Submit
    document.getElementById('create-location-form').addEventListener('submit', handleCreateLocation);

    // Bind Edit Modal Toggle buttons
    const editModal = document.getElementById('edit-modal');
    const closeEditModal = () => editModal.classList.add('hidden');
    document.getElementById('close-edit-modal-btn').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-modal-btn').addEventListener('click', closeEditModal);

    // Bind Edit Location Form Submit
    document.getElementById('edit-location-form').addEventListener('submit', handleEditLocation);

    // Bind QR Modal close
    const qrModal = document.getElementById('qr-modal');
    const closeQrModal = () => qrModal.classList.add('hidden');
    document.getElementById('close-qr-btn').addEventListener('click', closeQrModal);
    document.getElementById('close-qr-bottom-btn').addEventListener('click', closeQrModal);

    // Bind Print Button
    document.getElementById('print-qr-btn').addEventListener('click', () => {
        window.print();
    });
});

async function loadLocations() {
    const loadingEl = document.getElementById('locations-loading');
    const emptyEl = document.getElementById('locations-empty');
    const gridEl = document.getElementById('locations-grid');

    gridEl.innerHTML = '';
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    try {
        const locations = await apiFetch('/admin/locations');
        allLocations = locations || [];
        loadingEl.classList.add('hidden');
        renderLocations();
    } catch (err) {
        console.error('Error loading locations:', err);
        loadingEl.classList.add('hidden');
        showToast('Lokasyon listesi yüklenemedi.', 'error');
    }
}

function renderLocations() {
    const gridEl = document.getElementById('locations-grid');
    const emptyEl = document.getElementById('locations-empty');
    const countEl = document.getElementById('locations-count-container');
    const searchVal = document.getElementById('location-search').value.toLowerCase().trim();

    gridEl.innerHTML = '';

    const filtered = allLocations.filter(loc => 
        loc.name.toLowerCase().includes(searchVal) || 
        loc.code.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        emptyEl.classList.remove('hidden');
    } else {
        emptyEl.classList.add('hidden');
    }

    filtered.forEach(loc => {
        const card = document.createElement('div');
        // Soluk class if not active
        const opacityClass = loc.active ? '' : 'opacity-60 grayscale-[20%]';
        card.className = `bg-white border border-[#E0DDD5] rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all ${opacityClass}`;

        const statusBadge = loc.active 
            ? `<span class="px-2 py-0.5 text-[10px] font-bold bg-green-50 text-success rounded-full border border-green-200">AKTİF</span>`
            : `<span class="px-2 py-0.5 text-[10px] font-bold bg-gray-50 text-[#7A7872] rounded-full border border-gray-200">PASİF</span>`;

        const statusAction = loc.active
            ? `<a class="text-xs font-bold text-danger hover:underline cursor-pointer" onclick="toggleLocationStatus(${loc.id}, true, '${loc.name}')">Pasife Al</a>`
            : `<a class="text-xs font-bold text-success hover:underline cursor-pointer" onclick="toggleLocationStatus(${loc.id}, false, '${loc.name}')">Aktifleştir</a>`;

        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between gap-4 mb-3">
                    <div>
                        <h3 class="font-bold text-dark text-base leading-tight">${loc.name}</h3>
                        <span class="inline-block mt-1 text-[11px] font-mono font-semibold text-[#7A7872]">${loc.code}</span>
                    </div>
                    <div class="flex flex-col items-end gap-1.5">
                        ${statusBadge}
                        ${statusAction}
                    </div>
                </div>
                <div class="space-y-2 mt-4">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-[#7A7872] font-semibold">Koordinat</span>
                        <span class="font-mono text-dark">${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-[#7A7872] font-semibold">Yarıçap</span>
                        <span class="font-bold text-dark">${loc.radiusMeters} metre</span>
                    </div>
                </div>
            </div>
            <div class="mt-6 pt-4 border-t border-[#E0DDD5] flex gap-3">
                <button class="flex-1 border border-[#E0DDD5] hover:bg-bg text-dark font-bold text-xs py-2.5 rounded-lg transition-colors"
                        onclick="openEditModal(${loc.id})">
                    DÜZENLE
                </button>
                <button class="flex-1 bg-primary hover:bg-[#E5A700] text-dark font-bold text-xs py-2.5 rounded-lg transition-colors shadow-sm"
                        onclick="showQrCode('${loc.code}', '${loc.name}')">
                    QR GÖSTER
                </button>
            </div>
        `;
        gridEl.appendChild(card);
    });

    countEl.innerText = `${filtered.length} lokasyon`;
}

async function handleCreateLocation(e) {
    e.preventDefault();

    const code = document.getElementById('locCode').value.trim();
    const name = document.getElementById('locName').value.trim();
    const latitude = parseFloat(document.getElementById('locLat').value);
    const longitude = parseFloat(document.getElementById('locLon').value);
    const radiusMeters = parseInt(document.getElementById('locRadius').value);

    const errorEl = document.getElementById('modal-error');
    const saveBtn = document.getElementById('save-location-btn');
    const spinner = document.getElementById('save-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await apiFetch('/admin/locations', {
            method: 'POST',
            body: {
                code,
                name,
                latitude,
                longitude,
                radiusMeters
            }
        });

        showToast('Lokasyon başarıyla oluşturuldu.', 'success');
        
        document.getElementById('create-modal').classList.add('hidden');
        document.getElementById('create-location-form').reset();
        loadLocations();

    } catch (err) {
        console.error('Error creating location:', err);
        let msg = err.message || 'Lokasyon oluşturulurken bir hata oluştu.';
        if (msg.includes('kod ile bir konum zaten mevcut') || msg.includes('mevcut')) {
            msg = 'Bu kod ile bir konum zaten mevcut.';
        }
        errorEl.innerText = msg;
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function openEditModal(id) {
    const loc = allLocations.find(l => l.id === id);
    if (!loc) return;

    document.getElementById('editLocId').value = loc.id;
    document.getElementById('editLocCode').value = loc.code;
    document.getElementById('editLocName').value = loc.name;
    document.getElementById('editLocLat').value = loc.latitude;
    document.getElementById('editLocLon').value = loc.longitude;
    document.getElementById('editLocRadius').value = loc.radiusMeters;

    document.getElementById('edit-modal-error').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('hidden');
}

async function handleEditLocation(e) {
    e.preventDefault();

    const id = document.getElementById('editLocId').value;
    const code = document.getElementById('editLocCode').value.trim();
    const name = document.getElementById('editLocName').value.trim();
    const latitude = parseFloat(document.getElementById('editLocLat').value);
    const longitude = parseFloat(document.getElementById('editLocLon').value);
    const radiusMeters = parseInt(document.getElementById('editLocRadius').value);

    const errorEl = document.getElementById('edit-modal-error');
    const saveBtn = document.getElementById('edit-save-location-btn');
    const spinner = document.getElementById('edit-save-spinner');

    errorEl.classList.add('hidden');
    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        await updateLocation(id, {
            code,
            name,
            latitude,
            longitude,
            radiusMeters
        });

        showToast('Lokasyon başarıyla güncellendi.', 'success');
        document.getElementById('edit-modal').classList.add('hidden');
        loadLocations();

    } catch (err) {
        console.error('Error updating location:', err);
        let msg = err.message || 'Lokasyon güncellenirken bir hata oluştu.';
        if (msg.includes('kod ile bir konum zaten mevcut') || msg.includes('mevcut')) {
            msg = 'Bu kod ile bir konum zaten mevcut.';
        }
        errorEl.innerText = msg;
        errorEl.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

async function toggleLocationStatus(id, currentActive, name) {
    const actionText = currentActive ? 'pasife almak' : 'aktifleştirmek';
    if (!confirm(`"${name}" lokasyonunu ${actionText} istediğinize emin misiniz?`)) {
        return;
    }

    try {
        await updateLocationStatus(id, !currentActive);
        showToast('Lokasyon durumu güncellendi.', 'success');
        loadLocations();
    } catch (err) {
        console.error('Error toggling location status:', err);
        showToast('Durum güncellenirken hata oluştu: ' + err.message, 'error');
    }
}

function showQrCode(code, name) {
    const qrModal = document.getElementById('qr-modal');
    const qrBox = document.getElementById('qrcode-box');
    const qrTitle = document.getElementById('qr-title');
    const qrCodeText = document.getElementById('qr-code-text');

    qrTitle.innerText = name;
    qrCodeText.innerText = code;
    qrBox.innerHTML = '';

    const firmId = getFirmIdFromToken();
    const qrPayload = `PDKS:${firmId}:${code}`;

    new QRCode(qrBox, {
        text: qrPayload,
        width: 200,
        height: 200,
        colorDark : "#26262A",
        colorLight : "#FFFFFF",
        correctLevel : QRCode.CorrectLevel.M
    });

    qrModal.classList.remove('hidden');
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
