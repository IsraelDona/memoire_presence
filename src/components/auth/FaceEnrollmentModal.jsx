import { useEffect, useMemo, useRef, useState } from 'react';
import { enrollFaceImage } from '../../services/faceService';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.68)',
  backdropFilter: 'blur(8px)',
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const modalStyle = {
  width: 'min(1180px, 100%)',
  maxHeight: '92vh',
  overflow: 'auto',
  borderRadius: '28px',
  background: '#fff',
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.35)',
  padding: '28px',
};

function FaceEnrollmentModal(props) {
  const open = props.open ?? props.isOpen ?? props.visible ?? props.show ?? false;
  const user = props.user ?? {};
  const userName =
    props.userName ??
    props.name ??
    ([user.prenom, user.nom].filter(Boolean).join(' ').trim() || 'agent');

  const onClose = props.onClose ?? props.onCancel ?? props.onDismiss;
  const onSuccess =
    props.onSuccess ?? props.onCaptured ?? props.onValidated ?? props.onComplete;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [cameraKey, setCameraKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const canShowVideo = open && !capturedImage;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    if (!open) {
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsStarting(true);

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    } catch (error) {
      setErrorMessage(
        error?.message ||
          'Impossible d’ouvrir la caméra. Vérifie les permissions du navigateur.'
      );
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage('');
      setStatusMessage('');
      setErrorMessage('');
      setIsSaving(false);
      setIsStarting(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cameraKey]);

  const captureLabel = useMemo(() => {
    if (capturedImage) {
      return 'Enregistrer le visage';
    }

    return isStarting ? 'Ouverture caméra...' : 'Capturer le visage';
  }, [capturedImage, isStarting]);

  const handleCapture = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setErrorMessage('La caméra n’est pas encore prête.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setErrorMessage('Impossible de préparer la capture.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    setStatusMessage('Image capturée. Clique sur Enregistrer le visage pour valider.');
    setErrorMessage('');
    stopCamera();
  };

  const handleRetake = () => {
    stopCamera();
    setCapturedImage('');
    setStatusMessage('');
    setErrorMessage('');
    setCameraKey((value) => value + 1);
  };

  const handleSave = async () => {
    if (!capturedImage || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const result = await enrollFaceImage(capturedImage);

      setStatusMessage(result?.message || 'Visage enregistré avec succès.');

      onSuccess?.(result);
    } catch (error) {
      setErrorMessage(error?.message || "Impossible d'enregistrer le visage.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage('');
    setStatusMessage('');
    setErrorMessage('');
    onClose?.();
  };

  if (!open) {
    return null;
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 16px',
              borderRadius: '999px',
              background: 'rgba(37, 99, 235, 0.1)',
              color: '#2f5da6',
              fontWeight: 700,
              letterSpacing: '0.04em',
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}>
              Enrôlement facial obligatoire
            </div>
            <h2 style={{ margin: 0, color: '#13294b', fontSize: '2rem', lineHeight: 1.1 }}>
              Bonjour {userName}, enregistre ton visage une seule fois.
            </h2>
            <p style={{ margin: '12px 0 0', color: '#54627d', fontSize: '1rem', lineHeight: 1.6 }}>
              Cette étape sécurise ton accès avant le dashboard. La caméra sert uniquement à sauvegarder ton visage dans le backend.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            style={{
              border: 'none',
              background: '#eef4fd',
              width: '54px',
              height: '54px',
              borderRadius: '999px',
              color: '#13294b',
              fontSize: '1.4rem',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 0.8fr)',
          gap: '18px',
          alignItems: 'stretch',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              position: 'relative',
              borderRadius: '26px',
              overflow: 'hidden',
              minHeight: '620px',
              background: 'linear-gradient(180deg, #eaf2ff 0%, #f5f9ff 100%)',
              border: '1px solid rgba(168, 190, 221, 0.55)',
            }}>
              {canShowVideo ? (
                <video
                  key={cameraKey}
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '620px',
                    objectFit: 'cover',
                    display: 'block',
                    background: '#dfe9fb',
                  }}
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Aperçu capturé"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '620px',
                    objectFit: 'cover',
                    display: 'block',
                    background: '#dfe9fb',
                  }}
                />
              )}

              <div style={{
                position: 'absolute',
                left: '24px',
                right: '24px',
                bottom: '22px',
                borderRadius: '24px',
                background: 'rgba(16, 24, 40, 0.55)',
                backdropFilter: 'blur(18px)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                {!capturedImage ? (
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isStarting}
                    style={{
                      border: 'none',
                      background: '#2f6fca',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '14px 22px',
                      borderRadius: '14px',
                      cursor: isStarting ? 'wait' : 'pointer',
                      boxShadow: '0 12px 24px rgba(47, 111, 202, 0.28)',
                    }}
                  >
                    {captureLabel}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      style={{
                        border: 'none',
                        background: '#e9eef9',
                        color: '#13294b',
                        fontWeight: 700,
                        fontSize: '1rem',
                        padding: '14px 22px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Reprendre la photo
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        border: 'none',
                        background: '#2f6fca',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        padding: '14px 22px',
                        borderRadius: '14px',
                        cursor: isSaving ? 'wait' : 'pointer',
                        boxShadow: '0 12px 24px rgba(47, 111, 202, 0.28)',
                      }}
                    >
                      {isSaving ? 'Enregistrement...' : 'Enregistrer le visage'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gap: '18px',
            alignContent: 'start',
          }}>
            <div style={infoCardStyle}>
              <h3 style={cardTitleStyle}>Consignes</h3>
              <p style={cardTextStyle}>
                Place ton visage au centre, évite les contre-jours et reste immobile pendant la capture.
              </p>
            </div>

            <div style={infoCardStyle}>
              <h3 style={cardTitleStyle}>Statut</h3>
              <p style={cardTextStyle}>
                {capturedImage
                  ? 'Image capturée. Clique sur Enregistrer le visage pour valider.'
                  : isStarting
                    ? 'Ouverture de la caméra...'
                    : 'Positionne ton visage au centre et clique sur Capturer le visage.'}
              </p>
            </div>

            {statusMessage ? (
              <div style={successCardStyle}>{statusMessage}</div>
            ) : null}

            {errorMessage ? (
              <div style={errorCardStyle}>{errorMessage}</div>
            ) : null}

            {capturedImage ? (
              <div style={infoCardStyle}>
                <h3 style={cardTitleStyle}>Aperçu capturé</h3>
                <p style={cardTextStyle}>Tu peux recommencer si le cadrage n’est pas bon.</p>
                <button
                  type="button"
                  onClick={handleRetake}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    border: 'none',
                    background: '#e9eef9',
                    color: '#13294b',
                    fontWeight: 700,
                    fontSize: '1rem',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Reprendre la photo
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const infoCardStyle = {
  borderRadius: '24px',
  border: '1px dashed rgba(168, 190, 221, 0.6)',
  background: '#fff',
  padding: '22px',
  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.04)',
};

const successCardStyle = {
  borderRadius: '18px',
  border: '1px solid rgba(34, 197, 94, 0.25)',
  background: 'rgba(240, 253, 244, 0.95)',
  color: '#166534',
  padding: '16px 18px',
  fontWeight: 600,
};

const errorCardStyle = {
  borderRadius: '18px',
  border: '1px solid rgba(248, 113, 113, 0.28)',
  background: 'rgba(254, 242, 242, 0.98)',
  color: '#b91c1c',
  padding: '16px 18px',
  fontWeight: 600,
};

const cardTitleStyle = {
  margin: 0,
  color: '#13294b',
  fontSize: '1.02rem',
  fontWeight: 800,
};

const cardTextStyle = {
  margin: '10px 0 0',
  color: '#54627d',
  lineHeight: 1.6,
};

export default FaceEnrollmentModal;
