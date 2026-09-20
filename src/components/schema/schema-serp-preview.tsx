"use client";

import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp, Globe, Smartphone, Monitor } from "lucide-react";
import { ExtractedSchemaItem } from "@/services/schema/types";

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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Google SERP Rich Results Simulation
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Visual preview of how search engines render your structured data enhancements
          </p>
        </div>

        {/* Desktop / Mobile Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              device === "desktop"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              device === "mobile"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>
      </div>

      {/* SERP Preview Box */}
      <div
        className={`bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 ${
          device === "mobile" ? "max-w-md mx-auto" : "w-full"
        }`}
      >
        {/* Favicon + Domain Breadcrumb Line */}
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1">
          <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
            {domain.charAt(0).toUpperCase()}
          </div>
          <div className="truncate font-normal flex items-center gap-1">
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{domain}</span>
            <span className="text-zinc-400">›</span>
            <span className="text-zinc-500">{breadcrumbs.join(" › ")}</span>
          </div>
        </div>

        {/* Title Link */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline leading-snug block mb-1"
        >
          {pageTitle}
        </a>

        {/* Rich Snippet Line (Ratings, Price, Stock) */}
        {(ratingValue !== null || priceStr) && (
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 mb-1.5 flex-wrap">
            {ratingValue !== null && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(ratingValue || 5) ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <span>Rating: {ratingValue.toFixed(1)}</span>
                {reviewCount && <span className="text-zinc-400">({reviewCount.toLocaleString()})</span>}
              </div>
            )}

            {priceStr && (
              <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                <span>{priceStr}</span>
                {inStock && <span className="text-emerald-600 dark:text-emerald-400">· In stock</span>}
              </div>
            )}
          </div>
        )}

        {/* Snippet Meta Description */}
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {pageDescription}
        </p>

        {/* FAQ Accordion Rich Snippet */}
        {faqs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Rich FAQ Snippets
            </div>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-white dark:bg-zinc-900"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full text-left flex items-center justify-between font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span>{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-800">
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
