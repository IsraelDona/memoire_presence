import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Notifications from '../../components/notifications/Notifications';
import NotificationToast from '../../components/notifications/NotificationToast';
import { useAuth } from '../../context/AuthContext';
import { fetchStatistiquesGlobales } from '../../services/adminService';
import useNotificationsPolling from '../../hooks/useNotificationsPolling';
import { updateMonProfil } from '../../services/profilService';
import PhotoUploadInput from '../../components/profil/PhotoUploadInput';
import {
  consulterRapportPdfHistorique,
  getHistoriquePdf,
} from '../../services/pdfService';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  noterChef,
  getClassementChefs,
  getClassementAgentsAdmin,
} from '../../services/noteService';
import {
  getChefsService,
} from '../../services/directeurService';

const DIRECTEUR_ITEMS = [
  { key: 'overview', label: 'Tableau de bord', icon: 'grid' },
  { key: 'notes', label: 'Notes des chefs', icon: 'report' },
  { key: 'classements', label: 'Classements', icon: 'globe' },
  { key: 'rapports', label: 'Rapports mensuels', icon: 'document' },
  { key: 'parametres', label: 'Mon profil', icon: 'settings' },
];

const MOIS_NOMS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function getFullName(user) {
  return [user?.nom, user?.prenom].filter(Boolean).join(' ').trim() || 'Utilisateur';
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function readApiError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function DirecteurDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsFeedback, setStatsFeedback] = useState(null);
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

  const [localToast, setLocalToast] = useState(null);
  const localToastRef = useRef(null);
  const [classementChefs, setClassementChefs] = useState([]);
  const [classementAgentsAdmin, setClassementAgentsAdmin] = useState([]);
  const [isLoadingNotesAdmin, setIsLoadingNotesAdmin] = useState(false);
  const [notesFeedbackAdmin, setNotesFeedbackAdmin] = useState(null);
  const [notesMoisAdmin, setNotesMoisAdmin] = useState(new Date().getMonth() + 1);
  const [notesAnneeAdmin, setNotesAnneeAdmin] = useState(new Date().getFullYear());
  const [noteManuelleChefs, setNoteManuelleChefs] = useState({});
  const [isNotingChef, setIsNotingChef] = useState({});
  const [rapports, setRapports] = useState([]);
  const [isLoadingRapports, setIsLoadingRapports] = useState(false);
  const [rapportsFeedback, setRapportsFeedback] = useState(null);
  const [isDownloadingRapport, setIsDownloadingRapport] = useState({});

  const [chefsList, setChefsList] = useState([]);

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

  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const notifierAction = (setFeedbackFn, type, message) => {
    setFeedbackFn({ type, message });

    setTimeout(() => {
      setFeedbackFn(null);
      showLocalToast({ type, message });
    }, 2500);
  };

  const chargerStatistiques = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsFeedback(null);

    try {
      const data = await fetchStatistiquesGlobales();
      setStats(data?.data && typeof data.data === 'object' ? data.data : data);
    } catch (error) {
      setStats(null);
      setStatsFeedback(readApiError(error, 'Impossible de charger les statistiques.'));
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const loadNotesAdmin = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoadingNotesAdmin(true);
    }

    try {
      const [chefs, classement, agents] = await Promise.all([
        getChefsService(),
        getClassementChefs(notesMoisAdmin, notesAnneeAdmin),
        getClassementAgentsAdmin(notesMoisAdmin, notesAnneeAdmin),
      ]);

      const chefsActifs = normalizeList(chefs);
      const classementChefsList = normalizeList(classement);
      const agentsList = normalizeList(agents);

      setChefsList(chefsActifs);
      setClassementChefs(classementChefsList);
      setClassementAgentsAdmin(agentsList);

      /*
       * On associe les données de note à chaque chef.
       * Ainsi, un chef apparaît même s'il n'a encore aucune note.
       */
      const classementParChef = new Map(
        classementChefsList
          .filter((note) => note.utilisateur?.id != null)
          .map((note) => [note.utilisateur.id, note])
      );

      const notesChefs = chefsActifs.map((chef) => {
        const noteExistante = classementParChef.get(chef.id);

        return noteExistante || {
          utilisateur: chef,
          noteAutomatique: null,
          noteManuelle: null,
          scoreFinal: null,
        };
      });

      setClassementChefs(notesChefs);

      const initValues = {};

      notesChefs.forEach((note) => {
        const chefId = note.utilisateur?.id;

        if (chefId != null) {
          initValues[chefId] = note.noteManuelle ?? '';
        }
      });

      setNoteManuelleChefs(initValues);
      setNotesFeedbackAdmin(null);
    } catch (error) {
      setNotesFeedbackAdmin({
        type: 'error',
        message: readApiError(
          error,
          'Impossible de charger les notes.'
        ),
      });
    } finally {
      if (!silent) {
        setIsLoadingNotesAdmin(false);
      }
    }
  }, [notesMoisAdmin, notesAnneeAdmin]);

  const loadRapports = useCallback(async () => {
    setIsLoadingRapports(true);
    setRapportsFeedback(null);

    try {
      const data = await getHistoriquePdf();
      setRapports(normalizeList(data));
    } catch (error) {
      setRapports([]);
      setRapportsFeedback(readApiError(error, 'Impossible de charger les rapports mensuels.'));
    } finally {
      setIsLoadingRapports(false);
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
    chargerStatistiques();
  }, [chargerStatistiques]);

  useEffect(() => {
    if (activePage === 'notes' || activePage === 'classements') {
      loadNotesAdmin();
    }
  }, [activePage, loadNotesAdmin]);

  useEffect(() => {
    if (activePage === 'rapports') {
      loadRapports();
    }
  }, [activePage, loadRapports]);

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
        email: profilForm.email.trim() || user.email,
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

  const handleNoterChef = async (chefId) => {
    const valeur = parseFloat(noteManuelleChefs[chefId]);
    if (isNaN(valeur) || valeur < 0 || valeur > 20) {
      showLocalToast({ type: 'error', message: 'La note doit être entre 0 et 20.' });
      return;
    }
    setIsNotingChef((current) => ({ ...current, [chefId]: true }));
    try {
      await noterChef(chefId, notesMoisAdmin, notesAnneeAdmin, valeur);
      await loadNotesAdmin({ silent: true });
      showLocalToast({ type: 'success', message: 'Note enregistrée.' });
    } catch {
      showLocalToast({ type: 'error', message: 'Erreur lors de la saisie.' });
    } finally {
      setIsNotingChef((current) => ({ ...current, [chefId]: false }));
    }
  };

  const PIE_COLORS = ['#2d6b47', '#c9912b', '#c44545'];

  function renderRepartitionChart(statsData) {
    const presentesNettes = Math.max(0, statsData.nombrePresences - statsData.nombreRetards);

    const data = [
      { name: 'Présents', value: presentesNettes },
      { name: 'Retards', value: statsData.nombreRetards },
      { name: 'Absences', value: statsData.nombreAbsences || 0 },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

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

  function renderEvolutionChart(statsData) {
    const data = statsData.evolutionMensuelle || [];

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

  /*
   * La note retenue est le score final s'il existe, sinon la note
   * automatique. Filtrer sur le seul scoreFinal écartait tous ceux
   * qui n'ont pas encore reçu de note manuelle, alors qu'ils ont
   * bien une note automatique et doivent figurer au classement.
   */
  const noteDuClassement = (item, avecNoteManuelle = true) =>
    (avecNoteManuelle ? item?.scoreFinal ?? item?.noteAutomatique : item?.noteAutomatique) ?? null;

  const renderClassementBlock = (liste, titre, avecNoteManuelle = true) => {
    const valeur = (item) => noteDuClassement(item, avecNoteManuelle);

    const triee = [...liste]
      .filter((item) => valeur(item) != null)
      .sort((a, b) => valeur(b) - valeur(a))
      .slice(0, 3);

    if (triee.length === 0) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#1a1a2e' }}>
          🏆 {titre}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {triee.map((item, index) => {
            const nom = [item.utilisateur?.prenom, item.utilisateur?.nom].filter(Boolean).join(' ') || '—';
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] ?? `${index + 1}.`;
            const note = valeur(item);
            const pct = (note / 20) * 100;
            return (
              <div
                key={item.utilisateur?.id}
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
                  {item.utilisateur?.service?.nom && (
                    <div style={{ fontSize: '11px', color: '#888' }}>{item.utilisateur.service.nom}</div>
                  )}
                  <div style={{ marginTop: '4px', height: '5px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: index === 0 ? '#16a34a' : '#1e5eff', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: index === 0 ? '#16a34a' : '#1a1a2e', minWidth: '48px', textAlign: 'right' }}>
                  {note.toFixed(2)}/20
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <>
      <section className="dashboard-panel dashboard-panel-wide">
        <div className="admin-section-head">
          <div>
            <h2>Statistiques globales</h2>
            <p className="panel-note">Aperçu des principales métriques du système.</p>
          </div>
          <span className="dashboard-status-pill">Synthèse</span>
        </div>

        {isLoadingStats ? (
          <div className="dashboard-placeholder">
            <strong>Chargement des statistiques</strong>
            <span>Chargement des données en cours...</span>
          </div>
        ) : stats ? (
          <>
            <div className="stats-grid">
              <div className="stats-item">
                <label>Agents</label>
                <strong>{stats.nombreAgents}</strong>
              </div>
              <div className="stats-item">
                <label>Chefs de service</label>
                <strong>{stats.nombreChefsService}</strong>
              </div>
              <div className="stats-item">
                <label>Présences</label>
                <strong>{stats.nombrePresences}</strong>
              </div>
              <div className="stats-item">
                <label>Retards</label>
                <strong>{stats.nombreRetards}</strong>
              </div>
              <div className="stats-item">
                <label>Justificatifs</label>
                <strong>{stats.nombreJustificatifs}</strong>
              </div>
              <div className="stats-item">
                <label>Missions</label>
                <strong>{stats.nombreMissions}</strong>
              </div>
              <div className="stats-item">
                <label>Réunions</label>
                <strong>{stats.nombreReunions}</strong>
              </div>
              <div className="stats-item">
                <label>Score global</label>
                <strong>{stats.scoreGlobalPonctualite?.toFixed(2)}%</strong>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Répartition des présences</h3>
                {renderRepartitionChart(stats)}
              </div>

              <div className="chart-card">
                <h3>Évolution mensuelle de la ponctualité</h3>
                {renderEvolutionChart(stats)}
              </div>
            </div>
          </>
        ) : (
          <div className="dashboard-placeholder dashboard-placeholder-muted">
            <strong>Impossible de charger les statistiques</strong>
            <span>{statsFeedback || 'Vérifiez votre connexion et réessayez.'}</span>
          </div>
        )}
      </section>

      <section className="dashboard-panel dashboard-panel-wide">
        <div className="admin-section-head">
          <div>
            <h2>Vue générale</h2>
            <p className="panel-note">Le menu de gauche te permet d'accéder aux notes, rapports et profil.</p>
          </div>
          <span className="dashboard-status-pill">Navigation</span>
        </div>

        <div className="director-quick-actions">
          <button type="button" onClick={() => setActivePage('notes')}>
            <strong>Noter les chefs</strong>
            <span>Attribuer les notes mensuelles.</span>
          </button>

          <button type="button" onClick={() => setActivePage('classements')}>
            <strong>Voir les classements</strong>
            <span>Chefs de service et agents.</span>
          </button>

          <button type="button" onClick={() => setActivePage('rapports')}>
            <strong>Consulter les rapports</strong>
            <span>Rapports générés par l’administrateur.</span>
          </button>

          <button type="button" onClick={() => setActivePage('parametres')}>
            <strong>Modifier mon profil</strong>
            <span>Mettre à jour tes informations.</span>
          </button>
        </div>
      </section>
    </>
  );

  const renderNotesPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Noter les chefs de service</h2>
          <p className="panel-note">Attribuez une note mensuelle aux chefs de service et consultez leur note calculée.</p>
        </div>
        <span className="dashboard-status-pill">Évaluation</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Mois</span>
          <select value={notesMoisAdmin} onChange={(event) => setNotesMoisAdmin(Number(event.target.value))}>
            {MOIS_NOMS.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </label>

        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Année</span>
          <select value={notesAnneeAdmin} onChange={(event) => setNotesAnneeAdmin(Number(event.target.value))}>
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>{year}</option>
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
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Évaluation des chefs de service</h3>

          {chefsList.length === 0 ? (
            <div className="dashboard-placeholder dashboard-placeholder-muted">
              <strong>Aucun chef de service</strong>
              <span>Aucun chef de service actif n'est disponible.</span>
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
                  {classementChefs.map((note) => {
                    const chefId = note.utilisateur?.id;
                    const nom = [note.utilisateur?.prenom, note.utilisateur?.nom].filter(Boolean).join(' ') || '—';
                    return (
                      <tr key={chefId}>
                        <td><strong>{nom}</strong></td>
                        <td>{note.utilisateur?.service?.nom || '—'}</td>
                        <td>{note.noteAutomatique != null ? `${note.noteAutomatique}/20` : '—'}</td>
                        <td>

                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={noteManuelleChefs[chefId] ?? ''}
                            onChange={(event) => setNoteManuelleChefs((current) => ({ ...current, [chefId]: event.target.value }))}
                            placeholder="0 à 20"
                            style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd' }}
                          />
                        </td>
                        <td>
                          {note.scoreFinal != null ? <strong style={{ color: '#1e5131' }}>{note.scoreFinal}/20</strong> : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

        </>
      )}
    </section>
  );

  const renderClassementsPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Classements</h2>
          <p className="panel-note">Consultez le classement mensuel des chefs de service et des agents.</p>
        </div>
        <span className="dashboard-status-pill">Consultation</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Mois</span>
          <select value={notesMoisAdmin} onChange={(event) => setNotesMoisAdmin(Number(event.target.value))}>
            {MOIS_NOMS.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </label>

        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Année</span>
          <select value={notesAnneeAdmin} onChange={(event) => setNotesAnneeAdmin(Number(event.target.value))}>
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>{year}</option>
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
          <strong>Chargement des classements</strong>
          <span>Récupération des scores en cours...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
          <div>
            {renderClassementBlock(classementChefs, `Chefs de service — ${MOIS_NOMS[notesMoisAdmin - 1]} ${notesAnneeAdmin}`)}
          </div>
          <div>
            {renderClassementBlock(classementAgentsAdmin, `Agents — ${MOIS_NOMS[notesMoisAdmin - 1]} ${notesAnneeAdmin}`, false)}
          </div>
          {classementChefs.filter((item) => noteDuClassement(item) != null).length === 0 &&
            classementAgentsAdmin.filter((item) => noteDuClassement(item, false) != null).length === 0 && (
              <div className="dashboard-placeholder dashboard-placeholder-muted" style={{ gridColumn: '1 / -1' }}>
                <strong>Classements indisponibles</strong>
                <span>Les classements apparaîtront dès les premiers pointages enregistrés.</span>
              </div>
            )}
        </div>
      )}
    </section>
  );

  const handleConsulterRapport = async (rapportId) => {
    setIsDownloadingRapport((current) => ({ ...current, [rapportId]: true }));
    try {
      await consulterRapportPdfHistorique(rapportId);
    } catch (error) {
      setRapportsFeedback(readApiError(error, 'Impossible d’ouvrir ce rapport.'));
    } finally {
      setIsDownloadingRapport((current) => ({ ...current, [rapportId]: false }));
    }
  };

  const formatRapportDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderRapportsPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Rapports mensuels</h2>
          <p className="panel-note">Consultez les rapports générés et archivés par l’administrateur.</p>
        </div>
        <span className="dashboard-status-pill">Consultation</span>
      </div>

      {rapportsFeedback && <div className="form-error">{rapportsFeedback}</div>}

      {isLoadingRapports ? (
        <div className="dashboard-placeholder">
          <strong>Chargement des rapports</strong>
          <span>Récupération de l’historique en cours...</span>
        </div>
      ) : rapports.length === 0 ? (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Aucun rapport mensuel disponible</strong>
          <span>Les rapports apparaîtront ici dès qu’ils auront été générés par l’administrateur.</span>
        </div>
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Rapport</th>
                <th>Date de génération</th>
                <th>Généré par</th>
                <th>Taille</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rapports.map((rapport) => (
                <tr key={rapport.id}>
                  <td><strong>{rapport.nomFichier || 'Rapport mensuel'}</strong></td>
                  <td>{formatRapportDate(rapport.dateGeneration)}</td>
                  <td>{rapport.generateurNom || 'Administrateur'}</td>
                  <td>{rapport.taille ? `${(rapport.taille / 1024).toFixed(1)} Ko` : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleConsulterRapport(rapport.id)}
                      disabled={isDownloadingRapport[rapport.id]}
                    >
                      {isDownloadingRapport[rapport.id] ? 'Ouverture...' : 'Consulter le PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderParametresPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Mon profil directeur</h2>
          <p className="panel-note">Gère tes informations personnelles et tes accès de connexion.</p>
        </div>
        <span className="dashboard-status-pill">Profil</span>
      </div>

      <div className="dashboard-placeholder" style={{ marginTop: '1rem' }}>
        <strong>Photo de profil</strong>
        <PhotoUploadInput />
      </div>

      <div className="dashboard-placeholder" style={{ marginTop: '1rem' }}>
        <strong>Informations du compte</strong>
        <div className="profil-info-grid" style={{ marginTop: '0.75rem' }}>
          <div className="profil-info-item">
            <span>Nom complet</span>
            <strong>{getFullName(user)}</strong>
          </div>
          <div className="profil-info-item">
            <span>Email</span>
            <strong>{user?.email || '—'}</strong>
          </div>
          <div className="profil-info-item">
            <span>Rôle système</span>
            <strong>Directeur</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-placeholder" style={{ marginTop: '1rem' }}>
        <strong>Modifier le profil</strong>

        {profilFeedback && (
          <div className={profilFeedback.type === 'error' ? 'form-error' : 'form-success'} style={{ margin: '0.75rem 0' }}>
            {profilFeedback.message}
          </div>
        )}

        <form className="parametres-form" onSubmit={handleProfilSubmit} style={{ marginTop: '0.75rem' }}>
          <div className="parametres-form-grid">
            <div className="dashboard-field">
              <span>Nouveau nom</span>
              <input type="text" value={profilForm.nom} onChange={(event) => setProfilForm((current) => ({ ...current, nom: event.target.value }))} placeholder="Nom" />
            </div>
            <div className="dashboard-field">
              <span>Nouveau prénom</span>
              <input type="text" value={profilForm.prenom} onChange={(event) => setProfilForm((current) => ({ ...current, prenom: event.target.value }))} placeholder="Prénom" />
            </div>
          </div>

          <div className="dashboard-field" style={{ marginTop: '0.75rem' }}>
            <span>Nouvel email</span>
            <input type="email" value={profilForm.email} onChange={(event) => setProfilForm((current) => ({ ...current, email: event.target.value }))} placeholder={user?.email || 'Email'} />
          </div>

          <div className="dashboard-field" style={{ marginTop: '0.75rem' }}>
            <span>Nouveau mot de passe</span>
            <input type="password" value={profilForm.motDePasse} onChange={(event) => setProfilForm((current) => ({ ...current, motDePasse: event.target.value }))} placeholder="Laisser vide pour ne pas changer" />
          </div>

          <button type="submit" className="primary-action-button" disabled={isUpdatingProfil} style={{ marginTop: '1rem', width: '100%' }}>
            {isUpdatingProfil ? 'Mise à jour...' : 'Enregistrer le profil'}
          </button>
        </form>
      </div>
    </section>
  );

  const renderSection = () => {
    if (activePage === 'notes') {
      return renderNotesPanel();
    }

    if (activePage === 'classements') {
      return renderClassementsPanel();
    }

    if (activePage === 'rapports') {
      return renderRapportsPanel();
    }

    if (activePage === 'parametres') {
      return renderParametresPanel();
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
            top: '20px',
          }}
        >
          <span className="notification-toast-icon">{localToast.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="notification-toast-text">{localToast.message}</span>
          <button type="button" className="notification-toast-close" onClick={() => setLocalToast(null)}>
            ✕
          </button>
        </div>
      )}

      <div className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <button
          type="button"
          className="dashboard-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
        >
          ✕
        </button>
        <Sidebar role="DIRECTEUR" activePage={activePage} onChangePage={handlePageChange} items={DIRECTEUR_ITEMS} user={user} onLogout={logout} />
      </div>

      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="dashboard-main dashboard-main-clean">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={sidebarOpen}
          >
            ☰
          </button>

          <div className="dashboard-topbar-actions">
            <span className="app-user-chip">{user?.role || 'DIRECTEUR'}</span>

            <button
              type="button"
              className="nav-notification-button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              aria-label="Ouvrir les notifications"
              aria-expanded={isNotificationsOpen}
            >
              🔔
              {notificationsCount > 0 && (
                <span className="nav-notification-count">{notificationsCount}</span>
              )}
            </button>

            <button
              type="button"
              className="nav-profile-button"
              onClick={() => handlePageChange('parametres')}
              aria-label="Ouvrir mon profil"
              title="Ouvrir mon profil"
            >
              {user?.photoProfil ? (
                <img
                  src={user.photoProfil}
                  alt={`${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Profil'}
                  className="nav-profile-avatar"
                />
              ) : (
                <span className="nav-profile-placeholder">
                  {`${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase() || 'U'}
                </span>
              )}
            </button>
          </div>
        </header>

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
              <Notifications onCountChange={setCountManually} />
            </div>
          </>
        )}

        <div className="dashboard-head">
          <div>
            <p className="dashboard-kicker">Espace DIRECTEUR</p>
            <h1 className="dashboard-title">Pilotage stratégique de la Direction</h1>
          </div>

        </div>

        {renderSection()}
      </main>
    </div>
  );
}

export default DirecteurDashboard;
