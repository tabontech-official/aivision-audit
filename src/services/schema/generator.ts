import { SchemaGeneratorInput } from "./types";

/**
 * Pure JSON-LD Schema Generator producing clean, valid Schema.org markup.
 */
export function generateSchemaJsonLd(input: SchemaGeneratorInput): string {
  const payload = buildSchemaPayload(input.type, input.data);
  return JSON.stringify(payload, null, 2);
}

export function buildSchemaPayload(type: string, data: Record<string, unknown>): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
  };

  switch (type) {
    case "Organization":
      return {
        ...base,
        name: data.name || "Company Name",
        url: data.url || "https://example.com",
        ...(data.logo ? { logo: data.logo } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(Array.isArray(data.sameAs) && data.sameAs.length > 0 ? { sameAs: data.sameAs } : {}),
        ...(data.telephone || data.contactEmail
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                ...(data.telephone ? { telephone: data.telephone } : {}),
                ...(data.contactEmail ? { email: data.contactEmail } : {}),
                contactType: data.contactType || "customer support",
              },
            }
          : {}),
      };

    case "LocalBusiness":
      return {
        ...base,
        name: data.name || "Local Business Name",
        ...(data.image ? { image: data.image } : {}),
        ...(data.telephone ? { telephone: data.telephone } : {}),
        ...(data.priceRange ? { priceRange: data.priceRange } : {}),
        ...(data.url ? { url: data.url } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress: data.streetAddress || "123 Main Street",
          addressLocality: data.city || "New York",
          addressRegion: data.region || "NY",
          postalCode: data.postalCode || "10001",
          addressCountry: data.country || "US",
        },
        ...(data.latitude && data.longitude
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: Number(data.latitude),
                longitude: Number(data.longitude),
              },
            }
          : {}),
        ...(data.openingHours
          ? {
              openingHoursSpecification: Array.isArray(data.openingHours)
                ? data.openingHours
                : [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" }],
            }
          : {}),
      };

    case "Article":
      return {
        ...base,
        headline: data.headline || "Article Headline",
        image: data.image || "https://example.com/featured-image.jpg",
        datePublished: data.datePublished || new Date().toISOString(),
        dateModified: data.dateModified || new Date().toISOString(),
        author: {
          "@type": "Person",
          name: data.authorName || "Author Name",
          ...(data.authorUrl ? { url: data.authorUrl } : {}),
        },
        publisher: {
          "@type": "Organization",
          name: data.publisherName || "Publisher Name",
          ...(data.publisherLogo ? { logo: { "@type": "ImageObject", url: data.publisherLogo } } : {}),
        },
        ...(data.description ? { description: data.description } : {}),
      };

    case "Product":
      return {
        ...base,
        name: data.name || "Product Name",
        image: data.image || "https://example.com/product.jpg",
        ...(data.description ? { description: data.description } : {}),
        ...(data.sku ? { sku: data.sku } : {}),
        ...(data.brand ? { brand: { "@type": "Brand", name: data.brand } } : {}),
        offers: {
          "@type": "Offer",
          price: data.price ? Number(data.price) : 49.99,
          priceCurrency: data.priceCurrency || "USD",
          availability: data.availability || "https://schema.org/InStock",
          ...(data.url ? { url: data.url } : {}),
        },
        ...(data.ratingValue && data.reviewCount
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(data.ratingValue),
                reviewCount: Number(data.reviewCount),
                bestRating: "5",
                worstRating: "1",
              },
            }
          : {}),
      };

    case "FAQPage": {
      const qas = Array.isArray(data.questions) ? data.questions : [];
      return {
        ...base,
        mainEntity: qas.map((qa: { question?: string; answer?: string }) => ({
          "@type": "Question",
          name: qa.question || "Sample Question?",
          acceptedAnswer: {
            "@type": "Answer",
            text: qa.answer || "Sample Answer text explaining the topic.",
          },
        })),
      };
    }

    case "BreadcrumbList": {
      const items = Array.isArray(data.items) ? data.items : [];
      return {
        ...base,
        itemListElement: items.map((item: { name?: string; url?: string }, idx: number) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.name || `Page ${idx + 1}`,
          item: item.url || "https://example.com",
        })),
      };
    }

    case "WebSite":
      return {
        ...base,
        name: data.name || "Site Name",
        url: data.url || "https://example.com",
        ...(data.searchUrl
          ? {
              potentialAction: {
                "@type": "SearchAction",
                target: `${data.searchUrl}?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }
          : {}),
      };

    case "SoftwareApplication":
      return {
        ...base,
        name: data.name || "Software Name",
        operatingSystem: data.operatingSystem || "Web, Windows, macOS",
        applicationCategory: data.applicationCategory || "BusinessApplication",
        ...(data.price
          ? {
              offers: {
                "@type": "Offer",
                price: Number(data.price),
                priceCurrency: data.priceCurrency || "USD",
              },
            }
          : {}),
      };

    case "Event":
      return {
        ...base,
        name: data.name || "Event Title",
        startDate: data.startDate || new Date().toISOString(),
        ...(data.endDate ? { endDate: data.endDate } : {}),
        location: {
          "@type": "Place",
          name: data.venueName || "Conference Center",
          address: {
            "@type": "PostalAddress",
            addressLocality: data.city || "New York",
            addressCountry: data.country || "US",
          },
        },
      };

    case "HowTo": {
      const steps = Array.isArray(data.steps) ? data.steps : [];
      return {
        ...base,
        name: data.name || "How to Complete Task",
        step: steps.map((s: { title?: string; text?: string }, idx: number) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.title || `Step ${idx + 1}`,
          text: s.text || "Step description",
        })),
      };
    }

    case "Person":
      return {
        ...base,
        name: data.name || "Person Name",
        ...(data.jobTitle ? { jobTitle: data.jobTitle } : {}),
        ...(data.url ? { url: data.url } : {}),
        ...(data.image ? { image: data.image } : {}),
        ...(Array.isArray(data.sameAs) && data.sameAs.length > 0 ? { sameAs: data.sameAs } : {}),
      };

    case "JobPosting":
      return {
        ...base,
        title: data.title || "Job Title",
        description: data.description || "Job role description",
        datePosted: data.datePosted || new Date().toISOString(),
        employmentType: data.employmentType || "FULL_TIME",
        hiringOrganization: {
          "@type": "Organization",
          name: data.companyName || "Hiring Company",
          ...(data.companyUrl ? { sameAs: data.companyUrl } : {}),
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: data.city || "San Francisco",
            addressRegion: data.region || "CA",
            addressCountry: data.country || "US",
          },
        },
      };

    default:
      return base;
  }
}
