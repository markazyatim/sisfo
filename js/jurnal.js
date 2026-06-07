// ==========================================
// FILE 11: JURNAL.JS (LOGIKA PENGASUHAN & GRAFIK)
// ==========================================

let jurnalRadarChartInstance = null;

function renderJurnalPage() {
    // 1. Isi Dropdown Santri di Modal
    const selectSantri = document.getElementById('jurnal-santri');
    if (selectSantri) {
        selectSantri.innerHTML = '<option value="" disabled selected>Pilih Nama Santri...</option>';
        const dataAnak = appData.dataMaster.anak || [];
        dataAnak.forEach(anak => {
            selectSantri.innerHTML += `<option value="${escapeHTML(anak.namaAnak)}">${escapeHTML(anak.namaAnak)}</option>`;
        });
    }

    // 2. Render Tabel & Statistik
    renderJurnalTable();
    updateJurnalStatsAndChart();
}

function renderJurnalTable() {
    const tbody = document.getElementById('table-body-jurnal');
    const kategoriFilter = document.getElementById('filter-kategori-jurnal').value;
    const searchFilter = document.getElementById('search-jurnal').value.toLowerCase();
    
    if (!tbody) return;
    tbody.innerHTML = '';

    const dataJurnal = appData.jurnal || [];
    
    // Filter Data
    const filtered = dataJurnal.filter(item => {
        const matchesKategori = kategoriFilter === 'Semua' || item.kategori === kategoriFilter;
        const matchesSearch = item.namaSantri.toLowerCase().includes(searchFilter);
        return matchesKategori && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">Belum ada catatan jurnal.</td></tr>';
        return;
    }

    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    filtered.forEach(item => {
        let labelColor = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
        if (item.kategori === 'Tahfidz') labelColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        else if (item.kategori === 'Akhlak') labelColor = 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
        else if (item.kategori === 'Kedisiplinan') labelColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        else if (item.kategori === 'Prestasi') labelColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 font-mono text-xs">${escapeHTML(item.tanggal)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 font-bold">${escapeHTML(item.namaSantri)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700">
                    <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${labelColor}">${escapeHTML(item.kategori)}</span>
                </td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 max-w-xs truncate" title="${escapeHTML(item.detail)}">${escapeHTML(item.detail)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 italic text-slate-500">${escapeHTML(item.pencatat)}</td>
            </tr>
        `;
    });
}

function updateJurnalStatsAndChart() {
    const dataJurnal = appData.jurnal || [];
    const counts = { Tahfidz: 0, Akhlak: 0, Kedisiplinan: 0, Prestasi: 0 };

    dataJurnal.forEach(item => {
        if (counts.hasOwnProperty(item.kategori)) counts[item.kategori]++;
    });

    // Update Angka Statistik
    if(document.getElementById('stat-jurnal-tahfidz')) document.getElementById('stat-jurnal-tahfidz').textContent = counts.Tahfidz;
    if(document.getElementById('stat-jurnal-akhlak')) document.getElementById('stat-jurnal-akhlak').textContent = counts.Akhlak;
    if(document.getElementById('stat-jurnal-disiplin')) document.getElementById('stat-jurnal-disiplin').textContent = counts.Kedisiplinan;
    if(document.getElementById('stat-jurnal-prestasi')) document.getElementById('stat-jurnal-prestasi').textContent = counts.Prestasi;

    // Inisialisasi Chart Radar
    const ctx = document.getElementById('jurnalRadarChart');
    if (!ctx) return;

    if (jurnalRadarChartInstance) jurnalRadarChartInstance.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    jurnalRadarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Tahfidz', 'Akhlak', 'Kedisiplinan', 'Prestasi'],
            datasets: [{
                label: 'Jumlah Aktivitas',
                data: [counts.Tahfidz, counts.Akhlak, counts.Kedisiplinan, counts.Prestasi],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: '#4f46e5',
                borderWidth: 2,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: textColor, font: { size: 11, weight: 'bold' } },
                    ticks: { display: false, stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

async function handleJurnalSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-jurnal');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    const payload = {
        namaSantri: document.getElementById('jurnal-santri').value,
        kategori: document.getElementById('jurnal-kategori').value,
        urgensi: document.getElementById('jurnal-urgensi').value,
        detail: document.getElementById('jurnal-detail').value,
        pencatat: currentUser.nama,
        tanggal: new Date().toISOString().split('T')[0]
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Jurnal', data: payload } })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            toggleModal('modal-jurnal');
            document.getElementById('form-jurnal').reset();
            await loadAppData(); // Tarik data baru & refresh UI
            alert("Catatan jurnal berhasil disimpan!");
        } else alert("Gagal: " + result.message);
    } catch (e) { alert("Kesalahan koneksi internet."); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}