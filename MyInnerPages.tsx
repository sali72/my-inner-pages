import React, { useState } from 'react';
import { BookOpen, Lightbulb, Settings, Menu, Volume2, VolumeX, Edit2, Trash2, Save, X, Tag, MoreVertical, Copy, Share2 } from 'lucide-react';

const MyInnerPages = () => {
  const [activeView, setActiveView] = useState('journal');
  const [theme, setTheme] = useState('vintage');
  const [ambientSound, setAmbientSound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingTags, setEditingTags] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryTags, setNewEntryTags] = useState([]);
  const [newEntryTagInput, setNewEntryTagInput] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isWritingNew, setIsWritingNew] = useState(false);
  const [journalFont, setJournalFont] = useState('serif');
  const [journalFontSize, setJournalFontSize] = useState('lg');
  const [showMenu, setShowMenu] = useState(false);
  
  const [entries, setEntries] = useState([
    { id: 1, date: 'October 3, 2025', title: 'Small Moments of Peace', tags: ['mindfulness', 'gratitude'], content: 'Today I realized that the small moments of peace throughout the day are what truly matter. A warm cup of coffee in the morning sunlight, a conversation with a friend who truly listens, the way the evening light filters through the trees.\n\nThese aren\'t grand moments, but they\'re the ones that stay with me.', mood: 'peaceful' },
    { id: 2, date: 'October 2, 2025', title: 'Growth in the Messy Middle', tags: ['growth', 'reflection'], content: 'Growth doesn\'t happen in straight lines. I\'m learning to embrace the messy middle, where progress feels invisible but is happening nonetheless.\n\nToday felt like a step backward in some ways, but maybe that\'s just part of the dance.', mood: 'thoughtful' }
  ]);

  const themes = {
    vintage: { bg: 'from-amber-50 via-orange-50 to-rose-50', paper: 'bg-amber-50', accent: 'text-amber-800', border: 'border-amber-200' },
    minimal: { bg: 'from-slate-50 via-gray-50 to-zinc-50', paper: 'bg-white', accent: 'text-slate-700', border: 'border-gray-200' },
    dark: { bg: 'from-slate-900 via-gray-900 to-neutral-900', paper: 'bg-slate-800', accent: 'text-slate-200', border: 'border-slate-700' }
  };

  const getFontClass = () => {
    const fonts = { serif: 'font-serif', sans: 'font-sans', mono: 'font-mono' };
    return fonts[journalFont] || 'font-serif';
  };

  const getFontSizeClass = () => {
    const sizes = { sm: 'text-base', md: 'text-lg', lg: 'text-xl', xl: 'text-2xl' };
    return sizes[journalFontSize] || 'text-lg';
  };

  const detectRTL = (text) => {
    if (!text || text.length === 0) return false;
    return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text.charAt(0));
  };

  const detectLineDirection = (line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return 'ltr';
    return detectRTL(trimmedLine) ? 'rtl' : 'ltr';
  };

  const renderTextWithLineDirection = (text) => {
    const lines = text.split('\n');
    return lines.map((line, index) => (
      <span key={index} style={{ direction: detectLineDirection(line), display: 'block' }}>
        {line || '\u00A0'}
      </span>
    ));
  };

  const pages = [...entries, { id: 'new', date: 'Today', title: '', tags: [], content: '', isNew: true }];
  const isDark = theme === 'dark';
  const currentPage = pages[currentPageIndex];

  const handleDragStart = (e) => {
    setDragStart(e.type === 'mousedown' ? e.clientX : e.touches[0].clientX);
  };

  const handleDragMove = (e) => {
    if (dragStart === null || isFlipping) return;
    e.preventDefault();
    const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    setDragOffset(currentX - dragStart);
  };

  const handleDragEnd = () => {
    if (dragStart === null || isFlipping) return;
    const threshold = 100;
    if (Math.abs(dragOffset) > threshold) {
      setIsFlipping(true);
      if (dragOffset > 0 && currentPageIndex > 0) {
        setTimeout(() => {
          setCurrentPageIndex(currentPageIndex - 1);
          setDragOffset(0);
          setIsFlipping(false);
        }, 400);
      } else if (dragOffset < 0 && currentPageIndex < pages.length - 1) {
        setTimeout(() => {
          setCurrentPageIndex(currentPageIndex + 1);
          setDragOffset(0);
          setIsFlipping(false);
        }, 400);
      } else {
        setDragOffset(0);
        setIsFlipping(false);
      }
    } else {
      setDragOffset(0);
      setIsFlipping(false);
    }
    setDragStart(null);
  };

  const saveNewEntry = () => {
    if (newEntryContent.trim()) {
      setEntries([...entries, {
        id: entries.length + 1,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        title: newEntryTitle || 'Untitled',
        tags: newEntryTags,
        content: newEntryContent
      }]);
      setNewEntryTitle('');
      setNewEntryTags([]);
      setNewEntryContent('');
      setNewEntryTagInput('');
      setIsWritingNew(false);
      setCurrentPageIndex(entries.length);
    }
  };

  const updateEntry = () => {
    setEntries(entries.map(e => e.id === currentPage.id ? { ...e, content: editingContent, title: editingTitle, tags: editingTags } : e));
    setEditMode(false);
  };

  const deleteEntry = () => {
    if (window.confirm('Delete this entry?')) {
      const newEntries = entries.filter(e => e.id !== currentPage.id);
      setEntries(newEntries);
      setCurrentPageIndex(Math.max(0, Math.min(currentPageIndex, newEntries.length)));
      setShowMenu(false);
    }
  };

  const startEditing = () => {
    setEditingContent(currentPage.content);
    setEditingTitle(currentPage.title);
    setEditingTags(currentPage.tags || []);
    setEditMode(true);
    setShowMenu(false);
  };

  const copyToClipboard = () => {
    const text = `${currentPage.title}\n\n${currentPage.content}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
      setShowMenu(false);
    });
  };

  const shareEntry = () => {
    const text = `${currentPage.title}\n\n${currentPage.content}`;
    if (navigator.share) {
      navigator.share({ title: currentPage.title, text: text });
    } else {
      copyToClipboard();
    }
    setShowMenu(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themes[theme].bg} transition-all duration-700`}>
      <header className={`fixed top-0 left-0 right-0 h-16 ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-lg border-b ${themes[theme].border} z-40 flex items-center px-4`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-50'}`}>
          <Menu className={`w-6 h-6 ${themes[theme].accent}`} />
        </button>
        <h1 className={`ml-4 text-xl font-serif font-bold ${themes[theme].accent}`}>
          {activeView === 'journal' ? 'Your Journal' : activeView === 'insights' ? 'AI Insights' : 'Settings'}
        </h1>
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed left-0 top-0 h-full w-64 ${isDark ? 'bg-slate-800' : 'bg-white'} border-r ${themes[theme].border} p-6 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 mt-4">
          <h1 className={`text-2xl font-serif font-bold ${themes[theme].accent} flex items-center gap-2`}>
            <BookOpen className="w-7 h-7" />
            My Inner Pages
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-amber-600/70'}`}>Your story, page by page</p>
        </div>
        <nav className="space-y-2">
          {['journal', 'insights', 'settings'].map(view => (
            <button
              key={view}
              onClick={() => { setActiveView(view); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === view ? (isDark ? 'bg-slate-700 text-slate-100' : 'bg-amber-100 text-amber-900') : (isDark ? 'text-slate-400 hover:bg-slate-700/50' : 'text-amber-700 hover:bg-amber-50')
              }`}
            >
              {view === 'journal' && <BookOpen className="w-5 h-5" />}
              {view === 'insights' && <Lightbulb className="w-5 h-5" />}
              {view === 'settings' && <Settings className="w-5 h-5" />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="pt-20 min-h-screen pb-8">
        {activeView === 'journal' && (
          <div className="flex flex-col items-center justify-center px-4 py-8 relative">
            <div className="max-w-4xl w-full mx-auto" style={{ perspective: '1500px' }}>
              <div
                className={`${themes[theme].paper} rounded-xl shadow-2xl border ${themes[theme].border} overflow-hidden ${!editMode && !isWritingNew ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{
                  minHeight: '600px',
                  backgroundImage: isDark ? 'none' : 'linear-gradient(to bottom, rgba(255,250,240,0.9), rgba(254,243,199,0.5))',
                  touchAction: 'none',
                  transform: `translateX(${isFlipping ? (dragOffset > 0 ? '100%' : '-100%') : dragOffset * 0.5}px) rotateY(${isFlipping ? (dragOffset > 0 ? '180deg' : '-180deg') : dragOffset * 0.15}deg)`,
                  transition: isFlipping ? 'transform 0.6s ease' : 'none',
                  opacity: isFlipping ? 0 : Math.max(0.3, 1 - Math.abs(dragOffset) * 0.002),
                  transformOrigin: dragOffset > 0 ? 'left center' : 'right center'
                }}
                onMouseDown={!editMode && !isWritingNew ? handleDragStart : undefined}
                onMouseMove={!editMode && !isWritingNew ? handleDragMove : undefined}
                onMouseUp={!editMode && !isWritingNew ? handleDragEnd : undefined}
                onMouseLeave={!editMode && !isWritingNew ? handleDragEnd : undefined}
                onTouchStart={!editMode && !isWritingNew ? handleDragStart : undefined}
                onTouchMove={!editMode && !isWritingNew ? handleDragMove : undefined}
                onTouchEnd={!editMode && !isWritingNew ? handleDragEnd : undefined}
              >
                <div className="p-8 md:p-12 overflow-y-auto" style={{ minHeight: '600px' }}>
                  <div className="mb-6 flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-amber-600'}`}>{currentPage.date}</p>
                      {editMode ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className={`text-2xl ${getFontClass()} font-bold ${themes[theme].accent} mt-2 w-full bg-transparent border-b ${themes[theme].border} focus:outline-none`}
                          style={{ direction: detectRTL(editingTitle) ? 'rtl' : 'ltr' }}
                        />
                      ) : (
                        <h2 className={`text-2xl ${getFontClass()} font-bold ${themes[theme].accent} mt-2`} style={{ direction: detectRTL(currentPage.title) ? 'rtl' : 'ltr' }}>
                          {currentPage.title || (currentPage.isNew ? 'New Entry' : 'Untitled')}
                        </h2>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editMode ? (
                          <div className="flex items-center gap-2 flex-wrap w-full">
                            {editingTags.map((tag, i) => (
                              <span key={i} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-amber-100 text-amber-800'}`}>
                                {tag}
                                <button onClick={() => setEditingTags(editingTags.filter((_, idx) => idx !== i))}>×</button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder="Add tag..."
                              className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-amber-50 text-amber-800'} border ${themes[theme].border} focus:outline-none`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  setEditingTags([...editingTags, e.target.value.trim()]);
                                  e.target.value = '';
                                  e.preventDefault();
                                }
                              }}
                            />
                          </div>
                        ) : (
                          currentPage.tags && currentPage.tags.map((tag, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-amber-100 text-amber-800'}`}>
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    {!currentPage.isNew && !editMode && (
                      <div className="relative ml-4">
                        <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-100'} transition-all`}>
                          <MoreVertical className={`w-5 h-5 ${themes[theme].accent}`} />
                        </button>
                        {showMenu && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                            <div className={`absolute right-0 top-12 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl border ${themes[theme].border} py-2 min-w-[160px] z-20`}>
                              <button onClick={startEditing} className={`w-full flex items-center gap-3 px-4 py-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'} transition-all`}>
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              <button onClick={copyToClipboard} className={`w-full flex items-center gap-3 px-4 py-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'} transition-all`}>
                                <Copy className="w-4 h-4" />
                                Copy
                              </button>
                              <button onClick={shareEntry} className={`w-full flex items-center gap-3 px-4 py-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-amber-50 text-amber-900'} transition-all`}>
                                <Share2 className="w-4 h-4" />
                                Share
                              </button>
                              <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-amber-200'} my-2`}></div>
                              <button onClick={deleteEntry} className={`w-full flex items-center gap-3 px-4 py-2 ${isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-all`}>
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {editMode && (
                      <div className="flex gap-2 ml-4">
                        <button onClick={updateEntry} className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-amber-100'}`}>
                          <Save className={`w-5 h-5 ${themes[theme].accent}`} />
                        </button>
                        <button onClick={() => setEditMode(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-100'}`}>
                          <X className={`w-5 h-5 ${themes[theme].accent}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 mb-4" style={{ minHeight: '400px' }}>
                    {currentPage.isNew ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={newEntryTitle}
                          onChange={(e) => { setNewEntryTitle(e.target.value); setIsWritingNew(true); }}
                          placeholder="Title..."
                          className={`w-full text-xl ${getFontClass()} font-bold ${themes[theme].accent} bg-transparent border-b ${themes[theme].border} focus:outline-none pb-2`}
                          style={{ direction: detectRTL(newEntryTitle) ? 'rtl' : 'ltr' }}
                        />
                        <div className={`flex flex-wrap gap-2 pb-2 border-b ${themes[theme].border}`}>
                          <Tag className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-amber-500'} mt-1`} />
                          {newEntryTags.map((tag, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-amber-100 text-amber-800'}`}>
                              {tag}
                              <button onClick={() => setNewEntryTags(newEntryTags.filter((_, idx) => idx !== i))}>×</button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={newEntryTagInput}
                            onChange={(e) => { setNewEntryTagInput(e.target.value); setIsWritingNew(true); }}
                            placeholder="Add tags (press Enter)..."
                            className="flex-1 text-sm bg-transparent focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                setNewEntryTags([...newEntryTags, e.target.value.trim()]);
                                setNewEntryTagInput('');
                                e.preventDefault();
                              }
                            }}
                          />
                        </div>
                        <textarea
                          value={newEntryContent}
                          onChange={(e) => { setNewEntryContent(e.target.value); setIsWritingNew(true); }}
                          placeholder="Begin writing your story..."
                          className={`w-full ${getFontClass()} ${getFontSizeClass()} leading-relaxed resize-none focus:outline-none ${isDark ? 'text-slate-300 placeholder-slate-500' : 'text-slate-800 placeholder-amber-400/50'}`}
                          style={{ background: 'transparent', minHeight: '250px', direction: 'auto', unicodeBidi: 'plaintext' }}
                          autoFocus
                        />
                        {isWritingNew && (
                          <div className="flex justify-end gap-2 pt-4">
                            <button onClick={saveNewEntry} className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-amber-100'}`} title="Save Entry">
                              <Save className={`w-5 h-5 ${themes[theme].accent}`} />
                            </button>
                            <button onClick={() => { setNewEntryTitle(''); setNewEntryTags([]); setNewEntryContent(''); setNewEntryTagInput(''); setIsWritingNew(false); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-100'}`} title="Cancel">
                              <X className={`w-5 h-5 ${themes[theme].accent}`} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : editMode ? (
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={`w-full h-full ${getFontClass()} ${getFontSizeClass()} leading-relaxed resize-none focus:outline-none ${isDark ? 'text-slate-300' : 'text-slate-800'}`}
                        style={{ background: 'transparent', minHeight: '400px', direction: 'auto', unicodeBidi: 'plaintext' }}
                      />
                    ) : (
                      <div className={`${getFontClass()} ${getFontSizeClass()} leading-relaxed whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {renderTextWithLineDirection(currentPage.content)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-amber-500/70'}`}>Page {currentPageIndex + 1} of {pages.length}</p>
              </div>
            </div>
            {currentPageIndex < pages.length - 1 && (
              <button onClick={() => setCurrentPageIndex(pages.length - 1)} className={`fixed bottom-8 right-8 ${isDark ? 'bg-slate-700' : 'bg-gradient-to-r from-amber-500 to-orange-500'} text-white px-6 py-3 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 z-30`}>
                <Edit2 className="w-5 h-5" />
                <span>New Entry</span>
              </button>
            )}
          </div>
        )}

        {activeView === 'insights' && (
          <div className="max-w-4xl mx-auto p-8">
            <div className={`${themes[theme].paper} p-8 rounded-xl shadow-lg border ${themes[theme].border}`}>
              <h3 className={`text-xl font-semibold ${themes[theme].accent} mb-4`}>Emotional Patterns</h3>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} mb-4`}>Your entries show a beautiful progression toward mindfulness and self-acceptance.</p>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-blue-50'} mb-3`}>
                <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-indigo-900'}`}>Most Common Theme</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-indigo-600'}`}>Self-reflection and personal growth</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="max-w-2xl mx-auto p-8">
            <div className={`${themes[theme].paper} p-8 rounded-xl shadow-lg border ${themes[theme].border} space-y-8`}>
              <div>
                <h3 className={`text-lg font-semibold ${themes[theme].accent} mb-4`}>Journal Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('vintage')}
                    className={`p-4 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 border-2 transition-all ${
                      theme === 'vintage' ? 'border-amber-500 ring-2 ring-amber-300' : 'border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <p className="text-amber-900 font-medium">Vintage</p>
                  </button>
                  <button
                    onClick={() => setTheme('minimal')}
                    className={`p-4 rounded-lg bg-gradient-to-br from-slate-100 to-gray-100 border-2 transition-all ${
                      theme === 'minimal' ? 'border-gray-500 ring-2 ring-gray-300' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <p className="text-slate-700 font-medium">Minimal</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border-2 transition-all ${
                      theme === 'dark' ? 'border-slate-500 ring-2 ring-slate-400' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <p className="text-slate-200 font-medium">Dark</p>
                  </button>
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themes[theme].accent} mb-4`}>Journal Font</h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2 block`}>Font Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setJournalFont('serif')}
                        className={`p-3 rounded-lg font-serif border-2 transition-all ${
                          journalFont === 'serif'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        Serif
                      </button>
                      <button
                        onClick={() => setJournalFont('sans')}
                        className={`p-3 rounded-lg font-sans border-2 transition-all ${
                          journalFont === 'sans'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        Sans
                      </button>
                      <button
                        onClick={() => setJournalFont('mono')}
                        className={`p-3 rounded-lg font-mono border-2 transition-all ${
                          journalFont === 'mono'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        Mono
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-amber-800'} mb-2 block`}>Font Size</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setJournalFontSize('sm')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          journalFontSize === 'sm'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        Small
                      </button>
                      <button
                        onClick={() => setJournalFontSize('md')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          journalFontSize === 'md'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => setJournalFontSize('lg')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          journalFontSize === 'lg'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        Large
                      </button>
                      <button
                        onClick={() => setJournalFontSize('xl')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          journalFontSize === 'xl'
                            ? isDark ? 'border-slate-500 bg-slate-700 text-slate-200 ring-2 ring-slate-400' : 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                            : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        X-Large
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themes[theme].accent} mb-4`}>Ambient Sound</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                  Ambient sounds are placeholders. You'll need to integrate audio files or a sound library to make them functional.
                </p>
                <button onClick={() => setAmbientSound(!ambientSound)} className={`w-full p-4 rounded-lg border ${themes[theme].border} flex justify-between items-center ${isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-50'} transition-all`}>
                  <span className={isDark ? 'text-slate-300' : 'text-amber-800'}>Enable Ambient Sound</span>
                  {ambientSound ? <Volume2 className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-amber-600'}`} /> : <VolumeX className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-amber-400'}`} />}
                </button>
                {ambientSound && (
                  <div className="mt-2 space-y-2">
                    {['🌧️ Rain', '☕ Café', '🌿 Nature'].map(s => (
                      <button key={s} className={`w-full text-left px-3 py-2 rounded ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-amber-50 text-amber-700'} transition-all`}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyInnerPages;