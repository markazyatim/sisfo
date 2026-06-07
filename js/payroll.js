// ==============================================================================
// FILE: PAYROLL.JS (SISTEM PENGGAJIAN MULTI-LOGIKA, JTM GURU, & AUTO-RUPIAH)
// ==============================================================================

// Helper lokal agar nilai uang langsung bertitik saat pertama kali form dibuka
const formatRpInput = (val) => typeof formatAngkaRibuan === 'function' ? formatAngkaRibuan(String(val)) : val;

function initPayrollPage() {
    const isKeuangan = currentUser.role === 'admin' || (currentUser.jabatan && (currentUser.jabatan.toLowerCase().includes('bendahara') || currentUser.jabatan.toLowerCase().includes('keuangan') || currentUser.jabatan.toLowerCase().includes('ketua yayasan')));
    if (isKeuangan) renderAdminPayrollView();
    else initUserSlipGaji();
}

// ==========================================
// 1. TAMPILAN ADMIN PAYROLL & LIST PEGAWAI
// ==========================================
function renderAdminPayrollView() {
    const targetId = 'payroll-module-container';
    let container = document.getElementById(targetId);
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in p-4 sm:p-8">
            <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-coins text-amber-500 mr-2"></i>Panel Keuangan & Payroll</h2>
                        <p class="text-sm text-slate-500">Kelola konfigurasi gaji dan terbitkan slip gaji bulanan.</p>
                    </div>
                    <div class="flex space-x-2 w-full sm:w-auto">
                        <button onclick="bukaModalTutupBuku()" class="flex-1 sm:flex-none bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-amber-600 transition-transform active:scale-95"><i class="fa-solid fa-calculator mr-2"></i> Tutup Buku Bulanan</button>
                        <button onclick="renderUserSlipView(true)" class="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-transform active:scale-95"><i class="fa-solid fa-file-invoice-dollar mr-2"></i> Arsip Slip Gaji</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p class="text-xs font-bold text-blue-600 uppercase">Total Pegawai</p>
                        <p class="text-2xl font-black">${appData.dataMaster.pegawai.length}</p>
                    </div>
                    <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <p class="text-xs font-bold text-green-600 uppercase">Periode Aktif</p>
                        <p class="text-2xl font-black">${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left text-sm whitespace-nowrap">
                        <thead class="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th class="p-3 rounded-tl-lg">Nama Pegawai</th>
                                <th class="p-3">Jabatan</th>
                                <th class="p-3">Status Config</th>
                                <th class="p-3 text-right rounded-tr-lg">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="payroll-pegawai-list" class="divide-y divide-slate-100 dark:divide-slate-700"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const tbody = document.getElementById('payroll-pegawai-list');
    appData.dataMaster.pegawai.forEach(peg => {
        const hasConfig = peg.configGaji ? '<span class="text-green-500 font-bold"><i class="fa-solid fa-check-circle mr-1"></i> Diatur</span>' : '<span class="text-amber-500 font-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i> Belum</span>';
        const recordId = peg.id || peg.ID || peg.iD || ''; 
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="p-3 font-bold text-slate-800 dark:text-white">${escapeHTML(peg.nama)}</td>
                <td class="p-3 text-xs text-slate-500">${escapeHTML(peg.jabatan || '-')}</td>
                <td class="p-3 text-xs">${hasConfig}</td>
                <td class="p-3 text-right">
                    <button onclick="openPayrollConfigModal('${recordId}')" class="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-95"><i class="fa-solid fa-gears mr-1"></i> Setting Gaji</button>
                </td>
            </tr>
        `;
    });
}

// ==========================================
// 2. MODAL SETTING & MESIN UI DINAMIS GURU
// ==========================================
window.renderGajiGuruUI = function(tipe, jabId, nom=0, nom2=0, batas=0) {
    const wrap = document.getElementById(`guru-config-wrap-${jabId}`);
    if (!wrap) return;

    let html = '';
    
    if (tipe === 'Paket Flat Bulanan') {
        html = `
            <div class="mt-3 p-4 bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 rounded-xl shadow-inner">
                <h5 class="font-black text-sm text-slate-800 dark:text-white mb-2">1. Sistem JTM Paket Bulanan (Flat Per Bulan)</h5>
                <div class="text-[11px] text-slate-600 dark:text-slate-400 mb-4 space-y-2 leading-relaxed">
                    <p>Pada sistem ini, jumlah jam mengajar dikunci di awal semester berdasarkan jadwal. Angka ini dijadikan acuan tetap, tidak peduli ada tanggal merah atau libur ujian.</p>
                    <p class="font-bold text-slate-800 dark:text-white">Logika Hitung: (JTM Terjadwal 1 Minggu) x (Tarif per JTM) x 4 Minggu.</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Tarif per 1 JTM</label>
                        <div class="relative">
                            <span class="absolute left-2 top-2 text-xs font-bold text-slate-400">Rp</span>
                            <input type="text" id="pay-gaji-nom-${jabId}" value="${formatRpInput(nom)}" class="input-rupiah w-full pl-8 p-2 border border-slate-300 rounded font-bold text-sm bg-white outline-none focus:border-indigo-500 text-slate-800">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Total JTM Terjadwal / Minggu</label>
                        <div class="relative">
                            <input type="number" id="pay-gaji-batas-${jabId}" value="${batas}" placeholder="Cth: 10" class="w-full p-2 border border-slate-300 rounded font-bold text-sm bg-white outline-none focus:border-indigo-500 text-slate-800">
                            <span class="absolute right-3 top-2 text-xs font-bold text-slate-400">JTM</span>
                        </div>
                    </div>
                </div>
            </div>`;
    } 
    else if (tipe === 'Realisasi Aktual JTM') {
        html = `
            <div class="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-inner">
                <h5 class="font-black text-sm text-amber-800 mb-2">2. Sistem JTM Realisasi Aktual (Presensi Kelas)</h5>
                <div class="text-[11px] text-amber-700 mb-4 space-y-2 leading-relaxed">
                    <p>Sistem ini murni "no work, no pay". Gaji dihitung berdasarkan jumlah JP/Sesi yang benar-benar diisi secara aktual oleh guru dari absen kelas.</p>
                    <p class="font-bold">Logika Hitung: (Total JTM Aktual 1 Bulan) x Tarif per JTM.</p>
                </div>
                <div>
                    <label class="block text-xs font-bold mb-1 text-amber-800">Tarif per 1 JTM Aktual</label>
                    <div class="relative">
                        <span class="absolute left-2 top-2 text-xs font-bold text-amber-500">Rp</span>
                        <input type="text" id="pay-gaji-nom-${jabId}" value="${formatRpInput(nom)}" class="input-rupiah w-full pl-8 p-2 border border-amber-300 rounded font-bold text-sm bg-white outline-none focus:border-amber-500 text-slate-800">
                    </div>
                </div>
            </div>`;
    } 
    else if (tipe === 'Progresif Berjenjang') {
        html = `
            <div class="mt-3 p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl shadow-inner">
                <h5 class="font-black text-sm text-fuchsia-800 mb-2">3. Sistem JTM Progresif / Berjenjang (Lembur)</h5>
                <div class="text-[11px] text-fuchsia-700 mb-4 space-y-2 leading-relaxed">
                    <p>Mengapresiasi batas kewajaran mengajar. Jika mengajar melebihi batas standar JTM dalam sebulan, kelebihannya dihitung dengan tarif berbeda (lembur).</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold mb-1 text-fuchsia-800">Tarif Dasar / JTM</label>
                        <div class="relative">
                            <span class="absolute left-2 top-2 text-[10px] font-bold text-fuchsia-400">Rp</span>
                            <input type="text" id="pay-gaji-nom-${jabId}" value="${formatRpInput(nom)}" class="input-rupiah w-full pl-6 p-2 border border-fuchsia-300 rounded font-bold text-xs bg-white outline-none focus:border-fuchsia-500 text-slate-800">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold mb-1 text-fuchsia-800">Batas Normal / Bln</label>
                        <div class="relative">
                            <input type="number" id="pay-gaji-batas-${jabId}" value="${batas}" placeholder="Cth: 24" class="w-full p-2 border border-fuchsia-300 rounded font-bold text-xs bg-white outline-none focus:border-fuchsia-500 text-slate-800">
                            <span class="absolute right-2 top-2 text-[10px] font-bold text-fuchsia-400">JTM</span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold mb-1 text-fuchsia-800">Tarif Lembur / JTM</label>
                        <div class="relative">
                            <span class="absolute left-2 top-2 text-[10px] font-bold text-fuchsia-400">Rp</span>
                            <input type="text" id="pay-gaji-nom2-${jabId}" value="${formatRpInput(nom2)}" class="input-rupiah w-full pl-6 p-2 border border-fuchsia-300 rounded font-bold text-xs bg-fuchsia-100 outline-none focus:border-fuchsia-500 text-slate-800">
                        </div>
                    </div>
                </div>
            </div>`;
    } 
    else if (tipe === 'Hybrid JTM & Hadir') {
        html = `
            <div class="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-inner">
                <h5 class="font-black text-sm text-emerald-800 mb-2">4. Sistem JTM Plus Tunjangan Hadir (Hybrid)</h5>
                <div class="text-[11px] text-emerald-700 mb-4 space-y-2 leading-relaxed">
                    <p>Menggabungkan honor JTM Aktual dengan Uang Kehadiran Harian agar pendapatan stabil meski guru hanya ngajar sebentar di hari tersebut.</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold mb-1 text-emerald-800">Tarif per 1 JTM</label>
                        <div class="relative">
                            <span class="absolute left-2 top-2 text-xs font-bold text-emerald-500">Rp</span>
                            <input type="text" id="pay-gaji-nom-${jabId}" value="${formatRpInput(nom)}" class="input-rupiah w-full pl-8 p-2 border border-emerald-300 rounded font-bold text-sm bg-white outline-none focus:border-emerald-500 text-slate-800">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-emerald-800">Uang Hadir / Hari Datang</label>
                        <div class="relative">
                            <span class="absolute left-2 top-2 text-xs font-bold text-emerald-500">Rp</span>
                            <input type="text" id="pay-gaji-nom2-${jabId}" value="${formatRpInput(nom2)}" class="input-rupiah w-full pl-8 p-2 border border-emerald-300 rounded font-bold text-sm bg-emerald-100 outline-none focus:border-emerald-500 text-slate-800">
                        </div>
                    </div>
                </div>
            </div>`;
    } 
    else if (tipe === 'Sistem Sesi / Bimbel') {
        html = `
            <div class="mt-3 p-4 bg-cyan-50 border border-cyan-200 rounded-xl shadow-inner">
                <h5 class="font-black text-sm text-cyan-800 mb-2">5. Sistem JTM Per Sesi / Pola Bimbel</h5>
                <div class="text-[11px] text-cyan-700 mb-4 space-y-2 leading-relaxed">
                    <p>Dihitung per Sesi absen mengajar yang dilakukan, dengan mengabaikan durasi JP/menit.</p>
                </div>
                <div>
                    <label class="block text-xs font-bold mb-1 text-cyan-800">Tarif per 1 Sesi Masuk Kelas</label>
                    <div class="relative">
                        <span class="absolute left-2 top-2 text-xs font-bold text-cyan-500">Rp</span>
                        <input type="text" id="pay-gaji-nom-${jabId}" value="${formatRpInput(nom)}" class="input-rupiah w-full pl-8 p-2 border border-cyan-300 rounded font-bold text-sm bg-white outline-none focus:border-cyan-500 text-slate-800">
                    </div>
                </div>
            </div>`;
    } 
    else {
        // UI PEGAWAI NON-GURU (UMUM)
        html = `
            <div class="mt-3">
                <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Nominal Gaji</label>
                <div class="relative">
                    <span class="absolute left-2 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input type="text" id="pay-gaji-nom-${jabId}" value="${formatRpInput(nom)}" class="input-rupiah w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded font-bold text-sm bg-white dark:bg-slate-700 outline-none text-slate-800 dark:text-white">
                </div>
            </div>`;
    }
    wrap.innerHTML = html;
};

function openPayrollConfigModal(pegId) {
    const peg = appData.dataMaster.pegawai.find(p => String(p.id || p.ID || p.iD || '') === String(pegId));
    if (!peg) return;

    let config = {};
    try { config = JSON.parse(peg.configGaji || '{}'); } catch(e){}

    let jabatans = peg.jabatan ? peg.jabatan.split(',').map(j => j.trim()).filter(j => j !== '') : [];
    let htmlGajiPokok = '';
    
    if (jabatans.length === 0) {
        htmlGajiPokok = '<p class="text-xs text-amber-500 italic">Pegawai ini belum memiliki jabatan di Data Master.</p>';
    } else {
        jabatans.forEach(jab => {
            let gData = config[jab] || { tipe: 'Per Bulan', nominal: 0, nominal2: 0, batas: 0 };
            const jabId = jab.replace(/[^a-zA-Z0-9]/g, '');
            const safeJab = escapeHTML(jab);
            const isGuru = jab.toLowerCase().includes('guru');

            if (isGuru) {
                const t = gData.tipe;
                htmlGajiPokok += `
                    <div class="mb-4 bg-white dark:bg-slate-800 p-4 border-2 border-indigo-200 dark:border-indigo-900/50 rounded-xl shadow-sm">
                        <span class="text-sm font-black text-indigo-700 dark:text-indigo-400 uppercase mb-3 block border-b border-indigo-100 dark:border-indigo-900 pb-2">
                            <i class="fa-solid fa-chalkboard-user mr-2"></i> Jabatan: ${safeJab}
                        </span>
                        <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Sistem Perhitungan JTM (Guru)</label>
                        <select class="pay-gaji-tipe w-full p-3 border border-indigo-300 dark:border-indigo-600 rounded text-sm bg-indigo-50 dark:bg-indigo-900/20 outline-none font-bold text-indigo-800 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer" data-jabatan="${safeJab}" data-isguru="true" onchange="window.renderGajiGuruUI(this.value, '${jabId}')">
                            <option value="Paket Flat Bulanan" ${t === 'Paket Flat Bulanan' ? 'selected' : ''}>1. Sistem Paket Flat Bulanan</option>
                            <option value="Realisasi Aktual JTM" ${t === 'Realisasi Aktual JTM' ? 'selected' : ''}>2. Sistem Realisasi Aktual JTM (Presensi Kelas)</option>
                            <option value="Progresif Berjenjang" ${t === 'Progresif Berjenjang' ? 'selected' : ''}>3. Sistem Progresif / Berjenjang (Lembur JTM)</option>
                            <option value="Hybrid JTM & Hadir" ${t === 'Hybrid JTM & Hadir' ? 'selected' : ''}>4. Sistem Hybrid (JTM Aktual + Uang Kehadiran Harian)</option>
                            <option value="Sistem Sesi / Bimbel" ${t === 'Sistem Sesi / Bimbel' ? 'selected' : ''}>5. Sistem Per Sesi / Pola Bimbel</option>
                        </select>
                        <div id="guru-config-wrap-${jabId}"></div>
                    </div>
                `;
                setTimeout(() => window.renderGajiGuruUI(gData.tipe || 'Paket Flat Bulanan', jabId, gData.nominal, gData.nominal2, gData.batas), 100);
            } else {
                htmlGajiPokok += `
                    <div class="mb-4 bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <span class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-2 block border-b border-slate-100 dark:border-slate-700 pb-2">${safeJab}</span>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <div class="w-full sm:w-1/2">
                                <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Sistem Perhitungan Umum</label>
                                <select class="pay-gaji-tipe w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none font-bold text-slate-700 dark:text-slate-300" data-jabatan="${safeJab}" data-isguru="false" onchange="window.renderGajiGuruUI(this.value, '${jabId}')">
                                    <option value="Per Bulan" ${gData.tipe === 'Per Bulan' ? 'selected' : ''}>Per Bulan (Tetap)</option>
                                    <option value="Per Hari" ${gData.tipe === 'Per Hari' ? 'selected' : ''}>Per Hari Hadir</option>
                                    <option value="Per Jam" ${gData.tipe === 'Per Jam' ? 'selected' : ''}>Per Jam / Shift</option>
                                    <option value="Per Proyek" ${gData.tipe === 'Per Proyek' ? 'selected' : ''}>Borongan / Proyek</option>
                                </select>
                            </div>
                            <div class="w-full sm:w-1/2" id="guru-config-wrap-${jabId}"></div>
                        </div>
                    </div>
                `;
                setTimeout(() => window.renderGajiGuruUI(gData.tipe || 'Per Bulan', jabId, gData.nominal), 100);
            }
        });
    }

    const modalHTML = `
        <div id="modal-payroll-config" class="fixed inset-0 bg-slate-900/90 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-green-50 dark:bg-green-900/20 shrink-0">
                    <h3 class="font-bold text-green-700 dark:text-green-400 text-lg"><i class="fa-solid fa-cash-register mr-2"></i> Konfigurasi Gaji: ${escapeHTML(peg.nama)}</h3>
                    <button onclick="document.getElementById('modal-payroll-config').remove()" class="text-slate-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-times text-2xl"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div>
                            <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Mulai Berlaku (Bulan)</label>
                            <input type="month" id="pay-gaji-bulan" value="${config.bulanBerlaku || new Date().toISOString().slice(0,7)}" class="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Tanggal Gajian Otomatis (Cth: 1)</label>
                            <input type="number" id="pay-gaji-tanggal" value="${config.tanggalGajian || 1}" class="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none font-medium">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div class="space-y-6">
                            <div>
                                <h4 class="font-black text-sm uppercase text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-200 dark:border-indigo-800 pb-2 mb-4">1. Gaji & Honorarium Utama</h4>
                                ${htmlGajiPokok}
                            </div>
                            
                            <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h4 class="font-black text-sm uppercase text-green-600 dark:text-green-400 border-b-2 border-green-200 dark:border-green-800 pb-2 mb-4">2. Tunjangan & Fasilitas Harian/Bulanan</h4>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    ${renderPayrollInput('Uang Makan', 'tunj-makan', config.tunjangan?.makan)}
                                    ${renderPayrollInput('Uang Transport', 'tunj-transport', config.tunjangan?.transport)}
                                    ${renderPayrollInput('Tunjangan Asrama', 'tunj-asrama', config.tunjangan?.asrama)}
                                    ${renderPayrollInput('Subsidi Listrik', 'tunj-listrik', config.tunjangan?.listrik)}
                                    ${renderPayrollInput('Subsidi Air', 'tunj-air', config.tunjangan?.air)}
                                    ${renderPayrollInput('Subsidi Internet', 'tunj-internet', config.tunjangan?.internet)}
                                    ${renderPayrollInput('Logistik / Sabun', 'tunj-sabun', config.tunjangan?.sabun)}
                                    ${renderPayrollInput('Tunjangan Hari Raya', 'tunj-thr', config.tunjangan?.thr)}
                                </div>
                                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <label class="block text-[10px] font-black text-slate-500 uppercase mb-2">Tunjangan Lainnya (Ketik Manual)</label>
                                    <div class="flex gap-2">
                                        <input type="text" id="pay-tunj-lain-nama" value="${escapeHTML(config.tunjangan?.lainNama || '')}" placeholder="Nama Tunjangan..." class="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none">
                                        <input type="text" id="pay-tunj-lain-nominal" value="${formatRpInput(config.tunjangan?.lainNominal || 0)}" placeholder="Rp Nominal" class="input-rupiah w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h4 class="font-black text-sm uppercase text-blue-600 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-800 pb-2 mb-4">3. Bonus & Insentif Tambahan</h4>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    ${renderPayrollInput('Uang Lembur / Jam', 'bonus-lembur', config.bonus?.lembur)}
                                    ${renderPayrollInput('Penilaian Kinerja', 'bonus-nilai', config.bonus?.nilai)}
                                </div>
                                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <label class="block text-[10px] font-black text-slate-500 uppercase mb-2">Bonus Lainnya (Ketik Manual)</label>
                                    <div class="flex gap-2">
                                        <input type="text" id="pay-bonus-lain-nama" value="${escapeHTML(config.bonus?.lainNama || '')}" placeholder="Nama Bonus..." class="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none">
                                        <input type="text" id="pay-bonus-lain-nominal" value="${formatRpInput(config.bonus?.lainNominal || 0)}" placeholder="Rp Nominal" class="input-rupiah w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                                <h4 class="font-black text-sm text-orange-600 dark:text-orange-400 flex items-center mb-4 border-b border-orange-200 dark:border-orange-800 pb-2"><i class="fa-solid fa-scissors mr-2"></i> DENDA & POTONGAN</h4>
                                <div class="space-y-4">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div><label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Potongan Tunjangan</label>
                                            <div class="relative"><span class="absolute left-2 top-2 text-xs font-bold text-slate-400">Rp</span><input type="text" id="pay-potongan-tunj" value="${formatRpInput(config.potonganLain?.tunjangan || 0)}" class="input-rupiah w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm outline-none"></div></div>
                                        <div><label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Pelanggaran Khusus</label>
                                            <div class="relative"><span class="absolute left-2 top-2 text-xs font-bold text-slate-400">Rp</span><input type="text" id="pay-potongan-denda" value="${formatRpInput(config.potonganLain?.denda || 0)}" class="input-rupiah w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm outline-none"></div></div>
                                    </div>
                                    <div class="pt-3 border-t border-orange-200 dark:border-orange-800">
                                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-2">Potongan Lainnya (Manual)</label>
                                        <div class="flex gap-2">
                                            <input type="text" id="pay-potongan-lain-nama" value="${escapeHTML(config.potonganLain?.lainNama || '')}" placeholder="Nama Potongan..." class="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none">
                                            <input type="text" id="pay-potongan-lain-nominal" value="${formatRpInput(config.potonganLain?.lainNominal || 0)}" placeholder="Rp Nominal" class="input-rupiah w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-sm">
                                    <h4 class="font-black text-xs text-red-600 dark:text-red-400 mb-3 border-b border-red-200 dark:border-red-800 pb-1 flex items-center"><i class="fa-solid fa-hand-holding-dollar mr-1"></i> HUTANG PEGAWAI</h4>
                                    <div><label class="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Total Kasbon</label>
                                        <div class="relative mb-3"><span class="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">Rp</span><input type="text" id="pay-hutang-total" value="${formatRpInput(config.hutang?.total || 0)}" class="input-rupiah w-full pl-7 p-1.5 border border-red-200 rounded bg-white text-xs outline-none"></div></div>
                                    <div><label class="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Potongan per Bulan</label>
                                        <div class="relative mb-3"><span class="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">Rp</span><input type="text" id="pay-hutang-cicilan" value="${formatRpInput(config.hutang?.cicilan || 0)}" class="input-rupiah w-full pl-7 p-1.5 border border-red-200 rounded bg-white text-xs outline-none"></div></div>
                                    <div><label class="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Sisa Tenor (Bulan)</label>
                                        <input type="number" id="pay-hutang-tenor" value="${config.hutang?.tenor || 0}" class="w-full p-1.5 border border-red-200 rounded bg-white text-xs outline-none"></div>
                                </div>
                                <div class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                    <h4 class="font-black text-xs text-emerald-600 dark:text-emerald-400 mb-3 border-b border-emerald-200 dark:border-emerald-800 pb-1 flex items-center"><i class="fa-solid fa-piggy-bank mr-1"></i> PIUTANG YAYASAN</h4>
                                    <div><label class="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Total Uang Terpakai</label>
                                        <div class="relative mb-3"><span class="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">Rp</span><input type="text" id="pay-piutang-total" value="${formatRpInput(config.piutang?.total || 0)}" class="input-rupiah w-full pl-7 p-1.5 border border-emerald-200 rounded bg-white text-xs outline-none"></div></div>
                                    <div><label class="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Bayar via Gaji / Bulan</label>
                                        <div class="relative mb-3"><span class="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">Rp</span><input type="text" id="pay-piutang-cicilan" value="${formatRpInput(config.piutang?.cicilan || 0)}" class="input-rupiah w-full pl-7 p-1.5 border border-emerald-200 rounded bg-white text-xs outline-none"></div></div>
                                    <div><label class="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Sisa Tenor (Bulan)</label>
                                        <input type="number" id="pay-piutang-tenor" value="${config.piutang?.tenor || 0}" class="w-full p-1.5 border border-emerald-200 rounded bg-white text-xs outline-none"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-white dark:bg-slate-800 shrink-0">
                    <button onclick="savePayrollConfig('${peg.id || peg.ID || peg.iD}')" class="bg-green-600 w-full sm:w-auto hover:bg-green-700 text-white px-10 py-4 rounded-xl font-black shadow-xl transition-transform active:scale-95 text-lg flex items-center justify-center">
                        <i class="fa-solid fa-save mr-3 text-xl"></i> SIMPAN KONFIGURASI GAJI
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Helper untuk UI Tunjangan/Bonus menjadi tipe text & input-rupiah
function renderPayrollInput(label, id, value = 0) {
    return `
        <div>
            <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">${label}</label>
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                <input type="text" id="pay-${id}" value="${formatRpInput(value)}" class="input-rupiah w-full pl-7 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-green-500 font-bold text-slate-800 dark:text-white">
            </div>
        </div>
    `;
}

// Fungsi Penyimpan Pengaturan Gaji dengan PENGHAPUS TITIK (.replace(/\./g, ''))
async function savePayrollConfig(pegId) {
    const peg = appData.dataMaster.pegawai.find(p => String(p.id || p.ID || p.iD || '') === String(pegId));
    if (!peg) return;

    // Mesin cerdas: Ambil input teks, hapus semua titik, lalu jadikan angka matematika murni!
    const getValRupiah = (id) => parseFloat((document.getElementById(id)?.value || '0').replace(/\./g, '')) || 0;
    const getValNum = (id) => parseFloat(document.getElementById(id)?.value) || 0; // Khusus untuk tenor/tanggal yang tidak pakai rupiah
    const getStr = (id) => document.getElementById(id)?.value || '';
    
    let finalConfig = { 
        bulanBerlaku: getStr('pay-gaji-bulan'), 
        tanggalGajian: getValNum('pay-gaji-tanggal') 
    };

    document.querySelectorAll('.pay-gaji-tipe').forEach((sel) => {
        let jab = sel.getAttribute('data-jabatan');
        let jabId = jab.replace(/[^a-zA-Z0-9]/g, '');
        let isGuru = sel.getAttribute('data-isguru') === 'true';
        let tipe = sel.value;

        if (isGuru) {
            finalConfig[jab] = {
                tipe: tipe,
                nominal: parseFloat((document.getElementById(`pay-gaji-nom-${jabId}`)?.value || '0').replace(/\./g, '')) || 0,
                nominal2: parseFloat((document.getElementById(`pay-gaji-nom2-${jabId}`)?.value || '0').replace(/\./g, '')) || 0,
                batas: getValNum(`pay-gaji-batas-${jabId}`) // Batas JTM tidak pakai format rupiah
            };
        } else {
            finalConfig[jab] = { 
                tipe: tipe, 
                nominal: parseFloat((document.getElementById(`pay-gaji-nom-${jabId}`)?.value || '0').replace(/\./g, '')) || 0 
            };
        }
    });

    finalConfig.tunjangan = { 
        makan: getValRupiah('pay-tunj-makan'), transport: getValRupiah('pay-tunj-transport'), asrama: getValRupiah('pay-tunj-asrama'), 
        listrik: getValRupiah('pay-tunj-listrik'), air: getValRupiah('pay-tunj-air'), internet: getValRupiah('pay-tunj-internet'), 
        sabun: getValRupiah('pay-tunj-sabun'), thr: getValRupiah('pay-tunj-thr'), 
        lainNama: getStr('pay-tunj-lain-nama'), lainNominal: getValRupiah('pay-tunj-lain-nominal') 
    };

    finalConfig.bonus = { 
        lembur: getValRupiah('pay-bonus-lembur'), nilai: getValRupiah('pay-bonus-nilai'), 
        lainNama: getStr('pay-bonus-lain-nama'), lainNominal: getValRupiah('pay-bonus-lain-nominal') 
    };

    finalConfig.potonganLain = { 
        tunjangan: getValRupiah('pay-potongan-tunj'), denda: getValRupiah('pay-potongan-denda'), 
        lainNama: getStr('pay-potongan-lain-nama'), lainNominal: getValRupiah('pay-potongan-lain-nominal') 
    };

    finalConfig.hutang = { total: getValRupiah('pay-hutang-total'), cicilan: getValRupiah('pay-hutang-cicilan'), tenor: getValNum('pay-hutang-tenor') };
    finalConfig.piutang = { total: getValRupiah('pay-piutang-total'), cicilan: getValRupiah('pay-piutang-cicilan'), tenor: getValNum('pay-piutang-tenor') };

    const submitBtn = document.querySelector('#modal-payroll-config button[onclick^="savePayrollConfig"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2 text-xl"></i> Menyimpan Konfigurasi...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudUpdate', payload: { sheetName: 'Users', id: pegId, data: { configGaji: JSON.stringify(finalConfig) } } })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('modal-payroll-config').remove();
            localStorage.removeItem(`portal_appData_${currentUser.username}`);
            await loadAppData(); 
            if(typeof renderAdminPayrollView === 'function') renderAdminPayrollView();
            if(typeof ModernUI !== 'undefined') ModernUI.alert('Berhasil', 'Konfigurasi gaji tersimpan.', 'success');
            else alert('Tersimpan!');
        } else throw new Error(result.message);
    } catch (e) { 
        if(typeof ModernUI !== 'undefined') ModernUI.alert('Gagal', 'Terjadi kesalahan saat menyimpan.', 'error');
        else alert('Error koneksi.');
    } finally { 
        if(submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; } 
    }
}

// ==========================================
// 3. MESIN TUTUP BUKU & GENERATE SLIP MASSAL
// ==========================================
function bukaModalTutupBuku() {
    if (document.getElementById('modal-tutup-buku')) document.getElementById('modal-tutup-buku').remove();
    
    const now = new Date();
    const bulanSekarang = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][now.getMonth()];
    
    // Kumpulkan Semua Jabatan Unik di Data Master
    const pegawais = appData.dataMaster?.pegawai || [];
    const jabatansSet = new Set();
    pegawais.forEach(p => {
        if (p.jabatan) p.jabatan.split(',').forEach(j => jabatansSet.add(j.trim()));
    });
    const listJabatan = Array.from(jabatansSet).filter(j => j !== '');

    // Buat input nominal denda khusus untuk setiap jabatan (DENGAN AUTO RUPIAH)
    let dendaHTML = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">';
    listJabatan.forEach(jab => {
        dendaHTML += `
            <div class="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm flex flex-col justify-between">
                <label class="block text-[10px] font-black text-red-700 dark:text-red-400 uppercase truncate mb-2" title="${escapeHTML(jab)}">${escapeHTML(jab)}</label>
                <div class="relative">
                    <span class="absolute left-3 top-2 text-xs text-red-400 font-bold">Rp</span>
                    <input type="text" value="0" class="input-rupiah w-full pl-8 p-2 text-sm border border-red-300 dark:border-red-700 rounded bg-red-50 dark:bg-slate-700 outline-none font-bold tb-denda-input text-red-700 dark:text-red-300 focus:ring-2 focus:ring-red-500" data-jabatan="${escapeHTML(jab)}">
                </div>
            </div>
        `;
    });
    if (listJabatan.length === 0) dendaHTML += '<p class="text-xs text-red-500 italic col-span-full">Belum ada jabatan terdaftar di Data Master.</p>';
    dendaHTML += '</div>';
    
    const modalHTML = `
        <div id="modal-tutup-buku" class="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-700">
                
                <div class="p-4 bg-amber-500 flex justify-between items-center text-white shrink-0">
                    <h3 class="font-black text-lg"><i class="fa-solid fa-calculator mr-2"></i> Tutup Buku Bulanan</h3>
                    <button onclick="document.getElementById('modal-tutup-buku').remove()" class="hover:text-red-200 transition-colors"><i class="fa-solid fa-times text-2xl"></i></button>
                </div>
                
                <form onsubmit="prosesTutupBukuBulanan(event)" class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-slate-50 dark:bg-slate-900/50">
                    
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <i class="fa-solid fa-calendar-check mr-2 text-blue-500"></i> Pilih Periode Penggajian
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Bulan</label>
                                <select id="tb-bulan" class="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500">
                                    ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => `<option value="${b}" ${b === bulanSekarang ? 'selected' : ''}>${b}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Tahun</label>
                                <input type="number" id="tb-tahun" value="${now.getFullYear()}" class="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 outline-none font-bold text-center text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <div class="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800 shadow-sm">
                        <label class="block text-sm font-black text-red-600 dark:text-red-400 mb-1 border-b border-red-200 dark:border-red-800 pb-2 flex items-center">
                            <i class="fa-solid fa-scissors mr-2"></i> Potongan / Denda Terlambat (Per Menit)
                        </label>
                        <p class="text-xs text-red-500/80 mb-3 font-medium mt-2">Tentukan denda keterlambatan spesifik (Rp) untuk masing-masing jabatan. Biarkan 0 jika tidak ada pemotongan waktu.</p>
                        ${dendaHTML}
                    </div>

                </form>

                <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                    <button type="submit" id="btn-proses-tb" onclick="document.querySelector('#modal-tutup-buku form').dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))" class="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-black shadow-xl transition-transform active:scale-95 text-lg flex items-center justify-center">
                        <i class="fa-solid fa-gears mr-3 text-xl"></i> PROSES & TERBITKAN SLIP MASSAL
                    </button>
                </div>

            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function prosesTutupBukuBulanan(event) {
    event.preventDefault();
    const bulan = document.getElementById('tb-bulan').value;
    const tahun = document.getElementById('tb-tahun').value;
    const periodeKey = `${bulan}-${tahun}`;

    // Ambil semua settingan denda keterlambatan dari form (HAPUS TITIK RIBUAN)
    let dendaMap = {};
    document.querySelectorAll('.tb-denda-input').forEach(input => {
        dendaMap[input.getAttribute('data-jabatan')] = parseFloat((input.value || '0').replace(/\./g, '')) || 0;
    });

    const btn = document.getElementById('btn-proses-tb');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-3 text-xl"></i> Menghitung Kalkulasi...';
    btn.disabled = true;

    try {
        let arraySlip = [];
        const pegawais = appData.dataMaster.pegawai;

        pegawais.forEach(peg => {
            if (!peg.configGaji) return; 
            
            let config = JSON.parse(peg.configGaji);

            let absensiBulanIni = (appData.absensi || []).filter(a => {
                if (a.namaPegawai !== peg.nama) return false;
                let tgl = new Date(a.tanggal);
                let namaBln = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][tgl.getMonth()];
                return namaBln === bulan && String(tgl.getFullYear()) === String(tahun);
            });

            let totalMenitTerlambat = 0;
            let totalHadirSesi = 0; 
            let totalJp = 0; 
            let daysAttended = new Set(); 

            absensiBulanIni.forEach(a => {
                totalMenitTerlambat += parseInt(a.menitTerlambat) || 0;
                
                if (a.status === 'Hadir' || a.status === 'Terlambat') {
                    totalHadirSesi++;
                    let jp = parseInt(a.jumlahJp) || 1;
                    totalJp += jp;
                    daysAttended.add(a.tanggal);
                }
            });
            let totalHariHadir = daysAttended.size;

            let totalGajiPokok = 0;
            let jabatans = peg.jabatan ? peg.jabatan.split(',').map(j => j.trim()) : [];
            
            jabatans.forEach(jab => {
                let gData = config[jab];
                if (!gData) return;

                let isGuru = jab.toLowerCase().includes('guru');
                let nom = parseFloat(gData.nominal) || 0;
                let nom2 = parseFloat(gData.nominal2) || 0;
                let batas = parseFloat(gData.batas) || 0;

                if (isGuru) {
                    if (gData.tipe === 'Paket Flat Bulanan') totalGajiPokok += (batas * nom * 4); 
                    else if (gData.tipe === 'Realisasi Aktual JTM') totalGajiPokok += (nom * totalJp); 
                    else if (gData.tipe === 'Progresif Berjenjang') {
                        if (totalJp <= batas) totalGajiPokok += (nom * totalJp);
                        else totalGajiPokok += (nom * batas) + (nom2 * (totalJp - batas));
                    } 
                    else if (gData.tipe === 'Hybrid JTM & Hadir') totalGajiPokok += (nom * totalJp) + (nom2 * totalHariHadir); 
                    else if (gData.tipe === 'Sistem Sesi / Bimbel') totalGajiPokok += (nom * totalHadirSesi); 
                    else totalGajiPokok += nom; 
                } else {
                    if (gData.tipe === 'Per Bulan' || gData.tipe === 'Per Proyek') totalGajiPokok += nom; 
                    else if (gData.tipe === 'Per Pertemuan' || gData.tipe === 'Per Hari') totalGajiPokok += (nom * totalHariHadir); 
                    else if (gData.tipe === 'Per Jam') totalGajiPokok += (nom * totalJp); 
                }
            });

            let t = config.tunjangan || {};
            let totalTunjangan = (parseFloat(t.makan)||0) + (parseFloat(t.transport)||0) + (parseFloat(t.asrama)||0) + (parseFloat(t.listrik)||0) + (parseFloat(t.air)||0) + (parseFloat(t.internet)||0) + (parseFloat(t.sabun)||0) + (parseFloat(t.thr)||0) + (parseFloat(t.lainNominal)||0);

            let b = config.bonus || {};
            let totalBonus = (parseFloat(b.lembur)||0) + (parseFloat(b.nilai)||0) + (parseFloat(b.lainNominal)||0);

            let piutangMasuk = parseFloat(config.piutang?.cicilan) || 0;
            
            let penerimaanKotor = totalGajiPokok + totalTunjangan + totalBonus + piutangMasuk;

            let primaryJabatan = jabatans.length > 0 ? jabatans[0] : '';
            let dendaPerMenit = dendaMap[primaryJabatan] || 0;
            let nominalDendaTerlambat = totalMenitTerlambat * dendaPerMenit; 
            
            let p = config.potonganLain || {};
            let hutangKeluar = parseFloat(config.hutang?.cicilan) || 0;
            let potonganLainnya = (parseFloat(p.tunjangan)||0) + (parseFloat(p.denda)||0) + (parseFloat(p.lainNominal)||0);

            let totalPotongan = nominalDendaTerlambat + hutangKeluar + potonganLainnya;
            
            let takeHomePay = Math.max(0, penerimaanKotor - totalPotongan);

            let slipData = {
                namaPegawai: peg.nama,
                jabatan: peg.jabatan,
                bulanTahun: periodeKey,
                totalTerima: takeHomePay,
                statusTerima: 'Belum Diterima',
                tanggalTerima: '-',
                detail: JSON.stringify({
                    hadir: totalHariHadir,
                    totalJpAktual: totalJp,
                    menitTerlambat: totalMenitTerlambat,
                    gajiPokok: totalGajiPokok,
                    tunjangan: totalTunjangan,
                    bonus: totalBonus,
                    piutangDiterima: piutangMasuk,
                    dendaTerlambat: nominalDendaTerlambat,
                    hutangDibayar: hutangKeluar,
                    potonganLain: potonganLainnya
                })
            };
            arraySlip.push(slipData);
        });

        if (arraySlip.length === 0) {
            if(typeof ModernUI !== 'undefined') ModernUI.alert('Informasi', 'Tidak ada data pegawai yang memiliki Konfigurasi Gaji untuk diproses.', 'info');
            else alert("Tidak ada data pegawai yang siap digaji.");
            
            document.getElementById('modal-tutup-buku').remove();
            return;
        }

        if(typeof showGlobalLoading === "function") showGlobalLoading(`Menerbitkan ${arraySlip.length} Slip Gaji ke Database...`);

        // Tembak massal ke Google Sheets!
        for (let i = 0; i < arraySlip.length; i++) {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Payroll_Slips', data: arraySlip[i] } })
            });
        }

        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        document.getElementById('modal-tutup-buku').remove();
        
        localStorage.removeItem(`portal_appData_${currentUser.username}`);
        await loadAppData();
        
        if(typeof ModernUI !== 'undefined') {
            ModernUI.alert('Tutup Buku Sukses!', `Sistem berhasil memproses dan menerbitkan ${arraySlip.length} slip gaji untuk periode ${periodeKey}.`, 'success');
        } else {
            alert('Berhasil Tutup Buku Bulanan!');
        }

    } catch (e) {
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        if(typeof ModernUI !== 'undefined') ModernUI.alert('Error', 'Terjadi kesalahan sistem saat memproses tutup buku massal.', 'error');
        else alert('Error memproses gaji.');
        
        btn.innerHTML = '<i class="fa-solid fa-gears mr-3 text-xl"></i> PROSES & TERBITKAN SLIP MASSAL';
        btn.disabled = false;
    }
}

