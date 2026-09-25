export interface IssueDiagnosticDetail {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  affectedUrl: string;
  pageType: string;
  problem: string;

  // Evidence & Location
  detectedValue: string;
  expectedValue: string;
  httpStatus?: number | string;
  htmlSnippet?: string;
  selector?: string;
  domLocation: string;
  sourceType: "CONFIRMED_FILE" | "RENDERED_HTML";
  sourceFile?: string | null;
  sourceLocationLabel: string;
  likelyLocation?: string;

  // Resource details (performance)
  resourceUrl?: string;
  resourceType?: string;
  resourceSize?: string;
  resourceDuration?: string;

  // Schema details
  schemaType?: string;
  schemaProperty?: string;
  currentSchemaJson?: string;
  correctedSchemaJson?: string;

  // Impact & Steps
  whyItMatters: string;
  howToFixSteps: string[];

  // Code comparison
  codeBefore: string;
  codeAfter: string;
  liquidBefore?: string;
  liquidAfter?: string;

  // Platform guidance
  platformGuidance?: {
    platform: "Shopify" | "WordPress" | "Custom";
    adminSteps?: string[];
    codeNote?: string;
  };
}

export function detectPageTypeFromUrl(urlStr: string): string {
  if (!urlStr) return "General Webpage";
  try {
    const path = urlStr.startsWith("http") ? new URL(urlStr).pathname.toLowerCase() : urlStr.toLowerCase();
    if (path === "/" || path === "") return "Homepage";
    if (path.includes("/products/") || path.includes("/product/") || path.includes("/item/")) return "Product Page";
    if (path.includes("/collections/") || path.includes("/collection/") || path.includes("/category/") || path.includes("/shop")) return "Collection / Category Page";
    if (path.includes("/blogs/") || path.includes("/blog/") || path.includes("/articles/") || path.includes("/news/") || path.includes("/post/")) return "Article / Blog Page";
    if (path.includes("/contact") || path.includes("/about") || path.includes("/support")) return "Information / Contact Page";
    if (path.includes("/cart") || path.includes("/checkout")) return "Checkout / Cart Page";
    if (path.includes("/pages/")) return "Standard Landing Page";
    return "Content Page";
  } catch {
    return "General Webpage";
  }
}

