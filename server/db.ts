import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, desc, sql, like, or, lte } from "drizzle-orm";
import {
  users, organizations, leads, contacts, companies,
  opportunities, tasks, activities, pipelines, stages,
  quotations, quotationItems, products, goals, auditLogs,
  dashboardConfigs, dashboardWidgets, dashboardTemplates, dashboardShares,
  teamsIntegrations, teamsChannels, teamsMessages,
  inventory, inventoryMovements, invoices, invoiceItems, payments,
  gmailIntegrations, customFields, customFieldValues, calls,
  type InsertUser, type InsertLead, type InsertContact,
  type InsertOpportunity, type InsertTask, type InsertQuotation,
  type InsertQuotationItem, type InsertCompany, type InsertProduct,
  type InsertActivity, type InsertDashboardConfig, type InsertDashboardWidget,
  type InsertDashboardTemplate, type InsertDashboardShare,
  type InsertTeamsIntegration, type InsertTeamsChannel, type InsertTeamsMessage,
  type InsertInventory, type InsertInventoryMovement,
  type InsertInvoice, type InsertInvoiceItem, type InsertPayment,
  type InsertGmailIntegration, type InsertCustomField, type InsertCustomFieldValue, type InsertCall,
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
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      openId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      usedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS team_invitations (
      token TEXT PRIMARY KEY,
      organizationId INTEGER NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      invitedBy INTEGER NOT NULL,
      expiresAt TEXT NOT NULL,
      acceptedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('outbound','inbound')),
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      messageId TEXT,
      status TEXT DEFAULT 'sent',
      leadId INTEGER,
      contactId INTEGER,
      sentBy INTEGER,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
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

  // Demo seed data — solo en desarrollo local
  if (process.env.NODE_ENV !== "production") {
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
  }

  await client.close();
  console.log("[DB] SQLite initialized at", DB_PATH);

  // Run migrations for new tables
  const migClient = createClient({ url: `file:${DB_PATH}` });
  await migClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      minStock REAL DEFAULT 0,
      maxStock REAL,
      location TEXT,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      previousStock REAL NOT NULL,
      newStock REAL NOT NULL,
      reason TEXT,
      reference TEXT,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      number TEXT NOT NULL,
      quotationId INTEGER,
      opportunityId INTEGER,
      contactId INTEGER,
      companyId INTEGER,
      status TEXT NOT NULL DEFAULT 'borrador',
      issueDate TEXT NOT NULL,
      dueDate TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      taxRate REAL NOT NULL DEFAULT 19,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paidAmount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      terms TEXT,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      productId INTEGER,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      invoiceId INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      reference TEXT,
      notes TEXT,
      paymentDate TEXT NOT NULL,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gmail_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      accessToken TEXT NOT NULL,
      refreshToken TEXT,
      expiresAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      entityType TEXT NOT NULL,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 0,
      options TEXT,
      defaultValue TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_field_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fieldId INTEGER NOT NULL,
      entityId INTEGER NOT NULL,
      entityType TEXT NOT NULL,
      value TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      leadId INTEGER,
      contactId INTEGER,
      opportunityId INTEGER,
      assignedTo INTEGER NOT NULL,
      direction TEXT NOT NULL DEFAULT 'outbound',
      status TEXT NOT NULL DEFAULT 'completed',
      duration INTEGER DEFAULT 0,
      phone TEXT,
      notes TEXT,
      outcome TEXT,
      scheduledAt TEXT,
      calledAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);
  await migClient.close();
  console.log("[DB] Migrations applied");
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
    const vals: any[] = [...Object.values(data), id, organizationId];
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

// ── PASSWORD RESET TOKENS ─────────────────────────────────────────────────────

export async function createPasswordResetToken(openId: string): Promise<string> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await client.execute({
      sql: `INSERT OR REPLACE INTO password_reset_tokens (token, openId, expiresAt) VALUES (?, ?, ?)`,
      args: [token, openId, expiresAt],
    });
    return token;
  } finally {
    await client.close();
  }
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const result = await client.execute({
      sql: `SELECT openId, expiresAt, usedAt FROM password_reset_tokens WHERE token = ?`,
      args: [token],
    });
    const row = result.rows[0];
    if (!row) return null;
    if (row.usedAt) return null; // already used
    if (new Date(row.expiresAt as string) < new Date()) return null; // expired
    return row.openId as string;
  } finally {
    await client.close();
  }
}

