import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import {
  users, organizations, leads, contacts, companies,
  opportunities, tasks, activities, pipelines, stages,
  quotations, quotationItems, products, goals, auditLogs,
  type InsertUser, type InsertLead, type InsertContact,
  type InsertOpportunity, type InsertTask, type InsertQuotation,
  type InsertQuotationItem, type InsertCompany, type InsertProduct,
  type InsertActivity,
} from "../drizzle/schema";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Support DATABASE_URL env var for production (e.g. Railway volume at /data/crm.db)
function getDbPath(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    // Strip "file:" prefix if present
    return envUrl.startsWith("file:") ? envUrl.slice(5) : envUrl;
  }
  return path.join(__dirname, "..", "crm.db");
}

const DB_PATH = getDbPath();

// Singleton
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const client = createClient({ url: `file:${DB_PATH}` });
    _db = drizzle(client);
  }
  return _db;
}

// ── Bootstrap: crear tablas si no existen ─────────────────────────────────────

export async function initDb() {
  const db = getDb();
  const client = createClient({ url: `file:${DB_PATH}` });

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
      lastSignedIn TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      status TEXT DEFAULT 'activo',
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      projectId INTEGER,
      firstName TEXT NOT NULL,
      lastName TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      jobTitle TEXT,
      source TEXT,
      status TEXT DEFAULT 'nuevo',
      score INTEGER DEFAULT 0,
      assignedTo INTEGER,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      website TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      industry TEXT,
      employees INTEGER,
      annualRevenue REAL,
      description TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      companyId INTEGER,
      firstName TEXT NOT NULL,
      lastName TEXT,
      email TEXT,
      phone TEXT,
      mobile TEXT,
      jobTitle TEXT,
      department TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pipelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isDefault INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipelineId INTEGER NOT NULL,
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      color TEXT,
      probability INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      leadId INTEGER,
      contactId INTEGER,
      companyId INTEGER,
      pipelineId INTEGER NOT NULL,
      stageId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL,
      probability INTEGER DEFAULT 0,
      expectedCloseDate TEXT,
      assignedTo INTEGER,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pendiente',
      priority TEXT DEFAULT 'media',
      dueDate TEXT,
      assignedTo INTEGER,
      leadId INTEGER,
      contactId INTEGER,
      opportunityId INTEGER,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT,
      leadId INTEGER,
      contactId INTEGER,
      opportunityId INTEGER,
      assignedTo INTEGER,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price REAL NOT NULL,
      cost REAL,
      sku TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      number TEXT NOT NULL UNIQUE,
      opportunityId INTEGER,
      contactId INTEGER,
      companyId INTEGER,
      status TEXT DEFAULT 'borrador',
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      validUntil TEXT,
      notes TEXT,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotationId INTEGER NOT NULL,
      productId INTEGER,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      period TEXT NOT NULL,
      assignedTo INTEGER,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      oldValues TEXT,
      newValues TEXT,
      ipAddress TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);

  // Seed: org, usuario admin, pipeline y proyectos por defecto
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS user_passwords (
      openId TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS automations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      trigger TEXT NOT NULL,
      triggerValue TEXT,
      action TEXT NOT NULL,
      actionValue TEXT,
      isActive INTEGER DEFAULT 1,
      daysThreshold INTEGER,
      lastRun TEXT,
      runCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);

  await client.executeMultiple(`
    INSERT OR IGNORE INTO automations (id, organizationId, name, trigger, triggerValue, action, actionValue, isActive, daysThreshold) VALUES
      (1, 1, 'Tarea al calificar lead', 'lead_status_changed', 'calificado', 'create_task', 'Seguimiento: Lead calificado - {leadName}', 1, NULL),
      (2, 1, 'Alerta lead inactivo 7 días', 'lead_inactive', NULL, 'create_task', 'Recontactar lead inactivo: {leadName}', 1, 7),
      (3, 1, 'Tarea al crear oportunidad', 'opportunity_stage_changed', 'Prospecto', 'create_task', 'Primer contacto: {oppName}', 1, NULL);
  `);

  // ── Migrations: add columns that may be missing in existing DBs ──────────────
  const migrations = [
    "ALTER TABLE leads ADD COLUMN projectId INTEGER",
    "ALTER TABLE leads ADD COLUMN assignedTo INTEGER",
    "ALTER TABLE opportunities ADD COLUMN assignedTo INTEGER",
    "ALTER TABLE tasks ADD COLUMN leadId INTEGER",
    "ALTER TABLE tasks ADD COLUMN contactId INTEGER",
    "ALTER TABLE tasks ADD COLUMN opportunityId INTEGER",
    "ALTER TABLE companies ADD COLUMN state TEXT",
    "ALTER TABLE companies ADD COLUMN annualRevenue REAL",
  ];
  for (const migration of migrations) {
    try { await client.execute(migration); } catch { /* column already exists */ }
  }

  await client.executeMultiple(`
    INSERT OR IGNORE INTO organizations (id, name, slug) VALUES (1, 'Mi Empresa', 'mi-empresa');
    INSERT OR IGNORE INTO users (id, organizationId, openId, name, email, role, loginMethod, isActive)
      VALUES (1, 1, 'dev-admin-001', 'Admin CRM', 'admin@crmpro.local', 'admin', 'dev', 1);
    INSERT OR IGNORE INTO pipelines (id, organizationId, name, isDefault)
      VALUES (1, 1, 'Pipeline Principal', 1);
    INSERT OR IGNORE INTO stages (id, pipelineId, name, "order", color, probability) VALUES
      (1, 1, 'Prospecto',   1, '#64748B', 10),
      (2, 1, 'Calificado',  2, '#3B82F6', 30),
      (3, 1, 'Propuesta',   3, '#F59E0B', 50),
      (4, 1, 'Negociación', 4, '#F97316', 75),
      (5, 1, 'Cerrado',     5, '#10B981', 100);
    INSERT OR IGNORE INTO projects (id, organizationId, name, description, status) VALUES
      (1, 1, 'Proyecto Principal', 'Proyecto principal de la empresa', 'activo');
  `);

  // Demo seed data
  await client.executeMultiple(`
    INSERT OR IGNORE INTO leads (id, organizationId, firstName, lastName, email, phone, company, jobTitle, source, status, score) VALUES
      (101, 1, 'Carlos', 'Mendoza', 'carlos@techcorp.com', '+57 300 111 2222', 'TechCorp', 'CEO', 'Sitio Web', 'calificado', 85),
      (102, 1, 'Ana', 'Rodríguez', 'ana@innovate.com', '+57 310 222 3333', 'Innovate SAS', 'CTO', 'Referido', 'contactado', 72),
      (103, 1, 'Pedro', 'García', 'pedro@globalco.com', '+57 320 333 4444', 'GlobalCo', 'Director', 'Email', 'nuevo', 55),
      (104, 1, 'María', 'López', 'maria@startup.com', '+57 315 444 5555', 'StartupXYZ', 'Fundadora', 'Redes Sociales', 'nuevo', 63),
      (105, 1, 'Luis', 'Torres', 'luis@enterprise.com', '+57 305 555 6666', 'Enterprise SA', 'VP Ventas', 'Sitio Web', 'calificado', 91);

    INSERT OR IGNORE INTO contacts (id, organizationId, firstName, lastName, email, phone, jobTitle, department, city, country) VALUES
      (101, 1, 'Carlos', 'Mendoza', 'carlos@techcorp.com', '+57 300 111 2222', 'CEO', 'Dirección', 'Bogotá', 'Colombia'),
      (102, 1, 'Ana', 'Rodríguez', 'ana@innovate.com', '+57 310 222 3333', 'CTO', 'Tecnología', 'Medellín', 'Colombia'),
      (103, 1, 'Pedro', 'García', 'pedro@globalco.com', '+57 320 333 4444', 'Director Comercial', 'Ventas', 'Cali', 'Colombia');

    INSERT OR IGNORE INTO opportunities (id, organizationId, pipelineId, stageId, name, amount, probability, expectedCloseDate) VALUES
      (101, 1, 1, 4, 'Implementación ERP - TechCorp', 85000, 75, '2025-06-30'),
      (102, 1, 1, 3, 'Consultoría Digital - Innovate', 42000, 60, '2025-07-15'),
      (103, 1, 1, 2, 'Licencias Software - GlobalCo', 28000, 40, '2025-08-01'),
      (104, 1, 1, 1, 'Proyecto Alpha - Enterprise SA', 120000, 25, '2025-09-30');

    INSERT OR IGNORE INTO tasks (id, organizationId, title, priority, status, dueDate, createdBy) VALUES
      (101, 1, 'Llamar a Carlos Mendoza - TechCorp', 'alta', 'pendiente', date('now', '+1 day'), 1),
      (102, 1, 'Enviar propuesta a Innovate SAS', 'alta', 'pendiente', date('now', '+2 days'), 1),
      (103, 1, 'Reunión de seguimiento - GlobalCo', 'media', 'pendiente', date('now', '+3 days'), 1),
      (104, 1, 'Preparar demo para Enterprise SA', 'alta', 'en_progreso', date('now', '+5 days'), 1);

    INSERT OR IGNORE INTO products (id, organizationId, name, category, price, cost, sku, isActive) VALUES
      (101, 1, 'CRM Pro - Plan Básico', 'Software', 299.00, 50.00, 'CRM-BASIC', 1),
      (102, 1, 'CRM Pro - Plan Empresarial', 'Software', 899.00, 150.00, 'CRM-ENT', 1),
      (103, 1, 'Consultoría de Implementación', 'Servicios', 150.00, 60.00, 'CONS-IMPL', 1),
      (104, 1, 'Soporte Premium Anual', 'Servicios', 1200.00, 200.00, 'SUPP-PREM', 1);

    INSERT OR IGNORE INTO companies (id, organizationId, name, industry, employees, city, country, email) VALUES
      (101, 1, 'TechCorp', 'Tecnología', 150, 'Bogotá', 'Colombia', 'info@techcorp.com'),
      (102, 1, 'Innovate SAS', 'Software', 80, 'Medellín', 'Colombia', 'info@innovate.com'),
      (103, 1, 'GlobalCo', 'Consultoría', 320, 'Cali', 'Colombia', 'info@globalco.com'),
      (104, 1, 'Enterprise SA', 'Manufactura', 500, 'Bogotá', 'Colombia', 'info@enterprise.com');
  `);

  await client.close();
  console.log("[DB] SQLite initialized at", DB_PATH);
}

