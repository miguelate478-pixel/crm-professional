/**
 * Auth seguro con bcrypt, rate limiting, sesiones con expiración y audit log.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookies } from "cookie";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import type { User } from "../../drizzle/schema";
import { getSessionCookieOptions } from "./cookies";

const __dirname_auth = path.dirname(fileURLToPath(import.meta.url));

function getAuthDbPath(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) return envUrl.startsWith("file:") ? envUrl.slice(5) : envUrl;
  return path.join(__dirname_auth, "..", "..", "crm.db");
}

const DB_PATH = getAuthDbPath();

const JWT_SECRET = process.env.JWT_SECRET || "crm-pro-dev-secret-2024-local";
const SESSION_DURATION = process.env.NODE_ENV === "production" ? "8h" : "30d";
const secret = new TextEncoder().encode(JWT_SECRET);

// ── Rate limiting (in-memory, simple) ────────────────────────────────────────

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// ── Dev user fallback ─────────────────────────────────────────────────────────

const DEV_USER: User = {
  id: 1,
  organizationId: 1,
  openId: "dev-admin-001",
  name: "Admin CRM",
  email: "admin@crmpro.local",
  loginMethod: "dev",
  role: "admin",
  avatar: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSignedIn: new Date().toISOString(),
};

// ── JWT helpers ───────────────────────────────────────────────────────────────

export async function signSession(openId: string, name: string): Promise<string> {
  return new SignJWT({ openId, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);
}

export async function verifySession(
  token: string | undefined
): Promise<{ openId: string; name: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const { openId, name } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || typeof name !== "string") return null;
    return { openId, name };
  } catch {
    return null;
  }
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Get user from request ─────────────────────────────────────────────────────

export async function getUserFromRequest(req: Request): Promise<User | null> {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];
    const session = await verifySession(token);
    if (!session) return null;

    try {
      const db = await import("../db");
      const user = await db.getUserByOpenId(session.openId);
      if (user) {
        if (!user.isActive) return null; // Blocked user
        return user;
      }
    } catch {
      // DB not available
    }

    if (session.openId === DEV_USER.openId) {
      return { ...DEV_USER, lastSignedIn: new Date().toISOString() };
    }

    return null;
  } catch {
    return null;
  }
}

// ── Auth routes ───────────────────────────────────────────────────────────────

export function registerAuthRoutes(app: Express) {

  // POST /api/login — secure login with bcrypt + rate limiting
  app.post("/api/login", async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      res.status(429).json({
        error: "Demasiados intentos fallidos. Espera 15 minutos.",
        retryAfter: 900,
      });
      return;
    }

    try {
      const { email, password } = req.body || {};

      if (!email?.trim() || !password?.trim()) {
        res.status(400).json({ error: "Email y contraseña son requeridos" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Email inválido" });
        return;
      }

      let user: User | null = null;

      try {
        const db = await import("../db");

        // Find user by email
        user = await db.getUserByEmail(email.toLowerCase().trim());

        if (user) {
          // Verify password if user has one
          const passwordHash = await db.getUserPasswordHash(user.openId);
          if (passwordHash) {
            const valid = await verifyPassword(password, passwordHash);
            if (!valid) {
              res.status(401).json({ error: "Credenciales inválidas", remaining });
              return;
            }
          }
          // No password hash = dev/oauth user, allow in dev mode
          else if (process.env.NODE_ENV === "production") {
            res.status(401).json({ error: "Credenciales inválidas" });
            return;
          }
        } else if (process.env.NODE_ENV !== "production") {
          // Dev: auto-create user
          const hash = await hashPassword(password);
          await db.createUserWithPassword({
            email: email.toLowerCase().trim(),
            name: email.split("@")[0],
            passwordHash: hash,
            organizationId: 1,
            role: "user",
          });
          user = await db.getUserByEmail(email.toLowerCase().trim());
        } else {
          res.status(401).json({ error: "Credenciales inválidas" });
          return;
        }
      } catch (e) {
        console.error("[Login] DB error:", e);
        // Fallback to dev user
        if (process.env.NODE_ENV !== "production") {
          user = DEV_USER;
        } else {
          res.status(500).json({ error: "Error interno del servidor" });
          return;
        }
      }

      if (!user) {
        res.status(401).json({ error: "Credenciales inválidas" });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: "Cuenta desactivada. Contacta al administrador." });
        return;
      }

      // Success — reset rate limit and create session
      resetRateLimit(ip);

      // Log the login
      try {
        const db = await import("../db");
        await db.logAudit({
          organizationId: user.organizationId,
          userId: user.id,
          action: "login",
          entityType: "user",
          entityId: user.id,
          ipAddress: ip,
        });
        await db.updateLastSignedIn(user.openId);
      } catch { /* non-critical */ }

      const token = await signSession(user.openId, user.name ?? email);
      const opts = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, token, {
        ...opts,
        maxAge: process.env.NODE_ENV === "production" ? 8 * 60 * 60 * 1000 : ONE_YEAR_MS,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      });

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("[Login] Error:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // GET /api/dev-login — only in development
  app.get("/api/dev-login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      try {
        const db = await import("../db");
        await db.upsertUser({
          openId: DEV_USER.openId,
          organizationId: 1,
          name: DEV_USER.name ?? "Admin CRM",
          email: DEV_USER.email ?? "admin@crmpro.local",
          loginMethod: "dev",
          role: "admin",
          lastSignedIn: new Date().toISOString() as any,
        });
      } catch (e) {
        console.log("[DevLogin] DB upsert skipped:", e);
      }

      const token = await signSession(DEV_USER.openId, DEV_USER.name ?? "Admin CRM");
      const opts = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, token, {
        ...opts,
        maxAge: ONE_YEAR_MS,
        secure: false,
        sameSite: "lax",
      });

      res.redirect(302, "/");
    } catch (err) {
      console.error("[DevLogin] Error:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // POST /api/logout
  app.post("/api/logout", (req: Request, res: Response) => {
    const opts = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
    res.json({ success: true });
  });

  // POST /api/change-password
  app.post("/api/change-password", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: "Contraseña actual y nueva son requeridas" });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
        return;
      }

      const db = await import("../db");
      const currentHash = await db.getUserPasswordHash(user.openId);

      if (currentHash) {
        const valid = await verifyPassword(currentPassword, currentHash);
        if (!valid) {
          res.status(401).json({ error: "Contraseña actual incorrecta" });
          return;
        }
      }

      const newHash = await hashPassword(newPassword);
      await db.updateUserPassword(user.openId, newHash);

      res.json({ success: true });
    } catch (err) {
      console.error("[ChangePassword] Error:", err);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // POST /api/register — create new organization + admin user
  app.post("/api/register", async (req: Request, res: Response) => {
    const { companyName, name, email, password, confirmPassword } = req.body || {};

    if (!companyName?.trim() || !name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: "Las contraseñas no coinciden" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Email inválido" });
      return;
    }

    try {
      const db = await import("../db");

      // Check if email already exists
      const existing = await db.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: "Ya existe una cuenta con este email" });
        return;
      }

      // Create organization
      const client = createClient({ url: `file:${DB_PATH}` });
      const orgSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 50) + "-" + Date.now();
      const orgResult = await client.execute({
        sql: "INSERT INTO organizations (name, slug) VALUES (?, ?)",
        args: [companyName.trim(), orgSlug],
      });
      const organizationId = Number(orgResult.lastInsertRowid);
      await client.close();

      // Create admin user with hashed password
      const hash = await hashPassword(password);
      await db.createUserWithPassword({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: hash,
        organizationId,
        role: "admin",
      });

      const user = await db.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        res.status(500).json({ error: "Error al crear usuario" });
        return;
      }

      // Seed default pipeline + stages for the new org
      try {
        const seedClient = createClient({ url: `file:${DB_PATH}` });
        const pipelineResult = await seedClient.execute({
          sql: "INSERT INTO pipelines (organizationId, name, isDefault) VALUES (?, 'Pipeline Principal', 1)",
          args: [organizationId],
        });
        const pipelineId = Number(pipelineResult.lastInsertRowid);
        await seedClient.executeMultiple(`
          INSERT INTO stages (pipelineId, name, "order", color, probability) VALUES
            (${pipelineId}, 'Prospecto',   1, '#64748B', 10),
            (${pipelineId}, 'Calificado',  2, '#3B82F6', 30),
            (${pipelineId}, 'Propuesta',   3, '#F59E0B', 50),
            (${pipelineId}, 'Negociación', 4, '#F97316', 75),
            (${pipelineId}, 'Cerrado',     5, '#10B981', 100);
        `);
        await seedClient.close();
      } catch (seedErr) {
        console.error("[Register] Pipeline seed error (non-fatal):", seedErr);
      }

      const token = await signSession(user.openId, user.name ?? email);
      const opts = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...opts, maxAge: ONE_YEAR_MS, secure: false, sameSite: "lax" });
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error("[Register] Error:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
}
