// ==========================================
// FILE 6: DATAMASTER.JS (CRUD, QUILL, & UNIVERSAL BULK UPLOAD)
// ==========================================

let bulkQuillEditor = null;
let universalBulkCart = [];

function initQuill() {
    if (!quillEditor && document.getElementById('quill-editor')) {
        quillEditor = new Quill('#quill-editor', { theme: 'snow', placeholder: 'Tulis deskripsi tugas dengan detail...', modules: { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'image'], ['clean'] ] } });
    }
    if (!bulkQuillEditor && document.getElementById('bulk-quill-editor')) {
        bulkQuillEditor = new Quill('#bulk-quill-editor', { theme: 'snow', placeholder: 'Tulis deskripsi tugas dengan detail...', modules: { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'image'], ['clean'] ] } });
    }
}

function switchDataMasterTab(tabId) {
    currentDataMasterTab = tabId;
    const allTabs = document.querySelectorAll('.dm-tab');
    allTabs.forEach(tab => {
        tab.classList.remove('bg-blue-600', 'text-white');
        tab.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
    });

    const activeTab = document.querySelector(`.dm-tab[onclick="switchDataMasterTab('${tabId}')"]`);
    if (activeTab) {
        activeTab.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
        activeTab.classList.add('bg-blue-600', 'text-white');
    }
    renderDataMasterTable();
}

