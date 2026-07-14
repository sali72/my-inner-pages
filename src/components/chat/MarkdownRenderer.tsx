import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  isDark: boolean;
}

function ExternalLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isDark }) => {
  return (
    <div className={`content-typography chat-typography break-words [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 ${
      isDark
        ? '[&_pre]:bg-[#1a1a18] [&_pre]:border [&_pre]:border-white/10'
        : '[&_pre]:bg-[#f4f4f0] [&_pre]:border [&_pre]:border-black/8'
    } [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm ${
      isDark
        ? '[&_code]:bg-white/10 [&_code]:text-[#e0e0dc]'
        : '[&_code]:bg-black/6 [&_code]:text-[#1a1a18]'
    } [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-none [&_pre_code]:text-inherit [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-4 [&_h2]:mt-3 [&_h3]:mt-2 [&_h1]:mb-2 [&_h2]:mb-1.5 [&_h3]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic ${
      isDark
        ? '[&_blockquote]:border-white/20 [&_blockquote]:text-[#a0a09c]'
        : '[&_blockquote]:border-black/20 [&_blockquote]:text-[#5a5a56]'
    } [&_hr]:my-4 [&_hr]:border-default [&_table]:w-full [&_th]:text-left [&_th]:font-semibold [&_th]:pb-1 [&_td]:py-0.5 [&_tr]:border-b [&_tr]:border-default`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: ExternalLink }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
