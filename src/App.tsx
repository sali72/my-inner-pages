import React, { useState } from 'react';
import { ViewType } from '@types/index';
import { THEMES } from '@constants/themes';
import { useJournalEntries } from '@hooks/useJournalEntries';
import { usePageFlip } from '@hooks/usePageFlip';
import { useSettings } from '@hooks/useSettings';
import { Header } from '@components/Header';
import { Sidebar } from '@components/Sidebar';
import { JournalView } from '@components/JournalView';
import { InsightsView } from '@components/InsightsView';
import { SettingsView } from '@components/SettingsView';

const App: React.FC = () => {
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

export default App;
