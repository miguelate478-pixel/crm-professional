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

// ── GOOGLE CALENDAR ───────────────────────────────────────────────────────────

export const googleCalendarIntegrations = sqliteTable("google_calendar_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  userId: integer("userId").notNull(),
  googleCalendarId: text("googleCalendarId").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: text("expiresAt"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  syncedAt: text("syncedAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("gcal_org_idx").on(t.organizationId),
  userIdx: index("gcal_user_idx").on(t.userId),
}));

export const googleCalendarEvents = sqliteTable("google_calendar_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  integrationId: integer("integrationId").notNull(),
  googleEventId: text("googleEventId").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: text("startTime").notNull(),
  endTime: text("endTime"),
  location: text("location"),
  attendees: text("attendees"), // JSON array
  taskId: integer("taskId"),
  activityId: integer("activityId"),
  syncedAt: text("syncedAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("gcevent_org_idx").on(t.organizationId),
  integrationIdx: index("gcevent_integration_idx").on(t.integrationId),
}));

// ── SAVED REPORTS ─────────────────────────────────────────────────────────────

export const savedReports = sqliteTable("saved_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  createdBy: integer("createdBy").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["tabla", "grafico", "embudo"] }).notNull(),
  folder: text("folder").default("General"),
  config: text("config"), // JSON config for the report
  isStarred: integer("isStarred", { mode: "boolean" }).default(false),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("report_org_idx").on(t.organizationId),
}));

// ── SCHEDULED REPORTS ─────────────────────────────────────────────────────────

export const scheduledReports = sqliteTable("scheduled_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  createdBy: integer("createdBy").notNull(),
  reportId: text("reportId").notNull(), // ID of the report to generate
  name: text("name").notNull(),
  frequency: text("frequency", { enum: ["daily", "weekly", "monthly"] }).notNull(),
  dayOfWeek: integer("dayOfWeek").default(0), // 0-6 for weekly (0=Sunday)
  dayOfMonth: integer("dayOfMonth").default(1), // 1-31 for monthly
  hour: integer("hour").default(9).notNull(), // 0-23
  minute: integer("minute").default(0).notNull(), // 0-59
  recipients: text("recipients").notNull(), // JSON array of emails
  includeChart: integer("includeChart", { mode: "boolean" }).default(true).notNull(),
  format: text("format", { enum: ["csv", "pdf"] }).default("pdf").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  lastRun: text("lastRun"),
  nextRun: text("nextRun"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("scheduled_report_org_idx").on(t.organizationId),
  activeIdx: index("scheduled_report_active_idx").on(t.isActive),
}));

// ── MICROSOFT TEAMS ───────────────────────────────────────────────────────────

export const teamsIntegrations = sqliteTable("teams_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  userId: integer("userId").notNull(),
  tenantId: text("tenantId").notNull(),
  clientId: text("clientId").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: text("expiresAt"),
  teamId: text("teamId"),
  teamName: text("teamName"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  notifyNewLeads: integer("notifyNewLeads", { mode: "boolean" }).default(true).notNull(),
  notifyNewOpportunities: integer("notifyNewOpportunities", { mode: "boolean" }).default(true).notNull(),
  notifyNewTasks: integer("notifyNewTasks", { mode: "boolean" }).default(true).notNull(),
  leadsChannelId: text("leadsChannelId"),
  opportunitiesChannelId: text("opportunitiesChannelId"),
  tasksChannelId: text("tasksChannelId"),
  syncedAt: text("syncedAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("teams_org_idx").on(t.organizationId),
  userIdx: index("teams_user_idx").on(t.userId),
  tenantIdx: index("teams_tenant_idx").on(t.tenantId),
}));

export const teamsChannels = sqliteTable("teams_channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  integrationId: integer("integrationId").notNull(),
  channelId: text("channelId").notNull(),
  channelName: text("channelName").notNull(),
  channelType: text("channelType", { enum: ["leads", "opportunities", "tasks", "general"] }).default("general"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  integrationIdx: index("teams_channel_integration_idx").on(t.integrationId),
}));

export const teamsMessages = sqliteTable("teams_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  integrationId: integer("integrationId").notNull(),
  messageId: text("messageId").notNull().unique(),
  channelId: text("channelId").notNull(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  content: text("content").notNull(),
  leadId: integer("leadId"),
  opportunityId: integer("opportunityId"),
  taskId: integer("taskId"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  integrationIdx: index("teams_msg_integration_idx").on(t.integrationId),
  leadIdx: index("teams_msg_lead_idx").on(t.leadId),
}));

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

