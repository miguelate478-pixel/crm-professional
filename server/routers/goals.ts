import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const goalsRouter = router({
  list: protectedProcedure
    .input(z.object({
      period: z.enum(["mensual", "trimestral", "anual"]).optional(),
      assignedTo: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getGoalsList(ctx.user.organizationId, input);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      targetAmount: z.number().min(0),
      period: z.enum(["mensual", "trimestral", "anual"]),
      assignedTo: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createGoal(ctx.user.organizationId, input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      targetAmount: z.number().min(0).optional(),
      period: z.enum(["mensual", "trimestral", "anual"]).optional(),
      assignedTo: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateGoal(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteGoal(ctx.user.organizationId, input.id);
    }),

  getProgress: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getGoalProgress(ctx.user.organizationId, input.id);
    }),
});
