// ==========================================
// FILE 5: MODULES.JS (FUNGSI KOMPONEN UI & ABSENSI)
// ==========================================

function renderProfilCV() {
    if (!currentUser) return;

    // Render Teks Profil
    document.getElementById('profil-nama-lengkap').textContent = escapeHTML(currentUser.nama);
    document.getElementById('profil-jabatan').textContent = escapeHTML(currentUser.jabatan);
    document.getElementById('profil-id-pegawai').textContent = escapeHTML(currentUser.idPegawai);

    document.getElementById('profil-ttl').textContent = escapeHTML(currentUser.tempatTanggalLahir || '-');
    document.getElementById('profil-pendidikan').textContent = escapeHTML(currentUser.pendidikan || '-');
    document.getElementById('profil-alamat').textContent = escapeHTML(currentUser.alamat || '-');
    document.getElementById('profil-nohp').textContent = escapeHTML(currentUser.noHp || '-');
    document.getElementById('profil-email').textContent = escapeHTML(currentUser.email || '-');
    document.getElementById('profil-username').textContent = escapeHTML(currentUser.username || '-');

    // Set value untuk form edit
    document.getElementById('profil-input-ttl').value = currentUser.tempatTanggalLahir || '';
    document.getElementById('profil-input-pendidikan').value = currentUser.pendidikan || '';
    document.getElementById('profil-input-nohp').value = currentUser.noHp || '';
    document.getElementById('profil-input-alamat').value = currentUser.alamat || '';

    // Render Foto Avatar
    const avatarInitial = document.getElementById('profil-avatar-initial');
    const avatarImg = document.getElementById('profil-avatar-img');

    if (currentUser.fotoProfil && currentUser.fotoProfil.trim() !== '') {
        avatarInitial.classList.add('hidden');
        avatarImg.classList.remove('hidden');
        avatarImg.src = currentUser.fotoProfil;
    } else {
        avatarInitial.classList.remove('hidden');
        avatarImg.classList.add('hidden');
        avatarInitial.textContent = currentUser.nama.charAt(0).toUpperCase();
    }

    // Render Galeri Riwayat Foto
    const galeri = document.getElementById('profil-galeri');
    galeri.innerHTML = '';
    
    if (currentUser.riwayatFoto && currentUser.riwayatFoto.trim() !== '') {
        const fotoArray = currentUser.riwayatFoto.split(',');
        fotoArray.forEach(url => {
            if(url.trim() !== '') {
                galeri.innerHTML += `
                    <div class="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative group cursor-pointer hover:shadow-md transition-shadow">
                        <img src="${url}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <a href="${url}" target="_blank" class="opacity-0 group-hover:opacity-100 text-white bg-black bg-opacity-50 p-2 rounded-full transition-opacity"><i class="fa-solid fa-expand"></i></a>
                        </div>
                    </div>
                `;
            }
        });
    } else {
        galeri.innerHTML = '<div class="col-span-full text-center p-4 text-slate-500 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">Belum ada riwayat foto yang diunggah.</div>';
    }
}

async function handleUpdateProfilSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-profil');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    const payloadData = {
        tempatTanggalLahir: document.getElementById('profil-input-ttl').value,
        pendidikan: document.getElementById('profil-input-pendidikan').value,
        noHp: document.getElementById('profil-input-nohp').value,
        alamat: document.getElementById('profil-input-alamat').value
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateProfile', payload: { id: currentUser.id, data: payloadData } })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            currentUser.tempatTanggalLahir = payloadData.tempatTanggalLahir;
            currentUser.pendidikan = payloadData.pendidikan;
            currentUser.noHp = payloadData.noHp;
            currentUser.alamat = payloadData.alamat;
            
            localStorage.setItem('portal_user_session', JSON.stringify(currentUser));
            toggleModal('modal-edit-profil');
            renderProfilCV();
            alert("Biodata berhasil diperbarui!");
        } else alert("Gagal: " + result.message);
    } catch (e) { alert("Kesalahan koneksi internet."); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}

function previewUploadFoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar (JPG/PNG).');
        return;
    }
    selectedFotoFile = file;
    const previewImg = document.getElementById('preview-foto-baru');
    document.getElementById('icon-placeholder-foto').classList.add('hidden');
    previewImg.classList.remove('hidden');
    previewImg.src = URL.createObjectURL(file);
    document.getElementById('btn-submit-foto').disabled = false;
}

