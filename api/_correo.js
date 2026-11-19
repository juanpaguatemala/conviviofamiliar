// Arma y envía los correos del amigo secreto a través de Google Apps Script (Gmail).
// Variables en Vercel: CORREO_URL (URL de la app web de Apps Script) y CORREO_SECRETO.
import { buscarProductos } from './regalos.js';

export const correoConfigurado = () => !!(process.env.CORREO_URL && process.env.CORREO_SECRETO);
export const SITIO = process.env.SITIO_URL || 'https://conviviofamiliar.vercel.app';

const CATS = {
  dulces: ['🍫', 'Dulces y chocolates', 'chocolates'], snacks: ['☕', 'Snacks y café', 'cafe'], hogar: ['🏠', 'Hogar y cocina', 'taza'],
  papeleria: ['✏️', 'Papelería', 'libreta'], libros: ['📚', 'Libros', 'libro'], belleza: ['💄', 'Belleza y cuidado', 'crema'],
  accesorios: ['🧦', 'Accesorios', 'calcetines'], decoracion: ['🎄', 'Decoración navideña', 'esfera'], variado: ['🎁', 'Sorpréndanme', 'navidad'],
  carritos: ['🚗', 'Carritos', 'carro'], munecas: ['👸', 'Muñecas', 'muneca'], peluches: ['🧸', 'Peluches', 'peluche'],
  armar: ['🧱', 'Bloques y rompecabezas', 'rompecabezas'], juegos: ['🎲', 'Juegos de mesa', 'juego de mesa'], deportes: ['⚽', 'Pelotas y aire libre', 'pelota'],
  arte: ['🎨', 'Manualidades y arte', 'plastilina'], sorpresas: ['🦄', 'Slime y sorpresas', 'slime'],
};
const TIENDAS_ADULTO = [['Walmart', 'www.walmart.com.gt'], ['Paiz', 'www.paiz.com.gt'], ['La Torre', 'www.latorre.com.gt'], ['Cemaco', 'www.cemaco.com'], ['Siman', 'gt.siman.com']];
const TIENDAS_NINO = [['Walmart', 'www.walmart.com.gt'], ['Maxi Despensa', 'www.maxidespensa.com.gt'], ['Cemaco', 'www.cemaco.com'], ['Siman', 'gt.siman.com']];
const enlaceQ25 = (dom, q) => `https://${dom}/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft&priceRange=15%20TO%2030`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const btn = (href, txt, bg = '#1f9d55') =>
  `<a href="${esc(href)}" style="display:inline-block;margin:3px 4px 3px 0;padding:8px 12px;border-radius:10px;background:${bg};color:#fff;text-decoration:none;font-weight:800;font-size:13px">${txt}</a>`;

