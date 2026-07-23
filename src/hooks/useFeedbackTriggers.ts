import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseFeedbackTriggersReturn {
  shortSurveyTrigger: 'session_nudge' | 'exit_intent' | null;
  setShortSurveyTrigger: (v: null) => void;
}

export function useFeedbackTriggers(): UseFeedbackTriggersReturn {
  const { isAuthenticated, user } = useAuth();
  const [shortSurveyTrigger, setShortSurveyTrigger] = useState<'session_nudge' | 'exit_intent' | null>(null);
  const exitIntentShown = useRef(false);
  const hasEditedEntry = useRef(false);
  const appLoadTime = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const triggers = user.feedback_triggers || {};
    const loginCount = user.login_count ?? 0;
    const daysSinceSignup = user.created_at
      ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (!triggers.session_nudge) {
      if (daysSinceSignup >= 3 || loginCount >= 2) {
        setShortSurveyTrigger('session_nudge');
      }
    }

    if (!triggers.exit_intent && !exitIntentShown.current) {
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
          const dwell = Date.now() - appLoadTime.current;
          if (dwell > 20000 && !hasEditedEntry.current && !exitIntentShown.current) {
            exitIntentShown.current = true;
            setShortSurveyTrigger('exit_intent');
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [isAuthenticated, user]);

  return { shortSurveyTrigger, setShortSurveyTrigger };
}
