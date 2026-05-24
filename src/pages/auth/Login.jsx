import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../services/authService';

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
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardPath(user?.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

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
    <div className="auth-page auth-page-modern">
      <AuthShell
        eyebrow="Accès sécurisé"
        title="Connexion professionnelle à la plateforme DGB"
        description="Accède à ton espace en toute sécurité avec un compte actif. Les comptes agents doivent être validés avant activation."
        highlights={[
          { title: 'JWT', text: 'Session sécurisée et persistante.' },
          { title: 'Rôles', text: 'Redirection automatique selon le profil.' },
          { title: 'Validation', text: 'Accès réservé aux comptes actifs.' },
        ]}
      >
        <div className="auth-card-panel">
          <div className="auth-card-head">
            <div>
              <h2>Se connecter</h2>
              <p>Utilise ton email professionnel et ton mot de passe.</p>
            </div>
            <span className="auth-status-pill">Connexion sécurisée</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field-input-wrap">
              <span className="field-icon">
                <MailIcon />
              </span>
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
              <span className="field-icon">
                <LockIcon />
              </span>
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

            <button type="submit" className="primary-button full-width auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-card-footer">
            <Link to="/register" className="link-muted">
              Nouveau compte agent ? <strong>Demander un accès</strong>
            </Link>
          </div>
        </div>
      </AuthShell>
    </div>
  );
}

export default Login;
