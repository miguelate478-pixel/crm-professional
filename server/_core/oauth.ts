import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // ── Dev login bypass (only in development, no OAuth needed) ──────────────
  if (process.env.NODE_ENV === "development") {
    app.get("/api/dev-login", async (req: Request, res: Response) => {
      try {
        const devOpenId = "dev-user-local-001";
        const devName = "Admin Local";
        const devEmail = "admin@crmpro.local";

        // Ensure organization exists
        const dbInstance = await db.getDb();
        let organizationId = 1;

        if (dbInstance) {
          const { organizations } = await import("../../drizzle/schema");
          // Try to get or create org with id=1
          try {
            await dbInstance.insert(organizations).values({
              id: 1,
              name: "Mi Empresa",
              slug: "mi-empresa",
            } as any);
          } catch {
            // Already exists, that's fine
          }
        }

        // Upsert dev user
        await db.upsertUser({
          openId: devOpenId,
          organizationId,
          name: devName,
          email: devEmail,
          loginMethod: "dev",
          role: "admin",
          lastSignedIn: new Date().toISOString(),
        });

        // Create a valid session JWT
        const sessionToken = await sdk.createSessionToken(devOpenId, {
          name: devName,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
          // In dev allow non-secure
          secure: false,
          sameSite: "lax",
        });

        res.redirect(302, "/");
      } catch (error) {
        console.error("[DevLogin] Failed:", error);
        res.status(500).json({ error: "Dev login failed", details: String(error) });
      }
    });
  }

  // ── OAuth callback ────────────────────────────────────────────────────────
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      let user = await db.getUserByOpenId(userInfo.openId);
      let organizationId: number = user?.organizationId || 1;
      
      if (!user?.organizationId) {
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { organizations } = await import("../../drizzle/schema");
          const orgResult = await dbInstance.insert(organizations).values({
            name: `${userInfo.name || 'Organization'}'s Workspace`,
            slug: `org-${userInfo.openId.substring(0, 8)}-${Date.now()}`,
          });
          organizationId = (orgResult as any).insertId || 1;
        }
      }
      
      await db.upsertUser({
        openId: userInfo.openId,
        organizationId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date().toISOString(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