async function handleUploadFotoSubmit(event) {
    event.preventDefault();
    if (!selectedFotoFile) return;

    const btnSubmit = document.getElementById('btn-submit-foto');
    const progressContainer = document.getElementById('upload-progress-container');
    const statusText = document.getElementById('upload-status-text');

    btnSubmit.disabled = true;
    progressContainer.classList.remove('hidden');

    try {
        statusText.textContent = "Mengkompresi gambar...";
        const compressed = await imageCompression(selectedFotoFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true });

        statusText.textContent = "Mengunggah ke Cloudinary...";
        const formData = new FormData();
        formData.append('file', compressed);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudRes = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const cloudData = await cloudRes.json();
        
        if (!cloudData.secure_url) throw new Error("Gagal mendapatkan URL Cloudinary.");
        const newFotoUrl = cloudData.secure_url;

        statusText.textContent = "Menyimpan riwayat ke database...";
        let riwayat = currentUser.riwayatFoto ? currentUser.riwayatFoto.split(',') : [];
        riwayat.unshift(newFotoUrl); 
        const riwayatStr = riwayat.join(',');

        const payloadData = { fotoProfil: newFotoUrl, riwayatFoto: riwayatStr };

        const dbRes = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateProfile', payload: { id: currentUser.id, data: payloadData } })
        });
        
        const dbResult = await dbRes.json();
        if (dbResult.status === 'success') {
            currentUser.fotoProfil = newFotoUrl;
            currentUser.riwayatFoto = riwayatStr;
            localStorage.setItem('portal_user_session', JSON.stringify(currentUser));
            
            toggleModal('modal-upload-foto');
            document.getElementById('form-upload-foto').reset();
            document.getElementById('preview-foto-baru').classList.add('hidden');
            document.getElementById('icon-placeholder-foto').classList.remove('hidden');
            
            renderProfilCV(); 
            
            const sidebarAvatarImg = document.getElementById('sidebar-avatar-img');
            const sidebarAvatarInitial = document.getElementById('sidebar-avatar-initial');
            sidebarAvatarInitial.classList.add('hidden');
            sidebarAvatarImg.classList.remove('hidden');
            sidebarAvatarImg.src = newFotoUrl;

            alert("Foto profil berhasil diperbarui!");
        } else throw new Error(dbResult.message);
    } catch (error) { alert("Terjadi kesalahan: " + error.message); } 
    finally {
        btnSubmit.disabled = false;
        progressContainer.classList.add('hidden');
        selectedFotoFile = null;
    }
}

