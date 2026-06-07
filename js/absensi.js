// ==========================================================================
// FILE: ABSENSI.JS (SISTEM ABSENSI CERDAS, JURNAL GURU, & LOGIKA SEDERHANA)
// ==========================================================================

// Fungsi Helper untuk Format Tanggal Lokal (WIB) Saat Kirim Data
function getLocalDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function initAbsensiPage() {
    const selector = document.getElementById('absensi-jabatan-selector');
    if (selector && currentUser.jabatan) {
        const jabatans = currentUser.jabatan.split(',').map(j => j.trim()).filter(j => j !== '');
        selector.innerHTML = '';
        if (jabatans.length > 1) {
            selector.classList.remove('hidden');
            jabatans.forEach(jab => { 
                selector.innerHTML += `<option value="${jab.replace(/"/g, '&quot;')}">Absen Sebagai: ${escapeHTML(jab)}</option>`; 
            });
            selector.onchange = () => { renderDynamicAbsensiUI(); renderRiwayatAbsensi(); };
        } else {
            selector.classList.add('hidden');
            selector.innerHTML = `<option value="${escapeHTML(jabatans[0] || 'Umum')}">${escapeHTML(jabatans[0] || 'Umum')}</option>`;
        }
    }

    const filterBulan = document.getElementById('filter-bulan-absensi');
    if (filterBulan && !filterBulan.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        filterBulan.value = `${yyyy}-${mm}`;
    }
    if (filterBulan) filterBulan.onchange = () => renderRiwayatAbsensi();
    
    renderDynamicAbsensiUI();
    renderRiwayatAbsensi();
    if (typeof renderTabel === "function") renderTabel('cuti'); 
}

