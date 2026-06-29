/* ═══════════════════════════════════════
   BRGY-PET · auth.js  (API-connected)
════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Tab switching ── */
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const formViews = document.querySelectorAll('.auth-form-view');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      formViews.forEach(v => v.classList.toggle('active', v.id === target + '-form'));
    });
  });

  /* ── Sign-In ── */
  const signinForm = document.getElementById('signin-form-el');
  if (signinForm) {
    signinForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      if (!email || !password) return showError('Please fill in all fields.');
      try {
        const data = await fetch('https://brgy-pet-production.up.railway.app/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }).then(r => r.json());

        if (data.error) return showError(data.error);

        sessionStorage.setItem('brgy_token',      data.token);
        sessionStorage.setItem('brgy_user_name',  data.user.name);
        sessionStorage.setItem('brgy_user_email', data.user.email);
        sessionStorage.setItem('brgy_barangay',   data.user.barangay);
        window.location.href = 'dashboard.html';
      } catch { showError('Cannot connect to server. Make sure npm start is running.'); }
    });
  }

  /* ── Sign-Up ── */
  const signupForm = document.getElementById('signup-form-el');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const barangay = document.getElementById('reg-brgy').value.trim();
      if (!name || !email || !password || !barangay) return showError('Please fill in all fields.');
      try {
        const data = await fetch('https://brgy-pet-production.up.railway.app/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, barangay }),
        }).then(r => r.json());

        if (data.error) return showError(data.error);

        sessionStorage.setItem('brgy_token',      data.token);
        sessionStorage.setItem('brgy_user_name',  data.user.name);
        sessionStorage.setItem('brgy_user_email', data.user.email);
        sessionStorage.setItem('brgy_barangay',   data.user.barangay);
        window.location.href = 'dashboard.html';
      } catch { showError('Cannot connect to server.'); }
    });
  }

  function showError(msg) {
    let err = document.getElementById('auth-error');
    if (!err) {
      err = document.createElement('p');
      err.id = 'auth-error';
      err.style.cssText = 'color:#9b1c1c;background:#fde8e8;border-radius:7px;padding:9px 14px;font-size:.83rem;margin-bottom:14px;';
      err.className = 'auth-error-msg';
    }
    err.textContent = msg;
    const active = document.querySelector('.auth-form-view.active');
    if (active) active.prepend(err);
  }
});