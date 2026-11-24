// Correo diario de cuenta regresiva (24 al 29 de noviembre) con una historia navideña.
// Lo dispara Vercel Cron cada mañana (ver vercel.json). Se envía UNA sola vez por día.
// Vista previa manual: /api/cuenta-regresiva?prueba=correo@ejemplo.com&dia=1  (header x-pin = PIN del panel)
import { redis } from './_redis.js';
import { enviarCorreos, correoConfigurado, SITIO } from './_correo.js';

const P = 'convivio-29nov2026:';
const ADMIN = process.env.ADMIN_PIN || 'navidad2026';
const FECHAS = ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'];

const HISTORIAS = [
  {
    titulo: 'La mesa que creció en Nochebuena',
    texto: [
      'En el barrio de San José, la familia Morales llevaba meses pasando por momentos difíciles después de que el taller de don Carlos cerrara por falta de trabajo. Al acercarse el 24 de diciembre, doña Elena miraba con tristeza su despensa casi vacía, pensando que esa Nochebuena no podrían preparar la cena tradicional ni invitar a nadie como solían hacerlo. Sus hijos, Mateo y Sofía, notaron su preocupación y decidieron no pedir regalos, conformándose con estar juntos y colocar en el centro de la sala el pequeño nacimiento de barro que heredaron de sus abuelos.',
      'La tarde del 24, justo cuando la familia terminaba de rezar agradeciendo por tener salud y techo, tocaron a la puerta. Era doña Marta, la vecina de enfrente, con una olla humeante de tamales y una sonrisa cálida: había cocinado de más y quería compartirlos. Minutos después llegó el señor Luis, del otro lado de la calle, trayendo ponche caliente y pan dulce, seguido por otra familia que llevaba frutas y música. Sin haberlo planeado, la sala de los Morales se llenó de risas, abrazos y conversaciones sinceras hasta la medianoche.',
    ],
    reflexion: 'La llegada de Jesús nos recuerda que Dios mismo eligió nacer en la sencillez para mostrarnos que la verdadera abundancia no está en lo que poseemos, sino en lo que compartimos. Cuando abrimos nuestra puerta y nuestro corazón a la comunidad, ninguna mesa queda vacía y el espíritu de la Navidad cobra vida real.',
    oracion: 'Señor Jesús, que naciste pobre en Belén, enséñanos a compartir lo que tenemos y a abrir la puerta de nuestro hogar a quien lo necesita. Que en nuestra mesa siempre haya lugar para uno más. Amén.',
  },
  {
    titulo: 'El puente sobre el muro del jardín',
    texto: [
      'Durante más de cinco años, don Augusto y su hermano menor, Rafael, apenas se dirigían la palabra. Una vieja discusión por una herencia familiar había levantado entre sus casas no solo una cerca de madera, sino un silencio frío que entristecía a toda la familia, especialmente a sus hijos y nietos. Cada diciembre, ambos celebraban la Navidad por separado, mirando de reojo las luces de la casa vecina con una mezcla de orgullo y nostalgia.',
      'A mediados de diciembre, una fuerte tormenta nocturna derribó un viejo árbol que cayó justo sobre el techo del cuarto de los niños de Rafael. Al escuchar el estruendo, Augusto salió corriendo sin pensarlo dos veces, tomó sus herramientas y cruzó hacia el patio de su hermano para ayudar a retirar las ramas y cubrir el techo antes de que entrara más lluvia. Al terminar, empapados y cansados, ambos se miraron en silencio frente al nacimiento iluminado en la ventana de Rafael. Augusto extendió la mano y pidió perdón por los años perdidos; Rafael lo abrazó con lágrimas en los ojos y lo invitó a pasar la Nochebuena juntos.',
    ],
    reflexion: 'Jesús vino al mundo como el Príncipe de Paz para reconciliar a las personas entre sí y devolver la armonía a los hogares. La Navidad pierde su sentido si guardamos rencor; el mejor regalo que podemos ofrecer en esta temporada es dar el primer paso hacia el perdón y sanar los lazos familiares.',
    oracion: 'Príncipe de Paz, sana las heridas de nuestra familia. Danos la humildad para pedir perdón y la generosidad para perdonar, para que esta Navidad nos encuentre más unidos que nunca. Amén.',
  },
  {
    titulo: 'La luz de la tienda de la esquina',
    texto: [
      'Clara trabajaba en una pequeña tienda de abarrotes que permanecía abierta hasta tarde durante todo diciembre. Cansada por las largas jornadas y preocupada por sus propios problemas, atendía a los clientes de manera mecánica, deseando únicamente que terminara el turno para irse a dormir. Para ella, la Navidad se había convertido en sinónimo de estrés, filas largas y prisas constantes que le impedían disfrutar la temporada.',
      'La noche del 23 de diciembre entró don Samuel, un anciano del vecindario que vivía solo desde que falleció su esposa y apenas compraba un pan y una taza de leche. Al verlo caminar despacio y mirar con nostalgia una pequeña figura del Niño Jesús en el mostrador, Clara sintió un impulso distinto: lo invitó a sentarse unos minutos, le sirvió una taza de café caliente y escuchó sus historias de juventud. Desde ese día, otros vecinos notaron el gesto y comenzaron a turnarse para visitar a don Samuel, llevarle comida y acompañarlo en las novenas del barrio.',
    ],
    reflexion: 'El nacimiento de Jesús nos enseña que Dios se hace cercano a través de los pequeños actos de bondad cotidiana. A veces, detener nuestra prisa para escuchar y acompañar a quien se siente solo es la forma más auténtica de mantener encendida la luz de la Navidad en nuestra comunidad.',
    oracion: 'Niño Jesús, luz del mundo, abre nuestros ojos para ver a quien está solo cerca de nosotros. Que nuestras manos y nuestro tiempo sean tu presencia para los demás. Amén.',
  },
  {
    titulo: 'El regalo que no cabía en una caja',
    texto: [
      'En casa de los Ramírez, cada miembro de la familia vivía atrapado en su propia rutina: el padre revisaba mensajes del trabajo incluso durante la cena, la madre organizaba mil pendientes a la vez y los hijos pasaban horas frente a sus pantallas. Aunque vivían bajo el mismo techo y habían decorado toda la casa con luces navideñas, apenas conversaban sobre lo que sentían o necesitaban.',
      'Una semana antes de Navidad, un apagón eléctrico dejó sin energía a toda la colonia durante la noche. Sin internet ni televisión, la familia encendió unas velas alrededor del pesebre y se sentó en la sala. Al principio hubo incomodidad, pero poco a poco empezaron a recordar Navidades pasadas, a contar anécdotas de los abuelos y a escuchar los sueños y temores de cada uno. Esa noche decidieron hacer un pacto: guardar los teléfonos todas las noches de diciembre para compartir tiempo real en familia y ayudar juntos en el comedor comunitario de la parroquia.',
    ],
    reflexion: 'En Belén, María y José no tuvieron distracciones ni lujos, pero tuvieron lo esencial: presencia plena y amor mutuo alrededor de Jesús. Esta temporada nos invita a apagar el ruido diario para volver a mirarnos a los ojos, fortalecer la unión familiar y recordar que nuestro tiempo es el obsequio más valioso.',
    oracion: 'Sagrada Familia de Nazaret, enséñanos a estar presentes de verdad los unos para los otros. Que nuestro hogar sea, como el de ustedes, un lugar de escucha, ternura y fe. Amén.',
  },
  {
    titulo: 'El pesebre de todos en el parque',
    texto: [
      'El parque central del pueblo llevaba años descuidado y los vecinos apenas se saludaban al pasar, cada quien encerrado en sus asuntos y desconfiando de los demás. Al llegar diciembre, un grupo de jóvenes de la comunidad propuso limpiar el lugar y construir juntos un nacimiento tamaño natural utilizando materiales reciclados y aportes de cada familia, en lugar de comprar adornos costosos.',
      'Al principio solo llegaron unas cuantas personas, pero al ver el entusiasmo de los niños pintando las figuras de María, José y los pastores, más vecinos se fueron sumando. El carpintero donó la madera para el establo, las señoras tejieron mantas para el pesebre, los mayores contaron historias y los más pequeños llevaron flores del jardín. La noche del 24 de diciembre, todo el vecindario se reunió alrededor de aquel pesebre hecho por sus propias manos para cantar villancicos y compartir una cena comunitaria bajo las estrellas.',
    ],
    reflexion: 'Así como los pastores y los sabios de distintos lugares se unieron frente al pesebre de Belén, la Navidad tiene el poder de transformar un grupo de desconocidos en una verdadera familia. Cuando trabajamos juntos por el bien común, construimos una comunidad más solidaria, fraterna y llena de esperanza.',
    oracion: 'Señor, que mañana, al reunirnos como familia, tu presencia esté en medio de nosotros. Bendice cada abrazo, cada risa y cada regalo, y haz de nosotros una sola familia en tu amor. Amén.',
  },
];

