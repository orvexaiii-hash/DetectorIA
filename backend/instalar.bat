@echo off
echo === DetectorIA - Instalando dependencias ===
python -m pip install --upgrade pip
pip install -r requirements.txt
echo.
echo === Instalacion completa ===
echo Para iniciar el servidor ejecuta: iniciar.bat
pause
