# 🎄 Reunión Navideña Familiar · 29 de noviembre 2026

- `/` → página principal: cuenta regresiva, resultados, lugar, buenos deseos y **Amigo Secreto**
- `/resultados` → panel de Ericka (PIN: `ADMIN_PIN`, por defecto `navidad2026`)

## Variables en Vercel (Settings → Environment Variables)
| Variable | Para qué |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base de datos (ya conectada: convivio-familiar-2026) |
| `ADMIN_PIN` | PIN del panel de Ericka (opcional) |
| `CORREO_URL` | URL de la app web de Apps Script (termina en `/exec`) |
| `CORREO_SECRETO` | La misma clave que pusiste en `Correo.gs` |

Después de agregar o cambiar variables: **Deployments → ⋯ → Redeploy**.

## 📧 Conectar tu Gmail para enviar los correos (una sola vez, ~5 min)
1. Entra a **script.google.com** con tu cuenta de Gmail → **Nuevo proyecto**. Ponle nombre: "Correos Convivio".
2. Borra lo que trae y pega todo el contenido de `apps-script/Correo.gs`.
3. En la línea `const SECRETO = 'CAMBIA-ESTA-CLAVE';` pon una clave tuya (ej. `convivio-pinula-2026`). Guarda (💾).
4. Arriba elige la función **probarPermisos** → **Ejecutar** → acepta los permisos
   (si sale "Google no verificó esta app": *Configuración avanzada* → *Ir a Correos Convivio*).
5. **Implementar → Nueva implementación** → ⚙️ tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   → **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. En Vercel agrega `CORREO_URL` (esa URL) y `CORREO_SECRETO` (tu clave) y haz **Redeploy**.

Los correos salen desde tu Gmail con el nombre "Convivio Familiar 🎄". Gmail permite ~100 correos por día.

## Amigo secreto: orden recomendado
1. Todos se inscriben (con su correo y PIN).
2. Ericka: panel → **Cerrar inscripción y activar tómbola**.
3. Ericka: panel → **📧 Enviar correos pendientes**.
4. Cada quien también puede ver el suyo en la página → **Mi tómbola** con su PIN.
