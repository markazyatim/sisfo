// ==========================================
// FILE 13: SARPRAS.JS (MANAJEMEN INVENTARIS)
// ==========================================

let sarprasChartInstance = null;

function switchSarprasTab(tabId) {
    document.querySelectorAll('.sp-tab').forEach(btn => {
        btn.classList.remove('border-orange-600', 'text-orange-600');
        btn.classList.add('border-transparent', 'text-slate-500');
    });
    const activeBtn = document.querySelector(`[onclick="switchSarprasTab('${tabId}')"]`);
    if(activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-slate-500');
        activeBtn.classList.add('border-orange-600', 'text-orange-600');
    }

    document.querySelectorAll('.sp-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    if(tabId === 'sp-tab-dasbor') updateSarprasStatsAndChart();
    if(tabId === 'sp-tab-list') renderSarprasTable();
    if(tabId === 'sp-tab-pinjam') renderPeminjamanTable();
    if(tabId === 'sp-tab-servis') renderServisCards();
}

function renderSarprasPage() {
    updateSarprasStatsAndChart();
}

function updateSarprasStatsAndChart() {
    const dataAset = appData.sarpras || [];
    const counts = { Baik: 0, "Rusak Ringan": 0, "Rusak Berat": 0, Hilang: 0 };
    let totalPinjam = 0;

    dataAset.forEach(item => {
        if(counts.hasOwnProperty(item.kondisi)) counts[item.kondisi]++;
        if(item.status === 'Dipinjam') totalPinjam++;
    });

    if(document.getElementById('stat-sp-total')) document.getElementById('stat-sp-total').textContent = dataAset.length;
    if(document.getElementById('stat-sp-rusak')) document.getElementById('stat-sp-rusak').textContent = counts["Rusak Ringan"] + counts["Rusak Berat"];
    if(document.getElementById('stat-sp-pinjam')) document.getElementById('stat-sp-pinjam').textContent = totalPinjam;

    const ctx = document.getElementById('chartKondisiSarpras');
    if (!ctx) return;
    if (sarprasChartInstance) sarprasChartInstance.destroy();

    sarprasChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang'],
            datasets: [{
                data: [counts.Baik, counts["Rusak Ringan"], counts["Rusak Berat"], counts.Hilang],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
    });
}

function renderSarprasTable() {
    const tbody = document.getElementById('table-body-sarpras');
    const search = document.getElementById('search-sarpras').value.toLowerCase();
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = (appData.sarpras || []).filter(item => 
        item.namaBarang.toLowerCase().includes(search) || item.sku.toLowerCase().includes(search)
    );

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">Tidak ada barang inventaris.</td></tr>';
        return;
    }

    filtered.forEach(item => {
        let condColor = item.kondisi === 'Baik' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 font-mono text-xs font-bold text-primary">${escapeHTML(item.sku)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 font-bold">${escapeHTML(item.namaBarang)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500">${escapeHTML(item.kategori)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700 text-sm">${escapeHTML(item.lokasi)}</td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700"><span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${condColor}">${escapeHTML(item.kondisi)}</span></td>
            </tr>
        `;
    });
}

function renderPeminjamanTable() {
    const tbody = document.getElementById('table-body-peminjaman');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    // Logika peminjaman (Simulasi data atau tarik dari appData.peminjaman)
    const data = appData.peminjaman || [];
    if(data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-400">Belum ada riwayat peminjaman barang.</td></tr>';
        return;
    }
}

function openModalSarpras() {
    document.getElementById('form-sarpras').reset();
    toggleModal('modal-sarpras');
}

async function handleSarprasSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-sarpras');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    const payload = {
        sku: document.getElementById('sp-sku').value,
        namaBarang: document.getElementById('sp-nama').value,
        kategori: document.getElementById('sp-kategori').value,
        lokasi: document.getElementById('sp-lokasi').value,
        kondisi: document.getElementById('sp-kondisi').value,
        status: 'Tersedia'
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'crudCreate', payload: { sheetName: 'Sarpras', data: payload } })
        });
        const result = await response.json();
        if (result.status === 'success') {
            toggleModal('modal-sarpras');
            await loadAppData(); 
            switchSarprasTab('sp-tab-list');
            alert("Aset berhasil diregistrasi!");
        }
    } catch (e) { alert("Error koneksi."); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}