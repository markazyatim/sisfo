// ==========================================
// FILE 2: UTILS.JS (FUNGSI BANTUAN UI)
// ==========================================

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatHeaderToKey(headerStr) {
    return headerStr.toString().replace(/\s(.)/g, function(match, group1) { return group1.toUpperCase(); }).replace(/\s/g, '').replace(/^[A-Z]/, function(match) { return match.toLowerCase(); }).replace(/_/g, '');
}

function formatRupiah(angka) {
    if (isNaN(angka)) return angka; 
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.classList.contains('hidden')) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
}

function handleThemeChange(event) {
    const selectedTheme = event.target.value;
    const htmlElement = document.documentElement;

    htmlElement.classList.remove('dark', 'theme-standard', 'theme-man', 'theme-woman');

    if (selectedTheme === 'dark') htmlElement.classList.add('dark', 'theme-standard');
    else if (selectedTheme === 'light') htmlElement.classList.add('theme-standard');
    else htmlElement.classList.add(`theme-${selectedTheme}`);

    localStorage.setItem('dashboard-theme', selectedTheme);
}

// Memulai jam digital (Disesuaikan untuk SPA)
function initClock() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('id-ID', options);

        // Cari elemennya dulu
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');

        // PERBAIKAN: Hanya ubah textContent JIKA elemennya sedang dirender oleh Router
        if (timeEl) {
            timeEl.textContent = timeStr;
        }
        if (dateEl) {
            dateEl.textContent = dateStr;
        }
    }, 1000);
}

// ==========================================
// FITUR BARU: ANIMASI LOADING GLOBAL
// ==========================================
function showGlobalLoading(message = 'Sistem sedang memproses data...') {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-slate-900/80 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-300';
        loader.innerHTML = `
            <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center transform transition-all scale-100 animate-bounce-in max-w-sm w-[90%] text-center border border-slate-100 dark:border-slate-700">
                <div class="relative w-20 h-20 mb-4">
                    <div class="absolute inset-0 border-4 border-indigo-100 dark:border-slate-600 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <i class="fa-solid fa-cloud-arrow-up absolute inset-0 flex items-center justify-center text-primary text-xl animate-pulse"></i>
                </div>
                <h3 class="text-lg font-black text-slate-800 dark:text-white" id="global-loader-text">${message}</h3>
                <p class="text-xs text-slate-500 mt-2">Mohon tunggu dan jangan tutup halaman ini...</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        document.getElementById('global-loader-text').textContent = message;
        loader.classList.remove('hidden');
    }
}

function hideGlobalLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('hidden');
}

// DIPINDAHKAN KE SINI AGAR BISA DIPAKAI BERSAMA (DATAMASTER & AKADEMIK)
function createInputGroup(label, type, idSuffix, value = '', placeholder = '') {
    let valStr = value !== undefined && value !== null ? escapeHTML(String(value)) : '';
    return `
        <div>
            <label class="block text-sm font-bold mb-1">${label}</label>
            <input type="${type}" id="crud-${idSuffix}" value="${valStr}" placeholder="${placeholder}" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary">
        </div>
    `;
}