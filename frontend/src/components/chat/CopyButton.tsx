import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  messageId: string;
  content: string;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ messageId, content, copiedId, onCopy }) => {
  return (
    <button
      onClick={() => onCopy(messageId, content)}
      className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity p-1 rounded hover:bg-accent-tint text-muted"
    >
      {copiedId === messageId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};
