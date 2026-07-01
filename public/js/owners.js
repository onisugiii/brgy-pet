document.addEventListener('DOMContentLoaded', async () => {
  let owners = [];

  async function load() {
    owners = await api.get('/owners');
    render(owners);
  }
  await load();

  const overlay = document.getElementById('owner-modal');
  const ownerModalTitle = document.getElementById('owner-modal-title');
  document.getElementById('open-owner-modal')?.addEventListener('click', () => { ownerModalTitle.textContent = 'Add Owner'; overlay?.classList.add('open'); });
  document.getElementById('close-owner-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-owner-btn')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if(e.target===overlay) closeModal(); });
  function closeModal() { overlay?.classList.remove('open'); document.getElementById('owner-form-el')?.reset(); document.getElementById('o-edit-id').value=''; }

  document.getElementById('save-owner')?.addEventListener('click', async () => {
    const name     = document.getElementById('o-name').value.trim();
    const address  = document.getElementById('o-address').value.trim();
    const contact  = document.getElementById('o-contact').value.trim();
    const barangay = document.getElementById('o-barangay').value.trim();
    const editId   = document.getElementById('o-edit-id').value;
    if (!name) { alert('Name is required.'); return; }
    try {
      if (editId) {
        await api.put(`/owners/${editId}`, { name, address, contact, barangay });
      } else {
        await api.post('/owners', { name, address, contact, barangay });
      }
      closeModal(); await load();
    } catch(err) { alert('Error: ' + err.message); }
  });

  window.editOwner = async (id) => {
    try {
      const o = await api.get(`/owners/${id}`);
      document.getElementById('o-edit-id').value  = o.id;
      document.getElementById('o-name').value     = o.name || '';
      document.getElementById('o-address').value  = o.address || '';
      document.getElementById('o-contact').value  = o.contact || '';
      document.getElementById('o-barangay').value = o.barangay || '';
      ownerModalTitle.textContent = 'Edit Owner';
      overlay?.classList.add('open');
    } catch(err) { alert('Could not load owner: ' + err.message); }
  };

  window.deleteOwner = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    try { await api.delete(`/owners/${id}`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  function render(data) {
    const tbody = document.getElementById('owners-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👤</div><p>No owners yet.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(o => `
      <tr>
        <td>${o.name}</td>
        <td>${o.contact || '—'}</td>
        <td>${o.address || '—'}</td>
        <td>${o.barangay || '—'}</td>
        <td>
          <button class="btn-sm btn-action" onclick="editOwner('${o.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteOwner('${o.id}','${o.name}')">Delete</button>
        </td>
      </tr>`).join('');
  }
});