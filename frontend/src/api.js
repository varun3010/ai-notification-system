const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  list: () => request('/api/notifications'),
  create: (payload) =>
    request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  markRead: (id, read = true) =>
    request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ read })
    }),
  markAllRead: () =>
    request('/api/notifications/mark-all-read', { method: 'POST' })
};

export { API_URL };