function renderDynamicAbsensiUI() {
    const container = document.getElementById('dynamic-absensi-container');
    const selector = document.getElementById('absensi-jabatan-selector');
    if (!container) return;

    const primaryJabatan = currentUser.jabatan ? currentUser.jabatan.split(',')[0].trim() : 'Umum';
    const selectedJabatan = (selector && !selector.classList.contains('hidden')) ? selector.value : primaryJabatan;
    const lembaga = appData.dataMaster?.lembaga?.[0] || {};
    const kebijakan = lembaga.kebijakanAbsensi || 'Semi Ketat';

    let rawTipeData = (appData.profil && appData.profil.tipeAbsensi) ? appData.profil.tipeAbsensi : (currentUser.tipeAbsensi || '');
    let tipe = 'Tipe 4';

    if (rawTipeData) {
        try {
            if (String(rawTipeData).trim().startsWith('{')) {
                let tipeObj = JSON.parse(rawTipeData);
                let matchedKey = Object.keys(tipeObj).find(k => k.trim().toLowerCase() === selectedJabatan.trim().toLowerCase());
                tipe = matchedKey ? tipeObj[matchedKey] : 'Tipe 4';
            } else {
                if (selectedJabatan.trim().toLowerCase() === primaryJabatan.toLowerCase()) tipe = String(rawTipeData).trim();
            }
        } catch (e) { tipe = 'Tipe 4'; }
    }

    const now = new Date();

    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const parts = String(dateStr).match(/\d+/g); 
        if (!parts || parts.length < 3) return false;
        
        const year = parts.find(p => p.length === 4) || parts[2];
        const month = parts[1];
        const day = parts[0].length === 4 ? parts[2] : parts[0];
        
        return parseInt(year) === now.getFullYear() && parseInt(month) === (now.getMonth() + 1) && parseInt(day) === now.getDate();
    };

    const absensiSemuaToday = (appData.absensi || []).filter(a => isToday(a.tanggal));

    let myAbsensiToday = absensiSemuaToday.filter(a => {
        let isSameJabatan = (a.jabatan ? String(a.jabatan).trim().toLowerCase() : primaryJabatan.toLowerCase()) === selectedJabatan.trim().toLowerCase();
        return (a.namaPegawai === currentUser.nama) && isSameJabatan;
    });

    // FUNGSI CEK SELESAI (Menggunakan algoritma asli Anda yang terbukti ampuh)
    const cekKelasSelesai = (jadwal) => {
        return absensiSemuaToday.some(a => {
            const matchKelas = String(a.kelas || '').trim() === String(jadwal.kelasRuang || '').trim();
            const matchMapel = String(a.mataPelajaran || '').trim() === String(jadwal.mataPelajaran || '').trim();
            const matchJam = !a.slotJam || String(a.slotJam).trim() === String(jadwal.jam || '').trim();
            
            return matchKelas && matchMapel && matchJam;
        });
    };

    const hasCheckedInToday = myAbsensiToday.length > 0;
    const lastRecord = hasCheckedInToday ? myAbsensiToday[myAbsensiToday.length - 1] : null;
    const isCurrentlyCheckedIn = lastRecord && (!lastRecord.jamKeluar || lastRecord.jamKeluar === '-');
    const recordId = lastRecord ? (lastRecord.id || lastRecord.ID || lastRecord.iD) : '';

    const btnIzin = `<button onclick="toggleModal('modal-izin-menit')" class="w-full mt-3 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 py-2 rounded-lg font-bold shadow-sm transition-transform transform active:scale-95 text-sm border border-orange-200 dark:border-orange-800"><i class="fa-solid fa-person-walking-arrow-right mr-2"></i> Izin Tinggalkan Lokasi</button>`;
    
    const btnAbsenUlang = kebijakan === 'Longgar' 
        ? `<button onclick="ajukanAbsensiUlang()" class="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 py-2 rounded-lg font-bold shadow-sm transition-transform active:scale-95 text-sm border border-slate-300 dark:border-slate-600"><i class="fa-solid fa-clock-rotate-left mr-2"></i> Ajukan Absen Ulang / Susulan</button>` 
        : '';

    if (tipe === 'Tipe 1') {
        container.innerHTML = `<div class="w-full flex flex-col space-y-2"><div class="w-full text-center p-4 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium"><i class="fa-solid fa-circle-info mr-2 text-blue-500"></i> Disetel sebagai <b>Tanpa Absensi Harian</b>.</div>${btnIzin}</div>`;
    } 
    else if (tipe === 'Tipe 2') {
        if (hasCheckedInToday) container.innerHTML = `<div class="w-full flex flex-col space-y-2"><div class="w-full flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 font-bold text-lg"><i class="fa-solid fa-check-circle mr-2 text-2xl"></i> Sudah Hadir Hari Ini</div>${btnIzin}</div>`;
        else container.innerHTML = `<div class="w-full flex flex-col space-y-2"><button onclick="handleAbsensiAPI('checkIn')" class="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform transform active:scale-95 text-lg"><i class="fa-solid fa-hand-sparkles mr-2"></i> Hadir Hari Ini</button>${btnIzin}${btnAbsenUlang}</div>`;
    } 
    else if (tipe === 'Tipe 3') {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[now.getDay()];
        let UI_HTML = '<div class="w-full flex flex-col space-y-4">';

        // ==========================================
        // BAGIAN A: JADWAL SAYA SENDIRI (UI TOMBOL LANGSUNG)
        // ==========================================
        const jadwalFullHariIni = (appData.akademik?.jadwal || []).filter(j => j.guruPengajar === currentUser.nama && j.hari === todayName);
        
        const jadwalSelesai = [];
        const jadwalBelumSelesai = jadwalFullHariIni.filter(j => {
            const isDone = cekKelasSelesai(j); 
            if(isDone) jadwalSelesai.push(j);
            return !isDone;
        });

        if (jadwalFullHariIni.length > 0) {
            UI_HTML += `<div><div class="text-left px-2 mb-1 text-sm font-bold text-indigo-700 dark:text-indigo-400">Status Kelas Anda Hari Ini (${todayName}):</div><div class="text-left w-full space-y-2 mb-3">`;
            
            jadwalBelumSelesai.forEach(j => {
                // Konversi objek jadwal ke string base64 agar aman disisipkan ke dalam tombol
                const jString = btoa(unescape(encodeURIComponent(JSON.stringify(j))));
                
                UI_HTML += `<div class="flex items-center p-3 bg-white dark:bg-slate-800 border-l-4 border-l-amber-500 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold mr-3 shrink-0"><i class="fa-solid fa-hourglass-half"></i></div>
                                <div class="flex-1">
                                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">${escapeHTML(j.mataPelajaran)} <span class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 font-bold">${j.jumlahJp || 1} JP</span></p>
                                    <p class="text-[11px] font-semibold text-slate-500 mt-0.5"><i class="fa-solid fa-door-open mr-1"></i>${escapeHTML(j.kelasRuang)} &nbsp;&bull;&nbsp; <i class="fa-regular fa-clock mr-1"></i>${escapeHTML(j.jam)}</p>
                                </div>
                                <button onclick="bukaModalAbsenLangsung('${jString}')" class="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black py-2.5 px-4 rounded-lg shadow-sm transition-transform active:scale-95 shrink-0 flex items-center">
                                    ABSEN <i class="fa-solid fa-arrow-right ml-2"></i>
                                </button>
                            </div>`;
            });

            jadwalSelesai.forEach(j => {
                UI_HTML += `<div class="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-l-green-500 border border-slate-200 dark:border-slate-700 rounded-lg opacity-70">
                                <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mr-3 shrink-0"><i class="fa-solid fa-check"></i></div>
                                <div>
                                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight line-through decoration-green-500/50">${escapeHTML(j.mataPelajaran)}</p>
                                    <p class="text-[10px] font-semibold text-green-600 mt-0.5">Selesai Sesi ${escapeHTML(j.jam.split(' ')[0] || '')}</p>
                                </div>
                            </div>`;
            });

            if (jadwalBelumSelesai.length === 0 && jadwalFullHariIni.length > 0) {
                UI_HTML += `<div class="w-full flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 font-bold text-base shadow-sm text-center mt-2">
                                <i class="fa-solid fa-check-double mr-2 text-xl"></i> Semua Sesi Kelas Selesai Diisi
                            </div></div>`;
            } else {
                UI_HTML += `</div></div>`;
            }
        } else {
            UI_HTML += `<div class="text-center p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-sm font-medium shadow-sm"><i class="fa-solid fa-calendar-xmark text-3xl block mb-2 opacity-80"></i>Anda tidak ada jadwal kelas resmi hari ini.</div>`;
        }

        // ==========================================
        // BAGIAN B: JADWAL INVAL (GURU LAIN)
        // ==========================================
        const jadwalInvalTersedia = (appData.akademik?.jadwal || []).filter(j => {
            if (j.hari !== todayName) return false;
            if (j.guruPengajar === currentUser.nama) return false; 
            const isDone = cekKelasSelesai(j);
            return !isDone;
        });

        window.tempJadwalInvalTersedia = jadwalInvalTersedia;

        let opsiInval = '<option value="">-- Pilih Kelas yang Digantikan --</option>';
        jadwalInvalTersedia.forEach((j, idx) => { 
            opsiInval += `<option value="${idx}">${escapeHTML(j.kelasRuang)} - ${escapeHTML(j.mataPelajaran)} (${escapeHTML(j.jam)}) - Asli: ${escapeHTML(j.guruPengajar)}</option>`; 
        });

        UI_HTML += `
            <div class="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-left shadow-sm">
                <label class="flex items-center space-x-2 cursor-pointer mb-1">
                    <input type="checkbox" id="cb-ganti-guru" onchange="toggleGantiGuruUI()" class="w-4 h-4 text-indigo-600 rounded border-slate-300">
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Gantikan guru lain (Inval)</span>
                </label>
                <div id="wadah-ganti-guru" class="hidden flex flex-col space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <label class="text-xs font-bold text-slate-500">Pilih Kelas yang Digantikan:</label>
                    <select id="select-ganti-kelas" onchange="cekPilihGantiKelas()" class="w-full p-2 border border-slate-300 rounded bg-slate-50 text-sm outline-none cursor-pointer">
                        ${jadwalInvalTersedia.length > 0 ? opsiInval : '<option value="">Semua jadwal guru lain sudah selesai / kosong.</option>'}
                    </select>
                </div>
            </div>
            <button id="btn-absen-inval" onclick="mulaiKelasInval()" disabled class="hidden w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 mt-2">
                <i class="fa-solid fa-chalkboard-user mr-2"></i> Mulai Kelas Inval
            </button>
        `;

        UI_HTML += btnIzin + btnAbsenUlang + `</div>`;
        container.innerHTML = UI_HTML;
    } 
    else {
        let btnHTML = isCurrentlyCheckedIn 
            ? `<button onclick="handleAbsensiAPI('checkOut', '${recordId}')" class="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform transform active:scale-95 text-lg"><i class="fa-solid fa-sign-out-alt mr-2"></i> Check-Out Kepulangan</button>`
            : `<button onclick="handleAbsensiAPI('checkIn')" class="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform transform active:scale-95 text-lg"><i class="fa-solid fa-sign-in-alt mr-2"></i> Check-In Kehadiran</button>`;
        container.innerHTML = `<div class="w-full flex flex-col space-y-2">${btnHTML}${btnIzin}${btnAbsenUlang}</div>`;
    }
}

