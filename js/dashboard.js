// ── Chart.js defaults — PantauCuan palette ──────────────────
Chart.defaults.color = '#8A8A82';
Chart.defaults.borderColor = 'rgba(0,0,0,0.05)';
Chart.defaults.font.family = 'Inter';

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadKPI();
  await loadCashflowChart();
  await loadMenuChart();
  await loadRecentTransaksi();
  await loadStokAlert();
});

// ── KPI Cards ───────────────────────────────────────────────
async function loadKPI() {
  const cafeId = await getCafeId();
  const today = new Date().toISOString().split('T')[0];

  const { data: cfToday } = await db
    .from('cashflow')
    .select('jenis, nominal')
    .eq('cafe_id', cafeId)
    .eq('tanggal', today);

  const pemasukan   = cfToday?.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0) || 0;
  const pengeluaran = cfToday?.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0) || 0;
  const laba        = pemasukan - pengeluaran;

  document.getElementById('kpi-omzet').textContent       = formatRp(pemasukan);
  document.getElementById('kpi-pengeluaran').textContent = formatRp(pengeluaran);
  document.getElementById('kpi-laba').textContent        = formatRp(laba);

  // Warna laba: merah kalau rugi
  const labaEl = document.getElementById('kpi-laba');
  if (laba < 0) labaEl.style.color = 'rgba(255,255,255,0.7)';

  const { data: stokData } = await db.from('stok').select('stok_saat_ini, stok_minimum').eq('cafe_id', cafeId);
  const alertCount = stokData?.filter(s => parseFloat(s.stok_saat_ini) <= parseFloat(s.stok_minimum)).length || 0;
  const stokEl = document.getElementById('kpi-stok-alert');
  stokEl.textContent = alertCount > 0 ? `⚠ ${alertCount} item hampir habis` : '✅ Semua stok aman';
  stokEl.style.color = alertCount > 0 ? 'var(--orange)' : 'var(--green)';
}

// ── Cashflow Chart — PantauCuan colors ──────────────────────
async function loadCashflowChart() {
  const cafeId = await getCafeId();
  const dayLabels = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const days = [];
  const pemasukanArr = [];
  const pengeluaranArr = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Batch semua 7 hari sekaligus — 1 query saja
  const startDay = days[0];
  const endDay   = days[days.length - 1];
  const { data: allCf } = await db.from('cashflow')
    .select('jenis, nominal, tanggal')
    .eq('cafe_id', cafeId)
    .gte('tanggal', startDay)
    .lte('tanggal', endDay);

  for (const day of days) {
    const dayData = allCf?.filter(r => r.tanggal === day) || [];
    pemasukanArr.push(dayData.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0));
    pengeluaranArr.push(dayData.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0));
  }

  const ctx = document.getElementById('cashflowChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days.map(d => dayLabels[new Date(d).getDay()]),
      datasets: [
        { label: 'Pemasukan',   data: pemasukanArr,   backgroundColor: 'rgba(74,124,89,0.2)',  borderColor: '#4A7C59', borderWidth: 2, borderRadius: 6 },
        { label: 'Pengeluaran', data: pengeluaranArr, backgroundColor: 'rgba(192,57,43,0.15)', borderColor: '#c0392b', borderWidth: 2, borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => 'Rp ' + (v/1000000).toFixed(1) + 'jt' } }
      }
    }
  });
}

// ── Menu Chart — PantauCuan colors ──────────────────────────
async function loadMenuChart() {
  const cafeId = await getCafeId();
  const { data: transaksiData } = await db.from('transaksi').select('items').eq('cafe_id', cafeId);

  const counts = {};
  transaksiData?.forEach(t => {
    t.items?.forEach(item => { counts[item.nama] = (counts[item.nama] || 0) + item.qty; });
  });

  const sorted     = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const finalLabels = sorted.length ? sorted.map(([n]) => n) : ['Kopi Susu','Es Kopi','Matcha Latte','Americano','Lainnya'];
  const finalData   = sorted.length ? sorted.map(([,q]) => q) : [38,24,17,12,9];

  const ctx = document.getElementById('menuChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: finalLabels,
      datasets: [{ data: finalData, backgroundColor: ['#4A7C59','#F5A623','#6fa884','#d4891a','#a8c5b0'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 12, family: 'Inter' }, boxWidth: 10 } } },
      cutout: '68%'
    }
  });
}

// ── Recent Transaksi ────────────────────────────────────────
async function loadRecentTransaksi() {
  const cafeId = await getCafeId();
  const { data } = await db.from('transaksi').select('*').eq('cafe_id', cafeId).order('created_at', { ascending: false }).limit(5);

  const tbody = document.getElementById('tbody-transaksi');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-3);text-align:center;padding:24px">Belum ada transaksi hari ini</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(t => {
    const time     = new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const itemDesc = t.items?.map(i => `${i.nama} x${i.qty}`).join(', ') || '-';
    return `<tr>
      <td>${time}</td>
      <td style="color:var(--text-1)">${itemDesc}</td>
      <td style="color:var(--accent);font-weight:600">${formatRp(t.total)}</td>
      <td><span class="badge success">Lunas</span></td>
    </tr>`;
  }).join('');
}

// ── Stok Alert ──────────────────────────────────────────────
async function loadStokAlert() {
  const cafeId = await getCafeId();
  const { data } = await db.from('stok').select('*').eq('cafe_id', cafeId).order('stok_saat_ini', { ascending: true });

  const alertList = document.getElementById('stok-alert-list');
  if (!alertList || !data) return;

  const lowStock = data.filter(s => parseFloat(s.stok_saat_ini) <= parseFloat(s.stok_minimum));

  alertList.innerHTML = lowStock.length === 0
    ? '<li style="color:var(--green);font-size:13px;padding:10px 0;font-weight:500">✅ Semua stok aman</li>'
    : lowStock.map(s => {
        const isDanger = parseFloat(s.stok_saat_ini) <= parseFloat(s.stok_minimum) / 2;
        return `<li class="alert-item">
          <div class="alert-name">${s.nama_bahan}</div>
          <div class="alert-qty ${isDanger ? 'danger' : 'warning'}">Sisa ${s.stok_saat_ini} ${s.satuan}</div>
        </li>`;
      }).join('');

  // Monthly summary — 1 query saja
  const now      = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const { data: cf } = await db.from('cashflow').select('jenis, nominal').eq('cafe_id', cafeId).gte('tanggal', firstDay).lte('tanggal', lastDay);

  const totalMasuk  = cf?.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0) || 0;
  const totalKeluar = cf?.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0) || 0;

  const el = id => document.getElementById(id);
  if (el('summary-masuk'))  el('summary-masuk').textContent  = formatRp(totalMasuk);
  if (el('summary-keluar')) el('summary-keluar').textContent = formatRp(totalKeluar);
  if (el('summary-laba'))   el('summary-laba').textContent   = formatRp(totalMasuk - totalKeluar);
}

// ── Helper ──────────────────────────────────────────────────
function formatRp(num) {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
}
