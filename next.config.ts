import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las rutas. NO se incluye una CSP estricta a
// propósito: el sitio embebe iframes de YouTube, imágenes de i.ytimg y Supabase
// Storage; una CSP mal calibrada rompería producción (queda para una fase con
// pruebas dedicadas). Estas cabeceras suben el nivel sin ese riesgo.
const securityHeaders = [
  // Evita que el navegador "adivine" tipos MIME (mitiga ataques de tipo).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Evita que otros sitios embeban el nuestro en un iframe (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // No filtrar la URL completa como referer a orígenes externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva APIs del navegador que la web no usa.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