export async function markResetTokenUsed(token: string): Promise<void> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    await client.execute({
      sql: `UPDATE password_reset_tokens SET usedAt = datetime('now') WHERE token = ?`,
      args: [token],
    });
  } finally {
    await client.close();
  }
}

// ── TEAM INVITATIONS ──────────────────────────────────────────────────────────

export async function createTeamInvitation(organizationId: number, email: string, role: string, invitedBy: number): Promise<string> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    await client.execute({
      sql: `INSERT OR REPLACE INTO team_invitations (token, organizationId, email, role, invitedBy, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [token, organizationId, email.toLowerCase().trim(), role, invitedBy, expiresAt],
    });
    return token;
  } finally {
    await client.close();
  }
}

export async function validateTeamInvitation(token: string): Promise<{ organizationId: number; email: string; role: string } | null> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const result = await client.execute({
      sql: `SELECT organizationId, email, role, expiresAt, acceptedAt FROM team_invitations WHERE token = ?`,
      args: [token],
    });
    const row = result.rows[0];
    if (!row) return null;
    if (row.acceptedAt) return null;
    if (new Date(row.expiresAt as string) < new Date()) return null;
    return { organizationId: row.organizationId as number, email: row.email as string, role: row.role as string };
  } finally {
    await client.close();
  }
}

export async function markInvitationAccepted(token: string): Promise<void> {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    await client.execute({
      sql: `UPDATE team_invitations SET acceptedAt = datetime('now') WHERE token = ?`,
      args: [token],
    });
  } finally {
    await client.close();
  }
}

export async function getOrganizationById(id: number) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const result = await client.execute({
      sql: `SELECT * FROM organizations WHERE id = ?`,
      args: [id],
    });
    return result.rows[0] ?? null;
  } finally {
    await client.close();
  }
}

// ── WHATSAPP MESSAGES ─────────────────────────────────────────────────────────

export async function saveWhatsAppMessage(data: {
  organizationId: number;
  direction: "outbound" | "inbound";
  phone: string;
  message: string;
  messageId?: string;
  status?: string;
  leadId?: number;
  contactId?: number;
  sentBy?: number;
}) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const r = await client.execute({
      sql: `INSERT INTO whatsapp_messages 
            (organizationId, direction, phone, message, messageId, status, leadId, contactId, sentBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.organizationId, data.direction, data.phone, data.message,
        data.messageId ?? null, data.status ?? "sent",
        data.leadId ?? null, data.contactId ?? null, data.sentBy ?? null,
      ],
    });
    return { id: Number(r.lastInsertRowid) };
  } finally {
    await client.close();
  }
}

export async function getWhatsAppMessages(organizationId: number, phone?: string, limit = 50) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    let sql = `SELECT * FROM whatsapp_messages WHERE organizationId = ?`;
    const args: any[] = [organizationId];
    if (phone) { sql += ` AND phone = ?`; args.push(phone); }
    sql += ` ORDER BY createdAt DESC LIMIT ?`;
    args.push(limit);
    const result = await client.execute({ sql, args });
    return result.rows;
  } finally {
    await client.close();
  }
}

export async function getWhatsAppConversations(organizationId: number) {
  const client = createClient({ url: `file:${DB_PATH}` });
  try {
    const result = await client.execute({
      sql: `SELECT phone, 
              MAX(createdAt) as lastMessageAt,
              COUNT(*) as messageCount,
              MAX(CASE WHEN direction='inbound' THEN message END) as lastInbound,
              MAX(CASE WHEN direction='outbound' THEN message END) as lastOutbound,
              MAX(message) as lastMessage,
              MAX(leadId) as leadId,
              MAX(contactId) as contactId
            FROM whatsapp_messages 
            WHERE organizationId = ?
            GROUP BY phone
            ORDER BY lastMessageAt DESC`,
      args: [organizationId],
    });
    return result.rows;
  } finally {
    await client.close();
  }
}

