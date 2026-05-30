import { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  isDark: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isDark }) => {
  const html = useMemo(() => {
    const result = marked.parse(content, { async: false });
    return typeof result === 'string' ? result : '';
  }, [content]);

  return (
    <div
      className={`content-typography chat-typography prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm ${
        isDark ? '[&_code]:bg-slate-700 [&_code]:text-slate-200' : '[&_code]:bg-slate-100 [&_code]:text-slate-800'
      } [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto ${
        isDark ? '[&_pre]:bg-slate-800 [&_pre]:border [&_pre]:border-slate-700' : '[&_pre]:bg-slate-100 [&_pre]:border [&_pre]:border-slate-200'
      } [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-none`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
