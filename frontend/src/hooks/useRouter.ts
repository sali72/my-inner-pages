import { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewType, isValidView } from '@/types';

export function useRouter() {
  const [params, setParams] = useState(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    const handlePopState = () => {
      setParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((
    nextState: Partial<{
      showAuth: boolean;
      activeView: ViewType;
      selectedEntryId: string | number | null;
      selectedChatId: string | null;
    }>,
    action: 'push' | 'replace' = 'push'
  ) => {
    const currentParams = new URLSearchParams(window.location.search);
    
    const showAuthVal = nextState.showAuth !== undefined 
      ? nextState.showAuth 
      : currentParams.get('auth') === 'true';
      
    const viewParam = currentParams.get('view') ?? '';
    const activeViewVal = nextState.activeView !== undefined 
      ? nextState.activeView 
      : (isValidView(viewParam) ? viewParam : 'journal');
    
    const nextParams = new URLSearchParams();
    if (showAuthVal) {
      nextParams.set('auth', 'true');
    }
    if (activeViewVal !== 'journal') {
      nextParams.set('view', activeViewVal);
    }

    const entryVal = nextState.selectedEntryId !== undefined 
      ? nextState.selectedEntryId 
      : currentParams.get('entry');
    if (activeViewVal === 'journal' && entryVal !== null) {
      nextParams.set('entry', String(entryVal));
    }

    const chatVal = nextState.selectedChatId !== undefined 
      ? nextState.selectedChatId 
      : currentParams.get('chat');
    if (activeViewVal === 'chat' && chatVal !== null) {
      nextParams.set('chat', chatVal);
    }

    const searchStr = nextParams.toString();
    const nextURL = searchStr ? `?${searchStr}` : '/';

    const currentIndex = window.history.state?.index !== undefined ? window.history.state.index : 1;
    const nextIndex = action === 'push' ? currentIndex + 1 : currentIndex;

    const statePayload = {
      isApp: true,
      index: nextIndex,
      showAuth: showAuthVal,
      activeView: activeViewVal,
      selectedEntryId: entryVal,
      selectedChatId: chatVal,
    };

    if (action === 'push') {
      window.history.pushState(statePayload, '', nextURL);
    } else {
      window.history.replaceState(statePayload, '', nextURL);
    }

    setParams(nextParams);
  }, []);

  const showAuth = params.get('auth') === 'true';
  const viewParam = params.get('view') ?? '';
  const activeView: ViewType =
    isValidView(viewParam) ? viewParam : 'journal';
  const selectedEntryId = params.get('entry');
  const selectedChatId = params.get('chat');
  const verificationToken = params.get('verify');

  return useMemo(() => ({
    showAuth,
    activeView,
    selectedEntryId,
    selectedChatId,
    verificationToken,
    navigate,
    setParams,
  }), [showAuth, activeView, selectedEntryId, selectedChatId, verificationToken, navigate, setParams]);
}
