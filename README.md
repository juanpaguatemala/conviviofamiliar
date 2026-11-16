# 🎄 Encuesta Convivio Familiar · 29 de noviembre 2026

- `/` → formulario para las familias
- `/resultados` → panel de Ericka (pide PIN)

## Publicar en Vercel (≈5 minutos)
1. Sube esta carpeta a un repositorio de GitHub e impórtalo en Vercel
   (o desde la carpeta: `npx vercel --prod`). Framework Preset: **Other**.
2. En el proyecto de Vercel → **Storage** → **Create Database** → **Upstash for Redis** (plan gratis) → conéctalo al proyecto.
   Esto crea solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables** → agrega `ADMIN_PIN` con el PIN que le darás a Ericka.
   (Si no lo pones, el PIN es `navidad2026`.)
4. **Deployments → Redeploy** para que tome las variables.

Listo: comparte `https://tu-proyecto.vercel.app` con las familias y `https://tu-proyecto.vercel.app/resultados` + el PIN con Ericka.

## Notas
- Si una familia envía de nuevo con el mismo nombre y apellidos, se actualiza su respuesta (no se duplica).
- Ericka puede filtrar, buscar, ordenar, borrar duplicados y descargar un CSV que abre en Excel.
