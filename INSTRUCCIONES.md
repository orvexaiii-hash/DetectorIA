# DetectorIA - Instrucciones

## Estructura del proyecto

```
DetectorIA/
├── backend/          ← servidor Python (corre en tu PC)
│   ├── main.py
│   ├── detector.py
│   ├── instalar.bat
│   └── iniciar.bat
└── DetectorIAApp/    ← app Android (React Native)
```

---

## 1. Configurar el backend (PC)

```
cd backend
instalar.bat       ← solo la primera vez
iniciar.bat        ← cada vez que quieras usarlo
```

El servidor queda en http://localhost:8000

---

## 2. Configurar la IP en la app

Abrí `DetectorIAApp/src/config.js` y cambiá:

```js
export const API_URL = 'http://TU_IP_LOCAL:8000';
```

Para saber tu IP: abrí cmd y ejecutá `ipconfig`
Buscá "Dirección IPv4" (algo como 192.168.1.X)

---

## 3. Instalar Android Studio

1. Descargá Android Studio desde https://developer.android.com/studio
2. Durante la instalación, aceptá instalar el SDK de Android
3. Una vez instalado, abrí la carpeta DetectorIAApp/android desde Android Studio

---

## 4. Compilar y correr la app

Con tu celular Android conectado por USB (activá "Depuración USB" en Opciones de desarrollador):

```
cd DetectorIAApp
npm install
npx react-native run-android
```

---

## 5. Cómo usar

1. Asegurate que el backend esté corriendo (`iniciar.bat`)
2. Abrí la app en el celular
3. Tocá "Iniciar monitoreo"
4. Aceptá los permisos de almacenamiento
5. A partir de ahora, cada audio de WhatsApp que recibas será analizado automáticamente

---

## Qué significan los resultados

| Resultado | Significado |
|-----------|-------------|
| 🚨 ALTO RIESGO (>75%) | Muy probablemente generado por IA |
| ⚠️ RIESGO MEDIO (45-75%) | Posiblemente generado por IA |
| 🟡 RIESGO BAJO (20-45%) | Probablemente voz humana |
| ✅ SEGURO (<20%) | Voz humana real |
