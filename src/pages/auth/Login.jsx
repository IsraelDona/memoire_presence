import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FaceEnrollmentModal from '../../components/auth/FaceEnrollmentModal';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath, normalizeRole } from '../../services/authService';

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="11" width="15" height="9" rx="2.2" />
      <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" />
    </svg>
  );
}

function Login() {
  const { isAuthenticated, login, updateUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFaceEnrollmentPending, setIsFaceEnrollmentPending] = useState(false);
  const faceRedirectTimerRef = useRef(null);

  const needsFaceEnrollment = Boolean(
    isAuthenticated &&
      normalizeRole(user?.role) === 'AGENT' &&
      user?.visageEnregistre === false
  );

  useEffect(() => {
    if (isAuthenticated && !needsFaceEnrollment && !isFaceEnrollmentPending) {
      navigate(getDashboardPath(user?.role), { replace: true });
    }
  }, [isAuthenticated, needsFaceEnrollment, isFaceEnrollmentPending, navigate, user?.role]);

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(
    () => () => {
      if (faceRedirectTimerRef.current) {
        window.clearTimeout(faceRedirectTimerRef.current);
      }
    },
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await login({
        email: email.trim(),
        motDePasse: password,
      });

      if (result?.kind === 'authenticated' && result.session) {
        if (normalizeRole(result.session.role) === 'AGENT' && result.session.visageEnregistre === false) {
          setSuccess('Connexion validée. Enrôlement facial requis avant accès au tableau de bord.');
          return;
        }

        navigate(getDashboardPath(result.session.role), { replace: true });
        return;
      }

      setSuccess(result?.message || 'Connexion prise en compte.');
    } catch (requestError) {
      const apiMessage =
        requestError?.message ||
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        'Connexion impossible. Vérifie tes identifiants ou la disponibilité du backend.';
      setError(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="auth-dgb-page">
    <div className="auth-dgb-left">
      <div className="auth-dgb-brand">
        <span className="auth-dgb-mark">DGB</span>
        <span className="auth-dgb-sub">e-presence</span>
      </div>
      <h1>Bienvenue sur la plateforme de présence</h1>
      <p>Accédez à votre espace personnel sécurisé. Session JWT, redirection automatique selon votre rôle.</p>
      <div className="auth-dgb-pills">
        <span>🔐 JWT sécurisé</span>
        <span>👤 3 rôles</span>
        <span>📍 GPS actif</span>
      </div>
    </div>

    <div className="auth-dgb-right">
      <div className="auth-dgb-card">
        <div className="auth-dgb-card-head">
          <h2>Se connecter</h2>
          <p>Email professionnel et mot de passe</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-dgb-form">
          <label className="field-input-wrap">
            <span className="field-icon"><MailIcon /></span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email professionnel"
              autoComplete="email"
              required
            />
          </label>

          <label className="field-input-wrap">
            <span className="field-icon"><LockIcon /></span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button
            type="submit"
            className="auth-dgb-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-dgb-footer">
          <Link to="/register" className="link-muted">
            Pas encore de compte ? <strong>Demander un accès</strong>
          </Link>
        </div>
      </div>
    </div>

    <FaceEnrollmentModal
      open={needsFaceEnrollment}
      userName={user?.name || 'agent'}
      onClose={() => {
        setError("L'enrôlement facial est obligatoire avant accès à la plateforme.");
      }}
      onSuccess={(result) => {
        setError('');
        setIsFaceEnrollmentPending(true);
        setSuccess('Visage enregistré. Redirection...');
        if (faceRedirectTimerRef.current) {
          window.clearTimeout(faceRedirectTimerRef.current);
        }
        faceRedirectTimerRef.current = window.setTimeout(() => {
          updateUser({
            visageEnregistre: true,
            photoVisage: result?.photoVisage || user?.photoVisage || '',
          });
          setIsFaceEnrollmentPending(false);
          navigate(getDashboardPath(user?.role), { replace: true });
        }, 1400);
      }}
    />
  </div>
);
}

export default Login;
