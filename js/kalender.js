// ==========================================
// FILE 9: KALENDER.JS (SISTEM KALENDER & HIJRIAH)
// ==========================================

// Lacak tahun kalender saat ini (Halaman Kalender 12 Bulan)
let currentKalenderYear = new Date().getFullYear();

// Fungsi untuk maju/mundur tahun kalender
function changeKalenderYear(offset) {
    currentKalenderYear += offset;
    renderKalender();
}

// Fungsi Bantuan: Mengubah angka Latin ke angka Arab (Timur)
function toArabicNumeral(str) {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(str).replace(/[0-9]/g, function(w) {
        return arabicNumbers[+w];
    });
}

// Fungsi Bantuan: Mengubah kode warna HEX (#FFFFFF) menjadi RGBA untuk efek transparansi background
function hexToRgba(hex, alpha) {
    let r = 239, g = 68, b = 68; // Default merah Tailwind (red-500)
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        let c = hex.substring(1).split('');
        if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x' + c.join('');
        r = (c >> 16) & 255;
        g = (c >> 8) & 255;
        b = c & 255;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// =================================================================
// FUNGSI 1: RENDER KALENDER 12 BULAN (HALAMAN KALENDER PENDIDIKAN)
// =================================================================
function renderKalender() {
    const grid12 = document.getElementById('kalender-12-months-grid');
    const yearLabel = document.getElementById('kalender-year-label');
    
    if (!grid12 || !yearLabel) return;

    // Tulis label tahun di header
    yearLabel.textContent = currentKalenderYear;
    // Bersihkan grid 12 bulan sebelumnya
    grid12.innerHTML = '';

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const agendas = appData.kalender || [];
    const tasks = appData.tugas || [];
    const isAdminOrKurikulum = currentUser && (currentUser.role === 'admin' || (currentUser.jabatan && (currentUser.jabatan.includes('Tata Usaha') || currentUser.jabatan.includes('Kurikulum') || currentUser.jabatan.includes('Yayasan') || currentUser.jabatan.includes('RAY'))));

    let allMonthsHTML = '';

    // Loop 12 Kali untuk Membangun 12 Bulan
    for (let m = 0; m < 12; m++) {
        const firstDay = new Date(currentKalenderYear, m, 1).getDay();
        const daysInMonth = new Date(currentKalenderYear, m + 1, 0).getDate();

        // Cari irisan nama bulan Hijriah di awal dan akhir bulan Masehi
        let startHijriMonth = '';
        let endHijriMonth = '';
        try {
            const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { month: 'long' });
            startHijriMonth = hijriFormatter.format(new Date(currentKalenderYear, m, 1));
            endHijriMonth = hijriFormatter.format(new Date(currentKalenderYear, m, daysInMonth));
        } catch(e) {
            startHijriMonth = 'Hijriah';
            endHijriMonth = '';
        }

        let rightMonthLabel = (startHijriMonth !== endHijriMonth) ? endHijriMonth : '';

        // Kerangka Kartu Bulan
        let monthHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-max hover:shadow-md transition-shadow pb-2">
                <div class="bg-teal-600 dark:bg-teal-700 text-white flex justify-between items-center py-2 px-3 rounded-t-xl">
                    <span class="text-[9px] sm:text-[10px] font-medium opacity-90 truncate max-w-[30%] text-left">${startHijriMonth}</span>
                    <span class="font-black tracking-wider text-sm sm:text-base shrink-0 mx-2">${monthNames[m].toUpperCase()}</span>
                    <span class="text-[9px] sm:text-[10px] font-medium opacity-90 truncate max-w-[30%] text-right">${rightMonthLabel}</span>
                </div>
                <div class="p-2 sm:p-3 flex flex-col">
                    <div class="grid grid-cols-7 gap-1 mb-1 border-b border-slate-100 dark:border-slate-700 pb-1">
                        <div class="text-center font-bold text-[10px] sm:text-xs text-red-500">Ahad</div>
                        <div class="text-center font-bold text-[10px] sm:text-xs text-slate-500">Sen</div>
                        <div class="text-center font-bold text-[10px] sm:text-xs text-slate-500">Sel</div>
                        <div class="text-center font-bold text-[10px] sm:text-xs text-slate-500">Rab</div>
                        <div class="text-center font-bold text-[10px] sm:text-xs text-slate-500">Kam</div>
                        <div class="text-center font-bold text-[10px] sm:text-xs text-slate-500">Jum</div>
                        <div class="text-center font-bold text-[10px] sm:text-xs text-slate-500">Sab</div>
                    </div>
                    <div class="grid grid-cols-7 gap-1">
        `;

        for (let i = 0; i < firstDay; i++) {
            monthHTML += `<div class="p-1 min-h-[40px] sm:min-h-[50px]"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentKalenderYear, m, day);
            const dateStr = `${currentKalenderYear}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            
            let hijriDay = '';
            try {
                let numericHijri = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric' }).format(dateObj);
                hijriDay = toArabicNumeral(numericHijri);
            } catch(e) { hijriDay = ''; }

            let isToday = dateStr === todayStr;
            let isSunday = dateObj.getDay() === 0;

            let textClass = isSunday ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100 font-semibold';
            let bgStyle = '';
            let borderClass = isToday ? 'border-purple-500 border-2' : 'border-slate-200 dark:border-slate-700 border';
            let markersHTML = '';
            let tooltip = '';
            let hijriColorClass = 'text-teal-600 dark:text-teal-400';

            let activeAgenda = null;
            agendas.forEach(agenda => {
                const start = new Date(agenda.tanggalMulai);
                const end = agenda.tanggalSelesai ? new Date(agenda.tanggalSelesai) : new Date(start);
                start.setHours(0,0,0,0);
                end.setHours(23,59,59,999);

                if (dateObj >= start && dateObj <= end) {
                    activeAgenda = agenda;
                    let warnaHex = agenda.warna || '#ef4444'; 
                    
                    if (agenda.tipeAgenda === 'Libur') {
                        textClass = 'text-white font-black drop-shadow-md';
                        hijriColorClass = 'text-white opacity-90 drop-shadow-sm';
                        bgStyle = `background-color: ${warnaHex};`;
                        borderClass = 'border-transparent';
                        tooltip += `Libur: ${agenda.judulAgenda}\n`;
                    } else {
                        bgStyle = `background-color: ${hexToRgba(warnaHex, 0.15)}; border-color: ${warnaHex}; border-width: 2px;`;
                        textClass += ' font-bold';
                        tooltip += `${agenda.tipeAgenda}: ${agenda.judulAgenda}\n`;
                    }
                }
            });

            const tasksToday = tasks.filter(t => t.tenggat === dateStr && t.status !== 'Selesai');
            if (tasksToday.length > 0) {
                markersHTML += `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 absolute bottom-1 right-1 shadow-sm border border-white dark:border-slate-800" title="${tasksToday.length} Tugas"></span>`;
                tooltip += `${tasksToday.length} Tugas Deadline!\n`;
            }

            if (isToday) {
                markersHTML += `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 absolute top-1 right-1 shadow-sm border border-white dark:border-slate-800 animate-pulse" title="Hari Ini"></span>`;
                if (!activeAgenda) bgStyle = 'background-color: rgba(168, 85, 247, 0.1);'; 
            }

            let cursorClass = isAdminOrKurikulum ? 'cursor-pointer hover:scale-105 hover:z-10 hover:shadow-md transition-all duration-200' : 'cursor-default';
            let clickAction = isAdminOrKurikulum ? `onclick="openKalenderModal('${dateStr}')"` : '';

            monthHTML += `
                <div ${clickAction} 
                     class="p-1 rounded-md flex flex-col justify-center items-center relative ${borderClass} ${cursorClass} min-h-[45px] sm:min-h-[55px]"
                     style="${bgStyle}" title="${tooltip.trim()}">
                    <span class="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-bold font-serif ${hijriColorClass}">${hijriDay}</span>
                    <span class="text-xs sm:text-sm ${textClass} ${isToday ? 'scale-110' : ''} z-0 mt-1.5 sm:mt-2">${day}</span>
                    ${markersHTML}
                </div>
            `;
        }

        monthHTML += `</div></div></div>`;
        allMonthsHTML += monthHTML;
    }

    grid12.innerHTML = allMonthsHTML;
}


