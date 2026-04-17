import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as advancedReports from "../_core/advancedReports";
import * as pdfExport from "../_core/pdfExport";

export const advancedReportsRouter = router({
  // Get all available reports metadata
  getAvailableReports: protectedProcedure.query(async () => {
    return [
      {
        id: "sales_funnel",
        name: "Sales Funnel",
        description: "Visualization of leads through sales stages",
        chartType: "bar",
      },
      {
        id: "pipeline_by_stage",
        name: "Pipeline by Stage",
        description: "Total pipeline value and count by stage",
        chartType: "bar",
      },
      {
        id: "revenue_forecast",
        name: "Revenue Forecast",
        description: "12-month revenue forecast",
        chartType: "line",
      },
      {
        id: "lead_source_analysis",
        name: "Lead Source Analysis",
        description: "Lead count and conversion rate by source",
        chartType: "pie",
      },
      {
        id: "conversion_rate",
        name: "Conversion Rate",
        description: "Conversion rates across sales funnel",
        chartType: "bar",
      },
      {
        id: "monthly_revenue",
        name: "Monthly Revenue",
        description: "Closed deals revenue by month",
        chartType: "area",
      },
      {
        id: "top_opportunities",
        name: "Top Opportunities",
        description: "Top 10 opportunities by amount",
        chartType: "table",
      },
      {
        id: "lead_age",
        name: "Lead Age",
        description: "Distribution of leads by age",
        chartType: "bar",
      },
      {
        id: "opportunity_age",
        name: "Opportunity Age",
        description: "Distribution of opportunities by age",
        chartType: "bar",
      },
      {
        id: "average_deal_size",
        name: "Average Deal Size",
        description: "Average opportunity amount by stage",
        chartType: "bar",
      },
      {
        id: "sales_cycle_length",
        name: "Sales Cycle Length",
        description: "Average time to close deals",
        chartType: "bar",
      },
    ];
  }),

  // Generate a specific report
  generateReport: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const report = await advancedReports.generateReport(
        ctx.user.organizationId,
        input.reportId
      );
      if (!report) {
        throw new Error(`Report ${input.reportId} not found`);
      }
      return report;
    }),

  // Generate multiple reports for dashboard
  generateDashboard: protectedProcedure
    .input(
      z.object({
        reportIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reports = await Promise.all(
        input.reportIds.map((id) =>
          advancedReports.generateReport(ctx.user.organizationId, id)
        )
      );
      return reports.filter((r) => r !== null);
    }),

  // Export report as PDF (placeholder for future implementation)
  exportReportPDF: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { html, filename } = await pdfExport.exportReportAsPDF(
          ctx.user.organizationId,
          input.reportId,
          ctx.user.name || "CRM Professional"
        );

        return {
          success: true,
          html,
          filename,
          message: "PDF export generated successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: String(error),
        };
      }
    }),

  // Export report as CSV
  exportReportCSV: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await advancedReports.generateReport(
        ctx.user.organizationId,
        input.reportId
      );
      if (!report) {
        throw new Error(`Report ${input.reportId} not found`);
      }

      // Convert data to CSV format
      if (!Array.isArray(report.data) || report.data.length === 0) {
        return { success: false, message: "No data to export" };
      }

      const headers = Object.keys(report.data[0]);
      const csvContent = [
        headers.join(","),
        ...report.data.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header];
              // Escape quotes and wrap in quotes if contains comma
              if (typeof value === "string" && value.includes(",")) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      return {
        success: true,
        data: csvContent,
        filename: `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),
});
