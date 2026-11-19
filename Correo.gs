// ===== Envío de correos del Convivio Familiar (Amigo Secreto) =====
// 1. Cambia SECRETO por una clave tuya (la misma que pondrás en Vercel como CORREO_SECRETO).
// 2. Implementar → Nueva implementación → Tipo: Aplicación web
//    · Ejecutar como: Yo   · Quién tiene acceso: Cualquier usuario
// 3. Copia la URL que termina en /exec y ponla en Vercel como CORREO_URL.

const SECRETO = 'CAMBIA-ESTA-CLAVE';

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secreto !== SECRETO) return salida({ ok: false, error: 'Clave secreta incorrecta' });
    const enviados = [];
    (d.correos || []).forEach(c => {
      try {
        MailApp.sendEmail({ to: c.to, subject: c.subject, htmlBody: c.html, name: 'Convivio Familiar 🎄' });
        enviados.push({ id: c.id, ok: true });
      } catch (err) {
        enviados.push({ id: c.id, ok: false, error: String(err) });
      }
    });
    return salida({ ok: true, enviados, cuotaRestante: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return salida({ ok: false, error: String(err) });
  }
}

function doGet() {
  return salida({ ok: true, mensaje: 'Servicio de correo del convivio activo', cuotaRestante: MailApp.getRemainingDailyQuota() });
}

// Ejecuta esta función una vez desde el editor para autorizar el envío de correos.
function probarPermisos() {
  Logger.log('Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota());
}

function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
