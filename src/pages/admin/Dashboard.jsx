import { useAuth } from '../../context/AuthContext';
import Dashboard from '../Dashboard';

function AdminDashboard() {
  const { user } = useAuth();

  return <Dashboard user={user} />;
}

export default AdminDashboard;
