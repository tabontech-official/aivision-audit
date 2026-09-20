/**
 * Schema.org & Google Rich Results Validation Rules Catalog
 */

export interface SchemaFieldRule {
  field: string;
  label: string;
  required: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array" | "date" | "url" | "price";
  description: string;
}

export interface SchemaTypeDefinition {
  type: string;
  label: string;
  category: "Business & Organization" | "E-Commerce" | "Publishing & Content" | "Interactive & Media" | "Jobs & Events";
  richResultEligible: boolean;
  googleDocumentationUrl: string;
  requiredFields: SchemaFieldRule[];
  recommendedFields: SchemaFieldRule[];
}

export const SCHEMA_DEFINITIONS: Record<string, SchemaTypeDefinition> = {
  Organization: {
    type: "Organization",
    label: "Organization / Company",
    category: "Business & Organization",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/organization",
    requiredFields: [
      { field: "name", label: "Organization Name", required: true, type: "string", description: "The official name of the organization" },
      { field: "url", label: "Website URL", required: true, type: "url", description: "The canonical website URL of the organization" },
    ],
    recommendedFields: [
      { field: "logo", label: "Logo URL", required: false, type: "url", description: "URL of the organization's official logo image" },
      { field: "sameAs", label: "Social Profiles / sameAs", required: false, type: "array", description: "Links to official social profiles (Twitter, LinkedIn, Wikipedia, etc.)" },
      { field: "contactPoint", label: "Contact Point", required: false, type: "object", description: "Customer service telephone, email, or contact page" },
      { field: "description", label: "Description", required: false, type: "string", description: "Brief description of the organization" },
    ],
  },

  LocalBusiness: {
    type: "LocalBusiness",
    label: "Local Business / Store",
    category: "Business & Organization",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    requiredFields: [
      { field: "name", label: "Business Name", required: true, type: "string", description: "Name of the local business" },
      { field: "address", label: "Postal Address", required: true, type: "object", description: "Street address, city, region, postal code, and country" },
      { field: "telephone", label: "Phone Number", required: true, type: "string", description: "Primary contact phone number" },
    ],
    recommendedFields: [
      { field: "image", label: "Storefront / Photo", required: false, type: "url", description: "Photo of the business or storefront" },
      { field: "geo", label: "Geo Coordinates", required: false, type: "object", description: "Latitude and longitude coordinates" },
      { field: "openingHoursSpecification", label: "Opening Hours", required: false, type: "array", description: "Weekly business operating hours" },
      { field: "priceRange", label: "Price Range", required: false, type: "string", description: "Relative price indicator (e.g. $$, $$$)" },
      { field: "url", label: "Website URL", required: false, type: "url", description: "Website or local landing page URL" },
    ],
  },

  Article: {
    type: "Article",
    label: "Article / News / Blog",
    category: "Publishing & Content",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/article",
    requiredFields: [
      { field: "headline", label: "Headline / Title", required: true, type: "string", description: "The title of the article (maximum 110 characters recommended)" },
      { field: "image", label: "Article Image", required: true, type: "url", description: "High-resolution featured image URL" },
      { field: "datePublished", label: "Date Published", required: true, type: "date", description: "ISO 8601 published timestamp" },
      { field: "author", label: "Author", required: true, type: "object", description: "Author name and profile URL (Person or Organization)" },
    ],
    recommendedFields: [
      { field: "dateModified", label: "Date Modified", required: false, type: "date", description: "ISO 8601 last modified timestamp" },
      { field: "publisher", label: "Publisher", required: false, type: "object", description: "Publishing organization with name and logo" },
      { field: "description", label: "Summary Description", required: false, type: "string", description: "Short summary of the article" },
      { field: "mainEntityOfPage", label: "Canonical URL", required: false, type: "url", description: "The canonical web page URL" },
    ],
  },

  BlogPosting: {
    type: "BlogPosting",
    label: "Blog Post",
    category: "Publishing & Content",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/article",
    requiredFields: [
      { field: "headline", label: "Headline / Title", required: true, type: "string", description: "The blog post title" },
      { field: "image", label: "Featured Image", required: true, type: "url", description: "Image URL representing the blog post" },
      { field: "datePublished", label: "Date Published", required: true, type: "date", description: "ISO 8601 published date" },
      { field: "author", label: "Author", required: true, type: "object", description: "Author object (Person)" },
    ],
    recommendedFields: [
      { field: "dateModified", label: "Date Modified", required: false, type: "date", description: "ISO 8601 last updated date" },
      { field: "publisher", label: "Publisher", required: false, type: "object", description: "Publishing organization" },
      { field: "articleBody", label: "Article Body", required: false, type: "string", description: "Full text content of the blog post" },
    ],
  },

  Product: {
    type: "Product",
    label: "Product & Offers",
    category: "E-Commerce",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/product",
    requiredFields: [
      { field: "name", label: "Product Name", required: true, type: "string", description: "The name of the item or merchandise" },
      { field: "image", label: "Product Image", required: true, type: "url", description: "Clear photo of the product" },
      { field: "offers", label: "Offers / Pricing", required: true, type: "object", description: "Price, currency, and availability status" },
    ],
    recommendedFields: [
      { field: "description", label: "Description", required: false, type: "string", description: "Product description" },
      { field: "brand", label: "Brand", required: false, type: "object", description: "Brand or manufacturer name" },
      { field: "sku", label: "SKU Identifier", required: false, type: "string", description: "Stock keeping unit identifier" },
      { field: "gtin", label: "GTIN / Barcode", required: false, type: "string", description: "Global Trade Item Number (UPC, EAN, ISBN)" },
      { field: "aggregateRating", label: "Aggregate Rating", required: false, type: "object", description: "Average rating and total review count" },
      { field: "review", label: "Customer Reviews", required: false, type: "array", description: "Individual customer reviews" },
    ],
  },

  FAQPage: {
    type: "FAQPage",
    label: "FAQ Page (Questions & Answers)",
    category: "Interactive & Media",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
    requiredFields: [
      { field: "mainEntity", label: "FAQ Questions", required: true, type: "array", description: "List of Question items with acceptedAnswer objects" },
    ],
    recommendedFields: [],
  },

  BreadcrumbList: {
    type: "BreadcrumbList",
    label: "Breadcrumbs Navigation",
    category: "Publishing & Content",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb",
    requiredFields: [
      { field: "itemListElement", label: "Breadcrumb Items", required: true, type: "array", description: "Ordered list of ListItem objects with position, name, and item URL" },
    ],
    recommendedFields: [],
  },

  WebSite: {
    type: "WebSite",
    label: "WebSite & Sitelinks Searchbox",
    category: "Publishing & Content",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox",
    requiredFields: [
      { field: "name", label: "Site Name", required: true, type: "string", description: "The official name of the website" },
      { field: "url", label: "Home URL", required: true, type: "url", description: "Homepage URL" },
    ],
    recommendedFields: [
      { field: "potentialAction", label: "Search Action", required: false, type: "object", description: "SearchAction defining internal search query URL" },
      { field: "alternateName", label: "Alternate Name", required: false, type: "string", description: "Acronym or abbreviation of the website" },
    ],
  },

  SoftwareApplication: {
    type: "SoftwareApplication",
    label: "Software Application / SaaS",
    category: "Interactive & Media",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/software-app",
    requiredFields: [
      { field: "name", label: "Application Name", required: true, type: "string", description: "Name of the software or SaaS app" },
      { field: "operatingSystem", label: "Operating System", required: true, type: "string", description: "e.g. Web, Windows, macOS, iOS, Android" },
      { field: "applicationCategory", label: "Category", required: true, type: "string", description: "e.g. BusinessApplication, DeveloperApplication" },
    ],
    recommendedFields: [
      { field: "offers", label: "Pricing / Offers", required: false, type: "object", description: "Price and currency" },
      { field: "aggregateRating", label: "Ratings", required: false, type: "object", description: "User rating score and review count" },
      { field: "screenshot", label: "Screenshots", required: false, type: "url", description: "Screenshot preview URL" },
    ],
  },

  Event: {
    type: "Event",
    label: "Event & Conference",
    category: "Jobs & Events",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/event",
    requiredFields: [
      { field: "name", label: "Event Name", required: true, type: "string", description: "Title of the event" },
      { field: "startDate", label: "Start Date", required: true, type: "date", description: "ISO 8601 start date and time" },
      { field: "location", label: "Location", required: true, type: "object", description: "Place (venue name & address) or VirtualLocation (URL)" },
    ],
    recommendedFields: [
      { field: "endDate", label: "End Date", required: false, type: "date", description: "ISO 8601 end date and time" },
      { field: "description", label: "Description", required: false, type: "string", description: "Event summary description" },
      { field: "offers", label: "Tickets / Pricing", required: false, type: "object", description: "Ticket pricing and URL" },
      { field: "image", label: "Event Poster Image", required: false, type: "url", description: "Promotional banner image" },
    ],
  },

  HowTo: {
    type: "HowTo",
    label: "How-To Step-by-Step Guide",
    category: "Interactive & Media",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/how-to",
    requiredFields: [
      { field: "name", label: "Guide Title", required: true, type: "string", description: "How to perform the task" },
      { field: "step", label: "Steps", required: true, type: "array", description: "Ordered array of HowToStep objects" },
    ],
    recommendedFields: [
      { field: "image", label: "Guide Image", required: false, type: "url", description: "Hero image of the guide" },
      { field: "totalTime", label: "Total Duration", required: false, type: "string", description: "ISO 8601 duration string (e.g. PT30M)" },
      { field: "supply", label: "Supplies", required: false, type: "array", description: "Materials needed" },
      { field: "tool", label: "Tools", required: false, type: "array", description: "Tools required" },
    ],
  },

  JobPosting: {
    type: "JobPosting",
    label: "Job Posting & Career",
    category: "Jobs & Events",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/job-posting",
    requiredFields: [
      { field: "title", label: "Job Title", required: true, type: "string", description: "The role title" },
      { field: "description", label: "Job Description", required: true, type: "string", description: "Full role description HTML or text" },
      { field: "datePosted", label: "Date Posted", required: true, type: "date", description: "ISO 8601 posting date" },
      { field: "hiringOrganization", label: "Company", required: true, type: "object", description: "Organization name and website" },
      { field: "jobLocation", label: "Job Location", required: true, type: "object", description: "Physical office location or applicantLocationRequirements" },
    ],
    recommendedFields: [
      { field: "validThrough", label: "Expiration Date", required: false, type: "date", description: "ISO 8601 closing date" },
      { field: "employmentType", label: "Employment Type", required: false, type: "string", description: "FULL_TIME, PART_TIME, CONTRACTOR, INTERN" },
      { field: "baseSalary", label: "Salary Range", required: false, type: "object", description: "MonetaryAmount with currency and value/minValue/maxValue" },
    ],
  },

  Person: {
    type: "Person",
    label: "Person / Author / Founder",
    category: "Business & Organization",
    richResultEligible: true,
    googleDocumentationUrl: "https://developers.google.com/search/docs/appearance/structured-data/profile-page",
    requiredFields: [
      { field: "name", label: "Full Name", required: true, type: "string", description: "The individual's real name" },
    ],
    recommendedFields: [
      { field: "jobTitle", label: "Job Title", required: false, type: "string", description: "Professional role or occupation" },
      { field: "worksFor", label: "Company / Affiliation", required: false, type: "object", description: "Organization they work for" },
      { field: "url", label: "Profile / Personal URL", required: false, type: "url", description: "Author bio or personal homepage" },
      { field: "sameAs", label: "Social / Wiki Profiles", required: false, type: "array", description: "Authoritative external profiles (LinkedIn, Wikipedia, Twitter)" },
      { field: "image", label: "Avatar / Portrait", required: false, type: "url", description: "Headshot photo URL" },
    ],
  },
};
