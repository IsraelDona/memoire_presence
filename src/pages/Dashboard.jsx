import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import FaceVerificationModal from '../components/auth/FaceVerificationModal';
import { normalizeRole } from '../services/authService';
import {
  fetchMesJustificatifs,
  submitJustificatif,
  deleteJustificatif,
} from '../services/agentService';
import {
  createChefMission,
  createChefReunion,
  supprimerChefMission,
  supprimerChefReunion,
  fetchChefMissions,
  fetchChefReunions,
  fetchEquipePresences,
  fetchJustificatifsChef,
  fetchAgentsDuService,
  validerJustificatif,      // ✅ AJOUTÉ
  refuserJustificatif       // ✅ AJOUTÉ
} from '../services/chefService';
import {
  fetchMesPresences,
  marquerPresence,
  verifierZone,
  fetchContexteDuJour,
} from '../services/presenceService';
import { genererAnalyseIA, fetchMesAnalysesIA } from '../services/analyseIAService';
import Notifications from '../components/notifications/Notifications';
import PresenceMap from '../components/map/PresenceMap';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';
import {
  updateMonProfil,
  getMonChefService
} from '../services/profilService';
import PhotoUploadInput from '../components/profil/PhotoUploadInput';

import useNotificationsPolling from '../hooks/useNotificationsPolling';
import NotificationToast from '../components/notifications/NotificationToast';
import { reverseGeocode } from '../services/gpsService';
import { getGpsConfig } from '../services/gpsConfigService';
import {
  getClassementAgentsChef,
  getMonClassementService,
  getClassementChefsPourChef,
} from '../services/noteService';



const ROLE_CONTENT = {
  CHEF_SERVICE: {
    title: 'Chef de service',
    subtitle: 'Supervision des agents du service',
    summary: 'Pilotage des présences, des missions, des réunions et des validations opérationnelles.',
    highlights: [
      { label: 'Responsabilité', value: 'Superviser les affectations et les validations' },
      { label: 'Priorité', value: 'Suivre les présences des agents et organiser le service' },
      { label: 'Statut', value: 'Accès chef de service actif' },
    ],
    items: [
      { key: 'overview', label: 'Vue générale', icon: 'grid' },
      { key: 'pointage', label: 'Marquer présence', icon: 'check' },
      { key: 'presences', label: 'Présences agents', icon: 'history' },
      { key: 'operations', label: 'Missions & réunions', icon: 'document' },
      { key: 'historique', label: 'Historique & analyses', icon: 'report' },
      { key: 'analyseIA', label: 'Analyse IA', icon: 'report' },
      { key: 'justificatifs', label: 'Justificatifs', icon: 'document' },
      { key: 'parametres', label: 'Paramètres', icon: 'settings' },
    ],
  },
  AGENT: {
    title: 'Agent',
    subtitle: 'Espace personnel sécurisé',
    summary: 'Connexion validée, route protégée et espace prêt pour le pointage, l’historique et les demandes.',
    highlights: [
      { label: 'Responsabilité', value: 'Consulter et interagir avec son espace personnel' },
      { label: 'Priorité', value: 'Accéder proprement aux fonctions de présence' },
      { label: 'Statut', value: 'Compte agent actif' },
    ],
    items: [
      { key: 'overview', label: 'Vue générale', icon: 'grid' },
      { key: 'pointage', label: 'Marquer présence', icon: 'check' },
      { key: 'historique', label: 'Historique', icon: 'history' },
      { key: 'analyseIA', label: 'Analyse IA', icon: 'report' },
      { key: 'demandes', label: 'Demandes', icon: 'document' },
      { key: 'parametres', label: 'Paramètres', icon: 'settings' },
    ],
  },
};

const DEFAULT_POINTAGE = "BUREAU";
const DEFAULT_GPS_CONFIG = {
  nom: "Ministere de l’Economie et des Finances",
  latitude: 6.3703,
  longitude: 2.3912,
  rayonKm: 1.0,
};

function calculateDistanceKm(start, end) {
  if (!start || !end) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(end.latitude - start.latitude);
  const deltaLon = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.sin(deltaLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}


function formatDistanceLabel(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return 'Position en attente';
  }

  return `Distance estimée au ministère: ${distanceKm.toFixed(2)} km`;
}



function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatPresenceStatus(status) {
  const value = String(status ?? '').toUpperCase();

  if (value === 'PRESENT') {
    return 'Présent';
  }

  if (value === 'RETARD') {
    return 'Retard';
  }

  if (value === 'ABSENT') {
    return 'Absent';
  }

  return value || '—';
}

function formatPresenceType(typePresence) {
  const value = String(typePresence ?? '').trim().toUpperCase();

  if (!value) {
    return '—';
  }

  return value.replace(/_/g, ' ');
}

