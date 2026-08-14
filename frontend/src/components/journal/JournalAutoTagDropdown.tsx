import React, { useRef, useEffect } from 'react';

interface JournalAutoTagDropdownProps {
  showAuto: boolean;
  autoPos: { top: number; left: number };
  filteredAutoTags: string[];
  autoActiveIndex: number;
  autoQuery: string;
  editor: any;
  onSelectAutoTag: (tag: string) => void;
  onAutoActiveIndexChange: (idx: number | ((i: number) => number)) => void;
  onCloseAuto: () => void;
}

export const JournalAutoTagDropdown: React.FC<JournalAutoTagDropdownProps> = ({
  showAuto,
  autoPos,
  filteredAutoTags,
  autoActiveIndex,
  autoQuery,
  editor,
  onSelectAutoTag,
  onAutoActiveIndexChange,
  onCloseAuto,
}) => {
  const autoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAuto) return;
    const handleClick = (e: MouseEvent) => {
      if (
        autoRef.current &&
        !autoRef.current.contains(e.target as Node) &&
        editor &&
        !editor.view.dom.contains(e.target as Node)
      ) {
        onCloseAuto();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAuto, editor, onCloseAuto]);

  if (!showAuto) return null;

  return (
    <div
      ref={autoRef}
      className="fixed z-50 card py-1 shadow-elevated min-w-[10rem] max-h-48 overflow-y-auto"
      style={{
        top: Math.min(autoPos.top, window.innerHeight - 250) + 'px',
        left: Math.min(autoPos.left, window.innerWidth - 200) + 'px',
      }}
    >
      {filteredAutoTags.length > 0 ? (
        filteredAutoTags.map((tag, i) => (
          <button
            key={tag}
            onMouseDown={(e) => { e.preventDefault(); onSelectAutoTag(tag); }}
            onMouseEnter={() => onAutoActiveIndexChange(i)}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
              i === autoActiveIndex ? 'bg-accent-tint text-accent' : 'text-body hover:bg-accent-tint'
            }`}
          >
            #{tag}
          </button>
        ))
      ) : autoQuery ? (
        <button
          onMouseDown={(e) => { e.preventDefault(); onSelectAutoTag(autoQuery); }}
          className="w-full text-left px-3 py-1.5 text-sm text-muted hover:bg-accent-tint transition-colors"
        >
          Create "#{autoQuery}"
        </button>
      ) : (
        <div className="px-3 py-2 text-xs text-muted">No tags yet</div>
      )}
    </div>
  );
};
