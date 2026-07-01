document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reset-form');

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('reset-email').value.trim();
    const newPass  = document.getElementById('reset-new-password').value;
    const confirm  = document.getElementById('reset-confirm-password').value;

    if (!email || !newPass || !confirm) return showError('Please fill in all fields.');
    if (newPass.length < 6) return showError('Password must be at least 6 characters.');
    if (newPass !== confirm) return showError('Passwords do not match.');

    try {
      const res  = await fetch('https://brgy-pet-production.up.railway.app/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPass })
      });
      const data = await res.json();
      if (data.error) return showError(data.error);
      document.getElementById('reset-form').style.display = 'none';
      document.getElementById('reset-success').style.display = 'block';
    } catch(err) {
      showError('Cannot connect to server. Try again.');
    }
  });

  function showError(msg) {
    let err = document.getElementById('reset-error');
    if (!err) {
      err = document.createElement('p');
      err.id = 'reset-error';
      err.style.cssText = 'color:#9b1c1c;background:#fde8e8;border-radius:7px;padding:9px 14px;font-size:.83rem;margin-bottom:14px;';
    }
    err.textContent = msg;
    form.prepend(err);
  }
});