// ==========================================
// 4. UI ARSIP SLIP UNTUK ADMIN & PEMILIK SLIP
// ==========================================
function renderUserSlipView(isAdminViewingAll = false) {
    const targetId = isAdminViewingAll ? 'modal-all-slips-content' : 'payroll-module-container';
    let container = document.getElementById(targetId);
    
    if (isAdminViewingAll && !document.getElementById('modal-all-slips')) {
        const modal = document.createElement('div');
        modal.id = "modal-all-slips";
        modal.className = "fixed inset-0 bg-slate-900/90 z-[120] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto";
        modal.innerHTML = `
            <div class="w-full max-w-4xl bg-slate-50 dark:bg-slate-900 rounded-2xl relative p-4 shadow-2xl mt-10 border border-slate-300 dark:border-slate-700">
                <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors z-10"><i class="fa-solid fa-times text-2xl"></i></button>
                <div id="modal-all-slips-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        container = document.getElementById('modal-all-slips-content');
    }
    
    if (!container) return; 

    let userListOptions = `<option value="${currentUser.nama}">${currentUser.nama}</option>`;
    if (isAdminViewingAll) {
        userListOptions = appData.dataMaster.pegawai.map(p => `<option value="${escapeHTML(p.nama)}">${escapeHTML(p.nama)}</option>`).join('');
    }

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in p-2 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div class="flex items-center space-x-4">
                    <div class="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-file-invoice-dollar text-2xl text-indigo-600 dark:text-indigo-400"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-slate-800 dark:text-white">E-Slip Gaji / Honorarium</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Pusat arsip dan konfirmasi penerimaan gaji.</p>
                    </div>
                </div>
                
                <div class="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                    ${isAdminViewingAll ? `<select id="slip-nama" class="w-full md:w-auto p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 outline-none focus:border-indigo-500 text-slate-800 dark:text-white shadow-sm">${userListOptions}</select>` : ''}
                    
                    <select id="slip-bulan" class="flex-1 md:flex-none p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 outline-none focus:border-indigo-500 text-slate-800 dark:text-white shadow-sm">
                        <option value="Januari">Januari</option><option value="Februari">Februari</option><option value="Maret">Maret</option>
                        <option value="April">April</option><option value="Mei">Mei</option><option value="Juni">Juni</option>
                        <option value="Juli">Juli</option><option value="Agustus">Agustus</option><option value="September">September</option>
                        <option value="Oktober">Oktober</option><option value="November">November</option><option value="Desember">Desember</option>
                    </select>
                    
                    <select id="slip-tahun" class="w-24 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 outline-none focus:border-indigo-500 text-slate-800 dark:text-white shadow-sm">
                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                    </select>
                    
                    <button onclick="generateSlipPreview()" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-black shadow-lg transition-transform active:scale-95">
                        <i class="fa-solid fa-magnifying-glass mr-2"></i> Cari Slip
                    </button>
                </div>
            </div>
            
            <div id="slip-container" class="bg-white p-4 sm:p-8 rounded-2xl shadow-xl max-w-3xl mx-auto border-t-[10px] border-indigo-600 hidden animate-slide-up">
            </div>
        </div>
    `;
    
    // Set default bulan dan tahun
    const curBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][new Date().getMonth()];
    document.getElementById('slip-bulan').value = curBulan;
    document.getElementById('slip-tahun').value = new Date().getFullYear();
}