// ── WORKFLOWS ─────────────────────────────────────────────────────────────────

export const workflows = sqliteTable("workflows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  createdBy: integer("createdBy").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  nodes: text("nodes").notNull(), // JSON array of workflow nodes
  edges: text("edges").notNull(), // JSON array of workflow edges
  config: text("config"), // JSON config (viewport, etc)
  executionCount: integer("executionCount").default(0).notNull(),
  lastExecutedAt: text("lastExecutedAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("workflow_org_idx").on(t.organizationId),
  activeIdx: index("workflow_active_idx").on(t.isActive),
}));

export const workflowExecutions = sqliteTable("workflow_executions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  workflowId: integer("workflowId").notNull(),
  triggeredBy: text("triggeredBy").notNull(), // "manual", "trigger", "schedule"
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).default("pending").notNull(),
  result: text("result"), // JSON with execution results
  error: text("error"),
  startedAt: text("startedAt"),
  completedAt: text("completedAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("workflow_exec_org_idx").on(t.organizationId),
  workflowIdx: index("workflow_exec_workflow_idx").on(t.workflowId),
  statusIdx: index("workflow_exec_status_idx").on(t.status),
}));

export const workflowTriggerEvents = sqliteTable("workflow_trigger_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  workflowId: integer("workflowId").notNull(),
  triggerType: text("triggerType").notNull(), // lead_created, lead_status_changed, etc
  triggerData: text("triggerData"), // JSON with trigger context
  entityType: text("entityType"), // "lead", "opportunity", etc
  entityId: integer("entityId"),
  processed: integer("processed", { mode: "boolean" }).default(false).notNull(),
  processedAt: text("processedAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("trigger_event_org_idx").on(t.organizationId),
  workflowIdx: index("trigger_event_workflow_idx").on(t.workflowId),
  processedIdx: index("trigger_event_processed_idx").on(t.processed),
}));

// ── DASHBOARD CONFIGURATIONS ──────────────────────────────────────────────────

export const dashboardConfigs = sqliteTable("dashboard_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false),
  isTemplate: integer("isTemplate", { mode: "boolean" }).default(false),
  templateCategory: text("templateCategory"), // e.g., "sales", "marketing", "support"
  layout: text("layout").default("grid"), // "grid" or "custom"
  gridCols: integer("gridCols").default(12),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("dashboard_org_idx").on(t.organizationId),
  userIdx: index("dashboard_user_idx").on(t.userId),
  templateIdx: index("dashboard_template_idx").on(t.isTemplate),
}));

export const dashboardWidgets = sqliteTable("dashboard_widgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dashboardConfigId: integer("dashboardConfigId").notNull(),
  type: text("type", {
    enum: ["kpi", "chart", "table", "list", "custom"]
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull(), // Order in dashboard
  gridX: integer("gridX").default(0), // Grid column position
  gridY: integer("gridY").default(0), // Grid row position
  gridW: integer("gridW").default(3), // Grid width
  gridH: integer("gridH").default(2), // Grid height
  config: text("config").notNull(), // JSON config for widget
  dataSource: text("dataSource"), // e.g., "leads", "opportunities", "tasks"
  refreshInterval: integer("refreshInterval").default(300), // seconds
  isVisible: integer("isVisible", { mode: "boolean" }).default(true),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  dashboardIdx: index("widget_dashboard_idx").on(t.dashboardConfigId),
}));

export const dashboardTemplates = sqliteTable("dashboard_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", {
    enum: ["sales", "marketing", "support", "operations", "executive"]
  }).notNull(),
  icon: text("icon"), // Icon name
  preview: text("preview"), // JSON preview data
  widgetsConfig: text("widgetsConfig").notNull(), // JSON array of widget configs
  isPublic: integer("isPublic", { mode: "boolean" }).default(false),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("template_org_idx").on(t.organizationId),
  categoryIdx: index("template_category_idx").on(t.category),
}));

export const dashboardShares = sqliteTable("dashboard_shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dashboardConfigId: integer("dashboardConfigId").notNull(),
  sharedBy: integer("sharedBy").notNull(),
  sharedWith: integer("sharedWith").notNull(),
  permission: text("permission", { enum: ["view", "edit"] }).default("view"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  dashboardIdx: index("share_dashboard_idx").on(t.dashboardConfigId),
  userIdx: index("share_user_idx").on(t.sharedWith),
}));

