import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const activitiesRouter = router({
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["llamada", "reunion", "visita", "email"]),
      title: z.string().min(1),
      description: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      leadId: z.number().optional(),
      contactId: z.number().optional(),
      opportunityId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createActivity(ctx.user.organizationId, ctx.user.id, input);
    }),

  list: protectedProcedure
    .input(z.object({
      type: z.enum(["llamada", "reunion", "visita", "email"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return db.getActivitiesList(ctx.user.organizationId, input);
    }),

  getByLead: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getActivitiesByLead(ctx.user.organizationId, input.leadId);
    }),

  getByOpportunity: protectedProcedure
    .input(z.object({ opportunityId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getActivitiesByOpportunity(ctx.user.organizationId, input.opportunityId);
    }),
});
