import React, { useState } from 'react';
import { ViewType } from '@/types';
import { THEMES } from '@constants/themes';
import { useAuth } from '@hooks/useAuth';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { usePageFlip } from '@hooks/usePageFlip';
import { useSettings } from '@hooks/useSettings';
import { AuthContainer } from '@components/AuthContainer';
import { Header } from '@components/Header';
import { Sidebar } from '@components/Sidebar';
import { JournalView } from '@components/JournalView';
import { InsightsView } from '@components/InsightsView';
import { SettingsView } from '@components/SettingsView';

/**
 * Example implementation showing how to integrate authentication
 * with the existing journal application.
 * 
 * To use this:
 * 1. Rename this file from AppWithAuth.example.tsx to AppWithAuth.tsx
 * 2. Update main.tsx to import AppWithAuth instead of App
 * 3. Connect the useAuth hook to your backend API endpoints
 */
const AppWithAuth: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('journal');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          // User successfully authenticated, component will re-render
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
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onUpdateEntry={updateEntry}
            onDeleteEntry={handleDeleteEntry}
            onSaveNewEntry={handleSaveNewEntry}
            onGoToNewEntry={() => goToPage(pages.length - 1)}
          />
        ) : null}

        {activeView === 'insights' && <InsightsView theme={theme} />}

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

export default AppWithAuth;
