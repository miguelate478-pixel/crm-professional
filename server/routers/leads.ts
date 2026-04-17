import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const leadStatusEnum = z.enum(["nuevo", "recontacto", "contactado", "no_efectivo", "conf_visita", "reprog_visita", "no_se_presento", "agendo_visita", "reciclado", "visita_no_asistida", "separacion", "venta"]);

export const leadsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: leadStatusEnum.optional(),
        assignedTo: z.number().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getLeadsList(ctx.user.organizationId, input);
    }),

  myLeads: protectedProcedure.query(async ({ ctx }) => {
    return db.getLeadsList(ctx.user.organizationId, { assignedTo: ctx.user.id, limit: 100 });
  }),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        source: z.string().optional(),
        status: leadStatusEnum.default("nuevo"),
        score: z.number().min(0).max(100).default(0),
        notes: z.string().optional(),
        assignedTo: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createLead(ctx.user.organizationId, ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        source: z.string().optional(),
        status: leadStatusEnum.optional(),
        score: z.number().min(0).max(100).optional(),
        assignedTo: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateLead(ctx.user.organizationId, id, data);
    }),

  assign: protectedProcedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.assignLeadToUser(ctx.user.organizationId, input.id, input.userId);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteLead(ctx.user.organizationId, input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getLeadById(ctx.user.organizationId, input.id);
    }),

  checkDuplicates: protectedProcedure
    .input(z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.findDuplicateLeads(ctx.user.organizationId, input.email, input.phone, input.firstName, input.lastName);
    }),
});
