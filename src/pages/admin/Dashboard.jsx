import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../services/authService';
import {
  creerChefService,
  fetchDemandesComptes,
  traiterDemandeCompte,
} from '../../services/adminService';

const INITIAL_CHEF_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  motDePasse: '',
  confirmMotDePasse: '',
};

const ADMIN_ITEMS = [
  { key: 'overview', label: 'Vue générale', icon: 'grid' },
  { key: 'requests', label: 'Demandes comptes', icon: 'check' },
  { key: 'create', label: 'Créer chef service', icon: 'document' },
  { key: 'logs', label: 'Journaux système', icon: 'report' },
];

function getRoleLabel(role) {
  const normalized = normalizeRole(role);

  if (normalized === 'ADMIN') {
    return 'Administrateur';
  }

  if (normalized === 'CHEF_SERVICE') {
    return 'Chef service';
  }

  return 'Agent';
}

function getFullName(user) {
  return [user?.nom, user?.prenom].filter(Boolean).join(' ').trim() || 'Utilisateur';
}

function formatTime(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [demandes, setDemandes] = useState([]);
  const [isLoadingDemandes, setIsLoadingDemandes] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [chefForm, setChefForm] = useState(INITIAL_CHEF_FORM);
  const [isCreatingChef, setIsCreatingChef] = useState(false);
  const [requestsFeedback, setRequestsFeedback] = useState(null);
  const [chefFeedback, setChefFeedback] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  const loadDemandes = useCallback(async ({ showError = false, silent = false } = {}) => {
    if (!silent) {
      setIsLoadingDemandes(true);
    }

    try {
      const result = await fetchDemandesComptes();
      setDemandes(result.demandes);
      setLastSyncAt(new Date());

      if (showError) {
        setRequestsFeedback(null);
      }
    } catch (error) {
      if (showError) {
        setRequestsFeedback({
          type: 'error',
          message: error?.message || 'Impossible de charger les demandes de comptes.',
        });
      }
    } finally {
      if (!silent) {
        setIsLoadingDemandes(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDemandes({ silent: true });
  }, [loadDemandes]);

  useEffect(() => {
    if (activePage === 'requests') {
      loadDemandes({ showError: true });
    }
  }, [activePage, loadDemandes]);

  const pendingCount = demandes.length;
  const roleLabel = getRoleLabel(user?.role);

  const cards = useMemo(
    () => [
      {
        title: 'Demandes en attente',
        value: String(pendingCount),
        description: 'Comptes agents à valider ou refuser.',
      },
      {
        title: 'Votre profil',
        value: roleLabel,
        description: user?.email || 'Session administrateur active.',
      },
      {
        title: 'Dernière synchronisation',
        value: lastSyncAt ? formatTime(lastSyncAt) : 'En cours',
        description: 'Données rafraîchies depuis le backend.',
      },
    ],
    [lastSyncAt, pendingCount, roleLabel, user?.email]
  );

  const handleDecision = async (utilisateurId, accepter) => {
    setBusyAction({ utilisateurId, accepter });
    setRequestsFeedback(null);

    try {
      const result = await traiterDemandeCompte({ utilisateurId, accepter });
      setRequestsFeedback({
        type: 'success',
        message: result.message,
      });
      await loadDemandes({ silent: true });
    } catch (error) {
      setRequestsFeedback({
        type: 'error',
        message: error?.message || 'Impossible de traiter la demande.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleChefChange = (event) => {
    const { name, value } = event.target;
    setChefForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetChefForm = () => {
    setChefForm(INITIAL_CHEF_FORM);
  };

  const handleChefSubmit = async (event) => {
    event.preventDefault();
    setChefFeedback(null);

    if (chefForm.motDePasse !== chefForm.confirmMotDePasse) {
      setChefFeedback({
        type: 'error',
        message: 'Les mots de passe du chef service ne correspondent pas.',
      });
      return;
    }

    setIsCreatingChef(true);

    try {
      const result = await creerChefService({
        nom: chefForm.nom.trim(),
        prenom: chefForm.prenom.trim(),
        email: chefForm.email.trim(),
        telephone: chefForm.telephone.trim(),
        motDePasse: chefForm.motDePasse,
      });

      setChefFeedback({
        type: 'success',
        message: result.message,
      });
      resetChefForm();
    } catch (error) {
      setChefFeedback({
        type: 'error',
        message: error?.message || 'Impossible de créer le chef service.',
      });
    } finally {
      setIsCreatingChef(false);
    }
  };

  const renderDemandesTable = () => {
    if (isLoadingDemandes) {
      return (
        <div className="dashboard-placeholder">
          <strong>Chargement des demandes</strong>
          <span>Connexion au backend en cours...</span>
        </div>
      );
    }

    if (demandes.length === 0) {
      return (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Aucune demande en attente</strong>
          <span>Les nouvelles inscriptions agents s’afficheront ici.</span>
        </div>
      );
    }

    return (
      <div className="attendance-table-wrap">
        <table className="attendance-table admin-table">
          <thead>
            <tr>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((demande) => {
              const isBusy = busyAction?.utilisateurId === demande.id;
              const roleValue = getRoleLabel(demande?.role?.nomRole ?? demande?.role);

              return (
                <tr key={demande.id}>
                  <td>
                    <strong>{getFullName(demande)}</strong>
                  </td>
                  <td>{demande.email || '—'}</td>
                  <td>
                    <span className="admin-table-pill">{roleValue}</span>
                  </td>
                  <td>
                    <span className="admin-table-status">En attente</span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-mini-button admin-mini-button-success"
                        onClick={() => handleDecision(demande.id, true)}
                        disabled={isBusy}
                      >
                        {isBusy && busyAction?.accepter ? 'Validation...' : 'Valider'}
                      </button>
                      <button
                        type="button"
                        className="admin-mini-button admin-mini-button-danger"
                        onClick={() => handleDecision(demande.id, false)}
                        disabled={isBusy}
                      >
                        {isBusy && busyAction?.accepter === false ? 'Refus...' : 'Refuser'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOverview = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Vue générale</h2>
          <p className="panel-note">
            Utilise le menu de gauche pour ouvrir les demandes de comptes, créer un chef service ou consulter les
            journaux.
          </p>
        </div>
        <span className="dashboard-status-pill">Synthèse</span>
      </div>

      <div className="dashboard-placeholder">
        <strong>Actions administrateur disponibles</strong>
        <span>
          La validation des comptes et la création des chefs service se gèrent dans les sections dédiées.
        </span>
      </div>
    </section>
  );

  const renderRequests = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Demandes de comptes agents</h2>
          <p className="panel-note">Valide ou refuse les comptes en attente avant activation.</p>
        </div>
        <span className="dashboard-status-pill">{pendingCount} en attente</span>
      </div>

      {requestsFeedback && requestsFeedback.type === 'error' && (
        <div className="form-error">{requestsFeedback.message}</div>
      )}
      {requestsFeedback && requestsFeedback.type === 'success' && (
        <div className="form-success">{requestsFeedback.message}</div>
      )}

      {renderDemandesTable()}
    </section>
  );

  const renderCreateChef = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Création d’un chef service</h2>
          <p className="panel-note">Crée un compte chef service actif avec ses identifiants professionnels.</p>
        </div>
        <span className="dashboard-status-pill">Compte actif</span>
      </div>

      <form className="admin-form-grid" onSubmit={handleChefSubmit}>
        <div className="auth-grid-two">
          <label className="field-input-wrap">
            <input
              name="nom"
              type="text"
              value={chefForm.nom}
              onChange={handleChefChange}
              placeholder="Nom"
              autoComplete="family-name"
              required
            />
          </label>

          <label className="field-input-wrap">
            <input
              name="prenom"
              type="text"
              value={chefForm.prenom}
              onChange={handleChefChange}
              placeholder="Prénom"
              autoComplete="given-name"
              required
            />
          </label>
        </div>

        <label className="field-input-wrap">
          <input
            name="email"
            type="email"
            value={chefForm.email}
            onChange={handleChefChange}
            placeholder="Email professionnel"
            autoComplete="email"
            required
          />
        </label>

        <label className="field-input-wrap">
          <input
            name="telephone"
            type="tel"
            value={chefForm.telephone}
            onChange={handleChefChange}
            placeholder="Téléphone"
            autoComplete="tel"
          />
        </label>

        <div className="auth-grid-two">
          <label className="field-input-wrap">
            <input
              name="motDePasse"
              type="password"
              value={chefForm.motDePasse}
              onChange={handleChefChange}
              placeholder="Mot de passe"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field-input-wrap">
            <input
              name="confirmMotDePasse"
              type="password"
              value={chefForm.confirmMotDePasse}
              onChange={handleChefChange}
              placeholder="Confirmer le mot de passe"
              autoComplete="new-password"
              required
            />
          </label>
        </div>

        {chefFeedback && chefFeedback.type === 'error' && <div className="form-error">{chefFeedback.message}</div>}
        {chefFeedback && chefFeedback.type === 'success' && <div className="form-success">{chefFeedback.message}</div>}

        <div className="admin-form-actions">
          <button type="submit" className="primary-button" disabled={isCreatingChef}>
            {isCreatingChef ? 'Création en cours...' : 'Créer le chef service'}
          </button>
          <button type="button" className="secondary-button" onClick={resetChefForm} disabled={isCreatingChef}>
            Réinitialiser
          </button>
        </div>
      </form>
    </section>
  );

  const renderLogs = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Journaux système</h2>
          <p className="panel-note">Cette zone sera reliée aux traces d’activité et aux exports admin.</p>
        </div>
        <span className="dashboard-status-pill">Supervision</span>
      </div>

      <div className="dashboard-placeholder dashboard-placeholder-muted">
        <strong>Module en préparation</strong>
        <span>Les journaux système seront branchés quand l’API backend sera prête.</span>
      </div>
    </section>
  );

  const renderSection = () => {
    if (activePage === 'requests') {
      return renderRequests();
    }

    if (activePage === 'create') {
      return renderCreateChef();
    }

    if (activePage === 'logs') {
      return renderLogs();
    }

    return renderOverview();
  };

  return (
    <div className="dashboard-page dashboard-page-clean admin-dashboard-page">
      <Sidebar role="ADMIN" activePage={activePage} onChangePage={setActivePage} items={ADMIN_ITEMS} />

      <main className="dashboard-main dashboard-main-clean">
        <div className="dashboard-head">
          <div>
            <p className="dashboard-kicker">Espace administrateur</p>
            <h1 className="dashboard-title">Pilotage des comptes et de la gouvernance</h1>
          </div>
          <div className="dashboard-user-chip">
            <span>{user?.email || 'admin'}</span>
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

        {renderSection()}

        <div className="admin-footer-actions">
          <button type="button" className="secondary-button" onClick={() => loadDemandes({ silent: true })}>
            Actualiser les demandes
          </button>
          <button type="button" className="secondary-button" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
