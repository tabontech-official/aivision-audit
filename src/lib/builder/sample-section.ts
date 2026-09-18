/**
 * The "Sample JSON" shown in the report builder.
 *
 * It is deliberately two things at once:
 *   1. A valid, importable section (the `name`/`slug`/`fields` keys at the end).
 *   2. A complete brief for an AI assistant — the `_PROMPT_FOR_AI` and
 *      `_REFERENCE` blocks describe every enum, trigger, and scoring rule, so
 *      an admin only has to add one line about the section they want.
 *
 * The underscore-prefixed keys are documentation only. Zod object schemas strip
 * unknown keys, so this file imports cleanly as-is (see scripts/check-sample-section.ts).
 *
 * Keep this in sync with src/lib/validation/builder.ts (the schema),
 * src/services/criteria/extract-value.ts (inspection types + config), and
 * src/services/criteria/evaluate.ts (operators + status flow).
 */

const SAMPLE_SECTION = {
  _README:
    "This file is BOTH a working example and the complete spec for it. To create a new section or check: copy this entire file into an AI assistant, replace _PROMPT_FOR_AI.yourRequest with a plain-English description of what you want, and send it. Everything the AI needs to know — property names, limits, inspection types, operators, data paths, scoring — is documented below, so you never have to explain the format. Paste the AI's answer into Report Builder → Import JSON. The importer also takes an ARRAY of sections or a whole exported template at once, and re-importing a section that already exists merges into it instead of failing — see _REFERENCE.bulkImport and _REFERENCE.mergeBehaviour.",

  _PROMPT_FOR_AI: {
    role: "You are configuring a website-audit report template. Sections group related checks; each check ('field') inspects one thing on the audited page and resolves to PASS, WARNING, FAIL, ERROR, or NOT_APPLICABLE.",
    task: "Read _REFERENCE below, then output ONE new section as JSON that satisfies the request in 'yourRequest'.",
    yourRequest:
      "<<< REPLACE THIS LINE with what the section should do, e.g. 'Check GDPR/cookie-consent readiness: cookie banner present, privacy policy linked, no third-party trackers before consent' >>>",
    outputRules: [
      "Output raw JSON only — one object, no markdown fences, no prose before or after.",
      "Do NOT include any key starting with an underscore. Those are documentation; the importer ignores them and they add noise.",
      "Use ONLY property names listed in _REFERENCE.sectionProperties, .checkProperties, and .criteriaProperties. Unknown properties are silently dropped, so a typo means the setting is lost.",
      "Use ONLY inspectionType values from _REFERENCE.inspectionTypes and operator values from _REFERENCE.operators. Anything else is rejected on import.",
      "criteria.configJson is a STRING containing JSON (e.g. \"{\\\"path\\\":\\\"content.wordCount\\\"}\"), not a nested object. Use \"{}\" when no config is needed.",
      "Every check needs all three messages: PASS, FAIL, and WARNING — each with a `message` (what was found, plain language, no jargon) and a `suggestion` (the concrete fix, written for a site owner).",
      "Give 4 to 8 checks unless the request says otherwise. Prefer checks the engine can actually evaluate over aspirational ones.",
      "fieldKey must be unique within the section and prefixed with the section slug in snake_case, e.g. slug 'cookie-consent' → 'cookie_consent.banner_present'. Duplicate keys inside one file fail the import; a key that already exists in the stored section is treated as an EDIT of that check.",
      "To ADD checks to a section that already exists, reuse its exact slug and set 'subSection' to a short label for the new group (e.g. 'Consent banner'). The stored section keeps all of its own settings; only the new checks are appended under that label.",
      "Only add a warn band (warnOperator + warnExpectedValue/warnMinValue/warnMaxValue) when a genuine middle ground exists. Without it a check can only PASS or FAIL.",
      "Set severity honestly: CRITICAL only for things that break the site, mislead users, or expose data. LOW/MEDIUM failures are surfaced to users as 'quick wins'.",
    ],
    checklistBeforeAnswering: [
      "Does every inspectionType I used appear in _REFERENCE.inspectionTypes, and does its 'yields' kind match my operator? (boolean → IS_TRUE/IS_FALSE, number → GREATER_THAN/LESS_THAN/BETWEEN, string → EQUALS/CONTAINS/MATCHES_REGEX)",
      "Did I supply everything that inspection type requires — selector, attributeName, or configJson keys?",
      "For GREATER_THAN/LESS_THAN/BETWEEN did I use minValue/maxValue (numbers), not expectedValue?",
      "Is expectedValue a string, and are minValue/maxValue numbers?",
      "Is slug lowercase-with-dashes, and is icon one of the whitelisted names?",
      "Is every configJson value a valid JSON string that parses to an object?",
      "Did I avoid HTML_VALIDATION and API_CHECK? They are not implemented and always return ERROR.",
    ],
    ifTheRequestCannotBeChecked:
      "If part of the request cannot be evaluated with the available inspection types and data paths, still output the section with the checks that ARE possible, and put a short note in the section's adminNotes explaining what was left out and why. Never invent an inspectionType, operator, or data path.",
  },

  _REFERENCE: {
    howAnAuditRuns: [
      "1. FETCH — the page is downloaded once. HTML, response headers, robots.txt, sitemap, broken-link probes and PageSpeed Insights data are stored as one snapshot.",
      "2. EXTRACT — for each check, `inspectionType` (plus selector / attributeName / configJson) pulls ONE value out of that snapshot. The value is a boolean, a number, a string, or 'unavailable'.",
      "3. EVALUATE — the pass band (operator + expectedValue/minValue/maxValue/regexPattern) is applied to that value. If it matches → PASS. If not and a warn band is configured and it matches → WARNING. Otherwise → FAIL.",
      "4. REPORT — the matching PASS/FAIL/WARNING message + suggestion is attached to the result, and scores roll up per section and overall.",
      "Checks are re-evaluated from the stored snapshot, so nothing is re-crawled when a template changes.",
    ],

    statusRules: {
      PASS: "The pass band matched.",
      WARNING: "The pass band did not match but the warn band did. Only possible when warnOperator is set.",
      FAIL: "Neither band matched.",
      ERROR:
        "The value could not be extracted (missing selector, invalid selector, missing config, unsupported type) or the operator was undecidable (e.g. EQUALS with no expectedValue). Excluded from scoring — treat an ERROR as a misconfigured check, not a site problem.",
      NOT_APPLICABLE:
        "PageSpeed data was unavailable for a PSI_METRIC / LIGHTHOUSE_SCORE check. Excluded from scoring.",
      note: "dataSource is stored as documentation of where the value comes from; extraction is dispatched by inspectionType. Set it to the matching source anyway (HTML, RENDERED_DOM, HEADERS, PSI, ROBOTS, SITEMAP, NETWORK).",
    },

    scoring: {
      perCheck:
        "earned = score × weight × factor, where factor is PASS 1, WARNING 0.5, FAIL 0. The check's maximum (score × weight) only enters the denominator when the status is PASS, WARNING, or FAIL — ERROR and NOT_APPLICABLE drop out of both sides.",
      perSection: "sectionPercent = sum(earned) / sum(max) × 100.",
      overall:
        "A weighted average of the section percentages, using each section's `weight`. Sections with contributesToScore=false are shown in the report but excluded from the overall score.",
      severityEffects:
        "A FAILING check with severity CRITICAL increments the report's critical-issue count. A FAILING or WARNING check with severity LOW or MEDIUM is listed as a 'quick win'. Severity does not change the arithmetic — use `score`/`weight` for that.",
      planAccess:
        "BOTH or FREE → visible to everyone. PREMIUM → full detail for premium viewers, shown as a locked teaser to free viewers. HIDDEN → never rendered for anyone (use it to stage a section before launch).",
    },

    bulkImport: {
      what: "The importer accepts three shapes, so a whole template can be created in one paste instead of section by section.",
      shapes: [
        "A single section object — exactly like the one at the bottom of this file.",
        "An array of section objects: [ { …section A… }, { …section B… } ].",
        "An export envelope: { \"sections\": [ … ] } — this is what Report Builder → Export JSON writes, so export → edit → import round-trips.",
      ],
      limits: "Up to 50 sections per file. Validation runs over the whole file first: if any section or check is invalid, NOTHING is written.",
      exporting:
        "Export JSON downloads the entire draft in the envelope shape, including each check's category (its sub-section) and criteria.configJson as a string. Hand that file to an AI to extend the template, then import it straight back.",
    },

    mergeBehaviour: {
      what: "Importing a section that already exists never creates a second copy of it and never overwrites it.",
      matching: "The stored section is matched on `slug` first, then on `name` (case-insensitive). A section that was deleted is restored rather than duplicated.",
      theMainSection:
        "Its own settings — name, weight, icon, planAccess, descriptions — are left exactly as they are. The admin can tick 'Overwrite the section's own settings' in the import dialog to change that; it is off by default.",
      newChecks:
        "Checks whose fieldKey is not already in the section are APPENDED as a sub-section: they all get the same `category`, and the builder renders one group header for them inside the main section.",
      existingChecks:
        "A check whose fieldKey already exists is the same check, so it is updated in place — criteria, messages, labels and scoring are rewritten from the file, and it stays in the group it is already in. Untick 'Update checks that share a field key' to leave stored checks alone.",
      groupLabel:
        "The `subSection` value if you set one; otherwise the incoming section `name` when it differs from the stored one; otherwise the incoming shortDescription; otherwise 'Set N'.",
      perCheckOverride:
        "A check's own `category` always wins over the group label, which is why an exported file re-imports with its groups intact.",
    },

    appliesWhen: {
      what: "Optional platform gate on a SECTION or a CHECK: a STRING containing a JsonLogic expression (same operations as RULES_EVALUATOR) over the snapshot data paths.",
      semantics: [
        "Absent or empty → always applies (the default).",
        "Truthy → the check runs normally.",
        "Falsy → the result is NOT_APPLICABLE — excluded from scoring on both sides, shown collapsed in the report as 'skipped — not applicable'. NEVER a FAIL.",
        "Invalid expression → fails OPEN (the check runs) and a warning is logged.",
        "A falsy SECTION gate makes every check inside NOT_APPLICABLE and records the section in scoreBasis.excludedSections with reason NOT_APPLICABLE_PLATFORM.",
      ],
      examples: [
        "Section only for Shopify stores: \"appliesWhen\": \"{\\\"var\\\":\\\"site.isShopify\\\"}\"",
        "Check only when apps are present: \"appliesWhen\": \"{\\\">\\\":[{\\\"var\\\":\\\"site.appCount\\\"},0]}\"",
        "Check only for WordPress: \"appliesWhen\": \"{\\\"==\\\":[{\\\"var\\\":\\\"site.platform\\\"},\\\"WORDPRESS\\\"]}\"",
      ],
      rule: "Every Shopify-specific section MUST carry appliesWhen {\"var\":\"site.isShopify\"} so it can never FAIL a WordPress site. Universal sections (SEO, speed, security) carry no gate.",
    },

    sectionProperties: {
      name: "required, 2–80 chars. Shown as the section heading.",
      slug: "required, 2–60 chars, lowercase letters/numbers/dashes only (e.g. 'cookie-consent'). Reuse the slug of an existing section to merge into it — see mergeBehaviour.",
      subSection:
        "optional, ≤60 chars. Only used when merging into an existing section: it names the group the incoming checks are filed under (stored as each new check's `category`). Ignored when the section is brand new.",
      shortDescription: "optional, ≤200 chars. One line under the heading.",
      detailedDescription: "optional, ≤2000 chars. Longer explanation of what the section covers.",
      icon: "optional, must be one of: gauge, search, settings-2, accessibility, smartphone, shield, trending-up, layout, file-text, share-2, code-2, image, link, form-input, badge-check, shopping-cart, sparkles, map-pin, zap, globe.",
      weight: "number 0–10, default 1. The section's pull on the overall score.",
      contributesToScore: "boolean, default true.",
      planAccess: "FREE | PREMIUM | HIDDEN | BOTH, default BOTH.",
      isEnabled: "boolean, default true. false = skipped entirely at audit time.",
      defaultExpanded: "boolean, default true. Whether the section starts open in the report.",
      visibleInReport: "boolean, default true.",
      accentColor: "optional hex like '#059669' (exactly 6 hex digits).",
      appliesWhen: "optional STRING of JsonLogic, ≤2000 chars — see the appliesWhen block above.",
      pillar:
        "optional, default FOUNDATIONS. One of: FOUNDATIONS | SPEED_VITALS | ONPAGE_CONTENT | AI_ANSWER_ENGINES | TRUST_COMPLIANCE | CONVERSION_UX. The customer-facing group the section renders under. Unknown values are rejected at import. On a merge, an explicitly-provided pillar is adopted even when other section settings are preserved.",
      adminNotes: "optional, ≤1000 chars. Internal only — never shown to end users.",
      fields: "required array of checks. See checkProperties.",
    },

    checkProperties: {
      name: "required, 2–100 chars. The check's label in the report.",
      fieldKey:
        "required, 2–80 chars, lowercase letters/numbers/dots/underscores only. Stable machine key, e.g. 'security.https_enforced'. Must be unique within its section.",
      description: "optional, ≤500 chars. Explains what is being checked.",
      planAccess: "FREE | PREMIUM | HIDDEN | BOTH, default BOTH.",
      severity: "CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL, default MEDIUM.",
      category:
        "optional, ≤60 chars. The check's sub-section inside its section — the builder draws one header per run of checks sharing it. Leave it out and a merge import fills it in from the section's `subSection`.",
      score: "number 0–100, default 1. Base points for this check.",
      weight: "number 0–10, default 1. Multiplies score.",
      passLabel: "optional, ≤30 chars, default 'Yes'.",
      failLabel: "optional, ≤30 chars, default 'No'.",
      warningLabel: "optional, ≤30 chars, default 'Partial'.",
      helpArticleUrl: "optional, must be a full URL including https://.",
      appliesWhen: "optional STRING of JsonLogic gating just this check — see the appliesWhen block above.",
      pageType:
        "optional, default HOME. One of: HOME | PRODUCT | COLLECTION | BLOG. Which page the check inspects. HOME is the URL the visitor submitted. PRODUCT/COLLECTION/BLOG are ONE representative page sampled from the store's sitemap during the audit — use these for checks that only make sense on that page type (product schema, collection descriptions). If the page type could not be sampled the check reports NOT_APPLICABLE, never a failure. All data paths then read THAT page's snapshot.",
      isEnabled: "boolean, default true.",
      adminNotes: "optional, ≤1000 chars, internal only.",
      criteria: "required object. See criteriaProperties.",
      messages:
        "required object with PASS, FAIL and WARNING keys; each holds { message, suggestion }. message ≤500 chars, suggestion ≤1500 chars.",
    },

    criteriaProperties: {
      inspectionType: "required. What to look at — see inspectionTypes.",
      dataSource: "HTML | RENDERED_DOM | HEADERS | PSI | ROBOTS | SITEMAP | NETWORK, default HTML.",
      selector: "CSS selector, ≤300 chars. Required by the DOM inspection types.",
      attributeName:
        "≤100 chars. The attribute for ATTRIBUTE_* types; also accepted as the header name for RESPONSE_HEADER.",
      operator: "required. The pass condition — see operators.",
      expectedValue: "string, ≤500 chars. Used by EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH and friends.",
      minValue: "number. Used by GREATER_THAN, GREATER_THAN_OR_EQUAL and BETWEEN.",
      maxValue: "number. Used by LESS_THAN, LESS_THAN_OR_EQUAL and BETWEEN.",
      regexPattern:
        "≤300 chars, used by MATCHES_REGEX. Nested quantifiers like (a+)+ are rejected for safety; the subject is capped at 50,000 chars.",
      caseSensitive: "boolean, default false. Applies to string comparisons and regex.",
      warnOperator: "optional. Same vocabulary as operator; defines the WARNING band.",
      warnExpectedValue: "string, the warn band's expected value.",
      warnMinValue: "number, the warn band's minimum.",
      warnMaxValue: "number, the warn band's maximum.",
      configJson:
        "A STRING containing a JSON object, ≤5000 chars — e.g. \"{\\\"path\\\":\\\"content.wordCount\\\"}\". Use \"{}\" when the inspection type needs no config. See configJsonRecipes.",
    },

    inspectionTypes: {
      _howToRead: "'yields' is the value kind handed to the operator; 'needs' lists required configuration.",

      ELEMENT_EXISTS: "yields boolean (true when the selector matches at least one element). needs: selector.",
      ELEMENT_NOT_EXISTS: "yields boolean (true when the selector matches nothing). needs: selector.",
      ELEMENT_COUNT: "yields number (how many elements match). needs: selector.",
      ATTRIBUTE_EXISTS: "yields string (that attribute on the FIRST match, null if absent). needs: selector + attributeName.",
      ATTRIBUTE_EQUALS: "yields string (same extraction as ATTRIBUTE_EXISTS; compare with EQUALS). needs: selector + attributeName.",
      ATTRIBUTE_CONTAINS: "yields string (same extraction; compare with CONTAINS). needs: selector + attributeName.",
      TEXT_EXISTS: "yields string (trimmed text of the first match, or the whole <body> text when no selector).",
      TEXT_CONTAINS: "yields string (same as TEXT_EXISTS; pair with CONTAINS).",
      TEXT_LENGTH: "yields number (character count of the first match's text, or of the page title when no selector).",

      META_TAG: "yields string. needs configJson: {\"tag\":\"title\"} for the <title>, or {\"name\":\"description\"|\"robots\"|\"viewport\"|any meta name}.",
      CANONICAL_TAG: "yields string (the canonical URL, null if none).",
      ROBOTS_META: "yields string (content of the robots meta tag).",
      MOBILE_VIEWPORT: "yields string (content of the viewport meta tag).",
      HEADING_HIERARCHY: "yields boolean (true when no heading level is skipped going down the page).",
      IMAGE_ALT_TEXT: "yields number (count of images missing alt text — so 0 is the good outcome).",
      BROKEN_LINKS: "yields number (broken links found among the probed links).",
      FORM_FIELD: "yields number (forms on the page).",
      CTA_CHECK: "yields number (action-oriented buttons/links).",
      STRUCTURED_DATA: "yields boolean (any JSON-LD present).",
      SCHEMA_TYPE: "with configJson {\"schemaType\":\"Organization\"} yields boolean (that type present); without config yields a comma-separated string of all schema types found.",

      HTTP_STATUS: "yields number (final HTTP status).",
      REDIRECT_CHECK: "yields number (redirects followed).",
      SSL_CHECK: "yields boolean (the final URL was served over HTTPS).",
      RESPONSE_HEADER: "yields string (header value, null if absent). needs the header name in attributeName or configJson {\"header\":\"strict-transport-security\"} — lowercase.",
      ROBOTS_TXT_CHECK: "yields boolean (robots.txt exists).",
      SITEMAP_CHECK: "yields boolean (a sitemap was found).",

      BOOLEAN_CHECK: "yields boolean (truthiness of a snapshot path). needs configJson {\"path\":\"trust.hasPrivacyPolicyLink\"}. See dataPaths.",
      NUMERIC_COMPARISON: "yields number (a snapshot path coerced to number). needs configJson {\"path\":\"content.wordCount\"}.",
      STRING_COMPARISON: "yields string (a snapshot path as text). needs configJson {\"path\":\"page.title\"}.",
      REGEX_EVALUATOR: "yields string — the snapshot path in configJson {\"path\":\"robots.content\"}, or the first 200,000 chars of raw HTML when no path is given. Pair with operator MATCHES_REGEX + regexPattern.",
      RULES_EVALUATOR: "yields whatever the rule returns (boolean/number/string). needs configJson {\"rules\": …}. See rulesEvaluator.",

      PSI_METRIC: "yields number. needs configJson {\"strategy\":\"mobile\"|\"desktop\",\"metric\":\"fcp_ms\"|\"lcp_ms\"|\"tbt_ms\"|\"cls\"|\"speed_index_ms\"|\"tti_ms\"|\"inp_ms\"|\"server_response_ms\"}. Defaults: mobile + lcp_ms. NOT_APPLICABLE when PageSpeed data is missing.",
      LIGHTHOUSE_SCORE: "yields number 0–100. needs configJson {\"strategy\":\"mobile\"|\"desktop\",\"category\":\"performance\"|\"accessibility\"|\"best-practices\"|\"seo\"}. Defaults: mobile + performance.",

      HTML_VALIDATION: "NOT IMPLEMENTED — always ERROR. Do not use.",
      API_CHECK: "NOT IMPLEMENTED — always ERROR. Do not use.",
    },

    operators: {
      EXISTS: "value is present and non-empty.",
      NOT_EXISTS: "value is absent or empty.",
      IS_TRUE: "boolean value is true (for non-booleans: present and non-empty).",
      IS_FALSE: "boolean value is false (for non-booleans: absent or empty).",
      EQUALS: "compares against expectedValue; numeric when both sides are numeric, otherwise string comparison honouring caseSensitive.",
      NOT_EQUALS: "the inverse of EQUALS.",
      CONTAINS: "string value contains expectedValue.",
      NOT_CONTAINS: "the inverse of CONTAINS.",
      STARTS_WITH: "string value starts with expectedValue.",
      ENDS_WITH: "string value ends with expectedValue.",
      GREATER_THAN: "number > minValue (falls back to expectedValue read as a number).",
      LESS_THAN: "number < maxValue (falls back to expectedValue read as a number).",
      GREATER_THAN_OR_EQUAL: "number >= minValue.",
      LESS_THAN_OR_EQUAL: "number <= maxValue.",
      BETWEEN: "minValue <= number <= maxValue, inclusive. An omitted bound is treated as unbounded.",
      MATCHES_REGEX: "string value matches regexPattern (or expectedValue if no pattern is set).",
    },

    configJsonRecipes: {
      none: "\"{}\"",
      snapshotPath: "\"{\\\"path\\\":\\\"trust.hasCookieNotice\\\"}\"",
      metaByName: "\"{\\\"name\\\":\\\"description\\\"}\"",
      metaTitle: "\"{\\\"tag\\\":\\\"title\\\"}\"",
      responseHeader: "\"{\\\"header\\\":\\\"content-security-policy\\\"}\"",
      schemaType: "\"{\\\"schemaType\\\":\\\"LocalBusiness\\\"}\"",
      psiMetric: "\"{\\\"strategy\\\":\\\"mobile\\\",\\\"metric\\\":\\\"lcp_ms\\\"}\"",
      lighthouse: "\"{\\\"strategy\\\":\\\"mobile\\\",\\\"category\\\":\\\"seo\\\"}\"",
      rules: "\"{\\\"rules\\\":{\\\"and\\\":[{\\\"var\\\":\\\"trust.hasPrivacyPolicyLink\\\"},{\\\"var\\\":\\\"trust.hasTermsLink\\\"}]}}\"",
    },

    dataPaths: {
      _howToRead:
        "Dot paths into the stored inspection snapshot. Use them in configJson.path (BOOLEAN_CHECK, NUMERIC_COMPARISON, STRING_COMPARISON, REGEX_EVALUATOR), in RULES_EVALUATOR {\"var\":\"…\"}, and in appliesWhen gates. Nothing outside this list exists — an unknown path evaluates to empty.",
      site: "platform (string: SHOPIFY|HYDROGEN|WORDPRESS|WOOCOMMERCE|WEBFLOW|WIX|SQUARESPACE|NEXTJS|UNKNOWN), platformConfidence (number 0-1), isShopify (boolean — true for SHOPIFY or HYDROGEN), plusLikelihood (string: unknown|possible — never assert Plus), themeName (string), themeId (string), isOfficialTheme (boolean), appCount (number), appNames (string[]), appScriptHosts (string[]), blockingAppScripts (number)",
      page: "title (string), titleLength (number), metaDescription (string), metaDescriptionLength (number), metaRobots (string), canonicalUrl (string), language (string), charset (string), faviconUrl (string), viewport (string), hasViewport (boolean)",
      headings: "h1 (string[]), h2, h3, h1Count (number), h2Count, h3Count, hierarchyValid (boolean)",
      images: "count, missingAltCount, emptyAltCount, shopifyCdnCount, withWidthParamCount (Shopify CDN responsive param), lazyLoadedCount, eagerAboveFoldCount (first 3 images not lazy), withDimensionsCount (width+height set — CLS), avgSrcsetEntries — all numbers",
      links: "internalCount (number), externalCount (number), nofollowCount (number)",
      social: "hasOgTitle (boolean), hasOgImage (boolean), hasTwitterCard (boolean), socialProfileLinks (string[]), openGraph (object keyed by og property), twitterCard (object)",
      structuredData: "jsonLdBlocks (number), schemaTypes (string[]), hasStructuredData (boolean)",
      content: "wordCount (number), textToHtmlRatio (number 0–1), paragraphCount (number)",
      conversion: "formCount (number), buttonCount (number), ctaCount (number), ctaExamples (string[])",
      contact: "hasEmail (boolean), hasPhone (boolean), emails (string[]), phones (string[])",
      trust: "hasPrivacyPolicyLink, hasTermsLink, hasCookieNotice, hasTestimonialSignals, hasGuaranteeSignals, hasPricingSignals, hasShippingSignals, hasReturnPolicySignals — all boolean",
      resources: "scriptCount, externalScriptCount, inlineScriptCount, stylesheetCount, inlineStyleCount, fontLinkCount, iframeCount (numbers); preconnectHosts (string[]), dnsPrefetchHosts (string[]), preloadCount (number), hasShopifyCdnHint (boolean — preconnect/dns-prefetch to cdn.shopify.com)",
      network:
        "httpStatus (number), finalUrl (string), redirectCount (number), usedHttps (boolean), htmlSizeBytes (number), hasCompression (boolean), hasCacheHeaders (boolean), responseHeaders (object keyed by lowercase header name), securityHeaders.strictTransportSecurity, .contentSecurityPolicy, .xContentTypeOptions, .xFrameOptions, .referrerPolicy, .permissionsPolicy (string or null each)",
      robots: "exists (boolean), content (string, first 5 KB), referencesSitemap (boolean), disallowsAll (boolean)",
      llms: "exists (boolean — /llms.txt found), content (string, first 5 KB), sizeBytes (number)",
      sitemap: "exists (boolean), url (string), urlCount (number)",
      brokenLinks: "checkedCount (number), brokenCount (number)",
      "shopify.urls": "hasCollectionScopedProductLinks (boolean — /collections/x/products/y links, the classic Shopify duplicate-content shape), variantParamLinkCount, filterParamLinkCount, paginationLinkCount (numbers)",
      "shopify.sitemapChildren": "string[] — child sitemap file names (sitemap_products_1.xml, …)",
      "shopify.policies":
        "ONLY on Shopify stores (absent elsewhere → NOT_APPLICABLE). Per page (refund, privacy, terms, shipping, legalNotice): exists (boolean), httpStatus (number), title (string), h1 (string), wordCount (number). Aggregates: presentCount (0–5), thinCount (present but under ~100 words), duplicateTitleH1Count (title === h1 — the Shopify default failure). Example path: shopify.policies.refund.exists",
      "shopify.product":
        "ONLY when the audited page carries Product JSON-LD — on a homepage these paths are ABSENT and checks reading them resolve NOT_APPLICABLE (gate product checks with appliesWhen {\"var\":\"shopify.product.hasProductSchema\"} or rely on the absent→N/A behaviour). Keys: hasProductSchema, schemaHasOffers, schemaHasPrice, schemaHasAvailability, schemaHasCurrency, hasAggregateRating (booleans), imageCount (number), hasSizeGuide, hasShippingInfo, hasReturnsInfo (booleans)",
    },

    rulesEvaluator: {
      what: "A sandboxed JsonLogic-style expression over the snapshot, for checks that need more than one value. Put it in configJson as {\"rules\": …} and pair it with IS_TRUE (boolean result) or a numeric operator.",
      allowedOperations:
        "var, ==, ===, !=, >, <, >=, <=, ! , and, or, in, length, cat, substr. Anything else is rejected on import — there is no arithmetic, no loops, and no function calls.",
      readingValues: "{\"var\":\"page.titleLength\"} reads a dataPaths path; a missing path returns null.",
      maxDepth: "15 levels of nesting.",
      exampleBoolean:
        "{\"rules\":{\"and\":[{\"var\":\"trust.hasPrivacyPolicyLink\"},{\"var\":\"trust.hasCookieNotice\"},{\"!\":{\"var\":\"robots.disallowsAll\"}}]}}",
      exampleNumeric:
        "{\"rules\":{\">\":[{\"length\":[{\"var\":\"headings.h1\"}]},0]}} — pair with IS_TRUE, since the comparison itself returns a boolean.",
    },

    commonMistakes: [
      "Passing configJson as an object instead of a JSON string. It must be a string.",
      "Using expectedValue for numeric comparisons — GREATER_THAN/LESS_THAN/BETWEEN read minValue/maxValue.",
      "Using IS_TRUE on a count. IMAGE_ALT_TEXT and BROKEN_LINKS yield numbers where 0 is good, so the pass band is usually EQUALS 0 or LESS_THAN_OR_EQUAL with maxValue.",
      "Forgetting selector on an ELEMENT_*/ATTRIBUTE_* check — the check errors instead of failing.",
      "Reusing a fieldKey twice inside ONE file — that aborts the import. (Reusing a slug or fieldKey that already exists in the draft is fine: it merges/updates. See mergeBehaviour.)",
      "Writing a WARNING message but no warnOperator — the check can then never reach WARNING.",
      "Expecting HTML_VALIDATION or API_CHECK to work. They are not implemented.",
    ],

    afterImport:
      "Imported sections are appended to the current DRAFT template version and are not live until you press Publish. A merge reports exactly what it did — sections created, sections merged, checks added, checks updated. Edit any check afterwards in the builder, and use 'Test' on a criterion to run it against a real URL before publishing.",
  },

  /* ---- Everything below this point is the actual importable section. ---- */

  name: "Custom Security & Privacy",
  slug: "custom-security",
  shortDescription: "Evaluates transport security, security headers and privacy signals.",
  detailedDescription:
    "Comprehensive security checks ensuring visitors browse the site safely and their data is handled transparently.",
  icon: "shield",
  weight: 1.5,
  contributesToScore: true,
  planAccess: "BOTH",
  isEnabled: true,
  defaultExpanded: true,
  visibleInReport: true,
  accentColor: "#059669",
  adminNotes: "Imported custom section for security auditing",
  fields: [
    {
      _example: "boolean value + IS_TRUE — the simplest shape.",
      name: "HTTPS Enforced",
      fieldKey: "custom_security.https_check",
      description: "Ensures the site is served over HTTPS.",
      planAccess: "BOTH",
      severity: "HIGH",
      category: "Security",
      score: 1,
      weight: 1,
      passLabel: "Pass",
      failLabel: "Fail",
      warningLabel: "Partial",
      helpArticleUrl:
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
      isEnabled: true,
      adminNotes: "Checks SSL/TLS enforcement",
      criteria: {
        inspectionType: "SSL_CHECK",
        dataSource: "NETWORK",
        operator: "IS_TRUE",
        caseSensitive: false,
        configJson: "{}",
      },
      messages: {
        PASS: {
          message: "Website strictly uses HTTPS.",
          suggestion: "Keep SSL certificates renewed automatically.",
        },
        FAIL: {
          message: "Website is accessible over insecure HTTP.",
          suggestion:
            "Configure 301 redirects from http:// to https:// and install an SSL certificate.",
        },
        WARNING: {
          message: "HTTPS is present but has configuration warnings.",
          suggestion: "Review TLS configuration and chain certificates.",
        },
      },
    },
    {
      _example:
        "string value + a warn band — CONTAINS 'max-age=31536000' passes, any other HSTS header warns, a missing header fails.",
      name: "HSTS Header",
      fieldKey: "custom_security.hsts_header",
      description: "Checks that Strict-Transport-Security is sent with a long max-age.",
      planAccess: "BOTH",
      severity: "MEDIUM",
      category: "Security",
      score: 1,
      weight: 1,
      passLabel: "Strong",
      failLabel: "Missing",
      warningLabel: "Weak",
      isEnabled: true,
      criteria: {
        inspectionType: "RESPONSE_HEADER",
        dataSource: "HEADERS",
        attributeName: "strict-transport-security",
        operator: "CONTAINS",
        expectedValue: "max-age=31536000",
        caseSensitive: false,
        warnOperator: "EXISTS",
        configJson: "{}",
      },
      messages: {
        PASS: {
          message: "Strict-Transport-Security is set with a one-year max-age.",
          suggestion: "Consider adding includeSubDomains and preload once you are confident.",
        },
        FAIL: {
          message: "No Strict-Transport-Security header was returned.",
          suggestion:
            "Add 'Strict-Transport-Security: max-age=31536000' to your server or CDN response headers.",
        },
        WARNING: {
          message: "Strict-Transport-Security is set but with a short max-age.",
          suggestion: "Raise max-age to 31536000 (one year) so browsers remember the HTTPS rule.",
        },
      },
    },
    {
      _example:
        "snapshot path + BOOLEAN_CHECK — reads trust.hasPrivacyPolicyLink from the extracted data via configJson.",
      name: "Privacy Policy Linked",
      fieldKey: "custom_security.privacy_policy",
      description: "Looks for a link to a privacy policy on the page.",
      planAccess: "BOTH",
      severity: "MEDIUM",
      category: "Privacy",
      score: 1,
      weight: 1,
      passLabel: "Found",
      failLabel: "Missing",
      warningLabel: "Partial",
      isEnabled: true,
      criteria: {
        inspectionType: "BOOLEAN_CHECK",
        dataSource: "HTML",
        operator: "IS_TRUE",
        caseSensitive: false,
        configJson: "{\"path\":\"trust.hasPrivacyPolicyLink\"}",
      },
      messages: {
        PASS: {
          message: "A privacy policy link was found.",
          suggestion: "Review the policy yearly so it still matches how you handle data.",
        },
        FAIL: {
          message: "No privacy policy link was found on the page.",
          suggestion:
            "Publish a privacy policy and link to it from the footer of every page — most privacy laws require it.",
        },
        WARNING: {
          message: "A privacy link was found but could not be confirmed.",
          suggestion: "Make sure the link text clearly says 'Privacy Policy'.",
        },
      },
    },
  ],
};

/** Pretty-printed sample: documentation block + a working importable section. */
export const SAMPLE_SECTION_JSON = JSON.stringify(SAMPLE_SECTION, null, 2);
