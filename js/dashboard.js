// Chart.js defaults
Chart.defaults.color = '#8b8fa8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = 'DM Sans';

// ── Cashflow Chart ──────────────────────────────────────────
const cashflowCtx = document.getElementById('cashflowChart');
if (cashflowCtx) {
  new Chart(cashflowCtx, {
    type: 'bar',
    data: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      datasets: [
        {
          label: 'Pemasukan',
          data: [980000, 1150000, 870000, 1320000, 1080000, 1540000, 1240000],
          backgroundColor: 'rgba(62,207,142,0.25)',
          borderColor: '#3ecf8e',
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: 'Pengeluaran',
          data: [420000, 580000, 390000, 670000, 450000, 720000, 480000],
          backgroundColor: 'rgba(241,108,80,0.2)',
          borderColor: '#f16c50',
          borderWidth: 2,
          borderRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => 'Rp ' + (v/1000000).toFixed(1) + 'jt'
          }
        }
      }
    }
  });
}

// ── Menu Chart ──────────────────────────────────────────────
const menuCtx = document.getElementById('menuChart');
if (menuCtx) {
  new Chart(menuCtx, {
    type: 'doughnut',
    data: {
      labels: ['Kopi Susu', 'Es Kopi', 'Matcha Latte', 'Americano', 'Lainnya'],
      datasets: [{
        data: [38, 24, 17, 12, 9],
        backgroundColor: [
          '#e8c547',
          '#3ecf8e',
          '#7b8cde',
          '#f16c50',
          '#555975'
        ],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, font: { size: 12 }, boxWidth: 10 }
        }
      },
      cutout: '68%'
    }
  });
}
