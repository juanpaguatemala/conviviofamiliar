// Conexión a Redis. Funciona con:
//  - Upstash (variables REST: ...KV_REST_API_URL / ...KV_REST_API_TOKEN)
//  - Redis del Marketplace de Vercel u otro (variable ...REDIS_URL o ...KV_URL, tipo redis://)
// Acepta nombres con prefijo personalizado (p. ej. STORAGE_REDIS_URL).
import { createClient } from 'redis';

const findEnv = (...ends) => {
  for (const end of ends) {
    if (process.env[end]) return { name: end, value: process.env[end] };
    const k = Object.keys(process.env).find(n => n.endsWith('_' + end) && !n.includes('READ_ONLY') && process.env[n]);
    if (k) return { name: k, value: process.env[k] };
  }
  return null;
};

const REST_URL = findEnv('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL');
const REST_TOKEN = findEnv('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_TOKEN');
const TCP_URL = findEnv('REDIS_URL', 'KV_URL', 'REDIS_URI', 'REDIS_TLS_URL');

export const MODE = REST_URL && REST_TOKEN ? 'rest' : TCP_URL ? 'tcp' : 'none';
export const ENV_USED = MODE === 'rest' ? [REST_URL.name, REST_TOKEN.name] : MODE === 'tcp' ? [TCP_URL.name] : [];

export const KEY = 'convivio-29nov2026:respuestas';

let clientPromise = null;
function tcpClient() {
  if (!clientPromise) {
    const c = createClient({ url: TCP_URL.value, socket: { connectTimeout: 8000 } });
    c.on('error', () => {});
    clientPromise = c.connect().then(() => c).catch(e => { clientPromise = null; throw e; });
  }
  return clientPromise;
}

export async function redis(...cmd) {
  if (MODE === 'none') throw new Error('NO_DB');
  if (MODE === 'rest') {
    const r = await fetch(REST_URL.value, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REST_TOKEN.value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j.result;
  }
  const c = await tcpClient();
  const res = await c.sendCommand(cmd.map(String));
  return res;
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
