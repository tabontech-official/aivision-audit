"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  Copy,
  Check,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  Calendar,
  Layers,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";
import {
  getSchemaHistoryAction,
  deleteSchemaAction,
  type SchemaItemRow,
} from "@/app/dashboard/schema/actions";
import { cn } from "@/lib/utils/cn";

interface SchemaHistoryListProps {
  onEditSchema?: (schema: SchemaItemRow) => void;
  onRefreshUsage?: () => void;
}

export function SchemaHistoryList({ onEditSchema, onRefreshUsage }: SchemaHistoryListProps) {
  const [schemas, setSchemas] = useState<SchemaItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewSchema, setPreviewSchema] = useState<SchemaItemRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getSchemaHistoryAction();
      if (res.ok && res.schemas) {
        setSchemas(res.schemas);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCopy = (id: string, jsonLd: string) => {
    navigator.clipboard.writeText(jsonLd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (schema: SchemaItemRow) => {
    const filename = `${(schema.name || schema.schemaType).toLowerCase().replace(/[^a-z0-9]/g, "-")}-schema.json`;
    const blob = new Blob([schema.jsonLd], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved schema?")) return;
    setDeletingId(id);
    try {
      const res = await deleteSchemaAction(id);
      if (res.ok) {
        setSchemas((prev) => prev.filter((s) => s.id !== id));
        if (onRefreshUsage) onRefreshUsage();
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = schemas.filter((s) => {
    const matchSearch =
      !search.trim() ||
      s.schemaType.toLowerCase().includes(search.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.pageUrl && s.pageUrl.toLowerCase().includes(search.toLowerCase()));

    const matchType = filterType === "ALL" || s.schemaType === filterType;
    return matchSearch && matchType;
  });

  const availableTypes = Array.from(new Set(schemas.map((s) => s.schemaType)));

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search saved schemas by name, URL, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types ({schemas.length})</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t} ({schemas.filter((s) => s.schemaType === t).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schemas List Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Loading saved schemas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No saved schemas found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || filterType !== "ALL"
              ? "No schemas match your filter criteria."
              : "Schemas you build using the Schema Generator will be saved here so you can reuse, edit, copy, and export them anytime."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((schema) => (
            <div
              key={schema.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-800">
                    <FileCode className="w-3 h-3" />
                    <span>{schema.schemaType}</span>
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(schema.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h4 className="mt-2.5 text-sm font-bold text-slate-900 line-clamp-1">
                  {schema.name || `${schema.schemaType} Schema`}
                </h4>

                {schema.pageUrl && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1 font-mono">
                    {schema.pageUrl}
                  </p>
                )}

                {schema.websiteDomain && (
                  <span className="mt-1.5 inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {schema.websiteDomain}
                  </span>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewSchema(schema)}
                    title="View JSON-LD"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {onEditSchema && (
                    <button
                      type="button"
                      onClick={() => onEditSchema(schema)}
                      title="Edit in Generator"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(schema)}
                    title="Download JSON"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === schema.id}
                    onClick={() => handleDelete(schema.id)}
                    title="Delete Schema"
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(schema.id, schema.jsonLd)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-black transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedId === schema.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JSON-LD Preview Modal */}
      {previewSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">
                  {previewSchema.name || `${previewSchema.schemaType} JSON-LD`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {previewSchema.schemaType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSchema(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-300 dark-scrollbar bg-slate-900/50">
              <pre>{previewSchema.jsonLd}</pre>
            </div>

            <div className="p-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDownload(previewSchema)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(previewSchema.id, previewSchema.jsonLd)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                {copiedId === previewSchema.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === previewSchema.id ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
