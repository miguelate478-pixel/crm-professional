import {
  integer,
  sqliteTable,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── CORE ──────────────────────────────────────────────────────────────────────

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  avatar: text("avatar"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("user_org_idx").on(t.organizationId),
}));

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: integer("leaderId"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── PROYECTOS INMOBILIARIOS ───────────────────────────────────────────────────

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  status: text("status", { enum: ["activo", "pausado", "cerrado"] }).default("activo"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export const projectAssignments = sqliteTable("project_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ── LEADS ─────────────────────────────────────────────────────────────────────

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  projectId: integer("projectId"),
  firstName: text("firstName").notNull(),
  lastName: text("lastName"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("jobTitle"),
  source: text("source"),
  status: text("status", {
    enum: [
      "nuevo", "recontacto", "contactado", "no_efectivo",
      "conf_visita", "reprog_visita", "no_se_presento",
      "agendo_visita", "reciclado", "visita_no_asistida",
      "separacion", "venta"
    ]
  }).default("nuevo"),
  score: integer("score").default(0),
  assignedTo: integer("assignedTo"),
  notes: text("notes"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("lead_org_idx").on(t.organizationId),
  projectIdx: index("lead_project_idx").on(t.projectId),
}));

// ── COMPANIES ─────────────────────────────────────────────────────────────────

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  industry: text("industry"),
  employees: integer("employees"),
  annualRevenue: real("annualRevenue"),
  description: text("description"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

// ── CONTACTS ──────────────────────────────────────────────────────────────────

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  companyId: integer("companyId"),
  firstName: text("firstName").notNull(),
  lastName: text("lastName"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  jobTitle: text("jobTitle"),
  department: text("department"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  notes: text("notes"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("contact_org_idx").on(t.organizationId),
}));

// ── PIPELINES & STAGES ────────────────────────────────────────────────────────

export const pipelines = sqliteTable("pipelines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export const stages = sqliteTable("stages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pipelineId: integer("pipelineId").notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color"),
  probability: integer("probability").default(0),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── OPPORTUNITIES ─────────────────────────────────────────────────────────────

export const opportunities = sqliteTable("opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  leadId: integer("leadId"),
  contactId: integer("contactId"),
  companyId: integer("companyId"),
  pipelineId: integer("pipelineId").notNull(),
  stageId: integer("stageId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  amount: real("amount"),
  probability: integer("probability").default(0),
  expectedCloseDate: text("expectedCloseDate"),
  assignedTo: integer("assignedTo"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("opp_org_idx").on(t.organizationId),
  stageIdx: index("opp_stage_idx").on(t.stageId),
}));

// ── TASKS ─────────────────────────────────────────────────────────────────────

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pendiente", "en_progreso", "completada"] }).default("pendiente"),
  priority: text("priority", { enum: ["baja", "media", "alta"] }).default("media"),
  dueDate: text("dueDate"),
  assignedTo: integer("assignedTo"),
  leadId: integer("leadId"),
  contactId: integer("contactId"),
  opportunityId: integer("opportunityId"),
  createdBy: integer("createdBy").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

// ── ACTIVITIES ────────────────────────────────────────────────────────────────

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  type: text("type", { enum: ["llamada", "reunion", "visita", "email"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: text("startTime").notNull(),
  endTime: text("endTime"),
  leadId: integer("leadId"),
  contactId: integer("contactId"),
  opportunityId: integer("opportunityId"),
  assignedTo: integer("assignedTo"),
  createdBy: integer("createdBy").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  price: real("price").notNull(),
  cost: real("cost"),
  sku: text("sku"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── QUOTATIONS ────────────────────────────────────────────────────────────────

export const quotations = sqliteTable("quotations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  number: text("number").notNull().unique(),
  opportunityId: integer("opportunityId"),
  contactId: integer("contactId"),
  companyId: integer("companyId"),
  status: text("status", { enum: ["borrador", "enviada", "aceptada", "rechazada"] }).default("borrador"),
  subtotal: real("subtotal").default(0),
  tax: real("tax").default(0),
  total: real("total").default(0),
  validUntil: text("validUntil"),
  notes: text("notes"),
  createdBy: integer("createdBy").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export const quotationItems = sqliteTable("quotation_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quotationId: integer("quotationId").notNull(),
  productId: integer("productId"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  discount: real("discount").default(0),
  total: real("total").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── GOALS ─────────────────────────────────────────────────────────────────────

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  targetAmount: real("targetAmount").notNull(),
  period: text("period", { enum: ["mensual", "trimestral", "anual"] }).notNull(),
  assignedTo: integer("assignedTo"),
  startDate: text("startDate").notNull(),
  endDate: text("endDate").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  userId: integer("userId").notNull(),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: integer("entityId"),
  oldValues: text("oldValues"),
  newValues: text("newValues"),
  ipAddress: text("ipAddress"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = typeof pipelines.$inferInsert;
export type Stage = typeof stages.$inferSelect;
export type InsertStage = typeof stages.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = typeof quotationItems.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
