import React from 'react';

/**
 * Secure markdown-lite formatter implementing Invariant #7:
 * Whitelist link protocols strictly to http:, https:, mailto:, tel:, and #cite-.
 * Safely neutralizes javascript: and arbitrary data schemes.
 */
const SAFE_PROTOCOLS = /^(https?:|mailto:|tel:|#cite-)/i;

export function renderSecureCivicText(text: string): React.ReactNode {
  if (!text) return null;

  // Split lines to preserve structured administrative paragraphs and lists
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-[13.5px]">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-2" />;
        }

        const isListItem = /^[*-]\s+/.test(line.trim());
        const cleanedLine = isListItem ? line.trim().replace(/^[*-]\s+/, '') : line;

        // Process bold and links inside the line
        const parsedElements = parseLineTokens(cleanedLine);

        if (isListItem) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-700 font-bold mt-0.5">•</span>
              <span>{parsedElements}</span>
            </div>
          );
        }

        return <p key={lineIdx}>{parsedElements}</p>;
      })}
    </div>
  );
}

function parseLineTokens(line: string): React.ReactNode[] {
  // Regex tokenizing [S1], [link text](url), and **bold**
  const tokenRegex = /(\[S\d+\])|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }

    const token = match[0];

    // Citation badge [S1], [S2]
    if (match[1]) {
      parts.push(
        <span
          key={`cite-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md shadow-2xs cursor-pointer hover:bg-emerald-100 transition-colors"
        >
          {token}
        </span>
      );
    }
    // Markdown link [text](url)
    else if (match[2]) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const rawUrl = linkMatch[2].trim();
        const isSafe = SAFE_PROTOCOLS.test(rawUrl);
        const safeUrl = isSafe ? rawUrl : '#';

        parts.push(
          <a
            key={`link-${match.index}`}
            href={safeUrl}
            target={safeUrl.startsWith('http') ? '_blank' : undefined}
            rel={safeUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`font-semibold underline underline-offset-2 ${
              isSafe ? 'text-emerald-700 hover:text-emerald-900' : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            {linkText}
          </a>
        );
      }
    }
    // Bold **text**
    else if (match[3]) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-slate-900">
          {boldText}
        </strong>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts;
}