function renderDashboardManager() {
    if (!currentUser) return;

    document.getElementById('broadcast-message').textContent = escapeHTML(appData.dashboard?.pengumuman || "Tidak ada pengumuman hari ini.");
    
    const timelineList = document.getElementById('dashboard-timeline-list');
    timelineList.innerHTML = '';
    const timelines = appData.dashboard?.timeline || [];
    if (timelines.length === 0) {
        timelineList.innerHTML = '<div class="p-4 text-center text-sm font-medium text-slate-500">Belum Ada Data Aktivitas</div>';
    } else {
        timelines.forEach(time => {
            timelineList.innerHTML += `
                <div class="relative">
                    <div class="absolute -left-[21px] bg-white dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 p-1">
                        <i class="fa-solid ${escapeHTML(time.ikon || 'fa-info')} ${escapeHTML(time.warna || 'text-slate-500')} text-xs w-3 h-3 flex items-center justify-center"></i>
                    </div>
                    <div class="pl-4">
                        <span class="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">${escapeHTML(time.waktu || '')}</span>
                        <p class="text-sm text-slate-700 dark:text-slate-300 leading-snug">${escapeHTML(time.teks || '')}</p>
                    </div>
                </div>
            `;
        });
    }

    const isAdminOrTU = currentUser.role === 'admin' || (currentUser.jabatan && currentUser.jabatan.toLowerCase().includes('tata usaha'));
    
    const adminWidgets = document.getElementById('admin-dashboard-widgets');
    const adminShift = document.getElementById('admin-shift-container');
    const timelineContainer = document.getElementById('timeline-container');

    if (adminWidgets && adminShift && timelineContainer) {
        if (isAdminOrTU) {
            adminWidgets.classList.remove('hidden');
            adminWidgets.classList.add('grid', 'shrink-0');
            adminShift.classList.remove('hidden');
            timelineContainer.className = "xl:col-span-1 space-y-6";
            
            // PERBAIKAN: Hitung Penghuni Asrama & Rinciannya (Putra/Putri)
            const anakSemua = appData.dataMaster?.anak || [];
            const pegawaiSemua = appData.dataMaster?.pegawai || [];

            // Filter hanya yang Berasrama
            const anakAsrama = anakSemua.filter(a => a.statusAsrama === 'Berasrama');
            const pegawaiAsrama = pegawaiSemua.filter(p => p.statusAsrama === 'Berasrama');

            // Hitung Jenis Kelamin Anak
            const putra = anakAsrama.filter(a => a.jenisKelamin === 'Laki-laki').length;
            const putri = anakAsrama.filter(a => a.jenisKelamin === 'Perempuan').length;
            
            // Masukkan data ke masing-masing ID di UI
            if (document.getElementById('stat-total-warga')) document.getElementById('stat-total-warga').textContent = anakAsrama.length + pegawaiAsrama.length;
            if (document.getElementById('stat-putra')) document.getElementById('stat-putra').textContent = putra;
            if (document.getElementById('stat-putri')) document.getElementById('stat-putri').textContent = putri;
            if (document.getElementById('stat-pegawai')) document.getElementById('stat-pegawai').textContent = pegawaiAsrama.length;
            
            document.getElementById('stat-total-warga').textContent = anakAsrama.length + pegawaiAsrama.length;
            
            const detailWarga = document.getElementById('stat-warga-detail');
            if(detailWarga) {
                detailWarga.textContent = `Anak: ${anakAsrama.length} (Pa: ${putra}, Pi: ${putri}) • Pegawai: ${pegawaiAsrama.length}`;
            }
            
            const shifts = appData.dashboard?.shiftHariIni || [];
            const onDutyCount = shifts.filter(s => s.status === 'On-Duty').length;
            document.getElementById('stat-tim-onduty').textContent = `${onDutyCount}/${shifts.length || 0}`;
            
            const pendings = appData.dashboard?.pendingApprovals || [];
            document.getElementById('stat-pending-approval').textContent = pendings.length;
            
            const now = new Date();
            document.getElementById('shift-date-label').textContent = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

            const shiftList = document.getElementById('dashboard-shift-list');
            shiftList.innerHTML = '';
            if (shifts.length === 0) {
                shiftList.innerHTML = '<li class="col-span-full p-4 text-center text-sm font-medium text-slate-500">Belum Ada Data Shift</li>';
            } else {
                shifts.forEach(shift => {
                    let bc = shift.status === 'On-Duty' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                    shiftList.innerHTML += `
                        <li class="flex items-center p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm">
                            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-3 shrink-0">${escapeHTML(shift.nama.charAt(0))}</div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-sm truncate">${escapeHTML(shift.nama)}</h4>
                                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${escapeHTML(shift.peran)} • ${escapeHTML(shift.jam)}</p>
                            </div>
                            <span class="text-[10px] font-bold px-2 py-1 rounded shrink-0 ${bc}">${escapeHTML(shift.status)}</span>
                        </li>
                    `;
                });
            }

            const approvalList = document.getElementById('dashboard-approval-list');
            approvalList.innerHTML = '';
            if (pendings.length === 0) {
                approvalList.innerHTML = '<tr><td class="p-4 text-center text-sm font-medium text-slate-500">Belum Ada Dokumen Persetujuan</td></tr>';
            } else {
                pendings.forEach(app => {
                    approvalList.innerHTML += `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td class="p-4 border-b border-slate-100 dark:border-slate-700 w-full">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="font-bold text-sm">${escapeHTML(app.pengaju)}</span>
                                    <span class="text-xs text-slate-500">${escapeHTML(app.waktu)}</span>
                                </div>
                                <p class="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                    <span class="font-semibold text-primary">[${escapeHTML(app.tipe)}]</span> ${escapeHTML(app.deskripsi)} 
                                    ${app.nilai && app.nilai !== '-' ? ` <span class="font-mono bg-slate-100 dark:bg-slate-600 px-1 rounded">${escapeHTML(app.nilai)}</span>` : ''}
                                </p>
                            </td>
                        </tr>
                    `;
                });
            }
        } else {
            adminWidgets.classList.add('hidden');
            adminWidgets.classList.remove('grid', 'shrink-0');
            adminShift.classList.add('hidden');
            timelineContainer.className = "xl:col-span-3 space-y-6";
        }
    }
}

