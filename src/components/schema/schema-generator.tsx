"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Bookmark,
  Save,
  AlertTriangle,
} from "lucide-react";
import { generateSchemaJsonLd } from "@/services/schema/generator";
import { SchemaGeneratorInput } from "@/services/schema/types";
import { saveGeneratedSchemaAction } from "@/app/dashboard/schema/actions";

interface SchemaGeneratorProps {
  initialSchema?: any;
  onSaved?: (schema: any) => void;
  onRefreshUsage?: () => void;
}

export function SchemaGenerator({ initialSchema, onSaved, onRefreshUsage }: SchemaGeneratorProps = {}) {
  const [editingId, setEditingId] = useState<string | undefined>(initialSchema?.id);
  const [selectedType, setSelectedType] = useState<SchemaGeneratorInput["type"]>(initialSchema?.schemaType || "FAQPage");
  const [copied, setCopied] = useState(false);
  const [schemaName, setSchemaName] = useState(initialSchema?.name || "");
  const [pageUrl, setPageUrl] = useState(initialSchema?.pageUrl || "");
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: "success" | "error"; message: string; upgradeRequired?: boolean } | null>(null);

  // Form State for each type
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (initialSchema?.formData) {
      return initialSchema.formData;
    }
    return {
      // FAQ State
      questions: [
        { question: "What services do you offer?", answer: "We provide full-service web development, SEO audits, and AI solutions." },
        { question: "How long does an audit take?", answer: "Our automated audits complete in under 60 seconds with instant reports." },
      ],
      // Organization State
      orgName: "Acme Corp",
      orgUrl: "https://example.com",
      orgLogo: "https://example.com/logo.png",
      orgDescription: "Leading provider of digital solutions.",
      orgSameAs: "https://twitter.com/acmecorp\nhttps://linkedin.com/company/acmecorp",
      // LocalBusiness State
      bizName: "Acme Dental Clinic",
      bizPhone: "+1-212-555-0199",
      bizStreet: "123 Madison Ave",
      bizCity: "New York",
      bizRegion: "NY",
      bizPostal: "10001",
      bizCountry: "US",
      bizPrice: "$$",
      bizImage: "https://example.com/storefront.jpg",
      // Article State
      articleHeadline: "10 Proven Ways to Improve Your Search Rankings",
      articleImage: "https://example.com/blog-header.jpg",
      articleAuthor: "Sarah Jenkins",
      articlePublisher: "Tech Insider",
      articlePublisherLogo: "https://example.com/publisher-logo.png",
      // Product State
      prodName: "Wireless Noise-Canceling Headphones",
      prodImage: "https://example.com/headphones.jpg",
      prodPrice: "199.99",
      prodCurrency: "USD",
      prodSku: "HDPHN-001",
      prodBrand: "AcousticTech",
      prodRating: "4.8",
      prodReviews: "142",
      // Breadcrumb State
      breadcrumbs: [
        { name: "Home", url: "https://example.com" },
        { name: "Products", url: "https://example.com/products" },
        { name: "Headphones", url: "https://example.com/products/headphones" },
      ],
      // Software State
      softName: "AI Vision Audit Pro",
      softOs: "Web, macOS, Windows",
      softCategory: "BusinessApplication",
      softPrice: "49.00",
    };
  });

  // Re-sync if initialSchema changes
  React.useEffect(() => {
    if (initialSchema) {
      setEditingId(initialSchema.id);
      setSelectedType(initialSchema.schemaType || "FAQPage");
      setSchemaName(initialSchema.name || "");
      setPageUrl(initialSchema.pageUrl || "");
      if (initialSchema.formData) {
        setFormData(initialSchema.formData);
      }
    }
  }, [initialSchema]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const currentPayload = useMemo(() => {
    switch (selectedType) {
      case "FAQPage":
        return { questions: formData.questions };
      case "Organization":
        return {
          name: formData.orgName,
          url: formData.orgUrl,
          logo: formData.orgLogo,
          description: formData.orgDescription,
          sameAs: formData.orgSameAs ? formData.orgSameAs.split("\n").filter(Boolean) : [],
        };
      case "LocalBusiness":
        return {
          name: formData.bizName,
          telephone: formData.bizPhone,
          streetAddress: formData.bizStreet,
          city: formData.bizCity,
          region: formData.bizRegion,
          postalCode: formData.bizPostal,
          country: formData.bizCountry,
          priceRange: formData.bizPrice,
          image: formData.bizImage,
        };
      case "Article":
        return {
          headline: formData.articleHeadline,
          image: formData.articleImage,
          authorName: formData.articleAuthor,
          publisherName: formData.articlePublisher,
          publisherLogo: formData.articlePublisherLogo,
        };
      case "Product":
        return {
          name: formData.prodName,
          image: formData.prodImage,
          price: formData.prodPrice,
          priceCurrency: formData.prodCurrency,
          sku: formData.prodSku,
          brand: formData.prodBrand,
          ratingValue: formData.prodRating,
          reviewCount: formData.prodReviews,
        };
      case "BreadcrumbList":
        return { items: formData.breadcrumbs };
      case "SoftwareApplication":
        return {
          name: formData.softName,
          operatingSystem: formData.softOs,
          applicationCategory: formData.softCategory,
          price: formData.softPrice,
        };
      default:
        return {};
    }
  }, [selectedType, formData]);

  // Build generator input based on selected type
  const generatedJsonLd = useMemo(() => {
    return generateSchemaJsonLd({ type: selectedType, data: currentPayload });
  }, [selectedType, currentPayload]);

  const scriptSnippet = `<script type="application/ld+json">\n${generatedJsonLd}\n</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptSnippet], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType.toLowerCase()}-schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveNotice(null);
    try {
      const res = await saveGeneratedSchemaAction({
        id: editingId,
        schemaType: selectedType,
        name: schemaName.trim() || undefined,
        pageUrl: pageUrl.trim() || undefined,
        data: currentPayload,
      });

      if (!res.ok) {
        setSaveNotice({
          type: "error",
          message: res.error || "Failed to save schema.",
          upgradeRequired: res.upgradeRequired,
        });
      } else {
        if (res.schemaId) {
          setEditingId(res.schemaId);
        }
        setSaveNotice({
          type: "success",
          message: editingId ? "Schema updated successfully!" : "Schema saved to your library!",
        });
        if (onSaved) {
          onSaved({
            id: res.schemaId || editingId,
            schemaType: selectedType,
            name: schemaName.trim() || `${selectedType} Schema`,
            pageUrl: pageUrl.trim() || null,
            jsonLd: generatedJsonLd,
            formData: currentPayload,
          });
        }
        if (onRefreshUsage) {
          onRefreshUsage();
        }
      }
    } catch (err: unknown) {
      setSaveNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save schema.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs font-lazzer space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-900" />
            Interactive Schema Generator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create 100% valid, Google-compliant JSON-LD structured data in seconds
          </p>
        </div>

        {/* Type Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Schema Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as SchemaGeneratorInput["type"])}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:border-slate-500 cursor-pointer shadow-2xs"
          >
            <option value="FAQPage">FAQ Page</option>
            <option value="Organization">Organization / Company</option>
            <option value="LocalBusiness">Local Business / Store</option>
            <option value="Product">Product & Offers</option>
            <option value="Article">Article / Blog Post</option>
            <option value="BreadcrumbList">Breadcrumb Navigation</option>
            <option value="SoftwareApplication">Software / SaaS App</option>
          </select>
        </div>
      </div>

      {/* Save / Library Metadata Bar */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            placeholder="Schema Title (e.g., Homepage FAQ or Main Org)"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            className="flex-1 min-w-[180px] text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
          <input
            type="url"
            placeholder="Target Page URL (Optional)"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            className="flex-1 min-w-[180px] text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? "Saving..." : editingId ? "Update Saved Schema" : "Save to Library"}</span>
        </button>
      </div>

      {saveNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 font-medium ${
            saveNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {saveNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveNotice.message}</span>
          </div>
          {saveNotice.upgradeRequired && (
            <a
              href="/dashboard/billing"
              className="text-xs font-bold underline hover:no-underline text-rose-900 shrink-0"
            >
              Upgrade Plan &rarr;
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-6 space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
          {/* FAQ FORM */}
          {selectedType === "FAQPage" && (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700">Questions & Answers</span>
              </div>

              {formData.questions.map((q: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Question #{idx + 1}</span>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "questions",
                            formData.questions.filter((_: any, i: number) => i !== idx)
                          )
                        }
                        className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer p-1 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => {
                      const copy = [...formData.questions];
                      copy[idx].question = e.target.value;
                      updateField("questions", copy);
                    }}
                    placeholder="Enter question"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                  <textarea
                    value={q.answer}
                    onChange={(e) => {
                      const copy = [...formData.questions];
                      copy[idx].answer = e.target.value;
                      updateField("questions", copy);
                    }}
                    placeholder="Enter answer"
                    rows={2}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              ))}

              {/* Add Question Button Below */}
              <button
                type="button"
                onClick={() =>
                  updateField("questions", [...formData.questions, { question: "New Question?", answer: "New Answer." }])
                }
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          )}

          {/* ORGANIZATION FORM */}
          {selectedType === "Organization" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Company Name</label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={(e) => updateField("orgName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Website URL</label>
                <input
                  type="url"
                  value={formData.orgUrl}
                  onChange={(e) => updateField("orgUrl", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Logo URL</label>
                <input
                  type="url"
                  value={formData.orgLogo}
                  onChange={(e) => updateField("orgLogo", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Social Profiles (One per line)</label>
                <textarea
                  value={formData.orgSameAs}
                  onChange={(e) => updateField("orgSameAs", e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}

          {/* LOCAL BUSINESS FORM */}
          {selectedType === "LocalBusiness" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Business Name</label>
                <input
                  type="text"
                  value={formData.bizName}
                  onChange={(e) => updateField("bizName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={formData.bizPhone}
                    onChange={(e) => updateField("bizPhone", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Price Range</label>
                  <input
                    type="text"
                    value={formData.bizPrice}
                    onChange={(e) => updateField("bizPrice", e.target.value)}
                    placeholder="$$"
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Street Address</label>
                <input
                  type="text"
                  value={formData.bizStreet}
                  onChange={(e) => updateField("bizStreet", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    value={formData.bizCity}
                    onChange={(e) => updateField("bizCity", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">State / Region</label>
                  <input
                    type="text"
                    value={formData.bizRegion}
                    onChange={(e) => updateField("bizRegion", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Zip / Postal</label>
                  <input
                    type="text"
                    value={formData.bizPostal}
                    onChange={(e) => updateField("bizPostal", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT FORM */}
          {selectedType === "Product" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Product Name</label>
                <input
                  type="text"
                  value={formData.prodName}
                  onChange={(e) => updateField("prodName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prodPrice}
                    onChange={(e) => updateField("prodPrice", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Currency</label>
                  <input
                    type="text"
                    value={formData.prodCurrency}
                    onChange={(e) => updateField("prodCurrency", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.prodRating}
                    onChange={(e) => updateField("prodRating", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Review Count</label>
                  <input
                    type="number"
                    value={formData.prodReviews}
                    onChange={(e) => updateField("prodReviews", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ARTICLE FORM */}
          {selectedType === "Article" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Article Headline</label>
                <input
                  type="text"
                  value={formData.articleHeadline}
                  onChange={(e) => updateField("articleHeadline", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Author Name</label>
                <input
                  type="text"
                  value={formData.articleAuthor}
                  onChange={(e) => updateField("articleAuthor", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Publisher Name</label>
                <input
                  type="text"
                  value={formData.articlePublisher}
                  onChange={(e) => updateField("articlePublisher", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}

          {/* BREADCRUMB FORM */}
          {selectedType === "BreadcrumbList" && (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700">Hierarchy Levels</span>
              </div>
              {formData.breadcrumbs.map((crumb: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
                  <input
                    type="text"
                    value={crumb.name}
                    onChange={(e) => {
                      const copy = [...formData.breadcrumbs];
                      copy[idx].name = e.target.value;
                      updateField("breadcrumbs", copy);
                    }}
                    placeholder="Page Name"
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white w-1/3 text-slate-900"
                  />
                  <input
                    type="url"
                    value={crumb.url}
                    onChange={(e) => {
                      const copy = [...formData.breadcrumbs];
                      copy[idx].url = e.target.value;
                      updateField("breadcrumbs", copy);
                    }}
                    placeholder="https://example.com/page"
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white flex-1 text-slate-900"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  updateField("breadcrumbs", [...formData.breadcrumbs, { name: "Sub Page", url: "https://example.com/sub" }])
                }
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Level</span>
              </button>
            </div>
          )}

          {/* SOFTWARE FORM */}
          {selectedType === "SoftwareApplication" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Software Name</label>
                <input
                  type="text"
                  value={formData.softName}
                  onChange={(e) => updateField("softName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Supported OS</label>
                <input
                  type="text"
                  value={formData.softOs}
                  onChange={(e) => updateField("softOs", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Monthly Price ($)</label>
                <input
                  type="number"
                  value={formData.softPrice}
                  onChange={(e) => updateField("softPrice", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right JSON-LD Output Column */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-slate-950 rounded-2xl p-4 border border-slate-800 text-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Valid JSON-LD Output
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer shadow-2xs border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy Snippet"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          <div className="my-3 overflow-x-auto max-h-[380px] font-mono text-xs text-emerald-300 dark-scrollbar pb-1">
            <pre>{scriptSnippet}</pre>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Paste this code snippet directly into the <code className="text-slate-200 font-mono">&lt;head&gt;</code> section of your HTML.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
