import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../services/authService';
import {
  creerChefService, fetchDemandesComptes, fetchStatistiquesGlobales,
  traiterDemandeCompte,
} from '../../services/adminService';
import Notifications from '../../components/notifications/Notifications';
import { updateMonProfil } from '../../services/profilService';
import { getZoneGps, updateZoneGps } from '../../services/gpsService';

import useNotificationsPolling from '../../hooks/useNotificationsPolling';
import NotificationToast from '../../components/notifications/NotificationToast';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { fetchServices } from '../../services/authService';
import PdfDashboard from '../../components/pdf/PdfDashboard';
import {
  noterChef,
  calculerNoteAuto,
  getClassementChefs,
  getClassementAgentsAdmin,
} from '../../services/noteService';
import { fetchJournaux } from '../../services/journalService';

const INITIAL_CHEF_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  motDePasse: '',
  confirmMotDePasse: '',
  serviceId: '',
};

const ADMIN_ITEMS = [
  { key: 'overview', label: 'Vue générale', icon: 'grid' },
  { key: 'requests', label: 'Demandes comptes', icon: 'check' },
  { key: 'create', label: 'Créer chef service', icon: 'document' },
  { key: 'logs', label: 'Journaux système', icon: 'report' },
  { key: 'pdf', label: 'Rapports PDF', icon: 'document' },
  { key: 'notes', label: 'Notes & classement', icon: 'report' },
  { key: 'parametres', label: 'Paramètres', icon: 'settings' },
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



function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [demandes, setDemandes] = useState([]);
  const [isLoadingDemandes, setIsLoadingDemandes] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [chefForm, setChefForm] = useState(INITIAL_CHEF_FORM);
  const [isCreatingChef, setIsCreatingChef] = useState(false);
  const [requestsFeedback, setRequestsFeedback] = useState(null);
  const [chefFeedback, setChefFeedback] = useState(null);
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    count: notificationsCount,
    toast: notificationToast,
    dismissToast,
    setCountManually,
  } = useNotificationsPolling();

  const [profilForm, setProfilForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
  });
  const [profilFeedback, setProfilFeedback] = useState(null);
  const [isUpdatingProfil, setIsUpdatingProfil] = useState(false);

  const [gpsConfig, setGpsConfig] = useState({
    latitude: '',
    longitude: '',
    rayonKm: '',
    nomLieu: '',
    nombrePointagesParJour: 1,
    modeTestSansZone: false,
  });
  const [gpsFeedback, setGpsFeedback] = useState(null);
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);

  const [localToast, setLocalToast] = useState(null);
  const localToastRef = useRef(null);
  // États Notes mensuelles (admin)
  const [classementChefs, setClassementChefs] = useState([]);
  const [classementAgentsAdmin, setClassementAgentsAdmin] = useState([]);
  const [isLoadingNotesAdmin, setIsLoadingNotesAdmin] = useState(false);
  const [notesFeedbackAdmin, setNotesFeedbackAdmin] = useState(null);
  const [notesMoisAdmin, setNotesMoisAdmin] = useState(new Date().getMonth() + 1);
  const [notesAnneeAdmin, setNotesAnneeAdmin] = useState(new Date().getFullYear());
  const [noteManuelleChefs, setNoteManuelleChefs] = useState({});
  const [isCalculatingAdmin, setIsCalculatingAdmin] = useState({});
  const [isNotingChef, setIsNotingChef] = useState({});
  const [chefsList, setChefsList] = useState([]);

const [logs, setLogs] = useState([]);


