/* ═══════════════════════════════════════
   BRGY-PET · dashboard.js  (API-connected)
════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {

  try {
    const data = await api.get('/dashboard');

    /* ── Stats ── */
    setEl('stat-total',      data.stats.total);
    setEl('stat-vaccinated', data.stats.vaccinated);
    setEl('stat-lost',       data.stats.lostFound);
    setEl('stat-adoption',   data.stats.adoption);
    setEl('stat-coverage',   `↑ ${data.stats.coverage}% coverage`);
    setEl('stat-total-change', `↑ ${data.stats.total} registered`);

    /* ── Recent registrations ── */
    const tbody = document.getElementById('recent-registrations-body');
    if (tbody) {
      tbody.innerHTML = data.recentAnimals.length === 0
        ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🐾</div><p>No animals yet.</p></div></td></tr>`
        : data.recentAnimals.map(a => `
          <tr>
            <td>
              <div class="pet-cell">
                ${a.image
                  ? `<img src="${a.image}" alt="${a.name}" class="pet-thumb"/>`
                  : `<div class="pet-avatar">${initials(a.name)}</div>`}
                <div>
                  <div class="pet-name">${a.name}</div>
                  <div class="pet-breed">${a.breed || '—'}</div>
                </div>
              </div>
            </td>
            <td>${a.owner_name}</td>
            <td>${a.species}</td>
            <td>${badgeHtml(a.vax_status)}</td>
            <td>${fmtDate(a.registered_at)}</td>
          </tr>`).join('');
    }

    /* ── Activity feed ── */
    const feedEl = document.getElementById('activity-feed');
    if (feedEl) {
      feedEl.innerHTML = data.activityFeed.length === 0
        ? '<p style="color:var(--text-muted);font-size:.85rem;">No activity yet.</p>'
        : data.activityFeed.map(item => `
          <div class="activity-item">
            <div class="activity-dot dot-${item.color}"></div>
            <div>
              <div class="activity-text">${item.text}</div>
              <div class="activity-time">${timeAgo(item.logged_at)}</div>
            </div>
          </div>`).join('');
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function initials(n) {
    return n.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
  }

  function badgeHtml(s) {
    const m = { 'Vaccinated':'badge-green','Partial':'badge-yellow','Unvaccinated':'badge-red' };
    return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }

  function timeAgo(d) {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
});