function renderTugas() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; 

    if (!appData.tugas || appData.tugas.length === 0) {
        taskList.innerHTML = '<li class="p-4 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">Belum Ada Tugas</li>';
        return;
    }

    appData.tugas.forEach(tugas => {
        let iconColor = 'text-slate-400';
        let iconType = 'fa-circle';
        if (tugas.status === 'Selesai') { iconColor = 'text-green-500'; iconType = 'fa-check-circle'; } 
        else if (tugas.status === 'Proses') { iconColor = 'text-blue-500'; iconType = 'fa-spinner fa-spin'; }

        taskList.innerHTML += `
            <li class="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                <div class="flex items-start">
                    <i class="fa-solid ${iconType} ${iconColor} mt-1 mr-3"></i>
                    <div>
                        <h4 class="font-semibold text-sm">${escapeHTML(tugas.judul)}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tenggat: ${escapeHTML(tugas.tenggat)}</p>
                        ${tugas.deskripsi ? `<div class="mt-2 text-xs text-slate-600 dark:text-slate-400 max-h-12 overflow-hidden">${tugas.deskripsi}</div>` : ''}
                    </div>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-600">${escapeHTML(tugas.status)}</span>
            </li>
        `;
    });
}

function renderTabel(tipe) {
    let container = document.getElementById(tipe === 'cuti' ? 'table-body-cuti' : 'list-riwayat-klaim');
    if (!container) return;
    container.innerHTML = '';
    const data = appData[tipe] || [];

    if (data.length === 0) {
        if (tipe === 'cuti') container.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-sm text-slate-500">Belum Ada Cuti</td></tr>';
        else container.innerHTML = '<li class="p-4 text-center text-sm text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded">Belum Ada Klaim</li>';
        return;
    }

    data.forEach(item => {
        let statusClass = item.status === 'Disetujui' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          item.status === 'Menunggu' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

        if (tipe === 'cuti') {
            container.innerHTML += `<tr><td class="p-3 border-b border-slate-100 dark:border-slate-700">${escapeHTML(item.tanggalMulai)}</td><td class="p-3 border-b border-slate-100 dark:border-slate-700 font-medium">${escapeHTML(item.alasan)}</td><td class="p-3 border-b border-slate-100 dark:border-slate-700"><span class="px-2 py-1 text-xs font-bold rounded ${statusClass}">${escapeHTML(item.status)}</span></td></tr>`;
        } else {
            container.innerHTML += `<li class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded border border-slate-100 dark:border-slate-600"><div><p class="text-sm font-bold">${escapeHTML(item.judul)}</p><p class="text-xs text-slate-500 dark:text-slate-400">${escapeHTML(item.tanggal)} • ${formatRupiah(item.nominal)}</p></div><span class="px-2 py-1 text-xs font-bold rounded ${statusClass}">${escapeHTML(item.status)}</span></li>`;
        }
    });
}

