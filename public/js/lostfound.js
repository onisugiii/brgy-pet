document.addEventListener('DOMContentLoaded', async () => {
  let records = [];

  async function load() {
    records = await api.get('/lost-found');
    render(records);
  }
  await load();

  document.getElementById('lf-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    render(records.filter(r =>
      (r.description||'').toLowerCase().includes(q) ||
      (r.reporter||'').toLowerCase().includes(q) ||
      (r.last_seen||'').toLowerCase().includes(q) ||
      (r.contact||'').toLowerCase().includes(q) ||
      (r.type||'').toLowerCase().includes(q)
    ));
  });

  const overlay = document.getElementById('lf-modal');
  const lfModalTitle = document.getElementById('lf-modal-title');
  document.getElementById('open-lf-modal')?.addEventListener('click', () => { lfModalTitle.textContent = 'Report Lost / Found'; overlay?.classList.add('open'); });
  document.getElementById('close-lf-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-lf-btn')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if(e.target===overlay) closeModal(); });
  function closeModal() { overlay?.classList.remove('open'); document.getElementById('lf-form-el')?.reset(); document.getElementById('lf-edit-id').value=''; }

  document.getElementById('save-lf')?.addEventListener('click', async () => {
    const type        = document.getElementById('lf-type').value;
    const description = document.getElementById('lf-description').value.trim();
    const last_seen   = document.getElementById('lf-last-seen').value.trim();
    const reporter    = document.getElementById('lf-reporter').value.trim();
    const contact     = document.getElementById('lf-contact').value.trim();
    const editId      = document.getElementById('lf-edit-id').value;
    if (!type) { alert('Type is required.'); return; }
    try {
      if (editId) {
        await api.put(`/lost-found/${editId}`, { type, description, last_seen, reporter, contact });
      } else {
        await api.post('/lost-found', { type, description, last_seen, reporter, contact });
      }
      closeModal(); await load();
    } catch(err) { alert('Error: ' + err.message); }
  });

  window.editLF = async (id) => {
    try {
      const r = await api.get(`/lost-found/${id}`);
      document.getElementById('lf-edit-id').value     = r.id;
      document.getElementById('lf-type').value        = r.type || 'lost';
      document.getElementById('lf-description').value = r.description || '';
      document.getElementById('lf-last-seen').value   = r.last_seen || '';
      document.getElementById('lf-reporter').value    = r.reporter || '';
      document.getElementById('lf-contact').value     = r.contact || '';
      lfModalTitle.textContent = 'Edit Report';
      overlay?.classList.add('open');
    } catch(err) { alert('Could not load report: ' + err.message); }
  };

  window.resolveLF = async (id) => {
    try { await api.patch(`/lost-found/${id}/resolve`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  window.deleteLF = async (id) => {
    if (!confirm('Delete this report?')) return;
    try { await api.delete(`/lost-found/${id}`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  function render(data) {
    const tbody = document.getElementById('lf-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🔍</div><p>No reports yet.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td><span class="badge ${r.type==='lost'?'badge-red':'badge-green'}">${r.type}</span></td>
        <td>${r.description || '—'}</td>
        <td>${r.reporter || '—'} ${r.contact ? '· '+r.contact : ''}</td>
        <td>${r.last_seen || '—'}</td>
        <td><span class="badge ${r.status==='active'?'badge-yellow':'badge-gray'}">${r.status}</span></td>
        <td>
          <div style="display:flex;gap:4px;flex-wrap:nowrap;">
            ${r.status==='active' ? `<button class="btn-sm btn-action" onclick="resolveLF(${r.id})">Resolve</button>` : ''}
            <button class="btn-sm btn-action" onclick="editLF(${r.id})">Edit</button>
            <button class="btn-sm btn-danger" onclick="deleteLF(${r.id})">Delete</button>
          </div>
        </td>
      </tr>`).join('');
  }
});