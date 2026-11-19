// Busca productos reales de ~Q25 en tiendas guatemaltecas (catálogo público VTEX)
// GET /api/regalos?tipo=adulto|nino&cat=snacks
// Tiendas con búsqueda en vivo: Walmart, Paiz, La Torre, Cemaco, Siman, Maxi Despensa.
// Resultados en caché 6 horas para no saturar a las tiendas.
import { redis } from './_redis.js';

const TIENDAS = {
  walmart: { n: 'Walmart', host: 'https://www.walmart.com.gt' },
  paiz:    { n: 'Paiz', host: 'https://www.paiz.com.gt' },
  latorre: { n: 'La Torre', host: 'https://www.latorre.com.gt' },
  cemaco:  { n: 'Cemaco', host: 'https://www.cemaco.com' },
  siman:   { n: 'Siman', host: 'https://gt.siman.com' },
  maxi:    { n: 'Maxi Despensa', host: 'https://www.maxidespensa.com.gt' },
};

const JUGUETE = /\/juguet|jugueter|didáctic|didactic/i;            // niños: SOLO categorías de juguetes
const NO_ADULTO = /beb[eé]|ni[ñn]o|ni[ñn]a|infantil|\/juguet/i;     // adultos: nada de bebé/niños/juguetes
const BUSQUEDAS = {
  adulto: {
    dulces:     { q: ['chocolate', 'bombones', 'turron', 'galletas navidad'], c: /dulce|chocolate|confit|galleta|navid|golosin/i, t: ['walmart', 'paiz', 'latorre'] },
    snacks:     { q: ['cafe molido', 'chocolate caliente', 'galletas', 'te'], c: /abarrot|caf|snack|galleta|bebida|desayuno|boquita|infusi|té/i, t: ['walmart', 'paiz', 'latorre'] },
    hogar:      { q: ['taza', 'vela aromatica', 'portavasos', 'toalla de cocina'], c: /hogar|cocina|mesa|decor|baño|vela|aroma|vajill/i, t: ['cemaco', 'walmart', 'siman', 'latorre'] },
    papeleria:  { q: ['libreta', 'lapiceros', 'cuaderno', 'agenda'], c: /papel|escolar|oficina|librer|cuaderno|escritura|útiles|utiles/i, t: ['walmart', 'cemaco', 'paiz'] },
    libros:     { q: ['libro', 'libro para colorear'], c: /libro|librer|lectura/i, t: ['walmart', 'cemaco', 'siman'] },
    belleza:    { q: ['crema manos', 'crema corporal', 'balsamo labial', 'mascarilla', 'cosmetiquera'], c: /belleza|cuidado|personal|cosm|maquill|cabello|piel|labio|facial/i, t: ['paiz', 'walmart', 'siman'] },
    accesorios: { q: ['calcetines', 'llavero', 'gorro', 'soporte celular'], c: /accesori|calcet|ropa|moda|celular|tecnolog|bols|gorr/i, t: ['siman', 'walmart', 'cemaco'] },
    decoracion: { q: ['esfera', 'adorno navidad', 'luces navidad', 'navidad'], c: /navid|decor|adorno/i, t: ['cemaco', 'walmart', 'siman', 'paiz'] },
    variado:    { q: ['taza navidad', 'set regalo', 'vela', 'chocolate'], c: /./, t: ['walmart', 'cemaco', 'siman', 'paiz'] },
  },
  nino: {
    carritos:  { q: ['carro', 'hot wheels', 'vehiculo', 'camion'], c: JUGUETE, t: ['walmart', 'maxi', 'siman', 'cemaco'] },
    munecas:   { q: ['muñeca', 'muneca', 'barbie'], c: JUGUETE, t: ['walmart', 'maxi', 'siman', 'cemaco'] },
    peluches:  { q: ['peluche'], c: JUGUETE, t: ['walmart', 'siman', 'cemaco', 'maxi'] },
    armar:     { q: ['bloques', 'rompecabezas', 'armar'], c: JUGUETE, t: ['cemaco', 'walmart', 'siman', 'maxi'] },
    juegos:    { q: ['juego de mesa', 'juego de cartas', 'loteria'], c: JUGUETE, t: ['cemaco', 'walmart', 'siman'] },
    deportes:  { q: ['pelota', 'burbujas', 'yoyo'], c: /\/juguet|jugueter|deporte|aire libre/i, t: ['walmart', 'maxi', 'cemaco', 'siman'] },
    arte:      { q: ['plastilina', 'crayones', 'libro para colorear'], c: /\/juguet|jugueter|manualid|arte|colorear/i, t: ['cemaco', 'walmart', 'paiz'] },
    sorpresas: { q: ['slime', 'juguete sorpresa', 'squishy'], c: JUGUETE, t: ['walmart', 'maxi', 'siman', 'cemaco'] },
  },
};

