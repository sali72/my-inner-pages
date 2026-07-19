import { useEffect, useRef, useCallback } from 'react';
import * as Sentry from '@sentry/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';
const HEALTH_URL = API_BASE_URL.replace('/api/v0', '/health');

const CHECK_INTERVAL_MS = 60_000;
const MAX_BACKOFF_MS = 300_000;

type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export function useBackendHealth() {
  const statusRef = useRef<HealthStatus>('unknown');
  const consecutiveFailuresRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeout);

      if (response.ok) {
        const wasUnhealthy = statusRef.current === 'unhealthy';
        consecutiveFailuresRef.current = 0;
        statusRef.current = 'healthy';

        if (wasUnhealthy) {
          Sentry.captureEvent({
            message: 'Backend recovered',
            level: 'info',
            tags: { monitor: 'backend_health' },
            extra: {
              consecutive_failures: consecutiveFailuresRef.current,
            },
          });
        }
      } else {
        handleFailure(response.status);
      }
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof DOMException && error.name === 'AbortError') {
        handleFailure(0, 'timeout');
      } else if (error instanceof TypeError) {
        handleFailure(0, 'network');
      } else {
        handleFailure(0, 'unknown');
      }
    }
  }, []);

  const handleFailure = useCallback((statusCode: number, reason?: string) => {
    consecutiveFailuresRef.current++;

    const wasHealthy = statusRef.current === 'healthy';
    statusRef.current = 'unhealthy';

    if (wasHealthy) {
      Sentry.captureEvent({
        message: 'Backend health degraded',
        level: 'warning',
        tags: {
          monitor: 'backend_health',
          status_code: String(statusCode),
          reason: reason || 'http_error',
        },
        extra: {
          consecutive_failures: consecutiveFailuresRef.current,
          health_url: HEALTH_URL,
          status_code: statusCode,
        },
      });
    }

    if (consecutiveFailuresRef.current >= 5) {
      Sentry.captureEvent({
        message: `Backend persistently unreachable (${consecutiveFailuresRef.current} failures)`,
        level: 'fatal',
        tags: { monitor: 'backend_health' },
        extra: {
          consecutive_failures: consecutiveFailuresRef.current,
          health_url: HEALTH_URL,
        },
      });
    }
  }, []);

  useEffect(() => {
    check();

    const startInterval = () => {
      const delay = Math.min(
        CHECK_INTERVAL_MS * Math.pow(2, consecutiveFailuresRef.current),
        MAX_BACKOFF_MS,
      );
      intervalRef.current = setInterval(check, delay);
    };

    startInterval();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        check();
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [check]);
}
