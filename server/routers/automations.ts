import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const automationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getAutomations(ctx.user.organizationId);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        trigger: z.string(),
        triggerValue: z.string().optional(),
        action: z.string(),
        actionValue: z.string().optional(),
        isActive: z.boolean().default(true),
        daysThreshold: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createAutomation(ctx.user.organizationId, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        trigger: z.string().optional(),
        triggerValue: z.string().optional(),
        action: z.string().optional(),
        actionValue: z.string().optional(),
        isActive: z.boolean().optional(),
        daysThreshold: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateAutomation(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteAutomation(ctx.user.organizationId, input.id);
    }),

  runAll: protectedProcedure.mutation(async ({ ctx }) => {
    return db.runAutomations(ctx.user.organizationId, ctx.user.id);
  }),

  run: protectedProcedure.mutation(async ({ ctx }) => {
    return db.runAutomations(ctx.user.organizationId, ctx.user.id);
  }),
});
