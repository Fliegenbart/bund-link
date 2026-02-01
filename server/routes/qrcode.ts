import type { Express } from "express";
import QRCode from "qrcode";
import { isAuthenticated } from "../replitAuth";
import { canAccessLink } from "../middleware/authorization";
import { storage } from "../storage";

/**
 * QR Code Generation Routes
 */
export function registerQrCodeRoutes(app: Express) {
  /**
   * GET /api/links/:id/qr
   * Generate QR code for a link
   * Query params:
   * - format: "svg" | "png" | "dataurl" (default: svg)
   * - size: number (default: 200)
   * - dark: hex color for dark modules (default: #000000)
   * - light: hex color for light modules (default: #ffffff)
   */
  app.get("/api/links/:id/qr", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { id } = req.params;
      const format = (req.query.format as string) || "svg";
      const size = parseInt(req.query.size as string) || 200;
      const darkColor = (req.query.dark as string) || "#000000";
      const lightColor = (req.query.light as string) || "#ffffff";

      const link = await storage.getLink(id);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Construct the full short URL
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const shortUrl = `${baseUrl}/${link.shortCode}`;

      const qrOptions = {
        width: size,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      };

      switch (format.toLowerCase()) {
        case "svg":
          const svgString = await QRCode.toString(shortUrl, {
            ...qrOptions,
            type: "svg",
          });
          res.setHeader("Content-Type", "image/svg+xml");
          res.setHeader("Content-Disposition", `inline; filename="qr-${link.shortCode}.svg"`);
          res.send(svgString);
          break;

        case "png":
          const pngBuffer = await QRCode.toBuffer(shortUrl, {
            ...qrOptions,
            type: "png",
          });
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Content-Disposition", `attachment; filename="qr-${link.shortCode}.png"`);
          res.send(pngBuffer);
          break;

        case "dataurl":
          const dataUrl = await QRCode.toDataURL(shortUrl, qrOptions);
          res.json({ dataUrl, shortUrl });
          break;

        default:
          res.status(400).json({ message: "Invalid format. Use: svg, png, or dataurl" });
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  /**
   * GET /api/links/:id/qr/download
   * Force download of QR code as PNG
   */
  app.get("/api/links/:id/qr/download", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { id } = req.params;
      const size = parseInt(req.query.size as string) || 400;

      const link = await storage.getLink(id);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const shortUrl = `${baseUrl}/${link.shortCode}`;

      const pngBuffer = await QRCode.toBuffer(shortUrl, {
        width: size,
        margin: 2,
        type: "png",
      });

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="bundlink-qr-${link.shortCode}.png"`);
      res.send(pngBuffer);
    } catch (error) {
      console.error("Error generating QR code download:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });
}
