/**
 * AuditFlow database seed.
 *
 * Creates (idempotently):
 *  1. Master Admin from MASTER_ADMIN_EMAIL + MASTER_ADMIN_INITIAL_PASSWORD
 *  2. FREE and PREMIUM plans with marketing features
 *  3. Core system settings (score ranges, limits)
 *  4. Default report template v1 (PUBLISHED) with sections + starter checks,
 *     including Page Speed as an undeletable system section
 *
 * Run: npm run db:seed
 * The password is hashed with argon2id and never logged.
 */
import "dotenv/config";
import {
  PrismaClient,
  PlanAccess,
  Severity,
  InspectionType,
  CriteriaOperator,
  CheckStatus,
} from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();

const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

/* ------------------------------------------------------------------ */
/* 1. Master Admin                                                     */
/* ------------------------------------------------------------------ */

async function seedMasterAdmin() {
  const email = process.env.MASTER_ADMIN_EMAIL;
  const password = process.env.MASTER_ADMIN_INITIAL_PASSWORD;

  if (!email) {
    throw new Error("MASTER_ADMIN_EMAIL is not set. Aborting seed.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Master admin already exists (${email}) — skipping`);
    return existing;
  }

  if (!password) {
    throw new Error(
      "MASTER_ADMIN_INITIAL_PASSWORD is not set. Set it in .env before the first seed.",
    );
  }
  if (password.length < 8) {
    throw new Error("MASTER_ADMIN_INITIAL_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  const admin = await db.user.create({
    data: {
      email,
      name: "Master Admin",
      passwordHash,
      role: "MASTER_ADMIN",
      plan: "PREMIUM",
      emailVerifiedAt: new Date(),
      mustChangePassword: true, // prompt to change after first login
    },
  });

  console.log(`✓ Master admin created (${email}) — change the password after first login`);
  return admin;
}

/* ------------------------------------------------------------------ */
/* 2. Plans                                                            */
/* ------------------------------------------------------------------ */

async function seedPlans() {
  const free = await db.plan.upsert({
    where: { key: "FREE" },
    update: {},
    create: {
      key: "FREE",
      name: "Free",
      description: "Essential website checks to get you started.",
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      auditLimitPerMonth: 3,
      features: {
        create: [
          { featureKey: "basic_score", label: "Overall website score", displayOrder: 1 },
          { featureKey: "free_sections", label: "Core audit sections", displayOrder: 2 },
          { featureKey: "limited_recs", label: "Essential recommendations", displayOrder: 3 },
          { featureKey: "audits_3", label: "3 audits per month", displayOrder: 4 },
        ],
      },
    },
  });

  const premium = await db.plan.upsert({
    where: { key: "PREMIUM" },
    update: {},
    create: {
      key: "PREMIUM",
      name: "Premium",
      description: "The complete audit toolkit for serious website owners.",
      priceMonthlyCents: 2900,
      priceYearlyCents: 29000,
      auditLimitPerMonth: 50,
      features: {
        create: [
          { featureKey: "all_sections", label: "Every audit section unlocked", displayOrder: 1 },
          { featureKey: "full_evidence", label: "Full evidence & detected values", displayOrder: 2 },
          { featureKey: "detailed_recs", label: "Detailed prioritized recommendations", displayOrder: 3 },
          { featureKey: "pdf_download", label: "Downloadable PDF reports", displayOrder: 4 },
          { featureKey: "history", label: "Historical comparisons", displayOrder: 5 },
          { featureKey: "rerun", label: "Unlimited re-audits of saved sites", displayOrder: 6 },
          { featureKey: "audits_50", label: "50 audits per month", displayOrder: 7 },
        ],
      },
    },
  });

  console.log("✓ Plans seeded (FREE, PREMIUM)");
  return { free, premium };
}

/* ------------------------------------------------------------------ */
/* 3. System settings                                                  */
/* ------------------------------------------------------------------ */

async function seedSettings() {
  const settings: Array<{ key: string; value: unknown; description: string; isSecret?: boolean }> = [
    { key: "product_name", value: "AuditFlow", description: "Public product name" },
    { key: "support_email", value: "support@example.com", description: "Support contact email" },
    { key: "free_audit_limit", value: 3, description: "Audits per month on the Free plan" },
    { key: "premium_audit_limit", value: 50, description: "Audits per month on the Premium plan" },
    {
      key: "anonymous_report_expiration_days",
      value: 7,
      description: "Days before unclaimed anonymous reports expire",
    },
    {
      key: "anonymous_audits_per_hour_ip",
      value: 3,
      description: "Anonymous audit rate limit per IP per hour",
    },
    {
      key: "score_ranges",
      value: [
        { min: 90, max: 100, grade: "Excellent", color: "#16a34a" },
        { min: 75, max: 89, grade: "Good", color: "#22c55e" },
        { min: 50, max: 74, grade: "Needs Improvement", color: "#f59e0b" },
        { min: 0, max: 49, grade: "Poor", color: "#ef4444" },
      ],
      description: "Overall score grade bands",
    },
    { key: "maintenance_mode", value: false, description: "Blocks new audits when true" },
    { key: "terms_url", value: "/terms", description: "Terms of Service URL" },
    { key: "privacy_url", value: "/privacy", description: "Privacy Policy URL" },
    { key: "cookie_policy_url", value: "/cookies", description: "Cookie Policy URL" },
  ];

  for (const s of settings) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value as never,
        description: s.description,
        isSecret: s.isSecret ?? false,
      },
    });
  }

  await db.brandingSetting.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      productName: "AuditFlow",
    },
  });

  console.log("✓ System settings seeded");
}

