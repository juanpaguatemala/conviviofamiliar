// Amigo secreto (regalos de Q25)
// Fase "registro": la gente se inscribe y arma su wish list.
// Fase "sorteo": Ericka activa la tómbola → se asigna a todos de una vez
// (nadie se saca a sí mismo ni a alguien de su familia) y cada quien revela el suyo con su PIN.
import { createHash, randomInt } from 'node:crypto';
import { redis, KEY, readBody } from './_redis.js';

const P = 'convivio-29nov2026:amigo:';
const PK = P + 'participantes', EK = P + 'estado', SK = P + 'sorteo';
const ADMIN = process.env.ADMIN_PIN || 'navidad2026';

const GUSTOS = {
  adulto: ['dulces', 'snacks', 'hogar', 'papeleria', 'libros', 'belleza', 'accesorios', 'decoracion', 'variado'],
  nino: ['carritos', 'munecas', 'peluches', 'armar', 'juegos', 'deportes', 'arte', 'sorpresas'],
};

const hashPin = (id, pin) => createHash('sha256').update(`amigo-convivio-2026|${id}|${pin}`).digest('hex');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

async function hashObj(key) {
  const flat = (await redis('HGETALL', key)) || [];
  const o = {};
  for (let i = 0; i < flat.length; i += 2) o[flat[i]] = flat[i + 1];
  return o;
}
async function participantes() {
  return Object.values(await hashObj(PK)).map(v => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean);
}
async function familias() {
  return Object.values(await hashObj(KEY)).map(v => { try { return JSON.parse(v); } catch { return null; } })
    .filter(f => f && f.asiste)
    .map(f => ({ id: f.id, nombre: f.nombre, apellidos: f.apellidos, adultos: f.adultos, ninos: f.ninos }))
    .sort((a, b) => `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, 'es'));
}
const estadoActual = async () => (await redis('GET', EK)) || 'registro';
const limpio = (p, fams) => {
  const f = fams && fams.find(x => x.id === p.familiaId);
  return { id: p.id, nombre: p.nombre, tipo: p.tipo, gustos: p.gustos || [], deseo: p.deseo || '', pedido: p.pedido || '', pedidoLink: p.pedidoLink || '', familiaId: p.familiaId,
    familia: f ? `Familia ${f.apellidos}` : '' };
};

// Asignación válida aleatoria: cada quien da 1 y recibe 1, nunca a su propia familia.
function asignar(list) {
  if (list.length < 2) return { error: 'Se necesitan al menos 2 participantes' };
  const fam = {};
  list.forEach(p => (fam[p.familiaId] ||= []).push(p));
  if (Object.keys(fam).length < 2) return { error: 'Se necesitan participantes de al menos 2 familias' };
  const max = Math.max(...Object.values(fam).map(a => a.length));
  if (max > list.length - max) return { error: 'Una familia tiene más de la mitad de los participantes; no se puede sortear sin que se regalen entre ellos' };
  for (let intento = 0; intento < 40; intento++) {
    const givers = shuffle(list).sort((a, b) => fam[b.familiaId].length - fam[a.familiaId].length);
    const used = new Set(), res = {}; let pasos = 0;
    const dfs = i => {
      if (i === givers.length) return true;
      if (++pasos > 50000) return false;
      const g = givers[i];
      for (const r of shuffle(list.filter(r => !used.has(r.id) && r.familiaId !== g.familiaId))) {
        used.add(r.id); res[g.id] = r.id;
        if (dfs(i + 1)) return true;
        used.delete(r.id);
      }
      return false;
    };
    if (dfs(0)) return { res };
  }
  return { error: 'No se pudo completar el sorteo, intenta de nuevo' };
}

async function autenticar(id, pin) {
  const lockKey = P + 'intentos:' + id;
  const intentos = parseInt(await redis('GET', lockKey), 10) || 0;
  if (intentos >= 8) return { status: 429, error: 'Demasiados intentos. Espera 10 minutos o pide ayuda a la organización.' };
  const raw = await redis('HGET', PK, String(id || ''));
  const p = raw ? JSON.parse(raw) : null;
  if (!p || p.pinHash !== hashPin(p.id, String(pin || ''))) {
    await redis('INCR', lockKey); await redis('EXPIRE', lockKey, '600');
    return { status: 401, error: 'Nombre o PIN incorrecto' };
  }
  await redis('DEL', lockKey);
  return { p };
}

function limpiarLink(v) {
  const t = String(v || '').trim().slice(0, 400);
  if (!t) return '';
  try { const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : ''; }
  catch { return ''; }
}
function validarGustos(tipo, gustos) {
  return Array.isArray(gustos) ? [...new Set(gustos.filter(g => GUSTOS[tipo].includes(g)))] : [];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const accion = String(req.query.accion || readBody(req).accion || '');
  const esAdmin = (req.headers['x-pin'] || '') === ADMIN;
  try {
    // ---------- Público ----------
    if (req.method === 'GET' && accion !== 'admin') {
      const [fams, parts, estado] = await Promise.all([familias(), participantes(), estadoActual()]);
      return res.status(200).json({
        estado,
        familias: fams.map(f => ({
          id: f.id, nombre: f.nombre, apellidos: f.apellidos, adultos: f.adultos, ninos: f.ninos,
          participantes: parts.filter(p => p.familiaId === f.id)
            .sort((a, b) => a.creado.localeCompare(b.creado))
            .map(p => ({ id: p.id, nombre: p.nombre, tipo: p.tipo })),
        })),
      });
    }

    const b = readBody(req);

    if (req.method === 'POST' && accion === 'registrar') {
      if ((await estadoActual()) !== 'registro') return res.status(403).json({ error: 'La inscripción ya cerró: la tómbola está activa' });
      const fams = await familias();
      const fam = fams.find(f => f.id === b.familiaId);
      const nombre = String(b.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const tipo = b.tipo === 'nino' ? 'nino' : b.tipo === 'adulto' ? 'adulto' : '';
      const pin = String(b.pin || '');
      if (!fam) return res.status(400).json({ error: 'Elige tu familia' });
      if (nombre.length < 2) return res.status(400).json({ error: 'Escribe el nombre' });
      if (!tipo) return res.status(400).json({ error: 'Indica si es adulto o niño' });
      if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'El PIN debe tener 4 números' });
      const parts = await participantes();
      if (parts.some(p => p.familiaId === fam.id && p.nombre.toLowerCase() === nombre.toLowerCase()))
        return res.status(409).json({ error: `${nombre} ya está inscrito en la Familia ${fam.apellidos}` });
      const id = Date.now().toString(36) + randomInt(1e6).toString(36);
      const p = { id, familiaId: fam.id, nombre, tipo, gustos: validarGustos(tipo, b.gustos),
        deseo: String(b.deseo || '').trim().slice(0, 140), pedido: String(b.pedido || '').trim().slice(0, 240), pedidoLink: limpiarLink(b.pedidoLink),
        pinHash: hashPin(id, pin), creado: new Date().toISOString(), revelado: null };
      await redis('HSET', PK, id, JSON.stringify(p));
      return res.status(200).json({ ok: true, participante: limpio(p, fams) });
    }

    if (req.method === 'POST' && ['perfil', 'actualizar', 'revelar'].includes(accion)) {
      const a = await autenticar(b.id, b.pin);
      if (a.error) return res.status(a.status).json({ error: a.error });
      const p = a.p;
      const estado = await estadoActual();
      const fams = await familias();

      if (accion === 'actualizar') {
        p.gustos = validarGustos(p.tipo, b.gustos);
        p.deseo = String(b.deseo || '').trim().slice(0, 140);
        p.pedido = String(b.pedido || '').trim().slice(0, 240);
        p.pedidoLink = limpiarLink(b.pedidoLink);
        await redis('HSET', PK, p.id, JSON.stringify(p));
      }
      if (accion === 'revelar') {
        if (estado !== 'sorteo') return res.status(403).json({ error: 'La tómbola todavía no está activa' });
        const rid = await redis('HGET', SK, p.id);
        const rraw = rid ? await redis('HGET', PK, rid) : null;
        if (!rraw) return res.status(409).json({ error: 'No encontramos tu asignación. Avisa a la organización.' });
        if (!p.revelado) { p.revelado = new Date().toISOString(); await redis('HSET', PK, p.id, JSON.stringify(p)); }
        return res.status(200).json({ ok: true, amigo: limpio(JSON.parse(rraw), fams) });
      }
      return res.status(200).json({ ok: true, estado, yo: { ...limpio(p, fams), revelado: !!p.revelado } });
    }

    // ---------- Administración (Ericka) ----------
    if (!esAdmin) return res.status(401).json({ error: 'PIN de administración incorrecto' });

    if (req.method === 'GET' && accion === 'admin') {
      const [fams, parts, estado] = await Promise.all([familias(), participantes(), estadoActual()]);
      return res.status(200).json({ estado, participantes: parts.map(p => ({ ...limpio(p, fams), revelado: p.revelado, creado: p.creado })) });
    }
    if (req.method === 'POST' && accion === 'sortear') {
      const r = asignar(await participantes());
      if (r.error) return res.status(400).json({ error: r.error });
      await redis('DEL', SK);
      await redis('HSET', SK, ...Object.entries(r.res).flat());
      const parts = await participantes();
      for (const p of parts) { if (p.revelado) { p.revelado = null; await redis('HSET', PK, p.id, JSON.stringify(p)); } }
      await redis('SET', EK, 'sorteo');
      return res.status(200).json({ ok: true, total: parts.length });
    }
    if (req.method === 'POST' && accion === 'reabrir') {
      await redis('DEL', SK);
      const parts = await participantes();
      for (const p of parts) { if (p.revelado) { p.revelado = null; await redis('HSET', PK, p.id, JSON.stringify(p)); } }
      await redis('SET', EK, 'registro');
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'POST' && accion === 'eliminar') {
      if ((await estadoActual()) !== 'registro') return res.status(409).json({ error: 'Primero reabre la inscripción (el sorteo se borrará)' });
      await redis('HDEL', PK, String(b.id || ''));
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'POST' && accion === 'resetpin') {
      const raw = await redis('HGET', PK, String(b.id || ''));
      if (!raw) return res.status(404).json({ error: 'No existe' });
      const p = JSON.parse(raw);
      const pin = String(randomInt(10000)).padStart(4, '0');
      p.pinHash = hashPin(p.id, pin);
      await redis('HSET', PK, p.id, JSON.stringify(p));
      await redis('DEL', P + 'intentos:' + p.id);
      return res.status(200).json({ ok: true, pin });
    }
    return res.status(400).json({ error: 'Acción no válida' });
  } catch (e) {
    return res.status(500).json({ error: 'Algo falló, intenta de nuevo' });
  }
}