// =========================================================
// HELPER GPS
// =========================================================
function hitungJarakGPS(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function dapatkanLokasiGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject("Perangkat/Browser Anda tidak mendukung GPS.");
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            err => reject("Akses lokasi ditolak. Pastikan GPS HP menyala.")
        );
    });
}

// =========================================================
// API UTAMA PENGIRIMAN ABSENSI KE DATABASE
// =========================================================
async function handleAbsensiAPI(actionType, recordId = '', extraData = null) {
    const selector = document.getElementById('absensi-jabatan-selector');
    const selectedJabatan = (selector && !selector.classList.contains('hidden')) ? selector.value : currentUser.jabatan.split(',')[0].trim();

    if(typeof showGlobalLoading === "function") showGlobalLoading("Memproses Presensi...");

    const wkt = new Date();
    const currH = wkt.getHours();
    const currM = wkt.getMinutes();
    const tglFormated = getLocalDateString(); 
    const jamMurni = String(currH).padStart(2, '0') + ':' + String(currM).padStart(2, '0');

    const lembaga = appData.dataMaster?.lembaga?.[0] || {};
    const kebijakan = lembaga.kebijakanAbsensi || 'Semi Ketat';
    let jamMasukTeks = lembaga.jamKerjaMasuk ? lembaga.jamKerjaMasuk.replace(/ Wib/gi, '').trim() : "07:30";
    let menitTerlambat = 0;

    const [inH, inM] = jamMasukTeks.split(':').map(Number);
    const currTotalMins = (currH * 60) + currM;
    const inTotalMins = (inH * 60) + (inM || 0);

    // ALUR JALUR CEPAT (BYPASS) DARI MODAL GURU
    if (actionType === 'checkIn' && extraData && extraData.bypassMenit !== undefined) {
        menitTerlambat = extraData.bypassMenit;
        delete extraData.bypassMenit; // Bersihkan agar tidak ikut tersimpan sebagai nama kolom di Sheets
        
        if (kebijakan === 'Super Ketat') {
            if(typeof showGlobalLoading === "function") showGlobalLoading("Melacak Kordinat GPS Anda...");
            try {
                const myPos = await dapatkanLokasiGPS();
                if (!lembaga.koordinatKantor) throw new Error("Koordinat kantor belum disetel oleh Admin.");
                const [latKantor, lonKantor] = lembaga.koordinatKantor.split(',').map(Number);
                const radiusDiizinkan = parseInt(lembaga.radiusAbsen || 50);
                const jarakSaya = hitungJarakGPS(myPos.lat, myPos.lon, latKantor, lonKantor);
                
                if (jarakSaya > radiusDiizinkan) throw new Error(`Di luar radius kantor! Jarak Anda: ${Math.round(jarakSaya)}m. Maksimal: ${radiusDiizinkan}m.`);
            } catch (errMsg) {
                if(typeof hideGlobalLoading === "function") hideGlobalLoading();
                if(typeof ModernUI !== 'undefined') ModernUI.alert("Gagal Check-In", (errMsg.message || errMsg), 'error');
                return; 
            }
        }
        lanjutkanKirimAbsensi('checkIn', recordId, tglFormated, jamMurni, selectedJabatan, menitTerlambat, extraData);
        return;
    }

    if (actionType === 'checkIn') {
        if (kebijakan === 'Longgar') {
            if(typeof hideGlobalLoading === "function") hideGlobalLoading();
            if(typeof ModernUI !== 'undefined') {
                ModernUI.prompt('Keterlambatan Hadir', 'Berapa menit Anda terlambat masuk kerja hari ini? (Isi 0 jika tepat waktu)', 'Cth: 15', 'number', (inputVal) => {
                    if (inputVal === null || inputVal === '') return; 
                    menitTerlambat = parseInt(inputVal) || 0;
                    lanjutkanKirimAbsensi(actionType, recordId, tglFormated, jamMurni, selectedJabatan, menitTerlambat, extraData);
                });
            } else {
                let inputMenit = prompt("Berapa menit Anda terlambat?", "0");
                if (inputMenit === null) return;
                menitTerlambat = parseInt(inputMenit) || 0;
                lanjutkanKirimAbsensi(actionType, recordId, tglFormated, jamMurni, selectedJabatan, menitTerlambat, extraData);
            }
            return;
        } 
        else {
            if (currTotalMins > inTotalMins) menitTerlambat = currTotalMins - inTotalMins;

            if (kebijakan === 'Super Ketat') {
                if(typeof showGlobalLoading === "function") showGlobalLoading("Melacak Kordinat GPS Anda...");
                try {
                    const myPos = await dapatkanLokasiGPS();
                    if (!lembaga.koordinatKantor) throw new Error("Koordinat kantor belum disetel oleh Admin.");
                    const [latKantor, lonKantor] = lembaga.koordinatKantor.split(',').map(Number);
                    const radiusDiizinkan = parseInt(lembaga.radiusAbsen || 50);
                    const jarakSaya = hitungJarakGPS(myPos.lat, myPos.lon, latKantor, lonKantor);
                    
                    if (jarakSaya > radiusDiizinkan) throw new Error(`Di luar radius kantor! Jarak Anda: ${Math.round(jarakSaya)}m. Maksimal: ${radiusDiizinkan}m.`);
                } catch (errMsg) {
                    if(typeof hideGlobalLoading === "function") hideGlobalLoading();
                    if(typeof ModernUI !== 'undefined') ModernUI.alert("Gagal Check-In", (errMsg.message || errMsg), 'error');
                    return; 
                }
            }
            lanjutkanKirimAbsensi(actionType, recordId, tglFormated, jamMurni, selectedJabatan, menitTerlambat, extraData);
        }
    } else {
        lanjutkanKirimAbsensi(actionType, recordId, tglFormated, jamMurni, selectedJabatan, 0, extraData);
    }
}