// ==========================================
// 5. MERENDER TAMPILAN SLIP KERTAS KLASIK
// ==========================================
async function generateSlipPreview() {
    const container = document.getElementById('slip-container');
    container.classList.remove('hidden');
    container.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-spinner fa-spin text-3xl text-indigo-500"></i><p class="mt-3 font-bold text-slate-500">Mencari Arsip Slip...</p></div>';
    
    const isKeuangan = currentUser.role === 'admin' || (currentUser.jabatan && (currentUser.jabatan.toLowerCase().includes('bendahara') || currentUser.jabatan.toLowerCase().includes('keuangan') || currentUser.jabatan.toLowerCase().includes('ketua yayasan')));
    
    const namaTarget = isKeuangan && document.getElementById('slip-nama') ? document.getElementById('slip-nama').value : currentUser.nama;
    const namaBulan = document.getElementById('slip-bulan').value;
    const tahun = document.getElementById('slip-tahun').value;
    const periodeKey = `${namaBulan}-${tahun}`; 

    const peg = appData.dataMaster.pegawai.find(p => p.nama === namaTarget);
    if (!peg) { 
        container.innerHTML = `<div class="text-center text-red-500 py-10 font-bold bg-red-50 rounded-xl border border-red-200"><i class="fa-solid fa-user-xmark text-3xl mb-2"></i><br>Data pegawai ${escapeHTML(namaTarget)} tidak ditemukan.</div>`; 
        return; 
    }

    const arsipSlip = (appData.payrollSlips || []).find(s => s.namaPegawai === namaTarget && s.bulanTahun === periodeKey);
    
    if (!arsipSlip) {
        container.innerHTML = `
            <div class="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <i class="fa-solid fa-folder-open text-5xl text-slate-300 mb-4 block"></i>
                <h3 class="text-lg font-black text-slate-700">Slip Belum Diterbitkan</h3>
                <p class="text-sm text-slate-500 font-medium mt-1">Slip honorarium untuk periode <b>${periodeKey}</b> belum di-generate oleh sistem/Bendahara.</p>
            </div>`;
        return;
    }

    let det = {};
    try { det = JSON.parse(arsipSlip.detail || '{}'); } catch(e){}

    let btnKonfirmasi = '';
    if (arsipSlip.statusTerima === 'Diterima') {
        btnKonfirmasi = `
            <div class="mt-6 p-4 bg-green-100 text-green-800 rounded-xl text-center font-bold border border-green-300 shadow-sm flex items-center justify-center flex-col">
                <i class="fa-solid fa-check-double text-3xl mb-2"></i> 
                <span>Gaji telah resmi dikonfirmasi dan diterima pada:<br><span class="text-lg">${escapeHTML(arsipSlip.tanggalTerima)}</span></span>
            </div>`;
    } else if (currentUser.nama === namaTarget) {
        btnKonfirmasi = `
            <button onclick="confirmGajiDiterima('${escapeHTML(arsipSlip.id || arsipSlip.ID)}')", id="btn-konfirmasi-gaji" class="mt-8 w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-xl transition-transform active:scale-95 text-lg flex justify-center items-center">
                <i class="fa-solid fa-hand-holding-dollar mr-3 text-2xl"></i> KONFIRMASI: UANG GAJI TELAH DITERIMA
            </button>
            <p class="text-[10px] text-center text-slate-400 mt-2">Dengan menekan tombol di atas, Anda memvalidasi bahwa uang tunai/transfer telah sesuai nominal.</p>
        `;
    } else {
        btnKonfirmasi = `
            <div class="mt-6 p-4 bg-amber-50 text-amber-700 rounded-xl text-center font-bold border border-amber-200 flex items-center justify-center flex-col">
                <i class="fa-solid fa-clock-rotate-left text-3xl mb-2"></i> 
                Pegawai bersangkutan belum melakukan konfirmasi penerimaan gaji di sistem.
            </div>`;
    }

    // Fungsi helper formatRupiah ada di core.js, asumsikan berfungsi.
    const fRp = typeof formatRupiah === 'function' ? formatRupiah : (angka) => 'Rp ' + angka.toLocaleString('id-ID');

    container.innerHTML = `
        <div id="slip-print-area" class="bg-white text-slate-800 p-2 sm:p-4 rounded-xl">
            <div class="text-center border-b-4 border-slate-800 pb-5 mb-5">
                <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-widest text-slate-900">YAYASAN ROYAL ASAHAN</h2>
                <p class="text-xs sm:text-sm text-slate-600 mt-1">Jl. Siumbut-umbut Kisaran, Kab. Asahan, Sumatera Utara</p>
                <div class="mt-4">
                    <span class="text-lg font-black bg-indigo-100 text-indigo-900 px-6 py-2 rounded-full border border-indigo-300 shadow-sm uppercase tracking-widest">
                        Slip Honorarium
                    </span>
                </div>
                <p class="text-sm font-bold mt-3 text-slate-700">Periode: ${periodeKey}</p>
            </div>

            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <table class="w-full">
                        <tr><td class="text-slate-500 w-28 py-1 font-medium">Nama Pegawai</td><td>: <span class="font-bold text-slate-800 text-base">${escapeHTML(peg.nama)}</span></td></tr>
                        <tr><td class="text-slate-500 py-1 font-medium">Jabatan</td><td>: <span class="font-bold text-slate-800">${escapeHTML(peg.jabatan || '-')}</span></td></tr>
                        <tr><td class="text-slate-500 py-1 font-medium">ID Pegawai</td><td>: <span class="font-bold text-slate-800">${escapeHTML(peg.idPegawai || '-')}</span></td></tr>
                    </table>
                    <table class="w-full">
                        <tr><td class="text-slate-500 w-28 py-1 font-medium">Hari Masuk</td><td>: <span class="font-bold text-slate-800">${det.hadir || 0} Hari</span></td></tr>
                        <tr><td class="text-slate-500 py-1 font-medium">Tercatat JTM</td><td>: <span class="font-bold text-slate-800">${det.totalJpAktual || 0} JP/Sesi</span></td></tr>
                        <tr><td class="text-slate-500 py-1 font-medium">Keterlambatan</td><td>: <span class="font-bold text-red-600">${det.menitTerlambat || 0} Menit</span></td></tr>
                    </table>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                
                <div class="bg-white">
                    <h4 class="font-black text-sm uppercase border-b-2 border-slate-800 pb-2 mb-3 text-green-700 flex items-center"><i class="fa-solid fa-plus-circle mr-2"></i> Komponen Penerimaan</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Gaji Pokok / Honor JTM</span><span class="font-bold text-slate-800">${fRp(det.gajiPokok || 0)}</span></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Total Tunjangan</span><span class="font-bold text-slate-800">${fRp(det.tunjangan || 0)}</span></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Bonus & Insentif Khusus</span><span class="font-bold text-slate-800">${fRp(det.bonus || 0)}</span></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Pembayaran Piutang</span><span class="font-bold text-slate-800">${fRp(det.piutangDiterima || 0)}</span></div>
                    </div>
                </div>
                
                <div class="bg-white">
                    <h4 class="font-black text-sm uppercase border-b-2 border-slate-800 pb-2 mb-3 text-red-700 flex items-center"><i class="fa-solid fa-minus-circle mr-2"></i> Komponen Potongan</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Denda Keterlambatan</span><span class="font-bold text-red-600">- ${fRp(det.dendaTerlambat || 0)}</span></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Cicilan Hutang / Kasbon</span><span class="font-bold text-red-600">- ${fRp(det.hutangDibayar || 0)}</span></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-600 font-medium">Potongan Lainnya</span><span class="font-bold text-red-600">- ${fRp(det.potonganLain || 0)}</span></div>
                    </div>
                </div>

            </div>

            <div class="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center mb-10 shadow-inner">
                <span class="text-base font-black text-indigo-900 uppercase tracking-widest mb-2 md:mb-0">Take Home Pay</span>
                <span class="text-3xl font-black text-indigo-700 bg-white px-6 py-2 rounded-xl shadow-sm border border-indigo-100">${fRp(arsipSlip.totalTerima)}</span>
            </div>

            <div class="flex justify-between text-center text-sm pt-4">
                <div class="w-1/2">
                    <p class="mb-20 font-bold text-slate-600">Penerima,</p>
                    <p class="font-black text-slate-900 underline underline-offset-4 decoration-2">${escapeHTML(peg.nama)}</p>
                </div>
                <div class="w-1/2">
                    <p class="mb-20 font-bold text-slate-600">Mengetahui, Bendahara</p>
                    <p class="font-black text-slate-900 underline underline-offset-4 decoration-2">(....................................)</p>
                </div>
            </div>
        </div>

        ${btnKonfirmasi}

        <div class="mt-8 flex justify-center border-t border-slate-200 dark:border-slate-700 pt-6">
            <button onclick="window.print()" class="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-transform active:scale-95 flex items-center text-base">
                <i class="fa-solid fa-print mr-3 text-xl"></i> CETAK SLIP (SIMPAN PDF)
            </button>
        </div>
    `;
}

