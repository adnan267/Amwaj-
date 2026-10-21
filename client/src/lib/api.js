async function request(method, url, body, opts = {}) {
  const init = { method, credentials: 'include', headers: {} };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${url}`, init);
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  if (opts.raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b),
  put: (u, b) => request('PUT', u, b),
  patch: (u, b) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
  upload: (files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('files', f));
    return request('POST', '/uploads', fd);
  },
};

export const waLink = (number, text) => `https://wa.me/${String(number || '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
