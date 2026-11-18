// Muro de buenos deseos navideños.
// GET: lista pública · POST: publicar un deseo · DELETE ?id= (solo con PIN de administración)
import { redis, readBody } from './_redis.js';

const KEY = 'convivio-29nov2026:deseos';
const PIN = process.env.ADMIN_PIN || 'navidad2026';
const MAX = 500;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const raw = (await redis('LRANGE', KEY, '0', '199')) || [];
      const deseos = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ deseos });
    }

    if (req.method === 'POST') {
      const b = readBody(req);
      if (b.web) return res.status(200).json({ ok: true }); // trampa anti-spam
      const nombre = String(b.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const mensaje = String(b.mensaje || '').replace(/[ \t]+/g, ' ').trim().slice(0, 280);
      const icono = ['🎄', '⭐', '🎁', '❄️', '🔔', '🕯️', '❤️', '🙏'].includes(b.icono) ? b.icono : '🎄';
      if (!nombre || mensaje.length < 3) return res.status(400).json({ error: 'Escribe tu nombre y tu deseo' });
      const deseo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        nombre, mensaje, icono, fecha: new Date().toISOString(),
      };
      await redis('LPUSH', KEY, JSON.stringify(deseo));
      await redis('LTRIM', KEY, '0', String(MAX - 1));
      return res.status(200).json({ ok: true, deseo });
    }

    if (req.method === 'DELETE') {
      if ((req.headers['x-pin'] || '') !== PIN) return res.status(401).json({ error: 'PIN incorrecto' });
      const id = String(req.query.id || '');
      const raw = (await redis('LRANGE', KEY, '0', '-1')) || [];
      const hit = raw.find(r => { try { return JSON.parse(r).id === id; } catch { return false; } });
      if (hit) await redis('LREM', KEY, '1', hit);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: 'No se pudo completar, intenta de nuevo' });
  }
}
