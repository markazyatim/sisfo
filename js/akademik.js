// ==========================================================================
// FILE: AKADEMIK.JS (SIAKAD MINI DENGAN SISTEM DRAFT, LIVE QUOTA, & ANTI-BENTROK)
// ==========================================================================

let currentAkademikModalType = '';
let jadwalCart = []; 
let filterAkademikKelompok = 'Semua';
let filterAkademikRuang = 'Semua';
let filterAkademikTipe = 'Semua';

// Fungsi Filter Utama
function gantiFilterJadwal(kategori, nilai) {
    if (kategori === 'kelompok') {
        filterAkademikKelompok = nilai;
        filterAkademikRuang = 'Semua'; 
    } else if (kategori === 'ruang') {
        filterAkademikRuang = nilai;
    } else if (kategori === 'tipe') {
        filterAkademikTipe = nilai;
    }
    renderMingguanKBM(); 
}

function switchAkademikTab(tabId) {
    currentAkademikTab = tabId;
    
    const allTabs = document.querySelectorAll('.ak-tab');
    allTabs.forEach(tab => {
        tab.classList.remove('bg-blue-600', 'text-white');
        tab.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
    });

    const activeTab = document.querySelector(`.ak-tab[onclick="switchAkademikTab('${tabId}')"]`);
    if (activeTab) {
        activeTab.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
        activeTab.classList.add('bg-blue-600', 'text-white');
    }

    document.querySelectorAll('.ak-content-pane').forEach(pane => {
        pane.classList.remove('block', 'flex');
        pane.classList.add('hidden');
    });

    const activePane = document.getElementById(`ak-tab-${tabId.replace('ak-', '')}`);
    if (activePane) {
        activePane.classList.remove('hidden');
        if (tabId === 'ak-dasbor') activePane.classList.add('block');
        else activePane.classList.add('flex'); 
    }

    renderAkademikData();
}

function renderAkademikData() {
    if (currentAkademikTab === 'ak-dasbor') {
        renderDasborAkademik();
    } 
    else if (currentAkademikTab === 'ak-jadwal') {
        renderMingguanKBM(); 
    } 
    else if (currentAkademikTab === 'ak-jurnal') {
        renderTabelAkademik('Jurnal', 'table-ak-jurnal');
    } 
    else if (currentAkademikTab === 'ak-nilai') {
        renderTabelAkademik('Nilai', 'table-ak-nilai');
    } 
    else if (currentAkademikTab === 'ak-modul') {
        renderBankModul();
    }
}

function renderDasborAkademik() {
    const jadwal = appData.akademik?.jadwal || [];
    const nilai = appData.akademik?.nilai || [];
    const modul = appData.akademik?.modul || [];
    const jurnal = appData.jurnal || []; 

    const elKelas = document.getElementById('ak-stat-kelas');
    if (elKelas) elKelas.textContent = jadwal.length;

    let totalNilai = 0;
    let jumlahNilai = nilai.length;
    const elNilai = document.getElementById('ak-stat-nilai');
    if (elNilai) {
        if (jumlahNilai > 0) {
            nilai.forEach(n => totalNilai += parseFloat(n.nilaiAngka || 0));
            elNilai.textContent = (totalNilai / jumlahNilai).toFixed(1);
        } else {
            elNilai.textContent = '0';
        }
    }

    const elModul = document.getElementById('ak-stat-modul');
    if (elModul) elModul.textContent = modul.length;

    const timelineContainer = document.getElementById('ak-timeline-aktivitas');
    if (timelineContainer) {
        timelineContainer.innerHTML = '';
        
        if (jurnal.length === 0) {
            timelineContainer.innerHTML = '<li class="text-slate-500 text-center py-4 border border-dashed border-slate-300 dark:border-slate-700 rounded">Belum ada aktivitas mengajar.</li>';
        } else {
            let recentJurnals = [...jurnal].reverse().slice(0, 10);
            recentJurnals.forEach(j => {
                timelineContainer.innerHTML += `
                    <li class="p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded">
                        <div class="flex justify-between items-start mb-1">
                            <span class="font-bold text-blue-600 dark:text-blue-400">${escapeHTML(j.guruPengajar)}</span>
                            <span class="text-xs text-slate-500 font-mono">${escapeHTML(j.tanggal)}</span>
                        </div>
                        <p class="text-sm"><span class="font-semibold">[${escapeHTML(j.mataPelajaran)}]</span> ${escapeHTML(j.materiPembelajaran)}</p>
                    </li>
                `;
            });
        }
    }
}

