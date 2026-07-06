'use client';

// ── CRTBoot — interferencia de "monitor encendiéndose" al cargar (v1.2) ─────
// Overlay de ~0.9s que imita un CRT viejo prendiendo: línea blanca que abre la
// imagen + scanlines con flicker. Solo UNA vez por sesión (sessionStorage) para
// que se sienta especial y no estorbe al navegar. CSS: .crt-boot en globals.

import { useEffect, useState } from 'react';

const KEY = 'nq_crt_boot_done';

export default function CRTBoot() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, '1');
      setShow(true);
      const t = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(t);
    } catch { /* sin storage: no mostrar (mejor que repetirlo siempre) */ }
  }, []);

  if (!show) return null;
  return <div className="crt-boot" aria-hidden />;
}
