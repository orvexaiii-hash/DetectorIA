import numpy as np
import librosa
import onnxruntime as ort
from huggingface_hub import hf_hub_download
import os

MODEL_REPO = "deepfake-audio-detection/audio-deepfake-detector-onnx"
MODEL_FILE = "model.onnx"
_session = None
_labels = ["real", "fake"]


def load_model():
    global _session
    if _session is None:
        print("Descargando modelo ONNX...")
        cache_dir = os.path.join(os.path.dirname(__file__), "models")
        os.makedirs(cache_dir, exist_ok=True)
        try:
            model_path = hf_hub_download(
                repo_id=MODEL_REPO,
                filename=MODEL_FILE,
                cache_dir=cache_dir,
            )
        except Exception:
            # Fallback: usar análisis acústico heurístico si el modelo no está disponible
            print("Modelo ONNX no disponible, usando análisis heurístico.")
            _session = "heuristic"
            return
        _session = ort.InferenceSession(model_path)
        print("Modelo ONNX listo.")


def analyze_audio(file_path: str) -> dict:
    load_model()

    audio, sr = librosa.load(file_path, sr=16000, mono=True)

    # Limitar a 10 segundos
    max_samples = 16000 * 10
    if len(audio) > max_samples:
        audio = audio[:max_samples]

    if _session == "heuristic":
        return _heuristic_analysis(audio, sr=16000)

    # Inferencia ONNX
    input_name = _session.get_inputs()[0].name
    audio_input = audio.reshape(1, -1).astype(np.float32)
    outputs = _session.run(None, {input_name: audio_input})
    probs = _softmax(outputs[0][0])

    fake_score = round(float(probs[1]) * 100, 2)
    real_score = round(float(probs[0]) * 100, 2)

    return {
        "fake_probability": fake_score,
        "real_probability": real_score,
        "verdict": _verdict(fake_score),
        "method": "model",
    }


def _heuristic_analysis(audio: np.ndarray, sr: int) -> dict:
    """
    Análisis acústico heurístico basado en características de voz sintética.
    No tan preciso como un modelo entrenado, pero funciona sin dependencias pesadas.
    """
    features = {}

    # 1. Flatness espectral — voces IA tienden a ser más "planas"
    spec_flatness = librosa.feature.spectral_flatness(y=audio)
    features["flatness_mean"] = float(np.mean(spec_flatness))

    # 2. ZCR — tasa de cruces por cero
    zcr = librosa.feature.zero_crossing_rate(audio)
    features["zcr_std"] = float(np.std(zcr))

    # 3. MFCCs — coeficientes mel-cepstrales, voz IA tiene distribución diferente
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    features["mfcc_std_mean"] = float(np.mean(np.std(mfccs, axis=1)))

    # 4. Regularidad del pitch — IA tiende a ser demasiado regular
    f0, voiced_flag, _ = librosa.pyin(audio, fmin=50, fmax=400, sr=sr)
    voiced_f0 = f0[voiced_flag] if voiced_flag is not None else np.array([])
    if len(voiced_f0) > 10:
        features["pitch_regularity"] = float(np.std(voiced_f0) / (np.mean(voiced_f0) + 1e-6))
    else:
        features["pitch_regularity"] = 0.1

    # Score heurístico combinado
    score = 0.0

    # Flatness alta → más sintético
    if features["flatness_mean"] > 0.15:
        score += 25
    elif features["flatness_mean"] > 0.08:
        score += 10

    # Pitch demasiado regular → más sintético
    if features["pitch_regularity"] < 0.05:
        score += 30
    elif features["pitch_regularity"] < 0.10:
        score += 15

    # ZCR muy baja variabilidad → más sintético
    if features["zcr_std"] < 0.02:
        score += 20
    elif features["zcr_std"] < 0.05:
        score += 10

    # MFCCs muy uniformes → más sintético
    if features["mfcc_std_mean"] < 8:
        score += 25
    elif features["mfcc_std_mean"] < 15:
        score += 10

    fake_score = min(round(score, 2), 99.0)
    real_score = round(100 - fake_score, 2)

    return {
        "fake_probability": fake_score,
        "real_probability": real_score,
        "verdict": _verdict(fake_score),
        "method": "heuristic",
        "features": features,
    }


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x))
    return e / e.sum()


def _verdict(fake_score: float) -> str:
    if fake_score >= 75:
        return "ALTO RIESGO: muy probablemente generado por IA"
    elif fake_score >= 45:
        return "RIESGO MEDIO: posiblemente generado por IA"
    elif fake_score >= 20:
        return "RIESGO BAJO: probablemente voz humana real"
    else:
        return "SEGURO: voz humana real"
