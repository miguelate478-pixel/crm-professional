import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { leadsRouter } from "./routers/leads";
import { contactsRouter } from "./routers/contacts";
import { opportunitiesRouter } from "./routers/opportunities";
import { tasksRouter } from "./routers/tasks";
import { quotationsRouter } from "./routers/quotations";
import { reportsRouter } from "./routers/reports";
import { goalsRouter } from "./routers/goals";
import { usersRouter } from "./routers/users";
import { activitiesRouter } from "./routers/activities";
import { companiesRouter } from "./routers/companies";
import { productsRouter } from "./routers/products";
import { automationsRouter } from "./routers/automations";
import { whatsappRouter } from "./routers/whatsapp";
import { googleCalendarRouter } from "./routers/googleCalendar";
import { leadScoringRouter } from "./routers/leadScoring";
import { deduplicationRouter } from "./routers/deduplication";
import { slackRouter } from "./routers/slack";
import { advancedReportsRouter } from "./routers/advancedReports";
import { scheduledReportsRouter } from "./routers/scheduledReports";
import { inventoryRouter } from "./routers/inventory";
import { invoicesRouter } from "./routers/invoices";
import { teamsRouter } from "./routers/teams";
import { gmailRouter } from "./routers/gmail";
import { customFieldsRouter } from "./routers/customFields";
import { callsRouter } from "./routers/calls";
import * as db from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  leads: leadsRouter,
  contacts: contactsRouter,
  opportunities: opportunitiesRouter,
  tasks: tasksRouter,
  quotations: quotationsRouter,
  reports: reportsRouter,
  goals: goalsRouter,
  users: usersRouter,
  activities: activitiesRouter,
  companies: companiesRouter,
  products: productsRouter,
  automations: automationsRouter,
  whatsapp: whatsappRouter,
  googleCalendar: googleCalendarRouter,
  leadScoring: leadScoringRouter,
  deduplication: deduplicationRouter,
  slack: slackRouter,
  advancedReports: advancedReportsRouter,
  scheduledReports: scheduledReportsRouter,
  inventory: inventoryRouter,
  invoices: invoicesRouter,
  teams: teamsRouter,
  gmail: gmailRouter,
  customFields: customFieldsRouter,
  calls: callsRouter,

  search: router({
    global: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return db.globalSearch(ctx.user.organizationId, input.query);
      }),
  }),

  notifications: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotifications(ctx.user.organizationId);
    }),
  }),

  seed: router({
    loadDemo: protectedProcedure.mutation(async ({ ctx }) => {
      const orgId = ctx.user.organizationId;
      const userId = ctx.user.id;

      // Get default pipeline
      const pipeline = await db.getDefaultPipeline(orgId);
      if (!pipeline) throw new Error("No hay pipeline configurado");
      const stages = await db.getPipelineStages(pipeline.id);
      const stageMap: Record<string, number> = {};
      stages.forEach(s => { stageMap[s.name] = s.id; });

      // Companies
      const [c1, c2, c3, c4] = await Promise.all([
        db.createCompany(orgId, { name: "TechCorp", industry: "Tecnología", employees: 150, city: "Bogotá", country: "Colombia", email: "info@techcorp.com", website: "https://techcorp.com" }),
        db.createCompany(orgId, { name: "Innovate SAS", industry: "Software", employees: 80, city: "Medellín", country: "Colombia", email: "info@innovate.com" }),
        db.createCompany(orgId, { name: "GlobalCo", industry: "Consultoría", employees: 320, city: "Cali", country: "Colombia", email: "info@globalco.com" }),
        db.createCompany(orgId, { name: "Enterprise SA", industry: "Manufactura", employees: 500, city: "Bogotá", country: "Colombia", email: "info@enterprise.com" }),
      ]);

      // Leads
      await Promise.all([
        db.createLead(orgId, userId, { firstName: "Carlos", lastName: "Mendoza", email: "carlos@techcorp.com", phone: "+57 300 111 2222", company: "TechCorp", jobTitle: "CEO", source: "Sitio Web", status: "contactado", score: 85 }),
        db.createLead(orgId, userId, { firstName: "Ana", lastName: "Rodríguez", email: "ana@innovate.com", phone: "+57 310 222 3333", company: "Innovate SAS", jobTitle: "CTO", source: "Referido", status: "contactado", score: 72 }),
        db.createLead(orgId, userId, { firstName: "Pedro", lastName: "García", email: "pedro@globalco.com", phone: "+57 320 333 4444", company: "GlobalCo", jobTitle: "Director", source: "Email", status: "nuevo", score: 55 }),
        db.createLead(orgId, userId, { firstName: "María", lastName: "López", email: "maria@startup.com", phone: "+57 315 444 5555", company: "StartupXYZ", jobTitle: "Fundadora", source: "Redes Sociales", status: "nuevo", score: 63 }),
        db.createLead(orgId, userId, { firstName: "Luis", lastName: "Torres", email: "luis@enterprise.com", phone: "+57 305 555 6666", company: "Enterprise SA", jobTitle: "VP Ventas", source: "Sitio Web", status: "contactado", score: 91 }),
      ]);

      // Contacts
      await Promise.all([
        db.createContact(orgId, { firstName: "Carlos", lastName: "Mendoza", email: "carlos@techcorp.com", phone: "+57 300 111 2222", jobTitle: "CEO", department: "Dirección", city: "Bogotá", country: "Colombia", companyId: c1.id }),
        db.createContact(orgId, { firstName: "Ana", lastName: "Rodríguez", email: "ana@innovate.com", phone: "+57 310 222 3333", jobTitle: "CTO", department: "Tecnología", city: "Medellín", country: "Colombia", companyId: c2.id }),
        db.createContact(orgId, { firstName: "Pedro", lastName: "García", email: "pedro@globalco.com", phone: "+57 320 333 4444", jobTitle: "Director Comercial", department: "Ventas", city: "Cali", country: "Colombia", companyId: c3.id }),
        db.createContact(orgId, { firstName: "Luis", lastName: "Torres", email: "luis@enterprise.com", phone: "+57 305 555 6666", jobTitle: "VP Ventas", department: "Comercial", city: "Bogotá", country: "Colombia", companyId: c4.id }),
      ]);

      // Opportunities
      const today = new Date();
      const addDays = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().split("T")[0];
      await Promise.all([
        db.createOpportunity(orgId, userId, { name: "Implementación ERP - TechCorp", amount: 85000, probability: 75, expectedCloseDate: addDays(75), pipelineId: pipeline.id, stageId: stageMap["Negociación"] ?? stages[3]?.id ?? stages[0].id, companyId: c1.id }),
        db.createOpportunity(orgId, userId, { name: "Consultoría Digital - Innovate", amount: 42000, probability: 60, expectedCloseDate: addDays(90), pipelineId: pipeline.id, stageId: stageMap["Propuesta"] ?? stages[2]?.id ?? stages[0].id, companyId: c2.id }),
        db.createOpportunity(orgId, userId, { name: "Licencias Software - GlobalCo", amount: 28000, probability: 40, expectedCloseDate: addDays(108), pipelineId: pipeline.id, stageId: stageMap["Calificado"] ?? stages[1]?.id ?? stages[0].id, companyId: c3.id }),
        db.createOpportunity(orgId, userId, { name: "Proyecto Alpha - Enterprise SA", amount: 120000, probability: 25, expectedCloseDate: addDays(167), pipelineId: pipeline.id, stageId: stageMap["Prospecto"] ?? stages[0].id, companyId: c4.id }),
      ]);

      // Tasks
      await Promise.all([
        db.createTask(orgId, userId, { title: "Llamar a Carlos Mendoza - TechCorp", priority: "alta", status: "pendiente", dueDate: addDays(1) }),
        db.createTask(orgId, userId, { title: "Enviar propuesta a Innovate SAS", priority: "alta", status: "pendiente", dueDate: addDays(2) }),
        db.createTask(orgId, userId, { title: "Reunión de seguimiento - GlobalCo", priority: "media", status: "pendiente", dueDate: addDays(3) }),
        db.createTask(orgId, userId, { title: "Preparar demo para Enterprise SA", priority: "alta", status: "en_progreso", dueDate: addDays(5) }),
      ]);

      // Products
      await Promise.all([
        db.createProduct(orgId, { name: "CRM Pro - Plan Básico", category: "Software", price: 299, cost: 50, sku: "CRM-BASIC", isActive: true }),
        db.createProduct(orgId, { name: "CRM Pro - Plan Empresarial", category: "Software", price: 899, cost: 150, sku: "CRM-ENT", isActive: true }),
        db.createProduct(orgId, { name: "Consultoría de Implementación", category: "Servicios", price: 150, cost: 60, sku: "CONS-IMPL", isActive: true }),
        db.createProduct(orgId, { name: "Soporte Premium Anual", category: "Servicios", price: 1200, cost: 200, sku: "SUPP-PREM", isActive: true }),
      ]);

      return { success: true, message: "Datos de demo cargados correctamente" };
    }),
  }),
});

export type AppRouter = typeof appRouter;