function renderDataMasterTable() {
    const config = DM_CONFIG[currentDataMasterTab];
    if (!config) return;

    // 1. OTOMATIS SEMBUNYIKAN TOMBOL TAMBAH & BULK JIKA DI TAB LEMBAGA
    const btnAdd = document.querySelector('button[onclick*="openCRUDModal"]');
    const btnBulk = document.querySelector('button[onclick*="openUniversalBulkModal"]');
    
    if (currentDataMasterTab === 'dm-lembaga') {
        if(btnAdd) btnAdd.classList.add('hidden');
        if(btnBulk) btnBulk.classList.add('hidden');
    } else {
        if(btnAdd) btnAdd.classList.remove('hidden');
        if(btnBulk) btnBulk.classList.remove('hidden');
    }

    const titleEl = document.getElementById('dm-table-title');
    const theadEl = document.getElementById('dm-table-head');
    const tbodyEl = document.getElementById('dm-table-body');
    const tableNode = theadEl ? theadEl.parentElement : null;

    if (!titleEl || !tableNode) return;

    // Siapkan wadah khusus untuk form langsung (Direct Form)
    let directContainer = document.getElementById('dm-direct-form-container');
    if (!directContainer) {
        directContainer = document.createElement('div');
        directContainer.id = 'dm-direct-form-container';
        tableNode.parentElement.appendChild(directContainer);
    }

    // ==========================================
    // KHUSUS DM-LEMBAGA: TAMPILKAN FORM LANGSUNG, HILANGKAN TABEL
    // ==========================================
    if (currentDataMasterTab === 'dm-lembaga') {
        tableNode.classList.add('hidden'); // Sembunyikan tabel
        directContainer.classList.remove('hidden'); // Munculkan wadah form
        
        titleEl.innerHTML = `<i class="fa-solid fa-building-columns mr-2"></i> Pengaturan Informasi Lembaga / Yayasan Utama`;

        // Ambil data lembaga pertama (karena 1 web = 1 lembaga)
        let itemData = (appData.dataMaster.lembaga && appData.dataMaster.lembaga.length > 0) ? appData.dataMaster.lembaga[0] : {};
        const recordId = itemData.id || itemData.ID || itemData.iD || '';

        // Suntikkan kerangka form
        directContainer.innerHTML = `
            <div class="bg-white dark:bg-slate-800 p-2 animate-fade-in">
                <form id="form-lembaga-direct" onsubmit="saveLembagaDirect(event, '${recordId}')">
                    <div id="lembaga-dynamic-inputs" class="grid grid-cols-1 md:grid-cols-2 gap-5"></div>
                    <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button type="submit" id="btn-submit-lembaga" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black shadow-xl transition-transform active:scale-95 text-lg w-full sm:w-auto">
                            <i class="fa-solid fa-save mr-2"></i> Simpan Profil Yayasan
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Gunakan mesin form ajaib kita untuk merender isi inputannya!
        renderDynamicForm('lembaga-dynamic-inputs', 'lembaga', itemData);
        return; // STOP DI SINI. Jangan render baris tabel di bawah.
    }

    // ==========================================
    // UNTUK TAB SELAIN LEMBAGA: RENDER TABEL NORMAL
    // ==========================================
    tableNode.classList.remove('hidden');
    directContainer.classList.add('hidden');

    titleEl.innerHTML = `<i class="fa-solid fa-table mr-2"></i> Manajemen ${config.title}`;
    
    let theadHTML = '<tr>';
    config.headers.forEach(h => { theadHTML += `<th class="p-3 font-semibold text-slate-600 dark:text-slate-300">${h}</th>`; });
    theadHTML += `<th class="p-3 font-semibold text-right">Aksi</th></tr>`;
    theadEl.innerHTML = theadHTML;

    let rawData = [];
    if (currentDataMasterTab === 'dm-tugas') rawData = appData.dataMaster.tugas || appData.tugas;
    else if (currentDataMasterTab === 'dm-pegawai') rawData = appData.dataMaster.pegawai || [];
    else if (currentDataMasterTab === 'dm-anak') rawData = appData.dataMaster.anak || [];
    else if (currentDataMasterTab === 'dm-donatur') rawData = appData.dataMaster.donatur || [];
    else if (currentDataMasterTab === 'dm-keuangan') rawData = appData.dataMaster.keuangan || [];
    else if (currentDataMasterTab === 'dm-surat') rawData = appData.dataMaster.surat || [];
    else if (currentDataMasterTab === 'dm-mapel') rawData = appData.dataMaster.mapel || [];
    else if (currentDataMasterTab === 'dm-kelas') rawData = appData.dataMaster.kelas || [];

    tbodyEl.innerHTML = '';

    if (rawData.length === 0) {
        tbodyEl.innerHTML = `<tr><td colspan="${config.headers.length + 1}" class="p-8 text-center text-slate-500 font-medium">Belum ada data ${config.title}.</td></tr>`;
        return;
    }

    rawData.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
        
        let rowHTML = '';
        config.headers.forEach(header => {
            let key = formatHeaderToKey(header);
            let val = item[key] || item[header.toLowerCase()] || '-';
            if (currentDataMasterTab === 'dm-keuangan' && header === 'Nominal') val = formatRupiah(val);
            if (header === 'ID') val = `<span class="text-xs text-slate-400 font-mono">#${String(val).substring(0,6)}..</span>`;
            if (String(val).startsWith('http')) val = `<a href="${val}" target="_blank" class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs hover:bg-indigo-100"><i class="fa-solid fa-link"></i> Berkas</a>`;
            rowHTML += `<td class="p-3 border-b border-slate-100 dark:border-slate-700 max-w-[150px] truncate" title="${escapeHTML(String(val))}">${val}</td>`;
        });

        const stringifiedItem = encodeURIComponent(JSON.stringify(item)).replace(/'/g, "%27");
        const recordId = item.id || item.ID || item.iD || '';

        rowHTML += `
            <td class="p-3 border-b border-slate-100 dark:border-slate-700 text-right">
                <button onclick="openCRUDModal('${stringifiedItem}')" class="text-blue-500 hover:text-blue-700 mx-1 p-1"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteData('${recordId}')" class="text-red-500 hover:text-red-700 mx-1 p-1"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tr.innerHTML = rowHTML;
        tbodyEl.appendChild(tr);
    });
}

// ==========================================
// MESIN RENDER FORM UNIVERSAL (Bisa dipakai CRUD & Bulk)
// ==========================================
function renderDynamicForm(containerId, prefix, itemData = {}) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const createGroup = (label, type, idSuffix, value = '', placeholder = '') => {
        let valStr = value !== undefined && value !== null ? escapeHTML(String(value)) : '';
        return `<div><label class="block text-sm font-bold mb-1">${label}</label><input type="${type}" id="${prefix}-${idSuffix}" value="${valStr}" placeholder="${placeholder}" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary"></div>`;
    };

    if (currentDataMasterTab === 'dm-tugas') {
        container.innerHTML += createGroup('Judul Tugas', 'text', 'judul', itemData.judul);
        container.innerHTML += createGroup('Penanggung Jawab', 'text', 'penanggungJawab', itemData.penanggungJawab);
        container.innerHTML += createGroup('Tenggat Waktu', 'date', 'tenggat', itemData.tenggat);
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Status</label><select id="${prefix}-status" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Proses" ${itemData.status === 'Proses' ? 'selected' : ''}>Sedang Proses</option><option value="Selesai" ${itemData.status === 'Selesai' ? 'selected' : ''}>Selesai</option></select></div>`;
    } 
    else if (currentDataMasterTab === 'dm-pegawai') {
        container.innerHTML += createGroup('Nama Lengkap', 'text', 'nama', itemData.nama);
        container.innerHTML += createGroup('Username', 'text', 'username', itemData.username);
        container.innerHTML += createGroup('Password', 'password', 'password', '', 'Biarkan kosong jika tidak diubah');
        container.innerHTML += createGroup('Email', 'email', 'email', itemData.email);
        container.innerHTML += createGroup('ID Pegawai', 'text', 'idPegawai', itemData.idPegawai || itemData.idpegawai);
        container.innerHTML += createGroup('Jabatan (Gunakan koma)', 'text', 'jabatan', itemData.jabatan);
        container.innerHTML += createGroup('Kuota Jam Mengajar (Khusus Guru)', 'number', 'kuotaJam', itemData.kuotaJam || itemData.kuota_jam || 0);
        
        container.innerHTML += `<div id="${prefix}-dynamic-tipe-absensi-container" class="col-span-full mt-2 mb-2 p-3 bg-blue-50/50 dark:bg-slate-800 rounded border border-blue-100 dark:border-slate-700"></div>`;
        
        container.innerHTML += createGroup('Tempat, Tanggal Lahir', 'text', 'tempatTanggalLahir', itemData.tempatTanggalLahir || itemData.tempattanggallahir);
        container.innerHTML += createGroup('Pendidikan Terakhir', 'text', 'pendidikan', itemData.pendidikan);
        container.innerHTML += createGroup('No. Handphone/WA', 'number', 'noHp', itemData.noHp || itemData.nohp);
        container.innerHTML += createGroup('Alamat', 'text', 'alamat', itemData.alamat);
        
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Status Keasramahan</label><select id="${prefix}-statusAsrama" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Non-Asrama" ${itemData.statusAsrama === 'Non-Asrama' ? 'selected' : ''}>Tidak Berasrama</option><option value="Berasrama" ${itemData.statusAsrama === 'Berasrama' ? 'selected' : ''}>Berasrama</option></select></div>`;
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Role Sistem</label><select id="${prefix}-role" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="user" ${itemData.role === 'user' ? 'selected' : ''}>User Biasa</option><option value="admin" ${itemData.role === 'admin' ? 'selected' : ''}>Administrator</option></select></div>`;

        setTimeout(() => {
            const inputJabatan = document.getElementById(`${prefix}-jabatan`);
            const renderDynamicSubConfigs = () => {
                const jabatans = inputJabatan.value.split(',').map(j => j.trim()).filter(j => j !== '');
                const containerTA = document.getElementById(`${prefix}-dynamic-tipe-absensi-container`);
                if (containerTA) {
                    let savedConfig = {};
                    try { savedConfig = JSON.parse(itemData.tipeAbsensi || '{}'); } catch (e) { if (jabatans.length > 0) savedConfig[jabatans[0]] = itemData.tipeAbsensi; }
                    let htmlTA = '<label class="block text-sm font-bold mb-2 text-blue-600 dark:text-blue-400"><i class="fa-solid fa-fingerprint mr-1"></i> Tipe Absensi (Disesuaikan per Jabatan)</label>';
                    if (jabatans.length === 0) htmlTA += '<p class="text-xs text-slate-500 italic">Isi kolom jabatan di atas terlebih dahulu.</p>';
                    else {
                        jabatans.forEach(jab => {
                            let currentTipe = savedConfig[jab] || 'Tipe 4';
                            htmlTA += `
                                <div class="mb-2 flex items-center justify-between">
                                    <span class="text-sm font-bold w-1/3 text-slate-700 dark:text-slate-300">• ${escapeHTML(jab)}</span>
                                    <select class="${prefix}-tipe-absensi-item w-2/3 p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 outline-none" data-jabatan="${escapeHTML(jab)}">
                                        <option value="Tipe 4" ${currentTipe === 'Tipe 4' ? 'selected' : ''}>4. Multi Check-In & Check-Out</option>
                                        <option value="Tipe 1" ${currentTipe === 'Tipe 1' ? 'selected' : ''}>1. Tanpa Absensi</option>
                                        <option value="Tipe 2" ${currentTipe === 'Tipe 2' ? 'selected' : ''}>2. Absensi 1 Kali (Hadir)</option>
                                        <option value="Tipe 3" ${currentTipe === 'Tipe 3' ? 'selected' : ''}>3. Absensi Sesuai Kelas</option>
                                    </select>
                                </div>
                            `;
                        });
                    }
                    containerTA.innerHTML = htmlTA;
                }
            };
            if(inputJabatan) {
                inputJabatan.addEventListener('input', renderDynamicSubConfigs);
                renderDynamicSubConfigs(); 
            }
        }, 100);
    }
    else if (currentDataMasterTab === 'dm-anak') {
        // --- TAMBAHAN BARU: Dropdown Musyrif/Musyrifah ---
        const pegawais = appData.dataMaster?.pegawai || [];
        const daftarMusyrif = pegawais.filter(p => p.jabatan && (p.jabatan.toLowerCase().includes('musyrif') || p.jabatan.toLowerCase().includes('pengasuh')));
        
        let musyrifOptions = `<option value="">-- Pilih Musyrif/ah Pendamping --</option>`;
        daftarMusyrif.forEach(m => {
            let isSelected = itemData.musyrifPendamping === m.nama ? 'selected' : '';
            musyrifOptions += `<option value="${escapeHTML(m.nama)}" ${isSelected}>${escapeHTML(m.nama)} (${escapeHTML(m.jabatan)})</option>`;
        });
        // ------------------------------------------------

        container.innerHTML += createGroup('Nama Anak Asuh', 'text', 'namaAnak', itemData.namaAnak);
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Jenis Kelamin</label><select id="${prefix}-jenisKelamin" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Laki-laki" ${itemData.jenisKelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option><option value="Perempuan" ${itemData.jenisKelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option></select></div>`;
        container.innerHTML += createGroup('Tempat Lahir', 'text', 'tempatLahir', itemData.tempatLahir);
        container.innerHTML += createGroup('Tanggal Lahir', 'date', 'tanggalLahir', itemData.tanggalLahir);
        container.innerHTML += `<div class="md:col-span-2"><label class="block text-sm font-bold mb-1">Alamat Lengkap</label><textarea id="${prefix}-alamat" rows="2" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none">${escapeHTML(itemData.alamat || '')}</textarea></div>`;
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Status Anak</label><select id="${prefix}-statusAnak" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Yatim" ${itemData.statusAnak === 'Yatim' ? 'selected' : ''}>Yatim</option><option value="Piatu" ${itemData.statusAnak === 'Piatu' ? 'selected' : ''}>Piatu</option><option value="Yatim Piatu" ${itemData.statusAnak === 'Yatim Piatu' ? 'selected' : ''}>Yatim Piatu</option><option value="Dhuafa" ${itemData.statusAnak === 'Dhuafa' ? 'selected' : ''}>Dhuafa</option><option value="Reguler" ${itemData.statusAnak === 'Reguler' ? 'selected' : ''}>Reguler</option></select></div>`;
        container.innerHTML += createGroup('Pendidikan', 'text', 'pendidikan', itemData.pendidikan);
        
        // --- INPUT MUSYRIF DITAMPILKAN DI SINI ---
        container.innerHTML += `
            <div class="md:col-span-2">
                <label class="block text-sm font-bold mb-1 text-indigo-600 dark:text-indigo-400"><i class="fa-solid fa-user-shield mr-1"></i> Musyrif / Musyrifah Pendamping</label>
                <select id="${prefix}-musyrifPendamping" class="w-full p-2 border border-indigo-300 dark:border-indigo-600 rounded bg-indigo-50 dark:bg-indigo-900/20 outline-none focus:ring-2 focus:ring-indigo-500">
                    ${musyrifOptions}
                </select>
            </div>
        `;
        // -----------------------------------------

        container.innerHTML += createGroup('Tanggal Masuk', 'date', 'tanggalMasuk', itemData.tanggalMasuk);
        container.innerHTML += createGroup('Nama Ayah', 'text', 'namaAyah', itemData.namaAyah);
        container.innerHTML += createGroup('Nama Ibu', 'text', 'namaIbu', itemData.namaIbu);
        container.innerHTML += createGroup('Nama Wali Utama', 'text', 'namaWali', itemData.namaWali);
        container.innerHTML += createGroup('Pekerjaan Wali', 'text', 'pekerjaanWali', itemData.pekerjaanWali);
        container.innerHTML += createGroup('No. HP Wali', 'number', 'noHpWali', itemData.noHpWali);
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Status Keasramahan</label><select id="${prefix}-statusAsrama" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Berasrama" ${itemData.statusAsrama === 'Berasrama' ? 'selected' : ''}>Berasrama</option><option value="Non-Asrama" ${itemData.statusAsrama === 'Non-Asrama' ? 'selected' : ''}>Tidak Berasrama</option></select></div>`;
        
        let exFoto = itemData.pasFoto ? `<a href="${itemData.pasFoto}" target="_blank" class="text-[10px] text-blue-500 underline ml-2">Lihat Saat Ini</a>` : '';
        let exBerkas = itemData.berkasLain ? `<a href="${itemData.berkasLain.split(',')[0]}" target="_blank" class="text-[10px] text-blue-500 underline ml-2">Lihat Saat Ini</a>` : '';

        container.innerHTML += `
            <div class="md:col-span-2 border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 rounded mt-2 bg-slate-50 dark:bg-slate-800">
                <label class="block text-sm font-bold mb-1">📸 Upload Pas Foto ${exFoto}</label>
                <input type="file" id="${prefix}-file-foto" accept="image/*" class="text-xs text-slate-500 w-full file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer">
            </div>
            <div class="md:col-span-2 border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 rounded mt-2 bg-slate-50 dark:bg-slate-800">
                <label class="block text-sm font-bold mb-1">📑 Upload Berkas Lainnya ${exBerkas}</label>
                <input type="file" id="${prefix}-file-berkas" accept="image/*" multiple class="text-xs text-slate-500 w-full file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer">
            </div>
        `;
    }
    else if (currentDataMasterTab === 'dm-donatur') {
        container.innerHTML += createGroup('Nama Donatur', 'text', 'namaDonatur', itemData.namaDonatur);
        container.innerHTML += createGroup('Kategori', 'text', 'kategori', itemData.kategori);
        container.innerHTML += createGroup('Nomor WhatsApp', 'number', 'nomorWa', itemData.nomorWa);
        container.innerHTML += createGroup('Alamat', 'text', 'alamat', itemData.alamat);
    }
    else if (currentDataMasterTab === 'dm-keuangan') {
        container.innerHTML += createGroup('Tanggal Transaksi', 'date', 'tanggal', itemData.tanggal);
        container.innerHTML += createGroup('Nominal (Rp)', 'number', 'nominal', itemData.nominal);
        container.innerHTML += createGroup('Keterangan', 'text', 'keterangan', itemData.keterangan);
        container.innerHTML += createGroup('Penanggung Jawab', 'text', 'pic', itemData.pic);
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Tipe Transaksi</label><select id="${prefix}-tipeTransaksi" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Pemasukan" ${itemData.tipeTransaksi === 'Pemasukan' ? 'selected' : ''}>Pemasukan (In)</option><option value="Pengeluaran" ${itemData.tipeTransaksi === 'Pengeluaran' ? 'selected' : ''}>Pengeluaran (Out)</option></select></div>`;
    }
    else if (currentDataMasterTab === 'dm-surat') {
        container.innerHTML += createGroup('Nomor Surat', 'text', 'nomorSurat', itemData.nomorSurat);
        container.innerHTML += createGroup('Tanggal Surat', 'date', 'tanggal', itemData.tanggal);
        container.innerHTML += createGroup('Pengirim / Penerima', 'text', 'pengirimPenerima', itemData.pengirimPenerima);
        container.innerHTML += createGroup('Perihal', 'text', 'perihal', itemData.perihal);
        container.innerHTML += `<div><label class="block text-sm font-bold mb-1">Jenis Surat</label><select id="${prefix}-jenisSurat" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none"><option value="Surat Masuk" ${itemData.jenisSurat === 'Surat Masuk' ? 'selected' : ''}>Surat Masuk</option><option value="Surat Keluar" ${itemData.jenisSurat === 'Surat Keluar' ? 'selected' : ''}>Surat Keluar</option></select></div>`;
    }
    else if (currentDataMasterTab === 'dm-mapel') {
        container.innerHTML += createGroup('Kode Mata Pelajaran', 'text', 'kodeMapel', itemData.kodeMapel, 'Cth: MTK');
        container.innerHTML += createGroup('Nama Mata Pelajaran', 'text', 'namaMapel', itemData.namaMapel, 'Cth: Matematika');
        container.innerHTML += createGroup('Kategori', 'text', 'kategori', itemData.kategori, 'Cth: Umum');
    }
    else if (currentDataMasterTab === 'dm-kelas') {
        const pegawais = appData.dataMaster?.pegawai || [];
        const daftarGuru = pegawais.filter(p => p.jabatan && p.jabatan.toLowerCase().includes('guru'));
        let guruOptions = `<option value="">-- Pilih Wali Kelas --</option>`;
        daftarGuru.forEach(p => { guruOptions += `<option value="${escapeHTML(p.nama)}" ${itemData.waliKelas === p.nama ? 'selected' : ''}>${escapeHTML(p.nama)}</option>`; });

        const allAnak = appData.dataMaster?.anak || [];
        const allKelas = appData.dataMaster?.kelas || [];
        let assignedStudents = {};
        allKelas.forEach(k => {
            if (k.daftarSiswa) {
                k.daftarSiswa.split(',').forEach(s => { assignedStudents[s.trim()] = k.namaKelas; });
            }
        });
        let myStudents = itemData.daftarSiswa ? itemData.daftarSiswa.split(',').map(s => s.trim()) : [];
        
        let studentCheckboxes = '<div class="max-h-48 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded p-2 bg-slate-50 dark:bg-slate-700/50 custom-scrollbar">';
        if (allAnak.length === 0) studentCheckboxes += '<p class="text-xs text-slate-500 text-center py-2">Belum ada data anak panti/santri.</p>';
        else {
            allAnak.forEach(anak => {
                let isChecked = myStudents.includes(anak.namaAnak) ? 'checked' : '';
                let assignedClass = assignedStudents[anak.namaAnak];
                let isDisabled = (assignedClass && assignedClass !== itemData.namaKelas) ? 'disabled' : '';
                let labelExtra = isDisabled ? `<span class="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded ml-2">Sudah di ${escapeHTML(assignedClass)}</span>` : '';
                
                studentCheckboxes += `
                    <label class="flex items-center space-x-3 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} border-b border-slate-100 dark:border-slate-600">
                        <input type="checkbox" value="${escapeHTML(anak.namaAnak)}" class="${prefix}-siswa-checkbox w-4 h-4 text-blue-600 rounded" ${isChecked} ${isDisabled}>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${escapeHTML(anak.namaAnak)} ${labelExtra}</span>
                    </label>
                `;
            });
        }
        studentCheckboxes += '</div>';

        container.innerHTML += createGroup('Nama Kelas / Ruangan', 'text', 'namaKelas', itemData.namaKelas);
        container.innerHTML += createGroup('Kelompok / Tingkat Kelas', 'text', 'kelompokKelas', itemData.kelompokKelas, 'Cth: Kelas VII, MTs, SMA, dll');
        container.innerHTML += `<div class="mb-3"><label class="block text-sm font-bold mb-1">Wali Kelas (Khusus Guru)</label><select id="${prefix}-waliKelas" class="w-full p-2 border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/20 outline-none">${guruOptions}</select></div>`;
        container.innerHTML += createGroup('Kapasitas Ruangan', 'number', 'kapasitas', itemData.kapasitas);
        container.innerHTML += `<div class="col-span-full mt-3"><label class="block text-sm font-bold mb-1">Daftar Siswa di Kelas Ini</label>${studentCheckboxes}</div>`;
    }
    else if (currentDataMasterTab === 'dm-lembaga') {
        
        // --- 1. IDENTITAS UTAMA ---
        container.innerHTML += createGroup('Nama Lembaga / Yayasan', 'text', 'namaLembaga', itemData.namaLembaga);
        container.innerHTML += createGroup('NPSN', 'text', 'npsn', itemData.npsn);
        
        container.innerHTML += `
            <div><label class="block text-sm font-bold mb-1">Bentuk Pendidikan</label>
            <select id="${prefix}-bentukPendidikan" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Kosongkan Jika Non-Pendidikan --</option>
                <option value="SD/MI" ${itemData.bentukPendidikan === 'SD/MI' ? 'selected' : ''}>SD / MI</option>
                <option value="SMP/MTs" ${itemData.bentukPendidikan === 'SMP/MTs' ? 'selected' : ''}>SMP / MTs</option>
                <option value="SMA/MA/SMK" ${itemData.bentukPendidikan === 'SMA/MA/SMK' ? 'selected' : ''}>SMA / MA / SMK</option>
                <option value="Pesantren/PKBM" ${itemData.bentukPendidikan === 'Pesantren/PKBM' ? 'selected' : ''}>Pesantren / PKBM / Non-Formal</option>
            </select></div>
        `;

        container.innerHTML += `
            <div><label class="block text-sm font-bold mb-1">Status Sekolah</label>
            <select id="${prefix}-statusSekolah" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Kosongkan Jika Bukan Sekolah --</option>
                <option value="Swasta" ${itemData.statusSekolah === 'Swasta' ? 'selected' : ''}>Swasta</option>
                <option value="Negeri" ${itemData.statusSekolah === 'Negeri' ? 'selected' : ''}>Negeri</option>
            </select></div>
        `;

        container.innerHTML += `
            <div><label class="block text-sm font-bold mb-1">Akreditasi</label>
            <select id="${prefix}-akreditasi" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Pilih Akreditasi --</option>
                <option value="A" ${itemData.akreditasi === 'A' ? 'selected' : ''}>A</option>
                <option value="B" ${itemData.akreditasi === 'B' ? 'selected' : ''}>B</option>
                <option value="C" ${itemData.akreditasi === 'C' ? 'selected' : ''}>C</option>
                <option value="Belum Terakreditasi" ${itemData.akreditasi === 'Belum Terakreditasi' ? 'selected' : ''}>Belum Terakreditasi</option>
            </select></div>
        `;

        // --- 2. LEGALITAS & FASILITAS ---
        container.innerHTML += createGroup('SK Pendirian & SK Operasional', 'text', 'skPendirian', itemData.skPendirian);
        container.innerHTML += createGroup('Izin Operasional', 'text', 'izinOperasional', itemData.izinOperasional);
        container.innerHTML += createGroup('Tanda Daftar LKS', 'text', 'tandaDaftarLks', itemData.tandaDaftarLks);
        container.innerHTML += createGroup('NPWP Lembaga', 'text', 'npwp', itemData.npwp);
        container.innerHTML += createGroup('Rekening Bank', 'text', 'rekeningBank', itemData.rekeningBank, 'Cth: BSI 12345678 a.n Yayasan');
        container.innerHTML += createGroup('Jumlah Ruang Kelas', 'number', 'jumlahRuangKelas', itemData.jumlahRuangKelas);
        container.innerHTML += createGroup('Jumlah Asrama', 'number', 'jumlahAsrama', itemData.jumlahAsrama);
        
        container.innerHTML += `<div class="col-span-full"><label class="block text-sm font-bold mb-1">Alamat Lengkap</label><textarea id="${prefix}-alamat" rows="2" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">${escapeHTML(itemData.alamat || '')}</textarea></div>`;

        // --- 3. LOGIKA OPERASIONAL & KBM (Sistem Cerdas) ---
        container.innerHTML += `
            <div class="col-span-full mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 mb-2"><h4 class="font-bold text-indigo-600 dark:text-indigo-400"><i class="fa-solid fa-gears mr-2"></i>Pengaturan Sistem KBM & Operasional</h4></div>
            
            <div><label class="block text-sm font-bold mb-1">Jenis Operasional</label>
            <select id="${prefix}-jenisOperasional" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Pilih Operasional --</option>
                <option value="Hanya Pendidikan" ${itemData.jenisOperasional === 'Hanya Pendidikan' ? 'selected' : ''}>Hanya Pendidikan</option>
                <option value="Hanya Pengasuhan" ${itemData.jenisOperasional === 'Hanya Pengasuhan' ? 'selected' : ''}>Hanya Pengasuhan</option>
                <option value="Hanya Santunan" ${itemData.jenisOperasional === 'Hanya Santunan' ? 'selected' : ''}>Hanya Santunan</option>
                <option value="Pengasuhan dan Pendidikan" ${itemData.jenisOperasional === 'Pengasuhan dan Pendidikan' ? 'selected' : ''}>Pengasuhan dan Pendidikan</option>
            </select></div>
        `;

        container.innerHTML += `
            <div id="${prefix}-wrap-pendidikan" class="hidden">
                <label class="block text-sm font-bold mb-1">Jenis Pendidikan</label>
                <select id="${prefix}-jenisPendidikan" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Jenis Pendidikan --</option>
                    <option value="Hanya Pendidikan Umum" ${itemData.jenisPendidikan === 'Hanya Pendidikan Umum' ? 'selected' : ''}>Hanya Pendidikan Umum</option>
                    <option value="Hanya Pendidikan Agama/Tahfidz" ${itemData.jenisPendidikan === 'Hanya Pendidikan Agama/Tahfidz' ? 'selected' : ''}>Hanya Pendidikan Agama/Tahfidz</option>
                    <option value="Pendidikan Umum dan Tahfidz" ${itemData.jenisPendidikan === 'Pendidikan Umum dan Tahfidz' ? 'selected' : ''}>Pendidikan Umum dan Tahfidz</option>
                </select>
            </div>
        `;

        // Helper untuk UI
        const getNum = (val) => val ? String(val).replace(/[^0-9]/g, '') : '';
        const numIst1 = getNum(itemData.jumlahIstirahat1);
        const numIst2 = getNum(itemData.jumlahIstirahat2);
        
        // Helper khusus untuk menyaring "Wib" agar input <input type="time"> tidak error
        const getTimeVal = (val) => val ? String(val).replace(/ Wib/gi, '').trim() : '';

        // =====================================
        // PENGATURAN WAKTU KBM 1 (UMUM)
        // =====================================
        container.innerHTML += `
            <div id="${prefix}-wrap-kbm1" class="hidden space-y-4 mt-4 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h5 class="font-black text-sm text-blue-700 dark:text-blue-400 border-b-2 border-blue-200 pb-2 mb-2"><i class="fa-solid fa-clock mr-2"></i> PENGATURAN WAKTU KBM (UMUM)</h5>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label id="${prefix}-label-kbm1" class="block text-xs font-bold mb-1 text-slate-600">Durasi per Jam Pelajaran</label>
                        <select id="${prefix}-durasiKbm1" class="w-full p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="30" ${getNum(itemData.durasiKbm1) === '30' ? 'selected' : ''}>30 Menit</option>
                            <option value="45" ${getNum(itemData.durasiKbm1) === '45' ? 'selected' : ''}>45 Menit</option>
                            <option value="60" ${getNum(itemData.durasiKbm1) === '60' ? 'selected' : ''}>60 Menit</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-600">Jam Mulai Masuk Kelas</label>
                        <input type="time" id="${prefix}-jamMulaiKbm1" value="${getTimeVal(itemData.jamMulaiKbm1)}" class="w-full p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-600">Jam Pulang Sekolah</label>
                        <input type="time" id="${prefix}-jamPulangKbm1" value="${getTimeVal(itemData.jamPulangKbm1)}" class="w-full p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>

                <div class="pt-3 border-t border-blue-200 dark:border-blue-800">
                    <label class="block text-xs font-bold mb-2 text-slate-600">Frekuensi Jam Istirahat</label>
                    <select id="${prefix}-jumlahIstirahat1" class="w-full sm:w-1/3 p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500 mb-3">
                        <option value="0" ${numIst1 === '0' || numIst1 === '' ? 'selected' : ''}>Tanpa Istirahat</option>
                        <option value="1" ${numIst1 === '1' ? 'selected' : ''}>1x Istirahat</option>
                        <option value="2" ${numIst1 === '2' ? 'selected' : ''}>2x Istirahat</option>
                        <option value="3" ${numIst1 === '3' ? 'selected' : ''}>3x Istirahat</option>
                    </select>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div id="${prefix}-wrap-ist1-1" class="hidden">
                            <label class="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Waktu Istirahat 1</label>
                            <input type="text" id="${prefix}-waktuIstirahat11" value="${escapeHTML(itemData.waktuIstirahat11 || '')}" placeholder="Cth: 09:30 - 10:00" class="w-full p-2 text-sm border rounded bg-white outline-none">
                        </div>
                        <div id="${prefix}-wrap-ist1-2" class="hidden">
                            <label class="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Waktu Istirahat 2</label>
                            <input type="text" id="${prefix}-waktuIstirahat12" value="${escapeHTML(itemData.waktuIstirahat12 || '')}" placeholder="Cth: 12:00 - 13:00" class="w-full p-2 text-sm border rounded bg-white outline-none">
                        </div>
                        <div id="${prefix}-wrap-ist1-3" class="hidden">
                            <label class="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Waktu Istirahat 3</label>
                            <input type="text" id="${prefix}-waktuIstirahat13" value="${escapeHTML(itemData.waktuIstirahat13 || '')}" placeholder="Cth: 15:30 - 16:00" class="w-full p-2 text-sm border rounded bg-white outline-none">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // =====================================
        // PENGATURAN WAKTU KBM 2 (AGAMA/TAHFIDZ)
        // =====================================
        container.innerHTML += `
            <div id="${prefix}-wrap-kbm2" class="hidden space-y-4 mt-4 p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <h5 class="font-black text-sm text-green-700 dark:text-green-400 border-b-2 border-green-200 pb-2 mb-2"><i class="fa-solid fa-quran mr-2"></i> PENGATURAN WAKTU KBM (TAHFIDZ/AGAMA)</h5>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-600">Durasi per Jam Pelajaran</label>
                        <select id="${prefix}-durasiKbm2" class="w-full p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-green-500">
                            <option value="30" ${getNum(itemData.durasiKbm2) === '30' ? 'selected' : ''}>30 Menit</option>
                            <option value="45" ${getNum(itemData.durasiKbm2) === '45' ? 'selected' : ''}>45 Menit</option>
                            <option value="60" ${getNum(itemData.durasiKbm2) === '60' ? 'selected' : ''}>60 Menit</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-600">Jam Mulai KBM Tahfidz</label>
                        <input type="time" id="${prefix}-jamMulaiKbm2" value="${getTimeVal(itemData.jamMulaiKbm2)}" class="w-full p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-slate-600">Jam Selesai KBM Tahfidz</label>
                        <input type="time" id="${prefix}-jamPulangKbm2" value="${getTimeVal(itemData.jamPulangKbm2)}" class="w-full p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                </div>

                <div class="pt-3 border-t border-green-200 dark:border-green-800">
                    <label class="block text-xs font-bold mb-2 text-slate-600">Frekuensi Istirahat Tahfidz</label>
                    <select id="${prefix}-jumlahIstirahat2" class="w-full sm:w-1/3 p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:ring-2 focus:ring-green-500 mb-3">
                        <option value="0" ${numIst2 === '0' || numIst2 === '' ? 'selected' : ''}>Tanpa Istirahat</option>
                        <option value="1" ${numIst2 === '1' ? 'selected' : ''}>1x Istirahat</option>
                        <option value="2" ${numIst2 === '2' ? 'selected' : ''}>2x Istirahat</option>
                        <option value="3" ${numIst2 === '3' ? 'selected' : ''}>3x Istirahat</option>
                    </select>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div id="${prefix}-wrap-ist2-1" class="hidden">
                            <label class="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Waktu Istirahat 1</label>
                            <input type="text" id="${prefix}-waktuIstirahat21" value="${escapeHTML(itemData.waktuIstirahat21 || '')}" placeholder="Cth: 09:30 - 10:00" class="w-full p-2 text-sm border rounded bg-white outline-none">
                        </div>
                        <div id="${prefix}-wrap-ist2-2" class="hidden">
                            <label class="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Waktu Istirahat 2</label>
                            <input type="text" id="${prefix}-waktuIstirahat22" value="${escapeHTML(itemData.waktuIstirahat22 || '')}" placeholder="Cth: 12:00 - 13:00" class="w-full p-2 text-sm border rounded bg-white outline-none">
                        </div>
                        <div id="${prefix}-wrap-ist2-3" class="hidden">
                            <label class="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Waktu Istirahat 3</label>
                            <input type="text" id="${prefix}-waktuIstirahat23" value="${escapeHTML(itemData.waktuIstirahat23 || '')}" placeholder="Cth: 15:30 - 16:00" class="w-full p-2 text-sm border rounded bg-white outline-none">
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML += `
            <div><label class="block text-sm font-bold mb-1">Hari Libur Mingguan</label>
            <select id="${prefix}-hariLibur" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Hanya Jum'at" ${itemData.hariLibur === "Hanya Jum'at" ? 'selected' : ''}>Hanya Jum'at</option>
                <option value="Hanya Ahad" ${itemData.hariLibur === "Hanya Ahad" ? 'selected' : ''}>Hanya Ahad</option>
                <option value="Sabtu-Ahad" ${itemData.hariLibur === "Sabtu-Ahad" ? 'selected' : ''}>Sabtu-Ahad</option>
                <option value="Jum'at dan Ahad" ${itemData.hariLibur === "Jum'at dan Ahad" ? 'selected' : ''}>Jum'at dan Ahad</option>
                <option value="Jum'at dan Sabtu" ${itemData.hariLibur === "Jum'at dan Sabtu" ? 'selected' : ''}>Jum'at dan Sabtu</option>
            </select></div>
        `;

        container.innerHTML += `
            <div><label class="block text-sm font-bold mb-1">Sistem Kurikulum KBM</label>
            <select id="${prefix}-sistemKbm" class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Ikut Pemerintah" ${itemData.sistemKbm === "Ikut Pemerintah" ? 'selected' : ''}>Ikut Pemerintah (Diknas/Kemenag)</option>
                <option value="Ikut Sistem Kuliah" ${itemData.sistemKbm === "Ikut Sistem Kuliah" ? 'selected' : ''}>Ikut Sistem Kuliah (SKS)</option>
                <option value="Sistem KBM Sendiri" ${itemData.sistemKbm === "Sistem KBM Sendiri" ? 'selected' : ''}>Sistem Mandiri Yayasan</option>
            </select></div>
        `;

        // =====================================
        // PENGATURAN ABSENSI & KEPEGAWAIAN
        // =====================================
        container.innerHTML += `
            <div class="col-span-full mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 mb-2">
                <h4 class="font-bold text-red-600 dark:text-red-400"><i class="fa-solid fa-fingerprint mr-2"></i>Pengaturan Sistem Presensi Pegawai</h4>
            </div>

            <div>
                <label class="block text-sm font-bold mb-1">Tingkat Kedisiplinan / Kebijakan</label>
                <select id="${prefix}-kebijakanAbsensi" class="w-full p-2 border border-slate-300 rounded bg-slate-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700">
                    <option value="Longgar" ${itemData.kebijakanAbsensi === 'Longgar' ? 'selected' : ''}>1. Longgar (Isi Keterlambatan Manual)</option>
                    <option value="Semi Ketat" ${itemData.kebijakanAbsensi === 'Semi Ketat' ? 'selected' : ''}>2. Semi Ketat (Kalkulasi Keterlambatan Otomatis)</option>
                    <option value="Super Ketat" ${itemData.kebijakanAbsensi === 'Super Ketat' ? 'selected' : ''}>3. Super Ketat (Wajib Geolokasi GPS & Radius)</option>
                </select>
            </div>

            <div id="${prefix}-wrap-jamKerja">
                <label class="block text-sm font-bold mb-1">Jam Wajib Masuk Kerja</label>
                <input type="time" id="${prefix}-jamKerjaMasuk" value="${escapeHTML((itemData.jamKerjaMasuk || '').replace(/ Wib/gi, '').trim())}" class="w-full p-2 border border-slate-300 rounded bg-slate-50 outline-none focus:ring-2 focus:ring-red-500">
            </div>

            <div id="${prefix}-wrap-gpsAbsensi" class="hidden col-span-full grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="col-span-full text-xs text-red-600 mb-2 italic">*Mode Super Ketat aktif. Tentukan titik pusat sekolah dan toleransi jarak.</p>
                <div>
                    <label class="block text-xs font-bold mb-1">Koordinat GPS Kantor (Lat, Long)</label>
                    <input type="text" id="${prefix}-koordinatKantor" value="${escapeHTML(itemData.koordinatKantor || '')}" placeholder="Cth: -2.972304, 104.757303" class="w-full p-2 text-sm border rounded bg-white outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold mb-1">Radius Toleransi Absen (Meter)</label>
                    <input type="number" id="${prefix}-radiusAbsen" value="${escapeHTML(itemData.radiusAbsen || '50')}" placeholder="Cth: 50" class="w-full p-2 text-sm border rounded bg-white outline-none">
                </div>
            </div>
        `;

        // LOGIKA KECERDASAN FORM
        setTimeout(() => {
            const opSelect = document.getElementById(`${prefix}-jenisOperasional`);
            const pendSelect = document.getElementById(`${prefix}-jenisPendidikan`);
            
            const wrapPend = document.getElementById(`${prefix}-wrap-pendidikan`);
            const wrapKbm1 = document.getElementById(`${prefix}-wrap-kbm1`);
            const wrapKbm2 = document.getElementById(`${prefix}-wrap-kbm2`);
            const labelKbm1 = document.getElementById(`${prefix}-label-kbm1`);

            // --- DEKLARASI ELEMEN ISTIRAHAT KBM 1 ---
            const jmlIst1 = document.getElementById(`${prefix}-jumlahIstirahat1`);
            const wIst1_1 = document.getElementById(`${prefix}-wrap-ist1-1`);
            const wIst1_2 = document.getElementById(`${prefix}-wrap-ist1-2`);
            const wIst1_3 = document.getElementById(`${prefix}-wrap-ist1-3`);

            // --- DEKLARASI ELEMEN ISTIRAHAT KBM 2 ---
            const jmlIst2 = document.getElementById(`${prefix}-jumlahIstirahat2`);
            const wIst2_1 = document.getElementById(`${prefix}-wrap-ist2-1`);
            const wIst2_2 = document.getElementById(`${prefix}-wrap-ist2-2`);
            const wIst2_3 = document.getElementById(`${prefix}-wrap-ist2-3`);

            // --- DEKLARASI ELEMEN ABSENSI ---
            const selectKebijakan = document.getElementById(`${prefix}-kebijakanAbsensi`);
            const wrapJamKerja = document.getElementById(`${prefix}-wrap-jamKerja`);
            const wrapGps = document.getElementById(`${prefix}-wrap-gpsAbsensi`);

            const evaluasiLogika = () => {
                const op = opSelect ? opSelect.value : '';
                const pend = pendSelect ? pendSelect.value : '';

                // Buka/Tutup KBM Utama
                if (op === 'Hanya Pendidikan' || op === 'Pengasuhan dan Pendidikan') {
                    if(wrapPend) wrapPend.classList.remove('hidden');
                    if(wrapKbm1) wrapKbm1.classList.remove('hidden');
                } else {
                    if(wrapPend) wrapPend.classList.add('hidden');
                    if(wrapKbm1) wrapKbm1.classList.add('hidden');
                    if(wrapKbm2) wrapKbm2.classList.add('hidden');
                    if(pendSelect) pendSelect.value = ""; 
                }

                // Buka/Tutup KBM Tahfidz (KBM 2)
                if (wrapPend && !wrapPend.classList.contains('hidden') && pend === 'Pendidikan Umum dan Tahfidz') {
                    if(wrapKbm2) wrapKbm2.classList.remove('hidden');
                    if(labelKbm1) labelKbm1.textContent = 'Durasi KBM Umum';
                } else {
                    if(wrapKbm2) wrapKbm2.classList.add('hidden');
                    if(labelKbm1) labelKbm1.textContent = 'Durasi per Jam Pelajaran';
                }

                // Logika Dinamis Istirahat 1
                if (jmlIst1) {
                    let val1 = parseInt(jmlIst1.value) || 0;
                    if(wIst1_1) wIst1_1.classList.toggle('hidden', val1 < 1);
                    if(wIst1_2) wIst1_2.classList.toggle('hidden', val1 < 2);
                    if(wIst1_3) wIst1_3.classList.toggle('hidden', val1 < 3);
                }

                // Logika Dinamis Istirahat 2
                if (jmlIst2) {
                    let val2 = parseInt(jmlIst2.value) || 0;
                    if(wIst2_1) wIst2_1.classList.toggle('hidden', val2 < 1);
                    if(wIst2_2) wIst2_2.classList.toggle('hidden', val2 < 2);
                    if(wIst2_3) wIst2_3.classList.toggle('hidden', val2 < 3);
                }

                // ==========================================
                // LOGIKA OTOMATIS BUKA/TUTUP SETTING ABSENSI
                // ==========================================
                if (selectKebijakan) {
                    const keb = selectKebijakan.value;
                    if (keb === 'Longgar') {
                        if (wrapJamKerja) wrapJamKerja.classList.add('hidden');
                        if (wrapGps) wrapGps.classList.remove('grid'); wrapGps?.classList.add('hidden');
                    } else if (keb === 'Semi Ketat') {
                        if (wrapJamKerja) wrapJamKerja.classList.remove('hidden');
                        if (wrapGps) wrapGps.classList.remove('grid'); wrapGps?.classList.add('hidden');
                    } else if (keb === 'Super Ketat') {
                        if (wrapJamKerja) wrapJamKerja.classList.remove('hidden');
                        if (wrapGps) wrapGps.classList.remove('hidden'); wrapGps?.classList.add('grid');
                    }
                }
            };

            // Pasang Pendeteksi Perubahan (Event Listener)
            if(opSelect) opSelect.addEventListener('change', evaluasiLogika);
            if(pendSelect) pendSelect.addEventListener('change', evaluasiLogika);
            if(jmlIst1) jmlIst1.addEventListener('change', evaluasiLogika);
            if(jmlIst2) jmlIst2.addEventListener('change', evaluasiLogika);
            if(selectKebijakan) selectKebijakan.addEventListener('change', evaluasiLogika); // Pasang sensor di kebijakan!
            
            // Panggil sekali saat form baru dibuka untuk menyesuaikan tampilan awal
            evaluasiLogika();
        }, 100);
    }
}

