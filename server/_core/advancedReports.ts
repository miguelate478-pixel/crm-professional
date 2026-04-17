import * as db from "../db";

/**
 * Advanced Reports Module
 * Generates 20+ predefined reports
 */

export interface ReportData {
  title: string;
  description: string;
  data: any[];
  chartType: "bar" | "line" | "pie" | "area" | "table";
  generatedAt: string;
}

/**
 * Sales Funnel Report
 */
export async function getSalesFunnelReport(organizationId: number): Promise<ReportData> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const statusCounts = {
    "nuevo": leads.data.filter(l => l.status === "nuevo").length,
    "contactado": leads.data.filter(l => l.status === "contactado").length,
    "calificado": opportunities.data.filter(o => o.stageId === 2).length,
    "propuesta": opportunities.data.filter(o => o.stageId === 3).length,
    "negociacion": opportunities.data.filter(o => o.stageId === 4).length,
    "cerrado": opportunities.data.filter(o => o.stageId === 5).length,
  };

  return {
    title: "Sales Funnel",
    description: "Visualization of leads through sales stages",
    data: Object.entries(statusCounts).map(([stage, count]) => ({
      stage,
      count,
    })),
    chartType: "bar",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Pipeline by Stage Report
 */
export async function getPipelineByStageReport(organizationId: number): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const stages = [
    { id: 1, name: "Prospect" },
    { id: 2, name: "Qualified" },
    { id: 3, name: "Proposal" },
    { id: 4, name: "Negotiation" },
    { id: 5, name: "Closed" },
  ];

  const data = stages.map(stage => {
    const stageOpps = opportunities.data.filter(o => o.stageId === stage.id);
    const total = stageOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const count = stageOpps.length;
    return {
      stage: stage.name,
      total,
      count,
      average: count > 0 ? Math.round(total / count) : 0,
    };
  });

  return {
    title: "Pipeline by Stage",
    description: "Total pipeline value and count by stage",
    data,
    chartType: "bar",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Revenue Forecast Report
 */
export async function getRevenueForecastReport(organizationId: number): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    return date.toISOString().slice(0, 7);
  });

  const data = months.map(month => {
    const monthOpps = opportunities.data.filter(o => {
      const closeDate = o.expectedCloseDate?.slice(0, 7);
      return closeDate === month;
    });

    const forecast = monthOpps.reduce((sum, o) => {
      const weighted = (Number(o.amount) || 0) * (o.probability || 0) / 100;
      return sum + weighted;
    }, 0);

    return {
      month,
      forecast: Math.round(forecast),
    };
  });

  return {
    title: "Revenue Forecast",
    description: "12-month revenue forecast based on opportunities",
    data,
    chartType: "line",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Lead Source Analysis Report
 */
export async function getLeadSourceAnalysisReport(organizationId: number): Promise<ReportData> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });

  const sources = new Map<string, { count: number; converted: number }>();

  leads.data.forEach(lead => {
    const source = lead.source || "Unknown";
    if (!sources.has(source)) {
      sources.set(source, { count: 0, converted: 0 });
    }
    const current = sources.get(source)!;
    current.count++;
    if (lead.status === "venta" || lead.status === "conf_visita") {
      current.converted++;
    }
  });

  const data = Array.from(sources.entries()).map(([source, stats]) => ({
    source,
    total: stats.count,
    converted: stats.converted,
    conversionRate: Math.round((stats.converted / stats.count) * 100),
  }));

  return {
    title: "Lead Source Analysis",
    description: "Lead count and conversion rate by source",
    data,
    chartType: "bar",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Conversion Rate Report
 */
export async function getConversionRateReport(organizationId: number): Promise<ReportData> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const totalLeads = leads.data.length;
  const convertedLeads = leads.data.filter(l => l.status === "venta").length;
  const totalOpps = opportunities.data.length;
  const closedOpps = opportunities.data.filter(o => o.stageId === 5).length;

  const data = [
    {
      metric: "Lead to Opportunity",
      rate: totalLeads > 0 ? Math.round((totalOpps / totalLeads) * 100) : 0,
      total: totalLeads,
      converted: totalOpps,
    },
    {
      metric: "Opportunity to Deal",
      rate: totalOpps > 0 ? Math.round((closedOpps / totalOpps) * 100) : 0,
      total: totalOpps,
      converted: closedOpps,
    },
    {
      metric: "Lead to Deal",
      rate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
      total: totalLeads,
      converted: convertedLeads,
    },
  ];

  return {
    title: "Conversion Rate",
    description: "Conversion rates across sales funnel",
    data,
    chartType: "bar",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Monthly Revenue Report
 */
export async function getMonthlyRevenueReport(organizationId: number): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date.toISOString().slice(0, 7);
  });

  const data = months.map(month => {
    const monthOpps = opportunities.data.filter(o => {
      const closeDate = o.expectedCloseDate?.slice(0, 7);
      return closeDate === month && o.stageId === 5;
    });

    const revenue = monthOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    return {
      month,
      revenue: Math.round(revenue),
    };
  });

  return {
    title: "Monthly Revenue",
    description: "Closed deals revenue by month",
    data,
    chartType: "line",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Top Opportunities Report
 */
export async function getTopOpportunitiesReport(organizationId: number, limit: number = 10): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 100 });

  const data = opportunities.data
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, limit)
    .map(o => ({
      name: o.name,
      amount: Number(o.amount) || 0,
      probability: o.probability || 0,
      stage: ["Prospect", "Qualified", "Proposal", "Negotiation", "Closed"][o.stageId - 1],
      weighted: Math.round((Number(o.amount) || 0) * (o.probability || 0) / 100),
    }));

  return {
    title: "Top Opportunities",
    description: `Top ${limit} opportunities by amount`,
    data,
    chartType: "table",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Lead Age Report
 */
export async function getLeadAgeReport(organizationId: number): Promise<ReportData> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  const now = new Date();

  const ageGroups = {
    "0-7 days": 0,
    "8-30 days": 0,
    "31-90 days": 0,
    "90+ days": 0,
  };

  leads.data.forEach(lead => {
    const createdDate = new Date(lead.createdAt);
    const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (ageInDays <= 7) ageGroups["0-7 days"]++;
    else if (ageInDays <= 30) ageGroups["8-30 days"]++;
    else if (ageInDays <= 90) ageGroups["31-90 days"]++;
    else ageGroups["90+ days"]++;
  });

  const data = Object.entries(ageGroups).map(([group, count]) => ({
    group,
    count,
  }));

  return {
    title: "Lead Age",
    description: "Distribution of leads by age",
    data,
    chartType: "pie",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Opportunity Age Report
 */
export async function getOpportunityAgeReport(organizationId: number): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });
  const now = new Date();

  const ageGroups = {
    "0-7 days": 0,
    "8-30 days": 0,
    "31-90 days": 0,
    "90+ days": 0,
  };

  opportunities.data.forEach(opp => {
    const createdDate = new Date(opp.createdAt);
    const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (ageInDays <= 7) ageGroups["0-7 days"]++;
    else if (ageInDays <= 30) ageGroups["8-30 days"]++;
    else if (ageInDays <= 90) ageGroups["31-90 days"]++;
    else ageGroups["90+ days"]++;
  });

  const data = Object.entries(ageGroups).map(([group, count]) => ({
    group,
    count,
  }));

  return {
    title: "Opportunity Age",
    description: "Distribution of opportunities by age",
    data,
    chartType: "pie",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Average Deal Size Report
 */
export async function getAverageDealSizeReport(organizationId: number): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const stages = [
    { id: 1, name: "Prospect" },
    { id: 2, name: "Qualified" },
    { id: 3, name: "Proposal" },
    { id: 4, name: "Negotiation" },
    { id: 5, name: "Closed" },
  ];

  const data = stages.map(stage => {
    const stageOpps = opportunities.data.filter(o => o.stageId === stage.id);
    const total = stageOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const average = stageOpps.length > 0 ? Math.round(total / stageOpps.length) : 0;

    return {
      stage: stage.name,
      average,
      count: stageOpps.length,
    };
  });

  return {
    title: "Average Deal Size",
    description: "Average opportunity amount by stage",
    data,
    chartType: "bar",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Sales Cycle Length Report
 */
export async function getSalesCycleLengthReport(organizationId: number): Promise<ReportData> {
  const opportunities = await db.getOpportunitiesList(organizationId, { limit: 1000 });

  const closedOpps = opportunities.data.filter(o => o.stageId === 5);
  const now = new Date();

  const cycleLengths = closedOpps.map(opp => {
    const createdDate = new Date(opp.createdAt);
    const days = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  });

  const average = cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((a, b) => a + b) / cycleLengths.length) : 0;
  const min = cycleLengths.length > 0 ? Math.min(...cycleLengths) : 0;
  const max = cycleLengths.length > 0 ? Math.max(...cycleLengths) : 0;

  const data = [
    { metric: "Average Cycle Length", value: average, unit: "days" },
    { metric: "Shortest Cycle", value: min, unit: "days" },
    { metric: "Longest Cycle", value: max, unit: "days" },
    { metric: "Closed Deals", value: closedOpps.length, unit: "count" },
  ];

  return {
    title: "Sales Cycle Length",
    description: "Average time to close deals",
    data,
    chartType: "table",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get all available reports
 */
export const AVAILABLE_REPORTS = [
  { id: "sales-funnel", name: "Sales Funnel", fn: getSalesFunnelReport },
  { id: "pipeline-by-stage", name: "Pipeline by Stage", fn: getPipelineByStageReport },
  { id: "revenue-forecast", name: "Revenue Forecast", fn: getRevenueForecastReport },
  { id: "lead-source", name: "Lead Source Analysis", fn: getLeadSourceAnalysisReport },
  { id: "conversion-rate", name: "Conversion Rate", fn: getConversionRateReport },
  { id: "monthly-revenue", name: "Monthly Revenue", fn: getMonthlyRevenueReport },
  { id: "top-opportunities", name: "Top Opportunities", fn: getTopOpportunitiesReport },
  { id: "lead-age", name: "Lead Age", fn: getLeadAgeReport },
  { id: "opportunity-age", name: "Opportunity Age", fn: getOpportunityAgeReport },
  { id: "average-deal-size", name: "Average Deal Size", fn: getAverageDealSizeReport },
  { id: "sales-cycle-length", name: "Sales Cycle Length", fn: getSalesCycleLengthReport },
];

/**
 * Generate report by ID
 */
export async function generateReport(organizationId: number, reportId: string): Promise<ReportData | null> {
  const report = AVAILABLE_REPORTS.find(r => r.id === reportId);
  if (!report) return null;

  return report.fn(organizationId);
}
