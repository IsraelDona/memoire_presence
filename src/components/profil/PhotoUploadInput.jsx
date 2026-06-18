import { useRef, useState } from 'react';
import { updatePhotoProfil } from '../../services/profilService';
import { useAuth } from '../../context/AuthContext';

function PhotoUploadInput() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image trop lourde (max 2 Mo).');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await updatePhotoProfil(base64);

      updateUser({ photoProfil: base64 });
    } catch (err) {
      setError(
        err?.message || 'Impossible de mettre à jour la photo.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="photo-upload-wrap">
      <div className="photo-upload-preview">
        {user?.photoProfil ? (
          <img
            src={user.photoProfil}
            alt="Photo de profil"
            className="photo-upload-img"
          />
        ) : (
          <div className="photo-upload-placeholder">
            {(user?.nom || user?.name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="secondary-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? 'Envoi en cours...' : 'Choisir une photo'}
      </button>

      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

export default PhotoUploadInput;