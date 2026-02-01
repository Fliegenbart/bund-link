/**
 * Domain utilities for BundLink
 * - Domain whitelist validation
 * - Wildcard pattern matching
 * - External link detection
 */

import { DEFAULT_TRUSTED_DOMAINS } from "@shared/schema";

/**
 * Check if a URL matches a domain pattern
 * Supports wildcards: *.example.de matches sub.example.de, deep.sub.example.de
 */
export function matchesDomainPattern(url: string, pattern: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const normalizedPattern = pattern.toLowerCase().trim();

    // Exact match
    if (hostname === normalizedPattern) {
      return true;
    }

    // Wildcard match (*.example.de)
    if (normalizedPattern.startsWith("*.")) {
      const baseDomain = normalizedPattern.slice(2); // Remove "*."

      // Check if hostname ends with the base domain
      // AND either equals it or has a subdomain (preceded by a dot)
      if (hostname === baseDomain) {
        return true;
      }
      if (hostname.endsWith("." + baseDomain)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if a URL matches any pattern in a whitelist
 */
export function matchesWhitelist(url: string, whitelist: string[]): boolean {
  return whitelist.some((pattern) => matchesDomainPattern(url, pattern));
}

/**
 * Check if a URL is a trusted German government domain
 * Uses the default list plus any custom patterns
 */
export function isTrustedDomain(
  url: string,
  additionalPatterns: string[] = []
): boolean {
  const allPatterns = [...DEFAULT_TRUSTED_DOMAINS, ...additionalPatterns];
  return matchesWhitelist(url, allPatterns);
}

/**
 * Check if a URL points to an external (non-whitelisted) domain
 */
export function isExternalLink(
  url: string,
  whitelist: string[] = [...DEFAULT_TRUSTED_DOMAINS]
): boolean {
  return !matchesWhitelist(url, whitelist);
}

/**
 * Extract the hostname from a URL safely
 */
export function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Validate that a destination URL is allowed based on tenant settings
 *
 * @returns { allowed: true } or { allowed: false, reason: string }
 */
export function validateDestinationUrl(
  url: string,
  options: {
    whitelistMode: "warn" | "block" | "allow";
    whitelist: string[];
  }
): { allowed: true } | { allowed: false; reason: string } {
  // Always validate URL format first
  try {
    new URL(url);
  } catch {
    return { allowed: false, reason: "Ungültige URL" };
  }

  // In "allow" mode, everything is permitted
  if (options.whitelistMode === "allow") {
    return { allowed: true };
  }

  // Check against whitelist
  const isWhitelisted = matchesWhitelist(url, options.whitelist);

  // In "warn" mode, external links are allowed but flagged
  if (options.whitelistMode === "warn") {
    return { allowed: true };
  }

  // In "block" mode, only whitelisted domains are allowed
  if (options.whitelistMode === "block" && !isWhitelisted) {
    const hostname = extractHostname(url);
    return {
      allowed: false,
      reason: `Domain "${hostname}" ist nicht in der Whitelist. Nur Links zu vertrauenswürdigen Domains sind erlaubt.`,
    };
  }

  return { allowed: true };
}

/**
 * Parse and normalize a domain pattern for storage
 */
export function normalizeDomainPattern(pattern: string): string {
  let normalized = pattern.toLowerCase().trim();

  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, "");

  // Remove trailing slashes and paths
  normalized = normalized.split("/")[0];

  return normalized;
}

/**
 * Validate a domain pattern for whitelist entry
 */
export function isValidDomainPattern(pattern: string): boolean {
  const normalized = normalizeDomainPattern(pattern);

  // Basic validation
  if (!normalized || normalized.length < 3) {
    return false;
  }

  // Check for valid characters
  const validPattern = /^(\*\.)?[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*\.[a-z]{2,}$/;
  return validPattern.test(normalized);
}