// Fungsi Konfirmasi Database
async function confirmGajiDiterima(slipId) {
    if (typeof ModernUI !== 'undefined') {
        ModernUI.confirm('Konfirmasi Penerimaan', 'Dengan menekan Lanjutkan, Anda memvalidasi bahwa honorarium telah Anda terima secara penuh tanpa kurang suatu apapun.', () => prosesEksekusiKonfirmasi(slipId));
    } else {
        if (!confirm("Dengan menekan tombol ini, Anda menyatakan telah menerima honorarium sesuai nominal pada slip. Lanjutkan?")) return;
        prosesEksekusiKonfirmasi(slipId);
    }
}

async function prosesEksekusiKonfirmasi(slipId) {
    const btn = document.getElementById('btn-konfirmasi-gaji');
    if(btn) { 
        btn.disabled = true; 
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-3 text-xl"></i> Sedang Memvalidasi...'; 
    }
    
    const tgl = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Wib';

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'crudUpdate', 
                payload: { sheetName: 'Payroll_Slips', id: slipId, data: { statusTerima: 'Diterima', tanggalTerima: tgl } } 
            })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            if(typeof ModernUI !== 'undefined') ModernUI.alert('Sukses Validasi', 'Terima kasih, konfirmasi Anda telah menjadi arsip sah di sistem.', 'success'); 
            else alert("Berhasil! Terima kasih.");
            
            localStorage.removeItem(`portal_appData_${currentUser.username}`);
            await loadAppData(); 
            
            if (document.getElementById('modal-all-slips')) generateSlipPreview(); 
            else muatDataSlipPegawaiApp(); 
        } else {
            throw new Error(result.message);
        }
    } catch (e) { 
        if(typeof ModernUI !== 'undefined') ModernUI.alert('Error', 'Gangguan koneksi saat menghubungi server.', 'error'); 
        if(btn) btn.disabled = false; 
    }
}