// =================================================================
// FUNGSI 2: RENDER KALENDER 1 BULAN (HALAMAN DASHBOARD BAWAH)
// =================================================================
function renderDashboardKalender() {
    const container = document.getElementById('dashboard-kalender-container');
    const label = document.getElementById('dashboard-kalender-month-label');
    
    if (!container || !label) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0 = Jan, 1 = Feb, dst
    
    const todayStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    label.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const agendas = appData.kalender || [];
    const tasks = appData.tugas || [];

    let html = `
        <div class="grid grid-cols-7 gap-1 sm:gap-2 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <div class="text-center font-bold text-[10px] sm:text-sm text-red-500">Ahad</div>
            <div class="text-center font-bold text-[10px] sm:text-sm text-slate-500">Sen</div>
            <div class="text-center font-bold text-[10px] sm:text-sm text-slate-500">Sel</div>
            <div class="text-center font-bold text-[10px] sm:text-sm text-slate-500">Rab</div>
            <div class="text-center font-bold text-[10px] sm:text-sm text-slate-500">Kam</div>
            <div class="text-center font-bold text-[10px] sm:text-sm text-slate-500">Jum</div>
            <div class="text-center font-bold text-[10px] sm:text-sm text-slate-500">Sab</div>
        </div>
        <div class="grid grid-cols-7 gap-1 sm:gap-2">
    `;

    // Kotak kosong awal
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="p-1 sm:p-2 min-h-[50px] sm:min-h-[70px]"></div>`;
    }

    // Loop cetak kotak hari
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(currentYear, currentMonth, day);
        const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        
        let hijriDay = '';
        try {
            let numericHijri = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric' }).format(dateObj);
            hijriDay = toArabicNumeral(numericHijri);
        } catch(e) { hijriDay = ''; }

        let isToday = dateStr === todayStr;
        let isSunday = dateObj.getDay() === 0; 

        let textClass = isSunday ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100 font-semibold';
        let bgStyle = '';
        let borderClass = isToday ? 'border-purple-500 border-2' : 'border-slate-200 dark:border-slate-700 border';
        let markersHTML = '';
        let tooltip = '';
        let hijriColorClass = 'text-teal-600 dark:text-teal-400';

        let activeAgenda = null;
        agendas.forEach(agenda => {
            const start = new Date(agenda.tanggalMulai);
            const end = agenda.tanggalSelesai ? new Date(agenda.tanggalSelesai) : new Date(start);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);

            if (dateObj >= start && dateObj <= end) {
                activeAgenda = agenda;
                let warnaHex = agenda.warna || '#ef4444'; 
                
                if (agenda.tipeAgenda === 'Libur') {
                    textClass = 'text-white font-black drop-shadow-md';
                    hijriColorClass = 'text-white opacity-90 drop-shadow-sm';
                    bgStyle = `background-color: ${warnaHex};`;
                    borderClass = 'border-transparent';
                    tooltip += `Libur: ${agenda.judulAgenda}\n`;
                } else {
                    bgStyle = `background-color: ${hexToRgba(warnaHex, 0.15)}; border-color: ${warnaHex}; border-width: 2px;`;
                    textClass += ' font-bold';
                    tooltip += `${agenda.tipeAgenda}: ${agenda.judulAgenda}\n`;
                }
            }
        });

        const tasksToday = tasks.filter(t => t.tenggat === dateStr && t.status !== 'Selesai');
        if (tasksToday.length > 0) {
            markersHTML += `<span class="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 absolute bottom-1 right-1 shadow-sm border border-white dark:border-slate-800" title="${tasksToday.length} Tugas"></span>`;
            tooltip += `${tasksToday.length} Tugas Deadline!\n`;
        }

        if (isToday) {
            markersHTML += `<span class="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 absolute top-1 right-1 shadow-sm border border-white dark:border-slate-800 animate-pulse" title="Hari Ini"></span>`;
            if (!activeAgenda) bgStyle = 'background-color: rgba(168, 85, 247, 0.1);'; 
        }

        html += `
            <div class="p-1 sm:p-2 rounded-lg flex flex-col justify-center items-center relative ${borderClass} cursor-default min-h-[50px] sm:min-h-[70px]"
                 style="${bgStyle}" title="${tooltip.trim()}">
                <span class="absolute top-0.5 left-1 text-[9px] sm:text-xs font-bold font-serif ${hijriColorClass}">${hijriDay}</span>
                <span class="text-sm sm:text-lg ${textClass} ${isToday ? 'scale-110' : ''} z-0 mt-2 sm:mt-3">${day}</span>
                ${markersHTML}
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Buka Modal untuk Input Agenda Baru / Edit
function openKalenderModal(tanggalKlik = null, itemJsonString = null) {
    document.getElementById('form-kalender').reset();
    document.getElementById('kalender-id').value = ''; 
    document.getElementById('kalender-warna').value = '#ef4444'; 

    if (tanggalKlik) document.getElementById('kalender-mulai').value = tanggalKlik;

    if (itemJsonString) {
        const unescapedString = String(itemJsonString).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const itemData = JSON.parse(unescapedString);
        
        document.getElementById('kalender-id').value = itemData.id || itemData.ID;
        document.getElementById('kalender-judul').value = itemData.judulAgenda;
        document.getElementById('kalender-mulai').value = itemData.tanggalMulai;
        document.getElementById('kalender-selesai').value = itemData.tanggalSelesai || '';
        document.getElementById('kalender-tipe').value = itemData.tipeAgenda;
        document.getElementById('kalender-warna').value = itemData.warna || '#ef4444';
    }
    toggleModal('modal-kalender');
}

// Submit Data Agenda Kalender ke Backend (CRUD Universal)
async function handleKalenderSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('btn-submit-kalender');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memproses...';
    submitBtn.disabled = true;

    const recordId = document.getElementById('kalender-id').value;
    const isUpdate = recordId !== '';
    const actionName = isUpdate ? 'crudUpdate' : 'crudCreate';

    const payloadData = {
        judulAgenda: document.getElementById('kalender-judul').value,
        tanggalMulai: document.getElementById('kalender-mulai').value,
        tanggalSelesai: document.getElementById('kalender-selesai').value, 
        tipeAgenda: document.getElementById('kalender-tipe').value,
        warna: document.getElementById('kalender-warna').value
    };

    const payloadWrapper = { sheetName: 'Akademik_Kalender', id: recordId, data: payloadData };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: actionName, payload: payloadWrapper })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            toggleModal('modal-kalender');
            await loadAppData(); 
            alert('Agenda kalender berhasil ' + (isUpdate ? 'diperbarui!' : 'ditambahkan!'));
        } else {
            alert('Gagal merekam ke database Google Sheets: ' + result.message);
        }
    } catch (error) {
        alert('Terjadi kesalahan koneksi internet.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}