/* ------------------------------------------------------------------ */
/* 4. Default report template                                          */
/* ------------------------------------------------------------------ */

type CheckSeed = {
  name: string;
  fieldKey: string;
  description: string;
  severity: Severity;
  planAccess: PlanAccess;
  score?: number;
  inspection: {
    inspectionType: InspectionType;
    dataSource?: string;
    selector?: string;
    attributeName?: string;
    operator: CriteriaOperator;
    expectedValue?: string;
    minValue?: number;
    maxValue?: number;
    warnOperator?: CriteriaOperator;
    warnMinValue?: number;
    warnMaxValue?: number;
    config?: Record<string, unknown>;
  };
  messages: Partial<Record<"PASS" | "FAIL" | "WARNING", { message: string; suggestion?: string }>>;
};

type SectionSeed = {
  name: string;
  slug: string;
  shortDescription: string;
  icon: string;
  displayOrder: number;
  weight: number;
  planAccess: PlanAccess;
  isSystem?: boolean;
  accentColor?: string;
  checks: CheckSeed[];
};

const SECTIONS: SectionSeed[] = [
  {
    name: "Page Speed",
    slug: "page-speed",
    shortDescription: "Core Web Vitals and loading performance from Google PageSpeed Insights.",
    icon: "gauge",
    displayOrder: 1,
    weight: 2,
    planAccess: PlanAccess.BOTH,
    isSystem: true,
    accentColor: "#4f46e5",
    checks: [
      {
        name: "Mobile Performance Score",
        fieldKey: "speed.mobile_performance",
        description: "Lighthouse performance score for mobile devices.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        score: 3,
        inspection: {
          inspectionType: InspectionType.LIGHTHOUSE_SCORE,
          dataSource: "PSI",
          operator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          minValue: 90,
          warnOperator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          warnMinValue: 50,
          config: { strategy: "mobile", category: "performance" },
        },
        messages: {
          PASS: {
            message: "Your mobile performance score is {{actualValue}} — excellent.",
          },
          WARNING: {
            message: "Your mobile performance score is {{actualValue}}, which has room to improve.",
            suggestion:
              "Focus on the largest opportunities listed in the Page Speed details: compress images, reduce unused JavaScript, and enable text compression.",
          },
          FAIL: {
            message: "Your mobile performance score is {{actualValue}}, which is low.",
            suggestion:
              "Prioritize reducing page weight: optimize and lazy-load images, defer non-critical JavaScript, and consider a CDN. Re-test after each change.",
          },
        },
      },
      {
        name: "Desktop Performance Score",
        fieldKey: "speed.desktop_performance",
        description: "Lighthouse performance score for desktop browsers.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.LIGHTHOUSE_SCORE,
          dataSource: "PSI",
          operator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          minValue: 90,
          warnOperator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          warnMinValue: 50,
          config: { strategy: "desktop", category: "performance" },
        },
        messages: {
          PASS: {
            message: "Your desktop performance score is {{actualValue}} — excellent.",
          },
          WARNING: {
            message: "Your desktop performance score is {{actualValue}}.",
            suggestion:
              "Optimize desktop assets, clean up render-blocking stylesheets, and leverage browser caching.",
          },
          FAIL: {
            message: "Your desktop performance score is {{actualValue}}.",
            suggestion:
              "Improve server response time, defer heavy third-party bundles, and eliminate uncompressed assets.",
          },
        },
      },
      {
        name: "Largest Contentful Paint (LCP)",
        fieldKey: "speed.lcp",
        description: "Time until the largest visible element finishes rendering (mobile).",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 2500,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 4000,
          config: { strategy: "mobile", metric: "lcp_ms" },
        },
        messages: {
          PASS: { message: "LCP is {{actualValue}}ms — within the recommended 2.5s." },
          WARNING: {
            message: "LCP is {{actualValue}}ms — above the recommended 2.5s.",
            suggestion:
              "Optimize your largest above-the-fold element: serve properly sized images in modern formats, preload the hero image, and reduce server response time.",
          },
          FAIL: {
            message: "LCP is {{actualValue}}ms — well above the recommended 2.5s.",
            suggestion:
              "Your main content takes too long to appear. Compress the hero image, remove render-blocking resources, and improve server response time.",
          },
        },
      },
      {
        name: "First Contentful Paint (FCP)",
        fieldKey: "speed.fcp",
        description: "Time until the browser renders the first piece of DOM content (mobile).",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 1800,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 3000,
          config: { strategy: "mobile", metric: "fcp_ms" },
        },
        messages: {
          PASS: { message: "FCP is {{actualValue}}ms — fast initial render." },
          WARNING: {
            message: "FCP is {{actualValue}}ms — slightly slow to begin rendering.",
            suggestion: "Eliminate render-blocking resources, inline critical CSS, and reduce font display delay.",
          },
          FAIL: {
            message: "FCP is {{actualValue}}ms — user sees a blank screen for too long.",
            suggestion: "Optimize server response time and eliminate blocking external scripts in head.",
          },
        },
      },
      {
        name: "Cumulative Layout Shift (CLS)",
        fieldKey: "speed.cls",
        description: "Visual stability — how much the page layout shifts while loading (mobile).",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.BOTH,
        score: 1,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 0.1,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 0.25,
          config: { strategy: "mobile", metric: "cls" },
        },
        messages: {
          PASS: { message: "CLS is {{actualValue}} — your layout is stable." },
          WARNING: {
            message: "CLS is {{actualValue}} — some elements shift during load.",
            suggestion:
              "Set explicit width/height on images and embeds, and reserve space for dynamic content.",
          },
          FAIL: {
            message: "CLS is {{actualValue}} — your layout shifts significantly during load.",
            suggestion:
              "Add size attributes to all media, avoid inserting content above existing content, and preload web fonts.",
          },
        },
      },
      {
        name: "Total Blocking Time (TBT)",
        fieldKey: "speed.tbt",
        description: "Total time between FCP and TTI where CPU was blocked by long tasks.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 200,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 600,
          config: { strategy: "mobile", metric: "tbt_ms" },
        },
        messages: {
          PASS: { message: "TBT is {{actualValue}}ms — smooth main-thread execution." },
          WARNING: {
            message: "TBT is {{actualValue}}ms — main thread is busy executing JavaScript.",
            suggestion: "Split large JavaScript bundles, defer heavy third-party trackers, and remove unused libraries.",
          },
          FAIL: {
            message: "TBT is {{actualValue}}ms — long JavaScript tasks delay page interactivity.",
            suggestion: "Refactor long tasks, reduce script execution time, and minimize main-thread work.",
          },
        },
      },
      {
        name: "Speed Index",
        fieldKey: "speed.speed_index",
        description: "How quickly the visual contents of the page are populated.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.BOTH,
        score: 1,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 3400,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 5800,
          config: { strategy: "mobile", metric: "speed_index_ms" },
        },
        messages: {
          PASS: { message: "Speed Index is {{actualValue}}ms — content fills the screen rapidly." },
          WARNING: {
            message: "Speed Index is {{actualValue}}ms — visual completion takes longer than ideal.",
            suggestion: "Optimize above-the-fold image delivery and prioritize visible viewport content rendering.",
          },
          FAIL: {
            message: "Speed Index is {{actualValue}}ms — page contents take too long to visually appear.",
            suggestion: "Ensure critical CSS is rendered first and defer non-critical assets.",
          },
        },
      },
      {
        name: "Interaction to Next Paint (INP)",
        fieldKey: "speed.inp",
        description: "Assesses page responsiveness by measuring the latency of all user interactions.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 200,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 500,
          config: { strategy: "mobile", metric: "inp_ms" },
        },
        messages: {
          PASS: { message: "INP is {{actualValue}}ms — responsive user interactions." },
          WARNING: {
            message: "INP is {{actualValue}}ms — interactions experience slight latency.",
            suggestion: "Break up long event handlers and avoid heavy calculations during user input events.",
          },
          FAIL: {
            message: "INP is {{actualValue}}ms — user clicks or taps suffer noticeable delay.",
            suggestion: "Optimize input event listeners, avoid layout thrashing, and minimize main-thread blocking during interactions.",
          },
        },
      },
      {
        name: "Time to Interactive (TTI)",
        fieldKey: "speed.tti",
        description: "Time until the page is fully interactive and responds reliably to inputs.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.PREMIUM,
        score: 1,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 3800,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 7300,
          config: { strategy: "mobile", metric: "tti_ms" },
        },
        messages: {
          PASS: { message: "TTI is {{actualValue}}ms — page becomes usable quickly." },
          WARNING: {
            message: "TTI is {{actualValue}}ms — page takes a while to settle for interaction.",
            suggestion: "Reduce JavaScript payload size and defer initialization of non-critical UI widgets.",
          },
          FAIL: {
            message: "TTI is {{actualValue}}ms — slow interaction readiness.",
            suggestion: "Eliminate unneeded scripts, code-split bundles, and reduce execution overhead.",
          },
        },
      },
      {
        name: "Initial Server Response Time (TTFB)",
        fieldKey: "speed.server_response",
        description: "Time required for the server to send the first byte of HTML.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.PSI_METRIC,
          dataSource: "PSI",
          operator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          maxValue: 600,
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 1200,
          config: { strategy: "mobile", metric: "server_response_ms" },
        },
        messages: {
          PASS: { message: "Server response time is {{actualValue}}ms — fast backend delivery." },
          WARNING: {
            message: "Server response time is {{actualValue}}ms — backend response is somewhat slow.",
            suggestion: "Enable edge caching/CDN, optimize database queries, and use server-side page caching.",
          },
          FAIL: {
            message: "Server response time is {{actualValue}}ms — slow initial connection.",
            suggestion: "Deploy on a high-speed CDN, configure full-page caching, and review hosting resource limits.",
          },
        },
      },
    ],
  },
  {
    name: "SEO",
    slug: "seo",
    shortDescription: "On-page fundamentals search engines rely on to understand your pages.",
    icon: "search",
    displayOrder: 2,
    weight: 2,
    planAccess: PlanAccess.BOTH,
    accentColor: "#0ea5e9",
    checks: [
      {
        name: "Title Tag",
        fieldKey: "seo.title_tag",
        description: "Checks whether the page contains a valid HTML title tag.",
        severity: Severity.CRITICAL,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.META_TAG,
          dataSource: "HTML",
          operator: CriteriaOperator.EXISTS,
          config: { tag: "title" },
        },
        messages: {
          PASS: { message: "Your page contains a title tag." },
          FAIL: {
            message: "Your page is missing a title tag.",
            suggestion:
              "Add a unique and descriptive title tag inside the head section of the page. Keep it relevant to the page topic and preferably between 50 and 60 characters.",
          },
        },
      },
      {
        name: "Title Length",
        fieldKey: "seo.title_length",
        description: "Title tags between 30 and 60 characters display fully in search results.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.TEXT_LENGTH,
          dataSource: "HTML",
          selector: "title",
          operator: CriteriaOperator.BETWEEN,
          minValue: 30,
          maxValue: 60,
          warnOperator: CriteriaOperator.BETWEEN,
          warnMinValue: 10,
          warnMaxValue: 70,
        },
        messages: {
          PASS: { message: "Your title is {{actualValue}} characters — a good length." },
          WARNING: {
            message: "Your title is {{actualValue}} characters — slightly outside the ideal range.",
            suggestion:
              "Aim for 30–60 characters so the full title displays in search results without truncation.",
          },
          FAIL: {
            message: "Your title is {{actualValue}} characters — outside the recommended range.",
            suggestion:
              "Rewrite the title to 30–60 characters. Lead with the page's main topic and include your brand at the end.",
          },
        },
      },
      {
        name: "Meta Description",
        fieldKey: "seo.meta_description",
        description: "Checks for a meta description, which search engines use for result snippets.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.META_TAG,
          dataSource: "HTML",
          attributeName: "description",
          operator: CriteriaOperator.EXISTS,
          config: { tag: "meta", name: "description" },
        },
        messages: {
          PASS: { message: "Your page has a meta description." },
          FAIL: {
            message: "Your page is missing a meta description.",
            suggestion:
              "Add a meta description of 120–160 characters that summarizes the page and encourages clicks from search results.",
          },
        },
      },
      {
        name: "Single H1 Heading",
        fieldKey: "seo.single_h1",
        description: "Each page should have exactly one H1 heading describing its main topic.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.ELEMENT_COUNT,
          dataSource: "HTML",
          selector: "h1",
          operator: CriteriaOperator.EQUALS,
          expectedValue: "1",
          warnOperator: CriteriaOperator.GREATER_THAN,
          warnMinValue: 1,
        },
        messages: {
          PASS: { message: "Your page has exactly one H1 heading." },
          WARNING: {
            message: "Your page has {{count}} H1 headings.",
            suggestion:
              "Use one primary H1 heading that clearly represents the page topic. Convert additional H1 elements into H2 or H3 headings.",
          },
          FAIL: {
            message: "Your page has no H1 heading.",
            suggestion:
              "Add a single H1 heading near the top of the page that clearly describes what the page is about.",
          },
        },
      },
      {
        name: "Canonical Tag",
        fieldKey: "seo.canonical",
        description: "A canonical URL prevents duplicate-content issues.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.PREMIUM,
        inspection: {
          inspectionType: InspectionType.CANONICAL_TAG,
          dataSource: "HTML",
          operator: CriteriaOperator.EXISTS,
        },
        messages: {
          PASS: { message: "A canonical URL is defined: {{actualValue}}" },
          FAIL: {
            message: "No canonical URL is defined.",
            suggestion:
              'Add <link rel="canonical" href="…"> to the head of each page so search engines know which URL is the primary version.',
          },
        },
      },
    ],
  },
  {
    name: "Technical SEO",
    slug: "technical-seo",
    shortDescription: "Crawlability and indexing signals: robots, sitemaps, and status codes.",
    icon: "settings-2",
    displayOrder: 3,
    weight: 1.5,
    planAccess: PlanAccess.BOTH,
    accentColor: "#8b5cf6",
    checks: [
      {
        name: "HTTPS Enabled",
        fieldKey: "tech.https",
        description: "The site should be served over a secure HTTPS connection.",
        severity: Severity.CRITICAL,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.SSL_CHECK,
          dataSource: "NETWORK",
          operator: CriteriaOperator.IS_TRUE,
        },
        messages: {
          PASS: { message: "Your website is served over HTTPS." },
          FAIL: {
            message: "Your website is not served over HTTPS.",
            suggestion:
              "Install an SSL certificate and redirect all HTTP traffic to HTTPS. Most hosts provide free certificates via Let's Encrypt.",
          },
        },
      },
      {
        name: "HTTP Status",
        fieldKey: "tech.http_status",
        description: "The page should return a successful 200 response.",
        severity: Severity.CRITICAL,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.HTTP_STATUS,
          dataSource: "NETWORK",
          operator: CriteriaOperator.EQUALS,
          expectedValue: "200",
        },
        messages: {
          PASS: { message: "The page returned HTTP {{actualValue}}." },
          FAIL: {
            message: "The page returned HTTP {{actualValue}} instead of 200.",
            suggestion:
              "Investigate why the page is not returning a successful response. Fix broken redirects or server errors.",
          },
        },
      },
      {
        name: "robots.txt Present",
        fieldKey: "tech.robots_txt",
        description: "A robots.txt file guides search engine crawlers.",
        severity: Severity.LOW,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.ROBOTS_TXT_CHECK,
          dataSource: "ROBOTS",
          operator: CriteriaOperator.EXISTS,
        },
        messages: {
          PASS: { message: "A robots.txt file was found." },
          FAIL: {
            message: "No robots.txt file was found.",
            suggestion:
              "Create a robots.txt file at {{domain}}/robots.txt to control crawler access and point to your sitemap.",
          },
        },
      },
      {
        name: "XML Sitemap",
        fieldKey: "tech.sitemap",
        description: "An XML sitemap helps search engines discover your pages.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.PREMIUM,
        inspection: {
          inspectionType: InspectionType.SITEMAP_CHECK,
          dataSource: "SITEMAP",
          operator: CriteriaOperator.EXISTS,
        },
        messages: {
          PASS: { message: "An XML sitemap was found." },
          FAIL: {
            message: "No XML sitemap was found.",
            suggestion:
              "Generate an XML sitemap and reference it from robots.txt, then submit it in Google Search Console.",
          },
        },
      },
    ],
  },
  {
    name: "Accessibility",
    slug: "accessibility",
    shortDescription: "How usable your site is for people with disabilities and assistive tech.",
    icon: "accessibility",
    displayOrder: 4,
    weight: 1.5,
    planAccess: PlanAccess.BOTH,
    accentColor: "#10b981",
    checks: [
      {
        name: "Image Alt Text",
        fieldKey: "a11y.img_alt",
        description: "All meaningful images should have descriptive alt attributes.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.IMAGE_ALT_TEXT,
          dataSource: "HTML",
          operator: CriteriaOperator.EQUALS,
          expectedValue: "0",
          warnOperator: CriteriaOperator.LESS_THAN_OR_EQUAL,
          warnMaxValue: 3,
        },
        messages: {
          PASS: { message: "All images have alt attributes." },
          WARNING: {
            message: "{{count}} images are missing alt attributes.",
            suggestion:
              "Add descriptive alt text to every meaningful image. Decorative images can use an empty alt attribute (alt=\"\").",
          },
          FAIL: {
            message: "{{count}} images are missing alt attributes.",
            suggestion:
              "Add descriptive alt text to every meaningful image so screen readers can convey their content. This also helps image SEO.",
          },
        },
      },
      {
        name: "Page Language",
        fieldKey: "a11y.lang",
        description: "The html element should declare the page language.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.BOTH,
        inspection: {
          inspectionType: InspectionType.ATTRIBUTE_EXISTS,
          dataSource: "HTML",
          selector: "html",
          attributeName: "lang",
          operator: CriteriaOperator.EXISTS,
        },
        messages: {
          PASS: { message: "The page declares its language: {{actualValue}}." },
          FAIL: {
            message: "The page does not declare a language.",
            suggestion:
              'Add a lang attribute to the html element (e.g. <html lang="en">) so screen readers use correct pronunciation.',
          },
        },
      },
      {
        name: "Accessibility Score",
        fieldKey: "a11y.lighthouse",
        description: "Lighthouse accessibility score covering contrast, labels, and ARIA.",
        severity: Severity.HIGH,
        planAccess: PlanAccess.PREMIUM,
        score: 2,
        inspection: {
          inspectionType: InspectionType.LIGHTHOUSE_SCORE,
          dataSource: "PSI",
          operator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          minValue: 90,
          warnOperator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          warnMinValue: 70,
          config: { strategy: "mobile", category: "accessibility" },
        },
        messages: {
          PASS: { message: "Your accessibility score is {{actualValue}} — excellent." },
          WARNING: {
            message: "Your accessibility score is {{actualValue}} — decent, with issues to fix.",
            suggestion:
              "Review color contrast, form labels, and link names. Each fix widens your audience and often improves SEO.",
          },
          FAIL: {
            message: "Your accessibility score is {{actualValue}} — significant issues detected.",
            suggestion:
              "Address contrast ratios, missing form labels, and ARIA misuse. Accessibility issues can exclude users and carry legal risk in some regions.",
          },
        },
      },
    ],
  },
  {
    name: "Mobile Usability",
    slug: "mobile",
    shortDescription: "How well your site works on phones and small screens.",
    icon: "smartphone",
    displayOrder: 5,
    weight: 1.5,
    planAccess: PlanAccess.BOTH,
    accentColor: "#f59e0b",
    checks: [
      {
        name: "Viewport Meta Tag",
        fieldKey: "mobile.viewport",
        description: "A viewport meta tag makes the page scale correctly on mobile devices.",
        severity: Severity.CRITICAL,
        planAccess: PlanAccess.BOTH,
        score: 2,
        inspection: {
          inspectionType: InspectionType.MOBILE_VIEWPORT,
          dataSource: "HTML",
          operator: CriteriaOperator.EXISTS,
        },
        messages: {
          PASS: { message: "A viewport meta tag is present." },
          FAIL: {
            message: "No viewport meta tag was found.",
            suggestion:
              'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the head so the page renders correctly on mobile devices.',
          },
        },
      },
    ],
  },
  {
    name: "Security",
    slug: "security",
    shortDescription: "Headers and transport settings that protect your visitors.",
    icon: "shield",
    displayOrder: 6,
    weight: 1.5,
    planAccess: PlanAccess.BOTH,
    accentColor: "#ef4444",
    checks: [
      {
        name: "Strict-Transport-Security",
        fieldKey: "security.hsts",
        description: "HSTS forces browsers to always use HTTPS for your domain.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.PREMIUM,
        inspection: {
          inspectionType: InspectionType.RESPONSE_HEADER,
          dataSource: "HEADERS",
          attributeName: "strict-transport-security",
          operator: CriteriaOperator.EXISTS,
        },
        messages: {
          PASS: { message: "The Strict-Transport-Security header is set." },
          FAIL: {
            message: "The Strict-Transport-Security header is missing.",
            suggestion:
              "Add the header Strict-Transport-Security: max-age=31536000; includeSubDomains to force HTTPS and protect against downgrade attacks.",
          },
        },
      },
      {
        name: "X-Content-Type-Options",
        fieldKey: "security.nosniff",
        description: "Prevents browsers from MIME-sniffing responses away from the declared type.",
        severity: Severity.LOW,
        planAccess: PlanAccess.PREMIUM,
        inspection: {
          inspectionType: InspectionType.RESPONSE_HEADER,
          dataSource: "HEADERS",
          attributeName: "x-content-type-options",
          operator: CriteriaOperator.EQUALS,
          expectedValue: "nosniff",
        },
        messages: {
          PASS: { message: "The X-Content-Type-Options header is set to nosniff." },
          FAIL: {
            message: "The X-Content-Type-Options header is missing or misconfigured.",
            suggestion: "Add the header X-Content-Type-Options: nosniff to all responses.",
          },
        },
      },
    ],
  },
  {
    name: "Conversion Optimization",
    slug: "cro",
    shortDescription: "Elements that turn visitors into customers: CTAs, forms, and trust signals.",
    icon: "trending-up",
    displayOrder: 7,
    weight: 1,
    planAccess: PlanAccess.PREMIUM,
    accentColor: "#7c3aed",
    checks: [
      {
        name: "Call-to-Action Present",
        fieldKey: "cro.cta",
        description: "The page should have at least one clear call-to-action element.",
        severity: Severity.MEDIUM,
        planAccess: PlanAccess.PREMIUM,
        inspection: {
          inspectionType: InspectionType.CTA_CHECK,
          dataSource: "HTML",
          operator: CriteriaOperator.GREATER_THAN_OR_EQUAL,
          minValue: 1,
        },
        messages: {
          PASS: { message: "Found {{count}} call-to-action elements." },
          FAIL: {
            message: "No clear call-to-action was detected.",
            suggestion:
              "Add a prominent, action-oriented button above the fold (e.g. \"Get Started\", \"Request a Quote\") so visitors always know the next step.",
          },
        },
      },
      {
        name: "Contact Information",
        fieldKey: "cro.contact",
        description: "Visible contact details build trust with potential customers.",
        severity: Severity.LOW,
        planAccess: PlanAccess.PREMIUM,
        inspection: {
          inspectionType: InspectionType.RULES_EVALUATOR,
          dataSource: "HTML",
          operator: CriteriaOperator.IS_TRUE,
          config: {
            rules: { or: [{ var: "contact.hasEmail" }, { var: "contact.hasPhone" }] },
          },
        },
        messages: {
          PASS: { message: "Contact information was found on the page." },
          FAIL: {
            message: "No contact information was detected.",
            suggestion:
              "Display an email address or phone number prominently — ideally in the header or footer — so visitors can reach you easily.",
          },
        },
      },
    ],
  },
];

