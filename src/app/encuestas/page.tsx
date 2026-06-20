import { redirect } from 'next/navigation';

// Los "Retos" (racha, encuesta, fans, historial) se movieron al feed de Eventos.
// Mantenemos la ruta como redirección para no romper enlaces antiguos.
export default function EncuestasPage() {
  redirect('/');
}
