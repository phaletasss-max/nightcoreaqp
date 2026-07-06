// ── Generador de íconos/OG del branding GLITCH AQP ──────────────────────────
// Renderiza SVG → PNG con sharp (ya viene con Next). Produce:
//   public/icon-512x512.png · public/icon-192x192.png (PWA)
//   public/og.png (1200x630, Open Graph)
//   src/app/favicon.ico (PNG-in-ICO, 48px)
// Correr:  node scripts/gen-icons.mjs

import sharp from 'sharp';
import fs from 'fs';

// Texto con separación RGB estilo glitch (magenta detrás-izquierda, cián detrás-derecha)
const glitchText = (x, y, size, text, ls = 0) => `
  <text x="${x - size * 0.045}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="${size}" letter-spacing="${ls}" fill="#ff00c8" text-anchor="middle" opacity="0.85">${text}</text>
  <text x="${x + size * 0.045}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="${size}" letter-spacing="${ls}" fill="#00f0ff" text-anchor="middle" opacity="0.85">${text}</text>
  <text x="${x}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="${size}" letter-spacing="${ls}" fill="#ffffff" text-anchor="middle">${text}</text>`;

const scanlines = (w, h) => {
  let out = '';
  for (let y = 0; y < h; y += 8) out += `<rect x="0" y="${y}" width="${w}" height="3" fill="#000" opacity="0.18"/>`;
  return out;
};

const stripe = (w, y, h) => `
  <defs><linearGradient id="rb${y}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ff00c8"/><stop offset="0.35" stop-color="#00f0ff"/>
    <stop offset="0.7" stop-color="#39ff88"/><stop offset="1" stop-color="#ff00c8"/>
  </linearGradient></defs>
  <rect x="0" y="${y}" width="${w}" height="${h}" fill="url(#rb${y})"/>`;

const iconSvg = (S) => `
<svg width="${S}" height="${S}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#030306"/>
  <radialGradient id="glow" cx="0.5" cy="0.42" r="0.75">
    <stop offset="0" stop-color="#2a0a35"/><stop offset="1" stop-color="#030306"/>
  </radialGradient>
  <rect width="512" height="512" fill="url(#glow)"/>
  ${stripe(512, 26, 10)}
  ${stripe(512, 476, 10)}
  <!-- barra de "tear" glitch -->
  <rect x="0" y="300" width="512" height="7" fill="#00f0ff" opacity="0.35"/>
  <rect x="60" y="300" width="392" height="3" fill="#ff00c8" opacity="0.55"/>
  ${glitchText(256, 248, 118, 'GLITCH', 2)}
  ${glitchText(256, 388, 96, 'AQP', 14)}
  ${scanlines(512, 512)}
</svg>`;

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#030306"/>
  <radialGradient id="glow" cx="0.5" cy="0.42" r="0.8">
    <stop offset="0" stop-color="#2a0a35"/><stop offset="1" stop-color="#030306"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${stripe(1200, 24, 12)}
  ${stripe(1200, 594, 12)}
  <rect x="0" y="330" width="1200" height="8" fill="#00f0ff" opacity="0.35"/>
  <rect x="140" y="330" width="920" height="3" fill="#ff00c8" opacity="0.55"/>
  ${glitchText(600, 280, 150, 'GLITCH AQP', 4)}
  <text x="600" y="400" font-family="Arial, sans-serif" font-weight="700" font-size="42"
    fill="#8fa3c4" text-anchor="middle">El club de nightcore de Arequipa ✦</text>
  <text x="600" y="470" font-family="Arial, sans-serif" font-weight="700" font-size="30"
    fill="#39ff88" text-anchor="middle">eventos · playlist del DJ · cosplay · comunidad</text>
  ${scanlines(1200, 630)}
</svg>`;

// PNG → ICO (contenedor ICO con una entrada PNG; válido en navegadores modernos)
function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(48, 0); entry.writeUInt8(48, 1);           // 48x48
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);      // planes, bpp
  entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12); // tamaño, offset
  return Buffer.concat([header, entry, png]);
}

const run = async () => {
  await sharp(Buffer.from(iconSvg(512))).png().toFile('public/icon-512x512.png');
  await sharp(Buffer.from(iconSvg(512))).resize(192, 192).png().toFile('public/icon-192x192.png');
  await sharp(Buffer.from(ogSvg)).png().toFile('public/og.png');
  const fav = await sharp(Buffer.from(iconSvg(512))).resize(48, 48).png().toBuffer();
  fs.writeFileSync('src/app/favicon.ico', pngToIco(fav));
  console.log('OK: icon-512, icon-192, og.png, favicon.ico generados');
};
run();