async function lanjutkanKirimAbsensi(actionType, recordId, tglFormated, jamMurni, selectedJabatan, menitTerlambat, extraData = null) {
    if(typeof showGlobalLoading === "function") showGlobalLoading("Menyimpan ke Sistem...");

    let payloadObj = {
        sheetName: 'Absensi',
        data: {
            namaPegawai: currentUser.nama,
            tanggal: tglFormated,
            jabatan: selectedJabatan,
            menitTerlambat: menitTerlambat
        }
    };

    if (extraData) payloadObj.data = { ...payloadObj.data, ...extraData };

    let apiAction = '';
    if (actionType === 'checkIn') {
        apiAction = 'crudCreate';
        payloadObj.data.jamMasuk = jamMurni + ' Wib'; 
        payloadObj.data.jamKeluar = '-';
        payloadObj.data.status = menitTerlambat > 0 ? 'Terlambat' : 'Hadir';
    } else if (actionType === 'checkOut') {
        apiAction = 'crudUpdate';
        payloadObj.id = recordId;
        payloadObj.data.jamKeluar = jamMurni + ' Wib'; 
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: apiAction, payload: payloadObj })
        });
        const result = await response.json();
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();

        if (result.status === 'success') {
            localStorage.removeItem(`portal_appData_${currentUser.username}`);
            await loadAppData(); 
            
            renderDynamicAbsensiUI();
            renderRiwayatAbsensi();
            refreshCurrentPageContent();
            
            if (typeof ModernUI !== 'undefined') {
                if (actionType === 'checkIn') ModernUI.alert('Berhasil', extraData ? `Jurnal kelas & kehadiran dicatat!` : `Check-in berhasil.`, 'success');
                else ModernUI.alert('Sampai Jumpa', `Check-out berhasil. Selamat beristirahat!`, 'info');
            } else alert('Sistem berhasil memperbarui presensi Anda.');
        } else {
            if (typeof ModernUI !== 'undefined') ModernUI.alert('Gagal', result.message, 'error');
        }
    } catch (e) {
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        if (typeof ModernUI !== 'undefined') ModernUI.alert('Error', 'Kesalahan koneksi jaringan.', 'error');
    }
}

