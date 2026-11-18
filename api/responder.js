// Las confirmaciones ya están cerradas: no se aceptan respuestas nuevas ni cambios.
export default async function handler(req, res) {
  return res.status(403).json({ error: 'Las confirmaciones ya están cerradas' });
}
