// Simple state + storage helpers
const LS = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); }
};

const state = {
  donations: LS.get('fb_donations', []),
  pickups: LS.get('fb_pickups', []),
};

function uid() { return Math.random().toString(36).slice(2, 9); }

// Tabs
const tabs = [...document.querySelectorAll('.tab')];
const links = [...document.querySelectorAll('.tablink')];
function showTab(id) {
  tabs.forEach(t => t.hidden = t.id !== id);
  links.forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.getElementById('app').focus();
  if (id === 'dashboard') renderDashboard();
  if (id === 'inventory') renderInventory();
}
links.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
showTab('intake');

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Donations (Intake) ----
const donationForm = document.getElementById('donationForm');
const donationsTable = document.getElementById('donationsTable').querySelector('tbody');
const intakeStatus = document.getElementById('intakeStatus');
const clearDonationsBtn = document.getElementById('clearDonations');

donationForm.addEventListener('submit', e => {
  e.preventDefault();
  const donor = document.getElementById('donor').value.trim();
  const item = document.getElementById('item').value.trim();
  const category = document.getElementById('category').value;
  const qty = +document.getElementById('qty').value;
  const unit = document.getElementById('unit').value;
  const weightLbInput = document.getElementById('weightLb').value;
  const weightLb = weightLbInput ? +weightLbInput : (unit === 'lb' ? qty : 0);

  if (!donor || !item || !category || !qty || qty < 0) return;

  const rec = { id: uid(), dateISO: new Date().toISOString(), donor, item, category, qty, unit, weightLb };
  state.donations.unshift(rec);
  LS.set('fb_donations', state.donations);
  renderDonations();
  intakeStatus.textContent = 'Added donation.';
  donationForm.reset();
  setTimeout(() => intakeStatus.textContent = '', 1500);
});

clearDonationsBtn.addEventListener('click', () => {
  if (confirm('Clear ALL donations? This cannot be undone.')) {
    state.donations = [];
    LS.set('fb_donations', state.donations);
    renderDonations();
  }
});

