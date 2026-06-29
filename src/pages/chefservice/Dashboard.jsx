import { useAuth } from '../../context/AuthContext';
import Dashboard from '../Dashboard';

function ChefServiceDashboard() {
  const { user } = useAuth();

  return <Dashboard user={user} />;
}
export default ChefServiceDashboard;
