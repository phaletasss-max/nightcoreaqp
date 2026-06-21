'use client';

// ── Fondo scenecore animado ──────────────────────────────────────────────────
// Capa visual fija detrás de todo el contenido. Estrellas flotantes,
// patrones de checkerboard diagonal y glows de neón que se animan.
// Se muestra cuando el fondo de video NO está activado.

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  pulse: number;
}

const SCENE_COLORS = [
  '#ff00ff', '#00ffff', '#39ff14', '#ff69b4',
  '#fff01f', '#9933ff', '#ff2d8f', '#4d4dff',
];

export default function ScenecoreBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize stars
    const STAR_COUNT = 60;
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      color: SCENE_COLORS[Math.floor(Math.random() * SCENE_COLORS.length)],
      speed: Math.random() * 0.3 + 0.1,
      angle: Math.random() * Math.PI * 2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let frame: number;
    let t = 0;

    const draw = () => {
      t += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw checkerboard pattern (very subtle)
      const checkSize = 30;
      const offset = (t * 15) % (checkSize * 2);
      ctx.save();
      ctx.globalAlpha = 0.015;
      for (let x = -checkSize * 2; x < canvas.width + checkSize * 2; x += checkSize) {
        for (let y = -checkSize * 2; y < canvas.height + checkSize * 2; y += checkSize) {
          const row = Math.floor((y + offset) / checkSize);
          const col = Math.floor((x + offset) / checkSize);
          if ((row + col) % 2 === 0) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x + offset - checkSize, y + offset - checkSize, checkSize, checkSize);
          }
        }
      }
      ctx.restore();

      // Draw floating stars
      for (const star of starsRef.current) {
        star.pulse += 0.02;
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        // Wrap around
        if (star.x < -10) star.x = canvas.width + 10;
        if (star.x > canvas.width + 10) star.x = -10;
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;

        const alpha = 0.3 + Math.sin(star.pulse) * 0.3;
        const glowSize = star.size * 3;

        // Glow
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        ctx.restore();

        // Star point
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();

        // Draw a 4-point star shape
        const s = star.size;
        ctx.moveTo(star.x, star.y - s * 2);
        ctx.lineTo(star.x + s * 0.5, star.y - s * 0.5);
        ctx.lineTo(star.x + s * 2, star.y);
        ctx.lineTo(star.x + s * 0.5, star.y + s * 0.5);
        ctx.lineTo(star.x, star.y + s * 2);
        ctx.lineTo(star.x - s * 0.5, star.y + s * 0.5);
        ctx.lineTo(star.x - s * 2, star.y);
        ctx.lineTo(star.x - s * 0.5, star.y - s * 0.5);
        ctx.closePath();
        ctx.fillStyle = star.color;
        ctx.fill();
        ctx.restore();
      }

      // Draw diagonal rainbow stripe (very subtle)
      const stripeWidth = 2;
      const stripeColors = ['#ff00ff', '#00ffff', '#39ff14', '#ff69b4', '#fff01f'];
      const stripeY = ((t * 50) % (canvas.height + 400)) - 200;
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.translate(0, stripeY);
      ctx.rotate(-0.3);
      stripeColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(-100, i * stripeWidth, canvas.width + 200, stripeWidth);
      });
      ctx.restore();

      frame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="scenecore-bg" aria-hidden>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6 }}
      />
      {/* CSS layer on top for additional patterns */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,0,255,0.06), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,255,255,0.05), transparent 50%)',
      }} />
    </div>
  );
}