// ── USERS ─────────────────────────────────────────────────────────────────────

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUser(data: Partial<InsertUser> & { openId: string; organizationId: number }) {
  const db = getDb();
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await db.update(users).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(users.openId, data.openId));
  } else {
    await db.insert(users).values({ ...data, lastSignedIn: new Date().toISOString() } as InsertUser);
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export async function getDashboardKPIs(organizationId: number) {
  const db = getDb();
  const [rev, leds, opps] = await Promise.all([
    db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(opportunities).where(eq(opportunities.organizationId, organizationId)),
    db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(and(eq(leads.organizationId, organizationId), eq(leads.status, "nuevo"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(opportunities).where(eq(opportunities.organizationId, organizationId)),
  ]);
  return {
    totalRevenue: Number(rev[0]?.total) || 0,
    activeLeads: Number(leds[0]?.count) || 0,
    openOpportunities: Number(opps[0]?.count) || 0,
  };
}

export async function getRecentActivities(organizationId: number, limit = 10) {
  const db = getDb();
  return db.select().from(activities).where(eq(activities.organizationId, organizationId)).orderBy(desc(activities.createdAt)).limit(limit);
}

export async function getRevenueByMonth(organizationId: number, months = 12) {
  const db = getDb();
  return db.select({
    month: sql<string>`strftime('%Y-%m', createdAt)`,
    revenue: sql<number>`COALESCE(SUM(amount), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(opportunities).where(and(
    eq(opportunities.organizationId, organizationId),
    sql`createdAt >= datetime('now', '-${months} months')`
  )).groupBy(sql`strftime('%Y-%m', createdAt)`).orderBy(sql`strftime('%Y-%m', createdAt)`);
}

export async function getLeadsBySource(organizationId: number) {
  const db = getDb();
  return db.select({ source: leads.source, count: sql<number>`COUNT(*)` })
    .from(leads).where(eq(leads.organizationId, organizationId)).groupBy(leads.source);
}

export async function getSalesFunnel(organizationId: number, _opts: any = {}) {
  const db = getDb();
  return db.select({
    stageId: opportunities.stageId,
    stageName: stages.name,
    count: sql<number>`COUNT(*)`,
    totalAmount: sql<number>`COALESCE(SUM(${opportunities.amount}), 0)`,
  }).from(opportunities)
    .leftJoin(stages, eq(opportunities.stageId, stages.id))
    .where(eq(opportunities.organizationId, organizationId))
    .groupBy(opportunities.stageId, stages.name)
    .orderBy(stages.order);
}

// ── LEADS ─────────────────────────────────────────────────────────────────────

export async function getLeadsList(organizationId: number, opts: { limit?: number; offset?: number; status?: string; assignedTo?: number; search?: string } = {}) {
  const db = getDb();
  const { limit = 20, offset = 0, status, assignedTo, search } = opts;
  const conds: any[] = [eq(leads.organizationId, organizationId)];
  if (status) conds.push(eq(leads.status, status as any));
  if (assignedTo) conds.push(eq(leads.assignedTo, assignedTo));
  if (search) conds.push(or(like(leads.firstName, `%${search}%`), like(leads.email, `%${search}%`), like(leads.company, `%${search}%`)));
  const [data, total] = await Promise.all([
    db.select().from(leads).where(and(...conds)).orderBy(desc(leads.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function getLeadById(organizationId: number, id: number) {
  const db = getDb();
  const r = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.organizationId, organizationId))).limit(1);
  return r[0] ?? null;
}

export async function createLead(organizationId: number, _userId: number, data: Partial<InsertLead>) {
  const db = getDb();
  const r = await db.insert(leads).values({ ...data, organizationId } as InsertLead);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateLead(organizationId: number, id: number, data: Partial<InsertLead>) {
  const db = getDb();
  await db.update(leads).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(leads.id, id), eq(leads.organizationId, organizationId)));
  return { success: true };
}

export async function deleteLead(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.organizationId, organizationId)));
  return { success: true };
}

export async function assignLeadToUser(organizationId: number, leadId: number, userId: number) {
  const db = getDb();
  await db.update(leads).set({ assignedTo: userId, updatedAt: new Date().toISOString() })
    .where(and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)));
  return { success: true };
}

export async function findDuplicateLeads(organizationId: number, email?: string, phone?: string, firstName?: string, lastName?: string) {
  const db = getDb();

  if (email) {
    const emailDups = await db.select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName, email: leads.email, phone: leads.phone, status: leads.status })
      .from(leads)
      .where(and(eq(leads.organizationId, organizationId), eq(leads.email, email)))
      .limit(3);
    if (emailDups.length > 0) return { duplicates: emailDups, matchField: "email" };
  }

  if (phone) {
    const phoneDups = await db.select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName, email: leads.email, phone: leads.phone, status: leads.status })
      .from(leads)
      .where(and(eq(leads.organizationId, organizationId), eq(leads.phone, phone)))
      .limit(3);
    if (phoneDups.length > 0) return { duplicates: phoneDups, matchField: "phone" };
  }

  if (firstName && lastName) {
    const nameDups = await db.select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName, email: leads.email, phone: leads.phone, status: leads.status })
      .from(leads)
      .where(and(eq(leads.organizationId, organizationId), eq(leads.firstName, firstName), eq(leads.lastName, lastName)))
      .limit(3);
    if (nameDups.length > 0) return { duplicates: nameDups, matchField: "name" };
  }

  return { duplicates: [], matchField: null };
}

// ── CONTACTS ──────────────────────────────────────────────────────────────────

export async function getContactsList(organizationId: number, opts: { limit?: number; offset?: number; companyId?: number; search?: string } = {}) {
  const db = getDb();
  const { limit = 20, offset = 0, companyId, search } = opts;
  const conds: any[] = [eq(contacts.organizationId, organizationId)];
  if (companyId) conds.push(eq(contacts.companyId, companyId));
  if (search) conds.push(or(like(contacts.firstName, `%${search}%`), like(contacts.email, `%${search}%`)));
  const [data, total] = await Promise.all([
    db.select().from(contacts).where(and(...conds)).orderBy(desc(contacts.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(contacts).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function getContactById(organizationId: number, id: number) {
  const db = getDb();
  const r = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))).limit(1);
  return r[0] ?? null;
}

export async function createContact(organizationId: number, data: Partial<InsertContact>) {
  const db = getDb();
  const r = await db.insert(contacts).values({ ...data, organizationId } as InsertContact);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateContact(organizationId: number, id: number, data: Partial<InsertContact>) {
  const db = getDb();
  await db.update(contacts).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)));
  return { success: true };
}

export async function deleteContact(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)));
  return { success: true };
}

// ── OPPORTUNITIES ─────────────────────────────────────────────────────────────

export async function getOpportunitiesList(organizationId: number, opts: { limit?: number; offset?: number; stageId?: number; pipelineId?: number; assignedTo?: number } = {}) {
  const db = getDb();
  const { limit = 50, offset = 0, stageId, pipelineId, assignedTo } = opts;
  const conds: any[] = [eq(opportunities.organizationId, organizationId)];
  if (stageId) conds.push(eq(opportunities.stageId, stageId));
  if (pipelineId) conds.push(eq(opportunities.pipelineId, pipelineId));
  if (assignedTo) conds.push(eq(opportunities.assignedTo, assignedTo));
  const [data, total] = await Promise.all([
    db.select().from(opportunities).where(and(...conds)).orderBy(desc(opportunities.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(opportunities).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function getOpportunityById(organizationId: number, id: number) {
  const db = getDb();
  const r = await db.select().from(opportunities).where(and(eq(opportunities.id, id), eq(opportunities.organizationId, organizationId))).limit(1);
  return r[0] ?? null;
}

export async function createOpportunity(organizationId: number, _userId: number, data: Partial<InsertOpportunity>) {
  const db = getDb();
  const r = await db.insert(opportunities).values({ ...data, organizationId } as InsertOpportunity);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateOpportunity(organizationId: number, id: number, data: Partial<InsertOpportunity>) {
  const db = getDb();
  await db.update(opportunities).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(opportunities.id, id), eq(opportunities.organizationId, organizationId)));
  return { success: true };
}

export async function deleteOpportunity(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(opportunities).where(and(eq(opportunities.id, id), eq(opportunities.organizationId, organizationId)));
  return { success: true };
}

export async function getPipelinesList(organizationId: number) {
  const db = getDb();
  return db.select().from(pipelines).where(eq(pipelines.organizationId, organizationId));
}

export async function getDefaultPipeline(organizationId: number) {
  const db = getDb();
  const r = await db.select().from(pipelines).where(and(eq(pipelines.organizationId, organizationId), eq(pipelines.isDefault, true))).limit(1);
  return r[0] ?? null;
}

export async function getPipelineStages(pipelineId: number) {
  const db = getDb();
  return db.select().from(stages).where(eq(stages.pipelineId, pipelineId)).orderBy(stages.order);
}

// ── TASKS ─────────────────────────────────────────────────────────────────────

export async function getTasksList(organizationId: number, opts: { limit?: number; offset?: number; status?: string; priority?: string; assignedTo?: number } = {}) {
  const db = getDb();
  const { limit = 50, offset = 0, status, priority, assignedTo } = opts;
  const conds: any[] = [eq(tasks.organizationId, organizationId)];
  if (status) conds.push(eq(tasks.status, status as any));
  if (priority) conds.push(eq(tasks.priority, priority as any));
  if (assignedTo) conds.push(eq(tasks.assignedTo, assignedTo));
  const [data, total] = await Promise.all([
    db.select().from(tasks).where(and(...conds)).orderBy(desc(tasks.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(tasks).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function createTask(organizationId: number, userId: number, data: Partial<InsertTask>) {
  const db = getDb();
  const r = await db.insert(tasks).values({ ...data, organizationId, createdBy: userId } as InsertTask);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateTask(organizationId: number, id: number, data: Partial<InsertTask>) {
  const db = getDb();
  await db.update(tasks).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)));
  return { success: true };
}

export async function deleteTask(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)));
  return { success: true };
}

// ── QUOTATIONS ────────────────────────────────────────────────────────────────

export async function getQuotationsList(organizationId: number, opts: { limit?: number; offset?: number; status?: string } = {}) {
  const db = getDb();
  const { limit = 20, offset = 0, status } = opts;
  const conds: any[] = [eq(quotations.organizationId, organizationId)];
  if (status) conds.push(eq(quotations.status, status as any));
  const [data, total] = await Promise.all([
    db.select().from(quotations).where(and(...conds)).orderBy(desc(quotations.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotations).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function getQuotationById(organizationId: number, id: number) {
  const db = getDb();
  const [quote, items] = await Promise.all([
    db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.organizationId, organizationId))).limit(1),
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)),
  ]);
  if (!quote[0]) return null;
  return { ...quote[0], items };
}

export async function createQuotation(organizationId: number, userId: number, data: { opportunityId?: number; contactId?: number; companyId?: number; validUntil?: string; notes?: string; items: any[] }) {
  const db = getDb();
  const number = `COT-${Date.now()}`;
  const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100), 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;
  const r = await db.insert(quotations).values({ organizationId, number, opportunityId: data.opportunityId, contactId: data.contactId, companyId: data.companyId, validUntil: data.validUntil, notes: data.notes, subtotal, tax, total, createdBy: userId } as InsertQuotation);
  const quotationId = Number(r.lastInsertRowid);
  if (data.items.length > 0) {
    await db.insert(quotationItems).values(data.items.map(i => ({ quotationId, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount || 0, total: i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100), productId: i.productId })) as InsertQuotationItem[]);
  }
  return { id: quotationId, number };
}

export async function updateQuotation(organizationId: number, id: number, data: Partial<InsertQuotation>) {
  const db = getDb();
  await db.update(quotations).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(quotations.id, id), eq(quotations.organizationId, organizationId)));
  return { success: true };
}

export async function deleteQuotation(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(quotations).where(and(eq(quotations.id, id), eq(quotations.organizationId, organizationId)));
  return { success: true };
}

// ── GOALS ─────────────────────────────────────────────────────────────────────

export async function getGoalsList(
  organizationId: number,
  opts: { period?: string; assignedTo?: number } = {}
) {
  const db = getDb();
  const { period, assignedTo } = opts;
  const conds: any[] = [eq(goals.organizationId, organizationId)];
  if (period) conds.push(eq(goals.period, period as any));
  if (assignedTo) conds.push(eq(goals.assignedTo, assignedTo));
  return db.select().from(goals).where(and(...conds)).orderBy(desc(goals.createdAt));
}

export async function createGoal(
  organizationId: number,
  data: { name: string; targetAmount: number; period: string; assignedTo?: number; startDate: string; endDate: string }
) {
  const db = getDb();
  const r = await db.insert(goals).values({
    organizationId,
    name: data.name,
    targetAmount: data.targetAmount,
    period: data.period as any,
    assignedTo: data.assignedTo,
    startDate: data.startDate,
    endDate: data.endDate,
  });
  return { id: Number(r.lastInsertRowid) };
}

export async function updateGoal(organizationId: number, id: number, data: any) {
  const db = getDb();
  await db.update(goals).set(data).where(and(eq(goals.id, id), eq(goals.organizationId, organizationId)));
  return { success: true };
}

export async function deleteGoal(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.organizationId, organizationId)));
  return { success: true };
}

export async function getGoalProgress(organizationId: number, goalId: number) {
  const db = getDb();
  const goal = await db.select().from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.organizationId, organizationId))).limit(1);
  if (!goal[0]) return null;

  // Calculate actual revenue from closed opportunities within goal period
  const actual = await db.select({
    total: sql<number>`COALESCE(SUM(${opportunities.amount}), 0)`,
  }).from(opportunities).where(and(
    eq(opportunities.organizationId, organizationId),
    sql`${opportunities.createdAt} >= ${goal[0].startDate}`,
    sql`${opportunities.createdAt} <= ${goal[0].endDate}`
  ));

  const actualAmount = Number(actual[0]?.total) || 0;
  const targetAmount = Number(goal[0].targetAmount) || 1;
  const percentage = Math.min(Math.round((actualAmount / targetAmount) * 100), 100);

  return {
    ...goal[0],
    actualAmount,
    percentage,
    remaining: Math.max(targetAmount - actualAmount, 0),
  };
}

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────

export async function globalSearch(organizationId: number, query: string) {
  const db = getDb();
  const q = `%${query}%`;
  const [foundLeads, foundContacts, foundOpps] = await Promise.all([
    db.select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      type: sql<string>`'lead'`,
    })
      .from(leads)
      .where(and(
        eq(leads.organizationId, organizationId),
        or(like(leads.firstName, q), like(leads.lastName, q), like(leads.email, q), like(leads.company, q))
      ))
      .limit(5),
    db.select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      type: sql<string>`'contact'`,
    })
      .from(contacts)
      .where(and(
        eq(contacts.organizationId, organizationId),
        or(like(contacts.firstName, q), like(contacts.lastName, q), like(contacts.email, q))
      ))
      .limit(5),
    db.select({
      id: opportunities.id,
      name: opportunities.name,
      amount: opportunities.amount,
      type: sql<string>`'opportunity'`,
    })
      .from(opportunities)
      .where(and(
        eq(opportunities.organizationId, organizationId),
        like(opportunities.name, q)
      ))
      .limit(5),
  ]);
  return { leads: foundLeads, contacts: foundContacts, opportunities: foundOpps };
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export async function getNotifications(organizationId: number) {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [overdueTasks, staleOpps] = await Promise.all([
    db.select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate })
      .from(tasks)
      .where(and(
        eq(tasks.organizationId, organizationId),
        sql`${tasks.dueDate} < ${today}`,
        sql`${tasks.status} != 'completada'`
      ))
      .limit(10),
    db.select({ id: opportunities.id, name: opportunities.name, updatedAt: opportunities.updatedAt })
      .from(opportunities)
      .where(and(
        eq(opportunities.organizationId, organizationId),
        sql`${opportunities.updatedAt} < ${sevenDaysAgo}`
      ))
      .limit(10),
  ]);

  return { overdueTasks, staleOpps, total: overdueTasks.length + staleOpps.length };
}

// ── SECURITY: Password & User management ──────────────────────────────────────

export async function getUserByEmail(email: string) {
  const db = getDb();
  const result = await db.select().from(users)
    .where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getUserPasswordHash(openId: string): Promise<string | null> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const result = await client.execute({
      sql: "SELECT passwordHash FROM user_passwords WHERE openId = ?",
      args: [openId],
    });
    return (result.rows[0]?.passwordHash as string) ?? null;
  } finally {
    await client.close();
  }
}

export async function updateUserPassword(openId: string, hash: string): Promise<void> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    await client.execute({
      sql: `INSERT INTO user_passwords (openId, passwordHash, updatedAt)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(openId) DO UPDATE SET passwordHash = excluded.passwordHash, updatedAt = datetime('now')`,
      args: [openId, hash],
    });
  } finally {
    await client.close();
  }
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
  organizationId: number;
  role?: "user" | "admin";
}) {
  const db = getDb();
  const openId = `email-${data.email}`;
  await updateUserPassword(openId, data.passwordHash);
  await db.insert(users).values({
    openId,
    organizationId: data.organizationId,
    name: data.name,
    email: data.email,
    loginMethod: "password",
    role: data.role ?? "user",
    isActive: true,
    lastSignedIn: new Date().toISOString(),
  } as InsertUser);
  return getUserByOpenId(openId);
}

export async function updateLastSignedIn(openId: string) {
  const db = getDb();
  await db.update(users)
    .set({ lastSignedIn: new Date().toISOString() })
    .where(eq(users.openId, openId));
}

export async function setUserActive(organizationId: number, userId: number, isActive: boolean) {
  const db = getDb();
  await db.update(users)
    .set({ isActive, updatedAt: new Date().toISOString() })
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)));
  return { success: true };
}

export async function getUsersByOrg(organizationId: number) {
  const db = getDb();
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive,
    lastSignedIn: users.lastSignedIn,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.organizationId, organizationId)).orderBy(users.createdAt);
}

export async function updateUserRole(organizationId: number, userId: number, role: "user" | "admin") {
  const db = getDb();
  await db.update(users)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)));
  return { success: true };
}

// ── AUDIT LOG ─────────────────────────────────────────────────────────────────

export async function logAudit(data: {
  organizationId: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}) {
  const db = getDb();
  await db.insert(auditLogs).values({
    organizationId: data.organizationId,
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
    newValues: data.newValues ? JSON.stringify(data.newValues) : null,
    ipAddress: data.ipAddress,
  });
}

export async function getAuditLogs(organizationId: number, limit = 50) {
  const db = getDb();
  return db.select().from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ── ACTIVITIES (real timeline) ────────────────────────────────────────────────

export async function createActivity(organizationId: number, userId: number, data: {
  type: "llamada" | "reunion" | "visita" | "email";
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  leadId?: number;
  contactId?: number;
  opportunityId?: number;
}) {
  const db = getDb();
  const r = await db.insert(activities).values({
    organizationId,
    type: data.type,
    title: data.title,
    description: data.description,
    startTime: data.startTime ?? new Date().toISOString(),
    endTime: data.endTime,
    leadId: data.leadId,
    contactId: data.contactId,
    opportunityId: data.opportunityId,
    assignedTo: userId,
    createdBy: userId,
  } as InsertActivity);
  return { id: Number(r.lastInsertRowid) };
}

export async function getActivitiesByLead(organizationId: number, leadId: number) {
  const db = getDb();
  return db.select().from(activities)
    .where(and(eq(activities.organizationId, organizationId), eq(activities.leadId, leadId)))
    .orderBy(desc(activities.createdAt));
}

export async function getActivitiesByOpportunity(organizationId: number, opportunityId: number) {
  const db = getDb();
  return db.select().from(activities)
    .where(and(eq(activities.organizationId, organizationId), eq(activities.opportunityId, opportunityId)))
    .orderBy(desc(activities.createdAt));
}

export async function getActivitiesList(organizationId: number, opts: { type?: string; limit?: number } = {}) {
  const db = getDb();
  const { type, limit = 50 } = opts;
  const conds: any[] = [eq(activities.organizationId, organizationId)];
  if (type) conds.push(eq(activities.type, type as any));
  return db.select().from(activities).where(and(...conds)).orderBy(desc(activities.createdAt)).limit(limit);
}

// ── CONTACT DETAIL ────────────────────────────────────────────────────────────

export async function getContactWithRelations(organizationId: number, id: number) {
  const db = getDb();
  const [contact, relatedOpps, relatedLeads] = await Promise.all([
    db.select().from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))).limit(1),
    db.select().from(opportunities)
      .where(and(eq(opportunities.organizationId, organizationId), eq(opportunities.contactId, id)))
      .orderBy(desc(opportunities.createdAt)).limit(10),
    db.select().from(leads)
      .where(and(eq(leads.organizationId, organizationId), eq(leads.email,
        db.select({ email: contacts.email }).from(contacts).where(eq(contacts.id, id)).limit(1) as any
      ))).limit(5),
  ]);
  if (!contact[0]) return null;
  return { ...contact[0], opportunities: relatedOpps, leads: relatedLeads };
}

// ── COMPANIES ─────────────────────────────────────────────────────────────────

export async function getCompaniesList(organizationId: number, opts: { limit?: number; offset?: number; search?: string } = {}) {
  const db = getDb();
  const { limit = 50, offset = 0, search } = opts;
  const conds: any[] = [eq(companies.organizationId, organizationId)];
  if (search) conds.push(or(like(companies.name, `%${search}%`), like(companies.email, `%${search}%`)));
  const [data, total] = await Promise.all([
    db.select().from(companies).where(and(...conds)).orderBy(desc(companies.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function getCompanyById(organizationId: number, id: number) {
  const db = getDb();
  const r = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.organizationId, organizationId))).limit(1);
  return r[0] ?? null;
}

export async function createCompany(organizationId: number, data: Partial<InsertCompany>) {
  const db = getDb();
  const r = await db.insert(companies).values({ ...data, organizationId } as InsertCompany);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateCompany(organizationId: number, id: number, data: Partial<InsertCompany>) {
  const db = getDb();
  await db.update(companies).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(companies.id, id), eq(companies.organizationId, organizationId)));
  return { success: true };
}

export async function deleteCompany(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.organizationId, organizationId)));
  return { success: true };
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

export async function getProductsList(organizationId: number, opts: { limit?: number; search?: string } = {}) {
  const db = getDb();
  const { limit = 50, search } = opts;
  const conds: any[] = [eq(products.organizationId, organizationId)];
  if (search) conds.push(like(products.name, `%${search}%`));
  return db.select().from(products).where(and(...conds)).orderBy(desc(products.createdAt)).limit(limit);
}

export async function createProduct(organizationId: number, data: Partial<InsertProduct>) {
  const db = getDb();
  const r = await db.insert(products).values({ ...data, organizationId } as InsertProduct);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateProduct(organizationId: number, id: number, data: Partial<InsertProduct>) {
  const db = getDb();
  await db.update(products).set(data).where(and(eq(products.id, id), eq(products.organizationId, organizationId)));
  return { success: true };
}

export async function deleteProduct(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(products).where(and(eq(products.id, id), eq(products.organizationId, organizationId)));
  return { success: true };
}

// ── AUTOMATIONS ───────────────────────────────────────────────────────────────

export async function getAutomations(organizationId: number) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const result = await client.execute({
      sql: "SELECT * FROM automations WHERE organizationId = ? ORDER BY createdAt DESC",
      args: [organizationId],
    });
    return result.rows;
  } finally { await client.close(); }
}

export async function createAutomation(organizationId: number, data: any) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const r = await client.execute({
      sql: `INSERT INTO automations (organizationId, name, trigger, triggerValue, action, actionValue, isActive, daysThreshold)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [organizationId, data.name, data.trigger, data.triggerValue ?? null, data.action, data.actionValue ?? null, data.isActive ? 1 : 0, data.daysThreshold ?? null],
    });
    return { id: Number(r.lastInsertRowid) };
  } finally { await client.close(); }
}

export async function updateAutomation(organizationId: number, id: number, data: any) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const sets = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
    const vals = [...Object.values(data), id, organizationId];
    await client.execute({ sql: `UPDATE automations SET ${sets} WHERE id = ? AND organizationId = ?`, args: vals });
    return { success: true };
  } finally { await client.close(); }
}

export async function deleteAutomation(organizationId: number, id: number) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    await client.execute({ sql: "DELETE FROM automations WHERE id = ? AND organizationId = ?", args: [id, organizationId] });
    return { success: true };
  } finally { await client.close(); }
}

