import { useEffect, useRef, useState } from 'react';
import { fetchNotificationsCount } from '../services/notificationService';

const POLL_INTERVAL_MS = 6000;

function useNotificationsPolling() {
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState(null);
  const previousCountRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      try {
        const data = await fetchNotificationsCount();
        const nonLues = data?.nonLues ?? 0;

        if (!isMounted) {
          return;
        }

        if (
          hasLoadedOnceRef.current &&
          nonLues > previousCountRef.current
        ) {
          setToast({
            id: Date.now(),
            message:
              nonLues - previousCountRef.current === 1
                ? 'Nouvelle notification reçue.'
                : `${nonLues - previousCountRef.current} nouvelles notifications reçues.`,
          });
        }

        previousCountRef.current = nonLues;
        hasLoadedOnceRef.current = true;
        setCount(nonLues);
      } catch {
        // silencieux : pas grave si un polling échoue ponctuellement
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const dismissToast = () => setToast(null);

  const setCountManually = (value) => {
    previousCountRef.current = value;
    setCount(value);
  };

  return { count, toast, dismissToast, setCountManually };
}

export default useNotificationsPolling;