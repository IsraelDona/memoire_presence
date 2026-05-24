import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { normalizeRole } from '../services/authService';
import { fetchEquipePresences, fetchJustificatifsChef } from '../services/chefService';
import { fetchMesPresences, marquerPresence } from '../services/presenceService';

const ROLE_CONTENT = {
  ADMIN: {
    title: 'Administrateur',
    subtitle: 'Pilotage global de la plateforme',
    summary: 'Gestion des comptes, activation des agents, configuration et supervision des accès.',
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
      { key: 'demandes', label: 'Demandes', icon: 'document' },
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function formatCoordinate(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }

  return value.toFixed(6);
}

function formatDistanceLabel(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return 'Position en attente';
  }

  if (distanceKm <= MINISTRY_ZONE.radiusKm) {
    return `Dans la zone autorisée (${distanceKm.toFixed(2)} km)`;
  }

  return `Hors zone (${distanceKm.toFixed(2)} km)`;
}

function buildMapMarkerStyle(position) {
  const latDelta = position.latitude - MINISTRY_ZONE.latitude;
  const lonDelta = position.longitude - MINISTRY_ZONE.longitude;

  return {
    left: `${clamp(50 + lonDelta * 1700, 14, 86)}%`,
    top: `${clamp(50 - latDelta * 1700, 14, 86)}%`,
  };
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
  const [activePage, setActivePage] = useState('overview');
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFeedback, setHistoryFeedback] = useState(null);
  const [pointageFeedback, setPointageFeedback] = useState(null);
  const [isSubmittingPointage, setIsSubmittingPointage] = useState(false);
  const [pointageType, setPointageType] = useState(DEFAULT_POINTAGE);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [chefPresences, setChefPresences] = useState([]);
  const [isLoadingChefPresences, setIsLoadingChefPresences] = useState(false);
  const [chefPresencesFeedback, setChefPresencesFeedback] = useState(null);
  const [chefJustificatifs, setChefJustificatifs] = useState([]);
  const [isLoadingChefJustificatifs, setIsLoadingChefJustificatifs] = useState(false);
  const [chefJustificatifsFeedback, setChefJustificatifsFeedback] = useState(null);

  const roleKey = normalizeRole(user?.roleKey ?? user?.role);
  const roleContent = ROLE_CONTENT[roleKey] ?? ROLE_CONTENT.AGENT;
  const canPoint = roleKey === 'AGENT' || roleKey === 'CHEF_SERVICE';

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
    }
  }, [canPoint]);

  useEffect(() => {
    if (canPoint) {
      loadHistory({ silent: true });
    }
  }, [canPoint, loadHistory]);

  useEffect(() => {
    if (canPoint && activePage === 'historique' && history.length === 0 && !isLoadingHistory) {
      loadHistory();
    }
  }, [activePage, canPoint, history.length, isLoadingHistory, loadHistory]);

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
      setChefJustificatifsFeedback(null);
    } catch (error) {
      setChefJustificatifs([]);
      setChefJustificatifsFeedback({
        type: 'error',
        message: error?.message || 'Impossible de charger les justificatifs.',
      });
    } finally {
      if (!silent) {
        setIsLoadingChefJustificatifs(false);
      }
    }
  }, [roleKey]);

  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE') {
      loadChefPresences({ silent: true });
    }
  }, [loadChefPresences, roleKey]);

  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE' && activePage === 'presences' && chefPresences.length === 0 && !isLoadingChefPresences) {
      loadChefPresences();
    }
  }, [activePage, chefPresences.length, isLoadingChefPresences, loadChefPresences, roleKey]);

  useEffect(() => {
    if (roleKey === 'CHEF_SERVICE' && activePage === 'justificatifs' && chefJustificatifs.length === 0 && !isLoadingChefJustificatifs) {
      loadChefJustificatifs();
    }
  }, [activePage, chefJustificatifs.length, isLoadingChefJustificatifs, loadChefJustificatifs, roleKey]);

  const latestPresence = history[0];
  const activeItem = roleContent.items.find((item) => item.key === activePage) ?? roleContent.items[0];

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
        title: 'Dernier pointage',
        value: latestPresence ? formatPresenceStatus(latestPresence.statutPresence) : 'Aucun',
        description: latestPresence
          ? `${formatDateTime(latestPresence.heurePointage || latestPresence.datePresence)}`
          : 'Aucun pointage enregistré pour l’instant.',
      },
    ],
    [latestPresence, roleContent.title, user?.email]
  );

  const goToHistory = () => {
    if (canPoint) {
      setActivePage('historique');
    }
  };

  const handlePointage = async () => {
    setPointageFeedback(null);
    setIsSubmittingPointage(true);

    try {
      const position = await getPosition();
      setCurrentPosition(position);
      const response = await marquerPresence({
        latitude: position.latitude,
        longitude: position.longitude,
        typePresence: pointageType,
      });

      setPointageFeedback({
        type: 'success',
        message: response.message,
      });
      await loadHistory({ silent: true });
      setActivePage('overview');
    } catch (error) {
      setPointageFeedback({
        type: 'error',
        message: error?.message || 'Impossible de marquer la présence.',
      });
    } finally {
      setIsSubmittingPointage(false);
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

        {pointageFeedback && pointageFeedback.type === 'success' && (
          <div className="form-success">{pointageFeedback.message}</div>
        )}

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
                ? `${getGpsLabel()} · ${formatDistanceLabel(calculateDistanceKm(currentPosition, MINISTRY_ZONE))}`
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
      {renderPresenceSummary()}

      <section className="dashboard-hero-card agent-hero-card">
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
    </>
  );

  const renderChefOverview = () => (
    <>
      {renderPresenceSummary()}

      <section className="dashboard-hero-card agent-hero-card">
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

        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Rôle de supervision</strong>
          <span>
            Depuis les onglets dédiés, tu peux pointer ta présence, suivre les équipes, piloter les missions et les
            réunions dans un même espace, consulter ton historique et valider les justificatifs.
          </span>
        </div>
      </section>
    </>
  );

  const renderPointagePanel = () => (
    <section className="dashboard-panel dashboard-panel-wide agent-pointage-hero">
      <div className="admin-section-head">
        <div>
          <h2>Marquer présence</h2>
          <p className="panel-note">
            Le navigateur capture la position GPS du poste et le backend vérifie ensuite la zone autorisée autour du
            Ministère.
          </p>
        </div>
        <span className="dashboard-status-pill">Pointage personnel</span>
      </div>

      {pointageFeedback && pointageFeedback.type === 'error' && <div className="form-error">{pointageFeedback.message}</div>}

      <div className="agent-pointage-grid">
        <article className="dashboard-placeholder gps-map-card">
          <div className="gps-map-head">
            <div>
              <strong>Carte GPS du Bénin</strong>
              <span>
                {MINISTRY_ZONE.label} · périmètre autorisé {MINISTRY_ZONE.radiusKm.toFixed(0)} km
              </span>
            </div>
            <span className={`presence-status-badge ${currentPosition ? 'is-present' : 'is-gps'}`}>
              {currentPosition ? formatDistanceLabel(calculateDistanceKm(currentPosition, MINISTRY_ZONE)) : 'Position en attente'}
            </span>
          </div>

          <div className="gps-map-surface" aria-label="Carte GPS du Bénin et du ministère">
            <span className="gps-map-grid" />
            <span className="gps-map-ring gps-map-ring-large" />
            <span className="gps-map-ring gps-map-ring-medium" />
            <span className="gps-map-ring gps-map-ring-small" />
            <span className="gps-map-ministry">
              <span className="gps-map-marker gps-map-marker-target" />
              <strong>Ministère</strong>
            </span>
            {currentPosition ? (
              <span className="gps-map-user" style={buildMapMarkerStyle(currentPosition)}>
                <span className="gps-map-marker gps-map-marker-user" />
                <strong>Vous</strong>
              </span>
            ) : (
              <span className="gps-map-user gps-map-user-empty">
                <span className="gps-map-marker gps-map-marker-user" />
                <strong>GPS en attente</strong>
              </span>
            )}
          </div>

          <div className="gps-map-footer">
            <div>
              <span>Latitude</span>
              <strong>{currentPosition ? formatCoordinate(currentPosition.latitude) : '—'}</strong>
            </div>
            <div>
              <span>Longitude</span>
              <strong>{currentPosition ? formatCoordinate(currentPosition.longitude) : '—'}</strong>
            </div>
            <div>
              <span>Distance</span>
              <strong>
                {currentPosition
                  ? formatDistanceLabel(calculateDistanceKm(currentPosition, MINISTRY_ZONE))
                  : 'En attente'}
              </strong>
            </div>
          </div>
        </article>

        <div className="dashboard-placeholder agent-pointage-card agent-pointage-sidecard">
          <strong>Statut attendu</strong>
          <span>
            Le backend calcule automatiquement <strong>PRESENT</strong> ou <strong>RETARD</strong> selon l’heure et
            la zone GPS du ministère.
          </span>
        </div>
      </div>

      <div className="agent-pointage-outer">
        <button
          type="button"
          className="agent-pointage-orb"
          onClick={handlePointage}
          disabled={isSubmittingPointage}
        >
          <span className="agent-pointage-orb-icon">
            <FingerprintIcon />
            <MapPinIcon />
          </span>
          <strong>{isSubmittingPointage ? 'Pointage en cours...' : 'Marquer ma présence'}</strong>
          <span>Via GPS · zone autorisée par le backend</span>
        </button>

        <div className="agent-pointage-statusline">
          <span className={`presence-status-badge ${getPresenceBadgeClass(latestPresence?.statutPresence)}`}>
            {latestPresence ? formatPresenceStatus(latestPresence.statutPresence) : 'Non pointé'}
          </span>
          <p>Le bouton envoie latitude et longitude au backend. Le calcul de distance se fait côté Spring Boot.</p>
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
          <p className="panel-note">Cette zone accueillera plus tard les justificatifs, demandes et notifications.</p>
        </div>
        <span className="dashboard-status-pill">À brancher</span>
      </div>

      <div className="dashboard-placeholder dashboard-placeholder-muted">
        <strong>Module en préparation</strong>
        <span>Les demandes de justificatifs et les notifications seront branchées après l’historique.</span>
      </div>
    </section>
  );

  const renderChefPresencesPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Présences des agents</h2>
          <p className="panel-note">
            Suivi des pointages de l’équipe. Cette vue consolide la lecture RH du service et les décisions du chef.
          </p>
        </div>
        <span className="dashboard-status-pill">Suivi d’équipe</span>
      </div>

      {chefPresencesFeedback && chefPresencesFeedback.type === 'error' && (
        <div className="form-error">{chefPresencesFeedback.message}</div>
      )}

      <div className="chef-team-grid">
        <article className="dashboard-stat-card chef-metric-card">
          <span>Agents suivis</span>
          <strong>{chefPresences.length}</strong>
          <p>Comptes agents renvoyés par le backend pour la supervision du service.</p>
        </article>

        <article className="dashboard-stat-card chef-metric-card">
          <span>Présences du jour</span>
          <strong>{chefPresences.length ? 'Chargées' : 'À charger'}</strong>
          <p>Pointages, retards et absences de l’équipe, regroupés pour une lecture RH rapide.</p>
        </article>

        <article className="dashboard-stat-card chef-metric-card">
          <span>Dernière synchronisation</span>
          <strong>{chefPresences.length ? 'OK' : 'Backend'}</strong>
          <p>La vue est prête pour les retours API sans perdre la structure actuelle.</p>
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
              {chefPresences.map((item, index) => {
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
                        {hasCoordinates
                          ? `${formatCoordinate(latitude)}, ${formatCoordinate(longitude)}`
                          : 'Coordonnées à charger'}
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
            Une seule vue métier pour préparer les affectations, organiser les convocations et garder le service lisible.
          </p>
        </div>
        <span className="dashboard-status-pill">Organisation</span>
      </div>

      <div className="chef-operations-grid">
        <article className="dashboard-placeholder">
          <strong>Missions du service</strong>
          <span>Attributions, agents concernés, échéances et état d’exécution dans un seul volet.</span>
        </article>

        <article className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Réunions de service</strong>
          <span>Ordre du jour, convocations, présence et suivi des décisions dans la même vue.</span>
        </article>
      </div>

      <div className="dashboard-placeholder dashboard-placeholder-muted">
        <strong>Coordination RH</strong>
        <span>La fusion de ces deux modules allège l’interface et garde l’expérience claire pour le chef.</span>
      </div>
    </section>
  );

  const renderChefJustificatifsPanel = () => (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="admin-section-head">
        <div>
          <h2>Justificatifs</h2>
          <p className="panel-note">Valide les permissions et les justificatifs transmis par les agents.</p>
        </div>
        <span className="dashboard-status-pill">Validation</span>
      </div>

      {chefJustificatifsFeedback && chefJustificatifsFeedback.type === 'error' && (
        <div className="form-error">{chefJustificatifsFeedback.message}</div>
      )}

      {isLoadingChefJustificatifs ? (
        <div className="dashboard-placeholder">
          <strong>Chargement des justificatifs</strong>
          <span>Récupération des demandes du service en cours...</span>
        </div>
      ) : chefJustificatifs.length === 0 ? (
        <div className="dashboard-placeholder">
          <strong>Traitement des justificatifs</strong>
          <span>Le backend doit renvoyer les justificatifs du service pour activer les actions de validation.</span>
        </div>
      ) : (
        <div className="chef-justificatifs-grid">
          {chefJustificatifs.map((item, index) => {
            const person = item.utilisateur || item.agent || item.user || item;
            const name = [person?.nom, person?.prenom].filter(Boolean).join(' ').trim() || person?.email || `Agent ${index + 1}`;
            const label = item.typeJustificatif || item.type || 'Justificatif';
            const status = item.statut || item.status || 'EN_ATTENTE';
            const dateValue = item.dateJustificatif || item.dateDemande || item.createdAt;
            const badgeClass =
              String(status).toUpperCase() === 'ACCEPTE'
                ? 'is-present'
                : String(status).toUpperCase() === 'REFUSE'
                  ? 'is-late'
                  : 'is-gps';

            return (
              <article key={item.id ?? `${name}-${index}`} className="dashboard-placeholder dashboard-placeholder-muted">
                <strong>{label}</strong>
                <span>{name}</span>
                <div className="table-subnote">{formatDateTime(dateValue)}</div>
                <div className="admin-row-actions">
                  <span className={`presence-status-badge ${badgeClass}`}>
                    {String(status).replace(/_/g, ' ')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
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

  const renderAgentBody = () => {
    if (activePage === 'pointage') {
      return renderPointagePanel();
    }

    if (activePage === 'historique') {
      return renderHistoryPanel();
    }

    if (activePage === 'demandes') {
      return renderRequestsPanel();
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