export async function findContactByPhone(organizationId: number, phone: string) {
  const db = getDb();
  const normalized = phone.replace(/[\s\-\(\)]/g, "");
  const r = await db.select().from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),
      or(eq(contacts.phone, phone), eq(contacts.phone, normalized), eq(contacts.mobile, phone), eq(contacts.mobile, normalized))
    )).limit(1);
  return r[0] ?? null;
}

export async function findLeadByPhone(organizationId: number, phone: string) {
  const db = getDb();
  const normalized = phone.replace(/[\s\-\(\)]/g, "");
  const r = await db.select().from(leads)
    .where(and(
      eq(leads.organizationId, organizationId),
      or(eq(leads.phone, phone), eq(leads.phone, normalized))
    )).limit(1);
  return r[0] ?? null;
}


// ── GOOGLE CALENDAR ───────────────────────────────────────────────────────────

export async function createGoogleCalendarIntegration(
  organizationId: number,
  userId: number,
  data: {
    googleCalendarId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  }
) {
  const db = getDb();
  const { googleCalendarIntegrations } = await import("../drizzle/schema");
  
  return db.insert(googleCalendarIntegrations).values({
    organizationId,
    userId,
    googleCalendarId: data.googleCalendarId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || null,
    expiresAt: data.expiresAt || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function getGoogleCalendarIntegration(organizationId: number, userId: number) {
  const db = getDb();
  const { googleCalendarIntegrations } = await import("../drizzle/schema");
  
  return db.select()
    .from(googleCalendarIntegrations)
    .where(and(
      eq(googleCalendarIntegrations.organizationId, organizationId),
      eq(googleCalendarIntegrations.userId, userId),
      eq(googleCalendarIntegrations.isActive, true)
    ))
    .limit(1);
}

export async function updateGoogleCalendarIntegration(
  integrationId: number,
  data: Partial<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    syncedAt: string;
    isActive: boolean;
  }>
) {
  const db = getDb();
  const { googleCalendarIntegrations } = await import("../drizzle/schema");
  
  return db.update(googleCalendarIntegrations)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(googleCalendarIntegrations.id, integrationId));
}

export async function upsertGoogleCalendarEvent(data: {
  organizationId: number;
  integrationId: number;
  googleEventId: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  attendees?: string | null;
  syncedAt?: string;
}) {
  const db = getDb();
  const { googleCalendarEvents } = await import("../drizzle/schema");
  
  // Check if event exists
  const existing = await db.select()
    .from(googleCalendarEvents)
    .where(eq(googleCalendarEvents.googleEventId, data.googleEventId))
    .limit(1);
  
  if (existing.length > 0) {
    // Update
    return db.update(googleCalendarEvents)
      .set({
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        attendees: data.attendees,
        syncedAt: data.syncedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(googleCalendarEvents.googleEventId, data.googleEventId));
  } else {
    // Insert
    return db.insert(googleCalendarEvents).values({
      organizationId: data.organizationId,
      integrationId: data.integrationId,
      googleEventId: data.googleEventId,
      title: data.title,
      description: data.description || null,
      startTime: data.startTime,
      endTime: data.endTime || null,
      location: data.location || null,
      attendees: data.attendees || null,
      syncedAt: data.syncedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getGoogleCalendarEvents(
  organizationId: number,
  integrationId: number,
  opts: { limit?: number; offset?: number } = {}
) {
  const db = getDb();
  const { googleCalendarEvents } = await import("../drizzle/schema");
  const { limit = 50, offset = 0 } = opts;
  
  return db.select()
    .from(googleCalendarEvents)
    .where(and(
      eq(googleCalendarEvents.organizationId, organizationId),
      eq(googleCalendarEvents.integrationId, integrationId)
    ))
    .orderBy(desc(googleCalendarEvents.startTime))
    .limit(limit)
    .offset(offset);
}

export async function deleteGoogleCalendarEvent(organizationId: number, googleEventId: string) {
  const db = getDb();
  const { googleCalendarEvents } = await import("../drizzle/schema");
  
  return db.delete(googleCalendarEvents)
    .where(and(
      eq(googleCalendarEvents.organizationId, organizationId),
      eq(googleCalendarEvents.googleEventId, googleEventId)
    ));
}


// ── SAVED REPORTS ─────────────────────────────────────────────────────────────

export async function getSavedReports(
  organizationId: number,
  opts: { limit?: number; offset?: number; folder?: string; search?: string } = {}
) {
  const db = getDb();
  const { savedReports } = await import("../drizzle/schema");
  const { limit = 50, offset = 0, folder, search } = opts;

  const conditions: any[] = [eq(savedReports.organizationId, organizationId)];

  if (folder && folder !== "Todos") {
    conditions.push(eq(savedReports.folder, folder));
  }

  if (search) {
    conditions.push(
      or(
        like(savedReports.name, `%${search}%`),
        like(savedReports.description, `%${search}%`)
      )
    );
  }

  return db.select()
    .from(savedReports)
    .where(and(...conditions))
    .orderBy(desc(savedReports.isStarred), desc(savedReports.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function createSavedReport(
  organizationId: number,
  userId: number,
  data: {
    name: string;
    description?: string;
    type: "tabla" | "grafico" | "embudo";
    folder?: string;
    config?: any;
  }
) {
  const db = getDb();
  const { savedReports } = await import("../drizzle/schema");

  return db.insert(savedReports).values({
    organizationId,
    createdBy: userId,
    name: data.name,
    description: data.description || null,
    type: data.type,
    folder: data.folder || "General",
    config: data.config ? JSON.stringify(data.config) : null,
    isStarred: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateSavedReport(
  organizationId: number,
  reportId: number,
  data: Partial<{
    name: string;
    description: string;
    type: "tabla" | "grafico" | "embudo";
    folder: string;
    config: any;
    isStarred: boolean;
  }>
) {
  const db = getDb();
  const { savedReports } = await import("../drizzle/schema");

  const updateData: any = { ...data };
  if (data.config) {
    updateData.config = JSON.stringify(data.config);
  }
  updateData.updatedAt = new Date().toISOString();

  return db.update(savedReports)
    .set(updateData)
    .where(and(
      eq(savedReports.organizationId, organizationId),
      eq(savedReports.id, reportId)
    ));
}

export async function deleteSavedReport(organizationId: number, reportId: number) {
  const db = getDb();
  const { savedReports } = await import("../drizzle/schema");

  return db.delete(savedReports)
    .where(and(
      eq(savedReports.organizationId, organizationId),
      eq(savedReports.id, reportId)
    ));
}

export async function toggleReportStar(organizationId: number, reportId: number) {
  const db = getDb();
  const { savedReports } = await import("../drizzle/schema");

  const report = await db.select()
    .from(savedReports)
    .where(and(
      eq(savedReports.organizationId, organizationId),
      eq(savedReports.id, reportId)
    ))
    .limit(1);

  if (!report[0]) return null;

  return db.update(savedReports)
    .set({
      isStarred: !report[0].isStarred,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(savedReports.id, reportId));
}

// ── SCHEDULED REPORTS ─────────────────────────────────────────────────────────

export async function getScheduledReports(
  organizationId: number,
  opts: { limit?: number; offset?: number } = {}
) {
  const db = getDb();
  const { scheduledReports } = await import("../drizzle/schema");
  const { limit = 50, offset = 0 } = opts;

  return db.select()
    .from(scheduledReports)
    .where(eq(scheduledReports.organizationId, organizationId))
    .orderBy(desc(scheduledReports.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getScheduledReport(organizationId: number, id: number) {
  const db = getDb();
  const { scheduledReports } = await import("../drizzle/schema");

  const result = await db.select()
    .from(scheduledReports)
    .where(and(
      eq(scheduledReports.organizationId, organizationId),
      eq(scheduledReports.id, id)
    ))
    .limit(1);

  return result[0] || null;
}

export async function createScheduledReport(
  organizationId: number,
  userId: number,
  data: {
    reportId: string;
    name: string;
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
    recipients: string[];
    includeChart?: boolean;
    format?: "csv" | "pdf";
  }
) {
  const db = getDb();
  const { scheduledReports } = await import("../drizzle/schema");
  const { calculateNextRun } = await import("./_core/reportScheduling");

  const nextRun = calculateNextRun(
    data.frequency,
    data.hour,
    data.minute,
    data.dayOfWeek,
    data.dayOfMonth
  );

  return db.insert(scheduledReports).values({
    organizationId,
    createdBy: userId,
    reportId: data.reportId,
    name: data.name,
    frequency: data.frequency,
    dayOfWeek: data.dayOfWeek || null,
    dayOfMonth: data.dayOfMonth || null,
    hour: data.hour,
    minute: data.minute,
    recipients: JSON.stringify(data.recipients),
    includeChart: data.includeChart !== false,
    format: data.format || "pdf",
    isActive: true,
    nextRun,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateScheduledReport(
  organizationId: number,
  id: number,
  data: Partial<{
    name: string;
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek: number;
    dayOfMonth: number;
    hour: number;
    minute: number;
    recipients: string[];
    includeChart: boolean;
    format: "csv" | "pdf";
    isActive: boolean;
    lastRun: string;
    nextRun: string;
  }>
) {
  const db = getDb();
  const { scheduledReports } = await import("../drizzle/schema");

  const updateData: any = { ...data };
  if (data.recipients) {
    updateData.recipients = JSON.stringify(data.recipients);
  }
  updateData.updatedAt = new Date().toISOString();

  return db.update(scheduledReports)
    .set(updateData)
    .where(and(
      eq(scheduledReports.organizationId, organizationId),
      eq(scheduledReports.id, id)
    ));
}

export async function deleteScheduledReport(organizationId: number, id: number) {
  const db = getDb();
  const { scheduledReports } = await import("../drizzle/schema");

  return db.delete(scheduledReports)
    .where(and(
      eq(scheduledReports.organizationId, organizationId),
      eq(scheduledReports.id, id)
    ));
}

export async function getScheduledReportsToRun(now: string) {
  const db = getDb();
  const { scheduledReports } = await import("../drizzle/schema");

  return db.select()
    .from(scheduledReports)
    .where(and(
      eq(scheduledReports.isActive, true),
      lte(scheduledReports.nextRun, now)
    ));
}


// ── INVENTORY ─────────────────────────────────────────────────────────────────

export async function getInventoryList(organizationId: number, opts: { limit?: number; offset?: number; search?: string; lowStock?: boolean } = {}) {
  const db = getDb();
  const { limit = 50, offset = 0, search, lowStock } = opts;
  // Get all inventory with product info
  const rows = await db
    .select({
      id: inventory.id,
      productId: inventory.productId,
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      maxStock: inventory.maxStock,
      location: inventory.location,
      updatedAt: inventory.updatedAt,
      productName: products.name,
      productSku: products.sku,
      productCategory: products.category,
      productPrice: products.price,
    })
    .from(inventory)
    .leftJoin(products, eq(inventory.productId, products.id))
    .where(eq(inventory.organizationId, organizationId))
    .orderBy(desc(inventory.updatedAt))
    .limit(limit)
    .offset(offset);

  let data = rows;
  if (search) {
    const s = search.toLowerCase();
    data = rows.filter(r => r.productName?.toLowerCase().includes(s) || r.productSku?.toLowerCase().includes(s));
  }
  if (lowStock) {
    data = data.filter(r => r.minStock !== null && r.quantity <= (r.minStock ?? 0));
  }
  return { data, total: data.length };
}

export async function getInventoryByProduct(organizationId: number, productId: number) {
  const db = getDb();
  const rows = await db.select().from(inventory)
    .where(and(eq(inventory.organizationId, organizationId), eq(inventory.productId, productId)))
    .limit(1);
  return rows[0] || null;
}

export async function upsertInventory(organizationId: number, productId: number, quantity: number, opts: { minStock?: number; maxStock?: number; location?: string } = {}) {
  const db = getDb();
  const existing = await getInventoryByProduct(organizationId, productId);
  if (existing) {
    await db.update(inventory).set({
      quantity,
      minStock: opts.minStock ?? existing.minStock,
      maxStock: opts.maxStock ?? existing.maxStock,
      location: opts.location ?? existing.location,
      updatedAt: new Date().toISOString(),
    }).where(and(eq(inventory.organizationId, organizationId), eq(inventory.productId, productId)));
    return { id: existing.id };
  } else {
    const r = await db.insert(inventory).values({
      organizationId,
      productId,
      quantity,
      minStock: opts.minStock ?? 0,
      maxStock: opts.maxStock ?? null,
      location: opts.location ?? null,
      updatedAt: new Date().toISOString(),
    } as InsertInventory);
    return { id: Number(r.lastInsertRowid) };
  }
}

export async function createInventoryMovement(organizationId: number, userId: number, data: {
  productId: number;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  reason?: string;
  reference?: string;
}) {
  const db = getDb();
  const existing = await getInventoryByProduct(organizationId, data.productId);
  const previousStock = existing?.quantity ?? 0;
  let newStock = previousStock;
  if (data.type === "entrada") newStock = previousStock + data.quantity;
  else if (data.type === "salida") newStock = Math.max(0, previousStock - data.quantity);
  else newStock = data.quantity; // ajuste

  // Update inventory
  await upsertInventory(organizationId, data.productId, newStock);

  // Record movement
  const r = await db.insert(inventoryMovements).values({
    organizationId,
    productId: data.productId,
    type: data.type,
    quantity: data.quantity,
    previousStock,
    newStock,
    reason: data.reason ?? null,
    reference: data.reference ?? null,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  } as InsertInventoryMovement);

  return { id: Number(r.lastInsertRowid), newStock };
}

export async function getInventoryMovements(organizationId: number, productId?: number, opts: { limit?: number; offset?: number } = {}) {
  const db = getDb();
  const { limit = 50, offset = 0 } = opts;
  const conds: any[] = [eq(inventoryMovements.organizationId, organizationId)];
  if (productId) conds.push(eq(inventoryMovements.productId, productId));
  const rows = await db
    .select({
      id: inventoryMovements.id,
      productId: inventoryMovements.productId,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      previousStock: inventoryMovements.previousStock,
      newStock: inventoryMovements.newStock,
      reason: inventoryMovements.reason,
      reference: inventoryMovements.reference,
      createdAt: inventoryMovements.createdAt,
      productName: products.name,
      productSku: products.sku,
    })
    .from(inventoryMovements)
    .leftJoin(products, eq(inventoryMovements.productId, products.id))
    .where(and(...conds))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

// ── INVOICES ──────────────────────────────────────────────────────────────────

export async function getInvoicesList(organizationId: number, opts: { limit?: number; offset?: number; status?: string } = {}) {
  const db = getDb();
  const { limit = 20, offset = 0, status } = opts;
  const conds: any[] = [eq(invoices.organizationId, organizationId)];
  if (status) conds.push(eq(invoices.status, status as any));
  const [data, total] = await Promise.all([
    db.select().from(invoices).where(and(...conds)).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(invoices).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function getInvoiceById(organizationId: number, id: number) {
  const db = getDb();
  const [invoice, items, paymentsList] = await Promise.all([
    db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId))).limit(1),
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)),
    db.select().from(payments).where(and(eq(payments.invoiceId, id), eq(payments.organizationId, organizationId))),
  ]);
  if (!invoice[0]) return null;
  return { ...invoice[0], items, payments: paymentsList };
}

export async function createInvoice(organizationId: number, userId: number, data: {
  quotationId?: number;
  opportunityId?: number;
  contactId?: number;
  companyId?: number;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  terms?: string;
  items: { description: string; quantity: number; unitPrice: number; discount?: number; productId?: number }[];
}) {
  const db = getDb();
  const taxRate = data.taxRate ?? 19;
  const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const number = `FAC-${Date.now()}`;
  const issueDate = data.issueDate ?? new Date().toISOString().split("T")[0];

  const r = await db.insert(invoices).values({
    organizationId,
    number,
    quotationId: data.quotationId ?? null,
    opportunityId: data.opportunityId ?? null,
    contactId: data.contactId ?? null,
    companyId: data.companyId ?? null,
    status: "emitida",
    issueDate,
    dueDate: data.dueDate ?? null,
    subtotal,
    taxRate,
    tax,
    discount: 0,
    total,
    paidAmount: 0,
    notes: data.notes ?? null,
    terms: data.terms ?? null,
    createdBy: userId,
  } as InsertInvoice);

  const invoiceId = Number(r.lastInsertRowid);

  if (data.items.length > 0) {
    await db.insert(invoiceItems).values(data.items.map(i => ({
      invoiceId,
      productId: i.productId ?? null,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount ?? 0,
      total: i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100),
    })) as InsertInvoiceItem[]);
  }

  return { id: invoiceId, number };
}

export async function updateInvoice(organizationId: number, id: number, data: Partial<InsertInvoice>) {
  const db = getDb();
  await db.update(invoices).set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));
  return { success: true };
}

export async function deleteInvoice(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  await db.delete(payments).where(and(eq(payments.invoiceId, id), eq(payments.organizationId, organizationId)));
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));
  return { success: true };
}

export async function createPayment(organizationId: number, userId: number, data: {
  invoiceId: number;
  amount: number;
  method: "efectivo" | "transferencia" | "tarjeta" | "cheque" | "otro";
  reference?: string;
  notes?: string;
  paymentDate?: string;
}) {
  const db = getDb();
  const r = await db.insert(payments).values({
    organizationId,
    invoiceId: data.invoiceId,
    amount: data.amount,
    method: data.method,
    reference: data.reference ?? null,
    notes: data.notes ?? null,
    paymentDate: data.paymentDate ?? new Date().toISOString().split("T")[0],
    createdBy: userId,
  } as InsertPayment);

  // Update paidAmount on invoice
  const invoice = await getInvoiceById(organizationId, data.invoiceId);
  if (invoice) {
    const totalPaid = (invoice.paidAmount ?? 0) + data.amount;
    const newStatus = totalPaid >= invoice.total ? "pagada" : invoice.status;
    await db.update(invoices).set({
      paidAmount: totalPaid,
      status: newStatus as any,
      updatedAt: new Date().toISOString(),
    }).where(and(eq(invoices.id, data.invoiceId), eq(invoices.organizationId, organizationId)));
  }

  return { id: Number(r.lastInsertRowid) };
}

export async function getPaymentsByInvoice(organizationId: number, invoiceId: number) {
  const db = getDb();
  return db.select().from(payments)
    .where(and(eq(payments.invoiceId, invoiceId), eq(payments.organizationId, organizationId)))
    .orderBy(desc(payments.createdAt));
}

// ── GMAIL INTEGRATION ─────────────────────────────────────────────────────────

export async function getGmailIntegration(organizationId: number, userId: number) {
  const db = getDb();
  const rows = await db.select().from(gmailIntegrations)
    .where(and(eq(gmailIntegrations.organizationId, organizationId), eq(gmailIntegrations.userId, userId)))
    .limit(1);
  return rows[0] || null;
}

export async function upsertGmailIntegration(organizationId: number, userId: number, data: {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}) {
  const db = getDb();
  const existing = await getGmailIntegration(organizationId, userId);
  if (existing) {
    await db.update(gmailIntegrations).set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? existing.refreshToken,
      expiresAt: data.expiresAt ?? existing.expiresAt,
      updatedAt: new Date().toISOString(),
    }).where(and(eq(gmailIntegrations.organizationId, organizationId), eq(gmailIntegrations.userId, userId)));
    return existing;
  }
  const r = await db.insert(gmailIntegrations).values({
    organizationId,
    userId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    expiresAt: data.expiresAt ?? null,
  } as InsertGmailIntegration);
  return { id: Number(r.lastInsertRowid) };
}

export async function deleteGmailIntegration(organizationId: number, userId: number) {
  const db = getDb();
  await db.delete(gmailIntegrations)
    .where(and(eq(gmailIntegrations.organizationId, organizationId), eq(gmailIntegrations.userId, userId)));
  return { success: true };
}

// ── CUSTOM FIELDS ─────────────────────────────────────────────────────────────

export async function getCustomFields(organizationId: number, entityType?: string) {
  const db = getDb();
  const conds: any[] = [eq(customFields.organizationId, organizationId), eq(customFields.isActive, true)];
  if (entityType) conds.push(eq(customFields.entityType, entityType as any));
  return db.select().from(customFields).where(and(...conds)).orderBy(customFields.order);
}

export async function createCustomField(organizationId: number, data: {
  entityType: "lead" | "contact" | "opportunity" | "company";
  name: string;
  label: string;
  type: "text" | "number" | "email" | "phone" | "date" | "select" | "checkbox" | "textarea";
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  order?: number;
}) {
  const db = getDb();
  const r = await db.insert(customFields).values({
    organizationId,
    entityType: data.entityType,
    name: data.name,
    label: data.label,
    type: data.type,
    required: data.required ?? false,
    options: data.options ? JSON.stringify(data.options) : null,
    defaultValue: data.defaultValue ?? null,
    order: data.order ?? 0,
    isActive: true,
  } as InsertCustomField);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateCustomField(organizationId: number, id: number, data: Partial<InsertCustomField>) {
  const db = getDb();
  await db.update(customFields).set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(customFields.id, id), eq(customFields.organizationId, organizationId)));
  return { success: true };
}

export async function deleteCustomField(organizationId: number, id: number) {
  const db = getDb();
  await db.update(customFields).set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(and(eq(customFields.id, id), eq(customFields.organizationId, organizationId)));
  return { success: true };
}

export async function getCustomFieldValues(entityType: string, entityId: number) {
  const db = getDb();
  return db.select().from(customFieldValues)
    .where(and(eq(customFieldValues.entityType, entityType), eq(customFieldValues.entityId, entityId)));
}

export async function setCustomFieldValue(fieldId: number, entityType: string, entityId: number, value: string) {
  const db = getDb();
  const existing = await db.select().from(customFieldValues)
    .where(and(eq(customFieldValues.fieldId, fieldId), eq(customFieldValues.entityId, entityId), eq(customFieldValues.entityType, entityType)))
    .limit(1);
  if (existing[0]) {
    await db.update(customFieldValues).set({ value, updatedAt: new Date().toISOString() })
      .where(eq(customFieldValues.id, existing[0].id));
  } else {
    await db.insert(customFieldValues).values({ fieldId, entityType, entityId, value } as InsertCustomFieldValue);
  }
  return { success: true };
}

// ── CALLS ─────────────────────────────────────────────────────────────────────

export async function getCallsList(organizationId: number, opts: {
  limit?: number; offset?: number; leadId?: number; contactId?: number;
} = {}) {
  const db = getDb();
  const { limit = 50, offset = 0, leadId, contactId } = opts;
  const conds: any[] = [eq(calls.organizationId, organizationId)];
  if (leadId) conds.push(eq(calls.leadId, leadId));
  if (contactId) conds.push(eq(calls.contactId, contactId));
  const [data, total] = await Promise.all([
    db.select().from(calls).where(and(...conds)).orderBy(desc(calls.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(calls).where(and(...conds)),
  ]);
  return { data, total: Number(total[0]?.count) || 0 };
}

export async function createCall(organizationId: number, userId: number, data: {
  leadId?: number; contactId?: number; opportunityId?: number;
  direction?: "inbound" | "outbound"; status?: string; duration?: number;
  phone?: string; notes?: string; outcome?: string; scheduledAt?: string; calledAt?: string;
}) {
  const db = getDb();
  const r = await db.insert(calls).values({
    organizationId,
    assignedTo: userId,
    leadId: data.leadId ?? null,
    contactId: data.contactId ?? null,
    opportunityId: data.opportunityId ?? null,
    direction: data.direction ?? "outbound",
    status: (data.status ?? "completed") as any,
    duration: data.duration ?? 0,
    phone: data.phone ?? null,
    notes: data.notes ?? null,
    outcome: (data.outcome ?? null) as any,
    scheduledAt: data.scheduledAt ?? null,
    calledAt: data.calledAt ?? new Date().toISOString(),
  } as InsertCall);
  return { id: Number(r.lastInsertRowid) };
}

export async function updateCall(organizationId: number, id: number, data: Partial<InsertCall>) {
  const db = getDb();
  await db.update(calls).set(data).where(and(eq(calls.id, id), eq(calls.organizationId, organizationId)));
  return { success: true };
}

export async function deleteCall(organizationId: number, id: number) {
  const db = getDb();
  await db.delete(calls).where(and(eq(calls.id, id), eq(calls.organizationId, organizationId)));
  return { success: true };
}

export async function getCallStats(organizationId: number) {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const allCalls = await db.select().from(calls).where(eq(calls.organizationId, organizationId));
  const todayCalls = allCalls.filter(c => c.createdAt?.startsWith(today));
  const totalDuration = allCalls.reduce((s, c) => s + (c.duration ?? 0), 0);
  const completed = allCalls.filter(c => c.status === "completed").length;
  return {
    total: allCalls.length,
    today: todayCalls.length,
    completed,
    avgDuration: allCalls.length ? Math.round(totalDuration / allCalls.length) : 0,
    totalDuration,
  };
}
