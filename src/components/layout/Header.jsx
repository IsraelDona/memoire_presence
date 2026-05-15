import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../services/authService';

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="app-topbar">
      <Link to="/" className="app-brand" aria-label="e-presence accueil">
        <span className="app-brand-mark">DGB</span>
        <span className="app-brand-text">
          <strong>e-presence</strong>
          <span>Gestion des présences</span>
        </span>
      </Link>

      <nav className="app-topbar-actions" aria-label="Actions principales">
        {isAuthenticated ? (
          <>
            <span className="app-user-chip">{user?.role || 'AGENT'}</span>
            <Link to={getDashboardPath(user?.role)} className="nav-action nav-action-primary">
              Mon espace
            </Link>
            <button type="button" className="nav-action nav-action-secondary" onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-action nav-action-primary">
              Connexion
            </Link>
            <Link to="/register" className="nav-action nav-action-secondary">
              Demander un compte
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
