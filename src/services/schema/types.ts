/**
 * Schema Markup & Structured Data Types
 */

export type SchemaFormat = "JSON-LD" | "Microdata" | "RDFa";

export type SchemaIssueSeverity = "Error" | "Warning" | "Opportunity";

export type SchemaIssueType =
  | "SYNTAX_ERROR"
  | "MISSING_CONTEXT"
  | "MISSING_TYPE"
  | "INVALID_TYPE"
  | "MISSING_REQUIRED_FIELD"
  | "MISSING_RECOMMENDED_FIELD"
  | "INVALID_FORMAT"
  | "INVALID_DATE"
  | "INVALID_URL"
  | "INVALID_PRICE"
  | "PROTOCOL_HTTP"
  | "CIRCULAR_REFERENCE"
  | "EMPTY_FIELD"
  | "DUPLICATE_SCHEMA";

export interface ExtractedSchemaItem {
  id: string;
  schemaType: string;
  format: SchemaFormat;
  rawJson: Record<string, unknown>;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: SchemaIssueItem[];
}

export interface SchemaIssueItem {
  id?: string;
  schemaType: string;
  field?: string;
  issueType: SchemaIssueType;
  severity: SchemaIssueSeverity;
  message: string;
  recommendation: string;
}

export interface SchemaValidationResult {
  overallScore: number; // 0-100
  totalSchemas: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  opportunityCount: number;
  detectedTypes: string[];
  items: ExtractedSchemaItem[];
  issues: SchemaIssueItem[];
  summary: {
    hasOrganization: boolean;
    hasBreadcrumb: boolean;
    hasArticle: boolean;
    hasProduct: boolean;
    hasFAQ: boolean;
    hasLocalBusiness: boolean;
    hasWebsiteSearch: boolean;
    hasReviewRating: boolean;
    richResultsEligible: string[];
  };
}

export interface SchemaGeneratorInput {
  type:
    | "Organization"
    | "LocalBusiness"
    | "Article"
    | "Product"
    | "FAQPage"
    | "BreadcrumbList"
    | "WebSite"
    | "SoftwareApplication"
    | "Event"
    | "HowTo"
    | "Person"
    | "JobPosting";
  data: Record<string, unknown>;
}