export async function runAutomations(organizationId: number, userId: number) {
  const db = getDb();
  const client = createClient({ url: `file:${DB_PATH}` });
  let tasksCreated = 0;

  try {
    const automationsResult = await client.execute({
      sql: "SELECT * FROM automations WHERE organizationId = ? AND isActive = 1",
      args: [organizationId],
    });

    for (const auto of automationsResult.rows) {
      const trigger = auto.trigger as string;
      const daysThreshold = auto.daysThreshold as number | null;

      if (trigger === "lead_inactive" && daysThreshold) {
        const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();
        const inactiveLeads = await db.select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName })
          .from(leads)
          .where(and(
            eq(leads.organizationId, organizationId),
            sql`${leads.updatedAt} < ${cutoff}`,
            sql`${leads.status} != 'descartado'`
          ))
          .limit(10);

        for (const lead of inactiveLeads) {
          const title = (auto.actionValue as string || "Recontactar: {leadName}")
            .replace("{leadName}", `${lead.firstName} ${lead.lastName ?? ""}`);

          const existing = await db.select({ id: tasks.id })
            .from(tasks)
            .where(and(eq(tasks.organizationId, organizationId), eq(tasks.leadId, lead.id), like(tasks.title, `%${lead.firstName}%`)))
            .limit(1);

          if (!existing.length) {
            await createTask(organizationId, userId, {
              title,
              leadId: lead.id,
              priority: "media",
              status: "pendiente",
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            });
            tasksCreated++;
          }
        }
      }
    }

    await client.execute({
      sql: "UPDATE automations SET lastRun = datetime('now'), runCount = runCount + 1 WHERE organizationId = ? AND isActive = 1",
      args: [organizationId],
    });

    return { tasksCreated, message: `${tasksCreated} tareas creadas automáticamente` };
  } finally {
    await client.close();
  }
}

// ── SAVED VIEWS (in-memory) ───────────────────────────────────────────────────

const savedViewsStore = new Map<string, any[]>();

export function getSavedViews(organizationId: number, module: string) {
  return savedViewsStore.get(`${organizationId}:${module}`) ?? [];
}

export function saveView(organizationId: number, module: string, view: { name: string; filters: any }) {
  const key = `${organizationId}:${module}`;
  const existing = savedViewsStore.get(key) ?? [];
  const newView = { id: Date.now(), ...view, createdAt: new Date().toISOString() };
  savedViewsStore.set(key, [...existing, newView]);
  return newView;
}

export function deleteView(organizationId: number, module: string, viewId: number) {
  const key = `${organizationId}:${module}`;
  const existing = savedViewsStore.get(key) ?? [];
  savedViewsStore.set(key, existing.filter((v: any) => v.id !== viewId));
  return { success: true };
}
