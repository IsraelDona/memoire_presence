import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchServices } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7.5" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h8A1.5 1.5 0 0 1 17.5 6v12A1.5 1.5 0 0 1 16 19.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z" />
      <path d="M10 17h4" />
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

function Register() {
  const { isAuthenticated, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimerRef = useRef(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: '',
    serviceId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const role =
        user?.role === 'ADMIN'
          ? '/admin/dashboard'
          : user?.role === 'CHEF_SERVICE'
            ? '/chefservice/dashboard'
            : '/agent/dashboard';
      navigate(role, { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  useEffect(() => {
    fetchServices()
      .then((data) => setServices(data || []))
      .finally(() => setIsLoadingServices(false));
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(
    () => () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.motDePasse !== form.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        motDePasse: form.motDePasse,
        serviceId: form.serviceId || undefined,
      });

      const message = response?.message || 'Compte créé. En attente de validation admin.';
      setSuccess(message);
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message },
        });
      }, 900);
    } catch (requestError) {
      const apiMessage =
        requestError?.message ||
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        'Impossible de créer le compte. Vérifie la connexion au backend.';
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
        <h1>Rejoindre la plateforme DGB</h1>
        <p>Soumettez votre demande. Votre compte sera activé après validation par l'administrateur.</p>
        <div className="auth-dgb-pills">
          <span>✅ Validation admin</span>
          <span>🔒 Compte sécurisé</span>
          <span>📧 Notification mail</span>
        </div>
      </div>

      <div className="auth-dgb-right">
        <div className="auth-dgb-card">
          <div className="auth-dgb-card-head">
            <h2>Demande d'inscription</h2>
            <p>Informations professionnelles de l'agent</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-dgb-form">
            <div className="auth-grid-two">
              <label className="field-input-wrap">
                <span className="field-icon"><UserIcon /></span>
                <input name="nom" type="text" value={form.nom}
                  onChange={handleChange} placeholder="Nom"
                  autoComplete="family-name" required />
              </label>
              <label className="field-input-wrap">
                <span className="field-icon"><UserIcon /></span>
                <input name="prenom" type="text" value={form.prenom}
                  onChange={handleChange} placeholder="Prénom"
                  autoComplete="given-name" required />
              </label>
            </div>

            <label className="field-input-wrap">
              <span className="field-icon"><MailIcon /></span>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="Email professionnel"
                autoComplete="email" required />
            </label>

            <label className="field-input-wrap">
              <span className="field-icon"><PhoneIcon /></span>
              <input name="telephone" type="tel" value={form.telephone}
                onChange={handleChange} placeholder="Téléphone"
                autoComplete="tel" required />
            </label>

            <label className="field-input-wrap">
              <span className="field-icon"><LockIcon /></span>
              <input name="motDePasse" type="password" value={form.motDePasse}
                onChange={handleChange} placeholder="Mot de passe"
                autoComplete="new-password" required />
            </label>

            <label className="field-input-wrap field-input-wrap-plain">
              <input name="confirmMotDePasse" type="password"
                value={form.confirmMotDePasse} onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                autoComplete="new-password" required />
            </label>

            <label className="field-input-wrap field-input-wrap-plain">
              <select
                name="serviceId"
                value={form.serviceId}
                onChange={handleChange}
                required
                disabled={isLoadingServices}
              >
                <option value="">
                  {isLoadingServices ? 'Chargement des services...' : 'Sélectionnez votre service'}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nom}
                  </option>
                ))}
              </select>
            </label>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <button type="submit" className="auth-dgb-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </form>

          <div className="auth-dgb-footer">
            <Link to="/login" className="link-muted">
              Déjà un compte ? <strong>Se connecter</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