function renderDonations() {
  donationsTable.innerHTML = '';
  for (const d of state.donations) {
    const tr = document.createElement('tr');
    const date = new Date(d.dateISO).toLocaleString();
    tr.innerHTML = \`
      <td>\${date}</td>
      <td>\${d.donor}</td>
      <td>\${d.item}</td>
      <td>\${d.category}</td>
      <td>\${d.qty}</td>
      <td>\${d.unit}</td>
      <td>\${(d.weightLb||0).toFixed(2)}</td>
      <td><button class="btn btn-danger btn-xs" data-id="\${d.id}">Delete</button></td>\`;
    donationsTable.appendChild(tr);
  }
  donationsTable.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.donations = state.donations.filter(x => x.id !== btn.dataset.id);
      LS.set('fb_donations', state.donations);
      renderDonations();
    });
  });
  // inventory auto-derivation when donations change
  deriveInventory();
}
renderDonations();

// ---- Inventory ----
const inventoryTable = document.getElementById('inventoryTable').querySelector('tbody');

function deriveInventory() {
  // Aggregate by item+category, keep last unit (best effort) and sum qty/weight
  const map = new Map();
  for (const d of state.donations) {
    const key = d.category + '|' + d.item;
    const prev = map.get(key) || { item: d.item, category: d.category, qty: 0, unit: d.unit, weightLb: 0 };
    prev.qty += d.qty;
    prev.weightLb += (d.weightLb || 0);
    prev.unit = d.unit || prev.unit;
    map.set(key, prev);
  }
  const arr = [...map.values()];
  LS.set('fb_inventory', arr);
  return arr;
}

function renderInventory() {
  const inv = LS.get('fb_inventory', deriveInventory());
  inventoryTable.innerHTML = '';
  for (const r of inv) {
    const tr = document.createElement('tr');
    tr.innerHTML = \`
      <td>\${r.item}</td>
      <td>\${r.category}</td>
      <td>\${r.qty}</td>
      <td>\${r.unit}</td>
      <td>\${(r.weightLb||0).toFixed(2)}</td>
      <td>
        <button class="btn" data-delta="-1">-</button>
        <button class="btn" data-delta="1">+</button>
      </td>\`;
    inventoryTable.appendChild(tr);
    // attach listeners
    const [minus, plus] = tr.querySelectorAll('button');
    minus.addEventListener('click', () => adjustQty(r, -1));
    plus.addEventListener('click', () => adjustQty(r, +1));
  }
}

function adjustQty(row, delta) {
  const inv = LS.get('fb_inventory', []);
  const idx = inv.findIndex(x => x.item === row.item && x.category === row.category);
  if (idx >= 0) {
    inv[idx].qty = Math.max(0, inv[idx].qty + delta);
    LS.set('fb_inventory', inv);
    renderInventory();
  }
}

// ---- Schedule ----
const pickupForm = document.getElementById('pickupForm');
const pickupsTable = document.getElementById('pickupsTable').querySelector('tbody');
const scheduleStatus = document.getElementById('scheduleStatus');
const clearPickupsBtn = document.getElementById('clearPickups');

pickupForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  const dt = document.getElementById('pickupDate').value;
  const notes = document.getElementById('notes').value.trim();
  if (!name || !dt) return;
  const rec = { id: uid(), dateISO: new Date(dt).toISOString(), name, notes };
  state.pickups.push(rec);
  LS.set('fb_pickups', state.pickups);
  renderPickups();
  scheduleStatus.textContent = 'Scheduled.';
  pickupForm.reset();
  setTimeout(() => scheduleStatus.textContent = '', 1500);
});

clearPickupsBtn.addEventListener('click', () => {
  if (confirm('Clear ALL pickups?')) {
    state.pickups = [];
    LS.set('fb_pickups', state.pickups);
    renderPickups();
  }
});

function renderPickups() {
  pickupsTable.innerHTML = '';
  const rows = [...state.pickups].sort((a,b)=> new Date(a.dateISO)-new Date(b.dateISO));
  for (const p of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = \`
      <td>\${new Date(p.dateISO).toLocaleString()}</td>
      <td>\${p.name}</td>
      <td>\${p.notes || ''}</td>
      <td><button class="btn btn-danger btn-xs" data-id="\${p.id}">Delete</button></td>\`;
    pickupsTable.appendChild(tr);
  }
  pickupsTable.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.pickups = state.pickups.filter(x => x.id !== btn.dataset.id);
      LS.set('fb_pickups', state.pickups);
      renderPickups();
    });
  });
}
renderPickups();

// ---- Dashboard ----
function sum(arr, sel) { return arr.reduce((a,b)=> a + sel(b), 0); }

function renderDashboard() {
  const donations = state.donations;
  const inv = LS.get('fb_inventory', deriveInventory());
  document.getElementById('kpiTotalDonations').textContent = donations.length;
  document.getElementById('kpiTotalLb').textContent = sum(donations, d => d.weightLb || 0).toFixed(1);
  document.getElementById('kpiUpcoming').textContent = state.pickups.length;

  const byCat = new Map();
  for (const r of inv) byCat.set(r.category, (byCat.get(r.category)||0) + (r.weightLb || r.qty || 0));
  const labels = [...byCat.keys()];
  const values = [...byCat.values()];
  drawBarChart('categoryChart', labels, values);
}
document.getElementById('refreshDashboard').addEventListener('click', renderDashboard);

// ---- Simple Canvas Bar Chart ----
function drawBarChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  const pad = 40;
  const maxVal = Math.max(1, ...values);
  const barW = (W - pad*2) / values.length * 0.7;
  const step = (W - pad*2) / values.length;

  // axes
  ctx.strokeStyle = '#b9c0da';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, H-pad);
  ctx.lineTo(W-pad, H-pad);
  ctx.moveTo(pad, H-pad);
  ctx.lineTo(pad, pad);
  ctx.stroke();

  // bars
  for (let i=0; i<values.length; i++) {
    const x = pad + i*step + (step - barW)/2;
    const h = (H - pad*2) * (values[i] / maxVal);
    const y = H - pad - h;
    // gradient fill
    const grad = ctx.createLinearGradient(0, y, 0, y+h);
    grad.addColorStop(0, '#6aa3ff');
    grad.addColorStop(1, '#9a6bff');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, h);

    // label
    ctx.fillStyle = '#e8ebf7';
    ctx.textAlign = 'center';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(labels[i], x + barW/2, H - pad + 14);
  }
}

// ---- Export / Import CSV ----
function toCSV(rows, header) {
  const escape = v => ('"'+String(v).replaceAll('"','""')+'"');
  return header.join(',') + '\n' + rows.map(r => header.map(h => escape(r[h] ?? '')).join(',')).join('\n');
}

function download(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: 'text/csv'}));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

document.getElementById('exportDonations').addEventListener('click', () => {
  const header = ['date','donor','item','category','qty','unit','weight_lb'];
  const rows = state.donations.map(d => ({
    date: new Date(d.dateISO).toISOString(),
    donor: d.donor, item: d.item, category: d.category,
    qty: d.qty, unit: d.unit, weight_lb: d.weightLb||0
  }));
  download('donations.csv', toCSV(rows, header));
});

document.getElementById('exportInventory').addEventListener('click', () => {
  const header = ['item','category','qty','unit','weight_lb'];
  const inv = LS.get('fb_inventory', deriveInventory());
  const rows = inv.map(r => ({ item:r.item, category:r.category, qty:r.qty, unit:r.unit, weight_lb:r.weightLb||0 }));
  download('inventory.csv', toCSV(rows, header));
});

document.getElementById('importDonations').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const [head, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const cols = head.split(',').map(h => h.trim());
  const req = ['date','donor','item','category','qty','unit','weight_lb'];
  const ok = req.every(x => cols.includes(x));
  if (!ok) { alert('CSV header invalid. Required: ' + req.join(', ')); return; }
  const idx = Object.fromEntries(cols.map((c,i)=>[c,i]));
  for (const line of lines) {
    const parts = line.split(',').map(s => s.replace(/^"|"$/g,'').replace(/""/g,'"'));
    const rec = {
      id: uid(),
      dateISO: new Date(parts[idx.date]).toISOString(),
      donor: parts[idx.donor], item: parts[idx.item],
      category: parts[idx.category],
      qty: +parts[idx.qty] || 0,
      unit: parts[idx.unit] || 'units',
      weightLb: +parts[idx.weight_lb] || 0
    };
    state.donations.unshift(rec);
  }
  LS.set('fb_donations', state.donations);
  renderDonations();
  alert('Imported donations: ' + lines.length);
});
