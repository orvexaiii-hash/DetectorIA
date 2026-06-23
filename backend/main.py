from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import shutil
from detector import analyze_audio

app = FastAPI(title="DetectorIA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".opus", ".mp3", ".wav", ".m4a", ".ogg", ".aac"}


@app.get("/")
def root():
    return {"status": "ok", "service": "DetectorIA"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "audio.opus")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: {ext}")

    # Guardar archivo temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = analyze_audio(tmp_path)
        result["filename"] = file.filename
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)
