// ── Conversor de archivos ────────────────────────────────────────────────────
// Adaptado de bot-erp (src/converters/fileConverter.js). Usa binarios del sistema:
//   · LibreOffice (soffice)  → PDF ⇄ Word
//   · ImageMagick (convert)  → JPG/PNG/WebP
//   · FFmpeg (ffmpeg)        → MP4 → MP3
// Requiere esos binarios instalados en el servidor (Arch).

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function rid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function log(level, msg) {
  console.log(`[${new Date().toISOString()}] [CONVERTER][${level}] ${msg}`);
}

class FileConverter {
  constructor() {
    this.tempDir = path.join(__dirname, '../tmp-convert');
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir, { recursive: true });
  }

  // ── Conversiones expuestas ──
  pdfToWord(input) { return this.libreoffice(input, 'docx'); }
  wordToPdf(input) { return this.libreoffice(input, 'pdf'); }
  jpgToPng(input) { return this.image(input, 'png'); }
  pngToJpg(input) { return this.image(input, 'jpg'); }
  webpToJpg(input) { return this.image(input, 'jpg'); }
  jpgToWebp(input) { return this.image(input, 'webp'); }
  mp4ToMp3(input) { return this.ffmpeg(input, 'mp3', ['-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k']); }

  // ── Motores ──
  libreoffice(input, outExt) {
    const outDir = path.join(this.tempDir, rid());
    fs.mkdirSync(outDir, { recursive: true });
    const args = ['--headless', '--convert-to', outExt, '--outdir', outDir, input];
    log('LIBREOFFICE', `${path.basename(input)} -> ${outExt}`);
    return new Promise((resolve, reject) => {
      const p = spawn('soffice', args);
      let err = '';
      p.stderr.on('data', (d) => (err += d.toString()));
      p.on('error', () => reject(new Error('LibreOffice (soffice) no disponible')));
      p.on('close', (code) => {
        if (code !== 0) return reject(new Error('Error en conversión LibreOffice: ' + err));
        const file = fs.readdirSync(outDir).find((f) => f.endsWith(`.${outExt}`));
        if (!file) return reject(new Error('Archivo de salida no encontrado'));
        resolve({ path: path.join(outDir, file), filename: file, cleanup: () => this.rm(outDir) });
      });
    });
  }

  image(input, outExt, extra = []) {
    const out = path.join(this.tempDir, `${rid()}.${outExt}`);
    const args = [input, ...extra, out];
    log('IMAGEMAGICK', `${path.basename(input)} -> ${outExt}`);
    return new Promise((resolve, reject) => {
      const p = spawn('convert', args);
      let err = '';
      p.stderr.on('data', (d) => (err += d.toString()));
      p.on('error', () => reject(new Error('ImageMagick (convert) no disponible')));
      p.on('close', (code) => {
        if (code !== 0) return reject(new Error('Error en conversión de imagen: ' + err));
        resolve({ path: out, filename: path.basename(out), cleanup: () => this.rm(out) });
      });
    });
  }

  ffmpeg(input, outExt, extra = []) {
    const out = path.join(this.tempDir, `${rid()}.${outExt}`);
    const args = ['-i', input, ...extra, '-y', out];
    log('FFMPEG', `${path.basename(input)} -> ${outExt}`);
    return new Promise((resolve, reject) => {
      const p = spawn('ffmpeg', args);
      let err = '';
      p.stderr.on('data', (d) => (err += d.toString()));
      p.on('error', () => reject(new Error('FFmpeg no disponible')));
      p.on('close', (code) => {
        if (code !== 0) return reject(new Error('Error en conversión FFmpeg: ' + err.slice(0, 300)));
        resolve({ path: out, filename: path.basename(out), cleanup: () => this.rm(out) });
      });
    });
  }

  rm(target) {
    try {
      if (!fs.existsSync(target)) return;
      const st = fs.statSync(target);
      if (st.isDirectory()) fs.rmSync(target, { recursive: true, force: true });
      else fs.unlinkSync(target);
    } catch { /* noop */ }
  }
}

module.exports = FileConverter;