function renderTabelAkademik(type, tableId) {
    const config = AK_CONFIG[type];
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    tbody.innerHTML = '';

    let dataArray = (type === 'Jurnal') ? (appData.jurnal || []) : (appData.akademik?.[type.toLowerCase()] || []);

    if (dataArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${config.headers.length + 1}" class="p-8 text-center text-slate-500 font-medium">Belum ada data ${config.title}.</td></tr>`;
        return;
    }

    dataArray.forEach(item => {
        let rowHTML = '';
        config.headers.forEach(header => {
            let key = formatHeaderToKey(header);
            let val = item[key] || item[header.toLowerCase()] || '-';
            
            if (type === 'Nilai' && header === 'Nilai Angka') {
                let color = parseFloat(val) < 70 ? 'text-red-500' : 'text-green-500';
                val = `<span class="font-bold ${color}">${val}</span>`;
            }

            rowHTML += `<td class="p-3 border-b border-slate-100 dark:border-slate-700">${val}</td>`;
        });

        const stringifiedItem = escapeHTML(JSON.stringify(item));
        const recordId = item.id || item.ID || item.iD || '';
        
        rowHTML += `
            <td class="p-3 border-b border-slate-100 dark:border-slate-700 text-center">
                <button onclick="openAkademikModal('${type}', '${stringifiedItem}')" class="text-blue-500 hover:text-blue-700 mx-1 p-1" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteAkademikData('${config.sheet}', '${recordId}')" class="text-red-500 hover:text-red-700 mx-1 p-1" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
}

function renderBankModul() {
    const container = document.getElementById('grid-ak-modul');
    if (!container) return;
    container.innerHTML = '';
    
    const moduls = appData.akademik?.modul || [];

    if (moduls.length === 0) {
        container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">Belum ada modul yang diunggah.</div>';
        return;
    }

    moduls.forEach(m => {
        const stringifiedItem = escapeHTML(JSON.stringify(m));
        const recordId = m.id || m.ID || m.iD || '';
        
        container.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button onclick="openAkademikModal('Modul', '${stringifiedItem}')" class="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded"><i class="fa-solid fa-pen text-xs"></i></button>
                    <button onclick="deleteAkademikData('${AK_CONFIG['Modul'].sheet}', '${recordId}')" class="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded"><i class="fa-solid fa-trash text-xs"></i></button>
                </div>
                <div>
                    <div class="flex items-center mb-3">
                        <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center text-xl mr-3"><i class="fa-solid fa-file-pdf"></i></div>
                        <div>
                            <span class="text-xs font-bold text-orange-500 uppercase tracking-wider">${escapeHTML(m.mataPelajaran)}</span>
                            <h4 class="font-bold text-sm leading-tight">${escapeHTML(m.judulModul)}</h4>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span class="text-xs text-slate-500"><i class="fa-solid fa-upload mr-1"></i> ${escapeHTML(m.pengunggah)}</span>
                    <a href="${escapeHTML(m.linkUnduh)}" target="_blank" class="text-sm font-bold text-blue-600 hover:text-blue-800"><i class="fa-solid fa-download mr-1"></i> Unduh</a>
                </div>
            </div>
        `;
    });
}

