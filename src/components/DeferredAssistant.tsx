'use client';

// Carga NΞON (Assistant) DESPUÉS de la hidratación, fuera del bundle crítico.
// El botón flotante no es visible en el primer paint, así que diferir su chunk
// (lógica + catálogo de acciones neonActions) aligera el tiempo de carga inicial
// sin que el usuario note nada (aparece un instante después).

import dynamic from 'next/dynamic';

const Assistant = dynamic(() => import('@/components/Assistant'), { ssr: false });

export default function DeferredAssistant() {
  return <Assistant />;
}
