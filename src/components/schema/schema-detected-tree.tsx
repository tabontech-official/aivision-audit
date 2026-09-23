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
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center font-sans">
        <Code2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-800 font-display">No Structured Data Detected</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-sans">
          No JSON-LD or Microdata blocks were found on this webpage. Use the Schema Generator tool below to create and embed structured data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs font-sans">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-900" />
            Detected Schema Items ({items.length})
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Individual structured data blocks discovered on this URL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpandedIds(new Set(items.map((i) => i.id)))}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setExpandedIds(new Set())}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
              className="border border-slate-200 rounded-[8px] overflow-hidden bg-slate-50/50"
            >
              {/* Header bar */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 cursor-pointer">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    @{item.schemaType}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-[6px] bg-slate-200/80 text-slate-700">
                    {item.format}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.hasErrors ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Errors Detected
                    </span>
                  ) : item.hasWarnings ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Warnings
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid Schema
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.id, item.rawJson);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-[8px] shadow-2xs hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JSON Code Viewer */}
              {isExpanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96 dark-scrollbar">
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
