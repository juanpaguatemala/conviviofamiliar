import { redis, KEY } from './_redis.js';

const PIN = process.env.ADMIN_PIN || 'navidad2026';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if ((req.headers['x-pin'] || '') !== PIN) return res.status(401).json({ error: 'PIN incorrecto' });

  try {
    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!id) return res.status(400).json({ error: 'Falta id' });
      await redis('HDEL', KEY, id);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const flat = (await redis('HGETALL', KEY)) || [];
    const items = [];
    for (let i = 0; i < flat.length; i += 2) {
      try { items.push(JSON.parse(flat[i + 1])); } catch {}
    }
    items.sort((a, b) => (b.actualizado || '').localeCompare(a.actualizado || ''));
    return res.status(200).json({ items });
  } catch (e) {
    const msg = e.message === 'NO_DB' ? 'La base de datos no está conectada todavía' : 'Error al leer resultados';
    return res.status(500).json({ error: msg });
  }
}
