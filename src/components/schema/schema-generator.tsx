"use client";

import React, { useState, useMemo } from "react";
import {
  Wand2,
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { generateSchemaJsonLd } from "@/services/schema/generator";
import { SchemaGeneratorInput } from "@/services/schema/types";

export function SchemaGenerator() {
  const [selectedType, setSelectedType] = useState<SchemaGeneratorInput["type"]>("FAQPage");
  const [copied, setCopied] = useState(false);

  // Form State for each type
  const [formData, setFormData] = useState<Record<string, any>>({
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
    softName: "AuditFlow Pro",
    softOs: "Web, macOS, Windows",
    softCategory: "BusinessApplication",
    softPrice: "49.00",
  });

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Build generator input based on selected type
  const generatedJsonLd = useMemo(() => {
    let payloadData: Record<string, unknown> = {};

    switch (selectedType) {
      case "FAQPage":
        payloadData = { questions: formData.questions };
        break;
      case "Organization":
        payloadData = {
          name: formData.orgName,
          url: formData.orgUrl,
          logo: formData.orgLogo,
          description: formData.orgDescription,
          sameAs: formData.orgSameAs ? formData.orgSameAs.split("\n").filter(Boolean) : [],
        };
        break;
      case "LocalBusiness":
        payloadData = {
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
        break;
      case "Article":
        payloadData = {
          headline: formData.articleHeadline,
          image: formData.articleImage,
          authorName: formData.articleAuthor,
          publisherName: formData.articlePublisher,
          publisherLogo: formData.articlePublisherLogo,
        };
        break;
      case "Product":
        payloadData = {
          name: formData.prodName,
          image: formData.prodImage,
          price: formData.prodPrice,
          priceCurrency: formData.prodCurrency,
          sku: formData.prodSku,
          brand: formData.prodBrand,
          ratingValue: formData.prodRating,
          reviewCount: formData.prodReviews,
        };
        break;
      case "BreadcrumbList":
        payloadData = { items: formData.breadcrumbs };
        break;
      case "SoftwareApplication":
        payloadData = {
          name: formData.softName,
          operatingSystem: formData.softOs,
          applicationCategory: formData.softCategory,
          price: formData.softPrice,
        };
        break;
      default:
        payloadData = {};
    }

    return generateSchemaJsonLd({ type: selectedType, data: payloadData });
  }, [selectedType, formData]);

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

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-500" />
            Interactive Schema Generator
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Create 100% valid, Google-compliant JSON-LD structured data in seconds
          </p>
        </div>

        {/* Type Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Schema Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as SchemaGeneratorInput["type"])}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-6 space-y-4 max-h-[550px] overflow-y-auto pr-2">
          {/* FAQ FORM */}
          {selectedType === "FAQPage" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Questions & Answers</span>
                <button
                  type="button"
                  onClick={() =>
                    updateField("questions", [...formData.questions, { question: "New Question?", answer: "New Answer." }])
                  }
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              {formData.questions.map((q: any, idx: number) => (
                <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase">Question #{idx + 1}</span>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "questions",
                            formData.questions.filter((_: any, i: number) => i !== idx)
                          )
                        }
                        className="text-red-500 hover:text-red-700 text-xs"
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
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
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
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ORGANIZATION FORM */}
          {selectedType === "Organization" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Name</label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={(e) => updateField("orgName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Website URL</label>
                <input
                  type="url"
                  value={formData.orgUrl}
                  onChange={(e) => updateField("orgUrl", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Logo URL</label>
                <input
                  type="url"
                  value={formData.orgLogo}
                  onChange={(e) => updateField("orgLogo", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Social Profiles (One per line)</label>
                <textarea
                  value={formData.orgSameAs}
                  onChange={(e) => updateField("orgSameAs", e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* LOCAL BUSINESS FORM */}
          {selectedType === "LocalBusiness" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Business Name</label>
                <input
                  type="text"
                  value={formData.bizName}
                  onChange={(e) => updateField("bizName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Phone</label>
                  <input
                    type="text"
                    value={formData.bizPhone}
                    onChange={(e) => updateField("bizPhone", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Price Range</label>
                  <input
                    type="text"
                    value={formData.bizPrice}
                    onChange={(e) => updateField("bizPrice", e.target.value)}
                    placeholder="$$"
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Street Address</label>
                <input
                  type="text"
                  value={formData.bizStreet}
                  onChange={(e) => updateField("bizStreet", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">City</label>
                  <input
                    type="text"
                    value={formData.bizCity}
                    onChange={(e) => updateField("bizCity", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">State / Region</label>
                  <input
                    type="text"
                    value={formData.bizRegion}
                    onChange={(e) => updateField("bizRegion", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Zip / Postal</label>
                  <input
                    type="text"
                    value={formData.bizPostal}
                    onChange={(e) => updateField("bizPostal", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT FORM */}
          {selectedType === "Product" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Product Name</label>
                <input
                  type="text"
                  value={formData.prodName}
                  onChange={(e) => updateField("prodName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prodPrice}
                    onChange={(e) => updateField("prodPrice", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Currency</label>
                  <input
                    type="text"
                    value={formData.prodCurrency}
                    onChange={(e) => updateField("prodCurrency", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.prodRating}
                    onChange={(e) => updateField("prodRating", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Review Count</label>
                  <input
                    type="number"
                    value={formData.prodReviews}
                    onChange={(e) => updateField("prodReviews", e.target.value)}
                    className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ARTICLE FORM */}
          {selectedType === "Article" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Article Headline</label>
                <input
                  type="text"
                  value={formData.articleHeadline}
                  onChange={(e) => updateField("articleHeadline", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Author Name</label>
                <input
                  type="text"
                  value={formData.articleAuthor}
                  onChange={(e) => updateField("articleAuthor", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Publisher Name</label>
                <input
                  type="text"
                  value={formData.articlePublisher}
                  onChange={(e) => updateField("articlePublisher", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {/* BREADCRUMB FORM */}
          {selectedType === "BreadcrumbList" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Hierarchy Levels</span>
                <button
                  type="button"
                  onClick={() =>
                    updateField("breadcrumbs", [...formData.breadcrumbs, { name: "Sub Page", url: "https://example.com/sub" }])
                  }
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Level
                </button>
              </div>
              {formData.breadcrumbs.map((crumb: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-400 w-5">#{idx + 1}</span>
                  <input
                    type="text"
                    value={crumb.name}
                    onChange={(e) => {
                      const copy = [...formData.breadcrumbs];
                      copy[idx].name = e.target.value;
                      updateField("breadcrumbs", copy);
                    }}
                    placeholder="Page Name"
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-1/3"
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
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-1"
                  />
                </div>
              ))}
            </div>
          )}

          {/* SOFTWARE FORM */}
          {selectedType === "SoftwareApplication" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Software Name</label>
                <input
                  type="text"
                  value={formData.softName}
                  onChange={(e) => updateField("softName", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Supported OS</label>
                <input
                  type="text"
                  value={formData.softOs}
                  onChange={(e) => updateField("softOs", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Monthly Price ($)</label>
                <input
                  type="number"
                  value={formData.softPrice}
                  onChange={(e) => updateField("softPrice", e.target.value)}
                  className="w-full text-xs px-3 py-2 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right JSON-LD Output Column */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-zinc-950 rounded-xl p-4 border border-zinc-800 text-zinc-100">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-mono font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Valid JSON-LD Output
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Snippet"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                <Download className="w-3 h-3" />
                JSON
              </button>
            </div>
          </div>

          <div className="my-3 overflow-x-auto max-h-[380px] font-mono text-xs text-emerald-300">
            <pre>{scriptSnippet}</pre>
          </div>

          <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            Paste this code snippet directly into the <code className="text-zinc-300">&lt;head&gt;</code> section of your HTML.
          </div>
        </div>
      </div>
    </div>
  );
}
