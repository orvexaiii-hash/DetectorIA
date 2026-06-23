// Cambiá esta IP por la IP de tu PC en la red local
// Para encontrarla: abrí cmd y ejecutá "ipconfig"
export const API_URL = 'https://detectoria-production.up.railway.app';

export const WHATSAPP_AUDIO_PATHS = [
  '/storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Audio',
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio',
  '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Audio',
  '/sdcard/WhatsApp/Media/WhatsApp Audio',
];

export const SCAN_INTERVAL_MS = 3000; // chequea cada 3 segundos

export const RISK_COLORS = {
  high: '#E53E3E',
  medium: '#DD6B20',
  low: '#D69E2E',
  safe: '#38A169',
  unknown: '#718096',
};
