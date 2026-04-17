import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const callsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      leadId: z.number().optional(),
      contactId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => db.getCallsList(ctx.user.organizationId, input)),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number().optional(),
      contactId: z.number().optional(),
      opportunityId: z.number().optional(),
      direction: z.enum(["inbound", "outbound"]).default("outbound"),
      status: z.enum(["completed", "no_answer", "busy", "failed", "scheduled"]).default("completed"),
      duration: z.number().default(0),
      phone: z.string().optional(),
      notes: z.string().optional(),
      outcome: z.enum(["interested", "not_interested", "callback", "no_answer", "left_voicemail", "other"]).optional(),
      scheduledAt: z.string().optional(),
      calledAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => db.createCall(ctx.user.organizationId, ctx.user.id, input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["completed", "no_answer", "busy", "failed", "scheduled"]).optional(),
      duration: z.number().optional(),
      notes: z.string().optional(),
      outcome: z.enum(["interested", "not_interested", "callback", "no_answer", "left_voicemail", "other"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCall(ctx.user.organizationId, id, data as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteCall(ctx.user.organizationId, input.id)),

  getStats: protectedProcedure.query(async ({ ctx }) => db.getCallStats(ctx.user.organizationId)),
});
