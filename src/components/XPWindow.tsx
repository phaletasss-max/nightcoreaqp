'use client';

// ── XPWindow — ventana Windows XP reutilizable (v1.2) ────────────────────────
// Chrome de ventana Luna (titlebar azul + _ □ ✕ + cuerpo beige) para las
// secciones del PERFIL. El CSS vive en globals.css (.xp-window y overrides).
// onClose es opcional: si no se pasa, la ✕ es decorativa.

import React from 'react';

export default function XPWindow({ title, children, onClose, className = '', bodyClassName = '' }: {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`xp-window ${className}`}>
      <div className="xp-titlebar">
        <span className="truncate">{title}</span>
        <span className="xp-title-btns">
          <span className="xp-title-btn" aria-hidden>_</span>
          <span className="xp-title-btn" aria-hidden>□</span>
          {onClose ? (
            <button type="button" className="xp-title-btn close" title="Cerrar" onClick={onClose}>✕</button>
          ) : (
            <span className="xp-title-btn close" aria-hidden>✕</span>
          )}
        </span>
      </div>
      <div className={`xp-body ${bodyClassName}`}>{children}</div>
    </div>
  );
}