function formatDateOnly(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function formatPeriode(dateDebut, dateFin) {
  const debut = formatDateOnly(dateDebut);
  const fin = formatDateOnly(dateFin);

  if (debut === '—' || fin === '—') return '—';
  if (debut === fin) return debut;
  return `${debut} → ${fin}`;
}

function getPresenceBadgeClass(status) {
  const value = String(status ?? '').toUpperCase();

  if (value === 'RETARD') {
    return 'is-late';
  }

  if (value === 'ABSENT') {
    return 'is-gps';
  }

  return 'is-present';
}

function getGpsLabel() {
  return 'Position GPS capturée';
}

function getPosition() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('La géolocalisation n’est pas disponible sur ce navigateur.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => reject(new Error('Impossible de récupérer la position GPS. Autorise la localisation.')),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

function Dashboard({ user }) {
  const { updateUser, logout } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFeedback, setHistoryFeedback] = useState(null);
  const [agentJustificatifs, setAgentJustificatifs] = useState([]);
  const [isLoadingAgentJustificatifs, setIsLoadingAgentJustificatifs] = useState(false);
  const [agentJustificatifsFeedback, setAgentJustificatifsFeedback] = useState(null);
  const [monChefService, setMonChefService] = useState(null);
  const [isSubmittingAgentJustificatif, setIsSubmittingAgentJustificatif] = useState(false);
  const [agentJustificatifForm, setAgentJustificatifForm] = useState({
    typeJustificatif: '',
    motif: '',
    dateDebut: '',
    dateFin: '',
  });

  const [isSubmittingPointage, setIsSubmittingPointage] = useState(false);
  const [pointageFeedback, setPointageFeedback] = useState(null);
  const [pointageType, setPointageType] = useState(DEFAULT_POINTAGE);
  const [contextePointage, setContextePointage] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isFaceVerificationOpen, setIsFaceVerificationOpen] = useState(false);
  const [chefPresences, setChefPresences] = useState([]);
  const [isLoadingChefPresences, setIsLoadingChefPresences] = useState(false);
  const [chefPresencesFeedback, setChefPresencesFeedback] = useState(null);
  const [chefMissions, setChefMissions] = useState([]);
  const [chefReunions, setChefReunions] = useState([]);
  const [agentsDuService, setAgentsDuService] = useState([]);
  const [isLoadingChefOperations, setIsLoadingChefOperations] = useState(false);
  const [chefOperationsFeedback, setChefOperationsFeedback] = useState(null);
  const [isSubmittingMission, setIsSubmittingMission] = useState(false);
  const [isSubmittingReunion, setIsSubmittingReunion] = useState(false);
  const [isDeletingOperation, setIsDeletingOperation] = useState(false);
  const [missionForm, setMissionForm] = useState({
    titre: '',
    description: '',
    participantIds: [],
    echeance: '',
    lieu: '',
    rayonKm: '',
  });
  const [reunionForm, setReunionForm] = useState({
    titre: '',
    ordreDuJour: '',
    lieu: '',
    rayonKm: '',
    dateReunion: '',
    participantIds: [],
  });
  const [chefJustificatifs, setChefJustificatifs] = useState([]);
  const [isLoadingChefJustificatifs, setIsLoadingChefJustificatifs] = useState(false);

  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [hasLoadedAgentJustificatifs, setHasLoadedAgentJustificatifs] = useState(false);
  const [hasLoadedChefPresences, setHasLoadedChefPresences] = useState(false);
  const [hasLoadedChefOperations, setHasLoadedChefOperations] = useState(false);
  const [hasLoadedChefJustificatifs, setHasLoadedChefJustificatifs] = useState(false);
  const [analysesIA, setAnalysesIA] = useState([]);
  const [isLoadingAnalysesIA, setIsLoadingAnalysesIA] = useState(false);
  const [classement, setClassement] = useState([]);
  const [isLoadingClassement, setIsLoadingClassement] = useState(false);
  const [analysesIAFeedback, setAnalysesIAFeedback] = useState(null);
  const [isGeneratingAnalyseIA, setIsGeneratingAnalyseIA] = useState(false);
  const [hasLoadedAnalysesIA, setHasLoadedAnalysesIA] = useState(false);

  // États Notes mensuelles (chef)
  const [classementAgents, setClassementAgents] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesFeedback, setNotesFeedback] = useState(null);
  const [notesMois, setNotesMois] = useState(new Date().getMonth() + 1);
  const [notesAnnee, setNotesAnnee] = useState(new Date().getFullYear());

  const [profilForm, setProfilForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
  });

  const [profilFeedback, setProfilFeedback] = useState(null);
  const [isUpdatingProfil, setIsUpdatingProfil] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    count: notificationsCount,
    toast: notificationToast,
    dismissToast,
    setCountManually,
  } = useNotificationsPolling();

  const [localToast, setLocalToast] = useState(null);

  const showLocalToast = ({ type, message }) => {
    setLocalToast({ type, message, id: Date.now() });
    setTimeout(() => setLocalToast(null), 5000);
  };

  const handleNotificationsCountChange = (count) => {
    setCountManually(count);
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

  const [nomLieuAgent, setNomLieuAgent] = useState(null);
  const [gpsConfig, setGpsConfig] = useState(DEFAULT_GPS_CONFIG);

  const roleKey = normalizeRole(user?.roleKey ?? user?.role);
  const roleContent = ROLE_CONTENT[roleKey] ?? ROLE_CONTENT.AGENT;
  const canPoint = roleKey === 'AGENT' || roleKey === 'CHEF_SERVICE';
  const [operationOuverte, setOperationOuverte] = useState(null);
  useEffect(() => {
    setHasLoadedHistory(false);
    setHasLoadedAgentJustificatifs(false);
    setHasLoadedChefPresences(false);
    setHasLoadedChefOperations(false);
    setHasLoadedChefJustificatifs(false);
  }, [roleKey]);

  useEffect(() => {
    const loadGpsConfig = () => {
      getGpsConfig()
        .then((data) => {
          if (data) {
            setGpsConfig({
              nom: data.nom || data.nomLieu,
              latitude: data.latitude,
              longitude: data.longitude,
              rayonKm: data.rayonKm,
            });
          }
        })
        .catch((err) => console.error("Erreur de récupération de la config GPS:", err));
    };

    loadGpsConfig();
    const interval = setInterval(loadGpsConfig, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = useCallback(async ({ silent = false } = {}) => {
    if (!canPoint) {
      return;
    }

    if (!silent) {
      setIsLoadingHistory(true);
    }

    try {
      const response = await fetchMesPresences();
      setHistory(response.presences);
      setHistoryFeedback(null);
    } catch (error) {
      setHistory([]);
      setHistoryFeedback({
        type: 'error',
        message: error?.message || 'Impossible de charger l’historique des présences.',
      });
    } finally {
      if (!silent) {
        setIsLoadingHistory(false);
      }
      setHasLoadedHistory(true);
    }
  }, [canPoint]);

  useEffect(() => {
    if (canPoint) {
      loadHistory({ silent: true });
    }
  }, [canPoint, loadHistory]);

  useEffect(() => {
    if (canPoint && activePage === 'historique' && !isLoadingHistory && !hasLoadedHistory) {
      loadHistory();
    }
  }, [activePage, canPoint, hasLoadedHistory, isLoadingHistory, loadHistory]);

  const loadAgentJustificatifs = useCallback(async ({ silent = false } = {}) => {
    if (roleKey !== 'AGENT') {
      return;
    }

    if (!silent) {
      setIsLoadingAgentJustificatifs(true);
    }

    try {
      const response = await fetchMesJustificatifs();
      setAgentJustificatifs(response.justificatifs);

    } catch (error) {
      setAgentJustificatifs([]);
      showLocalToast({
        type: 'error',
        message: error?.message || 'Impossible de charger les demandes et justificatifs.',
      });
    } finally {
      if (!silent) {
        setIsLoadingAgentJustificatifs(false);
      }
      setHasLoadedAgentJustificatifs(true);
    }
  }, [roleKey]);

  useEffect(() => {
    if (roleKey === 'AGENT') {
      loadAgentJustificatifs({ silent: true });
    }
  }, [loadAgentJustificatifs, roleKey]);

  useEffect(() => {
    if (roleKey !== 'AGENT') {
      return;
    }

    getMonChefService()
      .then(setMonChefService)
      .catch(() => setMonChefService(null));
  }, [roleKey]);

  useEffect(() => {
    if (roleKey === 'AGENT' && activePage === 'demandes' && !isLoadingAgentJustificatifs
      && !hasLoadedAgentJustificatifs) {
      loadAgentJustificatifs();
    }
  }, [activePage, hasLoadedAgentJustificatifs, isLoadingAgentJustificatifs, loadAgentJustificatifs, roleKey]);

  const loadChefPresences = useCallback(async ({ silent = false } = {}) => {
    if (roleKey !== 'CHEF_SERVICE') {
      return;
    }

    if (!silent) {
      setIsLoadingChefPresences(true);
    }

    try {
      const response = await fetchEquipePresences();
      setChefPresences(response.presences);
      setChefPresencesFeedback(null);
    } catch (error) {
      setChefPresences([]);
      setChefPresencesFeedback({
        type: 'error',
        message: error?.message || 'Impossible de charger les présences des agents.',
      });
    } finally {
      if (!silent) {
        setIsLoadingChefPresences(false);
      }
      setHasLoadedChefPresences(true);
    }
  }, [roleKey]);



  const handleProfilSubmit = async (event) => {
    event.preventDefault();

    setIsUpdatingProfil(true);

    try {
      const updatedProfile = await updateMonProfil({
        nom: profilForm.nom || undefined,
        prenom: profilForm.prenom || undefined,
        email: profilForm.email || undefined,
        motDePasse: profilForm.motDePasse || undefined,
      });

      const updatedUser = {
        nom: updatedProfile?.nom || profilForm.nom || user?.nom,
        prenom: updatedProfile?.prenom || profilForm.prenom || user?.prenom,
        email: updatedProfile?.email || profilForm.email,
      };

      updateUser(updatedUser);
      setProfilForm({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
      });

      notifierAction(setProfilFeedback, 'success', 'Profil mis à jour avec succès.');

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



  const loadChefOperations = useCallback(async ({ silent = false } = {}) => {
    if (roleKey !== 'CHEF_SERVICE') {
      return;
    }

    if (!silent) {
      setIsLoadingChefOperations(true);
    }

    try {
      const [missionsResponse, reunionsResponse, agentsResponse] = await Promise.all([
        fetchChefMissions(),
        fetchChefReunions(),
        fetchAgentsDuService(),
      ]);

      setChefMissions(missionsResponse.missions);
      setChefReunions(reunionsResponse.reunions);
      setAgentsDuService(agentsResponse || []);
      setChefOperationsFeedback(null);
    } catch (error) {
      setChefMissions([]);
      setChefReunions([]);
      setChefOperationsFeedback({
        type: 'error',
        message: error?.message || 'Impossible de charger les missions et réunions.',
      });
    } finally {
      if (!silent) {
        setIsLoadingChefOperations(false);
      }
      setHasLoadedChefOperations(true);
    }
  }, [roleKey]);

  const loadChefJustificatifs = useCallback(async ({ silent = false } = {}) => {
    if (roleKey !== 'CHEF_SERVICE') {
      return;
    }

    if (!silent) {
      setIsLoadingChefJustificatifs(true);
    }

    try {
      const response = await fetchJustificatifsChef();
      setChefJustificatifs(response.justificatifs);

    } catch (error) {
      setChefJustificatifs([]);
      showLocalToast({
        type: 'error',
        message: error?.message || 'Impossible de charger les justificatifs.',
      });
    } finally {
      if (!silent) {
        setIsLoadingChefJustificatifs(false);
      }
      setHasLoadedChefJustificatifs(true);
    }
  }, [roleKey]);

  const loadAnalysesIA = useCallback(async ({ silent = false } = {}) => {
    if (roleKey !== 'AGENT' && roleKey !== 'CHEF_SERVICE') {
      return;
    }

    if (!silent) {
      setIsLoadingAnalysesIA(true);
    }

    try {
      const data = await fetchMesAnalysesIA();
      setAnalysesIA(data);
      setAnalysesIAFeedback(null);
    } catch (error) {
      setAnalysesIA([]);
      setAnalysesIAFeedback({
        type: 'error',
        message: error?.message || 'Impossible de charger les analyses IA.',
      });
    } finally {
      if (!silent) {
        setIsLoadingAnalysesIA(false);
      }
      setHasLoadedAnalysesIA(true);
    }
  }, [roleKey]);

  /*
   * Classement affiché sous l'analyse : parmi les chefs de service
   * pour un chef, parmi les membres de son service pour un agent.
   */
  const loadClassement = useCallback(async () => {
    if (roleKey !== 'AGENT' && roleKey !== 'CHEF_SERVICE') {
      return;
    }

    setIsLoadingClassement(true);

    const maintenant = new Date();
    const mois = maintenant.getMonth() + 1;
    const annee = maintenant.getFullYear();

    try {
      const data = roleKey === 'CHEF_SERVICE'
        ? await getClassementChefsPourChef(mois, annee)
        : await getMonClassementService(mois, annee);

      setClassement(Array.isArray(data) ? data : []);
    } catch {
      setClassement([]);
    } finally {
      setIsLoadingClassement(false);
    }
  }, [roleKey]);
 const loadNotesChef = useCallback(async ({ silent = false } = {}) => {
    if (roleKey !== 'CHEF_SERVICE') return;
    if (!silent) setIsLoadingNotes(true);
    try {
      const classement = await getClassementAgentsChef(notesMois, notesAnnee);
      setClassementAgents(classement);
      setNotesFeedback(null);
    } catch {
      setNotesFeedback({ type: 'error', message: 'Impossible de charger les notes.' });
    } finally {
      if (!silent) setIsLoadingNotes(false);
    }
  }, [roleKey, notesMois, notesAnnee]);
  const handleGenererAnalyseIA = async () => {
    try {
      setIsGeneratingAnalyseIA(true);

      const nouvelleAnalyse = await genererAnalyseIA();

      setAnalysesIA([nouvelleAnalyse]);

      setAnalysesIAFeedback({
        type: 'success',
        message: 'Analyse actualisée avec succès.',
      });

    } catch (error) {
      setAnalysesIAFeedback({
        type: 'error',
        message:
          error?.response?.data?.message ||
          'Impossible d’actualiser l’analyse.',
      });
    } finally {
      setIsGeneratingAnalyseIA(false);
    }
  };





  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE') {
      loadChefPresences({ silent: true });
      loadChefOperations({ silent: true });
    }
  }, [loadChefOperations, loadChefPresences, roleKey]);

  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE' && activePage === 'presences' && !isLoadingChefPresences && !hasLoadedChefPresences) {
      loadChefPresences();
    }
  }, [activePage, hasLoadedChefPresences, isLoadingChefPresences, loadChefPresences, roleKey]);

  useEffect(() => {
    if (
      roleKey === 'CHEF_SERVICE' &&
      activePage === 'operations' &&
      !isLoadingChefOperations &&
      !hasLoadedChefOperations
    ) {
      loadChefOperations();
    }
  }, [activePage, hasLoadedChefOperations, isLoadingChefOperations, loadChefOperations, roleKey]);

  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE' && activePage === 'justificatifs' && !isLoadingChefJustificatifs && !hasLoadedChefJustificatifs) {
      loadChefJustificatifs();
    }
  }, [activePage, hasLoadedChefJustificatifs, isLoadingChefJustificatifs, loadChefJustificatifs, roleKey]);

  useEffect(() => {
    if (roleKey === 'AGENT' || roleKey === 'CHEF_SERVICE') {
      loadAnalysesIA({ silent: true });
    }
  }, [loadAnalysesIA, roleKey]);

  useEffect(() => {
    if ((roleKey === 'AGENT' || roleKey === 'CHEF_SERVICE') && activePage === 'analyseIA' && !isLoadingAnalysesIA && !hasLoadedAnalysesIA) {
      loadAnalysesIA();
    }
  }, [activePage, hasLoadedAnalysesIA, isLoadingAnalysesIA, loadAnalysesIA, roleKey]);

  /*
   * Le classement est rechargé à chaque ouverture de l'onglet :
   * les notes des collègues ont pu évoluer entre-temps.
   */
  useEffect(() => {
    if (activePage === 'analyseIA') {
      loadClassement();
    }
  }, [activePage, loadClassement]);

  /*
   * Contexte du jour : mission, réunion ou bureau. Le type de
   * pointage en découle, l'agent ne le choisit plus.
   */
  useEffect(() => {
    if (roleKey !== 'AGENT' && roleKey !== 'CHEF_SERVICE') {
      return;
    }

    if (activePage !== 'pointage' && activePage !== 'overview') {
      return;
    }

    fetchContexteDuJour()
      .then((contexte) => {
        if (!contexte) {
          return;
        }
        setContextePointage(contexte);
        if (contexte.typePresence) {
          setPointageType(contexte.typePresence);
        }
      })
      .catch(() => setContextePointage(null));
  }, [activePage, roleKey]);

  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE' && activePage === 'notes') {
      loadNotesChef();
    }
  }, [activePage, roleKey, loadNotesChef]);

  const latestPresence = history[0];
  const activeItem = roleContent.items.find((item) => item.key === activePage) ?? roleContent.items[0];


  const goToHistory = () => {
    if (canPoint) {
      setActivePage('historique');
    }
  };

  const handleAgentJustificatifSubmit = async (event) => {
    event.preventDefault();

    setIsSubmittingAgentJustificatif(true);

    try {
      const response = await submitJustificatif(agentJustificatifForm);

      notifierAction(
        setAgentJustificatifsFeedback,
        'success',
        response.message || 'Demande transmise avec succès.'
      );

      setAgentJustificatifForm({
        typeJustificatif: '',
        motif: '',
        dateDebut: '',
        dateFin: '',
      });
      await loadAgentJustificatifs({ silent: true });
    } catch (error) {
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Impossible de transmettre la demande.';

      notifierAction(setAgentJustificatifsFeedback, 'error', errorMessage);
    } finally {
      setIsSubmittingAgentJustificatif(false);
    }
  };

  const handleDeleteJustificatif = async (justificatifId) => {
    if (!window.confirm('Es-tu sûr de vouloir supprimer ce justificatif ?')) {
      return;
    }

    try {
      await deleteJustificatif(justificatifId);
      showLocalToast({
        type: 'success',
        message: 'Justificatif supprimé avec succès.',
      });
      await loadAgentJustificatifs({ silent: true });
    } catch (error) {
      const errorCode = error?.response?.status;
      let errorMsg = 'Impossible de supprimer le justificatif.';

      if (errorCode === 403) {
        errorMsg = 'Vous n\'avez pas la permission de supprimer ce justificatif.';
      } else if (errorCode === 404) {
        errorMsg = 'Ce justificatif n\'existe pas ou a déjà été supprimé.';
      }

      showLocalToast({
        type: 'error',
        message: errorMsg,
      });
    }
  };

  const handlePointage = async () => {

    setIsSubmittingPointage(true);

    try {
      if (!currentPosition) {
        throw new Error('Position GPS introuvable, réessaie le pointage.');
      }

      const response = await marquerPresence({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        typePresence: pointageType,
      });

      notifierAction(setPointageFeedback, 'success', response.message);

      await loadHistory({ silent: true });
      setActivePage('overview');
    } catch (error) {
      notifierAction(
        setPointageFeedback,
        'error',
        error?.message || 'Impossible de marquer la présence.'
      );
    } finally {
      setIsSubmittingPointage(false);
    }
  };

  /*
   * Étapes 1 et 2 du diagramme de séquence : vérifier d'abord
   * si un pointage est possible (déjà marqué ? zone GPS
   * autorisée ?) avant de demander la vérification faciale.
   * La caméra ne s'ouvre que si ces deux conditions sont déjà
   * remplies.
   */
  const openFaceVerificationBeforePointage = async () => {

    setIsSubmittingPointage(true);

    try {
      const position = await getPosition();
      setCurrentPosition(position);

      try {
        const geo = await reverseGeocode(position.latitude, position.longitude);
        setNomLieuAgent(geo?.nomLieu || null);
      } catch {
        setNomLieuAgent(null);
      }

      await verifierZone({
        latitude: position.latitude,
        longitude: position.longitude,
        typePresence: pointageType,
      });

      /*
       * On laisse isSubmittingPointage à true : le bouton reste
       * désactivé pendant que la caméra est ouverte, jusqu'à la
       * fin complète du flux (succès, échec facial ou fermeture).
       */
      setIsFaceVerificationOpen(true);
    } catch (error) {
      notifierAction(
        setPointageFeedback,
        'error',
        error?.message || 'Impossible de vérifier la zone de pointage.'
      );
      setIsSubmittingPointage(false);
    }
  };

  const handleMissionSubmit = async (event) => {
    event.preventDefault();
    setChefOperationsFeedback(null);
    setIsSubmittingMission(true);

    try {
      const payload = { ...missionForm, rayonKm: Number(missionForm.rayonKm) };
      const response = await createChefMission(payload);
      setChefOperationsFeedback({
        type: 'success',
        message: response.message,
      });
      setMissionForm({
        titre: '',
        description: '',
        participantIds: [],
        echeance: '',
        lieu: '',
        rayonKm: '',
      });
      await loadChefOperations({ silent: true });
    } catch (error) {
      setChefOperationsFeedback({
        type: 'error',
        message: error?.message || 'Impossible de créer la mission.',
      });
    } finally {
      setIsSubmittingMission(false);
    }
  };

  const handleReunionSubmit = async (event) => {
    event.preventDefault();
    setChefOperationsFeedback(null);
    setIsSubmittingReunion(true);

    try {
      const payload = { ...reunionForm, rayonKm: Number(reunionForm.rayonKm) };
      const response = await createChefReunion(payload);
      setChefOperationsFeedback({
        type: 'success',
        message: response.message,
      });
      setReunionForm({
        titre: '',
        ordreDuJour: '',
        lieu: '',
        rayonKm: '',
        dateReunion: '',
        participantIds: [],
      });
      await loadChefOperations({ silent: true });
    } catch (error) {
      setChefOperationsFeedback({
        type: 'error',
        message: error?.message || 'Impossible de créer la réunion.',
      });
    } finally {
      setIsSubmittingReunion(false);
    }
  };

  const handleSupprimerOperation = async (type, operation) => {
    const libelle = type === 'mission' ? 'cette mission' : 'cette réunion';

    if (!window.confirm(`Supprimer ${libelle} ? Les agents concernés en seront informés.`)) {
      return;
    }

    setIsDeletingOperation(true);

    try {
      const result = type === 'mission'
        ? await supprimerChefMission(operation.id)
        : await supprimerChefReunion(operation.id);

      showLocalToast({ type: 'success', message: result.message });
      await loadChefOperations({ silent: true });
    } catch (error) {
      showLocalToast({
        type: 'error',
        message: error?.message || 'Suppression impossible.',
      });
    } finally {
      setIsDeletingOperation(false);
    }
  };

  const renderPresenceSummary = () => {
    if (!canPoint) {
      return null;
    }

    return (
      <section className="dashboard-panel dashboard-panel-wide agent-status-panel">
        <div className="admin-section-head">
          <div>
            <h2>État de présence</h2>
            <p className="panel-note">
              Le panneau se met à jour après chaque pointage et reflète ton dernier statut enregistré.
            </p>
          </div>
          <span className={`presence-status-badge ${getPresenceBadgeClass(latestPresence?.statutPresence)}`}>
            {latestPresence ? formatPresenceStatus(latestPresence.statutPresence) : 'Non pointé'}
          </span>
        </div>



        <div className="agent-status-grid">
          <article className="dashboard-placeholder agent-status-card">
            <strong>Dernier pointage</strong>
            <span>
              {latestPresence
                ? formatDateTime(latestPresence.heurePointage || latestPresence.datePresence)
                : 'Aucun pointage effectué aujourd’hui.'}
            </span>
          </article>

          <article className="dashboard-placeholder agent-status-card">
            <strong>Localisation</strong>
            <span>
              {currentPosition
                ? nomLieuAgent
                  ? `📍 ${nomLieuAgent} · ${formatDistanceLabel(calculateDistanceKm(currentPosition, gpsConfig))}`
                  : `${getGpsLabel()} · ${formatDistanceLabel(calculateDistanceKm(currentPosition, gpsConfig))}`
                : 'La localisation sera capturée au moment du pointage.'}
            </span>
          </article>

          <article className="dashboard-placeholder agent-status-card">
            <strong>Type de présence</strong>
            <span>{latestPresence ? formatPresenceType(latestPresence.typePresence) : formatPresenceType(pointageType)}</span>
          </article>
        </div>
      </section>
    );
  };

  const renderAgentOverview = () => (
    <>
      <section className="dashboard-hero-card-agent-hero-card">
        <div className="dashboard-hero-copy">
          <span className="dashboard-status-pill">{roleContent.subtitle}</span>
          <h1>Bienvenue, {user?.role || 'role'} {user?.prenom || user?.nom || 'utilisateur'}.</h1>
          <p>{roleContent.summary}</p>
        </div>
      </section>

      {renderPresenceSummary()}
    </>
  );

  const renderChefOverview = () => (
    <>
      
        <div className="dashboard-hero-copy">
          <span className="dashboard-status-pill">{roleContent.subtitle}</span>
          <h1>Bienvenue,{user?.role || 'role'} {user?.prenom || user?.nom || 'utilisateur'}.</h1>
          <p>{roleContent.summary}</p>
        </div>
      
      {renderPresenceSummary()}
    </>
  );

  const renderPointagePanel = () => (
    <section className="dashboard-panel dashboard-panel-wide agent-pointage-hero">
      <div className="admin-section-head">
        <div>
          <h2>Marquer présence</h2>
          <p className="panel-note">
            Ta position GPS est d’abord vérifiée dans la zone autorisée, puis tu valides ton identité par reconnaissance faciale.
          </p>
        </div>
        <span className="dashboard-status-pill">Pointage personnel</span>
      </div>

      {pointageFeedback && (
        <div className={pointageFeedback.type === 'error' ? 'form-error' : 'form-success'}>
          {pointageFeedback.message}
        </div>
      )}

      <div className="agent-pointage-grid">
        <article className="dashboard-placeholder gps-map-card">
          <div className="gps-map-head">
            <div>
              <strong>Carte GPS — Bénin</strong>
              <span>
                {gpsConfig.nom} · périmètre autorisé{' '}
                {gpsConfig.rayonKm.toFixed(0)} km
              </span>
            </div>
            <span className={`presence-status-badge ${currentPosition ? 'is-present' : 'is-gps'
              }`}>
              {currentPosition ? 'Position capturée' : 'En attente'}
            </span>
          </div>

          <PresenceMap
            userPosition={currentPosition}
            rayonKm={gpsConfig.rayonKm}
            centerPosition={{ latitude: gpsConfig.latitude, longitude: gpsConfig.longitude }}
            centerLabel={gpsConfig.nom}
            userLocationName={nomLieuAgent}
          />

          <div className="gps-map-footer">
            <div>
              <span>Distance au lieu autorisé</span>
              <strong>
                {currentPosition
                  ? `${calculateDistanceKm(currentPosition, gpsConfig).toFixed(2)} km`
                  : 'En attente'}
              </strong>
            </div>
            <div>
              <span>Lieu détecté</span>
              <strong style={{ color: '#2d6b47', fontSize: '0.85rem' }}>
                {nomLieuAgent
                  ? `📍 ${nomLieuAgent}`
                  : currentPosition
                    ? 'Résolution du lieu...'
                    : '—'}
              </strong>
            </div>
            <div>
              <span>Précision de la position</span>
              <strong>
                {currentPosition?.accuracy
                  ? `± ${Math.round(currentPosition.accuracy)} m`
                  : '—'}
              </strong>
            </div>
          </div>

          {/*
            * Sans puce GPS, le navigateur localise par Wi-Fi ou par
            * adresse IP : la position peut alors être fausse de
            * plusieurs kilomètres. On le signale plutôt que de
            * laisser croire à une mesure fiable.
            */}
          {currentPosition?.accuracy > 300 && (
            <div className="form-error" style={{ marginTop: '10px' }}>
              Position approximative (± {Math.round(currentPosition.accuracy)} m) : cet appareil
              n'a pas de GPS et se localise par le réseau. Utilise un téléphone pour un
              pointage fiable.
            </div>
          )}
        </article>
        <div className="agent-pointage-outer">
          <button
            type="button"
            className="agent-pointage-orb"
            onClick={openFaceVerificationBeforePointage}
            disabled={isSubmittingPointage}
          >
            <strong>{isSubmittingPointage ? 'Pointage en cours...' : 'Marquer votre présence'}</strong>
          </button>

          <div className="agent-pointage-statusline">
            <p>Le pointage vérifie d’abord ta position GPS, puis ton visage.</p>
          </div>
        </div>

      </div>



      {/*
        * Le type de pointage n'est plus choisi : il découle du
        * planning du jour. L'agent voit ce qui s'applique et
        * pourquoi, sans pouvoir se tromper de lieu de référence.
        */}
      <div className="pointage-contexte">
        <div>
          <span>Type de pointage</span>
          <strong>{formatPresenceType(contextePointage?.typePresence || 'BUREAU')}</strong>
        </div>
        <div>
          <span>Lieu de référence</span>
          <strong>{contextePointage?.nomLieu || gpsConfig.nom}</strong>
        </div>
        <div>
          <span>Rayon autorisé</span>
          <strong>
            {contextePointage?.rayonKm != null
              ? `${contextePointage.rayonKm} km`
              : `${gpsConfig.rayonKm} km`}
          </strong>
        </div>
      </div>

      {contextePointage?.motif && (
        <p className="pointage-contexte-motif">
          {contextePointage.typePresence === 'MISSION' ? 'Mission' : 'Réunion'} du jour :
          <strong> {contextePointage.motif}</strong>. Ton lieu de référence est celui fixé par
          ton chef de service, et redeviendra le lieu habituel demain.
        </p>
      )}

      <div className="admin-form-actions" style={{ marginTop: '12px' }}>
        <button type="button" className="secondary-button" onClick={goToHistory}>
          Voir l’historique
        </button>
      </div>
    </section>
  );

  const renderHistoryPanel = ({
    title = 'Historique de présence',
    note = 'Consulte l’ensemble de tes pointages enregistrés.',
    badgeLabel = `${history.length} entrée(s)`,
    emptyTitle = 'Aucune présence enregistrée',
    emptyMessage = 'Ton premier pointage apparaîtra ici une fois enregistré.',
    includeAnalytics = false,
  } = {}) => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>{title}</h2>
          <p className="panel-note">{note}</p>
        </div>
        <span className="dashboard-status-pill">{badgeLabel}</span>
      </div>

      {historyFeedback && historyFeedback.type === 'error' && <div className="form-error">{historyFeedback.message}</div>}
 
      {includeAnalytics && (
        <div className="chef-metrics-grid">
          <article className="dashboard-stat-card chef-metric-card">
            <span>Pointages</span>
            <strong>{history.length}</strong>
            <p>Nombre total de tes pointages enregistrés.</p>
          </article>

          <article className="dashboard-stat-card chef-metric-card">
            <span>Dernier statut</span>
            <strong>{latestPresence ? formatPresenceStatus(latestPresence.statutPresence) : 'Aucun'}</strong>
            <p>Le dernier contrôle sert de repère pour la ponctualité du service.</p>
          </article>

          <article className="dashboard-stat-card chef-metric-card">
            <span>Dernière heure</span>
            <strong>{latestPresence ? formatDateTime(latestPresence.heurePointage || latestPresence.datePresence) : '—'}</strong>
            <p>Le rythme d’arrivée est visible dans ce même espace.</p>
          </article>

          <article className="dashboard-stat-card chef-metric-card">
            <span>GPS ministère</span>
            <strong>{currentPosition ? formatDistanceLabel(calculateDistanceKm(currentPosition, gpsConfig)) : 'Position en attente'}</strong>
            <p>La zone cible reste alignée sur le ministère et son périmètre autorisé.</p>
          </article>
        </div>
      )}

      {isLoadingHistory ? (
        <div className="dashboard-placeholder">
          <strong>Chargement de l’historique</strong>
          <span>Connexion aux présences de l’agent en cours...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>{emptyTitle}</strong>
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table agent-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Type</th>
                <th>Statut</th>
                <th>GPS</th>
              </tr>
            </thead>
            <tbody>
              {history.map((presence) => (
                <tr key={presence.id ?? `${presence.datePresence}-${presence.heurePointage}`}>
                  <td>{formatDateTime(presence.datePresence)}</td>
                  <td>{formatDateTime(presence.heurePointage)}</td>
                  <td>{formatPresenceType(presence.typePresence)}</td>
                  <td>
                    <span className={`presence-status-badge ${getPresenceBadgeClass(presence.statutPresence)}`}>
                      {formatPresenceStatus(presence.statutPresence)}
                    </span>
                  </td>
                  <td>
                    <strong>Position vérifiée</strong>
                    <div className="table-subnote">Coordonnées du centre de la zone de pointage autorisée.</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderRequestsPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Demandes et justificatifs</h2>
          <p className="panel-note">
            Dépose une demande, consulte l’historique des justificatifs
          </p>
        </div>
        <span className="dashboard-status-pill">Dossier agent</span>
      </div>

      {agentJustificatifsFeedback && (
        <div className={agentJustificatifsFeedback.type === 'error' ? 'form-error' : 'form-success'}>
          {agentJustificatifsFeedback.message}
        </div>
      )}

      <div className="agent-requests-grid">
        <section className="dashboard-panel dashboard-panel-muted">
          <div className="admin-section-head">
            <div>
              <h2>Nouvelle demande</h2>
            </div>
            <span className="dashboard-status-pill">Soumission</span>
          </div>

          <form className="dashboard-form" onSubmit={handleAgentJustificatifSubmit}>
            <div className="form-grid">
              <label className="dashboard-field">
                <span>Type de justificatif</span>
                <input
                  type="text"
                  value={agentJustificatifForm.typeJustificatif}
                  onChange={(event) => setAgentJustificatifForm((current) => ({
                    ...current,
                    typeJustificatif: event.target.value,
                  }))}
                  placeholder="Permission, maladie, absence..."
                  required
                />
              </label>

              <label className="dashboard-field">
                <span>Motif</span>
                <input
                  type="text"
                  value={agentJustificatifForm.motif}
                  onChange={(event) => setAgentJustificatifForm((current) => ({
                    ...current,
                    motif: event.target.value,
                  }))}
                  placeholder="Explique brièvement la demande"
                  required
                />
              </label>

              <label className="dashboard-field">
                <span>Date de début</span>
                <input
                  type="date"
                  value={agentJustificatifForm.dateDebut}
                  onChange={(event) => setAgentJustificatifForm((current) => ({
                    ...current,
                    dateDebut: event.target.value,
                  }))}
                />
              </label>

              <label className="dashboard-field">
                <span>Date de fin</span>
                <input
                  type="date"
                  value={agentJustificatifForm.dateFin}
                  onChange={(event) => setAgentJustificatifForm((current) => ({
                    ...current,
                    dateFin: event.target.value,
                  }))}
                />
              </label>
            </div>

            <button
              type="submit"
              className="primary-action-button"
              disabled={isSubmittingAgentJustificatif}
            >
              {isSubmittingAgentJustificatif ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        </section>

        <section className="dashboard-panel dashboard-panel-muted">
          <div className="admin-section-head">
            <div>
              <h2>Mes justificatifs</h2>
            </div>
            <span className="dashboard-status-pill">
              {agentJustificatifs.length} entrée(s)
            </span>
          </div>

          {isLoadingAgentJustificatifs ? (
            <div className="dashboard-placeholder">
              <strong>Chargement des justificatifs</strong>
              <span>Connexion aux demandes de l’agent en cours...</span>
            </div>
          ) : agentJustificatifs.length === 0 ? (
            <div className="dashboard-placeholder dashboard-placeholder-muted">
              <strong>Aucun justificatif pour l’instant</strong>
            </div>
          ) : (
            <div className="agent-justificatifs-list">
              {agentJustificatifs.map((item, index) => {
                const label = item.typeJustificatif || item.type || item.categorie || 'Justificatif';
                const status = String(item.statut || item.status || 'EN_ATTENTE').toUpperCase();
                const dateValue = item.dateJustificatif || item.dateDemande || item.createdAt;
                const badgeClass =
                  status === 'ACCEPTE'
                    ? 'is-present'
                    : status === 'REFUSE'
                      ? 'is-late'
                      : 'is-gps';
                const statusLabel =
                  status === 'ACCEPTE'
                    ? 'Accepté'
                    : status === 'REFUSE'
                      ? 'Refusé'
                      : 'En attente';
                const periode = formatPeriode(item.dateDebut, item.dateFin);
                const chefServiceNom = monChefService
                  ? [monChefService.prenom, monChefService.nom].filter(Boolean).join(' ')
                  : '';

                return (
                  <article key={item.id ?? `${label}-${index}`} className="agent-justificatif-card">
                    <button
                      type="button"
                      className="agent-justificatif-delete-btn"
                      onClick={() => handleDeleteJustificatif(item.id)}
                      title="Supprimer ce justificatif"
                    >
                      ✕
                    </button>

                    <div className="agent-justificatif-header">
                      <strong>{label}</strong>
                      <span className={`presence-status-badge ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="agent-justificatif-info-chef">
                      <div className="agent-justificatif-info-chef-label">Envoyé à</div>
                      <div style={{ fontWeight: 500 }}>
                        {chefServiceNom || 'Chef de service'}
                      </div>
                    </div>

                    <div className="agent-justificatif-row">
                      {formatDateTime(dateValue) !== '—' && (
                        <div className="agent-justificatif-info">
                          <span className="agent-justificatif-info-label">Créé le</span>
                          <span className="agent-justificatif-info-value">
                            {formatDateTime(dateValue)}
                          </span>
                        </div>
                      )}

                      {periode !== '—' && (
                        <div className="agent-justificatif-periode">
                          <div className="agent-justificatif-periode-label">Période</div>
                          <div className="agent-justificatif-periode-value">
                            {periode}
                          </div>
                        </div>
                      )}
                    </div>

                    {(item.motif || item.description) && (
                      <div className="agent-justificatif-motif">
                        <div className="agent-justificatif-motif-label">Motif</div>
                        {item.motif || item.description}
                      </div>
                    )}

                    {status === 'REFUSE' && item.motifRefus && (
                      <div className="agent-justificatif-refus">
                        <div className="agent-justificatif-refus-label">❌ Motif du refus</div>
                        {item.motifRefus}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );

  const renderChefPresencesPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Présences des agents</h2>
          <p className="panel-note">
            Suivi des pointages de l’équipe. Cette vue consolide la lecture du service et les décisions du chef.
          </p>
        </div>
      </div>

      {chefPresencesFeedback && chefPresencesFeedback.type === 'error' && (
        <div className="form-error">{chefPresencesFeedback.message}</div>
      )}

      <div className="chef-team-grid">
        <article className="dashboard-stat-card chef-metric-card">
          <span>Agents du service</span>
          <strong>{agentsDuService.filter(p => (p.utilisateur?.email || p.email) !== user?.email).length}</strong>

          <p>Nombre total d'agents rattachés à votre service.</p>
        </article>

        <article className="dashboard-stat-card chef-metric-card">
          <span>Présences du jour</span>
          <strong>{chefPresences.length ? 'Chargées' : 'À charger'}</strong>
          <p>Pointages, retards et absences de l’équipe.</p>
        </article>

        <article className="dashboard-stat-card chef-metric-card">
          <span>Dernière synchronisation</span>
          <strong>{chefPresences.length ? 'OK' : 'En attente'}</strong>
          <p>La Mise à jour du système est automatique</p>
        </article>
      </div>

      {isLoadingChefPresences ? (
        <div className="dashboard-placeholder">
          <strong>Chargement des présences du service</strong>
          <span>Récupération des données de l’équipe en cours...</span>
        </div>
      ) : chefPresences.length === 0 ? (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Aucune présence enregistrée</strong>
          <span>
            Les pointages des agents de ton service apparaîtront ici dès qu’ils auront commencé à pointer.
          </span>
        </div>
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table agent-history-table chef-team-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Dernier pointage</th>
                <th>Statut</th>
                <th>Type</th>
                <th>GPS</th>
              </tr>
            </thead>
            <tbody>
              {chefPresences
                // 👇 AJOUT DE CE FILTRE : Exclut la ligne si l'email de l'agent correspond à celui du chef connecté
                .filter((item) => {
                  const person = item.utilisateur || item.agent || item.user || item;
                  return person?.email !== user?.email;
                })
                .map((item, index) => {
                  const person = item.utilisateur || item.agent || item.user || item;
                  const name = [person?.nom, person?.prenom].filter(Boolean).join(' ').trim() || person?.email || `Agent ${index + 1}`;
                  const pointage = item.heurePointage || item.datePointage || item.datePresence || item.createdAt;
                  const latitude = Number(item.latitude ?? item.lat);
                  const longitude = Number(item.longitude ?? item.lng ?? item.lon);
                  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

                  return (
                    <tr key={item.id ?? `${name}-${pointage}-${index}`}>
                      <td>
                        <strong>{name}</strong>
                        <div className="table-subnote">{person?.email || 'Compte rattaché au service'}</div>
                      </td>
                      <td>{formatDateTime(pointage)}</td>
                      <td>
                        <span className={`presence-status-badge ${getPresenceBadgeClass(item.statutPresence)}`}>
                          {formatPresenceStatus(item.statutPresence)}
                        </span>
                      </td>
                      <td>{formatPresenceType(item.typePresence)}</td>
                      <td>
                        <strong>
                          {item.nomLieu
                            ? `📍 ${item.nomLieu}`
                            : hasCoordinates
                              ? 'Résolution du lieu...'
                              : '—'}
                        </strong>
                        <div className="table-subnote">Suivi de zone pour le chef de service.</div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  /*
   * Champs lieu + rayon réutilisables pour Mission/Réunion : le
   * chef de service saisit simplement un lieu en texte libre et
   * un rayon d'autorisation en km. Les coordonnées GPS du lieu
   * sont résolues côté backend, pour que le pointage en
   * mission/réunion sache vérifier la bonne zone ce jour-là.
   */
  const renderLieuField = (form, setForm, libelle) => (
    <>
      <label className="field-input-wrap field-input-wrap-plain">
        <input
          type="text"
          value={form.lieu || ''}
          placeholder={`Lieu de la ${libelle}...`}
          required
          onChange={(e) => {
            const newValue = e.target.value;
            setForm((current) => ({ ...current, lieu: newValue }));
          }}
        />
      </label>
      <label className="field-input-wrap field-input-wrap-plain">
        <input
          type="number"
          min="0"
          step="0.1"
          value={form.rayonKm}
          placeholder="Rayon d'autorisation (km)"
          required
          onChange={(e) => {
            const newValue = e.target.value;
            setForm((current) => ({ ...current, rayonKm: newValue }));
          }}
        />
      </label>
    </>
  );

  const renderParticipantSelector = (selectedIds, setForm) => (
    <div className="participant-selector">
      <span className="participant-selector-label">
        Agents concernés
      </span>

      <div className="participant-list">
        {agentsDuService.map((agent) => {
          const agentId = Number(agent.id);
          const isSelected = selectedIds
            .map(Number)
            .includes(agentId);

          const fullName = [agent.prenom, agent.nom]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={agent.id}
              type="button"
              className={`participant-card ${isSelected ? 'participant-card-selected' : ''
                }`}
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  participantIds: isSelected
                    ? current.participantIds.filter(
                      (id) => Number(id) !== agentId
                    )
                    : [...current.participantIds, agentId],
                }));
              }}
            >
              <span className="participant-card-check">
                {isSelected ? '✓' : '○'}
              </span>

              <span className="participant-card-name">
                {fullName}
              </span>
            </button>
          );
        })}
      </div>

      <span className="participant-selector-help">
        {selectedIds.length === 0
          ? 'Aucun agent sélectionné'
          : `${selectedIds.length} agent(s) sélectionné(s)`}
      </span>
    </div>
  );
  const renderChefOperationsPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Missions & réunions</h2>
          <p className="panel-note">
            Formulaires de création et d'affectation pour le service. Les agents concernés recevront instantanément une notification.
          </p>
        </div>
        <span className="dashboard-status-pill">Organisation</span>
      </div>

      {chefOperationsFeedback && chefOperationsFeedback.type === 'error' && (
        <div className="form-error">{chefOperationsFeedback.message}</div>
      )}

      {chefOperationsFeedback && chefOperationsFeedback.type === 'success' && (
        <div className="form-success">{chefOperationsFeedback.message}</div>
      )}


  <div className="operations-accordion">
  <div className="operation-bloc">
  <button
    type="button"
    className="operation-toggle"
    onClick={() =>
      setOperationOuverte(
        operationOuverte === 'mission' ? null : 'mission'
      )
    }
  >
    <span>
      <strong>Nouvelle mission</strong>
      <small>Attribuer une mission aux agents du service</small>
    </span>
    <span>{operationOuverte === 'mission' ? '⌃' : '⌄'}</span>
  </button>

  {operationOuverte === 'mission' && (
          <form className="chef-form" onSubmit={handleMissionSubmit}>
            <label className="field-input-wrap field-input-wrap-plain">
              <input
                type="text"
                value={missionForm.titre}
                onChange={(event) => setMissionForm((current) => ({ ...current, titre: event.target.value }))}
                placeholder="Titre de la mission"
                required
              />
            </label>

            {renderParticipantSelector(
              missionForm.participantIds,
              setMissionForm
            )}

            <div className="chef-form-grid-two">
              {renderLieuField(missionForm, setMissionForm, 'mission')}

              <label className="field-input-wrap field-input-wrap-plain">
                <input
                  type="datetime-local"
                  value={missionForm.echeance}
                  onChange={(event) => setMissionForm((current) => ({ ...current, echeance: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className="chef-textarea-wrap">
              <textarea
                value={missionForm.description}
                onChange={(event) => setMissionForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description, objectifs et consignes"
                rows="4"
              />
            </label>

            <div className="admin-form-actions">
              <button type="submit" className="primary-button" disabled={isSubmittingMission}>
                {isSubmittingMission ? 'Création...' : 'Créer la mission'}
              </button>
            </div>
          </form>
  )}
  </div>

  <div className="operation-bloc">
  <button
    type="button"
    className="operation-toggle"
    onClick={() =>
      setOperationOuverte(
        operationOuverte === 'reunion' ? null : 'reunion'
      )
    }
  >
    <span>
      <strong>Nouvelle réunion de service</strong>
      <small>Planifier une réunion avec les agents</small>
    </span>
    <span>{operationOuverte === 'reunion' ? '⌃' : '⌄'}</span>
  </button>

  {operationOuverte === 'reunion' && (
    /* ICI : ton article/formulaire Réunion actuel */
          <form className="chef-form" onSubmit={handleReunionSubmit}>
            <label className="field-input-wrap field-input-wrap-plain">
              <input
                type="text"
                value={reunionForm.titre}
                onChange={(event) => setReunionForm((current) => ({ ...current, titre: event.target.value }))}
                placeholder="Titre de la réunion"
                required
              />
            </label>
            {renderParticipantSelector(
              reunionForm.participantIds,
              setReunionForm
            )}

            <div className="chef-form-grid-two">
              {renderLieuField(reunionForm, setReunionForm, 'réunion')}

              <label className="field-input-wrap field-input-wrap-plain">
                <input
                  type="datetime-local"
                  value={reunionForm.dateReunion}
                  onChange={(event) => setReunionForm((current) => ({ ...current, dateReunion: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className="chef-textarea-wrap">
              <textarea
                value={reunionForm.ordreDuJour}
                onChange={(event) => setReunionForm((current) => ({ ...current, ordreDuJour: event.target.value }))}
                placeholder="Ordre du jour, participants et points à traiter"
                rows="4"
              />
            </label>

            <div className="admin-form-actions">
              <button type="submit" className="primary-button" disabled={isSubmittingReunion}>
                {isSubmittingReunion ? 'Création...' : 'Créer la réunion'}
              </button>
            </div>
          </form>
  )}
  </div>

</div>

      <div className="chef-operations-grid">
        <article className="dashboard-placeholder">
          <strong>Missions créées ({chefMissions.length})</strong>
          {chefMissions.length === 0 ? (
            <span>Aucune mission enregistrée pour le moment.</span>
          ) : (
            <ul className="operation-list">
              {chefMissions.map((mission) => (
                <li key={mission.id}>
                  <div className="operation-list-head">
                    <strong>{mission.titre}</strong>
                    <button
                      type="button"
                      className="admin-mini-button admin-mini-button-danger"
                      onClick={() => handleSupprimerOperation('mission', mission)}
                      disabled={isDeletingOperation}
                    >
                      Supprimer
                    </button>
                  </div>
                  <span>
                    {formatDateTime(mission.dateMission)}
                    {mission.lieu ? ` · ${mission.lieu}` : ''}
                    {` · ${mission.participants?.length ?? 0} agent(s)`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dashboard-placeholder">
          <strong>Réunions créées ({chefReunions.length})</strong>
          {chefReunions.length === 0 ? (
            <span>Aucune réunion enregistrée pour le moment.</span>
          ) : (
            <ul className="operation-list">
              {chefReunions.map((reunion) => (
                <li key={reunion.id}>
                  <div className="operation-list-head">
                    <strong>{reunion.titre}</strong>
                    <button
                      type="button"
                      className="admin-mini-button admin-mini-button-danger"
                      onClick={() => handleSupprimerOperation('reunion', reunion)}
                      disabled={isDeletingOperation}
                    >
                      Supprimer
                    </button>
                  </div>
                  <span>
                    {formatDateTime(reunion.dateReunion)}
                    {reunion.lieu ? ` · ${reunion.lieu}` : ''}
                    {` · ${reunion.participants?.length ?? 0} agent(s)`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
  // Dashboard.jsx - Ajouter après les autres handlers

  // Validation d'un justificatif (Accepter)
  const handleValiderJustificatif = async (justificatifId) => {
    try {
      const response = await validerJustificatif(justificatifId);
      showLocalToast({
        type: 'success',
        message: response.data || 'Justificatif accepté avec succès.',
      });
      // Recharger la liste
      await loadChefJustificatifs({ silent: true });
    } catch (error) {
      showLocalToast({
        type: 'error',
        message: error?.response?.data || 'Impossible d\'accepter le justificatif.',
      });
    }
  };

  // Refus d'un justificatif
  const handleRefuserJustificatif = async (justificatifId) => {
    // Demander un motif de refus (optionnel mais recommandé)
    const motif = window.prompt('Motif du refus (optionnel) :');
    // Si l'utilisateur annule, on ne fait rien
    if (motif === null) return;

    try {
      const response = await refuserJustificatif(justificatifId, motif);
      showLocalToast({
        type: 'error',
        message: response.data || 'Justificatif refusé.',
      });
      // Recharger la liste
      await loadChefJustificatifs({ silent: true });
    } catch (error) {
      showLocalToast({
        type: 'error',
        message: error?.response?.data || 'Impossible de refuser le justificatif.',
      });
    }
  };
  const renderChefJustificatifsPanel = () => {
    // Filtrer les justificatifs : exclure ceux du chef connecté
    const justificatifsFiltres = chefJustificatifs.filter((item) => {
      const person = item.utilisateur || item.agent || item.user || item;
      return person?.email !== user?.email;
    });

    return (
      <section className="dashboard-panel dashboard-panel-wide">
        <div className="admin-section-head">
          <div>
            <h2>Justificatifs</h2>
            <p className="panel-note">Valide les permissions et les justificatifs transmis par les agents.</p>
          </div>
          <span className="dashboard-status-pill">Validation</span>
        </div>

        {isLoadingChefJustificatifs ? (
          <div className="dashboard-placeholder">
            <strong>Chargement des justificatifs</strong>
            <span>Récupération des demandes du service en cours...</span>
          </div>
        ) : justificatifsFiltres.length === 0 ? (
          <div className="dashboard-placeholder">
            <strong>Aucun justificatif en attente</strong>
            <span>Les demandes des agents apparaîtront ici dès qu'elles seront soumises.</span>
          </div>
        ) : (
          <div className="chef-justificatifs-grid">
            {justificatifsFiltres.map((item, index) => {
              const person = item.utilisateur || item.agent || item.user || item;
              const name = [person?.nom, person?.prenom].filter(Boolean).join(' ').trim() || person?.email || `Agent ${index + 1}`;
              const label = item.titre || item.type || 'Justificatif';
              const status = item.statut || item.status || 'EN_ATTENTE';
              const dateValue = item.dateCreation || item.dateSoumission || item.createdAt;
              const isEnAttente = String(status).toUpperCase() === 'EN_ATTENTE';
              const badgeClass = isEnAttente ? 'is-gps' : String(status).toUpperCase() === 'ACCEPTE' ? 'is-present' : 'is-late';

              return (
                <article key={item.id ?? `${name}-${index}`} className="chef-justificatif-card">
                  <div className="chef-justificatif-header">
                    <strong>{label}</strong>
                    <span className={`presence-status-badge ${badgeClass}`}>
                      {isEnAttente ? 'En attente' : String(status).replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="chef-justificatif-body">
                    <span className="chef-justificatif-employe">
                      👤 {name}
                    </span>
                    <span className="chef-justificatif-date">
                      📅 Créé le {formatDateTime(dateValue)}
                    </span>
                    {formatPeriode(item.dateDebut, item.dateFin) !== '—' && (
                      <span className="chef-justificatif-date">
                        📋 Période: {formatPeriode(item.dateDebut, item.dateFin)}
                      </span>
                    )}
                    {(item.description || item.motif) && (
                      <p className="chef-justificatif-description">
                        <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: '#7a8a7a', textTransform: 'uppercase' }}>
                          Motif
                        </strong>
                        {item.description || item.motif}
                      </p>
                    )}
                    {item.motifRefus && (
                      <p className="chef-justificatif-refus">
                        <strong style={{ display: 'block', marginBottom: '4px' }}>❌ Motif du refus</strong>
                        {item.motifRefus}
                      </p>
                    )}
                  </div>
                  {isEnAttente && (
                    <div className="chef-justificatif-actions">
                      <button
                        type="button"
                        className="admin-mini-button-success"
                        onClick={() => handleValiderJustificatif(item.id)}
                      >
                        ✓ Accepter
                      </button>
                      <button
                        type="button"
                        className="admin-mini-button-danger"
                        onClick={() => handleRefuserJustificatif(item.id)}
                      >
                        ✗ Refuser
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  };
  const renderNotesChefPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Notes & classement</h2>
          <p className="panel-note">
            Les notes de vos agents sont calculées automatiquement à partir de leur
            score de ponctualité. Le classement du service se met à jour tout seul.
          </p>
        </div>
        <span className="dashboard-status-pill">Évaluation</span>
      </div>

      {/* Sélecteur mois/année */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Mois</span>
          <select
            value={notesMois}
            onChange={(e) => {
              setNotesMois(Number(e.target.value));
            }}
          >
            {[
              'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ].map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>

        <label className="dashboard-field" style={{ margin: 0 }}>
          <span>Année</span>
          <select
            value={notesAnnee}
            onChange={(e) => {
              setNotesAnnee(Number(e.target.value));
            }}
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      {notesFeedback && (
        <div className={notesFeedback.type === 'error' ? 'form-error' : 'form-success'}>
          {notesFeedback.message}
        </div>
      )}

      {isLoadingNotes ? (
        <div className="dashboard-placeholder">
          <strong>Chargement des notes</strong>
          <span>Récupération des données en cours...</span>
        </div>
      ) : classementAgents.length === 0 ? (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Aucune note pour ce mois</strong>
          <span>
            Calculez d'abord la note automatique de chaque agent en cliquant sur
            "Calculer note auto" dans le tableau ci-dessous.
          </span>
        </div>
      ) : (
        <>
          {/* Tableau notes */}
          <div className="attendance-table-wrap" style={{ marginBottom: '28px' }}>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Note automatique /20</th>
                </tr>
              </thead>
              <tbody>
                {classementAgents.map((n) => {
                  const agentId = n.utilisateur?.id;
                  const nom = [n.utilisateur?.prenom, n.utilisateur?.nom]
                    .filter(Boolean).join(' ') || '—';
                  return (
                    <tr key={agentId}>
                      <td><strong>{nom}</strong></td>
                      <td>
                        {n.noteAutomatique != null
                          ? `${n.noteAutomatique.toFixed(2)}/20`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Classement */}
          <div className="admin-section-head" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
              🏆 Classement du service — {[
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
              ][notesMois - 1]} {notesAnnee}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...classementAgents]
              .filter((n) => n.noteAutomatique != null)
              .sort((a, b) => b.noteAutomatique - a.noteAutomatique)
              .map((n, index) => {
                const nom = [n.utilisateur?.prenom, n.utilisateur?.nom]
                  .filter(Boolean).join(' ') || '—';
                const medals = ['🥇', '🥈', '🥉'];
                const medal = medals[index] ?? `${index + 1}.`;
                const pct = (n.noteAutomatique / 20) * 100;
                return (
                  <div
                    key={n.utilisateur?.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      background: index === 0 ? '#f0fdf4' : '#fafafa',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      border: index === 0 ? '1px solid #bbf7d0' : '1px solid #eee',
                    }}
                  >
                    <span style={{ fontSize: '22px', minWidth: '32px' }}>{medal}</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px' }}>{nom}</strong>
                      <div style={{
                        marginTop: '4px',
                        height: '6px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: index === 0 ? '#16a34a' : '#1e5eff',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '15px',
                      color: index === 0 ? '#16a34a' : '#1a1a2e',
                      minWidth: '52px',
                      textAlign: 'right',
                    }}>
                      {n.noteAutomatique.toFixed(2)}/20
                    </span>
                  </div>
                );
              })}
            {classementAgents.filter((n) => n.noteAutomatique != null).length === 0 && (
              <div className="dashboard-placeholder dashboard-placeholder-muted">
                <strong>Classement indisponible</strong>
                <span>Le classement apparaît dès que les notes automatiques du mois sont calculées.</span>
              </div>
            )}
          </div>
        </>
      )}

    </section>
  );

  const renderChefHistoryPanel = () =>
    renderHistoryPanel({
      title: 'Historique & analyses',
      note: 'Suivi personnel du chef et lecture synthétique de la ponctualité pour mieux piloter l’arrivée au poste.',
      badgeLabel: `${history.length} entrée(s)`,
      emptyTitle: 'Aucune présence chef enregistrée',
      emptyMessage: 'Le premier pointage du chef apparaîtra ici dès qu’il marquera sa présence.',
      includeAnalytics: true,
    });

  const renderAnalyseIAPanel = () => {
    const analyseDuJour = analysesIA[0];

    return (
      <section className="dashboard-panel dashboard-panel-wide">
        <div className="admin-section-head">
          <div>
            <h2>Analyse intelligente</h2>
            <p className="panel-note">
              Votre conseiller personnel basé sur vos données de présence.
            </p>
          </div>
          <span className="dashboard-status-pill">Synthèse IA</span>
        </div>

        {analysesIAFeedback && analysesIAFeedback.type === 'error' && (
          <div className="form-error">{analysesIAFeedback.message}</div>
        )}
        {analysesIAFeedback && analysesIAFeedback.type === 'success' && (
          <div className="form-success">{analysesIAFeedback.message}</div>
        )}

        {isLoadingAnalysesIA ? (
          <div className="dashboard-placeholder" style={{ marginTop: '16px' }}>
            <strong>Chargement de votre analyse</strong>
            <span>Chargement des données en cours...</span>
          </div>
        ) : !analyseDuJour ? (
          <div className="dashboard-placeholder dashboard-placeholder-muted" style={{ marginTop: '16px' }}>
            <strong>Aucune analyse disponible pour le moment</strong>
            <span>Votre première analyse sera générée automatiquement après votre premier pointage.</span>
          </div>
        ) : (
          <>
            {!analyseDuJour.analyseComplete && (
              <div className="form-error" style={{ marginBottom: '12px' }}>
                ⚠️ Données encore limitées ({analyseDuJour.joursCollectes}/14 jours). Cette analyse est partielle.
              </div>
            )}

            {renderConseillerCard(analyseDuJour)}

            <div className="admin-form-actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={handleGenererAnalyseIA}
                disabled={isGeneratingAnalyseIA || !analyseDuJour.analyseComplete}
                title={!analyseDuJour.analyseComplete ? `Disponible dans ${14 - analyseDuJour.joursCollectes} jour(s)` : ''}
                style={!analyseDuJour.analyseComplete ? {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  background: '#ccc',
                  color: '#666',
                  borderColor: '#ccc',
                } : {}}
              >
                {isGeneratingAnalyseIA
                  ? 'Actualisation...'
                  : !analyseDuJour.analyseComplete
                    ? `Disponible dans ${14 - analyseDuJour.joursCollectes} jour(s)`
                    : 'Actualiser mon analyse'}
              </button>
            </div>
          </>
        )}

        {renderClassementCard()}
      </section>
    );
  };

  /*
   * Classement de l'utilisateur : parmi les membres de son service
   * pour un agent, parmi les chefs de service pour un chef. La ligne
   * de l'utilisateur connecté est mise en évidence.
   */
  const renderClassementCard = () => {
    const estChef = roleKey === 'CHEF_SERVICE';

    const titre = estChef
      ? 'Classement des chefs de service'
      : 'Mon classement dans le service';

    /*
     * Un chef est classe sur son score final : le Directeur lui
     * attribue une note manuelle qui se combine a sa note
     * automatique. Un agent n'est evalue que par sa note
     * automatique — personne ne le note a la main. La valeur
     * affichee est donc exactement celle qui a servi au tri
     * cote serveur.
     */
    const note = (entree) =>
      (estChef
        ? entree?.scoreFinal ?? entree?.noteAutomatique
        : entree?.noteAutomatique) ?? null;

    return (
      <div className="dashboard-placeholder" style={{ marginTop: '18px' }}>
        <strong>{titre}</strong>
        <p className="panel-note">
          {estChef
            ? 'Position de chaque chef de service selon son score final (note automatique et note du Directeur).'
            : 'Position de chaque membre du service selon sa note automatique de ponctualité.'}
        </p>

        {isLoadingClassement ? (
          <span>Chargement du classement...</span>
        ) : classement.length === 0 ? (
          <span>Le classement apparaîtra dès que les notes seront disponibles.</span>
        ) : (
          <ol className="classement-list">
            {classement.map((entree, index) => {
              const estMoi = entree?.utilisateur?.id === user?.id;
              const valeur = note(entree);

              return (
                <li
                  key={entree.id ?? index}
                  className={estMoi ? 'classement-item classement-item-moi' : 'classement-item'}
                >
                  <span className="classement-rang">{index + 1}</span>
                  <span className="classement-nom">
                    {estMoi
                      ? 'Moi'
                      : [entree?.utilisateur?.nom, entree?.utilisateur?.prenom]
                          .filter(Boolean)
                          .join(' ') || 'Utilisateur'}
                  </span>
                  <span className="classement-note">
                    {valeur == null ? '—' : `${valeur.toFixed(2)}/20`}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  };

  function getBadgeAffichage(badge) {
    switch (badge) {
      case 'EXEMPLAIRE':
        return { emoji: '🥇', label: 'Exemplaire' };
      case 'TRES_BON':
        return { emoji: '🥈', label: 'Très bon' };
      case 'MOYEN':
        return { emoji: '🥉', label: 'Moyen' };
      default:
        return { emoji: '⚠️', label: 'À améliorer' };
    }
  }

  function getScoreColorClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-bon';
    if (score >= 50) return 'score-moyen';
    return 'score-faible';
  }

  const renderConseillerCard = (analyse) => {
    const badgeInfo = getBadgeAffichage(analyse.badge);
    const scoreClass = getScoreColorClass(analyse.scorePonctualite);

    return (
      <article className="conseiller-card">
        <div className="conseiller-header">
          <div className="conseiller-score-wrap">
            <div className={`conseiller-score-circle ${scoreClass}`}>
              <strong>{Math.round(analyse.scorePonctualite)}%</strong>
              <span>ponctualité</span>
            </div>
          </div>

          <div className="conseiller-badge-info">
            <span className="conseiller-badge-pill">
              {badgeInfo.emoji} {badgeInfo.label}
            </span>
            {analyse.serieJours > 0 && (
              <span className="conseiller-streak">
                🔥 {analyse.serieJours} jour(s) consécutif(s)
              </span>
            )}
            <span className="conseiller-date">
              Analyse du {formatDateTime(analyse.dateAnalyse)}
            </span>
          </div>
        </div>

        <div className="conseiller-message">
          <strong>{analyse.recommandation}</strong>
        </div>

        {analyse.conseil && (
          <div className="conseiller-tip">
            <span className="conseiller-tip-icon">💡</span>
            <p>{analyse.conseil}</p>
          </div>
        )}

        <div className="conseiller-footer-grid">
          <div className="conseiller-mini-stat">
            <span>Taux de présence</span>
            <strong>{analyse.tauxPresence?.toFixed(0)}%</strong>
          </div>
          <div className="conseiller-mini-stat">
            <span>Régularité</span>
            <strong>{analyse.niveauRegularite}</strong>
          </div>
        </div>
      </article>
    );
  };


  const renderParametresPanel = () => (

    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Paramètres du profil</h2>
          <p className="panel-note">
            Tes informations sont mises à jour après modification.
          </p>
        </div>
        <span className="dashboard-status-pill">Mon compte</span>
      </div>

      <div className="parametres-grid">

        {/* INFOS ACTUELLES */}
        <div className="dashboard-placeholder">
          <div className="dashboard-placeholder">
            <strong>Photo de profil</strong>
            <PhotoUploadInput />
          </div>
          <strong>Informations actuelles</strong>
          <div className="profil-info-grid">

            <div className="profil-info-item">
              <span>Nom complet: </span>
              <strong>{[user?.prenom, user?.nom].filter(Boolean).join(' ') || '—'}</strong>
            </div>

            <div className="profil-info-item">
              <span>Email: </span>
              <strong>{user?.email || '—'}</strong>
            </div>

            <div className="profil-info-item">
              <span>Rôle: </span>
              <strong>{roleContent.title}</strong>
            </div>
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className="dashboard-placeholder">
          <strong>Modifier le profil</strong>

          {profilFeedback && (
            <div className={profilFeedback.type === 'error' ? 'form-error' : 'form-success'}>
              {profilFeedback.message}
            </div>
          )}


          <form
            className="parametres-form"
            onSubmit={handleProfilSubmit}
          >
            <div className="parametres-form-grid">
              <div className="dashboard-field">
                <span>Nouveau nom</span>
                <input
                  type="text"
                  value={profilForm.nom}
                  onChange={(e) => setProfilForm(
                    (c) => ({ ...c, nom: e.target.value })
                  )}
                  placeholder={'Entrez votre Nom'}
                />
              </div>

              <div className="dashboard-field">
                <span>Nouveau prénom</span>
                <input
                  type="text"
                  value={profilForm.prenom}
                  onChange={(e) => setProfilForm(
                    (c) => ({ ...c, prenom: e.target.value })
                  )}
                  placeholder="Entrez votre Prénom"
                />
              </div>
            </div>

            <div className="dashboard-field">
              <span>Nouvel email</span>
              <input
                type="email"
                value={profilForm.email}
                onChange={(e) => setProfilForm(
                  (c) => ({ ...c, email: e.target.value })
                )}
                placeholder={'L\'email ici'}
              />
            </div>

            <div className="dashboard-field">
              <span>Nouveau mot de passe</span>
              <input
                type="password"
                value={profilForm.motDePasse}
                onChange={(e) => setProfilForm(
                  (c) => ({ ...c, motDePasse: e.target.value })
                )}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <button
              type="submit"
              className="primary-action-button"
              disabled={isUpdatingProfil}
            >
              {isUpdatingProfil
                ? 'Mise à jour...'
                : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

      </div>
    </section>
  );
  const renderAgentBody = () => {
    if (activePage === 'pointage') {
      return renderPointagePanel();
    }

    if (activePage === 'historique') {
      return renderHistoryPanel();
    }

    if (activePage === 'analyseIA') {
      return renderAnalyseIAPanel();
    }

    if (activePage === 'demandes') {
      return renderRequestsPanel();
    }
    if (activePage === 'parametres') {
      return renderParametresPanel();
    }

    return renderAgentOverview();
  };

  const renderChefBody = () => {
    if (activePage === 'pointage') {
      return renderPointagePanel();
    }
    if (activePage === 'analyseIA') {
      return renderAnalyseIAPanel();
    }
    if (activePage === 'presences') {
      return renderChefPresencesPanel();
    }

    if (activePage === 'operations') {
      return renderChefOperationsPanel();
    }

    if (activePage === 'justificatifs') {
      return renderChefJustificatifsPanel();
    }

    if (activePage === 'notes') {
      return renderNotesChefPanel();
    }

    if (activePage === 'historique') {
      return renderChefHistoryPanel();
    }
    if (activePage === 'parametres') {
      return renderParametresPanel();
    }

    return renderChefOverview();
  };

  const renderBody = () => {
    if (roleKey === 'AGENT') {
      return renderAgentBody();
    }

    if (roleKey === 'CHEF_SERVICE') {
      return renderChefBody();
    }

    if (activeItem.key === 'activation' || activeItem.key === 'missions' || activeItem.key === 'profile') {
      return (
        <section className="dashboard-panel dashboard-panel-wide">
          <h2>{activeItem.label}</h2>
          <p className="panel-note">Cette section n’est pas encore disponible.</p>
          <div className="dashboard-placeholder">
            <strong>Module indisponible</strong>
            <span>Le contenu de cette rubrique sera ajouté prochainement.</span>
          </div>
        </section>
      );
    }

    if (activeItem.key === 'logs' || activeItem.key === 'analyses') {
      return (
        <section className="dashboard-panel dashboard-panel-wide">
          <h2>{activeItem.label}</h2>
          <p className="panel-note">Vue réservée à la supervision et au reporting, sans données simulées.</p>
          <div className="dashboard-placeholder dashboard-placeholder-muted">
            <strong>Vue de contrôle</strong>
            <span>Les tableaux et indicateurs de cette vue seront ajoutés prochainement.</span>
          </div>
        </section>
      );
    }

    return (
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-copy">
          <h1>Bienvenue, {user?.nom || 'utilisateur'}.</h1>
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
          <button
            type="button"
            className="notification-toast-close"
            onClick={() => setLocalToast(null)}
          >
            ✕
          </button>
        </div>
      )}
      <div
        className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}
      >
        <button
          className="dashboard-close-btn"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>

        <Sidebar role={roleKey} activePage={activePage}
          onChangePage={handlePageChange} items={roleContent.items} user={user} onLogout={logout} />
      </div>

      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      <main className="dashboard-main dashboard-main-clean">
        <div className="dashboard-topbar">
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
            <span className="app-user-chip">{user?.role || roleKey}</span>
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
              onClick={() => handlePageChange('parametres')}
              aria-label="Ouvrir mon profil"
              title="Ouvrir mon profil"
            >

              {user?.photoProfil ? (
                <img
                  src={user.photoProfil}
                  alt="profil"
                  className="nav-profile-avatar"
                />
              ) : (
                <span className="nav-profile-placeholder">
                  {`${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase() || 'U'}
                </span>
              )}

            </button>
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
              <Notifications onCountChange={handleNotificationsCountChange} />
            </div>
          </>
        )}
        {renderBody()}

        <button
          className="dashboard-menu-btn dashboard-menu-btn-legacy"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      </main>

      <FaceVerificationModal
        open={isFaceVerificationOpen}
        userName={user?.nom || 'agent'}
        onClose={() => {
          setIsFaceVerificationOpen(false);
          setIsSubmittingPointage(false);
          showLocalToast({
            type: 'error',
            message: 'La vérification faciale est obligatoire avant le pointage.',
          });
        }}
        onSuccess={async () => {
          setIsFaceVerificationOpen(false);
          await handlePointage();
        }}
      />
    </div>
  );
}

export default Dashboard;
