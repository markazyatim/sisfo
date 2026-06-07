// ==========================================
// FILE 10: ROUTER.JS (CLIENT-SIDE ROUTING SPA)
// Menangani perpindahan halaman tanpa refresh
// ==========================================

// Objek cache untuk menyimpan HTML yang sudah diunduh agar tidak perlu request internet berulang kali
const viewsCache = {};

// Fungsi asinkron untuk memuat file HTML ke dalam container
async function loadView(viewName) {
    // =======================================================
    // PERBAIKAN 2: PROTEKSI RBAC DI LEVEL ROUTER (KEAMANAN)
    // =======================================================
    if (typeof getUserAllowedMenus === 'function') {
        const allowedMenus = getUserAllowedMenus();
        // Dashboard dan Profil selalu diizinkan. Selain itu, cek matriks.
        if (viewName !== 'dashboard' && viewName !== 'profil' && !allowedMenus.includes(viewName)) {
            if (typeof ModernUI !== 'undefined') ModernUI.alert('Akses Ditolak', 'Anda tidak memiliki wewenang untuk membuka modul ini.', 'error');
            else alert('Akses Ditolak!');
            navigate('dashboard'); // Tendang ke dashboard
            return;
        }
    }

    const container = document.getElementById('view-container');
    
    container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-slate-400 w-full pt-20">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-primary"></i>
            <p class="font-semibold">Memuat Modul ${viewName}...</p>
        </div>
    `;

    try {
        let html = '';
        if (viewsCache[viewName]) {
            html = viewsCache[viewName];
        } else {
            const response = await fetch(`views/${viewName}.html`);
            if (!response.ok) throw new Error('File view tidak ditemukan.');
            html = await response.text();
            viewsCache[viewName] = html;
        }

        container.innerHTML = html;

        if (viewName === 'dashboard') {
            if (typeof renderDashboardManager === "function") renderDashboardManager();
            if (typeof renderDashboardKalender === "function") renderDashboardKalender();
        } else if (viewName === 'profil') {
            if (typeof renderProfilCV === "function") renderProfilCV();
        } else if (viewName === 'kalender') {
            if (typeof renderKalender === "function") renderKalender();
        } else if (viewName === 'absensi') {
            if (typeof initAbsensiPage === "function") setTimeout(initAbsensiPage, 100); 
        } else if (viewName === 'tugas') {
            if (typeof renderTugas === "function") renderTugas();
        } else if (viewName === 'slip-gaji') {
            if (typeof initUserSlipGaji === "function") setTimeout(initUserSlipGaji, 100); 
        } else if (viewName === 'klaim') {
            if (typeof renderTabel === "function") renderTabel('klaim');
        } else if (viewName === 'kontak') {
            if (typeof renderKontak === "function") renderKontak();
        } else if (viewName === 'akademik') {
            if (typeof renderAkademikData === "function") renderAkademikData();
        } else if (viewName === 'datamaster') {
            if (typeof renderDataMasterTable === "function") renderDataMasterTable();
        } else if (viewName === 'wewenang') {
            if (typeof renderWewenangPage === "function") renderWewenangPage();
        } else if (viewName === 'jurnal') {
            if (typeof renderJurnalPage === "function") renderJurnalPage();
        } else if (viewName === 'keuangan') {
            if (typeof renderKeuanganPage === "function") renderKeuanganPage();
        } else if (viewName === 'sarpras') {
            if (typeof renderSarprasPage === "function") renderSarprasPage();
        } else if (viewName === 'payroll') {
            if (typeof initPayrollPage === "function") setTimeout(initPayrollPage, 100);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-red-500 w-full pt-20">
                <i class="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
                <p class="font-semibold">Gagal memuat modul. Pastikan file views/${viewName}.html ada.</p>
            </div>
        `;
    }
}

function navigate(moduleName) {
    const titles = {
        'dashboard': 'Dashboard Utama',
        'profil': 'Profil Saya & CV',
        'kalender': 'Kalender Pendidikan',
        'absensi': 'Kehadiran & Cuti',
        'tugas': 'Tugas & Target',
        'slip-gaji': 'Slip Gaji',
        'klaim': 'Klaim Operasional',
        'kontak': 'Direktori Kontak',
        'akademik': 'Sistem Informasi Akademik',
        'wewenang': 'Manajemen Wewenang',
        'datamaster': 'Data Master Yayasan',
        'arsip': 'Arsip & E-Office',
        'jurnal': 'Jurnal Pengasuhan',
        'keuangan': 'Keuangan & Kas',
        'sarpras': 'Aset & Sarpras',
        'payroll': 'Payroll & Honorarium'
    };
    
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.textContent = titles[moduleName] || 'Portal Internal';

    // =======================================================
    // PERBAIKAN 3: MEMUTUSKAN EVENT LISTENER GANDA
    // =======================================================
    if (moduleName !== 'akademik' && moduleName !== 'kalender') {
        const crudForm = document.getElementById('form-crud');
        if (crudForm) {
            // Teknik Clone Node: Menggandakan HTML murni tanpa membawa memori fungsi JavaScript lama
            const cleanForm = crudForm.cloneNode(true);
            crudForm.parentNode.replaceChild(cleanForm, crudForm);
            
            // Pasang fungsi baru ke form yang sudah bersih
            cleanForm.onsubmit = typeof handleCRUDSubmit !== 'undefined' ? handleCRUDSubmit : (e) => e.preventDefault();
        }
    }

    loadView(moduleName);

    if (typeof updateActiveNavigationStyles === 'function') {
        updateActiveNavigationStyles(moduleName);
    }
}

// Menimpa fungsi navigate lama menjadi sistem routing dinamis
function navigate(moduleName) {
    const titles = {
        'dashboard': 'Dashboard Utama',
        'profil': 'Profil Saya & CV',
        'kalender': 'Kalender Pendidikan',
        'absensi': 'Kehadiran & Cuti',
        'tugas': 'Tugas & Target',
        'slip-gaji': 'Slip Gaji',
        'klaim': 'Klaim Operasional',
        'kontak': 'Direktori Kontak',
        'akademik': 'Sistem Informasi Akademik',
        'wewenang': 'Manajemen Wewenang',
        'datamaster': 'Data Master Yayasan',
        'arsip': 'Arsip & E-Office',
        'jurnal': 'Jurnal Pengasuhan',
        'keuangan': 'Keuangan & Kas',
        'sarpras': 'Aset & Sarpras',
        'payroll': 'Payroll & Honorarium'
    };
    
    // PERBAIKAN: Gunakan pengaman (Anti-Crash) untuk mengubah judul halaman
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) {
        pageTitleEl.textContent = titles[moduleName] || 'Portal Internal';
    }

    // Kembalikan form event listener untuk menghindari konflik antar halaman
    if (moduleName !== 'akademik' && moduleName !== 'kalender') {
        const crudForm = document.getElementById('form-crud');
        if (crudForm) crudForm.onsubmit = typeof handleCRUDSubmit !== 'undefined' ? handleCRUDSubmit : (e)=>e.preventDefault();
    }

    // Muat file HTML komponen
    loadView(moduleName);

    // Update warna biru/abu pada tombol navigasi sidebar
    if (typeof updateActiveNavigationStyles === 'function') {
        updateActiveNavigationStyles(moduleName);
    }
}