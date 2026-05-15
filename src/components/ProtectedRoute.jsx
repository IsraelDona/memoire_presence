import { Navigate, useLocation } from 'react-router-dom';
import { getDashboardPath, normalizeRole } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    const currentRole = normalizeRole(user?.role);
    const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role));

    if (!normalizedAllowedRoles.includes(currentRole)) {
      return <Navigate to={getDashboardPath(user?.role)} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
