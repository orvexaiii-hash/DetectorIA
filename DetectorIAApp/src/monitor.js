import RNFS from 'react-native-fs';
import { WHATSAPP_AUDIO_PATHS, SCAN_INTERVAL_MS } from './config';
import { analyzeAudio } from './api';

const AUDIO_EXTENSIONS = ['.opus', '.mp3', '.m4a', '.ogg', '.wav', '.aac'];
const _seenFiles = new Set();
let _intervalId = null;
let _onResult = null;
let _activePath = null;

export async function findWhatsAppFolder() {
  for (const path of WHATSAPP_AUDIO_PATHS) {
    try {
      const exists = await RNFS.exists(path);
      if (exists) return path;
    } catch {}
  }
  return null;
}

export async function startMonitor(onResult) {
  _onResult = onResult;
  _activePath = await findWhatsAppFolder();

  if (!_activePath) {
    onResult({ error: 'No se encontró la carpeta de WhatsApp' });
    return false;
  }

  // Marcar archivos existentes como ya vistos (no analizar el historial)
  try {
    const existing = await RNFS.readDir(_activePath);
    existing.forEach(f => _seenFiles.add(f.path));
  } catch {}

  _intervalId = setInterval(() => _scan(), SCAN_INTERVAL_MS);
  return true;
}

export function stopMonitor() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export function isMonitoring() {
  return _intervalId !== null;
}

async function _scan() {
  if (!_activePath) return;
  try {
    const files = await RNFS.readDir(_activePath);
    const newFiles = files.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext) && !_seenFiles.has(f.path);
    });

    for (const file of newFiles) {
      _seenFiles.add(file.path);
      _processFile(file);
    }
  } catch (e) {
    console.warn('Error escaneando carpeta:', e.message);
  }
}

async function _processFile(file) {
  const entry = {
    id: Date.now().toString(),
    filename: file.name,
    path: file.path,
    timestamp: new Date().toISOString(),
    status: 'analyzing',
  };

  _onResult({ type: 'analyzing', entry });

  try {
    const result = await analyzeAudio(file.path);
    const risk = _riskLevel(result.fake_probability);
    _onResult({
      type: 'result',
      entry: {
        ...entry,
        status: 'done',
        fake_probability: result.fake_probability,
        real_probability: result.real_probability,
        verdict: result.verdict,
        risk,
      },
    });
  } catch (e) {
    _onResult({
      type: 'error',
      entry: { ...entry, status: 'error', error: e.message },
    });
  }
}

function _riskLevel(fakeProbability) {
  if (fakeProbability >= 75) return 'high';
  if (fakeProbability >= 45) return 'medium';
  if (fakeProbability >= 20) return 'low';
  return 'safe';
}
