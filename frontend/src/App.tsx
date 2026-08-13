import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { ViewType, JournalEntry, isValidView } from '@/types';
import { useAuth } from './contexts/AuthContext';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LandingPage } from '@components/landing';
import { AuthContainer } from '@components/auth';
import { Header, Sidebar, AlphaWarningModal } from '@components/layout';
import { JournalView, ConfirmModal } from '@components/journal';
import { MirrorView } from '@components/mirror';
import { MirrorReflection, MirrorMode } from '@/types/mirror';
import { ChatView } from '@components/chat';
import { SettingsView } from '@components/settings';
const AdminView = lazy(() => import('@components/admin/AdminView').then(m => ({ default: m.AdminView })));
import { FullSurvey, ShortSurvey } from '@components/feedback';
import { Toaster } from 'sonner';
import { useRouter } from '@hooks/useRouter';
import { useBackendHealth } from '@hooks/useBackendHealth';
import { useFeedbackTriggers } from '@hooks/useFeedbackTriggers';
import { useBackgroundSync } from '@hooks/useBackgroundSync';

const AppInner: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  useBackendHealth();
  const { mode, accent, fontStyle, fontSize, resolvedMode,
    setMode, setAccent, setFontStyle, setFontSize, syncFromRemote } = useTheme();
  
  const router = useRouter();
  const { showAuth, activeView, selectedEntryId, selectedChatId, navigate: updateNavigationState } = router;

  const [pendingVerification] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('verify');
  });

  // Clean verify param from URL on mount so refresh doesn't re-trigger verification
  useEffect(() => {
    if (pendingVerification) {
      const params = new URLSearchParams(window.location.search);
      params.delete('verify');
      params.set('auth', 'true');
      const searchStr = params.toString();
      window.history.replaceState(
        { isApp: true, showAuth: true, index: window.history.state?.index ?? 0 },
        '',
        searchStr ? `?${searchStr}` : '/'
      );
    }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<{ type: 'journal'; title: string } | { type: 'mirror'; mode: string } | null>(null);
  const [mirrorReflections, setMirrorReflections] = useState<Record<MirrorMode, MirrorReflection | null>>({
    emotional: null,
    cognitive: null,
    behavioral: null,
    relational: null,
  });
  const handleMirrorReflectionChange = useCallback((mode: MirrorMode, reflection: MirrorReflection | null) => {
    setMirrorReflections(prev => ({ ...prev, [mode]: reflection }));
  }, []);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { shortSurveyTrigger, setShortSurveyTrigger } = useFeedbackTriggers();
  const sessionEntryCount = useRef(0);
  const isDark = resolvedMode === 'dark';
  const wasAuthenticated = useRef(isAuthenticated);
  const hasEditedEntry = useRef(false);
  const [showAlphaWarning, setShowAlphaWarning] = useState(false);

  // Intercept back button at index 0 to prevent exiting the app
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (!state || !state.isApp || state.index === 0) {
        window.history.forward();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync and reset history states when authentication state changes
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && !wasAuthenticated.current) {
      syncFromRemote();
      setShowAlphaWarning(true);
    }
    wasAuthenticated.current = isAuthenticated;

    // Load initial states from URL parameters
    const params = new URLSearchParams(window.location.search);
    const hasAuthParam = params.get('auth') === 'true';
    const viewParam = params.get('view') ?? '';
    const activeViewParam: ViewType =
      isValidView(viewParam) ? viewParam : 'journal';
    const entryParam = params.get('entry');
    const chatParam = params.get('chat');

    const payload = {
      isApp: true,
      showAuth: hasAuthParam,
      activeView: activeViewParam,
      selectedEntryId: entryParam,
      selectedChatId: chatParam,
    };

    const nextParams = new URLSearchParams();
    if (hasAuthParam) nextParams.set('auth', 'true');
    if (activeViewParam !== 'journal') nextParams.set('view', activeViewParam);
    if (activeViewParam === 'journal' && entryParam !== null) nextParams.set('entry', entryParam);
    if (activeViewParam === 'chat' && chatParam !== null) nextParams.set('chat', chatParam);
    
    const searchStr = nextParams.toString();
    const currentURL = searchStr ? `?${searchStr}` : '/';

    window.history.replaceState({ ...payload, index: 0 }, '', currentURL);
    window.history.pushState({ ...payload, index: 1 }, '', currentURL);

    // Sync hook state manually to trigger re-render
    router.setParams(nextParams);
  }, [isAuthenticated, authLoading, syncFromRemote]);

  const { entries, loading, isLoadingMore, hasMore, loadMore, addEntry, updateEntry, deleteEntry, syncUnsyncedEntries } = useJournalEntries();

  useBackgroundSync({
    isAuthenticated,
    syncUnsyncedEntries,
    navigate: router.navigate,
  });



  const handleSaveNewEntry = async (title: string, content: string, tags: string[], created_at?: string, content_json?: any) => {
    hasEditedEntry.current = true;
    sessionEntryCount.current += 1;
    const created = await addEntry({
      date: created_at
        ? new Date(created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      title,
      tags,
      content,
      content_json,
      created_at,
    });
    return created.id;
  };

  const handleStartChat = (entry: JournalEntry) => {
    setChatInitialMessage(
      `I'd like to discuss my journal entry "${entry.title}". Here's what I wrote:\n\n${entry.content}`
    );
    setChatContext({ type: 'journal', title: entry.title });
    updateNavigationState({ activeView: 'chat', selectedEntryId: null, selectedChatId: 'new' });
  };

  const handleStartChatFromMirror = (reflection: string, mode: string) => {
    setChatInitialMessage(
      `I just received this ${mode.toLowerCase()} reflection on my journaling and I'd like to explore it with you:\n\n${reflection}`
    );
    setChatContext({ type: 'mirror', mode });
    updateNavigationState({ activeView: 'chat', selectedEntryId: null, selectedChatId: 'new' });
  };

  const handleDeleteEntry = async (id: number | string) => {
    try {
      await deleteEntry(id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      setDeleteError('Failed to delete journal entry. Please try again.');
    }
  };

  const handleSelectChat = useCallback((id: string | null, action?: 'push' | 'replace') => {
    if (action !== 'replace') setChatContext(null);
    updateNavigationState({ selectedChatId: id }, action);
  }, [updateNavigationState]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-current border-t-transparent rounded-full animate-spin text-accent" />
          <p className="text-secondary text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (!showAuth && !pendingVerification) {
      return <LandingPage onGetStarted={() => updateNavigationState({ showAuth: true })} />;
    }
    return (
      <AuthContainer
        onAuthSuccess={() => {}}
        onBack={() => updateNavigationState({ showAuth: false })}
        verificationToken={pendingVerification || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base transition-colors duration-200">
      <Header
        activeView={activeView}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onNavigationClick={activeView === 'chat' ? () => setChatHistoryOpen(!chatHistoryOpen) : undefined}
      />

      <Sidebar
        isOpen={sidebarOpen}
        activeView={activeView}
        onClose={() => setSidebarOpen(false)}
        onViewChange={(view) => updateNavigationState({ activeView: view, selectedEntryId: null })}
      />

      <main className="pt-16 scrollbar-theme">
        {activeView === 'journal' && loading ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <p className="text-secondary text-lg">Loading journals...</p>
          </div>
        ) : activeView === 'journal' ? (
          <JournalView
            entries={entries}
            font={fontStyle}
            fontSize={fontSize}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onUpdateEntry={(...args) => { hasEditedEntry.current = true; sessionEntryCount.current += 1; return updateEntry(...args); }}
            onDeleteEntry={handleDeleteEntry}
            onSaveNewEntry={handleSaveNewEntry}
            onStartChat={handleStartChat}
            selectedEntryId={selectedEntryId}
            onSelectEntry={(id, action) => updateNavigationState({ selectedEntryId: id }, action)}
          />
        ) : null}

        {activeView === 'mirror' && <MirrorView isDark={isDark} onStartChat={handleStartChatFromMirror} reflections={mirrorReflections} onReflectionChange={handleMirrorReflectionChange} />}

        <div className={activeView === 'chat' ? '' : 'hidden'}>
          <ChatView
            isDark={isDark}
            initialMessage={chatInitialMessage}
            onInitialMessageSent={() => setChatInitialMessage(null)}
            chatHistoryOpen={chatHistoryOpen}
            onToggleChatHistory={() => setChatHistoryOpen(!chatHistoryOpen)}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            chatContext={chatContext}
          />
        </div>

        {activeView === 'settings' && (
          <SettingsView
            mode={mode}
            accent={accent}
            fontStyle={fontStyle}
            fontSize={fontSize}
            onModeChange={setMode}
            onAccentChange={setAccent}
            onFontStyleChange={setFontStyle}
            onFontSizeChange={setFontSize}
          />
        )}

        {activeView === 'admin' && (
          user?.role === 'admin' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[600px] text-secondary">
                Loading admin panel...
              </div>
            }>
              <AdminView />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
              <p className="text-red-500 font-bold text-xl">Access Denied</p>
              <p className="text-secondary">Administrator privileges required to view this page.</p>
            </div>
          )
        )}

        {activeView === 'feedback' && (
          <FullSurvey onClose={() => updateNavigationState({ activeView: 'journal' })} sessionEntryCount={sessionEntryCount.current} />
        )}
      </main>

      {shortSurveyTrigger && activeView !== 'feedback' && (
        <ShortSurvey
          trigger={shortSurveyTrigger}
          onClose={() => setShortSurveyTrigger(null)}
          sessionEntryCount={sessionEntryCount.current}
        />
      )}

      <AlphaWarningModal
        isOpen={showAlphaWarning}
        onDismiss={() => setShowAlphaWarning(false)}
      />

      <ConfirmModal
        isOpen={deleteError !== null}
        title="Error"
        message={deleteError || ''}
        confirmLabel="OK"
        onConfirm={() => setDeleteError(null)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppInner />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
        }}
      />
    </ThemeProvider>
  );
};

export default App;
