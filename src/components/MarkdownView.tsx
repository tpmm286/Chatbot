import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Load commonly used Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';

import { Check, Copy, Terminal } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface MarkdownViewProps {
  content: string;
}

// Function to detect Persian / Arabic text
function isRtlText(text: string): boolean {
  const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlPattern.test(text);
}

// Helper to extract plain text string from React children for RTL check
function extractStringFromChildren(children: any): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(extractStringFromChildren).join('');
  }
  if (children?.props?.children) {
    return extractStringFromChildren(children.props.children);
  }
  return '';
}

// Prism.js Code Block with language detection & Copy Code button (Memoized)
const CodeBlock: React.FC<{ code: string; language: string }> = React.memo(({
  code,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState('');

  useEffect(() => {
    let lang = language.toLowerCase();
    if (lang === 'js') lang = 'javascript';
    if (lang === 'ts') lang = 'typescript';
    if (lang === 'py') lang = 'python';
    if (lang === 'sh') lang = 'bash';
    if (lang === 'yml') lang = 'yaml';

    if (Prism.languages[lang]) {
      try {
        const highlighted = Prism.highlight(code, Prism.languages[lang], lang);
        setHighlightedHtml(highlighted);
        return;
      } catch (err) {
        console.warn('Prism highlighting error:', err);
      }
    }
    setHighlightedHtml('');
  }, [code, language]);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e2e] shadow-md text-[13px] font-mono group">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-white/5 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold uppercase tracking-wider text-gray-300">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-sans font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs font-sans font-medium">Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block Content */}
      <div className="p-4 overflow-x-auto max-h-[550px] custom-scrollbar">
        {highlightedHtml ? (
          <pre className="text-gray-100 leading-relaxed font-mono">
            <code
              className={`language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="text-gray-100 leading-relaxed font-mono">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
});

export const MarkdownView: React.FC<MarkdownViewProps> = React.memo(({ content }) => {
  return (
    <div className="markdown-body text-[15px] leading-relaxed text-gray-100 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks & inline code
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isInline = !match && !codeString.includes('\n');

            if (isInline) {
              return (
                <code
                  className="bg-black/35 text-emerald-400 font-mono text-[13px] px-1.5 py-0.5 rounded border border-white/10 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const lang = match ? match[1].toLowerCase() : 'text';
            return <CodeBlock code={codeString} language={lang} />;
          },

          // Paragraphs with RTL auto-detection
          p({ children }: any) {
            const textContent = extractStringFromChildren(children);
            const rtl = isRtlText(textContent);

            return (
              <p
                dir={rtl ? 'rtl' : 'ltr'}
                className={`my-3 text-gray-200 leading-7 ${
                  rtl ? 'text-right font-sans font-normal' : 'text-left'
                }`}
              >
                {children}
              </p>
            );
          },

          // Headings
          h1({ children }: any) {
            const rtl = isRtlText(extractStringFromChildren(children));
            return (
              <h1
                dir={rtl ? 'rtl' : 'ltr'}
                className={`text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
              >
                {children}
              </h1>
            );
          },
          h2({ children }: any) {
            const rtl = isRtlText(extractStringFromChildren(children));
            return (
              <h2
                dir={rtl ? 'rtl' : 'ltr'}
                className={`text-xl font-bold text-gray-100 mt-5 mb-2.5 pb-1 border-b border-white/5 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
              >
                {children}
              </h2>
            );
          },
          h3({ children }: any) {
            const rtl = isRtlText(extractStringFromChildren(children));
            return (
              <h3
                dir={rtl ? 'rtl' : 'ltr'}
                className={`text-lg font-semibold text-emerald-400 mt-4 mb-2 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
              >
                {children}
              </h3>
            );
          },
          h4({ children }: any) {
            return (
              <h4 className="text-base font-semibold text-gray-200 mt-3 mb-1.5">
                {children}
              </h4>
            );
          },

          // Lists
          ul({ children }: any) {
            return (
              <ul className="list-disc list-outside ml-6 space-y-1.5 my-3 text-gray-200">
                {children}
              </ul>
            );
          },
          ol({ children }: any) {
            return (
              <ol className="list-decimal list-outside ml-6 space-y-1.5 my-3 text-gray-200">
                {children}
              </ol>
            );
          },
          li({ children }: any) {
            const rtl = isRtlText(extractStringFromChildren(children));
            return (
              <li dir={rtl ? 'rtl' : 'ltr'} className={rtl ? 'text-right' : 'text-left'}>
                {children}
              </li>
            );
          },

          // Blockquotes
          blockquote({ children }: any) {
            const rtl = isRtlText(extractStringFromChildren(children));
            return (
              <blockquote
                dir={rtl ? 'rtl' : 'ltr'}
                className={`border-l-4 border-emerald-500 pl-4 py-1.5 my-3 italic text-gray-300 bg-white/5 rounded-r-lg ${
                  rtl ? 'text-right border-l-0 border-r-4 pr-4 pl-0 rounded-l-lg rounded-r-none' : 'text-left'
                }`}
              >
                {children}
              </blockquote>
            );
          },

          // Tables (GFM)
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-white/10 shadow-sm">
                <table className="min-w-full divide-y divide-white/10 text-sm text-left">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }: any) {
            return <thead className="bg-[#1e1e24] text-gray-200 font-semibold">{children}</thead>;
          },
          tbody({ children }: any) {
            return <tbody className="divide-y divide-white/5 bg-[#202123]/60">{children}</tbody>;
          },
          tr({ children }: any) {
            return <tr className="hover:bg-white/5 transition-colors">{children}</tr>;
          },
          th({ children }: any) {
            return <th className="px-4 py-2.5 font-semibold text-gray-200 border-r border-white/5 last:border-r-0">{children}</th>;
          },
          td({ children }: any) {
            return <td className="px-4 py-2 text-gray-300 border-r border-white/5 last:border-r-0">{children}</td>;
          },

          // Links
          a({ href, children }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline font-medium transition-colors"
              >
                {children}
              </a>
            );
          },

          // Images
          img({ src, alt }: any) {
            return (
              <div className="my-4 flex flex-col items-center">
                <img
                  src={src}
                  alt={alt || 'Generated Image'}
                  className="rounded-2xl border border-white/15 max-h-[480px] object-contain shadow-2xl bg-black/50 p-1"
                />
                {alt && <span className="text-xs text-gray-400 mt-2 italic">{alt}</span>}
              </div>
            );
          },

          // Horizontal rule
          hr() {
            return <hr className="my-6 border-white/10" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
