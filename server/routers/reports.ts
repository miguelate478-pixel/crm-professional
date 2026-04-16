import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const reportsRouter = router({
  getDashboardKPIs: protectedProcedure.query(async ({ ctx }) => {
    return db.getDashboardKPIs(ctx.user.organizationId);
  }),

  getSalesFunnel: protectedProcedure
    .input(
      z.object({
        pipelineId: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getSalesFunnel(ctx.user.organizationId, input);
    }),

  getRevenueByMonth: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getRevenueByMonth(ctx.user.organizationId, input.months);
    }),

  getLeadsBySource: protectedProcedure.query(async ({ ctx }) => {
    return db.getLeadsBySource(ctx.user.organizationId);
  }),

  getRecentActivities: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return db.getRecentActivities(ctx.user.organizationId, input.limit);
    }),
});