// ==========================================
// MESIN PENGUMPUL DATA UNIVERSAL (Bisa dipakai CRUD & Bulk)
// ==========================================
function extractDataFromForm(prefix, isUpdate = false) {
    let payloadData = {};
    const inputs = document.querySelectorAll(`#${prefix}-dynamic-inputs input, #${prefix}-dynamic-inputs select, #${prefix}-dynamic-inputs textarea`);
    
    inputs.forEach(input => {
        let key = input.id.replace(`${prefix}-`, '');
        if (key !== 'id' && input.type !== 'file' && input.type !== 'checkbox') {
            if (key === 'password' && input.value === '' && isUpdate) { /* Ignore */ } 
            else { payloadData[key] = input.value; }
        }
    });

    if (currentDataMasterTab === 'dm-pegawai') {
        const selects = document.querySelectorAll(`.${prefix}-tipe-absensi-item`);
        let tipeObj = {};
        selects.forEach(sel => { tipeObj[sel.getAttribute('data-jabatan')] = sel.value; });
        payloadData.tipeAbsensi = JSON.stringify(tipeObj);
    }
    else if (currentDataMasterTab === 'dm-kelas') {
        const checkedSiswa = Array.from(document.querySelectorAll(`.${prefix}-siswa-checkbox:checked`)).map(cb => cb.value);
        payloadData.daftarSiswa = checkedSiswa.join(', ');
        payloadData.jumlahSiswa = checkedSiswa.length;
    }
    else if (currentDataMasterTab === 'dm-tugas') {
        let targetEditor = prefix === 'bulk' ? bulkQuillEditor : quillEditor;
        if (targetEditor) {
            payloadData.deskripsi = targetEditor.root.innerHTML;
            payloadData.pembuat = currentUser.nama;
        }
    }
    else if (currentDataMasterTab === 'dm-anak') {
        const fFoto = document.getElementById(`${prefix}-file-foto`);
        const fBerkas = document.getElementById(`${prefix}-file-berkas`);
        payloadData.rawFotoFile = (fFoto && fFoto.files.length > 0) ? fFoto.files[0] : null;
        payloadData.rawBerkasFiles = [];
        if (fBerkas && fBerkas.files.length > 0) {
            for(let i=0; i<fBerkas.files.length; i++) payloadData.rawBerkasFiles.push(fBerkas.files[i]);
        }
    }
    // =====================================
    // FORMAT OTOMATIS KHUSUS LEMBAGA
    // =====================================
    else if (currentDataMasterTab === 'dm-lembaga') {
        // 1. Otomatis tambah " Menit" HANYA pada Durasi KBM
        const keysMenit = ['durasiKbm1', 'durasiKbm2'];
        keysMenit.forEach(k => {
            if (payloadData[k] && payloadData[k].trim() !== '') {
                payloadData[k] = payloadData[k].replace(/[^0-9]/g, '') + ' Menit';
            }
        });

        // 2. Otomatis tambah " kali" pada Frekuensi Istirahat
        const keysKali = ['jumlahIstirahat1', 'jumlahIstirahat2'];
        keysKali.forEach(k => {
            if (payloadData[k] && payloadData[k].trim() !== '') {
                payloadData[k] = payloadData[k].replace(/[^0-9]/g, '') + ' kali';
            }
        });

        // 3. Otomatis tambah " Wib" pada Jam agar tidak diubah oleh Google Sheets
        const keysJam = ['jamMulaiKbm1', 'jamPulangKbm1', 'jamMulaiKbm2', 'jamPulangKbm2', 'jamKerjaMasuk'];
        keysJam.forEach(k => {
            if (payloadData[k] && payloadData[k].trim() !== '') {
                // Bersihkan teks "Wib" lama (jika ada), lalu tambahkan yang baru dengan rapi
                let cleanTime = payloadData[k].replace(/ Wib/gi, '').trim();
                payloadData[k] = cleanTime + ' Wib';
            }
        });

        
    }

    return payloadData;
}

