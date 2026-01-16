import { useEffect, useState } from 'react';
import { highlight, githubDark } from '@oxog/codeshine';
import { CopyButton } from '../common/CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const trimmedCode = code.trim();

  useEffect(() => {
    try {
      const highlighted = highlight(trimmedCode, {
        language,
        theme: githubDark,
        lineNumbers: showLineNumbers,
      });
      setHtml(highlighted);
    } catch {
      // Fallback to plain text
      const escaped = trimmedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      setHtml(`<pre><code>${escaped}</code></pre>`);
    }
  }, [trimmedCode, language, showLineNumbers]);

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-700 not-prose my-4" style={{ backgroundColor: '#0d1117' }}>
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700" style={{ backgroundColor: '#161b22' }}>
          <span className="text-sm text-zinc-400 font-mono">{filename}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className="relative group">
        {!filename && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <CopyButton text={code} />
          </div>
        )}
        <div
          className="codeshine-block overflow-x-auto p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <style>{`
        .codeshine-block pre {
          margin: 0;
          background: transparent;
        }
        .codeshine-block code {
          background: transparent;
        }
        .codeshine-block .cs-line {
          display: flex;
          min-height: 1.5rem;
          line-height: 1.5rem;
        }
        .codeshine-block .cs-line-number {
          flex-shrink: 0;
          width: 2.5rem;
          text-align: right;
          padding-right: 1rem;
          user-select: none;
          color: #6e7681;
        }
        .codeshine-block .cs-line-content {
          flex: 1;
          white-space: pre;
        }
      `}</style>
    </div>
  );
}
