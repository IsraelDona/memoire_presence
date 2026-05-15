import { useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { normalizeRole } from '../services/authService';

const ROLE_CONTENT = {
  ADMIN: {
    title: 'Administrateur',
    subtitle: 'Pilotage global de la plateforme',
    summary:
      'Gestion des comptes, activation des agents, configuration et supervision des accès.',
    highlights: [
      { label: 'Responsabilité', value: 'Validation des comptes et gouvernance des accès' },
      { label: 'Priorité', value: 'Structurer les utilisateurs et préparer les workflows métiers' },
      { label: 'Statut', value: 'Accès administrateur actif' },
    ],
    items: [
      { key: 'overview', label: 'Vue générale', icon: 'grid' },
      { key: 'activation', label: 'Validation comptes', icon: 'check' },
      { key: 'logs', label: 'Journaux système', icon: 'report' },
    ],
  },
  CHEF_SERVICE: {
    title: 'Chef de service',
    subtitle: 'Supervision des agents du service',
    summary:
      'Préparation du suivi des présences, des missions et des validations opérationnelles.',
    highlights: [
      { label: 'Responsabilité', value: 'Superviser les affectations et les validations' },
      { label: 'Priorité', value: 'Préparer les modules de suivi et d’évaluation' },
      { label: 'Statut', value: 'Accès chef de service actif' },
    ],
    items: [
      { key: 'overview', label: 'Vue générale', icon: 'grid' },
      { key: 'missions', label: 'Missions', icon: 'document' },
      { key: 'analyses', label: 'Analyses', icon: 'report' },
    ],
  },
  AGENT: {
    title: 'Agent',
    subtitle: 'Espace personnel sécurisé',
    summary:
      'Connexion validée, route protégée et espace prêt pour le pointage, l’historique et les demandes.',
    highlights: [
      { label: 'Responsabilité', value: 'Consulter et interagir avec son espace personnel' },
      { label: 'Priorité', value: 'Accéder proprement aux fonctions de présence' },
      { label: 'Statut', value: 'Compte agent actif' },
    ],
    items: [
      { key: 'overview', label: 'Vue générale', icon: 'grid' },
      { key: 'profile', label: 'Profil', icon: 'profile' },
      { key: 'requests', label: 'Demandes', icon: 'document' },
    ],
  },
};

function Dashboard({ user }) {
  const [activePage, setActivePage] = useState('overview');
  const roleKey = normalizeRole(user?.roleKey ?? user?.role);
  const roleContent = ROLE_CONTENT[roleKey] ?? ROLE_CONTENT.AGENT;

  const cards = useMemo(
    () => [
      {
        title: 'Session',
        value: user?.email ? 'Authentifiée' : 'Non définie',
        description: 'Connexion via JWT et stockage local sécurisé.',
      },
      {
        title: 'Rôle',
        value: roleContent.title,
        description: 'Redirection et accès alignés sur le profil utilisateur.',
      },
      {
        title: 'Étape suivante',
        value: 'Intégrer les modules métiers',
        description: 'Présence, missions, validations et notifications.',
      },
    ],
    [roleContent.title, user?.email]
  );

  const activeItem = roleContent.items.find((item) => item.key === activePage) ?? roleContent.items[0];

  const renderBody = () => {
    if (activeItem.key === 'activation' || activeItem.key === 'missions' || activeItem.key === 'profile') {
      return (
        <section className="dashboard-panel dashboard-panel-wide">
          <h2>{activeItem.label}</h2>
          <p className="panel-note">
            Cette section sera connectée aux vraies données backend dans l’étape suivante.
          </p>
          <div className="dashboard-placeholder">
            <strong>Module à brancher</strong>
            <span>La structure est prête pour les appels API et les écrans métier.</span>
          </div>
        </section>
      );
    }

    if (activeItem.key === 'logs' || activeItem.key === 'analyses') {
      return (
        <section className="dashboard-panel dashboard-panel-wide">
          <h2>{activeItem.label}</h2>
          <p className="panel-note">
            Vue réservée à la supervision et au reporting, sans données simulées.
          </p>
          <div className="dashboard-placeholder dashboard-placeholder-muted">
            <strong>Vue de contrôle</strong>
            <span>Les tableaux et indicateurs arriveront après connexion au backend.</span>
          </div>
        </section>
      );
    }

    return (
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-copy">
          <span className="dashboard-status-pill">{roleContent.subtitle}</span>
          <h1>Bienvenue, {user?.name || 'utilisateur'}.</h1>
          <p>{roleContent.summary}</p>
        </div>

        <div className="dashboard-highlight-list">
          {roleContent.highlights.map((item) => (
            <article key={item.label} className="dashboard-highlight-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="dashboard-page dashboard-page-clean">
      <Sidebar role={roleKey} activePage={activePage} onChangePage={setActivePage} items={roleContent.items} />

      <main className="dashboard-main dashboard-main-clean">
        <div className="dashboard-head">
          <div>
            <p className="dashboard-kicker">Espace de travail</p>
            <h1 className="dashboard-title">{roleContent.title}</h1>
          </div>
          <div className="dashboard-user-chip">
            <span>{user?.email || 'Aucun email'}</span>
          </div>
        </div>

        <div className="dashboard-cards">
          {cards.map((card) => (
            <article key={card.title} className="dashboard-stat-card">
              <span>{card.title}</span>
              <strong>{card.value}</strong>
              <p>{card.description}</p>
            </article>
          ))}
        </div>

        {renderBody()}
      </main>
    </div>
  );
}

export default Dashboard;
