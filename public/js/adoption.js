document.addEventListener('DOMContentLoaded', async () => {
  let records = [];

  async function load() {
    records = await api.get('/adoptions');
    render(records);
  }
  await load();

  document.getElementById('adopt-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    render(records.filter(a =>
      (a.animal_name||'').toLowerCase().includes(q) ||
      (a.species||'').toLowerCase().includes(q) ||
      (a.description||'').toLowerCase().includes(q) ||
      (a.listed_by||'').toLowerCase().includes(q) ||
      (a.status||'').toLowerCase().includes(q)
    ));
  });

  const overlay = document.getElementById('adopt-modal');
  const adoptModalTitle = document.getElementById('adopt-modal-title');

  document.getElementById('open-adopt-modal')?.addEventListener('click', async () => {
    adoptModalTitle.textContent = 'Add Adoption Listing';
    document.getElementById('ad-edit-id').value = '';
    const animals = await api.get('/animals');
    const sel = document.getElementById('ad-animal');
    if (sel) { sel.innerHTML = animals.map(a => `<option value="${a.id}" data-name="${a.name}" data-species="${a.species}">${a.name} (${a.species})</option>`).join(''); sel.disabled = false; }
    overlay?.classList.add('open');
  });
  document.getElementById('close-adopt-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-adopt-modal')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if(e.target===overlay) closeModal(); });
  function closeModal() {
    overlay?.classList.remove('open');
    document.getElementById('adopt-form-el')?.reset();
    document.getElementById('ad-edit-id').value = '';
  }

  document.getElementById('save-adopt')?.addEventListener('click', async () => {
    const editId      = document.getElementById('ad-edit-id').value;
    const sel         = document.getElementById('ad-animal');
    const animal_id   = sel?.value;
    const animal_name = sel?.options[sel.selectedIndex]?.dataset.name;
    const species     = sel?.options[sel.selectedIndex]?.dataset.species;
    const description = document.getElementById('ad-description').value.trim();
    const listed_by   = document.getElementById('ad-listed-by').value.trim();
    if (!animal_id) { alert('Please select an animal.'); return; }
    try {
      if (editId) {
        await api.put(`/adoptions/${editId}`, { description, listed_by });
      } else {
        await api.post('/adoptions', { animal_id, animal_name, species, description, listed_by });
      }
      closeModal(); await load();
    } catch(err) { alert('Error: ' + err.message); }
  });

  window.editAdopt = async (id) => {
    try {
      const a = await api.get(`/adoptions/${id}`);
      const animals = await api.get('/animals');
      const sel = document.getElementById('ad-animal');
      sel.innerHTML = animals.map(an => `<option value="${an.id}" data-name="${an.name}" data-species="${an.species}" ${an.id===a.animal_id?'selected':''}>${an.name} (${an.species})</option>`).join('');
      sel.disabled = true;
      document.getElementById('ad-edit-id').value     = a.id;
      document.getElementById('ad-description').value = a.description || '';
      document.getElementById('ad-listed-by').value   = a.listed_by || '';
      adoptModalTitle.textContent = 'Edit Listing';
      overlay?.classList.add('open');
    } catch(err) { alert('Could not load listing: ' + err.message); }
  };

  window.markAdopted = async (id, name) => {
    if (!confirm(`Mark ${name} as adopted?`)) return;
    try { await api.patch(`/adoptions/${id}/adopt`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  window.deleteAdopt = async (id) => {
    if (!confirm('Delete this listing?')) return;
    try { await api.delete(`/adoptions/${id}`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  function render(data) {
    const tbody = document.getElementById('adopt-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🏡</div><p>No listings yet.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td>${a.animal_name}</td>
        <td>${a.species || '—'}</td>
        <td>${a.description || '—'}</td>
        <td>${a.listed_by || '—'}</td>
        <td><span class="badge ${a.status==='available'?'badge-green':'badge-gray'}">${a.status}</span></td>
        <td style="display:flex;gap:4px;flex-wrap:nowrap;align-items:center;">
          <button class="btn-sm btn-edit" onclick="editAdopt(${a.id})">Edit</button>
          ${a.status==='available' ? `<button class="btn-sm btn-adopt" onclick="markAdopted(${a.id},'${a.animal_name}')" style="white-space:nowrap;font-size:11px;padding:4px 8px;">Mark Adopted</button>` : ''}
          <button class="btn-sm btn-danger" onclick="deleteAdopt(${a.id})">Delete</button>
        </td>
      </tr>`).join('');
  }
});