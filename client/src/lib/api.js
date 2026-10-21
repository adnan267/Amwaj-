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

/** Shrink a photo in the browser to max 1920px WebP before uploading (keeps pages fast). */
async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

let uploadConfig = null;

async function uploadFiles(files) {
  uploadConfig = uploadConfig || (await request('GET', '/uploads/config'));
  const list = [...files];
  const tooBig = list.find((f) => f.size > uploadConfig.maxMb * 1024 * 1024);
  if (tooBig) throw new Error(`${tooBig.name} is larger than ${uploadConfig.maxMb} MB.`);

  if (uploadConfig.storage === 'blob') {
    const { upload } = await import('@vercel/blob/client');
    const out = [];
    for (const original of list) {
      const file = await compressImage(original);
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const blob = await upload(`uploads/${safe}`, file, { access: 'public', handleUploadUrl: '/api/uploads/blob', multipart: file.size > 8 * 1024 * 1024 });
      out.push({ url: blob.url, type: file.type.startsWith('video/') ? 'video' : 'image', name: original.name });
    }
    return out;
  }
  const fd = new FormData();
  list.forEach((f) => fd.append('files', f));
  return request('POST', '/uploads', fd);
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b),
  put: (u, b) => request('PUT', u, b),
  patch: (u, b) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
  upload: uploadFiles,
};

export const waLink = (number, text) => `https://wa.me/${String(number || '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
