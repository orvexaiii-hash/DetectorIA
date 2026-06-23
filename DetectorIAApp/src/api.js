import { API_URL } from './config';

export async function analyzeAudio(filePath) {
  const fileName = filePath.split('/').pop();
  const ext = fileName.split('.').pop().toLowerCase();

  const mimeTypes = {
    opus: 'audio/opus',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/m4a',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
  };

  const formData = new FormData();
  formData.append('file', {
    uri: `file://${filePath}`,
    name: fileName,
    type: mimeTypes[ext] || 'audio/opus',
  });

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return response.json();
}

export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}
