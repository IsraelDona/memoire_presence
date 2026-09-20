import React from 'react';
// NETTOYAGE COMPLET : Importation des icônes officielles Lucide
import { 
  LayoutGrid, 
  History, 
  Globe, 
  CheckSquare, 
  FileText, 
  UserCheck, 
  Settings,
  LogOut
} from 'lucide-react';

// Correspondance parfaite avec vos clés d'icônes existantes
const ICONS = {
  grid: <LayoutGrid size={20} />,
  history: <History size={20} />,
  globe: <Globe size={20} />,
  check: <CheckSquare size={20} />,
  report: <FileText size={20} />,      // Version professionnelle pour vos rapports
  document: <FileText size={20} />,    // Version professionnelle pour vos documents
  profile: <UserCheck size={20} />,
  settings: <Settings size={20} />,    // Prêt pour votre vue paramètres
};

function Sidebar({ activePage, onChangePage, items = [], user, onLogout }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">DI</div>
        <div className="sidebar-brand-subtitle">e-presence</div>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activePage === item.key ? 'sidebar-button active' : 'sidebar-button'}
            onClick={() => onChangePage(item.key)}
          >
            <span className="sidebar-icon" aria-hidden="true">
              {/* Utilisation de LayoutGrid par défaut si la clé n'existe pas */}
              {ICONS[item.icon] ?? <LayoutGrid size={20} />}
            </span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          {user?.photoProfil ? (
            <img
              src={user.photoProfil}
              alt={user.nom}
              className="sidebar-avatar"
            />
          ) : (
            <div className="sidebar-avatar-placeholder">
              {(user?.prenom || user?.nom || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="sidebar-user-info">
            <strong>
              {user?.prenom} {user?.nom}
            </strong>
            <span>
              {user?.role}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
