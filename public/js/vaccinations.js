document.addEventListener('DOMContentLoaded', async () => {
  let records = [];

  async function load() {
    records = await api.get('/vaccinations');
    render(records);
  }
  await load();

  document.getElementById('vax-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    render(records.filter(v =>
      (v.animal_name||'').toLowerCase().includes(q) ||
      (v.vaccine||'').toLowerCase().includes(q) ||
      (v.given_by||'').toLowerCase().includes(q)
    ));
  });

  const overlay = document.getElementById('vax-modal');
  const vaxModalTitle = document.getElementById('vax-modal-title');
  document.getElementById('open-vax-modal')?.addEventListener('click', async () => {
    vaxModalTitle.textContent = 'Log Vaccination';
    const animals = await api.get('/animals');
    const sel = document.getElementById('v-animal');
    if (sel) { sel.innerHTML = animals.map(a => `<option value="${a.id}">${a.name} (${a.species})</option>`).join(''); sel.disabled = false; }
    overlay?.classList.add('open');
  });
  document.getElementById('close-vax-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-vax-btn')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if(e.target===overlay) closeModal(); });
  function closeModal() {
    overlay?.classList.remove('open');
    document.getElementById('vax-form-el')?.reset();
    document.getElementById('v-edit-id').value = '';
    document.getElementById('v-animal').disabled = false;
  }

  document.getElementById('save-vax')?.addEventListener('click', async () => {
    const animal_id = document.getElementById('v-animal').value;
    const vaccine   = document.getElementById('v-vaccine').value.trim();
    const given_by  = document.getElementById('v-given-by').value.trim();
    const given_at  = document.getElementById('v-given-at').value;
    const next_due  = document.getElementById('v-next-due').value;
    const editId    = document.getElementById('v-edit-id').value;
    if (!animal_id || !vaccine) { alert('Animal and vaccine are required.'); return; }
    try {
      if (editId) {
        await api.put(`/vaccinations/${editId}`, { vaccine, given_by, given_at, next_due });
      } else {
        await api.post('/vaccinations', { animal_id, vaccine, given_by, given_at, next_due });
      }
      closeModal(); await load();
    } catch(err) { alert('Error: ' + err.message); }
  });

  window.editVax = async (id) => {
    try {
      const v = await api.get(`/vaccinations/${id}`);
      const animals = await api.get('/animals');
      const sel = document.getElementById('v-animal');
      sel.innerHTML = animals.map(a => `<option value="${a.id}" ${a.id===v.animal_id?'selected':''}>${a.name} (${a.species})</option>`).join('');
      sel.disabled = true;
      document.getElementById('v-edit-id').value    = v.id;
      document.getElementById('v-vaccine').value    = v.vaccine || '';
      document.getElementById('v-given-by').value   = v.given_by || '';
      document.getElementById('v-given-at').value   = v.given_at ? v.given_at.substring(0,10) : '';
      document.getElementById('v-next-due').value   = v.next_due ? v.next_due.substring(0,10) : '';
      vaxModalTitle.textContent = 'Edit Vaccination';
      overlay?.classList.add('open');
    } catch(err) { alert('Could not load record: ' + err.message); }
  };

  window.deleteVax = async (id) => {
    if (!confirm('Delete this vaccination record?')) return;
    try { await api.delete(`/vaccinations/${id}`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  function render(data) {
    const tbody = document.getElementById('vax-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💉</div><p>No records yet.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(v => `
      <tr>
        <td>${v.animal_name || '—'}</td>
        <td>${v.vaccine}</td>
        <td>${v.given_by || '—'}</td>
        <td>${fmtDate(v.given_at)}</td>
        <td>${fmtDate(v.next_due)}</td>
        <td>
          <button class="btn-sm btn-action" onclick="editVax(${v.id})">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteVax(${v.id})">Delete</button>
        </td>
      </tr>`).join('');
  }

  function fmtDate(d) {
    if(!d) return '—';
    return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
});