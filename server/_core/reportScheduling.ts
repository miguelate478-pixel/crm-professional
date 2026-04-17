import * as db from "../db";
import * as advancedReports from "./advancedReports";

/**
 * Calculate next run time based on frequency and schedule
 */
export function calculateNextRun(
  frequency: "daily" | "weekly" | "monthly",
  hour: number,
  minute: number,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const now = new Date();
  let nextRun = new Date();

  if (frequency === "daily") {
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(hour, minute, 0, 0);
  } else if (frequency === "weekly") {
    const currentDay = nextRun.getDay();
    const targetDay = dayOfWeek || 0;
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    nextRun.setDate(nextRun.getDate() + daysToAdd);
    nextRun.setHours(hour, minute, 0, 0);
  } else if (frequency === "monthly") {
    const targetDay = dayOfMonth || 1;
    nextRun.setMonth(nextRun.getMonth() + 1);
    nextRun.setDate(targetDay);
    nextRun.setHours(hour, minute, 0, 0);
  }

  return nextRun.toISOString();
}

/**
 * Generate report and send via email
 */
export async function executeScheduledReport(
  organizationId: number,
  scheduledReportId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Get scheduled report config
    const scheduledReport = await db.getScheduledReport(organizationId, scheduledReportId);
    if (!scheduledReport) {
      return { success: false, message: "Scheduled report not found" };
    }

    // Generate the report
    const report = await advancedReports.generateReport(organizationId, scheduledReport.reportId);
    if (!report) {
      return { success: false, message: "Failed to generate report" };
    }

    // Parse recipients
    const recipients = JSON.parse(scheduledReport.recipients);
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { success: false, message: "No recipients configured" };
    }

    // TODO: Send email with report
    // For now, just log that it would be sent
    console.log(`[Report Scheduling] Would send ${scheduledReport.name} to:`, recipients);

    // Update last run time
    const nextRun = calculateNextRun(
      scheduledReport.frequency as "daily" | "weekly" | "monthly",
      scheduledReport.hour || 9,
      scheduledReport.minute || 0,
      scheduledReport.dayOfWeek || undefined,
      scheduledReport.dayOfMonth || undefined
    );

    await db.updateScheduledReport(organizationId, scheduledReportId, {
      lastRun: new Date().toISOString(),
      nextRun,
    });

    return { success: true, message: "Report scheduled execution completed" };
  } catch (error) {
    console.error("Error executing scheduled report:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Get all scheduled reports that need to run now
 */
export async function getScheduledReportsToRun(): Promise<
  Array<{ organizationId: number; scheduledReportId: number }>
> {
  try {
    const now = new Date().toISOString();
    const scheduledReports = await db.getScheduledReportsToRun(now);
    return scheduledReports.map((sr) => ({
      organizationId: sr.organizationId,
      scheduledReportId: sr.id,
    }));
  } catch (error) {
    console.error("Error getting scheduled reports to run:", error);
    return [];
  }
}

/**
 * Run all scheduled reports that are due
 */
export async function runDueScheduledReports(): Promise<void> {
  try {
    const reportsToRun = await getScheduledReportsToRun();

    for (const { organizationId, scheduledReportId } of reportsToRun) {
      await executeScheduledReport(organizationId, scheduledReportId);
    }
  } catch (error) {
    console.error("Error running due scheduled reports:", error);
  }
}
