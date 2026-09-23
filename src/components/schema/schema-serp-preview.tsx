"use client";

import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp, Globe, Smartphone, Monitor } from "lucide-react";
import { ExtractedSchemaItem } from "@/services/schema/types";
import { cn } from "@/lib/utils/cn";

interface SchemaSerpPreviewProps {
  url: string;
  domain: string;
  items: ExtractedSchemaItem[];
}

export function SchemaSerpPreview({ url, domain, items }: SchemaSerpPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Extract relevant SERP preview signals from schema items
  let pageTitle = `${domain} — Official Website`;
  let pageDescription = `Discover solutions, products, and services from ${domain}. Fast, reliable, and secure.`;
  let ratingValue: number | null = null;
  let reviewCount: number | null = null;
  let priceStr: string | null = null;
  let inStock = false;
  let breadcrumbs: string[] = [domain];
  const faqs: Array<{ question: string; answer: string }> = [];

  for (const item of items) {
    const data = item.rawJson;

    // Article / Blog
    if (data["@type"] === "Article" || data["@type"] === "BlogPosting") {
      if (typeof data.headline === "string") pageTitle = data.headline;
      if (typeof data.description === "string") pageDescription = data.description;
    }

    // Product
    if (data["@type"] === "Product") {
      if (typeof data.name === "string") pageTitle = `${data.name} | ${domain}`;
      if (typeof data.description === "string") pageDescription = data.description;

      // Offers
      const offers = data.offers as Record<string, unknown> | undefined;
      if (offers) {
        if (offers.price) {
          const curr = (offers.priceCurrency as string) || "USD";
          priceStr = `${curr === "USD" ? "$" : curr + " "}${offers.price}`;
        }
        if (typeof offers.availability === "string" && offers.availability.includes("InStock")) {
          inStock = true;
        }
      }

      // AggregateRating
      const rating = data.aggregateRating as Record<string, unknown> | undefined;
      if (rating && rating.ratingValue) {
        ratingValue = Number(rating.ratingValue);
        reviewCount = Number(rating.reviewCount || rating.ratingCount || 1);
      }
    }

    // Standalone AggregateRating
    if (data["@type"] === "AggregateRating" && data.ratingValue) {
      ratingValue = Number(data.ratingValue);
      reviewCount = Number(data.reviewCount || data.ratingCount || 1);
    }

    // FAQPage
    if (data["@type"] === "FAQPage" && Array.isArray(data.mainEntity)) {
      data.mainEntity.slice(0, 3).forEach((qa: any) => {
        if (qa && qa.name && qa.acceptedAnswer?.text) {
          faqs.push({
            question: String(qa.name),
            answer: String(qa.acceptedAnswer.text),
          });
        }
      });
    }

    // BreadcrumbList
    if (data["@type"] === "BreadcrumbList" && Array.isArray(data.itemListElement)) {
      const crumbNames: string[] = [];
      data.itemListElement.forEach((elem: any) => {
        if (elem?.name) crumbNames.push(String(elem.name));
      });
      if (crumbNames.length > 0) breadcrumbs = crumbNames;
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs font-sans">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-900" />
            Google SERP Rich Results Simulation
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Visual preview of how search engines render your structured data enhancements
          </p>
        </div>

        {/* Desktop / Mobile Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              device === "desktop"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              device === "mobile"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* SERP Preview Box */}
      <div
        className={cn(
          "bg-slate-50/70 border border-slate-200 rounded-xl p-5",
          device === "mobile" ? "max-w-md mx-auto" : "w-full"
        )}
      >
        {/* Favicon + Domain Breadcrumb Line */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
          <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
            {domain.charAt(0).toUpperCase()}
          </div>
          <div className="truncate font-normal flex items-center gap-1">
            <span className="text-slate-800 font-bold">{domain}</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500">{breadcrumbs.join(" › ")}</span>
          </div>
        </div>

        {/* Title Link */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-lg font-bold text-blue-700 hover:underline leading-snug block mb-1 font-display"
        >
          {pageTitle}
        </a>

        {/* Rich Snippet Line (Ratings, Price, Stock) */}
        {(ratingValue !== null || priceStr) && (
          <div className="flex items-center gap-3 text-xs text-slate-600 mb-1.5 flex-wrap">
            {ratingValue !== null && (
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3.5 h-3.5",
                        i < Math.round(ratingValue || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      )}
                    />
                  ))}
                </div>
                <span>Rating: {ratingValue.toFixed(1)}</span>
                {reviewCount && <span className="text-slate-400 font-normal">({reviewCount.toLocaleString()})</span>}
              </div>
            )}

            {priceStr && (
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <span>{priceStr}</span>
                {inStock && <span className="text-emerald-600 font-semibold">· In stock</span>}
              </div>
            )}
          </div>
        )}

        {/* Snippet Meta Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          {pageDescription}
        </p>

        {/* FAQ Accordion Rich Snippet */}
        {faqs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
              Rich FAQ Snippets
            </div>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="text-xs border border-slate-200 rounded-[8px] p-2.5 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full text-left flex items-center justify-between font-bold text-slate-800 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <p className="mt-2 text-slate-500 text-[11px] leading-relaxed pt-2 border-t border-slate-100 font-sans">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
