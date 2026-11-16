import { redis, KEY, slug, readBody } from './_redis.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || 0));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const b = readBody(req);
    const nombre = String(b.nombre || '').trim().slice(0, 60);
    const apellidos = String(b.apellidos || '').trim().slice(0, 80);
    const asiste = b.asiste === true || b.asiste === 'si';
    if (!nombre || !apellidos) return res.status(400).json({ error: 'Escribe nombre y apellidos' });

    const adultos = asiste ? clamp(b.adultos, 1, 30) : 0;
    const ninos = asiste ? clamp(b.ninos, 0, 30) : 0;

    // Misma familia (mismo nombre + apellidos) = se actualiza su respuesta, no se duplica
    const id = slug(`${nombre} ${apellidos}`);
    const prevRaw = await redis('HGET', KEY, id);
    const prev = prevRaw ? JSON.parse(prevRaw) : null;
    const now = new Date().toISOString();

    const entry = {
      id, nombre, apellidos, asiste, adultos, ninos,
      creado: prev ? prev.creado : now,
      actualizado: now,
      cambios: prev ? (prev.cambios || 0) + 1 : 0,
    };
    await redis('HSET', KEY, id, JSON.stringify(entry));
    return res.status(200).json({ ok: true, actualizado: !!prev });
  } catch (e) {
    const msg = e.message === 'NO_DB' ? 'La base de datos no está conectada todavía' : 'No se pudo guardar, intenta de nuevo';
    return res.status(500).json({ error: msg });
  }
}