export async function armarCorreo(giver, amigo) {
  const esNino = amigo.tipo === 'nino';
  let gustos = (amigo.gustos || []).filter(g => CATS[g]);
  if (!gustos.length) gustos = esNino ? ['carritos', 'peluches', 'arte'] : ['dulces', 'hogar', 'accesorios'];
  const tiendas = esNino ? TIENDAS_NINO : TIENDAS_ADULTO;

  // Productos reales (máx. 3 por gusto, máx. 3 gustos)
  const bloques = await Promise.all(gustos.slice(0, 3).map(async g => {
    let productos = [];
    try { productos = ((await buscarProductos(esNino ? 'nino' : 'adulto', g)).productos || []).slice(0, 3); } catch {}
    const [e, n, q] = CATS[g];
    const prods = productos.map(p => `
      <td width="33%" valign="top" style="padding:4px">
        <a href="${esc(p.link)}" style="text-decoration:none;color:#2b1d14;display:block;border:1px solid #eadbc6;border-radius:12px;padding:8px;background:#fff">
          ${p.img ? `<img src="${esc(p.img)}" alt="" width="100%" style="display:block;max-width:150px;margin:0 auto 6px;border-radius:8px">` : ''}
          <div style="font-size:12px;font-weight:700;line-height:1.3">${esc(p.nombre)}</div>
          <div style="font-size:15px;font-weight:900;color:#c8102e;margin-top:4px">Q${Number(p.precio).toFixed(2)}</div>
          <div style="font-size:11px;font-weight:800;color:#123a27">${esc(p.tienda)}</div>
        </a></td>`).join('');
    return `
      <div style="margin:16px 0 0;padding:14px;border:2px solid #eadbc6;border-radius:14px;background:#fffdf9">
        <div style="font-size:16px;font-weight:900;margin-bottom:8px">${e} ${esc(n)}</div>
        ${prods ? `<table width="100%" cellpadding="0" cellspacing="0"><tr>${prods}</tr></table>` : ''}
        <div style="margin-top:8px;font-size:12px;font-weight:700;color:#7a6656">Buscar más de Q15 a Q30:</div>
        <div>${(['dulces', 'snacks'].includes(g) ? tiendas.slice(0, 3) : tiendas).map(([t, d]) => btn(enlaceQ25(d, q), '🔎 ' + t)).join('')}</div>
      </div>`;
  }));

  const pedido = amigo.pedido || amigo.pedidoLink ? `
    <div style="margin:18px 0 0;padding:14px;border:2px solid #f2c14e;border-radius:14px;background:#fff6dc">
      <div style="font-size:12px;font-weight:900;color:#c8102e;letter-spacing:.06em;text-transform:uppercase">🎯 Pidió algo específico</div>
      <div style="font-size:16px;font-weight:800;margin-top:4px;white-space:pre-wrap">${esc(amigo.pedido || 'Dejó este producto:')}</div>
      ${amigo.pedidoLink ? `<div style="margin-top:8px">${btn(amigo.pedidoLink, '🛒 Ver el producto', '#c8102e')}</div>` : ''}
    </div>` : '';

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#0b2418;font-family:Arial,Helvetica,sans-serif;color:#2b1d14">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b2418;padding:20px 10px"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff8ef;border-radius:20px;overflow:hidden">
    <tr><td style="background:#c8102e;color:#fff;text-align:center;padding:22px 16px">
      <div style="font-size:34px">🎁</div>
      <div style="font-size:24px;font-weight:900">¡Tu amigo secreto!</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">Reunión Navideña Familiar · Domingo 29 de noviembre · 8:00 a. m.</div>
    </td></tr>
    <tr><td style="padding:22px 20px">
      <p style="font-size:16px;margin:0">Hola <b>${esc(giver.nombre)}</b> 👋</p>
      <p style="font-size:15px;margin:10px 0 0">La tómbola habló y te tocó regalarle a:</p>
      <div style="text-align:center;margin:16px 0 4px">
        <div style="font-size:34px;font-weight:900;color:#c8102e">${esc(amigo.nombre)}</div>
        <div style="font-size:14px;font-weight:700;color:#7a6656">${esNino ? '🧒 Niño' : '🧑 Adulto'} · ${esc(amigo.familia)}</div>
      </div>
      <div style="text-align:center;margin:12px 0"><span style="display:inline-block;background:#1f9d55;color:#fff;font-weight:900;border-radius:999px;padding:7px 16px">💰 Regalo de Q25</span></div>
      ${amigo.deseo ? `<div style="text-align:center;margin:10px auto 0;padding:10px;border:2px dashed #f2c14e;border-radius:12px;font-weight:700">💭 "${esc(amigo.deseo)}"</div>` : ''}
      ${pedido}
      <div style="margin-top:18px;font-size:15px;font-weight:900">${esNino ? '🧸 Ideas de juguetes de ~Q25' : (amigo.gustos || []).length ? '✨ Según lo que le gusta' : '✨ Ideas de ~Q25'}</div>
      ${bloques.join('')}
      <p style="font-size:12px;color:#7a6656;margin-top:14px">Precios y existencias pueden cambiar; confírmalos en la tienda.</p>
      <div style="text-align:center;margin-top:18px">${btn(SITIO, '🎄 Ver todo en la página del convivio', '#123a27')}</div>
      <p style="text-align:center;font-size:14px;font-weight:800;margin-top:18px">🤫 ¡Es secreto! No le cuentes a nadie.</p>
    </td></tr>
    <tr><td style="background:#123a27;color:#f2c14e;text-align:center;padding:12px;font-size:12px;font-weight:700">Donde Mario's · San José Pinula · ¡Feliz Navidad! 🎄</td></tr>
  </table></td></tr></table></body></html>`;

  return { to: giver.email, subject: '🎁 Tu amigo secreto del Convivio Familiar 🤫', html };
}

export async function enviarCorreos(correos) {
  const r = await fetch(process.env.CORREO_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secreto: process.env.CORREO_SECRETO, correos }),
    redirect: 'follow',
  });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch { throw new Error('El servicio de correo no respondió bien. Revisa la URL de Apps Script.'); }
  if (!j.ok) throw new Error(j.error || 'No se pudieron enviar los correos');
  return j;
}
