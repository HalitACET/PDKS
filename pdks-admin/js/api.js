const API_BASE = 'http://localhost:8080';

/**
 * Perform login request
 * @param {string} firmId 
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<object>} login response data
 */
async function login(firmId, username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firmId: firmId,
            username: username,
            password: password,
            deviceId: 'ADMIN-PANEL'
        })
    });

    if (!response.ok) {
        let errMsg = 'Kullanıcı adı veya şifre hatalı.';
        try {
            const data = await response.json();
            if (data && data.message) {
                errMsg = data.message;
            }
        } catch(e) {}
        throw new Error(errMsg);
    }

    const data = await response.json();
    
    // Check if the user is indeed an ADMIN
    if (data.role !== 'ADMIN') {
        throw new Error('Bu panele yalnızca yönetici hesaplarıyla giriş yapılabilir.');
    }

    // Save credentials to sessionStorage
    sessionStorage.setItem('pdks_token', data.token);
    sessionStorage.setItem('pdks_fullName', data.fullName);
    sessionStorage.setItem('pdks_role', data.role);

    return data;
}

/**
 * Fetch wrapper that adds authentication bearer token header
 * @param {string} path 
 * @param {object} options 
 * @returns {Promise<any>}
 */
async function apiFetch(path, options = {}) {
    const token = sessionStorage.getItem('pdks_token');
    
    // Setup headers
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    // If options contains JSON body, ensure Content-Type is set
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    if (response.status === 401 || response.status === 403) {
        // Clear session and redirect to login page
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    if (!response.ok) {
        let errMsg = 'İşlem gerçekleştirilemedi.';
        try {
            const data = await response.json();
            if (data && data.message) {
                errMsg = data.message;
            }
        } catch(e) {}
        throw new Error(errMsg);
    }

    // For empty responses (like 204 No Content or status OK with no content)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    
    return null;
}

/**
 * Perform logout operation
 */
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

/**
 * Enforce authentication for protected dashboard pages
 */
function requireAuth() {
    const token = sessionStorage.getItem('pdks_token');
    const role = sessionStorage.getItem('pdks_role');
    if (!token || role !== 'ADMIN') {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// ─── Location API Helpers ───
async function updateLocation(id, data) {
    return await apiFetch(`/admin/locations/${id}`, {
        method: 'PUT',
        body: data
    });
}

async function updateLocationStatus(id, active) {
    return await apiFetch(`/admin/locations/${id}/status`, {
        method: 'PUT',
        body: { active }
    });
}

// ─── User API Helpers ───
async function updateUser(id, data) {
    return await apiFetch(`/admin/users/${id}`, {
        method: 'PUT',
        body: data
    });
}

async function resetUserPassword(id, password) {
    return await apiFetch(`/admin/users/${id}/reset-password`, {
        method: 'POST',
        body: { newPassword: password }
    });
}

// ─── Transactions Export ───
async function exportTransactions(username, startDate, endDate) {
    const token = sessionStorage.getItem('pdks_token');
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE}/admin/transactions/export?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    if (!response.ok) {
        throw new Error('Dışa aktarma başarısız oldu.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gecis-kayitlari.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

// ─── Shift API Helpers ───
async function getShifts() {
    return await apiFetch('/admin/shifts');
}

async function createShift(data) {
    return await apiFetch('/admin/shifts', {
        method: 'POST',
        body: data
    });
}

async function updateShift(id, data) {
    return await apiFetch(`/admin/shifts/${id}`, {
        method: 'PUT',
        body: data
    });
}

async function updateShiftStatus(id, active) {
    return await apiFetch(`/admin/shifts/${id}/status`, {
        method: 'PUT',
        body: { active }
    });
}

async function assignShiftToUser(userId, shiftId) {
    return await apiFetch(`/admin/users/${userId}/shift`, {
        method: 'PUT',
        body: { shiftId }
    });
}

// ─── Manual Transaction Helpers ───
async function createManualTransaction(data) {
    return await apiFetch('/admin/transactions/manual', {
        method: 'POST',
        body: data
    });
}

async function deleteTransaction(id, reason) {
    return await apiFetch(`/admin/transactions/${id}`, {
        method: 'DELETE',
        body: { reason }
    });
}

// ─── Timesheet API Helpers ───
async function getTimesheet(userId, year, month) {
    return await apiFetch(`/admin/timesheet?userId=${userId}&year=${year}&month=${month}`);
}

async function exportTimesheet(userId, username, year, month) {
    const token = sessionStorage.getItem('pdks_token');
    const response = await fetch(`${API_BASE}/admin/timesheet/export?userId=${userId}&year=${year}&month=${month}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    if (!response.ok) {
        throw new Error('Dışa aktarma başarısız oldu.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `puantaj-${username}-${year}-${month}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
