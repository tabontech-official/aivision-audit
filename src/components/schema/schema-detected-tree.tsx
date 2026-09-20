"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, ChevronRight, ChevronDown, CheckCircle2, AlertOctagon, AlertTriangle } from "lucide-react";
import { ExtractedSchemaItem } from "@/services/schema/types";

interface SchemaDetectedTreeProps {
  items: ExtractedSchemaItem[];
}

export function SchemaDetectedTree({ items }: SchemaDetectedTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (id: string, json: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
        <Code2 className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Structured Data Detected</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
          No JSON-LD or Microdata blocks were found on this webpage. Use the Schema Generator tool below to create and embed structured data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            Detected Schema Items ({items.length})
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Individual structured data blocks discovered on this URL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandedIds(new Set(items.map((i) => i.id)))}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Expand All
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <button
            onClick={() => setExpandedIds(new Set())}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40"
            >
              {/* Header bar */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-zinc-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                    @{item.schemaType}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {item.format}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.hasErrors ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-0.5 rounded-full">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Errors Detected
                    </span>
                  ) : item.hasWarnings ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Warnings
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid Schema
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.id, item.rawJson);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-2xs hover:bg-zinc-50"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JSON Code Viewer */}
              {isExpanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto max-h-96">
                  <pre>{JSON.stringify(item.rawJson, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
