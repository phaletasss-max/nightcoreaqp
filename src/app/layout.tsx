import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";

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
  title: "Nightcore AQP — El club de nightcore de Arequipa",
  description: "Eventos, playlist colaborativa, concurso de disfraces, encuestas y rachas. El club de nightcore de Arequipa, organizado por Yorch. Hecho por Los Simpatizantes de JP.",
  keywords: ["Nightcore", "Arequipa", "AQP", "Eventos", "Anime", "Eurobeat", "Playlist", "Cosplay"],
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
          <Navbar />

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="w-full border-t border-border py-8 text-center text-muted text-xs">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} Nightcore AQP — organiza Yorch · hecho por <span className="text-muted-2 font-semibold">Los Simpatizantes de JP</span>. Proyecto público, sin fines de lucro.</p>
              <div className="flex space-x-5">
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-neon-pink transition-colors">YouTube</a>
                <a href="https://spotify.com" target="_blank" rel="noreferrer" className="hover:text-neon-cyan transition-colors">Spotify</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-neon-purple transition-colors">Instagram</a>
                <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">WhatsApp</a>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