const MIN = 15, MAX = 30, OBJ = 25;

async function buscarEn(tienda, q) {
  const url = `${TIENDAS[tienda].host}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(q)}&fq=P:[${MIN} TO ${MAX}]&_from=0&_to=19`;
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; ConvivioFamiliar/1.0)' } });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data.map(p => ({ p, tienda })) : [];
  } catch { return []; } finally { clearTimeout(to); }
}

function normalizar({ p, tienda }, catRe, esNino) {
  const it = p.items && p.items[0];
  const of = it && it.sellers && it.sellers[0] && it.sellers[0].commertialOffer;
  if (!of || !of.Price || of.IsAvailable === false || of.AvailableQuantity === 0) return null;
  if (of.Price < MIN || of.Price > MAX) return null;
  const cats = (p.categories || []).join(' ');
  if (esNino) { if (!catRe.test(cats)) return null; }
  else { if (NO_ADULTO.test(cats) || !catRe.test(cats + ' ' + p.productName)) return null; }
  let img = it.images && it.images[0] && it.images[0].imageUrl || '';
  img = img.replace(/\/ids\/(\d+)\//, '/ids/$1-240-240/');
  return { nombre: p.productName, precio: Math.round(of.Price * 100) / 100, img, link: p.link, tienda: TIENDAS[tienda].n };
}

export default async function handler(req, res) {
  const tipo = req.query.tipo === 'nino' ? 'nino' : 'adulto';
  const cat = String(req.query.cat || '');
  if (!BUSQUEDAS[tipo][cat]) return res.status(400).json({ error: 'Categoría no válida' });
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
  return res.status(200).json(await buscarProductos(tipo, cat));
}

// También la usa el envío de correos
export async function buscarProductos(tipo, cat) {
  const conf = BUSQUEDAS[tipo] && BUSQUEDAS[tipo][cat];
  if (!conf) return { productos: [] };
  const cacheKey = `convivio-29nov2026:regalos:${tipo}:${cat}`;
  try { const hit = await redis('GET', cacheKey); if (hit) return JSON.parse(hit); } catch {}

  const lotes = await Promise.all(conf.t.flatMap(t => conf.q.map(q => buscarEn(t, q))));
  const vistos = new Set();
  const productos = lotes.flat().map(x => normalizar(x, conf.c, tipo === 'nino')).filter(Boolean)
    .filter(x => { const k = x.link; if (vistos.has(k)) return false; vistos.add(k); return true; })
    .sort((a, b) => Math.abs(a.precio - OBJ) - Math.abs(b.precio - OBJ));

  // Variedad: intercalar tiendas y no más de 4 por tienda
  const porTienda = {}, final = [];
  for (const x of productos) {
    porTienda[x.tienda] = (porTienda[x.tienda] || 0) + 1;
    if (porTienda[x.tienda] <= 4) final.push(x);
    if (final.length >= 12) break;
  }
  const out = { productos: final, actualizado: new Date().toISOString() };
  if (final.length) { try { await redis('SET', cacheKey, JSON.stringify(out), 'EX', '21600'); } catch {} }
  return out;
}
