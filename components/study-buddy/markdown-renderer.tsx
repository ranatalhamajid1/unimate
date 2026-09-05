"use client";

import React from "react";

/**
 * Clean, lightweight Markdown formatter tailored for AI Study Buddy responses.
 * Formats headers, bullet lists, numbered lists, bold text, inline code, and paragraphs.
 */
export function FormattedMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-slate-800">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // Header 3 or 4
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-[14.5px] font-semibold text-slate-900 pt-1">
              {renderInline(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-[15px] font-bold text-slate-900 pt-1">
              {renderInline(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }

        // Bullet list block
        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={idx} className="space-y-1.5 pl-4 list-disc marker:text-blue-500">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="text-[13.5px] text-slate-700">
                  {renderInline(line.replace(/^\s*[-*•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list block
        const isNumList = lines.every((l) => /^\s*\d+\.\s+/.test(l));
        if (isNumList) {
          return (
            <ol key={idx} className="space-y-1.5 pl-4 list-decimal marker:text-blue-600 font-medium text-slate-700">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="text-[13.5px] text-slate-700">
                  {renderInline(line.replace(/^\s*\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        // Normal paragraph with possible single line breaks
        return (
          <p key={idx} className="text-[14px] text-slate-700">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Formats inline bold (**text**), italics (*text*), and inline code (`code`).
 */
function renderInline(text: string): React.ReactNode {
  // Split on bold, italic, code patterns
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[12.5px] font-mono font-medium text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-slate-600">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(token);
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
}
