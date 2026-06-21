import os
import subprocess
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import yt_dlp
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InfoReq(BaseModel):
    url: str

class DownReq(BaseModel):
    url: str
    format: Optional[str] = 'mp4'
    quality: Optional[str] = 'best'

def validate_url(url: str) -> bool:
    supported = ['youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com']
    return any(p in url.lower() for p in supported)

@app.get("/health")
def health():
    return {"status": "OK", "python_yt_dlp": True}

@app.post("/api/info")
def info_post(req: InfoReq):
    if not validate_url(req.url):
        return {"available": False, "embeddable": False, "error": "URL no soportada"}
    
    ydl_opts = {'noplaylist': True, 'quiet': True, 'no_warnings': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=False)
            # Embeddable check
            embeddable = info.get('availability', 'public') == 'public' and not info.get('is_live')
            return {
                "available": True,
                "embeddable": embeddable,
                "title": info.get('title'),
                "author": info.get('uploader'),
                "duration": info.get('duration'),
                "thumbnail": info.get('thumbnail'),
                "platform": info.get('extractor'),
                "availability": info.get('availability', 'public')
            }
    except Exception as e:
        return {"available": False, "embeddable": False, "error": str(e)}

def build_args(url, fmt, quality):
    args = ['yt-dlp', '--no-playlist']
    if fmt == 'mp3':
        args += ['-x', '--audio-format', 'mp3', '--audio-quality', '0']
    elif 'tiktok.com' in url.lower():
        args += [
            '-f', 'best[ext=mp4][vcodec~="^((?!hevc).)*$"]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4',
            '--postprocessor-args', 'ffmpeg:-c:v libx264 -preset fast -crf 23'
        ]
    else:
        args += ['-f', 'best[ext=mp4]/best', '--merge-output-format', 'mp4']
    
    args += ['-o', '-', url]
    return args

def stream_download(url, fmt, quality):
    args = build_args(url, fmt, quality)
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        while True:
            chunk = proc.stdout.read(8192)
            if not chunk:
                break
            yield chunk
    finally:
        proc.stdout.close()
        if proc.poll() is None:
            proc.kill()

@app.post("/api/download")
def download_post(req: DownReq):
    if not validate_url(req.url):
        raise HTTPException(status_code=400, detail="URL no soportada")
    
    media_type = "audio/mpeg" if req.format == 'mp3' else "video/mp4"
    return StreamingResponse(stream_download(req.url, req.format, req.quality), media_type=media_type)

@app.get("/api/download")
def download_get(url: str, format: str = 'mp4', quality: str = 'best'):
    if not validate_url(url):
        raise HTTPException(status_code=400, detail="URL no soportada")
    
    media_type = "audio/mpeg" if format == 'mp3' else "video/mp4"
    return StreamingResponse(stream_download(url, format, quality), media_type=media_type)

@app.post("/api/store")
def store_post(req: DownReq):
    # Mock para storage local o simplemente retornar URL de proxy
    # En un entorno real se subiría a Supabase Storage
    return {"url": f"http://localhost:8787/api/download?url={req.url}&format={req.format}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8787)
