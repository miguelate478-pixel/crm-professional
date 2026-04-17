import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { calculateNextRun } from "../_core/reportScheduling";

export const scheduledReportsRouter = router({
  // Get all scheduled reports for organization
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getScheduledReports(ctx.user.organizationId, input);
    }),

  // Get a specific scheduled report
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getScheduledReport(ctx.user.organizationId, input.id);
    }),

  // Create a new scheduled report
  create: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        name: z.string().min(1),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).default(9),
        minute: z.number().min(0).max(59).default(0),
        recipients: z.array(z.string().email()),
        includeChart: z.boolean().default(true),
        format: z.enum(["csv", "pdf"]).default("pdf"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createScheduledReport(ctx.user.organizationId, ctx.user.id, input);
    }),

  // Update a scheduled report
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).optional(),
        minute: z.number().min(0).max(59).optional(),
        recipients: z.array(z.string().email()).optional(),
        includeChart: z.boolean().optional(),
        format: z.enum(["csv", "pdf"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Recalculate nextRun if frequency or time changed
      if (data.frequency || data.hour !== undefined || data.minute !== undefined) {
        const current = await db.getScheduledReport(ctx.user.organizationId, id);
        if (current) {
          const frequency = (data.frequency || current.frequency) as "daily" | "weekly" | "monthly";
          const hour = data.hour !== undefined ? data.hour : (current.hour || 9);
          const minute = data.minute !== undefined ? data.minute : (current.minute || 0);
          const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : (current.dayOfWeek || 0);
          const dayOfMonth = data.dayOfMonth !== undefined ? data.dayOfMonth : (current.dayOfMonth || 1);

          const nextRun = calculateNextRun(frequency, hour, minute, dayOfWeek, dayOfMonth);
          (data as any).nextRun = nextRun;
        }
      }

      return db.updateScheduledReport(ctx.user.organizationId, id, data);
    }),

  // Delete a scheduled report
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteScheduledReport(ctx.user.organizationId, input.id);
    }),

  // Toggle active status
  toggleActive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const report = await db.getScheduledReport(ctx.user.organizationId, input.id);
      if (!report) {
        throw new Error("Scheduled report not found");
      }

      return db.updateScheduledReport(ctx.user.organizationId, input.id, {
        isActive: !report.isActive,
      });
    }),

  // Test run a scheduled report
  testRun: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const report = await db.getScheduledReport(ctx.user.organizationId, input.id);
      if (!report) {
        throw new Error("Scheduled report not found");
      }

      // TODO: Implement test run logic
      return {
        success: true,
        message: `Test run for "${report.name}" would be sent to: ${report.recipients}`,
      };
    }),
});
