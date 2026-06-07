// ==========================================
// FILE 4: RBAC.JS (AKSES & MATRIKS JABATAN)
// ==========================================

function getUserAllowedMenus() {
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
        const allMenus = MASTER_MENUS.map(m => m.id);
        allMenus.push('wewenang');
        allMenus.push('datamaster');
        return allMenus;
    }

    let allowedSets = new Set(['dashboard', 'profil', 'absensi', 'tugas', 'slip-gaji', 'klaim', 'kontak']);
    
    if (currentUser.jabatan) {
        const userRolesArray = currentUser.jabatan.split(',').map(role => role.trim());
        userRolesArray.forEach(roleName => {
            if (roleMatrix[roleName]) {
                roleMatrix[roleName].forEach(menuId => allowedSets.add(menuId));
            }
            if (roleName.toLowerCase().includes('tata usaha')) {
                allowedSets.add('datamaster');
            }
        });
    }

    return Array.from(allowedSets);
}

function applyRBAC() {
    if (!currentUser) return;

    const allowedMenus = getUserAllowedMenus();
    const desktopNavItems = document.querySelectorAll('#sidebar-menu-list .nav-item');
    
    desktopNavItems.forEach(item => {
        const menuId = item.getAttribute('data-menu');
        if (allowedMenus.includes(menuId)) item.classList.remove('hidden');
        else item.classList.add('hidden');
    });

    const isAdminOrTU = currentUser.role === 'admin' || (currentUser.jabatan && currentUser.jabatan.toLowerCase().includes('tata usaha'));
    
    if (isAdminOrTU) document.getElementById('label-nav-dashboard').textContent = "Dashboard Saya";
    else document.getElementById('label-nav-dashboard').textContent = "Dashboard Saya";

    const mobileMenuContainer = document.getElementById('mobile-menu-list');
    mobileMenuContainer.innerHTML = '';
    
    MASTER_MENUS.forEach(menu => {
        if (allowedMenus.includes(menu.id)) {
            const btn = document.createElement('button');
            btn.className = `nav-btn-mobile flex flex-col items-center justify-center min-w-[70px] h-full ${menu.color} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-lg mx-1`;
            btn.onclick = () => navigate(menu.id);
            btn.id = `nav-mobile-${menu.id}`;
            btn.innerHTML = `<i class="fa-solid ${menu.icon} text-lg mb-1"></i><span class="text-[10px] font-semibold">${menu.label}</span>`;
            mobileMenuContainer.appendChild(btn);
        }
    });

    if (allowedMenus.includes('datamaster')) {
        const btnDM = document.createElement('button');
        btnDM.className = `nav-btn-mobile flex flex-col items-center justify-center min-w-[70px] h-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-lg mx-1`;
        btnDM.onclick = () => navigate('datamaster');
        btnDM.id = `nav-mobile-datamaster`;
        btnDM.innerHTML = `<i class="fa-solid fa-database text-lg mb-1"></i><span class="text-[10px] font-semibold">Data</span>`;
        mobileMenuContainer.appendChild(btnDM);
    }

    if (allowedMenus.includes('wewenang')) {
        const btnAdmin = document.createElement('button');
        btnAdmin.className = `nav-btn-mobile flex flex-col items-center justify-center min-w-[70px] h-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg mx-1`;
        btnAdmin.onclick = () => navigate('wewenang');
        btnAdmin.id = `nav-mobile-wewenang`;
        btnAdmin.innerHTML = `<i class="fa-solid fa-user-lock text-lg mb-1"></i><span class="text-[10px] font-semibold">Akses</span>`;
        mobileMenuContainer.appendChild(btnAdmin);
    }

    // --- TOMBOL SYNC UNTUK MOBILE ---
    const btnSync = document.createElement('button');
    btnSync.className = `flex flex-col items-center justify-center min-w-[70px] h-full text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors rounded-lg mx-1`;
    btnSync.onclick = () => {
    if (typeof forceSyncSystem === "function") forceSyncSystem();
    else alert("Fungsi Sync belum dimuat sempurna. Coba refresh halaman.");
}; // Panggil fungsi sakti kita
    btnSync.innerHTML = `<i class="fa-solid fa-rotate text-lg mb-1"></i><span class="text-[10px] font-semibold">Sync</span>`;
    mobileMenuContainer.appendChild(btnSync);


    const btnLogout = document.createElement('button');
    btnLogout.className = `flex flex-col items-center justify-center min-w-[70px] h-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg mx-1`;
    btnLogout.onclick = handleLogout;
    btnLogout.innerHTML = `<i class="fa-solid fa-power-off text-lg mb-1"></i><span class="text-[10px] font-semibold">Keluar</span>`;
    mobileMenuContainer.appendChild(btnLogout);

    // KODE YANG BIKIN ERROR (getElementById admin-dashboard-widgets) SUDAH SAYA HAPUS DARI SINI
}

