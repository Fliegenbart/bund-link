import maxmind, { CountryResponse, Reader } from "maxmind";
import path from "path";
import fs from "fs";

interface GeoLocation {
  country: string;
  region?: string;
}

let geoipReader: Reader<CountryResponse> | null = null;
let geoipInitialized = false;

/**
 * Initialize the GeoIP database reader
 * Falls back gracefully if database is not available
 */
export async function initGeoIP(): Promise<boolean> {
  if (geoipInitialized) {
    return geoipReader !== null;
  }

  const dbPath = process.env.GEOIP_DB_PATH || path.join(process.cwd(), "geoip", "GeoLite2-Country.mmdb");

  try {
    if (fs.existsSync(dbPath)) {
      geoipReader = await maxmind.open<CountryResponse>(dbPath);
      console.log("[GeoIP] Database loaded successfully from:", dbPath);
      geoipInitialized = true;
      return true;
    } else {
      console.log("[GeoIP] Database not found at:", dbPath);
      console.log("[GeoIP] To enable GeoIP, download GeoLite2-Country.mmdb from MaxMind");
      console.log("[GeoIP] Set GEOIP_DB_PATH environment variable to specify custom path");
      geoipInitialized = true;
      return false;
    }
  } catch (error) {
    console.error("[GeoIP] Failed to load database:", error);
    geoipInitialized = true;
    return false;
  }
}

/**
 * Get country code from IP address
 * Returns "DE" as fallback if GeoIP is not available or lookup fails
 */
export function getCountryFromIP(ip: string): string {
  if (!geoipReader) {
    return "DE"; // Fallback for German service
  }

  try {
    // Handle localhost and private IPs
    if (isPrivateIP(ip)) {
      return "DE";
    }

    const result = geoipReader.get(ip);
    return result?.country?.iso_code || "DE";
  } catch (error) {
    console.error("[GeoIP] Lookup failed for IP:", ip, error);
    return "DE";
  }
}

/**
 * Get detailed location info from IP address
 */
export function getLocationFromIP(ip: string): GeoLocation {
  if (!geoipReader) {
    return { country: "DE" };
  }

  try {
    if (isPrivateIP(ip)) {
      return { country: "DE" };
    }

    const result = geoipReader.get(ip);
    return {
      country: result?.country?.iso_code || "DE",
      // Note: GeoLite2-Country doesn't include region data
      // Use GeoLite2-City for region/state information
      region: undefined,
    };
  } catch (error) {
    return { country: "DE" };
  }
}

/**
 * Check if an IP is private (localhost, LAN, etc.)
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (ip.startsWith("10.") ||
      ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") ||
      ip.startsWith("172.19.") || ip.startsWith("172.20.") || ip.startsWith("172.21.") ||
      ip.startsWith("172.22.") || ip.startsWith("172.23.") || ip.startsWith("172.24.") ||
      ip.startsWith("172.25.") || ip.startsWith("172.26.") || ip.startsWith("172.27.") ||
      ip.startsWith("172.28.") || ip.startsWith("172.29.") || ip.startsWith("172.30.") ||
      ip.startsWith("172.31.") ||
      ip.startsWith("192.168.") ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "localhost") {
    return true;
  }

  // IPv6 private ranges
  if (ip.startsWith("fe80:") || ip.startsWith("fc00:") || ip.startsWith("fd00:")) {
    return true;
  }

  return false;
}

/**
 * Get the real client IP from request headers
 * Handles proxies and load balancers
 */
export function getClientIP(req: any): string {
  // Check various headers in order of preference
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return realIP;
  }

  // Check for Cloudflare
  const cfConnectingIP = req.headers["cf-connecting-ip"];
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to socket address
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
}

/**
 * Check if GeoIP is available
 */
export function isGeoIPAvailable(): boolean {
  return geoipReader !== null;
}
