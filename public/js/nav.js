document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('brgy_theme');
  document.body.classList.remove('dark');

  /* ── Redirect if not logged in ── */
  const token = sessionStorage.getItem('brgy_token');
  if (!token && !window.location.pathname.endsWith('index.html')) {
    window.location.href = 'index.html';
  }

  /* ── Populate sidebar ── */
  const name  = sessionStorage.getItem('brgy_user_name')  || 'Admin';
  const email = sessionStorage.getItem('brgy_user_email') || '';
  const brgy  = sessionStorage.getItem('brgy_barangay')   || 'Barangay';

  const nameEl   = document.getElementById('sidebar-user-name');
  const emailEl  = document.getElementById('sidebar-user-email');
  const avatarEl = document.getElementById('sidebar-avatar');
  const brgyEl   = document.getElementById('sidebar-brgy');

  if (nameEl)   nameEl.textContent   = name;
  if (emailEl)  emailEl.textContent  = email;
  if (brgyEl)   brgyEl.textContent   = brgy;
  if (avatarEl) avatarEl.textContent = name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();

  /* ── Active nav link ── */
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  /* ── Logout — event delegation so it still works after icons.js
         replaces the button's inner HTML ── */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#logout-btn')) {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }
  });

});