// ==========================================
// LOGIKA CRUD TUNGGAL (EDIT & TAMBAH 1 DATA)
// ==========================================
function openCRUDModal(itemJsonString = null) {
    const config = DM_CONFIG[currentDataMasterTab];
    const modalTitle = document.getElementById('crud-modal-title');
    const quillContainer = document.getElementById('crud-quill-container');
    
    let isEdit = false;
    let itemData = {};

    if (itemJsonString) {
            try {
                // Coba terjemahkan data yang sudah disandikan
                const decodedStr = decodeURIComponent(itemJsonString);
                itemData = JSON.parse(decodedStr);
                isEdit = true;
            } catch(e) {
                // Jika gagal (untuk data format lama), gunakan cara standar
                const unescapedString = String(itemJsonString).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                itemData = JSON.parse(unescapedString);
                isEdit = true;
            }
            modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i> Edit Data ${config.title}`;
        } else {
        modalTitle.innerHTML = `<i class="fa-solid fa-plus-circle mr-2"></i> Tambah Data ${config.title}`;
    }

    renderDynamicForm('crud-dynamic-inputs', 'crud', itemData);

    const recordIdValue = itemData.id || itemData.ID || itemData.iD || '';
    if (document.getElementById('crud-id')) document.getElementById('crud-id').remove();
    document.getElementById('crud-dynamic-inputs').innerHTML += `<input type="hidden" id="crud-id" value="${isEdit ? recordIdValue : ''}">`;

    if (currentDataMasterTab === 'dm-tugas') {
        initQuill();
        quillContainer.classList.remove('hidden');
        if (isEdit && itemData.deskripsi) quillEditor.clipboard.dangerouslyPasteHTML(itemData.deskripsi);
        else quillEditor.setText(''); 
    } else {
        quillContainer.classList.add('hidden');
    }

    toggleModal('modal-crud');
}

async function handleCRUDSubmit(event) {
    event.preventDefault();
    const config = DM_CONFIG[currentDataMasterTab];
    const submitBtn = document.getElementById('btn-submit-crud');
    const recordId = document.getElementById('crud-id').value;
    const isUpdate = recordId !== '';

    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memproses...';
    submitBtn.disabled = true;

    let payloadData = extractDataFromForm('crud', isUpdate);

    try {
        if (currentDataMasterTab === 'dm-anak') {
            if (payloadData.rawFotoFile) {
                if(typeof showGlobalLoading === "function") showGlobalLoading('Mengunggah Foto...');
                payloadData.pasFoto = await helperUploadToCloudinary(await imageCompression(payloadData.rawFotoFile, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }));
            }
            if (payloadData.rawBerkasFiles && payloadData.rawBerkasFiles.length > 0) {
                let arrUrls = [];
                for (let i = 0; i < payloadData.rawBerkasFiles.length; i++) {
                    if(typeof showGlobalLoading === "function") showGlobalLoading(`Mengunggah Berkas ${i+1}...`);
                    arrUrls.push(await helperUploadToCloudinary(await imageCompression(payloadData.rawBerkasFiles[i], { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true })));
                }
                payloadData.berkasLain = arrUrls.join(', ');
            }
            delete payloadData.rawFotoFile; delete payloadData.rawBerkasFiles;
        }

        if(typeof showGlobalLoading === "function") showGlobalLoading('Menyimpan ke Database...');
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: isUpdate ? 'crudUpdate' : 'crudCreate', payload: { sheetName: config.sheet, id: recordId, data: payloadData } })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            toggleModal('modal-crud');
            if(typeof showGlobalLoading === "function") showGlobalLoading('Memperbarui Layar...');
            await loadAppData(); renderDataMasterTable();
            alert(result.message);
        } else alert('Gagal: ' + result.message);
    } catch (e) { alert('Terjadi kesalahan koneksi.'); } 
    finally { 
        submitBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i> Simpan Data'; 
        submitBtn.disabled = false; 
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
    }
}

async function handleDeleteData(id) {
    if (!confirm("PERINGATAN: Anda yakin ingin menghapus data ini permanen?")) return;
    try {
        if(typeof showGlobalLoading === "function") showGlobalLoading('Menghapus Data...');
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudDelete', payload: { sheetName: DM_CONFIG[currentDataMasterTab].sheet, id: id } })
        });
        const result = await response.json();
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        if (result.status === 'success') { await loadAppData(); renderDataMasterTable(); }
        else alert('Gagal menghapus data: ' + result.message);
    } catch (e) { if(typeof hideGlobalLoading === "function") hideGlobalLoading(); alert('Kesalahan koneksi saat menghapus.'); } 
}

// ==================================================
// LOGIKA UNIVERSAL BULK (KERANJANG MASSAL UNTUK SEMUA MODUL)
// ==================================================
function injectBulkModalHTML() {
    if (document.getElementById('modal-bulk-universal')) return;
    const modalHtml = `
        <div id="modal-bulk-universal" class="hidden fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row h-[90vh] overflow-hidden">
                <div class="w-full md:w-1/2 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col h-1/2 md:h-full">
                    <div class="flex justify-between items-center mb-4"><h3 class="text-lg font-bold text-indigo-600 dark:text-indigo-400" id="bulk-modal-title">Input Bulk</h3><button onclick="toggleModal('modal-bulk-universal')" class="md:hidden text-slate-500 hover:text-red-500"><i class="fa-solid fa-times text-xl"></i></button></div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        <form id="form-bulk-universal" onsubmit="addUniversalToBulk(event)" class="space-y-4">
                            <div id="bulk-dynamic-inputs" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                            <div id="bulk-quill-container" class="hidden col-span-full mt-4"><label class="block text-sm font-bold mb-2">Deskripsi</label><div class="bg-white text-black border border-slate-300 rounded overflow-hidden"><div id="bulk-quill-editor" style="height: 150px;"></div></div></div>
                            <button type="submit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"><i class="fa-solid fa-cart-plus mr-2"></i>Tambah ke Antrean</button>
                        </form>
                    </div>
                </div>
                <div class="w-full md:w-1/2 p-4 md:p-6 flex flex-col bg-slate-50 dark:bg-slate-900/50 h-1/2 md:h-full">
                    <div class="flex justify-between items-center mb-4"><h3 class="text-lg font-bold">Keranjang Antrean (<span id="bulk-univ-count" class="text-indigo-600">0</span>)</h3><button onclick="toggleModal('modal-bulk-universal')" class="hidden md:block text-slate-500 hover:text-red-500"><i class="fa-solid fa-times text-xl"></i></button></div>
                    <div id="list-bulk-univ" class="flex-1 overflow-y-auto custom-scrollbar space-y-2"></div>
                    <div class="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700"><button onclick="submitUniversalBulk()" id="btn-submit-bulk-univ" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled><i class="fa-solid fa-cloud-arrow-up mr-2"></i>Simpan Semua ke Database</button></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openUniversalBulkModal() {
    universalBulkCart = [];
    renderUniversalBulkList();
    const config = DM_CONFIG[currentDataMasterTab];
    document.getElementById('bulk-modal-title').innerHTML = `<i class="fa-solid fa-layer-group mr-2"></i> Bulk Input: ${config.title}`;
    
    renderDynamicForm('bulk-dynamic-inputs', 'bulk', {});
    
    if (currentDataMasterTab === 'dm-tugas') {
        initQuill();
        document.getElementById('bulk-quill-container').classList.remove('hidden');
        if(bulkQuillEditor) bulkQuillEditor.setText('');
    } else {
        document.getElementById('bulk-quill-container').classList.add('hidden');
    }

    toggleModal('modal-bulk-universal');
}

function addUniversalToBulk(event) {
    event.preventDefault();
    const payloadData = extractDataFromForm('bulk', false);
    
    // Memberikan judul representatif untuk ditampilkan di keranjang (agar UI cantik)
    let displayTitle = "Data Baru";
    let displaySub = "Siap diunggah";
    if(payloadData.namaAnak) displayTitle = payloadData.namaAnak;
    else if(payloadData.nama) displayTitle = payloadData.nama;
    else if(payloadData.namaMapel) displayTitle = payloadData.namaMapel;
    else if(payloadData.namaKelas) displayTitle = payloadData.namaKelas;
    else if(payloadData.judul) displayTitle = payloadData.judul;
    else if(payloadData.namaDonatur) displayTitle = payloadData.namaDonatur;
    else if(payloadData.keterangan) displayTitle = payloadData.keterangan;

    payloadData._displayTitle = displayTitle;
    payloadData._displaySub = displaySub;

    universalBulkCart.push(payloadData);
    
    document.getElementById('form-bulk-universal').reset();
    if(currentDataMasterTab === 'dm-tugas' && bulkQuillEditor) bulkQuillEditor.setText('');
    
    renderDynamicForm('bulk-dynamic-inputs', 'bulk', {}); // Reset special logic like checkboxes
    renderUniversalBulkList();
}

function removeUniversalBulk(index) {
    universalBulkCart.splice(index, 1);
    renderUniversalBulkList();
}

function renderUniversalBulkList() {
    const container = document.getElementById('list-bulk-univ');
    const countLabel = document.getElementById('bulk-univ-count');
    const btnSubmit = document.getElementById('btn-submit-bulk-univ');

    if(countLabel) countLabel.textContent = universalBulkCart.length;

    if (universalBulkCart.length === 0) {
        if(container) container.innerHTML = '<div class="text-center text-slate-400 text-xs italic mt-10 flex flex-col items-center"><i class="fa-solid fa-box-open text-3xl mb-2 opacity-50"></i>Keranjang kosong. Isi form di sebelah kiri.</div>';
        if(btnSubmit) btnSubmit.disabled = true;
        return;
    }

    if(btnSubmit) btnSubmit.disabled = false;
    if(container) container.innerHTML = '';

    universalBulkCart.forEach((item, index) => {
        let attachStr = '';
        if(item.rawFotoFile) attachStr += '<span class="bg-blue-100 text-blue-700 text-[9px] px-1 rounded ml-1">1 Foto</span>';
        if(item.rawBerkasFiles && item.rawBerkasFiles.length > 0) attachStr += `<span class="bg-orange-100 text-orange-700 text-[9px] px-1 rounded ml-1">${item.rawBerkasFiles.length} Berkas</span>`;

        container.innerHTML += `
            <div class="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded shadow-sm flex justify-between items-center">
                <div class="min-w-0 flex-1">
                    <p class="font-bold text-sm truncate">${escapeHTML(item._displayTitle)}</p>
                    <p class="text-[10px] text-slate-500">${escapeHTML(item._displaySub)} ${attachStr}</p>
                </div>
                <button type="button" onclick="removeUniversalBulk(${index})" class="text-red-500 hover:text-red-700 ml-3 p-2 bg-red-50 dark:bg-red-900/30 rounded"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

async function helperUploadToCloudinary(blobFile) {
    const formData = new FormData();
    formData.append('file', blobFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url;
}

async function submitUniversalBulk() {
    if (universalBulkCart.length === 0) return;
    const config = DM_CONFIG[currentDataMasterTab];
    
    if(typeof showGlobalLoading === "function") showGlobalLoading(`Memproses ${universalBulkCart.length} Data ke Database...`);

    try {
        for (let i = 0; i < universalBulkCart.length; i++) {
            let payloadData = universalBulkCart[i];
            
            // Proses File untuk Anak Asuh
            if (currentDataMasterTab === 'dm-anak') {
                if (payloadData.rawFotoFile) {
                    if(typeof showGlobalLoading === "function") showGlobalLoading(`Mengunggah foto ${payloadData._displayTitle}...`);
                    payloadData.pasFoto = await helperUploadToCloudinary(await imageCompression(payloadData.rawFotoFile, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }));
                }
                if (payloadData.rawBerkasFiles && payloadData.rawBerkasFiles.length > 0) {
                    let arrUrls = [];
                    for (let x = 0; x < payloadData.rawBerkasFiles.length; x++) {
                        if(typeof showGlobalLoading === "function") showGlobalLoading(`Mengunggah berkas ${payloadData._displayTitle}...`);
                        arrUrls.push(await helperUploadToCloudinary(await imageCompression(payloadData.rawBerkasFiles[x], { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true })));
                    }
                    payloadData.berkasLain = arrUrls.join(', ');
                }
            }

            // Bersihkan data sampah memori sebelum dikirim
            delete payloadData.rawFotoFile; delete payloadData.rawBerkasFiles;
            delete payloadData._displayTitle; delete payloadData._displaySub;

            if(typeof showGlobalLoading === "function") showGlobalLoading(`Menyimpan ${i+1} dari ${universalBulkCart.length}...`);
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: config.sheet, data: payloadData } })
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
        }
        
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        toggleModal('modal-bulk-universal');
        universalBulkCart = [];
        
        await loadAppData(); 
        renderDataMasterTable();
        setTimeout(() => alert("SUKSES! Seluruh data dari keranjang berhasil diamankan di Database!"), 500);

    } catch (e) { 
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
        alert("Gagal memproses data: " + e.message); 
    }
}

// ==========================================
// FUNGSI SIMPAN KHUSUS LEMBAGA (LANGSUNG DI LUAR MODAL)
// ==========================================
async function saveLembagaDirect(event, recordId) {
    event.preventDefault();
    const submitBtn = document.getElementById('btn-submit-lembaga');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan Profil...';
    submitBtn.disabled = true;

    // Ambil data langsung dari form Lembaga
    let payloadData = extractDataFromForm('lembaga', true);
    const isUpdate = recordId !== '';

    try {
        if(typeof showGlobalLoading === "function") showGlobalLoading('Memperbarui Identitas Lembaga...');
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: isUpdate ? 'crudUpdate' : 'crudCreate', 
                payload: { sheetName: 'Lembaga', id: recordId, data: payloadData } 
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            // Hapus cache lokal agar profil terbaru langsung termuat di seluruh website
            localStorage.removeItem(`portal_appData_${currentUser.username}`);
            await loadAppData(); 
            renderDataMasterTable(); 
            alert("Berhasil! Profil & Identitas Lembaga telah diperbarui secara permanen.");
        } else alert('Gagal: ' + result.message);
    } catch (e) { 
        alert('Terjadi kesalahan koneksi.'); 
    } finally { 
        submitBtn.innerHTML = originalText; 
        submitBtn.disabled = false; 
        if(typeof hideGlobalLoading === "function") hideGlobalLoading();
    }
}

// Menjalankan Auto-Inject Modal saat halaman siap
document.addEventListener('DOMContentLoaded', injectBulkModalHTML);