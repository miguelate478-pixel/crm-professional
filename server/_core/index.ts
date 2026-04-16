import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Init SQLite database and seed default data
  await initDb();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check for Railway/Render
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // WhatsApp webhook verification (GET)
  app.get("/api/whatsapp/webhook", (req, res) => {
    const { verifyWebhook } = require("./_core/whatsapp") as typeof import("./_core/whatsapp");
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;
    const result = verifyWebhook(mode, token, challenge);
    if (result) { res.status(200).send(result); }
    else { res.status(403).json({ error: "Forbidden" }); }
  });

  // WhatsApp webhook incoming messages (POST)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    res.status(200).json({ status: "ok" }); // Always respond 200 fast
    try {
      const { parseWebhookPayload } = await import("./_core/whatsapp");
      const messages = parseWebhookPayload(req.body);
      for (const msg of messages) {
        if (!msg.text) continue;
        // Find which org this phone belongs to
        const dbModule = await import("./db");
        // Save as inbound for all orgs that have this contact (simplified: save to org 1 if not found)
        const contact = await dbModule.findContactByPhone(1, msg.from);
        const lead = await dbModule.findLeadByPhone(1, msg.from);
        await dbModule.saveWhatsAppMessage({
          organizationId: 1,
          direction: "inbound",
          phone: msg.from,
          message: msg.text,
          messageId: msg.messageId,
          status: "received",
          contactId: contact?.id,
          leadId: lead?.id,
        });
        console.log(`[WhatsApp] Inbound from ${msg.from}: ${msg.text}`);
      }
    } catch (e) {
      console.error("[WhatsApp] Webhook processing error:", e);
    }
  });

  // WhatsApp status (check if configured)
  app.get("/api/whatsapp/status", async (req, res) => {
    const { isWhatsAppConfigured } = await import("./_core/whatsapp");
    res.json({ configured: isWhatsAppConfigured() });
  });

  // Auth routes (dev-login, logout)
  registerAuthRoutes(app);

  // tRPC API
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`);

  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
