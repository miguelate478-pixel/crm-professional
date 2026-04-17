export interface WidgetConfig {
  dataSource: string;
  metric?: string;
  filters?: Record<string, any>;
  chartType?: "bar" | "line" | "pie" | "area" | "table";
  refreshInterval?: number;
}

export interface Widget {
  id: string;
  type: "KPI" | "Chart" | "Table";
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Dashboard {
  id: string;
  organizationId: number;
  userId: number;
  name: string;
  description: string;
  widgets: Widget[];
  layout: {
    columns: number;
    rowHeight: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function createDashboard(
  organizationId: number,
  userId: number,
  dashboard: Omit<Dashboard, "id" | "organizationId" | "userId" | "createdAt" | "updatedAt">
): Promise<Dashboard> {
  const id = `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const newDashboard: Dashboard = {
    id,
    organizationId,
    userId,
    ...dashboard,
    createdAt: now,
    updatedAt: now,
  };

  return newDashboard;
}

export async function updateDashboard(
  organizationId: number,
  userId: number,
  dashboardId: string,
  updates: Partial<Omit<Dashboard, "id" | "organizationId" | "userId" | "createdAt">>
): Promise<Dashboard> {
  const now = new Date();

  return {
    id: dashboardId,
    organizationId,
    userId,
    name: updates.name || "",
    description: updates.description || "",
    widgets: updates.widgets || [],
    layout: updates.layout || { columns: 12, rowHeight: 60 },
    isDefault: updates.isDefault ?? false,
    createdAt: new Date(),
    updatedAt: now,
  };
}

export async function deleteDashboard(
  organizationId: number,
  userId: number,
  dashboardId: string
): Promise<boolean> {
  // Delete from database (placeholder)
  return true;
}

export async function listDashboards(organizationId: number, userId: number): Promise<Dashboard[]> {
  // Query from database (placeholder)
  return [];
}

export async function getDashboard(
  organizationId: number,
  userId: number,
  dashboardId: string
): Promise<Dashboard | null> {
  // Query from database (placeholder)
  return null;
}

export async function saveDashboardLayout(
  organizationId: number,
  userId: number,
  dashboardId: string,
  layout: Dashboard["layout"],
  widgets: Widget[]
): Promise<Dashboard> {
  const now = new Date();

  return {
    id: dashboardId,
    organizationId,
    userId,
    name: "",
    description: "",
    widgets,
    layout,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: now,
  };
}

export async function loadDashboardLayout(
  organizationId: number,
  userId: number,
  dashboardId: string
): Promise<Dashboard | null> {
  // Query from database (placeholder)
  return null;
}

export async function getDefaultDashboard(
  organizationId: number,
  userId: number
): Promise<Dashboard | null> {
  // Query from database (placeholder)
  return null;
}

// Predefined widget templates
export const WIDGET_TEMPLATES = [
  {
    id: "kpi_revenue",
    name: "Total Revenue",
    type: "KPI" as const,
    config: {
      dataSource: "opportunities",
      metric: "total_amount",
      filters: { status: "closed" },
    },
  },
  {
    id: "kpi_leads",
    name: "Active Leads",
    type: "KPI" as const,
    config: {
      dataSource: "leads",
      metric: "count",
      filters: { status: "active" },
    },
  },
  {
    id: "chart_pipeline",
    name: "Pipeline by Stage",
    type: "Chart" as const,
    config: {
      dataSource: "opportunities",
      chartType: "bar",
      metric: "amount",
      filters: {},
    },
  },
  {
    id: "chart_revenue_trend",
    name: "Revenue Trend",
    type: "Chart" as const,
    config: {
      dataSource: "opportunities",
      chartType: "line",
      metric: "amount",
      filters: { status: "closed" },
    },
  },
  {
    id: "table_top_opportunities",
    name: "Top Opportunities",
    type: "Table" as const,
    config: {
      dataSource: "opportunities",
      chartType: "table",
      filters: {},
    },
  },
];