// =========================================================
// UI BARU: MODAL JURNAL & PRESENSI GURU (TANPA DROPDOWN)
// =========================================================

window.bukaModalAbsenLangsung = function(jadwalBase64) {
    if (document.getElementById('modal-absen-guru')) document.getElementById('modal-absen-guru').remove();
    
    // Pecah data jadwal dari tombol untuk dibaca di modal
    const jadwalTerpilih = JSON.parse(decodeURIComponent(escape(atob(jadwalBase64))));

    const dataKelas = (appData.dataMaster?.kelas || []).find(k => k.namaKelas === jadwalTerpilih.kelasRuang);
    let htmlSiswa = '';

    if (!dataKelas || !dataKelas.daftarSiswa) {
        htmlSiswa = `<div class="p-4 bg-amber-100 text-amber-700 rounded-lg text-center text-sm font-bold border border-amber-300">Belum ada siswa yang didaftarkan ke ${escapeHTML(jadwalTerpilih.kelasRuang)}.</div>`;
    } else {
        const daftarSiswa = dataKelas.daftarSiswa.split(',').map(s => s.trim());
        htmlSiswa = `<div class="flex justify-between items-center mb-2 px-1"><span class="text-xs font-bold text-slate-500 uppercase">Daftar Siswa (${daftarSiswa.length} Orang)</span></div>`;
        
        daftarSiswa.forEach((siswa, i) => {
            htmlSiswa += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm gap-2">
                    <span class="font-bold text-sm text-slate-700 dark:text-slate-200">${i + 1}. ${escapeHTML(siswa)}</span>
                    <div class="flex space-x-1 sm:space-x-2 siswa-radio-group" data-nama="${escapeHTML(siswa)}">
                        <label class="cursor-pointer"><input type="radio" name="abs_${i}" value="Hadir" checked class="peer hidden"><span class="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-500 peer-checked:bg-green-100 peer-checked:text-green-700">Hadir</span></label>
                        <label class="cursor-pointer"><input type="radio" name="abs_${i}" value="Sakit" class="peer hidden"><span class="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-500 peer-checked:bg-blue-100 peer-checked:text-blue-700">Sakit</span></label>
                        <label class="cursor-pointer"><input type="radio" name="abs_${i}" value="Izin" class="peer hidden"><span class="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-500 peer-checked:bg-amber-100 peer-checked:text-amber-700">Izin</span></label>
                        <label class="cursor-pointer"><input type="radio" name="abs_${i}" value="Alpa" class="peer hidden"><span class="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-500 peer-checked:bg-red-100 peer-checked:text-red-700">Alpa</span></label>
                    </div>
                </div>
            `;
        });
    }

    const modalHTML = `
        <div id="modal-absen-guru" class="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
                <div class="p-4 bg-indigo-600 flex justify-between items-center text-white shrink-0">
                    <div><h3 class="font-bold text-lg"><i class="fa-solid fa-clipboard-user mr-2"></i> Jurnal & Presensi Kelas</h3></div>
                    <button onclick="document.getElementById('modal-absen-guru').remove()" class="text-white hover:text-red-200 transition-colors"><i class="fa-solid fa-times text-xl"></i></button>
                </div>
                
                <div class="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 space-y-5">
                    
                    <div class="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex justify-between items-center shadow-sm">
                        <div>
                            <p class="text-indigo-800 dark:text-indigo-300 font-black text-sm uppercase tracking-wider">${escapeHTML(jadwalTerpilih.mataPelajaran)}</p>
                            <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1"><i class="fa-solid fa-door-open mr-1"></i> ${escapeHTML(jadwalTerpilih.kelasRuang)} &nbsp;&bull;&nbsp; <i class="fa-regular fa-clock mr-1"></i> ${escapeHTML(jadwalTerpilih.jam)}</p>
                        </div>
                        <div class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black text-xs shadow-sm border border-indigo-700">${jadwalTerpilih.jumlahJp || 1} JP</div>
                    </div>

                    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <label class="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300"><i class="fa-solid fa-book-open mr-1 text-indigo-500"></i> Jurnal Materi yang Diajarkan:</label>
                        <textarea id="guru-input-materi" rows="2" placeholder="Cth: Bab 1. Membahas sistem tata surya..." class="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg outline-none text-sm bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-shadow"></textarea>
                    </div>

                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
                        <label class="block text-xs font-black mb-2 text-red-700 dark:text-red-400"><i class="fa-solid fa-stopwatch mr-1"></i> Menit Terlambat Masuk Kelas (Isi 0 jika Tepat Waktu):</label>
                        <div class="relative">
                            <input type="number" id="guru-input-terlambat" value="0" min="0" class="w-full pl-4 pr-16 py-2.5 border border-red-300 dark:border-red-700 rounded-lg outline-none text-sm font-black text-red-700 dark:text-red-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 transition-shadow">
                            <span class="absolute right-4 top-3 text-xs font-bold text-red-500">Menit</span>
                        </div>
                    </div>

                    <div id="wadah-list-siswa" class="space-y-2 pt-2">
                        ${htmlSiswa}
                    </div>
                </div>

                <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                    <button id="btn-submit-absen-guru" onclick="submitAbsenLangsung('${jadwalBase64}')" class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition-transform active:scale-95 text-lg shadow-xl flex justify-center items-center">
                        <i class="fa-solid fa-check-double mr-2 text-xl"></i> SIMPAN JURNAL & PRESENSI
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.submitAbsenLangsung = async function(jadwalBase64) {
    const btn = document.getElementById('btn-submit-absen-guru');
    const jadwalTerpilih = JSON.parse(decodeURIComponent(escape(atob(jadwalBase64))));
    const isiMateri = document.getElementById('guru-input-materi').value || '-';
    const inputTerlambat = parseInt(document.getElementById('guru-input-terlambat').value) || 0;
    
    let dataKehadiranSiswa = {};
    document.querySelectorAll('.siswa-radio-group').forEach(group => {
        const checkedRadio = group.querySelector('input[type="radio"]:checked');
        if (checkedRadio) dataKehadiranSiswa[group.getAttribute('data-nama')] = checkedRadio.value;
    });

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Merekam Data...';
    btn.disabled = true;

    try {
        if (Object.keys(dataKehadiranSiswa).length > 0) {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Absensi_Siswa', data: { tanggal: getLocalDateString(), namaGuru: currentUser.nama, mataPelajaran: jadwalTerpilih.mataPelajaran, kelas: jadwalTerpilih.kelasRuang, materi: isiMateri, dataKehadiran: JSON.stringify(dataKehadiranSiswa) } } })
            });
        }
        
        document.getElementById('modal-absen-guru').remove();
        
        const extraDataGuru = {
            kelas: jadwalTerpilih.kelasRuang,
            mataPelajaran: jadwalTerpilih.mataPelajaran,
            materi: isiMateri,
            jumlahJp: parseInt(jadwalTerpilih.jumlahJp) || 1,
            slotJam: jadwalTerpilih.jam,
            bypassMenit: inputTerlambat 
        };
        
        handleAbsensiAPI('checkIn', '', extraDataGuru);

    } catch (e) {
        if(typeof ModernUI !== 'undefined') ModernUI.alert('Error', 'Gagal merekam jurnal.', 'error');
        else alert('Gagal merekam jurnal.');
        btn.innerHTML = 'Coba Lagi'; btn.disabled = false;
    }
};

function toggleGantiGuruUI() { document.getElementById('wadah-ganti-guru').classList.toggle('hidden'); document.getElementById('btn-absen-inval').classList.toggle('hidden'); }
function cekPilihGantiKelas() { document.getElementById('btn-absen-inval').disabled = (document.getElementById('select-ganti-kelas').value === ""); }
function mulaiKelasInval() { 
    const idx = document.getElementById('select-ganti-kelas').value; 
    if (idx === "") return;
    
    // --- PERBAIKAN: RE-FILTERING DINAMIS ---
    // Jangan pakai variabel window lama, tapi hitung ulang siapa saja yang belum absen
    const todayStr = getLocalDateString();
    const absensiSemuaToday = (appData.absensi || []).filter(a => String(a.tanggal).split('T')[0] === todayStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[new Date().getDay()];

    const jadwalInvalTersediaBaru = (appData.akademik?.jadwal || []).filter(j => {
        if (j.hari !== todayName) return false;
        if (j.guruPengajar === currentUser.nama) return false;
        
        // Cek lagi ke database absensi terbaru (real-time)
        const isDone = absensiSemuaToday.some(a => 
            String(a.kelas||'').trim() === String(j.kelasRuang||'').trim() && 
            String(a.mataPelajaran||'').trim() === String(j.mataPelajaran||'').trim() && 
            (!a.slotJam || String(a.slotJam).trim() === String(j.jam).trim())
        );
        return !isDone;
    });

    // Ambil jadwal berdasarkan indeks yang dipilih dari data terbaru
    const jadwalTerpilih = jadwalInvalTersediaBaru[idx];
    
    if (jadwalTerpilih) {
        bukaModalAbsensiSiswa([jadwalTerpilih]); 
    } else {
        alert("Maaf, kelas ini baru saja diisi oleh guru lain. Daftar akan di-refresh.");
        renderDynamicAbsensiUI(); // Refresh tampilan agar dropdown hilang
    }
}

// =========================================================
// REQUEST ABSEN ULANG (LONGGAR) & IZIN KELUAR MENITAN
// =========================================================
function ajukanAbsensiUlang() {
    const overlay = document.createElement('div');
    overlay.id = 'modal-absen-ulang';
    overlay.className = 'fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in';
    
    overlay.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up border border-slate-100">
            <h3 class="text-lg font-black mb-1 flex items-center text-slate-800"><i class="fa-solid fa-clock-rotate-left mr-2 text-indigo-500"></i> Absensi Susulan</h3>
            <p class="text-xs text-slate-500 mb-4">Ajukan request absen ulang jika Anda lupa absen di hari sebelumnya.</p>
            
            <label class="block text-xs font-bold mb-1">Pilih Tanggal Terlewat</label>
            <input type="date" id="req-absen-tgl" class="w-full p-2 border border-slate-300 rounded outline-none mb-3 text-sm">
            
            <label class="block text-xs font-bold mb-1">Alasan Terlewat</label>
            <textarea id="req-absen-alasan" rows="2" placeholder="Cth: HP mati, internet gangguan..." class="w-full p-2 border border-slate-300 rounded outline-none mb-4 text-sm"></textarea>
            
            <div class="flex space-x-3">
                <button onclick="document.getElementById('modal-absen-ulang').remove()" class="flex-1 bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg">Batal</button>
                <button onclick="submitAbsenUlang(this)" class="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-lg shadow-md">Ajukan</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function submitAbsenUlang(btnElement) {
    const tgl = document.getElementById('req-absen-tgl').value;
    const alasan = document.getElementById('req-absen-alasan').value;
    
    if (!tgl || !alasan) return ModernUI.alert('Perhatian', 'Isi tanggal dan alasan!', 'warning');
    
    const oriText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btnElement.disabled = true;

    const payload = {
        pengaju: currentUser.nama,
        tipeCuti: `Request Absen Ulang`,
        tanggalMulai: tgl,
        tanggalSelesai: tgl,
        alasan: alasan,
        status: 'Pending'
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Cuti', data: payload } })
        });
        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('modal-absen-ulang').remove();
            ModernUI.alert('Terkirim!', 'Permohonan absen ulang telah dikirim ke Dasbor Atasan.', 'success');
        } else throw new Error(result.message);
    } catch (e) {
        ModernUI.alert('Error', 'Gagal mengirim pengajuan.', 'error');
        btnElement.innerHTML = oriText;
        btnElement.disabled = false;
    }
}

async function submitIzinMenit(event) {
    event.preventDefault();
    const durasi = document.getElementById('izin-durasi').value;
    const alasan = document.getElementById('izin-alasan').value;
    const btn = event.target.querySelector('button[type="submit"]');
    
    if (!durasi || !alasan) {
        if(typeof ModernUI !== 'undefined') return ModernUI.alert('Peringatan', 'Harap isi durasi dan alasan izin.', 'warning');
        return alert('Harap isi durasi dan alasan izin.');
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengirim...';
    btn.disabled = true;

    const todayStr = getLocalDateString();

    const payload = {
        pengaju: currentUser.nama,
        tipeCuti: `Izin Keluar (${durasi} Menit)`,
        tanggalMulai: todayStr,
        tanggalSelesai: todayStr,
        alasan: alasan,
        status: 'Pending'
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Cuti', data: payload } })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            toggleModal('modal-izin-menit');
            document.body.classList.remove('overflow-hidden');
            
            document.getElementById('izin-durasi').value = '';
            document.getElementById('izin-alasan').value = '';

            if(typeof ModernUI !== 'undefined') ModernUI.alert('Berhasil', 'Permohonan izin keluar Anda telah dikirim ke Dasbor.', 'success');
            else alert('Permohonan izin keluar terkirim.');
        } else {
            if(typeof ModernUI !== 'undefined') ModernUI.alert('Gagal', result.message, 'error');
            else alert('Gagal: ' + result.message);
        }
    } catch (e) {
        if(typeof ModernUI !== 'undefined') ModernUI.alert('Error', 'Kesalahan koneksi jaringan.', 'error');
        else alert('Kesalahan koneksi.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// =========================================================
// UI: TAMPILAN RIWAYAT TABEL
// =========================================================

const formatJamDisplay = (jamRaw, isJamKeluar, isGuru) => {
    if (jamRaw && jamRaw !== '-') return String(jamRaw).replace(/ Wib/gi, '').trim();
    if (isJamKeluar && isGuru) return '<span class="text-slate-400 italic text-[10px]">Selesai Sesi</span>';
    return '<span class="text-orange-500 italic text-[10px]">Belum C/O</span>';
};

function renderRiwayatAbsensi() {
    const tbody = document.getElementById('table-body-absensi');
    const filterBulan = document.getElementById('filter-bulan-absensi');
    if (!tbody || !filterBulan) return;
    
    tbody.innerHTML = '';
    
    let personalAbsensi = appData.absensi || [];
    personalAbsensi = personalAbsensi.filter(a => a.namaPegawai === currentUser.nama);
    const selectedMonthStr = filterBulan.value; 
    
    if (selectedMonthStr) {
        const [year, month] = selectedMonthStr.split('-');
        personalAbsensi = personalAbsensi.filter(item => {
            if (!item.tanggal) return false;
            let dbDate = String(item.tanggal);
            if (dbDate.includes('T')) dbDate = dbDate.split('T')[0];
            if (dbDate.includes('-')) {
                const parts = dbDate.split('-');
                return parts[0] === year && parts[1] === month;
            }
            return false;
        });
    }

    if (personalAbsensi.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-500">Tidak ada riwayat pada bulan ini.</td></tr>';
        return;
    }

    personalAbsensi.reverse().forEach(item => {
        let status = item.statusKehadiran || item.status || 'Hadir';
        let statusColor = status.toLowerCase().includes('izin') || status.toLowerCase().includes('terlambat') ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700';
        
        let ekstraInfoHTML = '';
        if (item.mataPelajaran) {
            ekstraInfoHTML = `<div class="mt-1 p-2 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-600 leading-tight">
                <span class="font-bold text-indigo-600">${escapeHTML(item.mataPelajaran)} (${item.jumlahJp || 1} JP) - Ruang: ${escapeHTML(item.kelas || '-')}</span><br>
                Materi: <span class="italic">${escapeHTML(item.materi || '-')}</span>
            </div>`;
        }
        
        let isGuruRecord = item.jabatan && item.jabatan.toLowerCase().includes('guru');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-3 border-b border-slate-100 font-medium leading-tight">
                    ${escapeHTML(item.tanggal)}
                    <br><span class="text-[9px] text-slate-400 font-bold uppercase">${escapeHTML(item.jabatan || 'Umum')}</span>
                    ${ekstraInfoHTML}
                </td>
                <td class="p-3 border-b border-slate-100 font-mono text-blue-600">${formatJamDisplay(item.jamMasuk, false, isGuruRecord)}</td>
                <td class="p-3 border-b border-slate-100 font-mono">${formatJamDisplay(item.jamKeluar, true, isGuruRecord)}</td>
                <td class="p-3 border-b border-slate-100 truncate" title="${escapeHTML(status)}">
                    <span class="px-2 py-1 ${statusColor} text-[10px] font-bold rounded-full uppercase">${escapeHTML(status)}</span>
                </td>
            </tr>
        `;
    });
}