function renderKontak() {
    const container = document.getElementById('kontak-container');
    if (!container) return;
    container.innerHTML = '';

    if (!appData.kontak || appData.kontak.length === 0) {
        container.innerHTML = '<div class="col-span-full p-8 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl">Belum Ada Kontak</div>';
        return;
    }

    appData.kontak.forEach(kontak => {
        container.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-md">${escapeHTML(kontak.nama.charAt(0))}</div>
                <h4 class="font-bold text-lg">${escapeHTML(kontak.nama)}</h4>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${escapeHTML(kontak.divisi)}</p>
                <div class="flex space-x-3 w-full">
                    <a href="https://wa.me/${escapeHTML(kontak.wa)}" target="_blank" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center"><i class="fa-brands fa-whatsapp mr-1 text-lg"></i> Chat</a>
                    <a href="mailto:${escapeHTML(kontak.email)}" class="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center"><i class="fa-solid fa-envelope mr-1"></i> Email</a>
                </div>
            </div>
        `;
    });
}


// ------------------------------------------
// MODAL LAINNYA (CUTI, KLAIM, SLIP GAJI)
// ------------------------------------------
async function handleCutiSubmit(event) {
    event.preventDefault(); 
    const mulai = document.getElementById('cuti-mulai').value;
    const selesai = document.getElementById('cuti-selesai').value;
    const alasan = document.getElementById('cuti-alasan').value;
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Mengirim...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'submitCuti', payload: { pengaju: currentUser.nama, tanggalMulai: mulai, tanggalSelesai: selesai, alasan: alasan } })
        });
        const result = await response.json();
        if (result.status === 'success') {
            if(!appData.cuti) appData.cuti = [];
            appData.cuti.unshift({ id: Date.now(), pengaju: currentUser.nama, tanggalMulai: mulai, tanggalSelesai: selesai, alasan: alasan, status: "Menunggu" });
            renderTabel('cuti');
            toggleModal('modal-cuti');
            document.getElementById('form-pengajuan-cuti').reset();
            alert('Cuti berhasil disubmit.');
        } else alert('Gagal merekam ke database.');
    } catch (error) {
        alert('Terjadi kesalahan koneksi.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleImageCompress(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Harus gambar (JPG/PNG).'); return; }

    const statusEl = document.getElementById('compress-status');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('klaim-preview');
    
    previewContainer.classList.remove('hidden');
    statusEl.textContent = 'Mengkompresi nota...';
    statusEl.className = 'text-xs text-yellow-600 font-semibold mb-1 animate-pulse';

    try {
        compressedImageBlob = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true });
        previewImage.src = URL.createObjectURL(compressedImageBlob);
        statusEl.textContent = `Kompresi Berhasil (${(compressedImageBlob.size / 1024).toFixed(2)} KB)`;
        statusEl.className = 'text-xs text-green-600 font-semibold mb-1';
    } catch (error) {
        statusEl.textContent = 'Gagal mengkompresi.';
        statusEl.className = 'text-xs text-red-600 font-semibold mb-1';
    }
}

async function handleKlaimSubmit(event) {
    event.preventDefault();
    if (!compressedImageBlob) { alert("Harap unggah gambar."); return; }

    const judul = document.getElementById('klaim-judul').value;
    const nominal = document.getElementById('klaim-nominal').value;
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Mengirim...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'submitKlaim', payload: { pengaju: currentUser.nama, judul: judul, nominal: parseFloat(nominal), tanggal: tanggalHariIni } })
        });
        const result = await response.json();
        if (result.status === 'success') {
            if(!appData.klaim) appData.klaim = [];
            appData.klaim.unshift({ id: Date.now(), pengaju: currentUser.nama, judul: judul, nominal: parseFloat(nominal), tanggal: tanggalHariIni, status: "Menunggu" });
            renderTabel('klaim');
            document.getElementById('form-klaim').reset();
            document.getElementById('preview-container').classList.add('hidden');
            compressedImageBlob = null;
            alert('Klaim operasional berhasil diajukan.');
        } else alert('Gagal merekam ke database.');
    } catch (error) {
        alert('Terjadi kesalahan koneksi.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

let isSalaryVisible = false;
function toggleSalaryVisibility() {
    isSalaryVisible = !isSalaryVisible;
    document.querySelectorAll('.salary-amount').forEach(el => {
        el.textContent = isSalaryVisible ? formatRupiah(parseFloat(el.getAttribute('data-value'))) : 'Rp ***.***';
    });
    document.getElementById('eye-icon').className = isSalaryVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    document.getElementById('eye-icon').nextSibling.textContent = isSalaryVisible ? ' Sembunyikan Angka' : ' Tampilkan Angka';
}

function downloadPDF() {
    if (!isSalaryVisible) toggleSalaryVisibility();
    html2pdf().set({ margin: 10, filename: `Slip_Gaji_${currentUser.nama}.pdf`, html2canvas: { scale: 2 } }).from(document.getElementById('slip-gaji-document')).save();
}