// KHUSUS MENU WEWENANG
let selectedRoleForEdit = null;

function renderWewenangPage() {
    const listContainer = document.getElementById('list-jabatan-wewenang');
    const checkboxContainer = document.getElementById('wewenang-checkboxes');
    
    // Safety check jika HTML wewenang belum termuat
    if (!listContainer || !checkboxContainer) return;

    listContainer.innerHTML = '';
    checkboxContainer.innerHTML = '';

    MASTER_MENUS.forEach(menu => {
        const isBasicMenu = ['dashboard', 'profil', 'absensi', 'tugas', 'slip-gaji', 'klaim', 'kontak'].includes(menu.id);
        const div = document.createElement('div');
        div.className = "flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600";
        div.innerHTML = `
            <input type="checkbox" id="chk-${menu.id}" value="${menu.id}" class="w-5 h-5 text-primary bg-white border-slate-300 rounded focus:ring-primary dark:border-slate-600 dark:bg-slate-800" ${isBasicMenu ? 'checked disabled' : ''}>
            <label for="chk-${menu.id}" class="ml-3 text-sm font-semibold flex items-center cursor-pointer">
                <i class="fa-solid ${menu.icon} ${menu.color} mr-2 w-5 text-center"></i> ${menu.label}
            </label>
        `;
        checkboxContainer.appendChild(div);
    });

    Object.keys(roleMatrix).forEach(jabatan => {
        const li = document.createElement('li');
        li.className = "p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600 rounded border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors flex justify-between items-center";
        li.onclick = () => selectJabatanForEdit(jabatan, li);
        li.innerHTML = `<span class="font-bold text-sm">${escapeHTML(jabatan)}</span><i class="fa-solid fa-chevron-right text-slate-400 text-xs"></i>`;
        listContainer.appendChild(li);
    });
}

function selectJabatanForEdit(jabatan, elementHtml) {
    selectedRoleForEdit = jabatan;
    document.getElementById('label-jabatan-terpilih').textContent = jabatan;
    document.getElementById('btn-simpan-wewenang').disabled = false;

    const allList = document.querySelectorAll('#list-jabatan-wewenang li');
    allList.forEach(li => li.classList.remove('border-primary', 'bg-indigo-50', 'dark:bg-indigo-900/30'));
    elementHtml.classList.add('border-primary', 'bg-indigo-50', 'dark:bg-indigo-900/30');

    const currentAkses = roleMatrix[jabatan] || [];
    MASTER_MENUS.forEach(menu => {
        const chk = document.getElementById(`chk-${menu.id}`);
        if (chk && !chk.disabled) chk.checked = currentAkses.includes(menu.id);
    });
}

function simpanWewenang() {
    if (!selectedRoleForEdit) return;

    const newAkses = [];
    MASTER_MENUS.forEach(menu => {
        const chk = document.getElementById(`chk-${menu.id}`);
        if (chk && (chk.checked || chk.disabled)) newAkses.push(menu.id);
    });

    roleMatrix[selectedRoleForEdit] = newAkses;
    localStorage.setItem('portal_wewenang_matrix', JSON.stringify(roleMatrix));

    const btn = document.getElementById('btn-simpan-wewenang');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Disimpan!';
    btn.classList.replace('bg-primary', 'bg-green-500');
    
    applyRBAC();

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.replace('bg-green-500', 'bg-primary');
    }, 2000);
}