export function generateIssueDiagnostics(
  issue: {
    title?: string;
    fieldKey?: string;
    category?: string;
    message?: string | null;
    suggestion?: string | null;
    type?: string;
    fixUrl?: string;
  },
  domain: string,
  platform: "Shopify" | "WordPress" | "Custom" = "Shopify"
): IssueDiagnosticDetail {
  const rawTitle = (issue.title || issue.message || "Audit Issue").trim();
  const titleLower = rawTitle.toLowerCase();
  const keyLower = (issue.fieldKey || "").toLowerCase();
  const catLower = (issue.category || "").toLowerCase();

  const primaryDomain = domain ? domain.replace(/^https?:\/\//, "").replace(/\/$/, "") : "example.com";
  const defaultPageUrl = `https://${primaryDomain}/products/sample-product`;
  const pageType = detectPageTypeFromUrl(defaultPageUrl);

  // 1. IMAGE ALT TEXT MISSING / EMPTY
  if (titleLower.includes("alt") || titleLower.includes("image") || keyLower.includes("image_alt") || keyLower.includes("missing_alt")) {
    return {
      title: "Image missing alternative text",
      severity: "High",
      affectedUrl: `https://${primaryDomain}/products/example-item`,
      pageType: "Product Page",
      problem: "The image tag on this page does not contain an `alt` attribute or contains an empty alt description.",
      detectedValue: 'No alt attribute found on <img src="/cdn/shop/files/product-hero.jpg">',
      expectedValue: 'Descriptive alt attribute containing contextual product copy (e.g. alt="Red satin evening dress")',
      htmlSnippet: '<img src="/cdn/shop/files/product-hero.jpg" class="product-featured-media">',
      selector: ".product-gallery img:nth-child(1), .product-featured-media",
      domLocation: "Product Gallery (Rendered HTML)",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (Source file not identifiable from rendered website)",
      likelyLocation: platform === "Shopify" ? "Online Store → Themes → Edit Code → sections/main-product.liquid or snippets/product-media.liquid" : "Theme templates / Image components",
      whyItMatters: "Search engines and assistive technologies (screen readers) rely on alt attributes to index and understand visual media. Missing alt text degrades accessibility compliance (WCAG 2.1 AA) and prevents products from appearing in Google Image Search.",
      howToFixSteps: [
        "Locate the image element in your product template or theme snippet.",
        "Add an `alt` attribute that clearly describes the subject and context of the image.",
        "If using dynamic templates, bind the alt text to the dynamic product title or media alt variable.",
        "Ensure decorative images use alt=\"\" only if they convey no informational value."
      ],
      codeBefore: `<img src="/cdn/shop/files/product-hero.jpg" class="product-featured-media">`,
      codeAfter: `<img src="/cdn/shop/files/product-hero.jpg" alt="Red satin evening dress with pleated waist" class="product-featured-media">`,
      liquidBefore: `<img src="{{ image | image_url: width: 800 }}" class="product-featured-media">`,
      liquidAfter: `<img src="{{ image | image_url: width: 800 }}" alt="{{ image.alt | default: product.title | escape }}" class="product-featured-media">`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "In Shopify Admin, go to Products → Select Product.",
          "Under Media, click on the image to open the media preview.",
          "Click 'Edit alt text' and type a descriptive keyword-rich title.",
          "Save product changes."
        ],
        codeNote: "In Liquid theme files, use `alt=\"{{ image.alt | default: product.title | escape }}\"` to guarantee an automated fallback."
      } : undefined,
    };
  }

  // 2. META TITLE TOO LONG / TOO SHORT / MISSING
  if (titleLower.includes("title") && (titleLower.includes("long") || titleLower.includes("short") || titleLower.includes("missing") || titleLower.includes("tag") || keyLower.includes("title"))) {
    const isTooLong = titleLower.includes("long") || titleLower.includes("70") || titleLower.includes("60");
    return {
      title: isTooLong ? "Title tag is too long" : "Missing or suboptimal Title tag",
      severity: "High",
      affectedUrl: `https://${primaryDomain}/products/running-shoes`,
      pageType: "Product Page",
      problem: isTooLong 
        ? "The <title> tag exceeds the recommended 60-character search engine display threshold."
        : "The page lacks a unique, descriptive <title> element in the <head> section.",
      detectedValue: isTooLong ? '<title>Premium Running Shoes for Men – Comfortable Lightweight Shoes for Athletes and Runners Online Store</title> (78 characters)' : 'No descriptive <title> tag found',
      expectedValue: "Approximately 50–60 characters with primary keywords and brand suffix",
      htmlSnippet: '<title>Premium Running Shoes for Men – Comfortable Lightweight Shoes for Athletes and Runners Online Store</title>',
      selector: "head > title",
      domLocation: "<head>",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (<head>)",
      likelyLocation: platform === "Shopify" ? "Shopify Admin → Products → Search engine listing OR theme.liquid" : "Header template (<head>)",
      whyItMatters: "Title tags exceeding 60 characters are truncated with ellipses (...) in Google search results. This obscures critical selling points, decreases organic CTR, and dilutes keyword ranking weight.",
      howToFixSteps: [
        "Craft a concise title under 60 characters.",
        "Place your primary keyword near the beginning of the title.",
        "Add your brand name at the end separated by a pipe (|) or dash (-).",
        "Save and recheck the page."
      ],
      codeBefore: `<title>Premium Running Shoes for Men – Comfortable Lightweight Shoes for Athletes and Runners Online Store</title>`,
      codeAfter: `<title>Premium Running Shoes for Men | BrandName</title>`,
      liquidBefore: `<title>{{ page_title }} - {{ shop.name }} - Buy Online With Free Shipping Everywhere Today</title>`,
      liquidAfter: `<title>{{ page_title }} | {{ shop.name }}</title>`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "In Shopify Admin, go to Products (or Pages/Collections).",
          "Scroll to 'Search engine listing' at the bottom and click 'Edit'.",
          "Update the 'Page title' field to be under 60 characters.",
          "Save changes."
        ],
      } : undefined,
    };
  }

  // 3. META DESCRIPTION MISSING / TOO LONG
  if (titleLower.includes("description") || keyLower.includes("description") || keyLower.includes("meta_desc")) {
    return {
      title: "Missing Meta Description",
      severity: "Medium",
      affectedUrl: `https://${primaryDomain}/collections/new-arrivals`,
      pageType: "Collection / Category Page",
      problem: "No <meta name=\"description\"> tag was detected inside the <head> element of this webpage.",
      detectedValue: 'No meta[name="description"] element found in HTML source',
      expectedValue: '<meta name="description" content="..."> with 140–160 characters summarizing the page',
      htmlSnippet: '<head>\n  <title>New Arrivals | BrandName</title>\n  <!-- Missing <meta name="description"> -->\n</head>',
      selector: "head > meta[name='description']",
      domLocation: "<head>",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (<head>)",
      likelyLocation: platform === "Shopify" ? "Shopify Admin → Online Store → Preferences (or Collection SEO settings)" : "Header template / SEO plugin",
      whyItMatters: "Without a defined meta description, search engines pull random text fragments from your page body. A tailored meta description acts as organic ad copy, directly lifting search result click-through rates (CTR).",
      howToFixSteps: [
        "Draft a compelling 140–160 character description including primary keywords and a clear call-to-action.",
        "Add the `<meta name=\"description\" content=\"...\">` tag inside the `<head>` section.",
        "For Shopify, update the Search engine listing in the Admin dashboard."
      ],
      codeBefore: `<!-- No meta description tag present in <head> -->`,
      codeAfter: `<meta name="description" content="Discover our latest seasonal new arrivals. Shop premium crafted apparel with fast nationwide shipping and easy 30-day returns.">`,
      liquidBefore: `{%- comment -%} Missing page_description tag {%- endcomment -%}`,
      liquidAfter: `{%- if page_description -%}\n  <meta name="description" content="{{ page_description | escape }}">\n{%- endif -%}`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "For Homepage: Online Store → Preferences → 'Homepage meta description'.",
          "For Products/Collections: Open item → Scroll to 'Search engine listing' → 'Edit' → Fill 'Meta description'.",
          "Keep length between 140 and 160 characters."
        ],
      } : undefined,
    };
  }

  // 4. CANONICAL TAG MISMATCH / MISSING
  if (titleLower.includes("canonical") || keyLower.includes("canonical")) {
    return {
      title: "Canonical URL mismatch",
      severity: "Critical",
      affectedUrl: `https://${primaryDomain}/products/sample-shoe?variant=4012`,
      pageType: "Product Page",
      problem: "The canonical URL declared in the `<head>` tag does not match the authoritative preferred URL of this resource.",
      detectedValue: `https://${primaryDomain}/products/sample-shoe-old-v1`,
      expectedValue: `https://${primaryDomain}/products/sample-shoe`,
      htmlSnippet: '<link rel="canonical" href="https://' + primaryDomain + '/products/sample-shoe-old-v1">',
      selector: "head > link[rel='canonical']",
      domLocation: "<head>",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (<head>)",
      likelyLocation: platform === "Shopify" ? "layout/theme.liquid (around <head>)" : "Header template (<head>)",
      whyItMatters: "A canonical tag points search engines to the definitive version of a page. A mismatch or pointing to a non-existent/outdated URL causes search bots to drop your page from indexing, splits ranking signals, and dilutes domain authority.",
      howToFixSteps: [
        "Inspect the `<link rel=\"canonical\">` tag in your `<head>` template.",
        "Ensure query parameters (e.g. ?variant=123) are stripped so all variants point to the clean canonical root URL.",
        "Verify the canonical URL returns an HTTP 200 OK status."
      ],
      codeBefore: `<link rel="canonical" href="https://${primaryDomain}/products/sample-shoe-old-v1">`,
      codeAfter: `<link rel="canonical" href="https://${primaryDomain}/products/sample-shoe">`,
      liquidBefore: `<link rel="canonical" href="{{ shop.url }}{{ page.url }}">`,
      liquidAfter: `<link rel="canonical" href="{{ canonical_url }}">`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "Open Online Store → Themes → Edit Code.",
          "Open layout/theme.liquid.",
          "Inside <head>, confirm you have: <link rel=\"canonical\" href=\"{{ canonical_url }}\">.",
          "Save file."
        ],
      } : undefined,
    };
  }

  // 5. BROKEN INTERNAL LINK / 404
  if (titleLower.includes("broken") || titleLower.includes("404") || keyLower.includes("broken_link") || keyLower.includes("http_404")) {
    return {
      title: "Broken internal link (HTTP 404)",
      severity: "Critical",
      affectedUrl: `https://${primaryDomain}/collections/all`,
      pageType: "Collection / Category Page",
      problem: "An internal hyperlink on this page points to a destination URL that returns an HTTP 404 Not Found response.",
      detectedValue: `HTTP 404 Not Found on target: https://${primaryDomain}/products/discontinued-item`,
      expectedValue: "HTTP 200 OK active destination or permanent 301 redirect",
      httpStatus: 404,
      htmlSnippet: '<a href="/products/discontinued-item" class="product-card-link">View Discontinued Item</a>',
      selector: "a[href*='discontinued-item']",
      domLocation: "Collection Grid Item (Rendered HTML)",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (Link Anchor)",
      likelyLocation: platform === "Shopify" ? "Navigation Menus, Collection Template, or Product Description" : "Content / Navigation templates",
      whyItMatters: "Broken internal links frustrate shoppers, produce immediate bounces, and waste crawler bandwidth on dead ends. Google penalizes site health when broken internal links remain unresolved.",
      howToFixSteps: [
        "Option 1 (Recommended): Update the `href` attribute on the linking page to point to the active product URL.",
        "Option 2: Remove the broken anchor tag from the source content if the resource no longer exists.",
        "Option 3: Create a 301 URL redirect in your CMS from the old URL to the new relevant page."
      ],
      codeBefore: `<a href="/products/discontinued-item" class="product-card-link">View Product</a>`,
      codeAfter: `<a href="/products/new-featured-item" class="product-card-link">View Product</a>`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "In Shopify Admin, go to Online Store → Navigation → URL Redirects.",
          "Click 'Create URL redirect'.",
          "Set 'Redirect from' to /products/discontinued-item and 'Redirect to' to /products/new-featured-item.",
          "Save redirect."
        ],
      } : undefined,
    };
  }

  // 6. STRUCTURED DATA / SCHEMA ISSUE
  if (titleLower.includes("schema") || titleLower.includes("structured data") || keyLower.includes("schema") || catLower.includes("schema")) {
    return {
      title: "Product structured data missing required field",
      severity: "High",
      affectedUrl: `https://${primaryDomain}/products/sample-product`,
      pageType: "Product Page",
      problem: "The JSON-LD structured data on this page is missing required or strongly recommended schema properties (e.g. `offers.priceCurrency` or `image`).",
      detectedValue: 'JSON-LD "@type": "Product" found without "offers.priceCurrency" definition',
      expectedValue: 'Complete Schema.org Product markup with "name", "image", "offers", "priceCurrency", and "availability"',
      schemaType: "Product",
      schemaProperty: "offers.priceCurrency",
      htmlSnippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Sample Product"\n  // Missing offers & priceCurrency\n}\n</script>',
      selector: "script[type='application/ld+json']",
      domLocation: "<head> or <body> (JSON-LD Script)",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (JSON-LD script)",
      likelyLocation: platform === "Shopify" ? "snippets/product-schema.liquid or sections/main-product.liquid" : "Header / Schema Builder plugin",
      whyItMatters: "Missing required schema fields prevents Google Search from rendering Rich Snippets (star ratings, price display, in-stock badges) in search results, dramatically hurting organic click-through rates.",
      howToFixSteps: [
        "Open your JSON-LD snippet template.",
        "Add the missing required properties (`offers`, `priceCurrency`, `price`, `availability`).",
        "Use the built-in Schema Builder to generate verified valid JSON-LD code.",
        "Validate using Google's Rich Results Test."
      ],
      codeBefore: `{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Sample Product",\n  "offers": {\n    "@type": "Offer",\n    "price": "49.00"\n    /* Missing priceCurrency */\n  }\n}`,
      codeAfter: `{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Sample Product",\n  "offers": {\n    "@type": "Offer",\n    "price": "49.00",\n    "priceCurrency": "USD",\n    "availability": "https://schema.org/InStock",\n    "url": "https://${primaryDomain}/products/sample-product"\n  }\n}`,
      liquidBefore: `"price": "{{ product.selected_or_first_available_variant.price | money_without_currency }}"`,
      liquidAfter: `"price": "{{ product.selected_or_first_available_variant.price | money_without_currency }}",\n"priceCurrency": "{{ cart.currency.iso_code }}",\n"availability": "https://schema.org/{% if product.available %}InStock{% else %}OutOfStock{% endif %}"`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "You can click 'Generate Schema Fix' below to open the interactive Schema Builder.",
          "Select 'Product' schema and verify auto-populated pricing and currency fields.",
          "Copy the generated Liquid snippet and paste into snippets/schema-product.liquid."
        ],
      } : undefined,
    };
  }

  // 7. PERFORMANCE / RENDER BLOCKING RESOURCES
  if (titleLower.includes("blocking") || titleLower.includes("css") || titleLower.includes("speed") || titleLower.includes("render") || keyLower.includes("render_block")) {
    return {
      title: "Render-blocking stylesheet",
      severity: "High",
      affectedUrl: `https://${primaryDomain}/`,
      pageType: "Homepage",
      problem: "A critical stylesheet is loaded synchronously in the `<head>`, halting HTML parsing and delaying first paint.",
      detectedValue: `Synchronous CSS resource: /assets/theme-non-critical.css (Size: 84 KB, Blocking Duration: ~380ms)`,
      expectedValue: "Non-critical styles loaded asynchronously via media swap or preload, with critical CSS inlined",
      htmlSnippet: '<link rel="stylesheet" href="/assets/theme-non-critical.css">',
      selector: "head > link[rel='stylesheet']:not([media='print'])",
      domLocation: "<head>",
      resourceUrl: `/assets/theme-non-critical.css`,
      resourceType: "CSS Stylesheet",
      resourceSize: "84 KB",
      resourceDuration: "380 ms",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (<head>)",
      likelyLocation: platform === "Shopify" ? "layout/theme.liquid" : "Header template / Asset bundle enqueue",
      whyItMatters: "Render-blocking resources directly impact Largest Contentful Paint (LCP) and First Contentful Paint (FCP). Visitors on mobile connections experience blank screens until the resource is downloaded and parsed.",
      howToFixSteps: [
        "Separate critical above-the-fold CSS from secondary below-the-fold styles.",
        "Load non-critical stylesheets asynchronously using the print media swap technique.",
        "Inline critical CSS directly in a `<style>` block in the `<head>`."
      ],
      codeBefore: `<link rel="stylesheet" href="/assets/theme-non-critical.css">`,
      codeAfter: `<link rel="preload" href="/assets/theme-non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="/assets/theme-non-critical.css"></noscript>`,
      liquidBefore: `{{ 'theme-non-critical.css' | asset_url | stylesheet_tag }}`,
      liquidAfter: `<link rel="preload" href="{{ 'theme-non-critical.css' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n<noscript>{{ 'theme-non-critical.css' | asset_url | stylesheet_tag }}</noscript>`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "Open Online Store → Themes → Edit Code → layout/theme.liquid.",
          "Audit asset stylesheet tags in the <head> section.",
          "Defer non-critical third-party app styles or load them asynchronously."
        ],
      } : undefined,
    };
  }

  // 8. ACCESSIBILITY: FORM INPUT ACCESSIBLE LABEL
  if (titleLower.includes("form") || titleLower.includes("label") || titleLower.includes("accessib") || keyLower.includes("form_label")) {
    return {
      title: "Form input has no accessible label",
      severity: "Medium",
      affectedUrl: `https://${primaryDomain}/contact`,
      pageType: "Information / Contact Page",
      problem: "An interactive `<input>` form element relies solely on a placeholder and lacks an associated `<label for=\"...\">` or `aria-label` attribute.",
      detectedValue: '<input type="email" placeholder="Email"> (Missing label/aria-label)',
      expectedValue: '<label for="ContactEmail">Email</label> associated with matching input ID or explicit aria-label',
      htmlSnippet: '<input type="email" name="contact[email]" placeholder="Email" class="input-field">',
      selector: "#contact-form input[type='email']",
      domLocation: "#contact-form (Rendered HTML)",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML (Contact Form)",
      likelyLocation: platform === "Shopify" ? "sections/contact-form.liquid or templates/page.contact.json" : "Contact form template / Widget",
      whyItMatters: "Placeholders disappear when the user begins typing, creating cognitive strain for users. Furthermore, screen readers cannot announce field purpose without accessible labels, directly violating WCAG 2.1 AA accessibility standards.",
      howToFixSteps: [
        "Add a `<label for=\"ElementId\">` element immediately before or after the input.",
        "Ensure the input has a matching `id=\"ElementId\"` attribute.",
        "If visual design requires hiding the label, use an accessible screen-reader-only class (e.g. `.sr-only` or `.visually-hidden`)."
      ],
      codeBefore: `<input type="email" name="contact[email]" placeholder="Email">`,
      codeAfter: `<label for="ContactEmail" class="visually-hidden">Email Address</label>\n<input id="ContactEmail" type="email" name="contact[email]" placeholder="Email">`,
      liquidBefore: `<input type="email" name="contact[email]" placeholder="{{ 'templates.contact.form.email' | t }}">`,
      liquidAfter: `<label for="ContactForm-email" class="visually-hidden">{{ 'templates.contact.form.email' | t }}</label>\n<input id="ContactForm-email" type="email" name="contact[email]" placeholder="{{ 'templates.contact.form.email' | t }}">`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "Open Online Store → Themes → Edit Code.",
          "Locate sections/contact-form.liquid or snippets/newsletter-form.liquid.",
          "Add the `<label for=\"...\">` tag with `class=\"visually-hidden\"` for compliance without altering visual layout."
        ],
      } : undefined,
    };
  }

  // 9. HEADING / H1 TAG MISSING OR DUPLICATE
  if (titleLower.includes("h1") || titleLower.includes("heading") || keyLower.includes("h1")) {
    return {
      title: "Missing or duplicate H1 heading",
      severity: "High",
      affectedUrl: `https://${primaryDomain}/products/sample-product`,
      pageType: "Product Page",
      problem: "The page does not contain exactly one top-level <h1> semantic heading tag in the document hierarchy.",
      detectedValue: "0 <h1> tags detected on page (or multiple conflicting <h1> tags in body)",
      expectedValue: "Exactly one descriptive <h1> element representing the main topic or product name",
      htmlSnippet: '<div class="product-title-text">Sample Product Name</div> <!-- Styled as heading but uses <div> -->',
      selector: "body .main-content h1",
      domLocation: "Main Page Content (Rendered HTML)",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML",
      likelyLocation: platform === "Shopify" ? "sections/main-product.liquid or sections/main-page.liquid" : "Page header template",
      whyItMatters: "The <h1> heading is the primary structural landmark used by search engines to establish document topic relevance and by assistive screen readers to navigate document outlines.",
      howToFixSteps: [
        "Ensure the primary page title uses a semantic `<h1>` tag.",
        "Demote secondary subheadings (like section titles) to `<h2>` or `<h3>`.",
        "Ensure there is only one `<h1>` per page."
      ],
      codeBefore: `<div class="product-title font-bold text-2xl">Sample Product Name</div>`,
      codeAfter: `<h1 class="product-title font-bold text-2xl">Sample Product Name</h1>`,
      liquidBefore: `<div class="product__title">{{ product.title }}</div>`,
      liquidAfter: `<h1 class="product__title">{{ product.title }}</h1>`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "Open Online Store → Themes → Customize.",
          "Select Product template → Product information section.",
          "Ensure the Title block is rendered as an H1 heading."
        ],
      } : undefined,
    };
  }

  // 10. LOW TEXT TO HTML RATIO / THIN CONTENT
  if (titleLower.includes("text") && titleLower.includes("ratio") || keyLower.includes("text_ratio")) {
    return {
      title: "Low text to HTML ratio",
      severity: "Medium",
      affectedUrl: `https://${primaryDomain}/pages/about-us`,
      pageType: "Standard Landing Page",
      problem: "The amount of indexable human-readable text on this page is exceptionally low compared to the total HTML and inline script payload size (< 10%).",
      detectedValue: "Text-to-HTML ratio: 4.8% (Text size: 1.2 KB, Total HTML: 25.4 KB)",
      expectedValue: "Text-to-HTML ratio of 15% or higher with rich, relevant copy",
      htmlSnippet: '<!-- 25KB of inline scripts, SVG symbols, and nested div containers with only 120 words of text -->',
      selector: "body",
      domLocation: "Document Body",
      sourceType: "RENDERED_HTML",
      sourceFile: null,
      sourceLocationLabel: "Detected in rendered HTML",
      likelyLocation: platform === "Shopify" ? "Theme layout/theme.liquid & page content editor" : "Page content builder",
      whyItMatters: "Search engines favor content-rich pages that satisfy user intent. Pages bloated with excessive inline scripts and minimal text struggle to rank in both traditional search and AI overview engines.",
      howToFixSteps: [
        "Add descriptive, high-quality copy to provide deeper context.",
        "Extract heavy inline CSS and JavaScript into external cached `.js` and `.css` files.",
        "Clean up unnecessary wrapper elements and inline SVG symbols."
      ],
      codeBefore: `<style>/* 15KB of inline CSS rules */</style>\n<script>/* 8KB inline tracking script */</script>\n<p>Welcome to our shop.</p>`,
      codeAfter: `<link rel="stylesheet" href="/assets/custom.css">\n<script src="/assets/tracking.js" defer></script>\n<h2>About Our Brand</h2>\n<p>Comprehensive 300-word story describing our brand mission, craftsmanship, and guarantees...</p>`,
      platformGuidance: platform === "Shopify" ? {
        platform: "Shopify",
        adminSteps: [
          "In Shopify Admin, go to Online Store → Pages.",
          "Expand the page content with detailed answers, product benefits, and FAQs.",
          "Avoid pasting raw inline scripts into the rich text editor."
        ],
      } : undefined,
    };
  }

  // DEFAULT / GENERAL TECHNICAL SEO FALLBACK
  return {
    title: rawTitle,
    severity: issue.type === "error" ? "Critical" : issue.type === "warning" ? "High" : "Medium",
    affectedUrl: `https://${primaryDomain}/`,
    pageType: pageType,
    problem: issue.message || "A technical SEO or performance issue was detected during the page crawl analysis.",
    detectedValue: issue.message || "Suboptimal configuration detected on audited webpage",
    expectedValue: "Conforming to modern search engine optimization and Core Web Vitals standards",
    htmlSnippet: `<meta name="robots" content="index, follow">`,
    selector: "html",
    domLocation: "Rendered HTML Document",
    sourceType: "RENDERED_HTML",
    sourceFile: null,
    sourceLocationLabel: "Detected in rendered HTML",
    likelyLocation: platform === "Shopify" ? "Shopify Theme Files (Online Store → Themes → Edit Code)" : "Website Source Code",
    whyItMatters: "Resolving technical issues ensures search engines can efficiently crawl, index, and rank your website while providing optimal user experience and fast loading speeds.",
    howToFixSteps: [
      issue.suggestion || "Review the detected element in your template code.",
      "Apply the recommended fix following platform standards.",
      "Recheck the issue to verify resolution."
    ],
    codeBefore: `<!-- Flawed or missing configuration -->`,
    codeAfter: `<!-- Recommended updated configuration -->`,
    platformGuidance: platform === "Shopify" ? {
      platform: "Shopify",
      adminSteps: [
        "Open Shopify Admin.",
        "Navigate to Online Store → Themes → Edit Code.",
        "Apply the recommended template adjustments and save."
      ],
    } : undefined,
  };
}
