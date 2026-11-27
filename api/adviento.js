// Adviento en familia: 4 domingos, 4 hogares.
// GET            → resumen público (quién se ofrece a recibir cada domingo y cuántos asistirán)
// POST responder → una respuesta por familia (se puede actualizar)
// POST enviarcorreo (x-pin del panel) → envía la invitación a todos; con { prueba: "correo" } solo a ese correo
import { redis, KEY, readBody } from './_redis.js';
import { enviarCorreos, correoConfigurado, SITIO } from './_correo.js';

const P = 'convivio-29nov2026:';
const RK = P + 'adviento:respuestas';
const ADMIN = process.env.ADMIN_PIN || 'navidad2026';
export const DOMINGOS = [
  { id: '2026-11-29', fecha: 'Domingo 29 de noviembre', vela: 'Esperanza', color: '#6b2d8c', nota: 'Primer Domingo · por la tarde, después del convivio' },
  { id: '2026-12-06', fecha: 'Domingo 6 de diciembre', vela: 'Paz', color: '#6b2d8c', nota: 'Segundo Domingo' },
  { id: '2026-12-13', fecha: 'Domingo 13 de diciembre', vela: 'Alegría', color: '#d6588f', nota: 'Tercer Domingo · Gaudete' },
  { id: '2026-12-20', fecha: 'Domingo 20 de diciembre', vela: 'Amor', color: '#6b2d8c', nota: 'Cuarto Domingo' },
];
const IDS = DOMINGOS.map(d => d.id);

async function familias() {
  const flat = (await redis('HGETALL', KEY)) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) { try { const f = JSON.parse(flat[i + 1]); if (f.asiste) out.push({ id: f.id, apellidos: f.apellidos, nombre: f.nombre }); } catch {} }
  return out.sort((a, b) => a.apellidos.localeCompare(b.apellidos, 'es'));
}
async function respuestas() {
  const flat = (await redis('HGETALL', RK)) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i + 1])); } catch {} }
  return out;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unir = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
const btn = (href, txt, bg) => `<a href="${esc(href)}" style="display:inline-block;margin:4px;padding:12px 20px;border-radius:12px;background:${bg};color:#fff;text-decoration:none;font-weight:800;font-size:15px;font-family:Arial,Helvetica,sans-serif">${txt}</a>`;

