const API_URL = 'http://localhost:4000';

function jwtDecode(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return null;
  }
}

function getAuthHeaders() {
  const access = localStorage.getItem('access');
  return access ? { Authorization: `Bearer ${access}` } : {};
}

let _refreshTimeout = null;
let _ws = null;

async function refreshTokenFlow() {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });

    if (!res.ok) {
      // failed to refresh: clear tokens
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      if (_refreshTimeout) { clearTimeout(_refreshTimeout); _refreshTimeout = null; }
      return null;
    }

    const data = await res.json();
    if (data.access) {
      localStorage.setItem('access', data.access);
      if (data.refresh) localStorage.setItem('refresh', data.refresh);
      scheduleTokenRefresh();
      return data.access;
    }
    return null;
  } catch (e) {
    console.error('refreshTokenFlow error', e);
    return null;
  }
}

export function scheduleTokenRefresh() {
  if (_refreshTimeout) { clearTimeout(_refreshTimeout); _refreshTimeout = null; }
  const access = localStorage.getItem('access');
  if (!access) return;
  const decoded = jwtDecode(access);
  if (!decoded || !decoded.exp) return;
  const expMs = decoded.exp * 1000;
  const now = Date.now();
  const msUntil = expMs - now - 30000; // refresh 30s before expiry
  const delay = msUntil > 0 ? msUntil : 0;
  _refreshTimeout = setTimeout(async () => {
    await refreshTokenFlow();
  }, delay);
}

export async function apiFetch(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders(), opts.headers || {});
  const res = await fetch(`${API_URL}${path}`, Object.assign({}, opts, { headers }));

  if (res.status === 401) {
    // Try refreshing once
    const newAccess = await refreshTokenFlow();
    if (newAccess) {
      const retryHeaders = Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders(), opts.headers || {});
      const retry = await fetch(`${API_URL}${path}`, Object.assign({}, opts, { headers: retryHeaders }));
      const text = await retry.text();
      try { return JSON.parse(text); } catch (e) { return text; }
    }
  }

  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

export async function register(username, password, email) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email })
  });
  const data = await res.json();
  if (data.access) {
    localStorage.setItem('access', data.access);
    if (data.refresh) localStorage.setItem('refresh', data.refresh);
    scheduleTokenRefresh();
  }
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.access) {
    localStorage.setItem('access', data.access);
    if (data.refresh) localStorage.setItem('refresh', data.refresh);
    scheduleTokenRefresh();
  }
  return data;
}

export async function refreshToken(refresh) {
  // direct call if needed
  return fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  }).then((r) => r.json());
}

export async function logout(refresh) {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  if (_refreshTimeout) { clearTimeout(_refreshTimeout); _refreshTimeout = null; }
  if (_ws) { try { _ws.close(); } catch (e) {} _ws = null; }
}

export function getUserFromStorage() {
  const access = localStorage.getItem('access');
  if (!access) return null;
  return jwtDecode(access);
}

export async function getProblems(difficulty) {
  return apiFetch(`/api/problems${difficulty && difficulty !== 'All' ? `?difficulty=${difficulty}` : ''}`);
}

export async function submitSolution({ problemId, language, code }) {
  const user = getUserFromStorage();
  const body = { problemId, language, code };
  if (user && user.id) body.userId = user.id;
  return apiFetch('/api/submit', { method: 'POST', body: JSON.stringify(body) });
}

export async function getLeaderboard(limit = 50) {
  return apiFetch(`/api/leaderboard?limit=${limit}`);
}

export async function getProfile() {
  return apiFetch('/api/me');
}

export async function getSubmissions(userId) {
  return apiFetch(`/api/submissions?userId=${userId}`);
}

export function connectLeaderboardWS(onMessage) {
  if (_ws) {
    try { _ws.close(); } catch (e) {}
    _ws = null;
  }
  const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':4000';
  try {
    _ws = new WebSocket(url);
    _ws.onopen = () => console.debug('[ws] connected to leaderboard');
    _ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (onMessage) onMessage(msg);
      } catch (e) {
        console.error('ws parse error', e);
      }
    };
    _ws.onclose = () => console.debug('[ws] closed');
    _ws.onerror = (e) => console.error('[ws] error', e);
  } catch (e) {
    console.error('connectLeaderboardWS failed', e);
  }
  return _ws;
}

export default {
  register,
  login,
  refreshToken,
  logout,
  getUserFromStorage,
  scheduleTokenRefresh,
  getProblems,
  submitSolution,
  getLeaderboard,
  getProfile,
  getSubmissions,
  connectLeaderboardWS
};