function openAkademikModal(type, itemJsonString = null) {
    currentAkademikModalType = type;
    const config = AK_CONFIG[type];
    
    document.getElementById('form-crud').onsubmit = handleAkademikSubmit;

    const modalTitle = document.getElementById('crud-modal-title');
    const container = document.getElementById('crud-dynamic-inputs');
    const quillContainer = document.getElementById('crud-quill-container'); 
    
    container.innerHTML = '';
    quillContainer.classList.add('hidden'); 

    let isEdit = false;
    let itemData = {};

    if (itemJsonString) {
        const unescapedString = String(itemJsonString).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        itemData = JSON.parse(unescapedString);
        isEdit = true;
        modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i> Edit Data ${config.title}`;
    } else {
        modalTitle.innerHTML = `<i class="fa-solid fa-plus-circle mr-2"></i> Input ${config.title}`;
    }

    const recordIdValue = itemData.id || itemData.ID || itemData.iD || '';
    container.innerHTML += `<input type="hidden" id="crud-id" value="${recordIdValue}">`;

    if (type === 'Jadwal') {
        const dataMapel = appData.dataMaster?.mapel || [];
        const dataKelas = appData.dataMaster?.kelas || [];

        let mapelOptions = `<option value="">-- Pilih Mata Pelajaran --</option>`;
        dataMapel.forEach(m => {
            let isSelected = itemData.mataPelajaran === m.namaMapel ? 'selected' : '';
            mapelOptions += `<option value="${escapeHTML(m.namaMapel)}" ${isSelected}>${escapeHTML(m.namaMapel)}</option>`;
        });

        let kelasOptions = `<option value="">-- Pilih Kelas / Ruangan --</option>`;
        dataKelas.forEach(k => {
            let isSelected = itemData.kelasRuang === k.namaKelas ? 'selected' : '';
            kelasOptions += `<option value="${escapeHTML(k.namaKelas)}" ${isSelected}>${escapeHTML(k.namaKelas)}</option>`;
        });

        // 3. KUMPULKAN GURU DENGAN LIVE QUOTA
        const pegawais = appData.dataMaster?.pegawai || [];
        const daftarGuru = pegawais.filter(p => p.jabatan && p.jabatan.toLowerCase().includes('guru'));
        let guruOptions = `<option value="">-- Pilih Guru Pengajar --</option>`;
        
        const existingJadwal = [...(appData.akademik?.jadwal || []), ...jadwalCart];
        
        daftarGuru.forEach(p => {
            const jamTerpakai = existingJadwal.filter(j => j.guruPengajar === p.nama).reduce((sum, curr) => sum + (parseInt(curr.jumlahJp) || 1), 0);
            const kuotaMax = parseInt(p.kuotaJam || p.kuota_jam || 0);
            const sisaJam = kuotaMax - jamTerpakai;
            
            let isSelected = itemData.guruPengajar === p.nama ? 'selected' : '';
            let disabledAttr = (sisaJam <= 0 && !isSelected) ? 'disabled' : ''; 
            
            guruOptions += `<option value="${escapeHTML(p.nama)}" ${isSelected} ${disabledAttr} class="${sisaJam <= 0 ? 'bg-red-50 text-red-600' : ''}">
                ${escapeHTML(p.nama)} (Sisa: ${sisaJam} Jam) ${sisaJam <= 0 ? '- PENUH' : ''}
            </option>`;
        });

        // ==========================================================
        // 4. MESIN WAKTU CERDAS: GENERATOR JAM KBM (DENGAN MULTI-JP)
        // ==========================================================
        const lembaga = appData.dataMaster?.lembaga?.[0] || {};
        
        const parseToMins = (str) => {
            if(!str) return null;
            let m = String(str).match(/([0-9]{1,2}):([0-9]{2})/);
            return m ? parseInt(m[1])*60 + parseInt(m[2]) : null;
        };
        const formatMins = (mins) => {
            let h = Math.floor(mins / 60).toString().padStart(2, '0');
            let m = (mins % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
        };
        const parseBreak = (str) => {
            if (!str) return null;
            let parts = String(str).split('-');
            if (parts.length !== 2) return null;
            let start = parseToMins(parts[0]);
            let end = parseToMins(parts[1]);
            return (start !== null && end !== null) ? { start, end, label: str } : null;
        };

        window.tempSlotsKbm1 = [];
        window.tempSlotsKbm2 = [];
        window.tempSlotsLain = [];
        window.tempCurrentJam = itemData.jam || '';

        // A. KALKULASI KBM UMUM
        let startKbm1 = parseToMins(lembaga.jamMulaiKbm1);
        let endKbm1 = parseToMins(lembaga.jamPulangKbm1);
        let dur1 = parseInt(String(lembaga.durasiKbm1 || '').replace(/[^0-9]/g, ''));
        if (startKbm1 !== null && endKbm1 !== null && dur1) {
            let breaks1 = [];
            [lembaga.waktuIstirahat11, lembaga.waktuIstirahat12, lembaga.waktuIstirahat13].forEach(bStr => {
                let b = parseBreak(bStr); if (b) breaks1.push(b);
            });
            let curr = startKbm1; let jamKe = 1; let maxLoop = 0;
            while (curr + dur1 <= endKbm1 && maxLoop < 30) {
                maxLoop++;
                let isBreak = false;
                for (let b of breaks1) {
                    if (curr >= b.start && curr < b.end) { curr = b.end; isBreak = true; break; }
                }
                if (isBreak) continue;
                let next = curr + dur1;
                if (next > endKbm1) break;
                
                window.tempSlotsKbm1.push({ jamKe, start: curr, end: next });
                curr = next; jamKe++;
            }
        }

        // B. KALKULASI KBM TAHFIDZ
        let startKbm2 = parseToMins(lembaga.jamMulaiKbm2);
        let endKbm2 = parseToMins(lembaga.jamPulangKbm2);
        let dur2 = parseInt(String(lembaga.durasiKbm2 || '').replace(/[^0-9]/g, ''));
        if (startKbm2 !== null && endKbm2 !== null && dur2) {
            let breaks2 = [];
            [lembaga.waktuIstirahat21, lembaga.waktuIstirahat22, lembaga.waktuIstirahat23].forEach(bStr => {
                let b = parseBreak(bStr); if (b) breaks2.push(b);
            });
            let curr = startKbm2; let jamKe = 1; let maxLoop = 0;
            while (curr + dur2 <= endKbm2 && maxLoop < 30) {
                maxLoop++;
                let isBreak = false;
                for (let b of breaks2) {
                    if (curr >= b.start && curr < b.end) { curr = b.end; isBreak = true; break; }
                }
                if (isBreak) continue;
                let next = curr + dur2;
                if (next > endKbm2) break;
                
                window.tempSlotsKbm2.push({ jamKe, start: curr, end: next });
                curr = next; jamKe++;
            }
        }

        // C. KALKULASI ISTIRAHAT
        const allBreaksStr = [lembaga.waktuIstirahat11, lembaga.waktuIstirahat12, lembaga.waktuIstirahat13, lembaga.waktuIstirahat21, lembaga.waktuIstirahat22, lembaga.waktuIstirahat23];
        let istCount = 1;
        allBreaksStr.forEach(bStr => {
             if (bStr && String(bStr).includes('-')) {
                  window.tempSlotsLain.push(`Istirahat ${istCount} (${String(bStr).trim()})`);
                  istCount++;
             }
        });
        window.tempSlotsLain.push('Istirahat / ISHOMA', 'Ekstrakurikuler', 'Kegiatan Mandiri');

        // Fungsi suntik opsi jam dinamis
        window.renderJamDropdown = function() {
            const jp = parseInt(document.getElementById('crud-jumlahJp').value) || 1;
            let html = '<option value="">-- Silakan Pilih Waktu KBM --</option>';

            if (window.tempSlotsKbm1.length > 0) {
                html += '<optgroup label="Slot KBM Umum (Otomatis)">';
                for (let i = 0; i <= window.tempSlotsKbm1.length - jp; i++) {
                    let first = window.tempSlotsKbm1[i];
                    let last = window.tempSlotsKbm1[i + jp - 1];
                    let label = jp > 1 
                        ? `Jam ke-${first.jamKe} s/d ${last.jamKe} (${formatMins(first.start)} - ${formatMins(last.end)})` 
                        : `Jam ke-${first.jamKe} (${formatMins(first.start)} - ${formatMins(first.end)})`;
                    let isSel = (window.tempCurrentJam === label) ? 'selected' : '';
                    html += `<option value="${label}" ${isSel}>${label}</option>`;
                }
                html += '</optgroup>';
            }

            if (window.tempSlotsKbm2.length > 0) {
                html += '<optgroup label="Slot Tahfidz/Agama (Otomatis)">';
                for (let i = 0; i <= window.tempSlotsKbm2.length - jp; i++) {
                    let first = window.tempSlotsKbm2[i];
                    let last = window.tempSlotsKbm2[i + jp - 1];
                    let label = jp > 1 
                        ? `Tahfidz ke-${first.jamKe} s/d ${last.jamKe} (${formatMins(first.start)} - ${formatMins(last.end)})` 
                        : `Tahfidz ke-${first.jamKe} (${formatMins(first.start)} - ${formatMins(first.end)})`;
                    let isSel = (window.tempCurrentJam === label) ? 'selected' : '';
                    html += `<option value="${label}" ${isSel}>${label}</option>`;
                }
                html += '</optgroup>';
            }

            html += '<optgroup label="Waktu Istirahat & Kegiatan Lain">';
            window.tempSlotsLain.forEach(label => {
                let isSel = (window.tempCurrentJam === label) ? 'selected' : '';
                html += `<option value="${label}" ${isSel}>${label}</option>`;
            });
            html += '</optgroup>';

            const elJam = document.getElementById('crud-jam');
            if(elJam) elJam.innerHTML = html;
        };

        // PERBAIKAN: Konversi tipe data agar Javascript mengenalinya dengan akurat
        const savedJp = String(itemData.jumlahJp || '1');

        container.innerHTML += `
            <div class="mb-3">
                <label class="block text-sm font-bold mb-1"><i class="fa-solid fa-book mr-1 text-blue-500"></i> Mata Pelajaran / Kegiatan</label>
                <select id="crud-mataPelajaran" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary">
                    ${mapelOptions}
                </select>
            </div>
            
            <div class="mb-3">
                <label class="block text-sm font-bold mb-1 text-blue-600 dark:text-blue-400"><i class="fa-solid fa-chalkboard-user mr-1"></i> Guru Pengajar / Pembina</label>
                <select id="crud-guruPengajar" class="w-full p-2 border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/20 font-medium outline-none focus:ring-2 focus:ring-blue-500">
                    ${guruOptions}
                </select>
            </div>

            <div class="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div class="sm:col-span-1">
                    <label class="block text-sm font-bold mb-1">Hari</label>
                    <select id="crud-hari" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary font-bold">
                        <option value="Senin" ${itemData.hari === 'Senin' ? 'selected' : ''}>Senin</option>
                        <option value="Selasa" ${itemData.hari === 'Selasa' ? 'selected' : ''}>Selasa</option>
                        <option value="Rabu" ${itemData.hari === 'Rabu' ? 'selected' : ''}>Rabu</option>
                        <option value="Kamis" ${itemData.hari === 'Kamis' ? 'selected' : ''}>Kamis</option>
                        <option value="Jumat" ${itemData.hari === 'Jumat' ? 'selected' : ''}>Jumat</option>
                        <option value="Sabtu" ${itemData.hari === 'Sabtu' ? 'selected' : ''}>Sabtu</option>
                        <option value="Ahad" ${itemData.hari === 'Ahad' ? 'selected' : ''}>Ahad / Minggu</option>
                    </select>
                </div>
                <div class="sm:col-span-1">
                    <label class="block text-sm font-bold mb-1 text-emerald-600 dark:text-emerald-400">Berapa JP?</label>
                    <select id="crud-jumlahJp" onchange="window.renderJamDropdown()" class="w-full p-2 border border-emerald-300 dark:border-emerald-600 rounded bg-emerald-50 dark:bg-emerald-900/20 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                        <option value="1" ${savedJp === '1' ? 'selected' : ''}>1 JP</option>
                        <option value="2" ${savedJp === '2' ? 'selected' : ''}>2 JP</option>
                        <option value="3" ${savedJp === '3' ? 'selected' : ''}>3 JP</option>
                        <option value="4" ${savedJp === '4' ? 'selected' : ''}>4 JP</option>
                        <option value="5" ${savedJp === '5' ? 'selected' : ''}>5 JP</option>
                        <option value="6" ${savedJp === '6' ? 'selected' : ''}>6 JP</option>
                    </select>
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-sm font-bold mb-1">Pilih Jam Tersedia</label>
                    <select id="crud-jam" class="w-full p-2 border border-indigo-300 dark:border-indigo-600 rounded bg-indigo-50 dark:bg-indigo-900/20 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer">
                    </select>
                </div>
            </div>

            <div class="mb-2">
                <label class="block text-sm font-bold mb-1"><i class="fa-solid fa-door-open mr-1 text-orange-500"></i> Kelas / Ruangan / Tempat</label>
                <select id="crud-kelasRuang" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary">
                    ${kelasOptions}
                </select>
            </div>
        `;
        setTimeout(() => window.renderJamDropdown(), 100);
    }
    toggleModal('modal-crud');
}

async function handleAkademikSubmit(event) {
    event.preventDefault();
    
    const type = currentAkademikModalType; 
    const sheetName = type === 'Jadwal' ? 'Akademik_Jadwal' : 'Akademik_Nilai';
    const idElement = document.getElementById('crud-id');
    const recordId = idElement ? idElement.value : '';
    const isUpdate = recordId !== '';

    const payloadData = {
        mataPelajaran: document.getElementById('crud-mataPelajaran').value,
        guruPengajar: document.getElementById('crud-guruPengajar').value,
        hari: document.getElementById('crud-hari').value,
        jumlahJp: document.getElementById('crud-jumlahJp')?.value || '1',
        jam: document.getElementById('crud-jam').value,
        kelasRuang: document.getElementById('crud-kelasRuang').value
    };

    // SATPAM ANTI-BENTROK KELAS & JAM
    if (type === 'Jadwal') {
        const allJadwal = [...(appData.akademik?.jadwal || []), ...jadwalCart];
        const isConflict = allJadwal.find(j => 
            j.hari === payloadData.hari && 
            j.jam === payloadData.jam && 
            j.kelasRuang === payloadData.kelasRuang &&
            String(j.id || j.ID || j.iD || '') !== String(recordId) && 
            String(j._cartId || '') !== String(recordId) 
        );

        if (isConflict) {
            alert(`BENTROK! Ruang ${payloadData.kelasRuang} sudah memiliki KBM pada Hari ${payloadData.hari} ${payloadData.jam}.\n\nSilakan pilih waktu atau kelas lain.`);
            return; 
        }
    }

    // MASUKKAN KE KERANJANG DRAFT (DRAFT MODE)
    if (type === 'Jadwal' && !isUpdate) {
        payloadData._isDraft = true; 
        payloadData._cartId = Date.now(); 
        
        jadwalCart.push(payloadData); 
        toggleModal('modal-crud'); 
        renderMingguanKBM(); 
        return; 
    }

    if(typeof showGlobalLoading === "function") showGlobalLoading("Menyimpan Perubahan...");
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: isUpdate ? 'crudUpdate' : 'crudCreate', payload: { sheetName: sheetName, id: recordId, data: payloadData } })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            toggleModal('modal-crud');
            localStorage.removeItem(`portal_appData_${currentUser.username}`);
            await loadAppData(); 
            if(typeof renderAkademikData === "function") renderAkademikData();
            if(typeof hideGlobalLoading === "function") hideGlobalLoading();
            alert("Berhasil diperbarui.");
        } else {
            if(typeof hideGlobalLoading === "function") hideGlobalLoading();
            alert("Gagal menyimpan: " + result.message);
        }
    } catch (error) {
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        alert("Kesalahan koneksi.");
    }
}

async function deleteAkademikData(sheetName, id) {
    if (!confirm("PERINGATAN: Anda yakin ingin menghapus data ini secara permanen?")) return;
    try {
        if(typeof showGlobalLoading === "function") showGlobalLoading('Menghapus Data...');
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudDelete', payload: { sheetName: sheetName, id: id } })
        });
        const result = await response.json();
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        
        if (result.status === 'success') {
            localStorage.removeItem(`portal_appData_${currentUser.username}`);
            await loadAppData();
            renderMingguanKBM();
        } else alert('Gagal: ' + result.message);
    } catch (error) { 
        if(typeof hideGlobalLoading === "function") hideGlobalLoading(); alert('Kesalahan koneksi.'); 
    } 
}

function removeJadwalDraft(cartId) {
    jadwalCart = jadwalCart.filter(j => j._cartId !== cartId);
    renderMingguanKBM(); 
}

async function submitBulkJadwal() {
    if (jadwalCart.length === 0) return;
    
    if(typeof showGlobalLoading === "function") showGlobalLoading(`Mengirim ${jadwalCart.length} Jadwal ke Database...`);

    try {
        for (let i = 0; i < jadwalCart.length; i++) {
            let payloadData = { ...jadwalCart[i] };
            delete payloadData._isDraft; 
            delete payloadData._cartId;
            
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Akademik_Jadwal', data: payloadData } })
            });
        }
        
        jadwalCart = []; 
        localStorage.removeItem(`portal_appData_${currentUser.username}`);
        await loadAppData(); 
        renderMingguanKBM();
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        alert("Luar Biasa! Seluruh jadwal berhasil disimpan secara massal.");
    } catch (e) {
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        alert("Gagal memproses jadwal: " + e.message);
    }
}

function renderMingguanKBM() {
    const container = document.getElementById('ak-tab-jadwal'); 
    if (!container) return;

    const dataKelas = appData.dataMaster?.kelas || [];
    const lembaga = appData.dataMaster?.lembaga?.[0] || {};
    
    const kelompokSet = new Set();
    dataKelas.forEach(k => { if(k.kelompokKelas) kelompokSet.add(k.kelompokKelas.trim()); });
    const listKelompok = Array.from(kelompokSet).sort();

    let filteredDataKelas = dataKelas;
    if (filterAkademikKelompok !== 'Semua') {
        filteredDataKelas = dataKelas.filter(k => k.kelompokKelas?.trim() === filterAkademikKelompok);
    }
    const listRuang = filteredDataKelas.map(k => k.namaKelas).sort();

    let allJadwal = [...(appData.akademik?.jadwal || []), ...jadwalCart];
    
    // Filter Kelompok & Ruang
    if (filterAkademikRuang !== 'Semua') {
        allJadwal = allJadwal.filter(j => j.kelasRuang === filterAkademikRuang);
    } else if (filterAkademikKelompok !== 'Semua') {
        const validRuang = new Set(listRuang);
        allJadwal = allJadwal.filter(j => validRuang.has(j.kelasRuang));
    }

    // Filter Tipe Pelajaran
    if (filterAkademikTipe === 'Tahfidz') {
        allJadwal = allJadwal.filter(j => j.jam.includes('Tahfidz') || j.jam.includes('Agama'));
    } else if (filterAkademikTipe === 'Ekskul') {
        allJadwal = allJadwal.filter(j => j.jam.includes('Ekskul') || j.jam.includes('Ekstra'));
    } else if (filterAkademikTipe === 'Umum') {
        allJadwal = allJadwal.filter(j => !j.jam.includes('Tahfidz') && !j.jam.includes('Agama') && !j.jam.includes('Ekskul') && !j.jam.includes('Ekstra') && !j.jam.includes('Istirahat'));
    }

    // Detektor Hari Libur dari Lembaga
    const liburConfig = lembaga.hariLibur || '';
    const cekHariLibur = (hari) => {
        if (liburConfig.includes(hari)) return true;
        if (liburConfig === "Sabtu-Ahad" && (hari === 'Sabtu' || hari === 'Ahad')) return true;
        let pJumat = hari === 'Jumat' || hari === "Jum'at";
        if (liburConfig === "Jum'at dan Ahad" && (pJumat || hari === 'Ahad')) return true;
        if (liburConfig === "Jum'at dan Sabtu" && (pJumat || hari === 'Sabtu')) return true;
        if (liburConfig === "Hanya Jum'at" && pJumat) return true;
        return false;
    };

    // Pengurut Waktu Otomatis
    const getSortValue = (str) => {
        const m = String(str).match(/([0-9]{2}):([0-9]{2})/);
        return m ? parseInt(m[1])*60 + parseInt(m[2]) : 9999;
    };

    const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

    let html = `
        <div class="flex flex-col w-full space-y-4">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 gap-3 no-print">
                <h3 class="font-bold text-lg"><i class="fa-solid fa-calendar-week mr-2 text-blue-500"></i>Tampilan Jadwal Mingguan</h3>
                <div class="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onclick="window.print()" class="bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 shadow-md transition-transform active:scale-95 flex-1 sm:flex-none">
                        <i class="fa-solid fa-file-pdf mr-1"></i> Cetak / PDF
                    </button>
                    <button onclick="openAkademikModal('Jadwal')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-transform active:scale-95 flex-1 sm:flex-none">
                        <i class="fa-solid fa-plus mr-1"></i> Tambah KBM
                    </button>
                    ${jadwalCart.length > 0 ? `
                    <button onclick="submitBulkJadwal()" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-md transition-transform active:scale-95 animate-pulse w-full sm:w-auto">
                        <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Simpan ${jadwalCart.length} Jadwal
                    </button>` : ''}
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm animate-fade-in no-print">
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider mb-1 text-indigo-500">Kelompok Kelas</label>
                    <select onchange="gantiFilterJadwal('kelompok', this.value)" class="w-full p-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg outline-none font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 cursor-pointer shadow-sm">
                        <option value="Semua" ${filterAkademikKelompok === 'Semua' ? 'selected' : ''}>Semua Kelompok</option>
                        ${listKelompok.map(k => `<option value="${escapeHTML(k)}" ${filterAkademikKelompok === k ? 'selected' : ''}>${escapeHTML(k)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider mb-1 text-orange-500">Ruang Kelas</label>
                    <select onchange="gantiFilterJadwal('ruang', this.value)" class="w-full p-2 text-sm border border-orange-200 dark:border-orange-700 rounded-lg outline-none font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800 cursor-pointer shadow-sm">
                        <option value="Semua" ${filterAkademikRuang === 'Semua' ? 'selected' : ''}>Semua Ruangan</option>
                        ${listRuang.map(r => `<option value="${escapeHTML(r)}" ${filterAkademikRuang === r ? 'selected' : ''}>${escapeHTML(r)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider mb-1 text-green-500">Tipe Pelajaran</label>
                    <select onchange="gantiFilterJadwal('tipe', this.value)" class="w-full p-2 text-sm border border-green-200 dark:border-green-700 rounded-lg outline-none font-bold text-green-600 dark:text-green-400 bg-white dark:bg-slate-800 cursor-pointer shadow-sm">
                        <option value="Semua" ${filterAkademikTipe === 'Semua' ? 'selected' : ''}>Semua Tipe Jadwal</option>
                        <option value="Umum" ${filterAkademikTipe === 'Umum' ? 'selected' : ''}>KBM Umum</option>
                        <option value="Tahfidz" ${filterAkademikTipe === 'Tahfidz' ? 'selected' : ''}>KBM Tahfidz / Agama</option>
                        <option value="Ekskul" ${filterAkademikTipe === 'Ekskul' ? 'selected' : ''}>Ekstrakurikuler / Mandiri</option>
                    </select>
                </div>
            </div>
            
            <style>@media print { .no-print { display: none !important; } }</style>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
    `;

    hariList.forEach(hari => {
        const jadwalHari = allJadwal.filter(j => j.hari === hari || (hari === 'Ahad' && j.hari === 'Minggu')).sort((a, b) => getSortValue(a.jam) - getSortValue(b.jam));
        const isHoliday = cekHariLibur(hari);
        const headerColor = isHoliday ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400';
        const bgCard = isHoliday ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';

        html += `
            <div class="${bgCard} border rounded-xl p-3 flex flex-col h-full">
                <div class="text-center font-black text-sm uppercase tracking-widest mb-3 pb-2 border-b border-slate-200 dark:border-slate-700 ${headerColor}">
                    ${hari} ${isHoliday ? '<br><span class="text-[9px] bg-red-200 text-red-700 px-2 py-0.5 rounded-full mt-1 inline-block">LIBUR</span>' : ''}
                </div>
                <div class="space-y-2 flex-1">
        `;

        if (jadwalHari.length === 0) {
            html += `<p class="text-[10px] text-slate-400 italic text-center py-4">Kosong</p>`;
        } else {
            jadwalHari.forEach(j => {
                const isDraft = j._isDraft;
                let itemBg = 'bg-white dark:bg-slate-800';
                let itemBorder = 'border-slate-100 dark:border-slate-700';
                let iconColor = 'text-blue-500';

                // COLOR CODING BERDASARKAN TIPE JAM
                if (j.jam.includes('Istirahat')) {
                    itemBg = 'bg-yellow-100 dark:bg-yellow-900/40';
                    itemBorder = 'border-yellow-300 dark:border-yellow-600';
                    iconColor = 'text-yellow-600';
                } else if (j.jam.includes('Tahfidz') || j.jam.includes('Agama')) {
                    itemBg = 'bg-emerald-100 dark:bg-emerald-900/40';
                    itemBorder = 'border-emerald-300 dark:border-emerald-600';
                    iconColor = 'text-emerald-600';
                } else if (j.jam.includes('Ekskul') || j.jam.includes('Mandiri')) {
                    itemBg = 'bg-fuchsia-50 dark:bg-fuchsia-900/30';
                    itemBorder = 'border-fuchsia-200 dark:border-fuchsia-600';
                    iconColor = 'text-fuchsia-500';
                }

                if (isDraft) itemBorder = 'border-amber-500 border-2 border-dashed';
                const draftBadge = isDraft ? '<div class="absolute -top-2 -right-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow z-10">DRAFT</div>' : '';

                html += `
                    <div class="${itemBg} ${itemBorder} border p-2 rounded-lg shadow-sm text-[11px] relative group transition-all">
                        ${draftBadge}
                        <div class="font-bold text-slate-800 dark:text-white leading-tight pr-4">${escapeHTML(j.mataPelajaran)}</div>
                        <div class="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">${escapeHTML(j.jam)}</div>
                        
                        ${j.guruPengajar ? `<div class="text-slate-600 mt-1 truncate"><i class="fa-solid fa-user-tie scale-75 mr-1 ${iconColor}"></i>${escapeHTML(j.guruPengajar)}</div>` : ''}
                        ${j.kelasRuang ? `<div class="text-slate-600 truncate"><i class="fa-solid fa-door-open scale-75 mr-1 text-orange-400"></i>${escapeHTML(j.kelasRuang)}</div>` : ''}
                        
                        <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 no-print">
                            ${isDraft 
                                ? `<button onclick="removeJadwalDraft(${j._cartId})" class="text-red-600 p-1 bg-red-100 dark:bg-red-900/50 rounded shadow-sm" title="Batal Masukkan"><i class="fa-solid fa-times"></i></button>`
                                : `<button onclick="openAkademikModal('Jadwal', '${escapeHTML(JSON.stringify(j))}')" class="text-blue-500 p-1 bg-blue-50 dark:bg-slate-700 rounded"><i class="fa-solid fa-pen"></i></button>
                                   <button onclick="deleteAkademikData('Akademik_Jadwal', '${j.id || j.ID || j.iD}')" class="text-red-500 p-1 bg-red-50 dark:bg-slate-700 rounded"><i class="fa-solid fa-trash"></i></button>`
                            }
                        </div>
                    </div>
                `;
            });
        }
        html += `</div></div>`;
    });

    if (jadwalCart.length > 0) {
        html += `
            <div class="col-span-full mt-6 mb-4 flex justify-end animate-slide-up no-print">
                <button onclick="submitBulkJadwal()" class="bg-green-600 w-full sm:w-auto text-white px-8 py-4 rounded-xl font-black hover:bg-green-700 shadow-xl transition-transform active:scale-95 text-lg flex items-center justify-center">
                    <i class="fa-solid fa-cloud-arrow-up mr-3 text-2xl"></i> SIMPAN SEMUA JADWAL KE DATABASE
                </button>
            </div>
        `;
    }

    html += `</div></div>`;
    container.innerHTML = html;
}