const MAPS = 'https://maps.app.goo.gl/otuJdFdaKAfkPB4HA';
const WAZE = 'https://waze.com/ul?ll=14.5500902,-90.4205371&navigate=yes';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const btn = (href, txt, bg) => `<a href="${esc(href)}" style="display:inline-block;margin:4px;padding:10px 16px;border-radius:10px;background:${bg};color:#fff;text-decoration:none;font-weight:800;font-size:14px">${txt}</a>`;
const unir = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
const fechaGT = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);

function armar(dia, nombres) {
  const faltan = 5 - dia; // dia 0..5
  const saludo = `Hola ${esc(unir(nombres))} 👋`;
  const marco = (contenido, cabecera) => `<!DOCTYPE html><html><body style="margin:0;background:#0b2418;font-family:Georgia,'Times New Roman',serif;color:#2b1d14">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b2418;padding:20px 10px"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff8ef;border-radius:20px;overflow:hidden">
    <tr><td style="background:#c8102e;color:#fff;text-align:center;padding:24px 16px;font-family:Arial,Helvetica,sans-serif">${cabecera}</td></tr>
    <tr><td style="padding:24px 22px">${contenido}</td></tr>
    <tr><td style="background:#123a27;color:#f2c14e;text-align:center;padding:14px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif">
      Reunión Navideña Familiar · Domingo 29 de noviembre · 8:00 a. m. a 12:00 p. m.<br>Donde Mario's · San José Pinula 🎄</td></tr>
  </table></td></tr></table></body></html>`;

  if (dia < 5) {
    const h = HISTORIAS[dia];
    const cab = `<div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.9">Cuenta regresiva</div>
      <div style="font-size:64px;font-weight:900;line-height:1.05">${faltan === 1 ? '¡Mañana!' : faltan}</div>
      <div style="font-size:16px;font-weight:700">${faltan === 1 ? 'nos vemos en familia' : 'días para encontrarnos en familia'}</div>`;
    const cuerpo = `
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;margin:0 0 6px">${saludo}</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#7a6656;margin:0 0 18px">Mientras se acerca nuestra reunión, te compartimos una historia para preparar el corazón. 🕯️</p>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:900;color:#1f9d55;letter-spacing:.1em;text-transform:uppercase">Historia ${dia + 1} de 5</div>
      <h1 style="font-size:26px;color:#c8102e;margin:4px 0 14px;line-height:1.2">${esc(h.titulo)}</h1>
      ${h.texto.map(t => `<p style="font-size:16px;line-height:1.65;margin:0 0 14px">${esc(t)}</p>`).join('')}
      <div style="margin:20px 0 0;padding:16px 18px;border-left:5px solid #f2c14e;background:#fff3d6;border-radius:10px">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:900;color:#c8102e;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">✨ Reflexión</div>
        <p style="font-size:16px;line-height:1.6;margin:0">${esc(h.reflexion)}</p>
      </div>
      <div style="margin:16px 0 0;padding:16px 18px;background:#123a27;color:#fff;border-radius:12px;text-align:center">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:900;color:#f2c14e;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">🙏 Oremos juntos</div>
        <p style="font-size:15px;line-height:1.6;margin:0;font-style:italic">${esc(h.oracion)}</p>
      </div>
      <div style="margin:22px 0 0;padding:14px;border:2px dashed #eadbc6;border-radius:12px;text-align:center;font-family:Arial,Helvetica,sans-serif">
        <div style="font-size:14px;font-weight:800">🎁 ¿Ya tienes el regalo de tu amigo secreto? <span style="color:#1f9d55">(Q25)</span></div>
        <div style="margin-top:8px">${btn(SITIO, '🎡 Ver mi amigo secreto', '#c8102e')}</div>
      </div>`;
    return { subject: faltan === 1 ? '🎄 ¡Mañana nos vemos! · La última historia' : `🎄 Faltan ${faltan} días · ${h.titulo}`, html: marco(cuerpo, cab) };
  }

  // Día 29: ¡Hoy!
  const cab = `<div style="font-size:44px">🎉</div><div style="font-size:34px;font-weight:900">¡Hoy es el día!</div>
    <div style="font-size:16px;font-weight:700">Nos vemos a las 8:00 a. m.</div>`;
  const cuerpo = `
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;margin:0 0 14px">${saludo}</p>
    <p style="font-size:17px;line-height:1.6;margin:0 0 16px">Llegó el día de reunirnos. Gracias por acompañarnos en estas cinco historias: ojalá cada una haya dejado una semillita en tu corazón para vivir una Navidad más cerca de Jesús y de la familia.</p>
    <div style="margin:0 0 18px;padding:16px 18px;border-left:5px solid #f2c14e;background:#fff3d6;border-radius:10px">
      <p style="font-size:17px;line-height:1.6;margin:0;font-style:italic">«No teman, porque les anuncio una gran alegría, que lo será para todo el pueblo: hoy les ha nacido un Salvador, que es el Cristo, el Señor.»</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#7a6656;margin:6px 0 0">— Lucas 2, 10-11</p>
    </div>
    <div style="text-align:center;font-family:Arial,Helvetica,sans-serif">
      <div style="font-size:16px;font-weight:900;margin-bottom:6px">📍 Donde Mario's · San José Pinula</div>
      <div style="font-size:14px;color:#7a6656;font-weight:700;margin-bottom:10px">⏰ De 8:00 a. m. a 12:00 p. m. · 🍳 Desayuno</div>
      ${btn(MAPS, '🗺️ Google Maps', '#1a73e8')}${btn(WAZE, '🚗 Waze', '#1693bd')}
    </div>
    <div style="margin:20px 0 0;padding:14px;border:2px dashed #eadbc6;border-radius:12px;text-align:center;font-family:Arial,Helvetica,sans-serif">
      <div style="font-size:15px;font-weight:800">🎁 ¡No olvides el regalo de tu amigo secreto! (Q25)</div>
      <div style="margin-top:8px">${btn(SITIO, '🎡 ¿A quién le regalo?', '#c8102e')}</div>
    </div>
    <p style="text-align:center;font-size:16px;margin:20px 0 0">Que el Niño Dios bendiga a cada familia. ¡Los esperamos! 🎄</p>`;
  return { subject: '🎉 ¡Hoy es el día! Nos vemos a las 8:00 a. m.', html: marco(cuerpo, cab) };
}

