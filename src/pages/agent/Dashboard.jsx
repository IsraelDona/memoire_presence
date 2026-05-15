import { useAuth } from '../../context/AuthContext';
import Dashboard from '../Dashboard';

function AgentDashboard() {
  const { user } = useAuth();

  return <Dashboard user={user} />;
}

export default AgentDashboard;
