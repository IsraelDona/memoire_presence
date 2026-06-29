import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import FaceVerificationModal from '../components/auth/FaceVerificationModal';
import { normalizeRole } from '../services/authService';
import {
  fetchMesJustificatifs,
  submitJustificatif,
} from '../services/agentService';
import {
  createChefMission,
  createChefReunion,
  fetchChefMissions,
  fetchChefReunions,
  fetchEquipePresences,
  fetchJustificatifsChef,
  fetchAgentsDuService,
  validerJustificatif,      // ✅ AJOUTÉ
  refuserJustificatif       // ✅ AJOUTÉ
} from '../services/chefService';
import { fetchMesPresences, marquerPresence } from '../services/presenceService';
import { genererAnalyseIA, fetchMesAnalysesIA } from '../services/analyseIAService';
import Notifications from '../components/notifications/Notifications';
import PresenceMap from '../components/map/PresenceMap';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';
import {
  updateMonProfil
} from '../services/profilService';
import PhotoUploadInput from '../components/profil/PhotoUploadInput';

import useNotificationsPolling from '../hooks/useNotificationsPolling';
import NotificationToast from '../components/notifications/NotificationToast';
import { reverseGeocode } from '../services/gpsService';


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

const DEFAULT_POINTAGE = 'BUREAU';
const MINISTRY_ZONE = {
  label: 'Ministère de l’Économie et des Finances',
  latitude: 6.3703,
  longitude: 2.3912,
  radiusKm: 1,
};

