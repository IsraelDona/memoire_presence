import { useEffect } from 'react';

function NotificationToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) {
    return null;
  }

  return (
    <div className="notification-toast" role="status">
      <span className="notification-toast-icon">🔔</span>
      <span className="notification-toast-text">{toast.message}</span>
      <button
        type="button"
        className="notification-toast-close"
        onClick={onDismiss}
      >
        ✕
      </button>
    </div>
  );
}

export default NotificationToast;