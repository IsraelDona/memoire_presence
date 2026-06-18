import api from '../api/axiosConfig';

function readApiMessage(data, fallback = '') {
  if (typeof data === 'string') {
    return data.trim() || fallback;
  }

  if (data && typeof data === 'object') {
    return String(
      data.message ?? data.error ?? data.detail ?? fallback
    ).trim() || fallback;
  }

  return fallback;
}

function readFaceServiceError(error) {
  const status = error?.response?.status;
  const apiMessage = readApiMessage(error?.response?.data, '');

  if (status === 403) {
    return apiMessage || 'Accès refusé par le backend (403).';
  }

  if (status === 401) {
    return apiMessage || 'Session invalide ou expirée.';
  }

  if (status === 400) {
    return apiMessage || "Le backend a rejeté l'image.";
  }

  return apiMessage || error?.message || "Impossible d'enregistrer le visage.";
}

const FACE_ENROLL_ENDPOINT =
  process.env.REACT_APP_FACE_ENROLL_ENDPOINT || '/api/auth/register-face';

const FACE_VERIFY_ENDPOINT =
  process.env.REACT_APP_FACE_VERIFY_ENDPOINT || '/api/presences/verifier-visage';

function buildImagePayload(photoVisage) {
  const base64 = String(photoVisage ?? '').trim();

  if (!base64) {
    throw new Error('Image visage invalide.');
  }

  return {
    photoVisage: base64,
    photoBase64: base64,
    imageBase64: base64,
  };
}

async function postFaceImage(endpoint, photoVisage) {
  const payload = buildImagePayload(photoVisage);

  const response = await api.post(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    message: readApiMessage(
      response?.data,
      'Opération visage réussie'
    ),
    status: response?.status,
    data: response?.data,
  };
}

async function enrollFaceImage(photoVisage) {
  try {
    return await postFaceImage(FACE_ENROLL_ENDPOINT, photoVisage);
  } catch (error) {
    throw new Error(readFaceServiceError(error));
  }
}

async function verifyFaceImage(photoVisage) {
  try {
    return await postFaceImage(FACE_VERIFY_ENDPOINT, photoVisage);
  } catch (error) {
    throw new Error(readFaceServiceError(error));
  }
}

export {
  enrollFaceImage,
  verifyFaceImage,
};
