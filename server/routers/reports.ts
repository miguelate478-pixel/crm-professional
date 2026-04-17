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

  // ── Saved Reports ──────────────────────────────────────────────────────────

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        folder: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getSavedReports(ctx.user.organizationId, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["tabla", "grafico", "embudo"]),
        folder: z.string().optional(),
        config: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createSavedReport(ctx.user.organizationId, ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["tabla", "grafico", "embudo"]).optional(),
        folder: z.string().optional(),
        config: z.any().optional(),
        isStarred: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateSavedReport(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteSavedReport(ctx.user.organizationId, input.id);
    }),

  toggleStar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.toggleReportStar(ctx.user.organizationId, input.id);
    }),
});
