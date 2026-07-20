document.addEventListener('DOMContentLoaded', () => {
    // 1. Enforce authentication immediately
    requireAuth();

    // 2. Load layout structures
    injectSidebar();
    injectTopbar();
});

function injectSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';

    const menuItems = [
        { name: 'Dashboard', file: 'dashboard.html', aliases: [], icon: '⚡' },
        { name: 'Personel', file: 'users.html', aliases: ['personel.html'], icon: '👤' },
        { name: 'Cihazlar', file: 'devices.html', aliases: ['cihazlar.html'], icon: '📱' },
        { name: 'Geçiş Kayıtları', file: 'transactions.html', aliases: ['gecisler.html'], icon: '📋' },
        { name: 'Puantaj', file: 'timesheet.html', aliases: ['puantaj.html'], icon: '📊' },
        { name: 'Şüpheli Denemeler', file: 'suspicious.html', aliases: ['supheli.html'], icon: '⚠️' },
        { name: 'Vardiyalar', file: 'shifts.html', aliases: ['vardiyalar.html'], icon: '⏰' },
        { name: 'Lokasyonlar', file: 'locations.html', aliases: ['lokasyonlar.html'], icon: '📍' }
    ];

    let menuHtml = '';
    menuItems.forEach(item => {
        const isActive = (currentFile === item.file || item.aliases.includes(currentFile)) ? 'active' : '';
        menuHtml += `
            <li class="sidebar-menu-item ${isActive}">
                <a href="${item.file}">
                    <span class="mr-3 text-lg">${item.icon}</span>
                    <span>${item.name}</span>
                </a>
            </li>
        `;
    });

    sidebarContainer.innerHTML = `
        <aside class="sidebar">
            <div class="sidebar-brand">
                <div class="sidebar-logo">SS</div>
                <h1 class="sidebar-title">PDKS Admin</h1>
            </div>
            <ul class="sidebar-menu">
                ${menuHtml}
            </ul>
        </aside>
    `;
}

function injectTopbar() {
    const topbarContainer = document.getElementById('topbar-container');
    if (!topbarContainer) return;

    const fullName = sessionStorage.getItem('pdks_fullName') || 'Yönetici';

    topbarContainer.innerHTML = `
        <div class="topbar-user ml-auto">
            <span class="topbar-username">👤 ${fullName}</span>
            <a class="topbar-logout" id="logout-btn">Çıkış Yap</a>
        </div>
    `;

    // Bind logout button click
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}