const showLocalToast = ({ type, message }) => {
  if (localToastRef.current) {
    clearTimeout(localToastRef.current);
  }
  setLocalToast({ type, message, id: Date.now() });
  localToastRef.current = setTimeout(() => {
    setLocalToast(null);
    localToastRef.current = null;
  }, 5000);
};

  const notifierAction = (setFeedbackFn, type, message) => {
    setFeedbackFn({ type, message });

    setTimeout(() => {
      setFeedbackFn(null);
      showLocalToast({ type, message });
    }, 2500);
  };

  const loadDemandes = useCallback(async ({ showError = false, silent = false } = {}) => {
    if (!silent) {
      setIsLoadingDemandes(true);
    }

    try {
      const result = await fetchDemandesComptes();
      setDemandes(result.demandes);


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
  const loadJournaux = async () => {
  try {
    const data = await fetchJournaux();
    setLogs(data);
  } catch (error) {
    console.error("Erreur lors du chargement des journaux :", error);
  }
};
useEffect(() => {
  if (activePage === "logs") {
    loadJournaux();
  }
}, [activePage]);

  const chargerStatistiques = useCallback(async () => {
    setIsLoadingStats(true);

    try {
      const data = await fetchStatistiquesGlobales();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
  return () => {
    if (localToastRef.current) {
      clearTimeout(localToastRef.current);
    }
  };
}, []);

  useEffect(() => {
    loadDemandes({ silent: true });
    chargerStatistiques();
    fetchServices().then(setServices);
  }, [loadDemandes, chargerStatistiques]);

  useEffect(() => {
    if (activePage === 'requests') {
      loadDemandes({ showError: true });
    }
  }, [activePage, loadDemandes]);

  useEffect(() => {
    if (activePage === 'notes') {
      loadNotesAdmin();
    }
  }, [activePage, notesMoisAdmin, notesAnneeAdmin]);

  useEffect(() => {
    if (activePage === 'parametres') {
      getZoneGps()
        .then((data) => {
          if (data) {
            setGpsConfig({
              latitude: data.latitude.toString(),
              longitude: data.longitude.toString(),
              rayonKm: data.rayonKm.toString(),
              nomLieu: data.nomLieu || '',
              nombrePointagesParJour: data.nombrePointagesParJour || 1,
              modeTestSansZone: Boolean(data.modeTestSansZone),
            });
          }
        })
        .catch((err) => console.error("Erreur de récupération de la configuration GPS :", err));
    }
  }, [activePage]);

  const pendingCount = demandes.length;

  const handleProfilSubmit = async (event) => {
    event.preventDefault();
    setProfilFeedback(null);
    setIsUpdatingProfil(true);

    try {
      const result = await updateMonProfil({
        nom: profilForm.nom.trim() || undefined,
        prenom: profilForm.prenom.trim() || undefined,
        email: profilForm.email.trim() || undefined,
        motDePasse: profilForm.motDePasse || undefined,
      });

      updateUser({
        nom: profilForm.nom.trim() || user.nom,
        prenom: profilForm.prenom.trim() || user.prenom,
        email: profilForm.email.trim() || user.email
      });

      setProfilForm({ nom: '', prenom: '', email: '', motDePasse: '' });

      notifierAction(
        setProfilFeedback,
        'success',
        typeof result === 'string' ? result : 'Profil mis à jour avec succès.'
      );

    } catch (error) {
      notifierAction(
        setProfilFeedback,
        'error',
        error?.message || 'Impossible de mettre à jour le profil.'
      );
    } finally {
      setIsUpdatingProfil(false);
    }
  };
  const handleGpsSubmit = async (event) => {
    event.preventDefault();
    setGpsFeedback(null);
    setIsUpdatingGps(true);

    try {
      const payload = {
        latitude: parseFloat(gpsConfig.latitude),
        longitude: parseFloat(gpsConfig.longitude),
        rayonKm: parseFloat(gpsConfig.rayonKm),
        nombrePointagesParJour: Number(gpsConfig.nombrePointagesParJour),
        modeTestSansZone: gpsConfig.modeTestSansZone,
      };

      const response = await updateZoneGps(payload);

      setGpsConfig((current) => ({
        ...current,
        nomLieu: response?.nomLieu || current.nomLieu,
      }));

      notifierAction(setGpsFeedback, 'success', 'Paramètres de pointage mis à jour avec succès.');
    } catch (error) {
      notifierAction(
        setGpsFeedback,
        'error',
        error?.message || 'Impossible de mettre à jour les paramètres.'
      );
    } finally {
      setIsUpdatingGps(false);
    }
  };

  const handleDecision = async (utilisateurId, accepter) => {
    setBusyAction({ utilisateurId, accepter });
    setRequestsFeedback(null);

    try {
      const result = await traiterDemandeCompte({ utilisateurId, accepter });

      notifierAction(setRequestsFeedback, 'success', result.message);

      await loadDemandes({ silent: true });
    } catch (error) {
      notifierAction(
        setRequestsFeedback,
        'error',
        error?.message || 'Impossible de traiter la demande.'
      );
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
      notifierAction(
        setChefFeedback,
        'error',
        'Les mots de passe du chef service ne correspondent pas.'
      );
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
        serviceId: chefForm.serviceId || undefined,
      });

      notifierAction(setChefFeedback, 'success', result.message);
      resetChefForm();
    } catch (error) {
      notifierAction(
        setChefFeedback,
        'error',
        error?.message || 'Impossible de créer le chef service.'
      );
    } finally {
      setIsCreatingChef(false);
    }
  };
  const loadNotesAdmin = async ({ silent = false } = {}) => {
    if (!silent) setIsLoadingNotesAdmin(true);
    try {
      const [chefs, agents] = await Promise.all([
        getClassementChefs(notesMoisAdmin, notesAnneeAdmin),
        getClassementAgentsAdmin(notesMoisAdmin, notesAnneeAdmin),
      ]);
      setClassementChefs(chefs);
      setClassementAgentsAdmin(agents);

      const initValues = {};
      chefs.forEach((n) => {
        initValues[n.utilisateur.id] = n.noteManuelle ?? '';
      });
      setNoteManuelleChefs(initValues);
      setNotesFeedbackAdmin(null);
    } catch {
      setNotesFeedbackAdmin({ type: 'error', message: 'Impossible de charger les notes.' });
    } finally {
      if (!silent) setIsLoadingNotesAdmin(false);
    }
  };

  const handleCalculerNoteChef = async (chefId) => {
    setIsCalculatingAdmin((c) => ({ ...c, [chefId]: true }));
    try {
      await calculerNoteAuto(chefId, notesMoisAdmin, notesAnneeAdmin);
      await loadNotesAdmin({ silent: true });
      showLocalToast({ type: 'success', message: 'Note automatique calculée.' });
    } catch {
      showLocalToast({ type: 'error', message: 'Erreur lors du calcul.' });
    } finally {
      setIsCalculatingAdmin((c) => ({ ...c, [chefId]: false }));
    }
  };

  const handleNoterChef = async (chefId) => {
    const valeur = parseFloat(noteManuelleChefs[chefId]);
    if (isNaN(valeur) || valeur < 0 || valeur > 20) {
      showLocalToast({ type: 'error', message: 'La note doit être entre 0 et 20.' });
      return;
    }
    setIsNotingChef((c) => ({ ...c, [chefId]: true }));
    try {
      await noterChef(chefId, notesMoisAdmin, notesAnneeAdmin, valeur);
      await loadNotesAdmin({ silent: true });
      showLocalToast({ type: 'success', message: 'Note enregistrée.' });
    } catch {
      showLocalToast({ type: 'error', message: 'Erreur lors de la saisie.' });
    } finally {
      setIsNotingChef((c) => ({ ...c, [chefId]: false }));
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
  <>
    <section className="dashboard-panel dashboard-panel-wide">

      <div className="admin-section-head">
        <div>
          <h2>Espace administrateur</h2>
          <p className="panel-note">
            Gérez les comptes utilisateurs, configurez le système et assurez
            le bon fonctionnement de l'application.
          </p>
        </div>

        <span className="dashboard-status-pill">
          Administration
        </span>
      </div>

      <div className="stats-grid">

        <div className="stats-item">
          <label>Demandes en attente</label>
          <strong>{pendingCount}</strong>
        </div>

        <div className="stats-item">
          <label>Chefs de service</label>
          <strong>{services.length}</strong>
        </div>

        <div className="stats-item">
          <label>Configuration GPS</label>
          <strong>Active</strong>
        </div>

      </div>

      <div
        className="dashboard-placeholder"
        style={{ marginTop: "25px" }}
      >
        <strong>Bienvenue dans l'espace administrateur.</strong>

        <span>
          Utilisez le menu de gauche pour gérer les comptes, consulter les
          journaux, générer les rapports PDF et configurer le système.
        </span>

      </div>

    </section>
  </>
);

  const PIE_COLORS = ['#2d6b47', '#c9912b', '#c44545'];

  function renderRepartitionChart(stats) {
    const presentesNettes = Math.max(
      0,
      stats.nombrePresences - stats.nombreRetards
    );

    const data = [
      { name: 'Présents', value: presentesNettes },
      { name: 'Retards', value: stats.nombreRetards },
      { name: 'Absences', value: stats.nombreAbsences || 0 },
    ];

    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
      return (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Pas encore de données</strong>
          <span>Le graphique s'affichera dès les premiers pointages enregistrés.</span>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  function renderEvolutionChart(stats) {
    const data = stats.evolutionMensuelle || [];

    if (data.length === 0) {
      return (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Pas encore de données</strong>
          <span>L'évolution apparaîtra dès qu'un historique de plusieurs mois existera.</span>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Bar dataKey="tauxPonctualite" fill="#2d6b47" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

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

        <label className="field-input-wrap field-input-wrap-plain">
          <select
            name="serviceId"
            value={chefForm.serviceId}
            onChange={handleChefChange}
            required
          >
            <option value="">Sélectionnez le service à diriger</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nom}
              </option>
            ))}
          </select>
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
        <h2>Journaux d'activités</h2>
        <p className="panel-note">
          Consultez toutes les opérations importantes réalisées dans le système.
        </p>
      </div>

      <span className="dashboard-status-pill">
        {logs.length} activités
      </span>
    </div>

    <div
      style={{
        display: "flex",
        gap: "15px",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >

      <input
        type="text"
        placeholder="Rechercher une action..."
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      />

      <select
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <option>Toutes les catégories</option>
        <option>Compte</option>
        <option>Configuration</option>
        <option>Rapport</option>
      </select>

      <button className="primary-button">
        Actualiser
      </button>

    </div>

    <div className="attendance-table-wrap">

      <table className="attendance-table">

        <thead>

          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Catégorie</th>
            <th>Résultat</th>
          </tr>

        </thead>

        <tbody>

          {logs.map((log) => (

            <tr key={log.id}>

              <td>{log.date}</td>

              <td>{log.utilisateur}</td>

              <td>{log.action}</td>

              <td>

                <span className="admin-table-pill">

                  {log.type}

                </span>

              </td>

              <td>

                <span
                  style={{
                    color:
                      log.resultat === "Succès"
                        ? "#198754"
                        : "#dc3545",
                    fontWeight: 600,
                  }}
                >
                  {log.resultat}
                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </section>
);

  const renderParametresPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Paramètres système & Sécurité</h2>
          <p className="panel-note">
            Gère tes accès personnels et configure la barrière géographique globale qui restreint le pointage des agents et chefs de service.
          </p>
        </div>
        <span className="dashboard-status-pill">Configuration</span>
      </div>

      <div className="parametres-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>

        {/* SECTION 1 : PROFIL DE L'ADMINISTRATEUR */}
        <div className="profil-section-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-placeholder" style={{ margin: 0 }}>
            <strong>Informations de compte actuelles</strong>
            <div className="profil-info-grid" style={{ marginTop: '0.75rem' }}>
              <div className="profil-info-item">
                <span>Nom complet</span>
                <strong>{getFullName(user)}</strong>
              </div>
              <div className="profil-info-item">
                <span>Email de connexion</span>
                <strong>{user?.email || '—'}</strong>
              </div>
              <div className="profil-info-item">
                <span>Rôle système</span>
                <strong>Administrateur</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-placeholder" style={{ margin: 0 }}>
            <strong>Modifier le profil admin</strong>

            {profilFeedback && (
              <div className={profilFeedback.type === 'error' ? 'form-error' : 'form-success'} style={{ margin: '0.75rem 0' }}>
                {profilFeedback.message}
              </div>
            )}

            <form className="parametres-form" onSubmit={handleProfilSubmit} style={{ marginTop: '0.75rem' }}>
              <div className="parametres-form-grid">
                <div className="dashboard-field">
                  <span>Nouveau nom</span>
                  <input
                    type="text"
                    value={profilForm.nom}
                    onChange={(e) => setProfilForm((c) => ({ ...c, nom: e.target.value }))}
                    placeholder="Nom"
                  />
                </div>
                <div className="dashboard-field">
                  <span>Nouveau prénom</span>
                  <input
                    type="text"
                    value={profilForm.prenom}
                    onChange={(e) => setProfilForm((c) => ({ ...c, prenom: e.target.value }))}
                    placeholder="Prénom"
                  />
                </div>
              </div>

              <div className="dashboard-field" style={{ marginTop: '0.75rem' }}>
                <span>Nouvel email</span>
                <input
                  type="email"
                  value={profilForm.email}
                  onChange={(e) => setProfilForm((c) => ({ ...c, email: e.target.value }))}
                  placeholder={user?.email || 'Email'}
                />
              </div>

              <div className="dashboard-field" style={{ marginTop: '0.75rem' }}>
                <span>Nouveau mot de passe</span>
                <input
                  type="password"
                  value={profilForm.motDePasse}
                  onChange={(e) => setProfilForm((c) => ({ ...c, motDePasse: e.target.value }))}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>

              <button type="submit" className="primary-action-button" disabled={isUpdatingProfil} style={{ marginTop: '1rem', width: '100%' }}>
                {isUpdatingProfil ? 'Mise à jour...' : 'Enregistrer le profil'}
              </button>
            </form>
          </div>
        </div>

        {/* SECTION 2 : CONFIGURATION DE LA BARRIÈRE GPS (AGIT SUR AGENT ET CHEF) */}
        <div className="gps-section-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-placeholder" style={{ margin: 0 }}>
            <strong>Paramétrage du pointage géographique</strong>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem', lineHeight: '1.4' }}>
              Ces coordonnées définissent le centre de la zone de travail (ex: le Ministère). Les agents et chefs de service ne pourront valider leur présence que s'ils se trouvent dans le rayon renseigné.
            </p>

            {gpsFeedback && (
              <div className={gpsFeedback.type === 'error' ? 'form-error' : 'form-success'} style={{ margin: '0.75rem 0' }}>
                {gpsFeedback.message}
              </div>
            )}

            <form className="gps-form" onSubmit={handleGpsSubmit} style={{ marginTop: '1rem' }}>

              <div className="dashboard-field">
                <span>Lieu actuel autorisé</span>
                <input
                  type="text"
                  value={gpsConfig.nomLieu || 'Lieu non défini'}
                  readOnly
                  style={{ background: '#f5f6f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="parametres-form-grid" style={{ marginTop: '1rem' }}>
                <div className="dashboard-field">
                  <span>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={gpsConfig.latitude}
                    onChange={(e) => setGpsConfig((c) => ({ ...c, latitude: e.target.value }))}
                    placeholder="Ex: 6.3703"
                    required
                  />
                </div>

                <div className="dashboard-field">
                  <span>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={gpsConfig.longitude}
                    onChange={(e) => setGpsConfig((c) => ({ ...c, longitude: e.target.value }))}
                    placeholder="Ex: 2.3912"
                    required
                  />
                </div>
              </div>

              <div className="dashboard-field" style={{ marginTop: '1rem' }}>
                <span>Rayon de tolérance maximum (en kilomètres)</span>
                <input
                  type="number"
                  step="any"
                  value={gpsConfig.rayonKm}
                  onChange={(e) => setGpsConfig((c) => ({ ...c, rayonKm: e.target.value }))}
                  placeholder="Ex: 0.1 (pour 100 mètres) ou 0.05 (pour 50 mètres)"
                  required
                />
                <div style={{ color: '#aaa', marginTop: '0.35rem', fontSize: '0.8rem' }}>
                  Valeur actuelle équivalente à : {gpsConfig.rayonKm ? (parseFloat(gpsConfig.rayonKm) * 1000).toFixed(0) : 0} mètres autour de la position.
                </div>
              </div>

              <div className="dashboard-field" style={{ marginTop: '1rem' }}>
                <span>Nombre de pointages autorisés par jour</span>
                <select
                  value={gpsConfig.nombrePointagesParJour}
                  onChange={(e) => setGpsConfig((c) => ({ ...c, nombrePointagesParJour: Number(e.target.value) }))}
                >
                  <option value={1}>1 fois (matin)</option>
                  <option value={2}>2 fois (matin et soir)</option>
                  <option value={3}>3 fois (matin, midi, soir)</option>
                </select>
              </div>

              <div className="dashboard-field" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong>Mode test : désactiver la vérification de zone GPS</strong>
                    <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '2px' }}>
                      La vérification faciale reste obligatoire. À utiliser uniquement pour les tests hors site.
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={gpsConfig.modeTestSansZone}
                    onClick={() => setGpsConfig((c) => ({ ...c, modeTestSansZone: !c.modeTestSansZone }))}
                    className={`gps-toggle ${gpsConfig.modeTestSansZone ? 'gps-toggle-on' : ''}`}
                  >
                    <span className="gps-toggle-knob" />
                  </button>
                </div>
              </div>

              {gpsFeedback && (
                <div className={gpsFeedback.type === 'error' ? 'form-error' : 'form-success'} style={{ margin: '0.75rem 0' }}>
                  {gpsFeedback.message}
                </div>
              )}

              <button type="submit" className="primary-action-button" disabled={isUpdatingGps} style={{ marginTop: '1.5rem', width: '100%' }}>
                {isUpdatingGps ? 'Mise à jour en cours...' : 'Appliquer les paramètres de pointage'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  );

  const MOIS_NOMS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const renderClassementBlock = (liste, titre) => {
    const triee = [...liste]
      .filter((n) => n.scoreFinal != null)
      .sort((a, b) => b.scoreFinal - a.scoreFinal);

    if (triee.length === 0) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#1a1a2e' }}>
          🏆 {titre}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {triee.map((n, index) => {
            const nom = [n.utilisateur?.prenom, n.utilisateur?.nom]
              .filter(Boolean).join(' ') || '—';
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] ?? `${index + 1}.`;
            const pct = (n.scoreFinal / 20) * 100;
            return (
              <div
                key={n.utilisateur?.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: index === 0 ? '#f0fdf4' : '#fafafa',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  border: index === 0 ? '1px solid #bbf7d0' : '1px solid #eee',
                }}
              >
                <span style={{ fontSize: '20px', minWidth: '28px' }}>{medal}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '13px' }}>{nom}</strong>
                  {n.utilisateur?.service?.nom && (
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {n.utilisateur.service.nom}
                    </div>
                  )}
                  <div style={{
                    marginTop: '4px', height: '5px',
                    background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: index === 0 ? '#16a34a' : '#1e5eff',
                      borderRadius: '4px', transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
                <span style={{
                  fontWeight: 700, fontSize: '14px',
                  color: index === 0 ? '#16a34a' : '#1a1a2e',
                  minWidth: '48px', textAlign: 'right',
                }}>
                  {n.scoreFinal}/20
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNotesAdminPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Notes & classement global</h2>
          <p className="panel-note">
            Calculez et attribuez les notes aux chefs de service.
            Consultez le classement global des chefs et de tous les agents.
          </p>
        </div>
        <span className="dashboard-status-pill">Évaluation</span>
      </div>

      {/* Sélecteur mois/année */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Mois</span>
          <select
            value={notesMoisAdmin}
            onChange={(e) => setNotesMoisAdmin(Number(e.target.value))}
          >
            {MOIS_NOMS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>

        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Année</span>
          <select
            value={notesAnneeAdmin}
            onChange={(e) => setNotesAnneeAdmin(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      {notesFeedbackAdmin && (
        <div className={notesFeedbackAdmin.type === 'error' ? 'form-error' : 'form-success'}>
          {notesFeedbackAdmin.message}
        </div>
      )}

      {isLoadingNotesAdmin ? (
        <div className="dashboard-placeholder">
          <strong>Chargement des notes</strong>
          <span>Récupération des données en cours...</span>
        </div>
      ) : (
        <>
          {/* Tableau chefs */}
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
            Évaluation des chefs de service
          </h3>

          {classementChefs.length === 0 ? (
            <div className="dashboard-placeholder dashboard-placeholder-muted"
              style={{ marginBottom: '24px' }}>
              <strong>Aucune note chef pour ce mois</strong>
              <span>Calculez d'abord la note automatique de chaque chef.</span>
            </div>
          ) : (
            <div className="attendance-table-wrap" style={{ marginBottom: '28px' }}>
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Chef de service</th>
                    <th>Service</th>
                    <th>Note auto /20</th>
                    <th>Note manuelle /20</th>
                    <th>Score final /20</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classementChefs.map((n) => {
                    const chefId = n.utilisateur?.id;
                    const nom = [n.utilisateur?.prenom, n.utilisateur?.nom]
                      .filter(Boolean).join(' ') || '—';
                    return (
                      <tr key={chefId}>
                        <td><strong>{nom}</strong></td>
                        <td>{n.utilisateur?.service?.nom || '—'}</td>
                        <td>{n.noteAutomatique != null ? `${n.noteAutomatique}/20` : '—'}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={noteManuelleChefs[chefId] ?? ''}
                            onChange={(e) => setNoteManuelleChefs((c) => ({
                              ...c, [chefId]: e.target.value,
                            }))}
                            placeholder="0 à 20"
                            style={{
                              width: '80px', padding: '4px 8px',
                              borderRadius: '6px', border: '1px solid #ddd'
                            }}
                          />
                        </td>
                        <td>
                          {n.scoreFinal != null ? (
                            <strong style={{ color: '#1e5131' }}>{n.scoreFinal}/20</strong>
                          ) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="secondary-button"
                              style={{ fontSize: '12px', padding: '5px 10px' }}
                              onClick={() => handleCalculerNoteChef(chefId)}
                              disabled={isCalculatingAdmin[chefId]}
                            >
                              {isCalculatingAdmin[chefId] ? '...' : '⚙️ Note auto'}
                            </button>
                            <button
                              type="button"
                              className="primary-button"
                              style={{ fontSize: '12px', padding: '5px 10px' }}
                              onClick={() => handleNoterChef(chefId)}
                              disabled={isNotingChef[chefId]}
                            >
                              {isNotingChef[chefId] ? '...' : '✏️ Enregistrer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Classements */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginTop: '8px',
          }}>
            <div>
              {renderClassementBlock(
                classementChefs,
                `Chefs de service — ${MOIS_NOMS[notesMoisAdmin - 1]} ${notesAnneeAdmin}`
              )}
            </div>
            <div>
              {renderClassementBlock(
                classementAgentsAdmin,
                `Agents — ${MOIS_NOMS[notesMoisAdmin - 1]} ${notesAnneeAdmin}`
              )}
            </div>
          </div>

          {classementChefs.filter(n => n.scoreFinal != null).length === 0 &&
            classementAgentsAdmin.filter(n => n.scoreFinal != null).length === 0 && (
              <div className="dashboard-placeholder dashboard-placeholder-muted"
                style={{ marginTop: '16px' }}>
                <strong>Classements indisponibles</strong>
                <span>Les classements apparaissent dès que les scores finaux sont calculés.</span>
              </div>
            )}
        </>
      )}
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
    if (activePage === 'parametres') {
      return renderParametresPanel();
    }

    if (activePage === 'pdf') {
      return <PdfDashboard />;
    }
    if (activePage === 'notes') {
  return renderNotesAdminPanel();
}

    return renderOverview();
  };


  return (

    <div className="dashboard-page dashboard-page-clean admin-dashboard-page">
      <NotificationToast toast={notificationToast} onDismiss={dismissToast} />

      {localToast && (
        <div
          className="notification-toast"
          role="status"
          style={{
            background: localToast.type === 'error' ? '#b13030' : '#1a3a2a',
            top: notificationToast ? '80px' : '20px',
          }}
        >
          <span className="notification-toast-icon">
            {localToast.type === 'error' ? '⚠️' : '✅'}
          </span>
          <span className="notification-toast-text">{localToast.message}</span>
          <button type="button" className="notification-toast-close" onClick={() => setLocalToast(null)}>
            ✕
          </button>
        </div>
      )}

      <Sidebar role="ADMIN" activePage={activePage} onChangePage={setActivePage} items={ADMIN_ITEMS} user={user}
        onLogout={logout} />

      <main className="dashboard-main dashboard-main-clean">
        <div className="dashboard-topbar">
          <div className="dashboard-topbar-actions">
            <span className="app-user-chip">{user?.role || 'ADMIN'}</span>

            <button
              type="button"
              className="nav-notification-button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              🔔
              {notificationsCount > 0 && (
                <span className="nav-notification-count">
                  {notificationsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className="nav-profile-button"
              onClick={() => setActivePage('parametres')}
              aria-label="Ouvrir mon profil"
              title="Ouvrir mon profil"
            >

              {user?.photoProfil ? (
                <img
                  src={user.photoProfil}
                  alt={user?.nom}
                  className="nav-profile-avatar"
                />
              ) : (
                <span className="nav-profile-placeholder">
                  {`${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()}
                </span>
              )}

            </button>

          </div>
        </div>

        <div className="dashboard-head">
          <div>
            <p className="dashboard-kicker">Espace administrateur</p>
            <h1 className="dashboard-title">Pilotage des comptes et de la gouvernance</h1>
          </div>
        </div>

        {isNotificationsOpen && (
          <>
            <div
              className="notifications-overlay"
              onClick={() => setIsNotificationsOpen(false)}
            />
            <div className="notifications-dropdown">
              <button
                type="button"
                className="notifications-dropdown-close"
                onClick={() => setIsNotificationsOpen(false)}
              >
                ✕
              </button>
              <Notifications onCountChange={(count) => setCountManually(count)} />
            </div>
          </>
        )}



        {renderSection()}


      </main>
    </div>
  );
}

export default AdminDashboard;
