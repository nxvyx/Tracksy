let applications = JSON.parse(localStorage.getItem('applications')) || [];
let editingId = null;

const grid = document.getElementById('grid');
const modal = document.getElementById('modal');
const form = document.getElementById('form');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel');
const searchInput = document.getElementById('search');
const filterSelect = document.getElementById('filter-status');
const sortSelect = document.getElementById('sort-by');
const exportCsvBtn = document.getElementById('export-csv');
const exportPdfBtn = document.getElementById('export-pdf');
const exportJsonBtn = document.getElementById('export-json');
const importBtn = document.getElementById('import-btn');
const importJson = document.getElementById('import-json');
const emptyState = document.getElementById('empty-state');
let chart;

// Add app
addBtn.onclick = () => {
  editingId = null;
  form.reset();
  document.getElementById('form-title').textContent = "Add Application";
  modal.classList.remove('hidden');
};

cancelBtn.onclick = () => modal.classList.add('hidden');

// Save form
form.onsubmit = e => {
  e.preventDefault();
  const app = {
    id: editingId || Date.now(),
    name: form.name.value,
    role: form.role.value,
    date: form.date.value,
    status: form.status.value,
    notes: form.notes.value,
    link: form.link.value
  };
  if (editingId) {
    const idx = applications.findIndex(a => a.id === editingId);
    applications[idx] = app;
  } else applications.push(app);

  if (app.status === 'offer') confetti();

  saveAndRender();
  modal.classList.add('hidden');
};

// Save + render
function saveAndRender() {
  localStorage.setItem('applications', JSON.stringify(applications));
  renderGrid();
  renderChart();
}

// Render grid
function renderGrid() {
  grid.innerHTML = '';
  emptyState.style.display = applications.length ? 'none' : 'block';

  let filtered = applications.filter(app =>
    (!filterSelect.value || app.status === filterSelect.value) &&
    (app.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
     app.role.toLowerCase().includes(searchInput.value.toLowerCase()))
  );

  filtered.sort((a,b) => sortSelect.value === 'oldest'
    ? new Date(a.date) - new Date(b.date)
    : new Date(b.date) - new Date(a.date));

  filtered.forEach(app => {
    const card = document.createElement('div');
    card.className = `card ${app.status}`;
    const age = Math.round((Date.now() - new Date(app.date)) / (1000*60*60*24));

    card.innerHTML = `
      <h3>${app.name}</h3>
      <p><strong>${app.role}</strong></p>
      <p>${app.date} • ${age} days ago</p>
      <span class="status-tag">${app.status}</span>
      <p>${app.notes || ''}</p>
      ${app.link ? `<a href="${app.link}" target="_blank">🔗 Link</a>` : ''}
      <div class="timeline"><div class="progress"></div></div>
      <div class="actions">
        <button class="edit" data-id="${app.id}">✏️</button>
        <button class="delete" data-id="${app.id}">🗑️</button>
      </div>
    `;

    if (age > 10 && app.status === 'applied') {
      card.insertAdjacentHTML('beforeend', `<p class="reminder">⏰ Follow up soon!</p>`);
    }

    grid.appendChild(card);
  });
}

// Edit/Delete
grid.addEventListener('click', e => {
  const id = +e.target.dataset.id;
  if (e.target.classList.contains('edit')) {
    const app = applications.find(a => a.id === id);
    Object.entries(app).forEach(([k,v]) => form[k].value = v);
    editingId = id;
    document.getElementById('form-title').textContent = "Edit Application";
    modal.classList.remove('hidden');
  }
  if (e.target.classList.contains('delete')) {
    applications = applications.filter(a => a.id !== id);
    saveAndRender();
  }
});

// Filters
[searchInput, filterSelect, sortSelect].forEach(el => el.addEventListener('input', saveAndRender));


// CSV Export
exportCsvBtn.onclick = () => {
  const csv = "Name,Role,Date,Status,Notes,Link\n" +
    applications.map(a => `${a.name},${a.role},${a.date},${a.status},${a.notes},${a.link}`).join("\n");
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'applications.csv';
  a.click();
};

// PDF Export
exportPdfBtn.onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Application Tracker', 10, 10);
  applications.forEach((app, i) => doc.text(`${i+1}. ${app.name} - ${app.role} (${app.status})`, 10, 20 + i*10));
  doc.save('applications.pdf');
};

// JSON Export/Import
exportJsonBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(applications, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'applications.json';
  a.click();
};

importBtn.onclick = () => importJson.click();

importJson.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    applications = JSON.parse(e.target.result);
    saveAndRender();
  };
  reader.readAsText(file);
};

// Chart
function renderChart() {
  const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 };
  applications.forEach(a => counts[a.status]++);
  const ctx = document.getElementById('statusChart');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Applied', 'Interview', 'Offer', 'Rejected'],
      datasets: [{
        data: [counts.applied, counts.interview, counts.offer, counts.rejected],
        backgroundColor: ['#bbdefb','#fff59d','#c8e6c9','#ffcdd2']
      }]
    }
  });

  // 🎉 Milestone
  if (applications.length === 10 || counts.offer >= 3) confetti();
}

// Initial
saveAndRender();