// =========================================================
// 6. UI KARTU SLIP PEGAWAI MOBILE (APP USER BIASA)
// =========================================================

let isAngkaSlipTerlihat = false;
let angkaTakeHomePay = 0;

function initUserSlipGaji() {
    const targetId = 'payroll-module-container';
    let container = document.getElementById(targetId);
    if (!container) return;

    container.innerHTML = `
        <div class="max-w-2xl mx-auto pt-4 sm:pt-8 animate-fade-in">
            <div class="bg-indigo-600 p-6 rounded-t-3xl text-white shadow-lg relative overflow-hidden">
                <div class="absolute -right-10 -top-10 opacity-10"><i class="fa-solid fa-coins text-9xl"></i></div>
                <h2 class="text-2xl font-black mb-1 relative z-10">Honorarium Anda</h2>
                <p class="text-indigo-200 text-sm relative z-10">Silakan pilih bulan untuk melihat rincian gaji Anda.</p>
                
                <div class="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
                    <select id="user-slip-bulan" onchange="muatDataSlipPegawaiApp()" class="flex-1 p-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold outline-none focus:bg-white focus:text-indigo-900 transition-colors">
                        <option value="Januari" class="text-slate-800">Januari</option><option value="Februari" class="text-slate-800">Februari</option>
                        <option value="Maret" class="text-slate-800">Maret</option><option value="April" class="text-slate-800">April</option>
                        <option value="Mei" class="text-slate-800">Mei</option><option value="Juni" class="text-slate-800">Juni</option>
                        <option value="Juli" class="text-slate-800">Juli</option><option value="Agustus" class="text-slate-800">Agustus</option>
                        <option value="September" class="text-slate-800">September</option><option value="Oktober" class="text-slate-800">Oktober</option>
                        <option value="November" class="text-slate-800">November</option><option value="Desember" class="text-slate-800">Desember</option>
                    </select>
                    <select id="user-slip-tahun" onchange="muatDataSlipPegawaiApp()" class="w-full sm:w-32 p-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold outline-none focus:bg-white focus:text-indigo-900 transition-colors">
                        <option value="2024" class="text-slate-800">2024</option><option value="2025" class="text-slate-800">2025</option><option value="2026" class="text-slate-800">2026</option>
                    </select>
                </div>
            </div>

            <div class="bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 rounded-b-3xl shadow-lg border-x border-b border-slate-200 dark:border-slate-800">
                <div id="wadah-kartu-slip"></div>
                <div class="mt-6 flex justify-center">
                    <button id="btn-sensor-mata" onclick="toggleSensorMata()" class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-6 py-3 rounded-full font-bold text-sm shadow-sm transition-colors flex items-center">
                        <i class="fa-solid fa-eye mr-2"></i> Tampilkan Nominal Rupiah
                    </button>
                </div>
                <div id="wadah-tombol-terima" class="mt-8"></div>
            </div>
        </div>
    `;

    const now = new Date();
    const curBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][now.getMonth()];
    document.getElementById('user-slip-bulan').value = curBulan;
    document.getElementById('user-slip-tahun').value = now.getFullYear();

    muatDataSlipPegawaiApp();
}

