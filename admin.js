/* PromptAds Admin Dashboard — Client-Side Logic */

const API_BASE = '/api/admin';
let adminSecret = '';
let deleteTargetId = null;
let allSubmissions = [];

// Shorthand
const $ = (id) => document.getElementById(id);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
$('login-btn').addEventListener('click', tryLogin);
$('secret-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });

function tryLogin() {
    const val = $('secret-input').value.trim();
    if (!val) return;
    adminSecret = val;
    // Verify against the server
    fetchSubmissions().then(success => {
        if (success) {
            $('login-overlay').style.display = 'none';
            $('dashboard').style.display = 'flex';
            loadStats();
        } else {
            $('login-error').style.display = 'block';
            $('secret-input').value = '';
            adminSecret = '';
        }
    });
}

$('logout-btn').addEventListener('click', () => {
    adminSecret = '';
    $('dashboard').style.display = 'none';
    $('login-overlay').style.display = 'flex';
    $('secret-input').value = '';
    $('login-error').style.display = 'none';
});

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        item.classList.add('active');
        $(`view-${item.dataset.view}`).classList.add('active');
        if (item.dataset.view === 'stats') loadStats();
    });
});

// ─── FETCH SUBMISSIONS ────────────────────────────────────────────────────────
async function fetchSubmissions() {
    const search = $('search-input')?.value.trim() || '';
    const budget = $('budget-filter')?.value || '';

    let url = `${API_BASE}/submissions?limit=200`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (budget) url += `&budget=${encodeURIComponent(budget)}`;

    try {
        const res = await fetch(url, {
            headers: { Authorization: adminSecret }
        });
        if (res.status === 401) return false;
        const json = await res.json();
        if (!json.success) return false;

        allSubmissions = json.data;
        renderTable(json.data, json.total);
        return true;
    } catch (err) {
        console.error('Fetch error:', err);
        renderError();
        return false;
    }
}

// ─── RENDER TABLE ─────────────────────────────────────────────────────────────
function renderTable(rows, total) {
    const tbody = $('leads-tbody');
    $('stat-showing').textContent = rows.length;

    if (rows.length === 0) {
        tbody.innerHTML = '';
        $('empty-state').style.display = 'block';
        document.querySelector('.table-wrapper').style.display = 'none';
        return;
    }

    $('empty-state').style.display = 'none';
    document.querySelector('.table-wrapper').style.display = 'block';

    tbody.innerHTML = rows.map(row => `
    <tr>
      <td class="id-cell">#${row.id}</td>
      <td class="name-cell">${escHtml(row.name)}</td>
      <td class="email-cell"><a href="mailto:${escHtml(row.email)}">${escHtml(row.email)}</a></td>
      <td class="company-cell">${escHtml(row.company)}</td>
      <td>${row.budget ? `<span class="budget-badge">${escHtml(row.budget)}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
      <td class="goal-cell" title="${escHtml(row.goal || '')}">${escHtml(row.goal || '—')}</td>
      <td class="date-cell">${formatDate(row.created_at)}</td>
      <td>
        <button class="btn-delete" data-id="${row.id}" title="Delete submission">🗑 Delete</button>
      </td>
    </tr>
  `).join('');

    // Attach delete handlers
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(Number(btn.dataset.id)));
    });
}

function renderError() {
    $('leads-tbody').innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--red);padding:48px;">Failed to load submissions.</td></tr>';
}

// ─── FETCH & RENDER STATS ─────────────────────────────────────────────────────
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`, { headers: { Authorization: adminSecret } });
        const json = await res.json();
        if (!json.success) return;

        const { total, today, thisWeek, byBudget } = json.stats;

        $('stat-total').textContent = total;
        $('stat-today').textContent = today;
        $('stat-week').textContent = thisWeek;
        $('big-total').textContent = total;
        $('big-today').textContent = today;
        $('big-week').textContent = thisWeek;

        // Budget bars
        const barsEl = $('budget-bars');
        if (byBudget.length === 0) {
            barsEl.innerHTML = '<p class="loading-text" style="color:var(--muted)">No data yet.</p>';
            return;
        }
        const max = Math.max(...byBudget.map(b => b.count), 1);
        barsEl.innerHTML = byBudget.map(b => `
      <div class="budget-bar-item">
        <div class="budget-bar-label">
          <span>${escHtml(b.budget || 'Not specified')}</span>
          <span>${b.count} lead${b.count !== 1 ? 's' : ''}</span>
        </div>
        <div class="budget-bar-track">
          <div class="budget-bar-fill" style="width: ${Math.round((b.count / max) * 100)}%"></div>
        </div>
      </div>
    `).join('');
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ─── DELETE FLOW ──────────────────────────────────────────────────────────────
function openDeleteModal(id) {
    deleteTargetId = id;
    $('modal-overlay').style.display = 'flex';
}

$('modal-cancel').addEventListener('click', () => {
    $('modal-overlay').style.display = 'none';
    deleteTargetId = null;
});

$('modal-confirm').addEventListener('click', async () => {
    if (!deleteTargetId) return;
    $('modal-overlay').style.display = 'none';
    try {
        await fetch(`${API_BASE}/submissions/${deleteTargetId}`, {
            method: 'DELETE',
            headers: { Authorization: adminSecret }
        });
        deleteTargetId = null;
        fetchSubmissions();
        loadStats();
    } catch (err) {
        console.error('Delete error:', err);
    }
});

// Click outside modal to cancel
$('modal-overlay').addEventListener('click', (e) => {
    if (e.target === $('modal-overlay')) {
        $('modal-overlay').style.display = 'none';
        deleteTargetId = null;
    }
});

// ─── FILTERS ──────────────────────────────────────────────────────────────────
let searchDebounce;
$('search-input')?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => fetchSubmissions(), 300);
});
$('budget-filter')?.addEventListener('change', () => fetchSubmissions());

// ─── REFRESH ──────────────────────────────────────────────────────────────────
$('refresh-btn')?.addEventListener('click', () => {
    fetchSubmissions();
    loadStats();
});

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
$('export-btn')?.addEventListener('click', () => {
    if (!allSubmissions.length) {
        alert('No data to export.');
        return;
    }

    const headers = ['ID', 'Name', 'Email', 'Company', 'Budget', 'Goal', 'IP', 'Submitted At'];
    const rows = allSubmissions.map(r => [
        r.id,
        r.name,
        r.email,
        r.company,
        r.budget || '',
        (r.goal || '').replace(/[\r\n]+/g, ' '),
        r.ip_address || '',
        r.created_at,
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptads-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
