document.addEventListener('DOMContentLoaded', async () => {

  let animals = [];
  let selectedAnimal = null;

  async function loadAnimals() {
    try {
      animals = await api.get('/animals');
      const sel = document.getElementById('qr-animal-select');
      if (!sel) return;
      if (animals.length === 0) {
        sel.innerHTML = '<option value="">No animals registered yet</option>';
        return;
      }
      sel.innerHTML = '<option value="">— Select a pet —</option>' +
        animals.map(a => `<option value="${a.id}">${a.name} · ${a.species} · ${a.owner_name}</option>`).join('');
    } catch (err) { console.error(err); }
  }

  await loadAnimals();

  document.getElementById('generate-qr-btn')?.addEventListener('click', () => {
    const sel = document.getElementById('qr-animal-select');
    const id  = sel?.value;
    if (!id) { alert('Please select an animal first.'); return; }

    selectedAnimal = animals.find(a => String(a.id) === String(id));
    if (!selectedAnimal) return;

    const profileURL = `${window.location.origin}/pet-profile.html?id=${selectedAnimal.id}`;

    const box = document.getElementById('qr-code-box');
    box.innerHTML = '';

    new QRCode(box, {
      text:         profileURL,
      width:        180,
      height:       180,
      colorDark:    '#1a1a1a',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });

    document.getElementById('qi-name').textContent    = selectedAnimal.name       || '—';
    document.getElementById('qi-breed').textContent   = selectedAnimal.breed      || '—';
    document.getElementById('qi-species').textContent = selectedAnimal.species     || '—';
    document.getElementById('qi-color').textContent   = selectedAnimal.color       || '—';
    document.getElementById('qi-sex').textContent     = selectedAnimal.sex         || '—';
    document.getElementById('qi-owner').textContent   = selectedAnimal.owner_name  || '—';
    document.getElementById('qi-vax').textContent     = selectedAnimal.vax_status  || '—';

    const photoWrap = document.getElementById('pet-photo-wrap');
    const photoImg  = document.getElementById('qr-pet-photo');
    if (selectedAnimal.image) {
      photoImg.src            = selectedAnimal.image;
      photoWrap.style.display = 'block';
    } else {
      photoWrap.style.display = 'none';
    }

    document.getElementById('qr-result').style.display = 'block';
    document.getElementById('qr-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('print-qr-btn')?.addEventListener('click', () => {
    if (!selectedAnimal) return;

    const qrCanvas = document.querySelector('#qr-code-box canvas');
    const qrSrc    = qrCanvas ? qrCanvas.toDataURL() : '';
    const photoSrc = selectedAnimal.image || '';

    document.getElementById('print-tag').innerHTML = `
      <div style="font-family:'DM Sans',sans-serif;width:280px;padding:20px;border:2px solid #222;border-radius:12px;text-align:center;margin:40px auto;">
        ${photoSrc ? `<img src="${photoSrc}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;margin-bottom:10px;border:1.5px solid #ddd;"/>` : ''}
        <div style="font-size:1.1rem;font-weight:700;margin-bottom:2px;">${selectedAnimal.name}</div>
        <div style="font-size:.8rem;color:#555;margin-bottom:2px;">${selectedAnimal.breed || ''} · ${selectedAnimal.species}</div>
        <div style="font-size:.78rem;color:#555;margin-bottom:10px;">Owner: <strong>${selectedAnimal.owner_name}</strong></div>
        ${qrSrc ? `<img src="${qrSrc}" style="width:150px;height:150px;"/>` : ''}
        <div style="font-size:.7rem;color:#777;margin-top:8px;">Scan to view full profile</div>
        <div style="font-size:.68rem;color:#aaa;margin-top:4px;">BRGY-PET · Barangay Animal Registry</div>
      </div>
    `;

    document.getElementById('print-area').style.display = 'block';
    window.print();
    document.getElementById('print-area').style.display = 'none';
  });
});