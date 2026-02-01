/**
 * Privacy utilities for GDPR-compliant data handling
 * - IP anonymization
 * - Data minimization helpers
 */

import type { PrivacySettings } from "@shared/schema";

/**
 * Anonymize an IP address based on privacy settings
 *
 * Levels:
 * - "none": Return IP as-is (not recommended for GDPR)
 * - "partial": Zero out last octet (IPv4) or last 80 bits (IPv6)
 * - "full": Return null (no IP stored)
 */
export function anonymizeIp(
  ip: string | undefined,
  level: PrivacySettings["ipAnonymization"]
): string | null {
  if (!ip || level === "full") {
    return null;
  }

  if (level === "none") {
    return ip;
  }

  // Partial anonymization
  const trimmedIp = ip.trim();

  // Handle IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (trimmedIp.startsWith("::ffff:")) {
    const ipv4Part = trimmedIp.slice(7);
    const anonymized = anonymizeIpv4(ipv4Part);
    return anonymized ? `::ffff:${anonymized}` : null;
  }

  // Check if IPv4
  if (trimmedIp.includes(".") && !trimmedIp.includes(":")) {
    return anonymizeIpv4(trimmedIp);
  }

  // IPv6
  return anonymizeIpv6(trimmedIp);
}

/**
 * Anonymize IPv4 by zeroing last octet
 * 192.168.1.123 -> 192.168.1.0
 */
function anonymizeIpv4(ip: string): string | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  parts[3] = "0";
  return parts.join(".");
}

/**
 * Anonymize IPv6 by zeroing last 80 bits (last 5 groups)
 * 2001:db8:85a3:8d3:1319:8a2e:370:7348 -> 2001:db8:85a3::
 */
function anonymizeIpv6(ip: string): string | null {
  // Expand shortened IPv6 first
  const expanded = expandIpv6(ip);
  if (!expanded) {
    return null;
  }

  const parts = expanded.split(":");
  if (parts.length !== 8) {
    return null;
  }

  // Keep first 3 groups, zero rest
  const anonymized = [...parts.slice(0, 3), "0", "0", "0", "0", "0"];
  return compressIpv6(anonymized.join(":"));
}

/**
 * Expand a shortened IPv6 address to full form
 */
function expandIpv6(ip: string): string | null {
  try {
    // Handle :: expansion
    if (ip.includes("::")) {
      const parts = ip.split("::");
      if (parts.length > 2) return null;

      const left = parts[0] ? parts[0].split(":") : [];
      const right = parts[1] ? parts[1].split(":") : [];
      const missing = 8 - left.length - right.length;

      if (missing < 0) return null;

      const middle = Array(missing).fill("0000");
      const full = [...left, ...middle, ...right];

      return full.map((p) => p.padStart(4, "0")).join(":");
    }

    const parts = ip.split(":");
    if (parts.length !== 8) return null;

    return parts.map((p) => p.padStart(4, "0")).join(":");
  } catch {
    return null;
  }
}

/**
 * Compress an IPv6 address (remove leading zeros, use ::)
 */
function compressIpv6(ip: string): string {
  // Remove leading zeros from each group
  const parts = ip.split(":").map((p) => p.replace(/^0+/, "") || "0");

  // Find longest run of zeros for :: compression
  let longestStart = -1;
  let longestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "0") {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentLength > longestLength) {
        longestStart = currentStart;
        longestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }

  if (currentLength > longestLength) {
    longestStart = currentStart;
    longestLength = currentLength;
  }

  // Apply :: compression if beneficial
  if (longestLength > 1) {
    const before = parts.slice(0, longestStart);
    const after = parts.slice(longestStart + longestLength);

    if (before.length === 0 && after.length === 0) {
      return "::";
    } else if (before.length === 0) {
      return "::" + after.join(":");
    } else if (after.length === 0) {
      return before.join(":") + "::";
    } else {
      return before.join(":") + "::" + after.join(":");
    }
  }

  return parts.join(":");
}

/**
 * Get client IP from request, handling proxies
 */
export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string | undefined {
  // Check X-Forwarded-For header (from reverse proxy)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    // Take the first IP (original client)
    const firstIp = forwardedStr.split(",")[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Check X-Real-IP header
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to direct connection IP
  return req.ip || req.socket?.remoteAddress;
}

/**
 * Prepare analytics data based on privacy settings
 */
export function prepareAnalyticsData(
  rawData: {
    country?: string;
    region?: string;
    language?: string;
    deviceType?: string;
    referrer?: string;
    ip?: string;
  },
  settings: PrivacySettings
): {
  country: string | null;
  region: string | null;
  language: string | null;
  deviceType: string | null;
  referrer: string | null;
  anonymizedIp: string | null;
} {
  return {
    country: settings.collectGeoData ? (rawData.country || null) : null,
    region: settings.collectGeoData ? (rawData.region || null) : null,
    language: rawData.language || null,
    deviceType: settings.collectDeviceType ? (rawData.deviceType || null) : null,
    referrer: settings.collectReferrer ? (rawData.referrer || null) : null,
    anonymizedIp: anonymizeIp(rawData.ip, settings.ipAnonymization),
  };
}
