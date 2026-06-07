// ==========================================
// FILE 12: KEUANGAN.JS (MANAJEMEN KAS & BULK INPUT)
// ==========================================

let trendChartInstance = null;
let alokasiChartInstance = null;
let bulkTransactions = [];

// Konstanta Kategori Sesuai Permintaan
const KATEGORI_MASUK = ['Infak Bulanan', 'Kotak Infak', 'Jual Sembako', 'SPP', 'Infak Langsung', 'Pengembalian Piutang', 'Lainnya'];
const KATEGORI_KELUAR = ['Gaji dan Tunjangan', 'Kebutuhan Anak Yatim', 'Kebutuhan Rumah', 'Kesehatan dan Pengobatan', 'Transport dan Keamanan', 'Administrasi & ATK', 'Lainnya'];

function switchKeuanganTab(tabId) {
    document.querySelectorAll('.keu-tab').forEach(btn => {
        btn.classList.remove('border-green-600', 'text-green-600');
        btn.classList.add('border-transparent', 'text-slate-500');
    });
    
    const activeBtn = document.querySelector(`[onclick="switchKeuanganTab('${tabId}')"]`);
    if(activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-slate-500');
        activeBtn.classList.add('border-green-600', 'text-green-600');
    }

    document.querySelectorAll('.keu-pane').forEach(p => p.classList.add('hidden'));
    
    const targetPane = document.getElementById(tabId);
    if(targetPane) targetPane.classList.remove('hidden');

    if(tabId === 'keu-tab-dasbor') updateKeuanganStatsAndCharts();
    if(tabId === 'keu-tab-kas') renderKeuanganTable();
    if(tabId === 'keu-tab-hutang') renderHutangPiutang();
}

function renderKeuanganPage() {
    const inputBulan = document.getElementById('filter-bulan-keuangan');
    if (inputBulan && !inputBulan.value) {
        const now = new Date();
        inputBulan.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    updateKeuanganStatsAndCharts();
}

function updateKeuanganStatsAndCharts() {
    const dataKeu = appData.keuangan || [];
    const now = new Date();
    const currMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalSaldo = 0; let masukBulanIni = 0; let keluarBulanIni = 0; let totalHutang = 0;

    dataKeu.forEach(item => {
        const nominal = parseFloat(item.nominal) || 0;
        if (item.tipe === 'Masuk') {
            totalSaldo += nominal;
            if (item.tanggal && item.tanggal.startsWith(currMonthStr)) masukBulanIni += nominal;
        } else if (item.tipe === 'Keluar') {
            totalSaldo -= nominal;
            if (item.tanggal && item.tanggal.startsWith(currMonthStr)) keluarBulanIni += nominal;
        } else if (item.tipe === 'Hutang' && item.status !== 'Lunas') {
            totalHutang += nominal;
        }
    });

    if(document.getElementById('stat-keu-saldo')) document.getElementById('stat-keu-saldo').textContent = formatRupiah(totalSaldo);
    if(document.getElementById('stat-keu-masuk')) document.getElementById('stat-keu-masuk').textContent = formatRupiah(masukBulanIni);
    if(document.getElementById('stat-keu-keluar')) document.getElementById('stat-keu-keluar').textContent = formatRupiah(keluarBulanIni);
    if(document.getElementById('stat-keu-hutang')) document.getElementById('stat-keu-hutang').textContent = formatRupiah(totalHutang);

    initTrendChart();
    initAlokasiChart();
}

// ----------------------------------------------------
// LOGIKA CHART (DINAMIS 6 BULAN / 1 TAHUN)
// ----------------------------------------------------
function initTrendChart() {
    const ctx = document.getElementById('chartTrendKeuangan');
    if (!ctx) return;
    if (trendChartInstance) trendChartInstance.destroy();

    const rangeBulan = parseInt(document.getElementById('filter-trend-waktu').value || 6);
    const dataKeu = appData.keuangan || [];
    
    const labels = [];
    const dataMasuk = [];
    const dataKeluar = [];
    
    const now = new Date();
    
    // Tarik data N bulan ke belakang
    for (let i = rangeBulan - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        
        labels.push(monthLabel);
        
        let sumMasuk = 0; let sumKeluar = 0;
        dataKeu.forEach(item => {
            if (item.tanggal && item.tanggal.startsWith(monthStr)) {
                if (item.tipe === 'Masuk') sumMasuk += parseFloat(item.nominal) || 0;
                if (item.tipe === 'Keluar') sumKeluar += parseFloat(item.nominal) || 0;
            }
        });
        dataMasuk.push(sumMasuk);
        dataKeluar.push(sumKeluar);
    }

    const isDark = document.documentElement.classList.contains('dark');
    
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Uang Masuk', data: dataMasuk, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
                { label: 'Uang Keluar', data: dataKeluar, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: isDark ? '#94a3b8' : '#64748b' } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: {size: 10} } },
                y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { display: false } }
            }
        }
    });
}