function muatDataSlipPegawaiApp() {
    const elBulan = document.getElementById('user-slip-bulan');
    const elTahun = document.getElementById('user-slip-tahun');
    if (!elBulan || !elTahun) return;

    const periodeKey = `${elBulan.value}-${elTahun.value}`;
    const wadahKartu = document.getElementById('wadah-kartu-slip');
    const wadahTombol = document.getElementById('wadah-tombol-terima');

    const arsipSlip = (appData.payrollSlips || []).find(s => s.namaPegawai === currentUser.nama && s.bulanTahun === periodeKey);

    const fRp = typeof formatRupiah === 'function' ? formatRupiah : (angka) => 'Rp ' + angka.toLocaleString('id-ID');

    if (arsipSlip) {
        angkaTakeHomePay = parseFloat(arsipSlip.totalTerima) || 0;
        let det = {};
        try { det = JSON.parse(arsipSlip.detail || '{}'); } catch(e){}

        wadahKartu.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                <div class="flex justify-between items-start border-b-2 border-slate-100 dark:border-slate-700 pb-4 mb-6">
                    <div>
                        <h4 class="font-black text-slate-800 dark:text-white text-lg tracking-wider">${escapeHTML(currentUser.nama)}</h4>
                        <p class="text-xs font-bold text-indigo-500 uppercase mt-1">${escapeHTML(currentUser.jabatan || 'Umum')}</p>
                    </div>
                    <div class="text-right">
                        <span class="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-[10px] uppercase border border-green-200">Slip Terbit</span>
                        <p class="text-[10px] text-slate-400 mt-2">Periode: ${periodeKey}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div class="text-center">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Kehadiran (Hadir / JTM)</p>
                        <p class="text-sm font-black text-slate-800 dark:text-white">${det.hadir || 0} Hari / ${det.totalJpAktual || 0} JP</p>
                    </div>
                    <div class="text-center border-l border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Keterlambatan</p>
                        <p class="text-sm font-black ${det.menitTerlambat > 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}">${det.menitTerlambat || 0} Menit</p>
                    </div>
                </div>

                <div class="space-y-3 mb-8">
                    <div class="flex justify-between text-sm"><span class="text-slate-600 dark:text-slate-400 font-medium">Gaji Pokok / Honor JTM</span><span class="font-bold text-slate-800 dark:text-white item-nominal">${fRp(det.gajiPokok || 0)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-slate-600 dark:text-slate-400 font-medium">Total Tunjangan</span><span class="font-bold text-slate-800 dark:text-white item-nominal">${fRp(det.tunjangan || 0)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-slate-600 dark:text-slate-400 font-medium">Bonus & Insentif</span><span class="font-bold text-slate-800 dark:text-white item-nominal">${fRp(det.bonus || 0)}</span></div>
                    
                    <div class="pt-3 mt-3 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                    
                    <div class="flex justify-between text-sm"><span class="text-slate-600 dark:text-slate-400 font-medium">Potongan Denda</span><span class="font-bold text-red-500 item-nominal">- ${fRp(det.dendaTerlambat || 0)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-slate-600 dark:text-slate-400 font-medium">Cicilan Kasbon</span><span class="font-bold text-red-500 item-nominal">- ${fRp(det.hutangDibayar || 0)}</span></div>
                </div>

                <div class="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 text-center shadow-inner">
                    <p class="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Total Diterima Bersih</p>
                    <h3 id="txt-thp-display" class="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-wider">
                        Rp ***.***
                    </h3>
                </div>
            </div>
        `;

        if (arsipSlip.statusTerima === 'Diterima') {
            wadahTombol.innerHTML = `
                <div class="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-center shadow-sm">
                    <i class="fa-solid fa-check-circle text-3xl mb-2 text-green-600"></i>
                    <p class="font-bold">Gaji Telah Anda Validasi & Terima</p>
                    <p class="text-xs text-green-700/70 mt-1">Sistem mencatat: ${escapeHTML(arsipSlip.tanggalTerima)}</p>
                </div>
            `;
        } else {
            wadahTombol.innerHTML = `
                <button onclick="confirmGajiDiterima('${escapeHTML(arsipSlip.id || arsipSlip.ID)}')", id="btn-konfirmasi-gaji" class="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-black shadow-xl transition-transform active:scale-95 text-lg flex justify-center items-center">
                    <i class="fa-solid fa-hand-holding-dollar mr-3 text-2xl"></i> SAYA TELAH MENERIMA GAJI INI
                </button>
            `;
        }

    } else {
        angkaTakeHomePay = 0;
        wadahKartu.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center shadow-sm border border-slate-200 dark:border-slate-700 border-dashed">
                <div class="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                    <i class="fa-solid fa-folder-open text-4xl"></i>
                </div>
                <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-1">Arsip Kosong</h4>
                <p class="text-sm text-slate-500">Bendahara belum melakukan Tutup Buku / Menerbitkan slip untuk periode ${periodeKey}.</p>
            </div>
        `;
        wadahTombol.innerHTML = ''; 
    }

    isAngkaSlipTerlihat = false;
    terapkanSensorMata();
}

function toggleSensorMata() {
    isAngkaSlipTerlihat = !isAngkaSlipTerlihat;
    terapkanSensorMata();
}

function terapkanSensorMata() {
    const btn = document.getElementById('btn-sensor-mata');
    const elThp = document.getElementById('txt-thp-display');
    const nomItems = document.querySelectorAll('.item-nominal'); 

    const fRp = typeof formatRupiah === 'function' ? formatRupiah : (angka) => 'Rp ' + angka.toLocaleString('id-ID');

    if (isAngkaSlipTerlihat) {
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-eye-slash mr-2"></i> Sembunyikan Nominal Rupiah';
            btn.classList.replace('bg-blue-100', 'bg-slate-200');
            btn.classList.replace('text-blue-700', 'text-slate-600');
        }
        if(elThp) elThp.textContent = fRp(angkaTakeHomePay);
        nomItems.forEach(el => { el.classList.remove('blur-sm', 'select-none'); });
    } else {
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-eye mr-2"></i> Tampilkan Nominal Rupiah';
            btn.classList.replace('bg-slate-200', 'bg-blue-100');
            btn.classList.replace('text-slate-600', 'text-blue-700');
        }
        if(elThp) elThp.textContent = "Rp ***.***";
        nomItems.forEach(el => { el.classList.add('blur-sm', 'select-none'); });
    }
}