// Resultados públicos de solo lectura: totales y familias que asisten.
import { redis, KEY } from './_redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  try {
    const flat = (await redis('HGETALL', KEY)) || [];
    const items = [];
    for (let i = 0; i < flat.length; i += 2) {
      try { items.push(JSON.parse(flat[i + 1])); } catch {}
    }
    const si = items.filter(i => i.asiste);
    const familias = si
      .map(i => ({ nombre: i.nombre, apellidos: i.apellidos, adultos: i.adultos, ninos: i.ninos }))
      .sort((a, b) => `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, 'es'));
    const adultos = si.reduce((s, i) => s + i.adultos, 0);
    const ninos = si.reduce((s, i) => s + i.ninos, 0);
    return res.status(200).json({
      familias,
      totales: { familias: si.length, adultos, ninos, personas: adultos + ninos, noAsisten: items.length - si.length },
    });
  } catch (e) {
    return res.status(500).json({ error: 'No se pudieron cargar los resultados' });
  }
}