function initAlokasiChart() {
    const ctx = document.getElementById('chartAlokasiKeuangan');
    if (!ctx) return;
    if (alokasiChartInstance) alokasiChartInstance.destroy();

    const dataKeu = appData.keuangan || [];
    const now = new Date();
    const currMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const alokasi = {};
    dataKeu.forEach(item => {
        if (item.tipe === 'Keluar' && item.tanggal && item.tanggal.startsWith(currMonthStr)) {
            const kat = item.kategori || 'Lainnya';
            alokasi[kat] = (alokasi[kat] || 0) + (parseFloat(item.nominal) || 0);
        }
    });

    const labels = Object.keys(alokasi);
    const dataVals = Object.values(alokasi);
    
    if (labels.length === 0) {
        labels.push('Belum ada pengeluaran');
        dataVals.push(1);
    }

    const bgColors = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#64748b'];

    alokasiChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: dataVals, backgroundColor: bgColors, borderWidth: 0 }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
            cutout: '65%'
        }
    });
}

// ----------------------------------------------------
// TABEL RENDER
// ----------------------------------------------------
function renderKeuanganTable() {
    const tbody = document.getElementById('table-body-kas');
    const filterBulan = document.getElementById('filter-bulan-keuangan').value;
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = (appData.keuangan || []).filter(item => {
        return (item.tipe === 'Masuk' || item.tipe === 'Keluar') && item.tanggal.startsWith(filterBulan);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">Tidak ada mutasi kas pada periode ini.</td></tr>';
        return;
    }

    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    filtered.forEach(item => {
        const nominal = parseFloat(item.nominal) || 0;
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 text-xs font-mono">${escapeHTML(item.tanggal)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700"><span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase">${escapeHTML(item.kategori)}</span></td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 font-medium max-w-[200px] truncate" title="${escapeHTML(item.keterangan)}">${escapeHTML(item.keterangan)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 text-right text-green-600 font-bold">${item.tipe === 'Masuk' ? formatRupiah(nominal) : '-'}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 text-right text-red-500 font-bold">${item.tipe === 'Keluar' ? formatRupiah(nominal) : '-'}</td>
            </tr>
        `;
    });
}

function renderHutangPiutang() {
    const bodyHutang = document.getElementById('table-body-hutang');
    const bodyPiutang = document.getElementById('table-body-piutang');
    if(!bodyHutang || !bodyPiutang) return;

    bodyHutang.innerHTML = ''; bodyPiutang.innerHTML = '';
    const dataKeu = appData.keuangan || [];
    
    dataKeu.forEach(item => {
        const nominal = parseFloat(item.nominal) || 0;
        const row = `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="p-3 border-b border-slate-100 dark:border-slate-700 font-bold max-w-[150px] truncate" title="${escapeHTML(item.keterangan)}">${escapeHTML(item.keterangan.split('-')[0])}</td>
                <td class="p-3 border-b border-slate-100 dark:border-slate-700">${formatRupiah(nominal)}</td>
                <td class="p-3 border-b border-slate-100 dark:border-slate-700">${escapeHTML(item.tanggal)}</td>
                <td class="p-3 border-b border-slate-100 dark:border-slate-700"><span class="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[9px] font-black uppercase">${escapeHTML(item.status || 'Belum Lunas')}</span></td>
            </tr>
        `;
        if(item.tipe === 'Hutang') bodyHutang.innerHTML += row;
        if(item.tipe === 'Piutang') bodyPiutang.innerHTML += row;
    });

    if(!bodyHutang.innerHTML) bodyHutang.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Bersih dari hutang.</td></tr>';
    if(!bodyPiutang.innerHTML) bodyPiutang.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Tidak ada piutang luar.</td></tr>';
}

// ----------------------------------------------------
// LOGIKA BULK INPUT TRANSAKSI
// ----------------------------------------------------
function openModalTransaksi() {
    bulkTransactions = [];
    document.getElementById('form-transaksi').reset();
    document.getElementById('trans-tanggal').value = new Date().toISOString().split('T')[0];
    updateKategoriDropdown();
    renderBulkTable();
    toggleModal('modal-transaksi');
}

function updateKategoriDropdown() {
    const tipe = document.getElementById('trans-tipe').value;
    const selectKategori = document.getElementById('trans-kategori');
    selectKategori.innerHTML = '';
    
    let options = [];
    if (tipe === 'Masuk' || tipe === 'Piutang') options = KATEGORI_MASUK;
    else if (tipe === 'Keluar' || tipe === 'Hutang') options = KATEGORI_KELUAR;

    options.forEach(opt => {
        selectKategori.innerHTML += `<option value="${opt}">${opt}</option>`;
    });
}

function addTransactionToBulk(event) {
    event.preventDefault();
    
    const trx = {
        tipe: document.getElementById('trans-tipe').value,
        kategori: document.getElementById('trans-kategori').value,
        tanggal: document.getElementById('trans-tanggal').value,
        nominal: parseFloat(document.getElementById('trans-nominal').value),
        keterangan: document.getElementById('trans-keterangan').value,
        status: document.getElementById('trans-tipe').value === 'Masuk' || document.getElementById('trans-tipe').value === 'Keluar' ? 'Lunas' : 'Belum Lunas'
    };

    bulkTransactions.push(trx);
    
    // Reset Sebagian Form (Tipe, Tanggal biarkan tetap agar cepat)
    document.getElementById('trans-nominal').value = '';
    document.getElementById('trans-keterangan').value = '';
    document.getElementById('trans-nominal').focus();

    renderBulkTable();
}

function removeBulkItem(index) {
    bulkTransactions.splice(index, 1);
    renderBulkTable();
}

function renderBulkTable() {
    const tbody = document.getElementById('table-bulk-body');
    const btnSubmit = document.getElementById('btn-submit-bulk');
    
    document.getElementById('bulk-count').textContent = `${bulkTransactions.length} Item`;
    document.getElementById('btn-bulk-count').textContent = bulkTransactions.length;

    if (bulkTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Keranjang kosong. Tambahkan transaksi dari form di sebelah kiri.</td></tr>';
        document.getElementById('bulk-total-rp').textContent = 'Rp 0';
        btnSubmit.disabled = true;
        return;
    }

    btnSubmit.disabled = false;
    tbody.innerHTML = '';
    let totalRp = 0;

    bulkTransactions.forEach((item, index) => {
        totalRp += item.nominal;
        let colorClass = item.tipe === 'Masuk' ? 'text-green-600' : (item.tipe === 'Keluar' ? 'text-red-500' : 'text-orange-500');
        
        tbody.innerHTML += `
            <tr class="hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border-b border-slate-100 dark:border-slate-700">
                <td class="p-2 font-bold ${colorClass}">${item.tipe}</td>
                <td class="p-2"><span class="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px] uppercase">${escapeHTML(item.kategori)}</span></td>
                <td class="p-2 font-mono font-bold">${formatRupiah(item.nominal)}</td>
                <td class="p-2 truncate max-w-[150px] text-slate-500" title="${escapeHTML(item.keterangan)}">${escapeHTML(item.keterangan)}</td>
                <td class="p-2 text-center">
                    <button type="button" onclick="removeBulkItem(${index})" class="text-red-500 hover:text-red-700 px-2"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    document.getElementById('bulk-total-rp').textContent = formatRupiah(totalRp);
}

// Eksekusi Massal (Multiple Request)
// Eksekusi Massal (Antrean berurutan agar Google tidak memblokir)
async function submitBulkKeuangan() {
    if (bulkTransactions.length === 0) return;

    const btn = document.getElementById('btn-submit-bulk');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    try {
        // Kita kirim satu per satu menggunakan For...Of agar aman dari blokir Google
        for (const trx of bulkTransactions) {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Keuangan', data: trx } })
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
        }
        
        toggleModal('modal-transaksi');
        bulkTransactions = [];
        await loadAppData(); 
        switchKeuanganTab('keu-tab-kas');
        alert("Semua transaksi berhasil disimpan ke sistem!");

    } catch (e) { 
        alert("Gagal menyimpan sebagian/seluruh data: " + e.message); 
    } finally { 
        btn.innerHTML = originalText; 
        btn.disabled = false; 
    }
}

// ----------------------------------------------------
// UNDUH & BAGIKAN (BARU)
// ----------------------------------------------------
function downloadLaporanKeuangan() {
    const areaCetak = document.getElementById('area-cetak-keuangan');
    if(!areaCetak) return;
    
    // Gunakan html2pdf untuk menangkap div "area-cetak-keuangan"
    html2pdf()
        .set({ 
            margin: 10, 
            filename: `Laporan_Keuangan_Yayasan.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        })
        .from(areaCetak)
        .save();
}

function bagikanLaporanKeuangan() {
    const now = new Date();
    const bulanIni = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const saldo = document.getElementById('stat-keu-saldo').textContent;
    const masuk = document.getElementById('stat-keu-masuk').textContent;
    const keluar = document.getElementById('stat-keu-keluar').textContent;
    const hutang = document.getElementById('stat-keu-hutang').textContent;

    const pesan = `*LAPORAN KEUANGAN YAYASAN*\n_Periode: ${bulanIni}_\n\n` +
                  `🟢 *Pemasukan Bulan Ini:* ${masuk}\n` +
                  `🔴 *Pengeluaran Bulan Ini:* ${keluar}\n` +
                  `🟠 *Total Hutang Berjalan:* ${hutang}\n\n` +
                  `💰 *TOTAL SALDO KAS TERSEDIA: ${saldo}*\n\n` +
                  `_Pesan ini di-generate otomatis oleh Sistem Dashboard Keuangan._`;

    const urlWA = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(urlWA, '_blank');
}