async function seedDefaultTemplate(adminId: string) {
  const existing = await db.reportTemplate.findFirst({ where: { isDefault: true } });
  if (existing) {
    console.log("✓ Default report template already exists — skipping");
    return existing;
  }

  const template = await db.reportTemplate.create({
    data: {
      name: "Standard Website Audit",
      description: "The default AuditFlow report template.",
      isDefault: true,
      createdById: adminId,
    },
  });

  const version = await db.templateVersion.create({
    data: {
      templateId: template.id,
      versionNumber: 1,
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedById: adminId,
      changelog: "Initial template",
    },
  });

  for (const section of SECTIONS) {
    const sectionRow = await db.reportSection.create({
      data: {
        templateVersionId: version.id,
        name: section.name,
        slug: section.slug,
        shortDescription: section.shortDescription,
        icon: section.icon,
        displayOrder: section.displayOrder,
        weight: section.weight,
        planAccess: section.planAccess,
        isSystem: section.isSystem ?? false,
        accentColor: section.accentColor,
      },
    });

    let order = 1;
    for (const check of section.checks) {
      const field = await db.auditField.create({
        data: {
          sectionId: sectionRow.id,
          name: check.name,
          fieldKey: check.fieldKey,
          description: check.description,
          displayOrder: order++,
          planAccess: check.planAccess,
          severity: check.severity,
          score: check.score ?? 1,
        },
      });

      await db.auditCriteria.create({
        data: {
          fieldId: field.id,
          inspectionType: check.inspection.inspectionType,
          dataSource: check.inspection.dataSource ?? "HTML",
          selector: check.inspection.selector,
          attributeName: check.inspection.attributeName,
          operator: check.inspection.operator,
          expectedValue: check.inspection.expectedValue,
          minValue: check.inspection.minValue,
          maxValue: check.inspection.maxValue,
          warnOperator: check.inspection.warnOperator,
          warnMinValue: check.inspection.warnMinValue,
          warnMaxValue: check.inspection.warnMaxValue,
          config: (check.inspection.config ?? {}) as never,
        },
      });

      for (const [status, content] of Object.entries(check.messages)) {
        await db.auditSuggestion.create({
          data: {
            fieldId: field.id,
            forStatus: status as CheckStatus,
            message: content.message,
            suggestion: content.suggestion,
          },
        });
      }
    }
  }

  console.log(
    `✓ Default template seeded: ${SECTIONS.length} sections, ${SECTIONS.reduce((n, s) => n + s.checks.length, 0)} checks`,
  );
  return template;
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log("Seeding AuditFlow database…");
  const admin = await seedMasterAdmin();
  await seedPlans();
  await seedSettings();
  await seedDefaultTemplate(admin.id);
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
