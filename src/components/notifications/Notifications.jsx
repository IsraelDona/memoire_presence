import { useEffect, useState } from 'react';
import {
  fetchNotifications,
  marquerCommeLue,
} from '../../services/notificationService';

function Notifications({ onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const chargerNotifications = async () => {
    try {
      setIsLoading(true);

      const data = await fetchNotifications();

      setNotifications(data || []);
      setError(null);
    } catch (err) {
      setError(
        err?.message ||
        'Impossible de charger les notifications.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chargerNotifications();
  }, []);


  useEffect(() => {
    const unreadCount = notifications.filter(
      (notification) => !notification.lu
    ).length;

    if (onCountChange) {
      onCountChange(unreadCount);
    }
  }, [notifications, onCountChange]);

  const handleLire = async (id) => {
    try {
      await marquerCommeLue(id);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
              ...notification,
              lu: true,
            }
            : notification
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="notifications-panel">
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-panel">
        <div className="form-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h3>Notifications</h3>
      </div>

      {notifications.length === 0 ? (
        <div className="dashboard-placeholder dashboard-placeholder-muted">
          <strong>Aucune notification</strong>
          <span>
            Vous n'avez aucune notification pour
            le moment.
          </span>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card ${notification.lu
                  ? 'notification-read'
                  : 'notification-unread'
                }`}
            >
              <div className="notification-head">
                <strong>
                  {notification.titre}
                </strong>

                {!notification.lu && (
                  <span className="presence-status-badge is-gps">
                    Nouveau
                  </span>
                )}
              </div>

              <p>
                {notification.message}
              </p>

              <div className="notification-footer">
                <span>
                  {new Date(
                    notification.dateNotification
                  ).toLocaleString('fr-FR')}
                </span>

                {!notification.lu && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      handleLire(
                        notification.id
                      )
                    }
                  >
                    Marquer comme lue
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;