function correoHTML(nombres) {
  const velas = DOMINGOS.map(d => `<td align="center" style="padding:4px;font-family:Arial,Helvetica,sans-serif">
      <div style="width:22px;height:56px;margin:0 auto;border-radius:6px;background:${d.color}"></div>
      <div style="font-size:12px;font-weight:900;color:#2b1d14;margin-top:6px">${esc(d.vela)}</div>
      <div style="font-size:11px;color:#7a6656;font-weight:700">${esc(d.fecha.replace('Domingo ', ''))}</div></td>`).join('');
  return `<!DOCTYPE html><html><body style="margin:0;background:#0b2418;font-family:Georgia,'Times New Roman',serif;color:#2b1d14">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b2418;padding:20px 10px"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff8ef;border-radius:20px;overflow:hidden">
    <tr><td style="background:#4a1f66;color:#fff;text-align:center;padding:24px 16px;font-family:Arial,Helvetica,sans-serif">
      <div style="font-size:40px">🕯️</div>
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.9">Este domingo comienza el</div>
      <div style="font-size:34px;font-weight:900;line-height:1.1">Adviento</div>
      <div style="font-size:15px;font-weight:700;margin-top:4px">4 domingos · 4 hogares · una familia</div></td></tr>
    <tr><td style="padding:24px 22px">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;margin:0 0 14px">Hola ${esc(unir(nombres))} 👋</p>
      <p style="font-size:16px;line-height:1.65;margin:0 0 14px">El <b>Adviento</b> son las cuatro semanas en que preparamos el corazón para recibir a Jesús en Navidad. Cada domingo se enciende una vela de la corona: <b>esperanza, paz, alegría y amor</b>, hasta que llega la Luz al pesebre.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px"><tr>${velas}</tr></table>
      <p style="font-size:16px;line-height:1.65;margin:0 0 14px">Queremos que la convivencia de este domingo no termine ahí. Les proponemos <b>unirnos los cuatro domingos de Adviento en cuatro hogares distintos</b>: una familia recibe, encendemos juntos la vela de la semana, rezamos un momento y compartimos un rato en familia.</p>
      <div style="margin:18px 0;padding:16px;border:2px dashed #d6b8e8;border-radius:14px;text-align:center;background:#fbf5ff">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:900;margin-bottom:4px">🏠 ¿Tu hogar puede recibirnos un domingo?</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7a6656;font-weight:700;margin-bottom:10px">Responde la encuesta, toma menos de un minuto</div>
        ${btn(SITIO + '/adviento', '🕯️ Responder la encuesta', '#6b2d8c')}
      </div>
      <p style="font-size:15px;line-height:1.6;margin:0;text-align:center;font-style:italic">«Preparen el camino del Señor» — Lucas 3, 4</p>
      <div style="text-align:center;margin-top:16px">${btn('https://www.biencatolicos.com/', 'Vive el Adviento con BienCatólicos', '#123a27')}</div>
    </td></tr>
    <tr><td style="background:#123a27;color:#f2c14e;text-align:center;padding:14px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif">
      ¡Nos vemos este domingo 29 en Donde Mario's · San José Pinula! 🎄</td></tr>
  </table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const b = readBody(req);
  const accion = String(req.query.accion || b.accion || '');
  try {
    if (req.method === 'GET' && accion === 'admin') {
      if ((req.headers['x-pin'] || '') !== ADMIN) return res.status(401).json({ error: 'PIN incorrecto' });
      const [fams, resp] = await Promise.all([familias(), respuestas()]);
      const label = id => { const f = fams.find(x => x.id === id); return f ? `Familia ${f.apellidos}` : id; };
      return res.status(200).json({
        domingos: DOMINGOS,
        respuestas: resp.map(r => ({ ...r, familia: label(r.familiaId) })).sort((a, b) => a.familia.localeCompare(b.familia, 'es')),
        sinResponder: fams.filter(f => !resp.some(r => r.familiaId === f.id)).map(f => `Familia ${f.apellidos}`),
      });
    }

    if (req.method === 'GET') {
      const [fams, resp] = await Promise.all([familias(), respuestas()]);
      const label = id => { const f = fams.find(x => x.id === id); return f ? `Familia ${f.apellidos}` : ''; };
      return res.status(200).json({
        domingos: DOMINGOS.map(d => ({
          ...d,
          anfitriones: resp.filter(r => r.opcion === 'anfitrion' && r.domingos.includes(d.id)).map(r => ({ familia: label(r.familiaId), nombre: r.nombre, zona: r.zona })),
          asistentes: resp.filter(r => r.opcion !== 'no' && r.domingos.includes(d.id)).reduce((s, r) => s + (r.personas || 0), 0),
        })),
        familias: fams.map(f => ({ id: f.id, label: `Familia ${f.apellidos} (${f.nombre})` })),
        respondieron: resp.map(r => r.familiaId),
      });
    }

    if (req.method === 'POST' && accion === 'responder') {
      const fams = await familias();
      if (!fams.some(f => f.id === b.familiaId)) return res.status(400).json({ error: 'Elige tu familia' });
      const nombre = String(b.nombre || '').trim().slice(0, 40);
      const opcion = ['anfitrion', 'asistir', 'no'].includes(b.opcion) ? b.opcion : '';
      const domingos = Array.isArray(b.domingos) ? [...new Set(b.domingos.filter(d => IDS.includes(d)))] : [];
      if (nombre.length < 2) return res.status(400).json({ error: 'Escribe tu nombre' });
      if (!opcion) return res.status(400).json({ error: 'Elige una opción' });
      if (opcion !== 'no' && !domingos.length) return res.status(400).json({ error: 'Marca al menos un domingo' });
      const r = {
        familiaId: b.familiaId, nombre, opcion, domingos: opcion === 'no' ? [] : domingos,
        personas: opcion === 'no' ? 0 : Math.min(30, Math.max(1, parseInt(b.personas, 10) || 1)),
        zona: opcion === 'anfitrion' ? String(b.zona || '').trim().slice(0, 60) : '',
        comentario: String(b.comentario || '').trim().slice(0, 200),
        fecha: new Date().toISOString(),
      };
      await redis('HSET', RK, r.familiaId, JSON.stringify(r));
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST' && accion === 'enviarcorreo') {
      if ((req.headers['x-pin'] || '') !== ADMIN) return res.status(401).json({ error: 'PIN incorrecto' });
      if (!correoConfigurado()) return res.status(503).json({ error: 'Correo no configurado' });
      const asunto = '🕯️ Este domingo comienza el Adviento · 4 domingos, 4 hogares';
      if (b.prueba) {
        const r = await enviarCorreos([{ id: 'prueba', to: String(b.prueba), subject: '[PRUEBA] ' + asunto, html: correoHTML(['familia']) }]);
        return res.status(200).json({ ok: true, prueba: true, r });
      }
      const marca = P + 'adviento:correo-enviado';
      if (!(await redis('SET', marca, new Date().toISOString(), 'NX'))) return res.status(409).json({ error: 'La invitación ya se envió a todos' });
      const flat = (await redis('HGETALL', P + 'amigo:participantes')) || [];
      const porCorreo = {};
      for (let i = 0; i < flat.length; i += 2) { try { const p = JSON.parse(flat[i + 1]); if (p.email) (porCorreo[p.email] ||= []).push(p.nombre); } catch {} }
      const lista = Object.entries(porCorreo);
      let enviados = 0; const fallidos = [];
      for (let i = 0; i < lista.length; i += 10) {
        const lote = lista.slice(i, i + 10).map(([email, nombres], k) => ({ id: String(i + k), to: email, subject: asunto, html: correoHTML(nombres) }));
        try { const r = await enviarCorreos(lote); (r.enviados || []).forEach(x => x.ok ? enviados++ : fallidos.push(lote[+x.id - i]?.to)); }
        catch { lote.forEach(x => fallidos.push(x.to)); }
      }
      if (!enviados) await redis('DEL', marca);
      return res.status(200).json({ ok: true, enviados, fallidos, total: lista.length });
    }
    return res.status(400).json({ error: 'Acción no válida' });
  } catch (e) {
    return res.status(500).json({ error: 'Algo falló, intenta de nuevo' });
  }
}
