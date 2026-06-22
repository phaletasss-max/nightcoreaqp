// ── Moderación por filtros de palabras (Fase E) ──────────────────────────────
// El admin define palabras en la tabla banned_words. Cuando una publicación las
// contiene, se publica igual pero queda "flagged": en público se muestra
// censurada con *** hasta que el admin la apruebe (o la elimine).

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ¿El texto contiene alguna palabra prohibida? (case-insensitive, por substring)
export function hasBannedWord(text: string, words: string[]): boolean {
  if (!text || !words?.length) return false;
  const lower = text.toLowerCase();
  return words.some((w) => w && lower.includes(w.toLowerCase()));
}

// Reemplaza cada palabra prohibida por '*' de su misma longitud.
export function censorText(text: string, words: string[]): string {
  if (!text || !words?.length) return text;
  let out = text;
  for (const w of words) {
    if (!w) continue;
    const re = new RegExp(escapeRegExp(w), 'gi');
    out = out.replace(re, (m) => '*'.repeat(m.length));
  }
  return out;
}
