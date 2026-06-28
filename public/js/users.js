document.addEventListener('DOMContentLoaded', async () => {
  const me = await api.get('/auth/me');
  const isSuperAdmin = me.role === 'superadmin';

  if (!isSuperAdmin) {
    document.getElementById('open-user-modal')?.style.setProperty('display', 'none');
  }

  async function load() {
    const users = await api.get('/users');
    render(users);
  }
  await load();

  const overlay = document.getElementById('user-modal');
  document.getElementById('open-user-modal')?.addEventListener('click', () => overlay?.classList.add('open'));
  document.getElementById('close-user-modal')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  function closeModal() { overlay?.classList.remove('open'); document.getElementById('user-form-el')?.reset(); }

  document.getElementById('save-user')?.addEventListener('click', async () => {
    const name     = document.getElementById('u-name').value.trim();
    const email    = document.getElementById('u-email').value.trim();
    const password = document.getElementById('u-password').value;
    const barangay = document.getElementById('u-barangay').value.trim();
    const role     = document.getElementById('u-role').value;
    if (!name || !email || !password || !barangay) { alert('All fields are required.'); return; }
    try {
      await api.post('/users', { name, email, password, barangay, role });
      closeModal(); await load();
    } catch(err) { alert('Error: ' + err.message); }
  });

  window.deleteUser = async (id, name) => {
    if (!confirm(`Delete user ${name}?`)) return;
    try { await api.delete(`/users/${id}`); await load(); }
    catch(err) { alert('Error: ' + err.message); }
  };

  let editUserId = null;
  const editOverlay = document.getElementById('edit-user-modal');

  window.openEditUser = (id, name, email, barangay, role) => {
    editUserId = id;
    document.getElementById('edit-u-name').value     = name;
    document.getElementById('edit-u-email').value    = email;
    document.getElementById('edit-u-barangay').value = barangay;
    document.getElementById('edit-u-role').value     = role;
    document.getElementById('edit-u-password').value = '';
    editOverlay?.classList.add('open');
  };

  document.getElementById('close-edit-user-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit-user')?.addEventListener('click', closeEditModal);
  editOverlay?.addEventListener('click', e => { if (e.target === editOverlay) closeEditModal(); });
  function closeEditModal() { editOverlay?.classList.remove('open'); editUserId = null; }

  document.getElementById('save-edit-user')?.addEventListener('click', async () => {
    const name     = document.getElementById('edit-u-name').value.trim();
    const email    = document.getElementById('edit-u-email').value.trim();
    const barangay = document.getElementById('edit-u-barangay').value.trim();
    const role     = document.getElementById('edit-u-role').value;
    const password = document.getElementById('edit-u-password').value;
    if (!name || !email || !barangay) { alert('Name, email and barangay are required.'); return; }
    if (password && password.length < 6) { alert('Password must be at least 6 characters.'); return; }
    const payload = { name, email, barangay, role };
    if (password) payload.password = password;
    try {
      await api.put(`/users/${editUserId}`, payload);
      closeEditModal(); await load();
    } catch(err) { alert('Error: ' + err.message); }
  });

  function render(data) {
    const tbody = document.getElementById('users-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">⚙️</div><p>No users yet.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.barangay}</td>
        <td><span class="badge ${u.role === 'superadmin' ? 'badge-green' : 'badge-gray'}">${u.role}</span></td>
        <td style="display:flex;gap:6px;">
          ${isSuperAdmin ? `<button class="btn-sm btn-edit" onclick="openEditUser(${u.id},'${u.name}','${u.email}','${u.barangay}','${u.role}')">Edit</button>` : ''}
          ${isSuperAdmin ? `<button class="btn-sm btn-danger" onclick="deleteUser(${u.id},'${u.name}')">Delete</button>` : ''}
          ${!isSuperAdmin ? `<span style="font-size:12px;color:var(--gray-400);">View only</span>` : ''}
        </td>
      </tr>`).join('');
  }
});