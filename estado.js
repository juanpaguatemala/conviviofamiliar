// Diagnóstico: /api/estado — muestra SOLO nombres de variables (nunca valores).
import { redis, MODE, ENV_USED } from './_redis.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const candidatas = Object.keys(process.env)
    .filter(n => /REDIS|KV_|UPSTASH|ADMIN_PIN/i.test(n)).sort();
  let prueba = 'sin probar';
  if (MODE !== 'none') {
    try { const r = await redis('PING'); prueba = `OK (${r})`; }
    catch (e) { prueba = 'ERROR: ' + String(e.message).slice(0, 160); }
  }
  res.status(200).json({ modo: MODE, variables_usadas: ENV_USED, variables_encontradas: candidatas, conexion: prueba });
}