function FingerprintIcon() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <path d="M33 19c6-4 12-6 15-6 14 0 25 10 25 24 0 6-2 11-5 15" />
      <path d="M27 30c4-5 10-8 20-8 17 0 31 13 31 30 0 8-2 16-6 22" />
      <path d="M23 41c3-7 10-12 18-12 13 0 23 10 23 23 0 8-2 15-6 22" />
      <path d="M28 59c2 11 8 17 18 23" />
      <path d="M40 34c3-2 6-3 9-3 9 0 16 7 16 16 0 8-2 16-6 24" />
      <path d="M46 47c0-5 4-9 9-9 6 0 10 5 10 11 0 7-2 13-5 19" />
      <path d="M64 68c-1 6-4 11-8 16" />
      <path d="M19 72c5-3 8-8 10-14" />
      <circle cx="71" cy="63" r="9" />
      <path d="M71 57v13" />
      <path d="M65 63h12" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}


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
  return 'Position GPS capturée et envoyée au backend';
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
  const [missionForm, setMissionForm] = useState({
    titre: '',
    description: '',
    participantIds: [],
    echeance: '',
    lieu: '', // <--- Ajoute ça ici
  });
  const [reunionForm, setReunionForm] = useState({
    titre: '',
    ordreDuJour: '',
    lieu: '',
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
  const [analysesIAFeedback, setAnalysesIAFeedback] = useState(null);
  const [isGeneratingAnalyseIA, setIsGeneratingAnalyseIA] = useState(false);
  const [hasLoadedAnalysesIA, setHasLoadedAnalysesIA] = useState(false);

  const [profilForm, setProfilForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
  });

  const [profilFeedback, setProfilFeedback] = useState(null);
  const [isUpdatingProfil, setIsUpdatingProfil] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const notifierAction = (setFeedbackFn, type, message) => {
    setFeedbackFn({ type, message });

    setTimeout(() => {
      setFeedbackFn(null);
      showLocalToast({ type, message });
    }, 2500);
  };

  const handleNotificationsCountChange = (count) => {
    setCountManually(count);
  };

  const [nomLieuAgent, setNomLieuAgent] = useState(null);

  const roleKey = normalizeRole(user?.roleKey ?? user?.role);
  const roleContent = ROLE_CONTENT[roleKey] ?? ROLE_CONTENT.AGENT;
  const canPoint = roleKey === 'AGENT' || roleKey === 'CHEF_SERVICE';

  useEffect(() => {
    setHasLoadedHistory(false);
    setHasLoadedAgentJustificatifs(false);
    setHasLoadedChefPresences(false);
    setHasLoadedChefOperations(false);
    setHasLoadedChefJustificatifs(false);
  }, [roleKey]);

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
    if (roleKey !== 'AGENT') {
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
    if (roleKey === 'AGENT') {
      loadAnalysesIA({ silent: true });
    }
  }, [loadAnalysesIA, roleKey]);

  useEffect(() => {
    if (roleKey === 'AGENT' && activePage === 'analyseIA' && !isLoadingAnalysesIA && !hasLoadedAnalysesIA) {
      loadAnalysesIA();
    }
  }, [activePage, hasLoadedAnalysesIA, isLoadingAnalysesIA, loadAnalysesIA, roleKey]);

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

  const handlePointage = async () => {

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

      const response = await marquerPresence({
        latitude: position.latitude,
        longitude: position.longitude,
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

  const openFaceVerificationBeforePointage = () => {

    setIsFaceVerificationOpen(true);
  };

  const handleMissionSubmit = async (event) => {
    event.preventDefault();
    setChefOperationsFeedback(null);
    setIsSubmittingMission(true);

    try {
      const response = await createChefMission(missionForm);
      setChefOperationsFeedback({
        type: 'success',
        message: response.message,
      });
      setMissionForm({
        titre: '',
        description: '',
        participantIds: [],
        echeance: '',
        lieu: '', // <--- Ajoute ça ici aussi pour vider le champ
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
      const response = await createChefReunion(reunionForm);
      setChefOperationsFeedback({
        type: 'success',
        message: response.message,
      });
      setReunionForm({
        titre: '',
        ordreDuJour: '',
        lieu: '',
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
              Le panneau se met à jour après chaque pointage et reflète le dernier statut reçu du backend.
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
                  ? `📍 ${nomLieuAgent} · ${formatDistanceLabel(calculateDistanceKm(currentPosition, MINISTRY_ZONE))}`
                  : `${getGpsLabel()} · ${formatDistanceLabel(calculateDistanceKm(currentPosition, MINISTRY_ZONE))}`
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
          <h1>Bienvenue, {user?.role ||'role' } {user?.prenom || user?.nom ||'utilisateur'}.</h1>
          <p>{roleContent.summary}</p>
        </div>

        {renderPresenceSummary()}
      </section>

    </>
  );

  const renderChefOverview = () => (
    <>
      <section className="dashboard-hero-card agent-hero-card">
        <div className="dashboard-hero-copy">
          <span className="dashboard-status-pill">{roleContent.subtitle}</span>
          <h1>Bienvenue,{user?.role ||'role' } {user?.prenom || user?.nom || 'utilisateur'}.</h1>
          <p>{roleContent.summary}</p>
        </div>
      </section>
      {renderPresenceSummary()}
    </>
  );

  const renderPointagePanel = () => (
    <section className="dashboard-panel dashboard-panel-wide agent-pointage-hero">
      <div className="admin-section-head">
        <div>
          <h2>Marquer présence</h2>
          <p className="panel-note">
            La caméra vérifie d’abord ton visage. Ensuite le système capture ta position GPS et
            valide la zone autorisée autour du Ministère.
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
                {MINISTRY_ZONE.label} · périmètre autorisé{' '}
                {MINISTRY_ZONE.radiusKm.toFixed(0)} km
              </span>
            </div>
            <span className={`presence-status-badge ${currentPosition ? 'is-present' : 'is-gps'
              }`}>
              {currentPosition ? 'Position capturée' : 'En attente'}
            </span>
          </div>

          <PresenceMap
            userPosition={currentPosition}
            rayonKm={MINISTRY_ZONE.radiusKm}
          />

          <div className="gps-map-footer">
            <div>
              <span>Distance au lieu autorisé</span>
              <strong>
                {currentPosition
                  ? `${calculateDistanceKm(currentPosition, MINISTRY_ZONE).toFixed(2)} km`
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
          </div>
        </article>
        <div className="agent-pointage-outer">
          <button
            type="button"
            className="agent-pointage-orb"
            onClick={openFaceVerificationBeforePointage}
            disabled={isSubmittingPointage}
          >
            <span className="agent-pointage-orb-icon">
              <FingerprintIcon />
              <MapPinIcon />
            </span>
            <strong>{isSubmittingPointage ? 'Pointage en cours...' : 'Vérifier puis pointer'}</strong>
            <span>Visage + GPS · zone autorisée pour le pointage .</span>
          </button>

          <div className="agent-pointage-statusline">
            <span className={`presence-status-badge ${getPresenceBadgeClass(latestPresence?.statutPresence)}`}>
              {latestPresence ? formatPresenceStatus(latestPresence.statutPresence) : 'Non pointé'}
            </span>
            <p>Le pointage passe d’abord par la vérification faciale.</p>
          </div>
        </div>

      </div>



      <div className="admin-form-grid agent-pointage-form">
        <label className="field-input-wrap field-input-wrap-plain">
          <select value={pointageType} onChange={(event) => setPointageType(event.target.value)}>
            <option value="BUREAU">Bureau</option>
            <option value="MISSION">Mission</option>
            <option value="REUNION">Réunion</option>
          </select>
        </label>

        <div className="admin-form-actions">
          <button type="button" className="secondary-button" onClick={goToHistory}>
            Voir l’historique
          </button>
        </div>
      </div>
    </section>
  );

  const renderHistoryPanel = ({
    title = 'Historique de présence',
    note = 'Consulte tes pointages enregistrés par le backend.',
    badgeLabel = `${history.length} entrée(s)`,
    emptyTitle = 'Aucune présence enregistrée',
    emptyMessage = 'Le premier pointage apparaîtra ici après validation du backend.',
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
            <p>Enregistrements personnels disponibles dans le backend.</p>
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
            <strong>{currentPosition ? formatDistanceLabel(calculateDistanceKm(currentPosition, MINISTRY_ZONE)) : 'Position en attente'}</strong>
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
                    <div className="table-subnote">Coordonnées utilisées par le backend pour la zone autorisée.</div>
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
            Dépose une demande, consulte l’historique des justificatifs et suis les retours du backend.
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
              <p className="panel-note">Prépare une permission ou un justificatif à envoyer au backend.</p>
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
              <p className="panel-note">Historique des demandes déjà déposées et leur statut.</p>
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
              <span>Les demandes transmises au backend apparaîtront ici dès qu’elles seront disponibles.</span>
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

                return (
                  <article key={item.id ?? `${label}-${index}`} className="dashboard-placeholder dashboard-placeholder-muted">
                    <strong>{label}</strong>
                    <span>{item.motif || item.description || 'Demande transmise au service.'}</span>
                    <div className="table-subnote">{formatDateTime(dateValue)}</div>
                    <div className="admin-row-actions">
                      <span className={`presence-status-badge ${badgeClass}`}>
                        {status === 'ACCEPTE'
                          ? 'Accepté'
                          : status === 'REFUSE'
                            ? 'Refusé'
                            : 'En attente'}
                      </span>
                    </div>
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
          <strong>{chefPresences.length ? 'OK' : 'Backend'}</strong>
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
          <strong>Consultation des présences</strong>
          <span>
            La route backend des présences agents doit renvoyer la liste du service pour activer complètement cette
            vue.
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

      <div className="chef-operations-grid">
        {/* COLONNE MISSION */}
        <article className="dashboard-placeholder dashboard-placeholder-muted chef-operation-column">
          <div className="chef-operation-head">
            <div>
              <strong>Nouvelle Mission</strong>
              <div className="table-subnote">Attribuer des objectifs et une échéance à vos agents.</div>
            </div>
          </div>

          <form className="chef-form" onSubmit={handleMissionSubmit}>
            <div className="chef-form-grid-two">
              <label className="field-input-wrap field-input-wrap-plain">
                <input
                  type="text"
                  value={missionForm.titre}
                  onChange={(event) => setMissionForm((current) => ({ ...current, titre: event.target.value }))}
                  placeholder="Titre de la mission"
                  required
                />
              </label>

              <label className="field-input-wrap field-input-wrap-plain">
                <select
                  multiple
                  value={missionForm.participantIds}
                  onChange={(event) => {
                    const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                    setMissionForm((current) => ({ ...current, participantIds: selected }));
                  }}
                  style={{ minHeight: '90px' }}
                  required
                >
                  {agentsDuService.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {[agent.prenom, agent.nom].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="chef-form-grid-two">
              {/* AJOUT DU CHAMP LIEU POUR LA MISSION */}
              <label className="field-input-wrap field-input-wrap-plain">
                <input
                  type="text"
                  value={missionForm.lieu || ''}
                  onChange={(event) => setMissionForm((current) => ({ ...current, lieu: event.target.value }))}
                  placeholder="Lieu de la mission"
                  required
                />
              </label>

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
        </article>

        {/* COLONNE REUNION */}
        <article className="dashboard-placeholder dashboard-placeholder-muted chef-operation-column">
          <div className="chef-operation-head">
            <div>
              <strong>Nouvelle Réunion de service</strong>
              <div className="table-subnote">Planifier une convocation avec l'ordre du jour.</div>
            </div>
          </div>

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
            <label className="field-input-wrap field-input-wrap-plain">
              <select
                multiple
                value={reunionForm.participantIds}
                onChange={(event) => {
                  const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                  setReunionForm((current) => ({ ...current, participantIds: selected }));
                }}
                style={{ minHeight: '90px' }}
                required
              >
                {agentsDuService.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {[agent.prenom, agent.nom].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </label>

            <div className="chef-form-grid-two">
              <label className="field-input-wrap field-input-wrap-plain">
                <input
                  type="text"
                  value={reunionForm.lieu}
                  onChange={(event) => setReunionForm((current) => ({ ...current, lieu: event.target.value }))}
                  placeholder="Lieu de la réunion"
                  required
                />
              </label>

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
        </article>
      </div>

      <div className="dashboard-placeholder dashboard-placeholder-muted">
        <strong>Confirmation d'envoi</strong>
        <span>
          Dès validation du formulaire, le système lève un Toast de succès et envoie immédiatement une notification Push/Menu aux collaborateurs assignés.
        </span>
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
                    📅 {formatDateTime(dateValue)}
                  </span>
                  {item.description && (
                    <p className="chef-justificatif-description">{item.description}</p>
                  )}
                  {item.motifRefus && (
                    <p className="chef-justificatif-refus">❌ Motif : {item.motifRefus}</p>
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
            <span>Connexion au backend en cours...</span>
          </div>
        ) : !analyseDuJour ? (
          <div className="dashboard-placeholder dashboard-placeholder-muted" style={{ marginTop: '16px' }}>
            <strong>Aucune analyse disponible pour le moment</strong>
            <span>Votre première analyse sera générée automatiquement après votre premier pointage.</span>
          </div>
        ) : (
          <>
            {renderConseillerCard(analyseDuJour)}

            <div className="admin-form-actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={handleGenererAnalyseIA}
                disabled={isGeneratingAnalyseIA}
              >
                {isGeneratingAnalyseIA ? 'Actualisation...' : 'Actualiser mon analyse'}
              </button>
            </div>
          </>
        )}
      </section>
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

    if (activePage === 'presences') {
      return renderChefPresencesPanel();
    }

    if (activePage === 'operations') {
      return renderChefOperationsPanel();
    }

    if (activePage === 'justificatifs') {
      return renderChefJustificatifsPanel();
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
          <p className="panel-note">Cette section sera connectée aux vraies données backend dans l’étape suivante.</p>
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
          <p className="panel-note">Vue réservée à la supervision et au reporting, sans données simulées.</p>
          <div className="dashboard-placeholder dashboard-placeholder-muted">
            <strong>Vue de contrôle</strong>
            <span>Les tableaux et indicateurs arriveront après connexion au backend.</span>
          </div>
        </section>
      );
    }

    console.log(user);

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
          onChangePage={setActivePage} items={roleContent.items} user={user} onLogout={logout} />
      </div>

      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      <main className="dashboard-main dashboard-main-clean">
        <div className="dashboard-head">
          <div />
          <div className="dashboard-head-actions">
            <button
              type="button"
              className="notification-bell"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              🔔
              {notificationsCount > 0 && (
                <span className="notification-count">
                  {notificationsCount}
                </span>
              )}
            </button>
            <div className="dashboard-user-profile">

              {user?.photoProfil ? (
                <img
                  src={user.photoProfil}
                  alt="profil"
                  className="dashboard-user-avatar"
                />
              ) : (
                <div className="dashboard-avatar-placeholder">
                  {`${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase() || 'U'}
                </div>
              )}

            </div>
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
          className="dashboard-menu-btn"
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
