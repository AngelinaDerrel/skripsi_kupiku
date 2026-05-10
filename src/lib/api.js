const BASE = import.meta.env.VITE_API_URL || '/api';

function buildUrl(path) {
  if (!path) return BASE;
  return BASE + (path.startsWith('/') ? path : `/${path}`);
}

async function request(path, { method = 'GET', body = null, headers = {}, credentials = 'omit' } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers }, credentials };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(buildUrl(path), opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (err) { data = text; }

  if (!res.ok) {
    const msg = (data && data.message) || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default {
  get: (path, opts = {}) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts = {}) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts = {}) => request(path, { ...opts, method: 'DELETE' }),
  rawBase: BASE,
};