async function destinatarios() {
  const flat = (await redis('HGETALL', P + 'amigo:participantes')) || [];
  const porCorreo = {};
  for (let i = 0; i < flat.length; i += 2) {
    try {
      const p = JSON.parse(flat[i + 1]);
      if (!p.email) continue;
      (porCorreo[p.email] ||= []).push(p.nombre);
    } catch {}
  }
  return Object.entries(porCorreo).map(([email, nombres]) => ({ email, nombres }));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!correoConfigurado()) return res.status(503).json({ error: 'Correo no configurado' });

  // Vista previa a un solo correo (desde el panel / pruebas)
  if (req.query.prueba) {
    if ((req.headers['x-pin'] || '') !== ADMIN) return res.status(401).json({ error: 'PIN incorrecto' });
    const dia = Math.min(6, Math.max(1, parseInt(req.query.dia, 10) || 1)) - 1;
    const { subject, html } = armar(dia, ['familia']);
    const r = await enviarCorreos([{ id: 'prueba', to: String(req.query.prueba), subject: '[PRUEBA] ' + subject, html }]);
    return res.status(200).json({ ok: true, prueba: true, dia: dia + 1, r });
  }

  // Envío automático (Vercel Cron)
  const auth = req.headers.authorization || '';
  const ua = req.headers['user-agent'] || '';
  const esCron = process.env.CRON_SECRET ? auth === `Bearer ${process.env.CRON_SECRET}` : /vercel-cron/i.test(ua);
  if (!esCron) return res.status(401).json({ error: 'Solo el envío programado puede ejecutar esto' });

  const hoy = fechaGT();
  const dia = FECHAS.indexOf(hoy);
  if (dia < 0) return res.status(200).json({ ok: true, omitido: `Hoy (${hoy}) no toca correo` });

  const marca = P + 'cuenta-regresiva:enviado:' + hoy;
  const ya = await redis('SET', marca, new Date().toISOString(), 'NX', 'EX', String(3 * 86400));
  if (!ya) return res.status(200).json({ ok: true, omitido: 'Ya se envió hoy' });

  const lista = await destinatarios();
  let enviados = 0; const fallidos = [];
  for (let i = 0; i < lista.length; i += 10) {
    const lote = lista.slice(i, i + 10).map((d, k) => ({ id: String(i + k), to: d.email, ...armar(dia, d.nombres) }));
    try {
      const r = await enviarCorreos(lote);
      (r.enviados || []).forEach(x => x.ok ? enviados++ : fallidos.push(lote[+x.id - i]?.to));
    } catch (e) { lote.forEach(x => fallidos.push(x.to)); }
  }
  if (!enviados && lista.length) await redis('DEL', marca); // si todo falló, permite reintentar
  await redis('SET', P + 'cuenta-regresiva:log:' + hoy, JSON.stringify({ enviados, fallidos, total: lista.length }), 'EX', String(30 * 86400));
  return res.status(200).json({ ok: true, dia: dia + 1, enviados, fallidos, total: lista.length });
}
