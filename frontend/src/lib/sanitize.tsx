import React from 'react';

/**
 * Secure Markdown-lite renderer for Nagrik AI civic responses.
 *
 * Supported syntax (Gemini-output compatible):
 *   ## Heading 2     → section header
 *   ### Heading 3    → sub-header
 *   **bold**         → bold text
 *   `inline code`    → mono code
 *   [text](url)      → safe link (whitelist: https/http/mailto/tel)
 *   [S1] [S2]        → citation badge
 *   - / * item       → bullet list
 *   1. item          → numbered list
 *   ---              → horizontal rule
 *   > blockquote     → note/callout
 *
 * Security invariants:
 *  - Protocol whitelist strictly enforced (no javascript:, no data:)
 *  - All text nodes go through React (never dangerouslySetInnerHTML)
 */

const SAFE_PROTOCOLS = /^(https?:|mailto:|tel:|#cite-)/i;

export function renderSecureCivicText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip empty lines (add vertical gap)
    if (!trimmed) {
      nodes.push(<div key={`gap-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────
    if (/^---+$/.test(trimmed)) {
      nodes.push(
        <hr key={`hr-${i}`} className="border-t border-slate-200 dark:border-white/10 my-3" />
      );
      i++;
      continue;
    }

    // ── H2 heading ## ─────────────────────────────────────────────
    if (/^##\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^##\s+/, '');
      nodes.push(
        <h2
          key={`h2-${i}`}
          className="text-[14px] font-bold text-slate-900 dark:text-white mt-4 mb-1.5 leading-snug"
        >
          {parseInline(heading)}
        </h2>
      );
      i++;
      continue;
    }

    // ── H3 heading ### ────────────────────────────────────────────
    if (/^###\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^###\s+/, '');
      nodes.push(
        <h3
          key={`h3-${i}`}
          className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200 mt-3 mb-1 leading-snug"
        >
          {parseInline(heading)}
        </h3>
      );
      i++;
      continue;
    }

    // ── Blockquote > ──────────────────────────────────────────────
    if (/^>\s+/.test(trimmed)) {
      const content = trimmed.replace(/^>\s+/, '');
      nodes.push(
        <div
          key={`bq-${i}`}
          className="border-l-2 border-slate-400 dark:border-zinc-500 pl-3 py-0.5 my-1.5 text-slate-600 dark:text-zinc-400 italic text-[13px]"
        >
          {parseInline(content)}
        </div>
      );
      i++;
      continue;
    }

    // ── Bullet list (-, *, •) ─────────────────────────────────────
    if (/^[-*•]\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*•]\s+/, '');
        listItems.push(
          <li
            key={`li-${i}`}
            className="flex items-start gap-2 pl-0"
          >
            <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 shrink-0">•</span>
            <span className="leading-relaxed">{parseInline(itemText)}</span>
          </li>
        );
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="space-y-1 my-2 pl-1">
          {listItems}
        </ul>
      );
      continue;
    }

    // ── Numbered list (1. 2. 3.) ──────────────────────────────────
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      let counter = 0;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        counter++;
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        listItems.push(
          <li key={`oli-${i}`} className="flex items-start gap-2.5 pl-0">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold text-[11px] mt-0.5 shrink-0 w-4 text-right">
              {counter}.
            </span>
            <span className="leading-relaxed">{parseInline(itemText)}</span>
          </li>
        );
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="space-y-1 my-2 pl-1">
          {listItems}
        </ol>
      );
      continue;
    }

    // ── Regular paragraph ─────────────────────────────────────────
    nodes.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-1.5 text-[13.5px] text-slate-800 dark:text-zinc-200">
      {nodes}
    </div>
  );
}

/**
 * Inline token parser: handles **bold**, `code`, [S1], [text](url)
 */
function parseInline(line: string): React.ReactNode[] {
  // Combined regex: citation [S1], markdown link, **bold**, `code`
  const tokenRegex =
    /(\[S\d+\])|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(`[^`]+`)/g;

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
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors align-middle"
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
            className={`font-medium underline underline-offset-2 decoration-1 ${
              isSafe
                ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'
                : 'text-slate-400 cursor-not-allowed'
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
        <strong
          key={`bold-${match.index}`}
          className="font-semibold text-slate-900 dark:text-white"
        >
          {boldText}
        </strong>
      );
    }
    // Inline code `code`
    else if (match[4]) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 rounded"
        >
          {codeText}
        </code>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [line];
}
