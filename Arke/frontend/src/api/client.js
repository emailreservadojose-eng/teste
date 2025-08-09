// frontend/src/api/client.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let accessToken = '';

export function setAccessToken(token) {
  accessToken = token;
}

function headers() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers()
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro');
  return data;
}

export const apiLogin = (username, password) =>
  request('POST', '/auth/login', { username, password });

export const apiRegister = (username, password) =>
  request('POST', '/auth/register', { username, password });

export const apiRefresh = (refreshToken) =>
  request('POST', '/auth/refresh', { refreshToken });

export const apiLogout = (refreshToken) =>
  request('POST', '/auth/logout', { refreshToken });

export const apiGetPlayer = () => request('GET', '/player/me');

export const apiPatchState = (state) => request('PATCH', '/player/state', state);

export const apiGetDefinitions = () => request('GET', '/game/definitions');

export const apiGetChunk = (x, y) => request('GET', `/world/chunk?x=${x}&y=${y}`);

export const apiCraft = (data) => request('POST', '/craft/perform', data);

export const apiAttack = (data) => request('POST', '/combat/attack', data);

export const apiInventoryMove = (data) => request('POST', '/inventory/move', data);

export const apiInventorySplit = (data) => request('POST', '/inventory/split', data);

export const apiInventoryDrop = (data) => request('POST', '/inventory/drop', data);
