import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createDashboard,
  updateDashboard,
  deleteDashboard,
  listDashboards,
  getDashboard,
  saveDashboardLayout,
  loadDashboardLayout,
  getDefaultDashboard,
  WIDGET_TEMPLATES,
} from "../_core/dashboardBuilder";

const WidgetConfigSchema = z.object({
  dataSource: z.string(),
  metric: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  chartType: z.enum(["bar", "line", "pie", "area", "table"]).optional(),
  refreshInterval: z.number().optional(),
});

const WidgetSchema = z.object({
  id: z.string(),
  type: z.enum(["KPI", "Chart", "Table"]),
  title: z.string(),
  config: WidgetConfigSchema,
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
});

const DashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  widgets: z.array(WidgetSchema),
  layout: z.object({
    columns: z.number().default(12),
    rowHeight: z.number().default(60),
  }),
  isDefault: z.boolean().default(false),
});

export const dashboardBuilderRouter = router({
  // Get widget templates
  getWidgetTemplates: protectedProcedure.query(() => {
    return WIDGET_TEMPLATES;
  }),

  // Create a new dashboard
  createDashboard: protectedProcedure
    .input(DashboardSchema)
    .mutation(async ({ ctx, input }) => {
      const dashboard = await createDashboard(ctx.user.organizationId, ctx.user.id, {
        name: input.name,
        description: input.description || "",
        widgets: input.widgets,
        layout: input.layout,
        isDefault: input.isDefault,
      });
      return dashboard;
    }),

  // Update an existing dashboard
  updateDashboard: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...DashboardSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dashboard = await updateDashboard(
        ctx.user.organizationId,
        ctx.user.id,
        input.id,
        {
          name: input.name,
          description: input.description,
          widgets: input.widgets,
          layout: input.layout,
          isDefault: input.isDefault,
        }
      );
      return dashboard;
    }),

  // Delete a dashboard
  deleteDashboard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteDashboard(ctx.user.organizationId, ctx.user.id, input.id);
      return { success };
    }),

  // List all dashboards for the user
  listDashboards: protectedProcedure.query(async ({ ctx }) => {
    const dashboards = await listDashboards(ctx.user.organizationId, ctx.user.id);
    return dashboards;
  }),

  // Get a specific dashboard
  getDashboard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const dashboard = await getDashboard(ctx.user.organizationId, ctx.user.id, input.id);
      return dashboard;
    }),

  // Get default dashboard
  getDefaultDashboard: protectedProcedure.query(async ({ ctx }) => {
    const dashboard = await getDefaultDashboard(ctx.user.organizationId, ctx.user.id);
    return dashboard;
  }),

  // Save dashboard layout
  saveDashboardLayout: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        layout: z.object({
          columns: z.number(),
          rowHeight: z.number(),
        }),
        widgets: z.array(WidgetSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dashboard = await saveDashboardLayout(
        ctx.user.organizationId,
        ctx.user.id,
        input.id,
        input.layout,
        input.widgets
      );
      return dashboard;
    }),

  // Load dashboard layout
  loadDashboardLayout: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const dashboard = await loadDashboardLayout(ctx.user.organizationId, ctx.user.id, input.id);
      return dashboard;
    }),
});
