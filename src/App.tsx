import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewType, JournalEntry } from '@/types';
import { useAuth } from './contexts/AuthContext';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LandingPage } from '@components/landing';
import { AuthContainer } from '@components/auth';
import { Header, Sidebar } from '@components/layout';
import { JournalView, ConfirmModal } from '@components/journal';
import { MirrorView } from '@components/mirror';
import { ChatView } from '@components/chat';
import { SettingsView } from '@components/settings';
import { AdminView } from '@components/admin';
import { useRouter } from '@hooks/useRouter';

const AppInner: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { mode, accent, fontStyle, fontSize, resolvedMode,
    setMode, setAccent, setFontStyle, setFontSize, syncFromRemote, resetToDefaults } = useTheme();
  
  const router = useRouter();
  const { showAuth, activeView, selectedEntryId, selectedChatId, navigate: updateNavigationState } = router;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<{ type: 'journal'; title: string } | { type: 'mirror'; mode: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isDark = resolvedMode === 'dark';
  const wasAuthenticated = useRef(isAuthenticated);
  const syncCancelRef = useRef(false);

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
    } else if (!isAuthenticated && wasAuthenticated.current) {
      resetToDefaults();
    }
    wasAuthenticated.current = isAuthenticated;

    // Load initial states from URL parameters
    const params = new URLSearchParams(window.location.search);
    const hasAuthParam = params.get('auth') === 'true';
    const viewParam = params.get('view');
    const activeViewParam: ViewType =
      viewParam === 'mirror' || viewParam === 'chat' || viewParam === 'settings' || viewParam === 'admin'
        ? viewParam
        : 'journal';
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
  }, [isAuthenticated, authLoading, syncFromRemote, resetToDefaults]);

  const { entries, loading, isLoadingMore, hasMore, loadMore, addEntry, updateEntry, deleteEntry, syncUnsyncedEntries } = useJournalEntries();

  // Background sync for unsynced changes when online, on window focus, or periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    syncCancelRef.current = false;

    const handleIdMigrate = (oldId: string | number, newId: string | number) => {
      const entryParam = new URLSearchParams(window.location.search).get('entry');
      if (entryParam === oldId.toString()) {
        router.navigate({ selectedEntryId: newId }, 'replace');
      }
      window.dispatchEvent(new CustomEvent('journal:id-migrated', {
        detail: { oldId, newId }
      }));
    };

    const guardedSync = () => {
      if (syncCancelRef.current) return;
      syncUnsyncedEntries(handleIdMigrate);
    };

    // Initial sync attempt
    guardedSync();

    window.addEventListener('online', guardedSync);
    window.addEventListener('focus', guardedSync);

    const interval = setInterval(() => {
      if (navigator.onLine && !syncCancelRef.current) {
        guardedSync();
      }
    }, 30000);

    return () => {
      syncCancelRef.current = true;
      window.removeEventListener('online', guardedSync);
      window.removeEventListener('focus', guardedSync);
      clearInterval(interval);
    };
  }, [isAuthenticated, syncUnsyncedEntries]);

  const handleSaveNewEntry = async (title: string, content: string, tags: string[], created_at?: string) => {
    const created = await addEntry({
      date: created_at
        ? new Date(created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      title,
      tags,
      content,
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
    if (!showAuth) {
      return <LandingPage onGetStarted={() => updateNavigationState({ showAuth: true })} />;
    }
    return (
      <AuthContainer
        isDark={isDark}
        onAuthSuccess={() => {}}
        onBack={() => updateNavigationState({ showAuth: false })}
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
            onUpdateEntry={updateEntry}
            onDeleteEntry={handleDeleteEntry}
            onSaveNewEntry={handleSaveNewEntry}
            onStartChat={handleStartChat}
            selectedEntryId={selectedEntryId}
            onSelectEntry={(id, action) => updateNavigationState({ selectedEntryId: id }, action)}
          />
        ) : null}

        {activeView === 'mirror' && <MirrorView isDark={isDark} onStartChat={handleStartChatFromMirror} />}

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
            <AdminView />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
              <p className="text-red-500 font-bold text-xl">Access Denied</p>
              <p className="text-secondary">Administrator privileges required to view this page.</p>
            </div>
          )
        )}
      </main>

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
    </ThemeProvider>
  );
};

export default App;
