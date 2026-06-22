import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import { PlayerProvider } from "@/context/PlayerContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import DesignLoader from "@/components/DesignLoader";

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

export const metadata: Metadata = {
  title: "Nightcore AQP — El club de nightcore de Arequipa ✦",
  description: "Eventos, playlist colaborativa, concurso de disfraces, encuestas y rachas. El club de nightcore de Arequipa, organizado por Yorch. Hecho por Los Simpatizantes de JP. Estilo scenecore. 🎵",
  keywords: ["Nightcore", "Arequipa", "AQP", "Eventos", "Anime", "Eurobeat", "Playlist", "Cosplay", "Scenecore", "Scene", "Emo"],
  authors: [{ name: "Los Simpatizantes de JP" }],
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
            <DesignLoader />
            <GlobalPlayer />
            <Navbar />

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 relative">
              {children}
            </main>

          <footer className="w-full border-t py-8 text-center text-muted text-xs" style={{ borderColor: 'rgba(255, 0, 255, 0.15)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} <span className="text-neon-magenta font-bold">Nightcore AQP</span> — organiza Yorch · hecho por <span className="text-neon-cyan font-semibold">Los Simpatizantes de JP</span>. Proyecto público, sin fines de lucro.</p>
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
