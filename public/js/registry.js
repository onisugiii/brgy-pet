document.addEventListener('DOMContentLoaded', async () => {

  let animals = [];

  async function loadAnimals(q = '') {
    try {
      animals = await api.get('/animals' + (q ? `?q=${encodeURIComponent(q)}` : ''));
      renderTable(animals);
    } catch (err) { console.error(err); }
  }

  await loadAnimals();

  const searchInput = document.getElementById('registry-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => loadAnimals(searchInput.value.trim()));
  }

  const fileInput = document.getElementById('f-image');
  const preview   = document.getElementById('f-image-preview');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); fileInput.value = ''; return; }
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = 'block';
        document.querySelector('.img-upload-label').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  const overlay  = document.getElementById('register-modal');
  const openBtn  = document.getElementById('open-register-modal');
  const closeBtn = document.getElementById('close-register-modal');
  const cancelBtn = document.getElementById('cancel-register-btn');
  const modalTitle = document.getElementById('register-modal-title');
  openBtn?.addEventListener('click',  () => { modalTitle.textContent = 'Register New Pet'; overlay?.classList.add('open'); });
  closeBtn?.addEventListener('click', () => closeModal());
  cancelBtn?.addEventListener('click', () => closeModal());
  overlay?.addEventListener('click',  e => { if (e.target === overlay) closeModal(); });

  function closeModal() {
    overlay?.classList.remove('open');
    document.getElementById('f-edit-id').value = '';
    ['f-name','f-breed','f-color','f-age','f-owner','f-notes','f-date'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    ['f-species','f-sex','f-status'].forEach(id => {
      const el = document.getElementById(id); if (el) el.selectedIndex = 0;
    });
    if (fileInput) fileInput.value = '';
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    const lbl = document.querySelector('.img-upload-label');
    if (lbl) lbl.style.display = '';
  }

  const saveBtn = document.getElementById('save-animal');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name       = document.getElementById('f-name').value.trim();
      const breed      = document.getElementById('f-breed').value.trim();
      const species    = document.getElementById('f-species').value;
      const color      = document.getElementById('f-color').value.trim();
      const sex        = document.getElementById('f-sex').value;
      const age        = document.getElementById('f-age').value.trim();
      const owner_name = document.getElementById('f-owner').value.trim();
      const vax_status = document.getElementById('f-status').value;
      const notes      = document.getElementById('f-notes').value.trim();
      const date       = document.getElementById('f-date').value;

      if (!name || !owner_name || !species) {
        alert('Please fill in Name, Owner, and Species.'); return;
      }

      let image = null;
      const imgFile = document.getElementById('f-image')?.files[0];
      if (imgFile) {
        image = await new Promise(res => {
          const r = new FileReader();
          r.onload = e => res(e.target.result);
          r.readAsDataURL(imgFile);
        });
      }

      const editId = document.getElementById('f-edit-id').value;

      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
        const payload = {
          name, breed, species, color, sex, age,
          owner_name, vax_status, notes,
          registered_at: date || undefined
        };
        if (image) payload.image = image;

        if (editId) {
          await api.put(`/animals/${editId}`, payload);
        } else {
          await api.post('/animals', payload);
        }
        closeModal();
        await loadAnimals();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Animal';
      }
    });
  }

  function renderTable(data) {
    const tbody = document.getElementById('registry-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🐾</div><p>No animals found.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(a => `
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
        <td>
          <button class="btn-sm btn-action" onclick="viewAnimal('${a.id}')">View</button>
          <button class="btn-sm btn-action" onclick="editAnimal('${a.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteAnimal('${a.id}','${a.name}')">Delete</button>
        </td>
      </tr>`).join('');
  }

  const viewOverlay  = document.getElementById('view-modal');
  const viewCloseBtn = document.getElementById('close-view-modal');
  const viewCloseBtn2 = document.getElementById('view-modal-close-btn');
  function closeViewModal() { viewOverlay?.classList.remove('open'); }
  viewCloseBtn?.addEventListener('click', closeViewModal);
  viewCloseBtn2?.addEventListener('click', closeViewModal);
  viewOverlay?.addEventListener('click', e => { if (e.target === viewOverlay) closeViewModal(); });

  window.viewAnimal = async (id) => {
    const body = document.getElementById('view-modal-body');
    body.innerHTML = `<div class="empty-state"><p>Loading…</p></div>`;
    viewOverlay?.classList.add('open');
    try {
      const a = await api.get(`/animals/${id}`);
      const vaxBadge = badgeHtml(a.vax_status);
      body.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
          ${a.image
            ? `<img src="${a.image}" alt="${a.name}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid #e0ede6;"/>`
            : `<div class="pet-avatar-lg">${initials(a.name)}</div>`}
          <div style="font-weight:700; font-size:1.2rem; color:#1a3328; margin-top:10px;">${a.name}</div>
          <div style="font-size:.85rem; color:#6c757d;">${a.breed || a.species}</div>
          <div style="margin-top:6px;">${vaxBadge}</div>
        </div>
        <div class="info-row"><span class="info-label">Species</span><span class="info-value">${a.species || '—'}</span></div>
        <div class="info-row"><span class="info-label">Breed</span><span class="info-value">${a.breed || '—'}</span></div>
        <div class="info-row"><span class="info-label">Color / Markings</span><span class="info-value">${a.color || '—'}</span></div>
        <div class="info-row"><span class="info-label">Sex</span><span class="info-value">${a.sex || '—'}</span></div>
        <div class="info-row"><span class="info-label">Age</span><span class="info-value">${a.age || '—'}</span></div>
        <div class="info-row"><span class="info-label">Owner</span><span class="info-value">${a.owner_name || '—'}</span></div>
        <div class="info-row"><span class="info-label">Registered</span><span class="info-value">${fmtDate(a.registered_at)}</span></div>
        ${a.notes ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${a.notes}</span></div>` : ''}
      `;
    } catch (err) {
      body.innerHTML = `<div class="empty-state"><p>Could not load pet details.</p></div>`;
    }
  };

  window.editAnimal = async (id) => {
    try {
      const a = await api.get(`/animals/${id}`);
      document.getElementById('f-edit-id').value = a.id;
      document.getElementById('f-name').value    = a.name || '';
      document.getElementById('f-breed').value   = a.breed || '';
      document.getElementById('f-species').value = a.species || '';
      document.getElementById('f-color').value   = a.color || '';
      document.getElementById('f-sex').value     = a.sex || '';
      document.getElementById('f-age').value     = a.age || '';
      document.getElementById('f-owner').value   = a.owner_name || '';
      document.getElementById('f-status').value  = a.vax_status || 'Unvaccinated';
      document.getElementById('f-notes').value   = a.notes || '';
      document.getElementById('f-date').value    = a.registered_at ? a.registered_at.substring(0,10) : '';
      if (a.image && preview) {
        preview.src = a.image;
        preview.style.display = 'block';
        const lbl = document.querySelector('.img-upload-label');
        if (lbl) lbl.style.display = 'none';
      }
      modalTitle.textContent = 'Edit Pet';
      overlay?.classList.add('open');
    } catch (err) {
      alert('Could not load pet for editing: ' + err.message);
    }
  };

  window.deleteAnimal = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    try { await api.delete(`/animals/${id}`); await loadAnimals(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  function initials(n) { return n.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(); }
  function badgeHtml(s) {
    const m = { 'Vaccinated':'badge-green','Partial':'badge-yellow','Unvaccinated':'badge-red' };
    return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
  }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
});