import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import { PlayerProvider } from "@/context/PlayerContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import DesignLoader from "@/components/DesignLoader";
import PageVideoManager from "@/components/PageVideoManager";
import CRTBoot from "@/components/CRTBoot";
import Assistant from "@/components/Assistant";
import NeonSpotlight from "@/components/NeonSpotlight";
import PWARegister from "@/components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const SITE_URL = "https://nightcoreaqp-five.vercel.app";
// Imagen para compartir (Open Graph): banner 1200x630 con el branding Glitch AQP.
// Se regenera junto con los íconos: `node scripts/gen-icons.mjs`.
const OG_IMAGE = "/og.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Glitch AQP — El club de nightcore de Arequipa ✦",
  description: "Eventos, playlist colaborativa, concurso de disfraces, encuestas y rachas. El club de nightcore de Arequipa, organizado por Yorch. Hecho por Los Simpatizantes de JP. Estilo glitch/scenecore. 🎵",
  keywords: ["Glitch", "Nightcore", "Arequipa", "AQP", "Eventos", "Anime", "Eurobeat", "Playlist", "Cosplay", "Scenecore", "Scene", "Emo"],
  authors: [{ name: "Los Simpatizantes de JP" }],
  // PWA: nombre y barra de estado al instalar en iOS.
  appleWebApp: { capable: true, title: "Glitch AQP", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    siteName: "Glitch AQP",
    title: "Glitch AQP — El club de nightcore de Arequipa ✦",
    description: "Eventos, playlist colaborativa, concurso de disfraces y más. El club de nightcore de Arequipa. 🎵",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Glitch AQP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glitch AQP — El club de nightcore de Arequipa ✦",
    description: "Eventos, playlist colaborativa, concurso de disfraces y más. Estilo glitch. 🎵",
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col app-bg">
        <AuthProvider>
          <PlayerProvider>
            <PWARegister />
            <DesignLoader />
            {/* Videos de fondo: SOLO via el gestor del admin (Diseño → Videos de fondo
                por página, clave 'all' = todo el sitio) o el idle de la radia (GlobalPlayer).
                El video automático del tema glitch se quitó para no superponer. */}
            <PageVideoManager />
            <CRTBoot />
            <GlobalPlayer />
            <Assistant />
            <NeonSpotlight />
            <Navbar />

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 relative">
              {children}
            </main>

          <footer className="w-full border-t py-8 text-center text-muted text-xs" style={{ borderColor: 'rgba(255, 0, 255, 0.15)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} <span className="text-neon-magenta font-bold">Glitch AQP</span> — organiza Yorch · hecho por <span className="text-neon-cyan font-semibold">Los Simpatizantes de JP</span>. Proyecto público, sin fines de lucro.</p>
              <div className="flex space-x-5">
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-neon-magenta transition-colors">YouTube</a>
                <a href="https://spotify.com" target="_blank" rel="noreferrer" className="hover:text-neon-cyan transition-colors">Spotify</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-neon-purple transition-colors">Instagram</a>
                <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="hover:text-neon-lime transition-colors">WhatsApp</a>
              </div>
            </div>
          </footer>
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
