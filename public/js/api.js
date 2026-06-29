/* ═══════════════════════════════════════
   BRGY-PET · api.js
   Central API helper — all fetch calls go
   through here. Included on every page.
════════════════════════════════════════ */

const API = 'https://brgy-pet-production.up.railway.app/api';

function getToken() {
  return sessionStorage.getItem('brgy_token');
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Shortcuts
const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: 'POST',   body }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',    body }),
  patch:  (path, body)   => apiFetch(path, { method: 'PATCH',  body }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
};
