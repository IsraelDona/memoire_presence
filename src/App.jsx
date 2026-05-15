import './App.css';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { getDashboardPath } from './services/authService';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AgentDashboard from './pages/agent/Dashboard';
import ChefServiceDashboard from './pages/chefservice/Dashboard';

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDashboardPath(user?.role)} replace />;
}

function App() {
  const location = useLocation();
  const hideHeader = [
    '/login',
    '/register',
    '/signup',
    '/dashboard',
    '/admin/dashboard',
    '/agent/dashboard',
    '/chefservice/dashboard',
  ].includes(location.pathname);

  return (
    <div className="app-shell">
      {!hideHeader && <Header />}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chefservice/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CHEF_SERVICE']}>
                <ChefServiceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['AGENT']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
