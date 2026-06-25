'use client';

// ── Navbar — Scenecore edition ───────────────────────────────────────────────
// Navegación principal con logo, enlaces, racha, puntos y auth.

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Music, Calendar, Camera, User, Bell, Download,
  Flame, Coins, Menu, X, LogIn, LogOut, Sparkles, MessageCircle, Inbox
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';
import { Trophy } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { profile, configured, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Admin/Consola DJ no va en el nav público: se entra por /admin con rol dj/admin.
  const navItems = [
    { name: 'Eventos', href: '/', icon: Calendar },
    { name: 'Playlist', href: '/playlist', icon: Music },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Buzón', href: '/sugerencias', icon: Inbox },
    { name: 'Disfraces', href: '/disfraces', icon: Camera },
    { name: 'Historial', href: '/history', icon: Trophy },
    { name: 'Descargas', href: '/perfil/descargas', icon: Download },
    { name: 'Perfil', href: '/perfil', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md" style={{ borderColor: 'rgba(255, 0, 255, 0.15)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-magenta/15 border border-neon-magenta/30">
              <Sparkles className="h-5 w-5 text-neon-magenta glow-magenta" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              NIGHTCORE<span className="text-glow-rainbow">AQP</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-neon-magenta/10 text-neon-magenta'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {profile && (
              <>
                <Link href="/perfil" className="relative p-1.5 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors" title="Notificaciones">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-neon-magenta" />
                </Link>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-border text-orange-400" title="Racha diaria">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs font-bold">{profile.streak_count}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-border text-neon-cyan" title="Puntos">
                  <Coins className="h-4 w-4" />
                  <span className="text-xs font-bold">{profile.points}</span>
                </div>
              </>
            )}
            {profile && configured ? (
              <button onClick={() => signOut()} className="btn btn-ghost px-3 py-1.5 text-xs" title="Cerrar sesión">
                <LogOut className="h-4 w-4" /> Salir
              </button>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="btn btn-primary px-3 py-1.5 text-xs">
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            )}
          </div>

          {/* Mobile button */}
          <div className="flex md:hidden items-center gap-3">
            {profile && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-border text-neon-cyan">
                <Coins className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">{profile.points}</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t px-4 pt-2 pb-4 space-y-1 bg-background" style={{ borderColor: 'rgba(255, 0, 255, 0.15)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive ? 'bg-neon-magenta/10 text-neon-magenta' : 'text-muted hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t" style={{ borderColor: 'rgba(255, 0, 255, 0.15)' }}>
            {profile && configured ? (
              <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="btn btn-ghost w-full">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            ) : (
              <button onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }} className="btn btn-primary w-full">
                <LogIn className="h-4 w-4" /> Entrar / Registrarse
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
