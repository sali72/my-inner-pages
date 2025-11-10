import React, { useState, useEffect } from 'react';
import { ViewType } from '@/types';
import { THEMES } from '@constants/themes';
import { useAuth } from './contexts/AuthContext';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { usePageFlip } from '@hooks/usePageFlip';
import { useSettings } from '@hooks/useSettings';
import { AuthContainer } from '@components/auth';
import { Header, Sidebar } from '@components/layout';
import { JournalView } from '@components/journal';
import { MirrorView } from '@components/mirror';
import { SettingsView } from '@components/settings';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('journal');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigationSidebarOpen, setNavigationSidebarOpen] = useState(false);

  console.log('App render - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'user:', user);

  // Clean up URL - remove any paths since this is a single-page app
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Debug: Log when isAuthenticated changes
  useEffect(() => {
    console.log('isAuthenticated changed to:', isAuthenticated);
  }, [isAuthenticated]);

  const { entries, loading, addEntry, updateEntry, deleteEntry } = useJournalEntries();
  const {
    theme,
    setTheme,
    journalFont,
    setJournalFont,
    journalFontSize,
    setJournalFontSize,
    ambientSound,
    setAmbientSound,
  } = useSettings();

  const pages = [...entries, { id: 'new', date: 'Today', title: '', tags: [], content: '', isNew: true }];
  const {
    currentPageIndex,
    dragOffset,
    isFlipping,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    goToPage,
  } = usePageFlip(pages.length);

  // Navigate to last entry when entries are first loaded
  useEffect(() => {
    if (!loading && entries.length > 0 && currentPageIndex === 0) {
      goToPage(entries.length - 1); // Go to last entry (not the "new" page)
    }
  }, [loading, entries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveNewEntry = async (title: string, content: string, tags: string[]) => {
    try {
      await addEntry({
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        title,
        tags,
        content,
      });
      goToPage(entries.length);
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save journal entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (id: number | string) => {
    try {
      await deleteEntry(id);
      const newLength = entries.length - 1;
      if (currentPageIndex >= newLength) {
        goToPage(Math.max(0, newLength));
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete journal entry. Please try again.');
    }
  };

  const themeConfig = THEMES[theme];

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeConfig.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-current border-t-transparent rounded-full animate-spin" 
               style={{ color: theme === 'dark' ? '#94a3b8' : '#d97706' }} />
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-amber-600'}`}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show authentication pages if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthContainer
        theme={theme}
        onAuthSuccess={() => {
          // Auth state will update automatically via useAuth hook
          console.log('User authenticated:', user);
        }}
      />
    );
  }

  // Show main app if authenticated
  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.bg} transition-all duration-700`}>
      <Header
        activeView={activeView}
        theme={theme}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onNavigationClick={activeView === 'journal' ? () => setNavigationSidebarOpen(!navigationSidebarOpen) : undefined}
      />

      <Sidebar
        isOpen={sidebarOpen}
        activeView={activeView}
        theme={theme}
        onClose={() => setSidebarOpen(false)}
        onViewChange={setActiveView}
      />

      <main className="pt-20 min-h-screen pb-8">
        {activeView === 'journal' && loading ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-amber-600'}`}>
              Loading journals...
            </p>
          </div>
        ) : activeView === 'journal' ? (
          <JournalView
            entries={entries}
            currentPageIndex={currentPageIndex}
            theme={theme}
            font={journalFont}
            fontSize={journalFontSize}
            dragOffset={dragOffset}
            isFlipping={isFlipping}
            navigationSidebarOpen={navigationSidebarOpen}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onUpdateEntry={updateEntry}
            onDeleteEntry={handleDeleteEntry}
            onSaveNewEntry={handleSaveNewEntry}
            onGoToNewEntry={() => goToPage(pages.length - 1)}
            onToggleNavigationSidebar={() => setNavigationSidebarOpen(!navigationSidebarOpen)}
            onNavigateToEntry={goToPage}
          />
        ) : null}

        {activeView === 'mirror' && <MirrorView theme={theme} />}

        {activeView === 'settings' && (
          <SettingsView
            theme={theme}
            font={journalFont}
            fontSize={journalFontSize}
            ambientSound={ambientSound}
            onThemeChange={setTheme}
            onFontChange={setJournalFont}
            onFontSizeChange={setJournalFontSize}
            onAmbientSoundToggle={() => setAmbientSound(!ambientSound)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
