"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function ArticleShareBar({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Read "${title}" on AI Vision Audit:`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    }
  };

  const handleShareLinkedIn = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-2 font-lazzer">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-slate-500" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleShareTwitter}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-black cursor-pointer"
        title="Share on X / Twitter"
      >
        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleShareLinkedIn}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-black cursor-pointer"
        title="Share on LinkedIn"
      >
        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.94 0 1.7-.76 1.7-1.7 0-.93-.76-1.7-1.7-1.7-.94 0-1.7.77-1.7 1.7 0 .94.76 1.7 1.7 1.7m1.4 9.74v-8.37H5.06v8.37h2.8z" />
        </svg>
      </button>
    </div>
  );
}

export function FormattedArticleBody({ content }: { content: string }) {
  const renderFormattedMarkdown = (raw: string) => {
    const lines = raw.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "";

    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={`code-${index}`}
              className="my-6 overflow-hidden rounded-sm border border-slate-800 bg-slate-950 font-mono text-xs shadow-md"
            >
              {codeBlockLang && (
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-[11px] font-semibold text-slate-400">
                  <span>{codeBlockLang}</span>
                  <span className="text-[10px] text-slate-500">code snippet</span>
                </div>
              )}
              <pre className="overflow-x-auto p-4 text-emerald-400 leading-relaxed">
                <code>{codeBlockContent.join("\n")}</code>
              </pre>
            </div>
          );
          codeBlockContent = [];
          inCodeBlock = false;
          codeBlockLang = "";
        } else {
          inCodeBlock = true;
          codeBlockLang = line.trim().replace(/^```/, "").trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      const trimmed = line.trim();

      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="mt-8 mb-3 font-display text-xl font-bold tracking-tight text-slate-900 font-lazzer"
          >
            {trimmed.replace(/^###\s+/, "")}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className="mt-12 mb-4 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 border-b border-slate-200/80 pb-3 font-lazzer"
          >
            {trimmed.replace(/^##\s+/, "")}
          </h2>
        );
      } else if (trimmed.startsWith("# ")) {
        elements.push(
          <h1
            key={`h1-${index}`}
            className="mt-8 mb-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 font-lazzer"
          >
            {trimmed.replace(/^#\s+/, "")}
          </h1>
        );
      } else if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote
            key={`quote-${index}`}
            className="my-6 border-l-4 border-slate-900 bg-slate-50 p-4 rounded-r-sm text-sm italic leading-relaxed text-slate-700 font-lazzer"
          >
            {trimmed.replace(/^>\s+/, "")}
          </blockquote>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <li
            key={`li-${index}`}
            className="ml-6 list-disc text-sm sm:text-base leading-relaxed text-slate-700 my-1.5 font-lazzer"
          >
            {trimmed.replace(/^[-*]\s+/, "")}
          </li>
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        elements.push(
          <li
            key={`oli-${index}`}
            className="ml-6 list-decimal text-sm sm:text-base leading-relaxed text-slate-700 my-1.5 font-lazzer"
          >
            {trimmed.replace(/^\d+\.\s+/, "")}
          </li>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p
            key={`p-${index}`}
            className="my-4 text-sm sm:text-base leading-relaxed text-slate-700 font-lazzer"
          >
            {trimmed}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div className="prose-container max-w-none text-slate-800 font-lazzer">
      {renderFormattedMarkdown(content)}
    </div>
  );
}
