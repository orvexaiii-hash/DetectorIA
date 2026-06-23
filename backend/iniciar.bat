@echo off
echo === DetectorIA Backend iniciando ===
echo Servidor disponible en: http://localhost:8000
echo Presiona Ctrl+C para detener
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
