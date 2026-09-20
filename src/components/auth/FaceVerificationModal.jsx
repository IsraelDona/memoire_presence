import { useEffect, useMemo, useRef, useState } from 'react';
import { verifyFaceImage } from '../../services/faceService';

function FaceVerificationModal(props) {
  const open = props.open ?? props.isOpen ?? props.visible ?? props.show ?? false;
  const onClose = props.onClose ?? props.onCancel ?? props.onDismiss;
  const onSuccess =
    props.onSuccess ?? props.onVerified ?? props.onValidated ?? props.onComplete;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [cameraKey, setCameraKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
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
      setIsVerifying(false);
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
      return 'Vérifier le visage';
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
    setStatusMessage('Image capturée. Clique sur Vérifier le visage pour lancer le pointage.');
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

  const handleVerify = async () => {
    if (!capturedImage || isVerifying) {
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const result = await verifyFaceImage(capturedImage);
      setStatusMessage(result?.message || 'Visage vérifié avec succès.');
      onSuccess?.(result);
    } catch (error) {
      setErrorMessage(error?.message || 'Reconnaissance faciale refusée.');
    } finally {
      setIsVerifying(false);
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
    <div className="face-verification-overlay">
      <div className="face-verification-modal">
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
              Vérification faciale
            </div>
            <h2 style={{ margin: 0, color: '#13294b', fontSize: '2rem', lineHeight: 1.1 }}>
              Confirme ton identité avant le pointage.
            </h2>
            <p style={{ margin: '12px 0 0', color: '#54627d', fontSize: '1rem', lineHeight: 1.6 }}>
              La caméra vérifie le visage courant avant de lancer l’enregistrement de présence.
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

        <div style={{ minWidth: 0 }}>
          <div className="face-verification-video-wrap">
            {canShowVideo ? (
              <video
                key={cameraKey}
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
            ) : (
              <img
                src={capturedImage}
                alt="Aperçu capturé"
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
                    onClick={handleVerify}
                    disabled={isVerifying}
                    style={{
                      border: 'none',
                      background: '#2f6fca',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '14px 22px',
                      borderRadius: '14px',
                      cursor: isVerifying ? 'wait' : 'pointer',
                      boxShadow: '0 12px 24px rgba(47, 111, 202, 0.28)',
                    }}
                  >
                    {isVerifying ? 'Vérification...' : 'Vérifier le visage'}
                  </button>
                </>
              )}
            </div>
          </div>

          {statusMessage ? (
            <div style={{ ...successCardStyle, marginTop: '16px' }}>{statusMessage}</div>
          ) : null}

          {errorMessage ? (
            <div style={{ ...errorCardStyle, marginTop: '16px' }}>{errorMessage}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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

export default FaceVerificationModal;