// ── GMAIL INTEGRATION ─────────────────────────────────────────────────────────

export const gmailIntegrations = sqliteTable("gmail_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  userId: integer("userId").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: text("expiresAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgUserIdx: index("gmail_org_user_idx").on(t.organizationId, t.userId),
}));

// ── INVENTORY ─────────────────────────────────────────────────────────────────

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  productId: integer("productId").notNull(),
  quantity: real("quantity").notNull().default(0),
  minStock: real("minStock").default(0),
  maxStock: real("maxStock"),
  location: text("location"),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("inv_org_idx").on(t.organizationId),
  productIdx: index("inv_product_idx").on(t.productId),
}));

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  productId: integer("productId").notNull(),
  type: text("type", { enum: ["entrada", "salida", "ajuste"] }).notNull(),
  quantity: real("quantity").notNull(),
  previousStock: real("previousStock").notNull(),
  newStock: real("newStock").notNull(),
  reason: text("reason"),
  reference: text("reference"),
  createdBy: integer("createdBy").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("invmov_org_idx").on(t.organizationId),
  productIdx: index("invmov_product_idx").on(t.productId),
}));

// ── INVOICES ──────────────────────────────────────────────────────────────────

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  number: text("number").notNull(),
  quotationId: integer("quotationId"),
  opportunityId: integer("opportunityId"),
  contactId: integer("contactId"),
  companyId: integer("companyId"),
  status: text("status", { enum: ["borrador", "emitida", "pagada", "vencida", "anulada"] }).default("borrador").notNull(),
  issueDate: text("issueDate").notNull(),
  dueDate: text("dueDate"),
  subtotal: real("subtotal").notNull().default(0),
  taxRate: real("taxRate").notNull().default(19),
  tax: real("tax").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull().default(0),
  paidAmount: real("paidAmount").notNull().default(0),
  notes: text("notes"),
  terms: text("terms"),
  createdBy: integer("createdBy").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("inv_invoice_org_idx").on(t.organizationId),
}));

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoiceId").notNull(),
  productId: integer("productId"),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull(),
  invoiceId: integer("invoiceId").notNull(),
  amount: real("amount").notNull(),
  method: text("method", { enum: ["efectivo", "transferencia", "tarjeta", "cheque", "otro"] }).notNull(),
  reference: text("reference"),
  notes: text("notes"),
  paymentDate: text("paymentDate").notNull(),
  createdBy: integer("createdBy").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, t => ({
  orgIdx: index("pay_org_idx").on(t.organizationId),
  invoiceIdx: index("pay_invoice_idx").on(t.invoiceId),
}));

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
export type GoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferSelect;
export type InsertGoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferInsert;
export type GoogleCalendarEvent = typeof googleCalendarEvents.$inferSelect;
export type InsertGoogleCalendarEvent = typeof googleCalendarEvents.$inferInsert;
export type SavedReport = typeof savedReports.$inferSelect;
export type InsertSavedReport = typeof savedReports.$inferInsert;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type WorkflowTriggerEvent = typeof workflowTriggerEvents.$inferSelect;
export type InsertWorkflowTriggerEvent = typeof workflowTriggerEvents.$inferInsert;
export type DashboardConfig = typeof dashboardConfigs.$inferSelect;
export type InsertDashboardConfig = typeof dashboardConfigs.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type GmailIntegration = typeof gmailIntegrations.$inferSelect;
export type InsertGmailIntegration = typeof gmailIntegrations.$inferInsert;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = typeof dashboardWidgets.$inferInsert;
export type DashboardTemplate = typeof dashboardTemplates.$inferSelect;
export type InsertDashboardTemplate = typeof dashboardTemplates.$inferInsert;
export type DashboardShare = typeof dashboardShares.$inferSelect;
export type InsertDashboardShare = typeof dashboardShares.$inferInsert;
export type TeamsIntegration = typeof teamsIntegrations.$inferSelect;
export type InsertTeamsIntegration = typeof teamsIntegrations.$inferInsert;
export type TeamsChannel = typeof teamsChannels.$inferSelect;
export type InsertTeamsChannel = typeof teamsChannels.$inferInsert;
export type TeamsMessage = typeof teamsMessages.$inferSelect;
export type InsertTeamsMessage = typeof teamsMessages.$inferInsert;
