import { getStore } from '@netlify/blobs';

const STORE_NAME = 'halo-shared-presets';
const KEY = 'presets-v1';
const MAX_PRESETS = 100;
const MAX_BODY_BYTES = 8192;
const allowedTones = new Set(['red', 'orange', 'pink', 'blue', 'gold']);
const ranges = {
  threshold: [5, 98],
  selectSoft: [1, 45],
  feather: [0, 100],
  spread: [1, 100],
  amount: [0, 100],
};

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
    body: JSON.stringify(payload),
  };
}

function cleanPreset(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out = {};
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const n = Number(value[key]);
    if (!Number.isFinite(n)) return null;
    out[key] = String(Math.min(max, Math.max(min, Math.round(n))));
  }
  out.tone = allowedTones.has(value.tone) ? value.tone : 'pink';
  out.glowMode = value.glowMode === 'tint' ? 'tint' : 'adaptive';
  out.customColor = /^#[0-9a-f]{6}$/i.test(value.customColor || '') ? value.customColor.toUpperCase() : null;
  return out;
}

export default async (request) => {
  if (request.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'cache-control': 'no-store' }, body: '' };
  }
  if (!['GET', 'POST'].includes(request.httpMethod)) {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const store = getStore(STORE_NAME);
    const current = (await store.get(KEY, { type: 'json' })) || {};

    if (request.httpMethod === 'GET') {
      return response(200, { presets: current });
    }

    const raw = request.body || '';
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return response(413, { error: 'Request too large' });
    }
    let body;
    try { body = JSON.parse(raw); } catch { return response(400, { error: 'Invalid JSON' }); }
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : '';
    const preset = cleanPreset(body.preset);
    if (!name || !preset) return response(400, { error: 'A name and valid preset settings are required' });
    if (!Object.prototype.hasOwnProperty.call(current, name) && Object.keys(current).length >= MAX_PRESETS) {
      return response(409, { error: `Shared preset limit reached (${MAX_PRESETS})` });
    }

    current[name] = preset;
    await store.setJSON(KEY, current);
    return response(200, { ok: true, name });
  } catch (error) {
    console.error('HALO presets function error:', error);
    return response(503, { error: 'Shared presets are temporarily unavailable' });
  }
};
