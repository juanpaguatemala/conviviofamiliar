// Conexión a Upstash Redis (vía REST, sin dependencias).
// Vercel crea estas variables solas al conectar Upstash desde Storage / Marketplace.
// Acepta nombres con prefijo personalizado (p. ej. STORAGE_KV_REST_API_URL).
const envEnding = (...ends) => {
  for (const end of ends) {
    if (process.env[end]) return process.env[end];
    const k = Object.keys(process.env).find(n => n.endsWith('_' + end) && !n.includes('READ_ONLY'));
    if (k && process.env[k]) return process.env[k];
  }
  return '';
};
const DB_URL = envEnding('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL');
const DB_TOKEN = envEnding('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_TOKEN');

export const KEY = 'convivio-29nov2026:respuestas';

export async function redis(...cmd) {
  if (!DB_URL || !DB_TOKEN) throw new Error('NO_DB');
  const r = await fetch(DB_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export function slug(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body;
}
