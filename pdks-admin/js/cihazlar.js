let allDevices = [];

document.addEventListener('DOMContentLoaded', () => {
    loadDevices();

    // Bind Search Input
    const searchInput = document.getElementById('device-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderDevices();
        });
    }
});

async function loadDevices() {
    const loadingEl = document.getElementById('devices-loading');
    const emptyEl = document.getElementById('devices-empty');
    const tbody = document.getElementById('devices-tbody');

    tbody.innerHTML = '';
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    try {
        const devices = await apiFetch('/admin/devices');
        allDevices = devices || [];
        loadingEl.classList.add('hidden');
        renderDevices();
    } catch (err) {
        console.error('Error loading devices:', err);
        loadingEl.classList.add('hidden');
        showToast('Cihaz listesi yüklenemedi.', 'error');
    }
}

function renderDevices() {
    const tbody = document.getElementById('devices-tbody');
    const emptyEl = document.getElementById('devices-empty');
    const countEl = document.getElementById('devices-count');
    const searchVal = document.getElementById('device-search').value.toLowerCase().trim();

    tbody.innerHTML = '';

    const filtered = allDevices.filter(dev => {
        const userMatch = dev.fullName ? dev.fullName.toLowerCase().includes(searchVal) : false;
        const usernameMatch = dev.username ? dev.username.toLowerCase().includes(searchVal) : false;
        const deviceMatch = dev.deviceName ? dev.deviceName.toLowerCase().includes(searchVal) : false;
        return userMatch || usernameMatch || deviceMatch;
    });

    if (filtered.length === 0) {
        emptyEl.classList.remove('hidden');
    } else {
        emptyEl.classList.add('hidden');
    }

    filtered.forEach(dev => {
        const row = document.createElement('tr');
        row.id = `device-row-${dev.username}`;

        const timeStr = formatDate(dev.registeredAt);
        const userStr = dev.fullName ? `${dev.fullName} (${dev.username})` : dev.username;
        
        // Shortened device UUID with hover title
        const fullId = dev.deviceId || '—';
        const shortId = fullId.length > 12 ? `${fullId.substring(0, 8)}...${fullId.slice(-4)}` : fullId;

        row.innerHTML = `
            <td class="font-semibold text-dark">${userStr}</td>
            <td class="text-dark font-medium">${dev.deviceName || 'Bilinmeyen Cihaz'}</td>
            <td class="font-mono text-xs text-[#7A7872] select-all cursor-help" title="${fullId}">${shortId}</td>
            <td class="text-xs text-[#7A7872]">${timeStr}</td>
            <td class="text-center">
                <button class="bg-danger hover:bg-[#C23F34] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors shadow-sm"
                        onclick="unbindDevice('${dev.username}', '${dev.fullName || dev.username}')">
                    SIFIRLA
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    if (countEl) {
        countEl.innerText = `${filtered.length} cihaz`;
    }
}

async function unbindDevice(username, displayName) {
    const ok = confirm(`${displayName} isimli personelin cihaz kaydı silinecek, personel yeni cihazla tekrar eşleşebilecek. Emin misiniz?`);
    if (!ok) return;

    try {
        const firmId = getFirmIdFromToken();
        await apiFetch('/admin/device-unbind', {
            method: 'POST',
            body: {
                firmId,
                username
            }
        });

        showToast('Cihaz kaydı başarıyla silindi.', 'success');
        
        // Remove from local cache and re-render
        allDevices = allDevices.filter(d => d.username !== username);
        renderDevices();
    } catch (err) {
        console.error('Error unbinding device:', err);
        showToast('Cihaz kaydı silinemedi: ' + err.message, 'error');
    }
}

function formatDate(isoString) {
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
