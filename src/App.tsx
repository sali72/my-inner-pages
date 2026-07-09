import React, { useState, useEffect, useRef } from 'react';
import { ViewType, JournalEntry } from '@/types';
import { useAuth } from './contexts/AuthContext';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LandingPage } from '@components/landing';
import { AuthContainer } from '@components/auth';
import { Header, Sidebar } from '@components/layout';
import { JournalView } from '@components/journal';
import { MirrorView } from '@components/mirror';
import { ChatView } from '@components/chat';
import { SettingsView } from '@components/settings';

const AppInner: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { mode, accent, fontStyle, fontSize, resolvedMode,
    setMode, setAccent, setFontStyle, setFontSize, syncFromRemote, resetToDefaults } = useTheme();
  const [activeView, setActiveView] = useState<ViewType>('journal');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const isDark = resolvedMode === 'dark';
  const wasAuthenticated = useRef(isAuthenticated);

  // Helper to update React state and browser history simultaneously
  const updateNavigationState = (
    nextState: Partial<{
      showAuth: boolean;
      activeView: ViewType;
      selectedEntryId: number | string | null;
    }>,
    action: 'push' | 'replace' = 'push'
  ) => {
    const nextShowAuth = nextState.showAuth !== undefined ? nextState.showAuth : showAuth;
    const nextActiveView = nextState.activeView !== undefined ? nextState.activeView : activeView;
    const nextSelectedEntryId = nextState.selectedEntryId !== undefined ? nextState.selectedEntryId : selectedEntryId;

    if (nextState.showAuth !== undefined) setShowAuth(nextState.showAuth);
    if (nextState.activeView !== undefined) setActiveView(nextState.activeView);
    if (nextState.selectedEntryId !== undefined) setSelectedEntryId(nextState.selectedEntryId);

    const currentIndex = window.history.state?.index !== undefined ? window.history.state.index : 1;
    const nextIndex = action === 'push' ? currentIndex + 1 : currentIndex;

    const statePayload = {
      isApp: true,
      index: nextIndex,
      showAuth: nextShowAuth,
      activeView: nextActiveView,
      selectedEntryId: nextSelectedEntryId,
    };

    if (action === 'push') {
      window.history.pushState(statePayload, '');
    } else {
      window.history.replaceState(statePayload, '');
    }
  };

  // Sync state back from history events (e.g. back/forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.isApp) {
        if (state.index === 0) {
          // Prevent exiting the app by forcing history forward
          window.history.forward();
          return;
        }

        if (state.showAuth !== undefined) setShowAuth(state.showAuth);
        if (state.activeView !== undefined) setActiveView(state.activeView);
        if (state.selectedEntryId !== undefined) setSelectedEntryId(state.selectedEntryId);
      } else {
        // Fallback for empty/external history entries
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

    const initialView = 'journal';
    const initialSelectedEntryId = null;
    const initialShowAuth = false;

    const payload = {
      isApp: true,
      showAuth: initialShowAuth,
      activeView: initialView,
      selectedEntryId: initialSelectedEntryId,
    };

    window.history.replaceState({ ...payload, index: 0 }, '', '/');
    window.history.pushState({ ...payload, index: 1 }, '', '/');

    setShowAuth(initialShowAuth);
    setActiveView(initialView);
    setSelectedEntryId(null);
  }, [isAuthenticated, authLoading, syncFromRemote, resetToDefaults]);

  const { entries, loading, isLoadingMore, hasMore, loadMore, addEntry, updateEntry, deleteEntry, syncUnsyncedEntries } = useJournalEntries();

  // Background sync for unsynced changes when online, on window focus, or periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial sync attempt
    syncUnsyncedEntries();

    const handleOnline = () => {
      syncUnsyncedEntries();
    };
    const handleFocus = () => {
      syncUnsyncedEntries();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncUnsyncedEntries();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
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
    updateNavigationState({ activeView: 'chat', selectedEntryId: null });
  };

  const handleDeleteEntry = async (id: number | string) => {
    try {
      await deleteEntry(id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete journal entry. Please try again.');
    }
  };

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

        {activeView === 'mirror' && <MirrorView isDark={isDark} />}

        <div className={activeView === 'chat' ? '' : 'hidden'}>
          <ChatView
            isDark={isDark}
            initialMessage={chatInitialMessage}
            onInitialMessageSent={() => setChatInitialMessage(null)}
            chatHistoryOpen={chatHistoryOpen}
            onToggleChatHistory={() => setChatHistoryOpen(!chatHistoryOpen)}
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
      </main>
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
