import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireRole } from "../middleware/authorization";
import {
  isAIAvailable,
  generateMetadataFromUrl,
  analyzeUrlForPhishing,
  suggestRoutingRules,
} from "../lib/ai";
import { storage } from "../storage";

/**
 * AI-powered features routes
 */
export function registerAIRoutes(app: Express) {
  /**
   * GET /api/ai/status
   * Check if AI features are available
   */
  app.get("/api/ai/status", async (_req, res) => {
    res.json({
      available: isAIAvailable(),
      features: isAIAvailable()
        ? ["metadata-generation", "phishing-detection", "routing-suggestions"]
        : [],
    });
  });

  /**
   * POST /api/ai/generate-metadata
   * Generate title and description from a URL
   */
  app.post(
    "/api/ai/generate-metadata",
    isAuthenticated,
    requireRole("local", "state", "federal"),
    async (req, res) => {
      try {
        const { url } = req.body;

        if (!url) {
          return res.status(400).json({ message: "URL is required" });
        }

        if (!isAIAvailable()) {
          return res.status(503).json({
            message: "AI service not available",
            fallback: true,
          });
        }

        const metadata = await generateMetadataFromUrl(url);

        if (metadata) {
          res.json({
            success: true,
            ...metadata,
          });
        } else {
          res.status(500).json({
            message: "Failed to generate metadata",
            fallback: true,
          });
        }
      } catch (error) {
        console.error("Error generating metadata:", error);
        res.status(500).json({ message: "Failed to generate metadata" });
      }
    }
  );

  /**
   * POST /api/ai/analyze-url
   * Analyze a URL for phishing indicators
   */
  app.post(
    "/api/ai/analyze-url",
    isAuthenticated,
    requireRole("state", "federal"),
    async (req, res) => {
      try {
        const { url } = req.body;

        if (!url) {
          return res.status(400).json({ message: "URL is required" });
        }

        if (!isAIAvailable()) {
          return res.status(503).json({
            message: "AI service not available",
            fallback: {
              riskScore: 50,
              isLikelySafe: true,
              reasons: ["AI analysis not available - manual review recommended"],
            },
          });
        }

        const analysis = await analyzeUrlForPhishing(url);

        if (analysis) {
          res.json({
            success: true,
            ...analysis,
          });
        } else {
          res.status(500).json({ message: "Failed to analyze URL" });
        }
      } catch (error) {
        console.error("Error analyzing URL:", error);
        res.status(500).json({ message: "Failed to analyze URL" });
      }
    }
  );

  /**
   * POST /api/ai/suggest-routing
   * Suggest routing rules for a link
   */
  app.post(
    "/api/ai/suggest-routing/:linkId",
    isAuthenticated,
    requireRole("local", "state", "federal"),
    async (req: any, res) => {
      try {
        const { linkId } = req.params;

        const link = await storage.getLink(linkId);
        if (!link) {
          return res.status(404).json({ message: "Link not found" });
        }

        if (!isAIAvailable()) {
          return res.status(503).json({
            message: "AI service not available",
            suggestions: [],
          });
        }

        const currentRules = await storage.getRoutingRulesByLink(linkId);
        const suggestions = await suggestRoutingRules(link.destinationUrl, currentRules);

        if (suggestions) {
          res.json({
            success: true,
            ...suggestions,
          });
        } else {
          res.json({
            success: true,
            suggestions: [],
          });
        }
      } catch (error) {
        console.error("Error suggesting routing rules:", error);
        res.status(500).json({ message: "Failed to suggest routing rules" });
      }
    }
  );

  /**
   * POST /api/reports/:id/ai-analyze
   * Use AI to analyze a reported link
   */
  app.post(
    "/api/reports/:id/ai-analyze",
    isAuthenticated,
    requireRole("state", "federal"),
    async (req, res) => {
      try {
        const { id } = req.params;

        // Get the report and associated link
        const reports = await storage.getReports();
        const report = reports.find((r) => r.id === id);

        if (!report) {
          return res.status(404).json({ message: "Report not found" });
        }

        const link = await storage.getLink(report.linkId);
        if (!link) {
          return res.status(404).json({ message: "Associated link not found" });
        }

        if (!isAIAvailable()) {
          return res.status(503).json({
            message: "AI service not available",
            recommendation: "manual_review",
          });
        }

        const analysis = await analyzeUrlForPhishing(link.destinationUrl);

        if (analysis) {
          res.json({
            success: true,
            linkId: link.id,
            shortCode: link.shortCode,
            destinationUrl: link.destinationUrl,
            analysis,
            recommendation:
              analysis.riskScore >= 70
                ? "deactivate"
                : analysis.riskScore >= 40
                ? "review"
                : "likely_safe",
          });
        } else {
          res.json({
            success: false,
            recommendation: "manual_review",
          });
        }
      } catch (error) {
        console.error("Error analyzing report:", error);
        res.status(500).json({ message: "Failed to analyze report" });
      }
    }
  );
}
