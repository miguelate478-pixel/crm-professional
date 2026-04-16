import CRMLayout from "@/components/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Target, DollarSign,
  CheckSquare, Calendar, Filter, Download, ArrowRight,
  FileText, Activity, Clock, AlertCircle, Sparkles, Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function shortMonth(ym: string) {
  const [, m] = ym.split("-");
  return MONTH_LABELS[m] ?? ym;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000
            ? fmt(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KPICard({
  title, value, sub, trend, trendVal, icon: Icon, color,
}: {
  title: string; value: string; sub: string;
  trend?: "up" | "down"; trendVal?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendVal}</span>
            <span className="text-muted-foreground font-normal">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Priority badge ─────────────────────────────────────────────────────────────

const priorityConfig: Record<string, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  media: { label: "Media", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  baja:  { label: "Baja",  className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

// ── Source colors ──────────────────────────────────────────────────────────────

const SOURCE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#84CC16"];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [asesor, setAsesor] = useState("todos");
  const [mes, setMes] = useState("todos");

  // Seed demo data
  const utils = trpc.useUtils();
  const seedMutation = trpc.seed.loadDemo.useMutation({
    onSuccess: () => {
      toast.success("¡Datos de demo cargados! Recargando...");
      setTimeout(() => window.location.reload(), 1200);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Auth for personalized welcome
  const { user } = trpc.auth.me.useQuery(undefined, { select: d => d }) as any;
  const userName = user?.name?.split(" ")[0] ?? null;

  // ── Data queries ──────────────────────────────────────────────────────────────
  const { data: kpis } = trpc.reports.getDashboardKPIs.useQuery();
  const { data: leadsData } = trpc.leads.list.useQuery({ limit: 1 });
  const { data: oppsData } = trpc.opportunities.list.useQuery({ limit: 100 });
  const { data: tasksData } = trpc.tasks.list.useQuery({ limit: 100, status: "pendiente" });
  const { data: funnelData } = trpc.reports.getSalesFunnel.useQuery({});
  const { data: revenueData } = trpc.reports.getRevenueByMonth.useQuery({ months: 12 });
  const { data: sourcesData } = trpc.reports.getLeadsBySource.useQuery();
  const { data: quotationsData } = trpc.quotations.list.useQuery({ limit: 1 });

  // ── Derived values ────────────────────────────────────────────────────────────
  const totalLeads = leadsData?.total ?? 0;
  const totalOpps = oppsData?.total ?? 0;
  const totalRevenue = kpis?.totalRevenue ?? 0;
  const pendingTasks = tasksData?.total ?? 0;
  const totalQuotations = quotationsData?.total ?? 0;

  const conversionRate = totalLeads > 0
    ? ((totalOpps / totalLeads) * 100).toFixed(1)
    : "0.0";

  // Top opportunities sorted by amount
  const topOpps = [...(oppsData?.data ?? [])]
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 5);

  // Pending tasks list
  const pendingTasksList = (tasksData?.data ?? []).slice(0, 5);

  // Revenue chart data
  const chartRevenue = (revenueData ?? []).map(r => ({
    mes: shortMonth(r.month),
    ingresos: Number(r.revenue) || 0,
    oportunidades: Number(r.count) || 0,
  }));

  // Sources pie data
  const chartSources = (sourcesData ?? [])
    .filter(s => s.source)
    .map((s, i) => ({
      name: s.source ?? "Sin fuente",
      value: Number(s.count) || 0,
      fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));

  // Funnel data
  const maxFunnelVal = funnelData?.[0]?.count ?? 1;
  const funnelColors = ["#3B82F6", "#F59E0B", "#F97316", "#8B5CF6", "#10B981"];

  // Show skeleton while initial data loads
  const initialLoading = !kpis && !leadsData;
  if (initialLoading) {
    return <CRMLayout><SkeletonDashboard /></CRMLayout>;
  }

  return (
    <CRMLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {userName ? `Bienvenido, ${userName} 👋` : "Dashboard Ejecutivo"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Resumen de desempeño comercial</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={asesor} onValueChange={setAsesor}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <Filter size={12} className="mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Asesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los asesores</SelectItem>
              </SelectContent>
            </Select>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Calendar size={12} className="mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="este_mes">Este mes</SelectItem>
                <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                <SelectItem value="trimestre">Este trimestre</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Download size={12} className="mr-1.5" /> Exportar
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-gradient-to-r from-blue-600 to-indigo-600"
              onClick={() => navigate("/leads")}
            >
              + Nuevo Lead
            </Button>
            {totalLeads === 0 && totalOpps === 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-dashed border-violet-500 text-violet-500 hover:bg-violet-500/10"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                {seedMutation.isPending
                  ? <><Loader2 size={12} className="mr-1.5 animate-spin" /> Cargando...</>
                  : <><Sparkles size={12} className="mr-1.5" /> Cargar datos demo</>
                }
              </Button>
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
          <KPICard
            title="Total Leads"
            value={totalLeads > 0 ? totalLeads.toLocaleString() : "—"}
            sub="Posibles clientes"
            icon={Users}
            color="bg-blue-500"
          />
          <KPICard
            title="Oportunidades Abiertas"
            value={totalOpps > 0 ? totalOpps.toLocaleString() : "—"}
            sub="En pipeline"
            icon={Target}
            color="bg-emerald-500"
          />
          <KPICard
            title="Ingresos Pipeline"
            value={totalRevenue > 0 ? fmt(totalRevenue) : "—"}
            sub="Valor total estimado"
            icon={DollarSign}
            color="bg-amber-500"
          />
          <KPICard
            title="Tareas Pendientes"
            value={pendingTasks > 0 ? pendingTasks.toLocaleString() : "—"}
            sub="Por completar"
            icon={CheckSquare}
            color="bg-red-500"
          />
          <KPICard
            title="Tasa Conversión"
            value={totalLeads > 0 ? `${conversionRate}%` : "—"}
            sub="Lead → Oportunidad"
            icon={TrendingUp}
            color="bg-violet-500"
          />
          <KPICard
            title="Cotizaciones"
            value={totalQuotations > 0 ? totalQuotations.toLocaleString() : "—"}
            sub="Total emitidas"
            icon={FileText}
            color="bg-indigo-500"
          />
        </div>

        {/* ── Funnel + Revenue ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Pipeline Funnel */}
          <Card className="xl:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Embudo de Pipeline</CardTitle>
              <CardDescription>Oportunidades por etapa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {funnelData && funnelData.length > 0 ? (
                <>
                  {funnelData.map((stage, i) => {
                    const pct = Math.round((Number(stage.count) / Math.max(maxFunnelVal, 1)) * 100);
                    const fill = funnelColors[i % funnelColors.length];
                    return (
                      <div key={stage.stageId}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-xs">{stage.stageName ?? `Etapa ${stage.stageId}`}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-xs">{Number(stage.count)} ops</span>
                            <span className="font-bold text-xs" style={{ color: fill }}>
                              {fmt(Number(stage.totalAmount))}
                            </span>
                          </div>
                        </div>
                        <div className="h-6 bg-muted rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
                            style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: fill }}
                          >
                            {pct > 10 && <span className="text-white text-[10px] font-bold">{pct}%</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total pipeline</span>
                    <span className="font-bold text-emerald-500">{fmt(totalRevenue)}</span>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Target size={28} className="mx-auto mb-2 opacity-30" />
                  Sin datos aún
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Month */}
          <Card className="xl:col-span-3 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Ingresos por Mes</CardTitle>
              <CardDescription>Valor de oportunidades creadas (últimos 12 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartRevenue} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRev)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <Activity size={28} className="mx-auto mb-2 opacity-30" />
                    Sin datos aún
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Leads by Source + Top Opportunities ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Leads by Source */}
          <Card className="xl:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Leads por Fuente</CardTitle>
              <CardDescription>Distribución por canal de origen</CardDescription>
            </CardHeader>
            <CardContent>
              {chartSources.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={chartSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartSources.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [v, "Leads"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {chartSources.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }} />
                          <span className="text-muted-foreground truncate max-w-[120px]">{s.name}</span>
                        </div>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    Sin datos aún
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Opportunities */}
          <Card className="xl:col-span-3 border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Top Oportunidades</CardTitle>
                  <CardDescription>Por valor estimado</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/opportunities")}>
                  Ver todo <ArrowRight size={12} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {topOpps.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-4 text-muted-foreground font-semibold">Oportunidad</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-semibold">Monto</th>
                        <th className="text-right py-2 px-4 text-muted-foreground font-semibold">Prob.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topOpps.map((opp) => (
                        <tr
                          key={opp.id}
                          className="border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/opportunities/${opp.id}`)}
                        >
                          <td className="py-2.5 px-4 font-medium max-w-[180px] truncate">{opp.name}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-500">
                            {opp.amount != null ? fmt(Number(opp.amount)) : "—"}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                              {opp.probability ?? 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Target size={28} className="mx-auto mb-2 opacity-30" />
                  Sin datos aún
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Pending Tasks + Recent Activity ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Pending Tasks */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Tareas Pendientes</CardTitle>
                  <CardDescription>Próximas acciones requeridas</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/tasks")}>
                  Ver todo <ArrowRight size={12} className="ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTasksList.length > 0 ? (
                pendingTasksList.map((task) => {
                  const pc = priorityConfig[task.priority ?? "media"] ?? priorityConfig.media;
                  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/tasks")}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        task.priority === "alta" ? "bg-red-500" :
                        task.priority === "media" ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className={`text-xs flex items-center gap-1 mt-0.5 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                            {isOverdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                            {isOverdue ? "Vencida: " : "Vence: "}{task.dueDate}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${pc.className}`}>
                        {pc.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
                  Sin tareas pendientes
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads by Source Bar Chart */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Oportunidades por Mes</CardTitle>
              <CardDescription>Cantidad de oportunidades creadas</CardDescription>
            </CardHeader>
            <CardContent>
              {chartRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartRevenue} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="oportunidades" name="Oportunidades" radius={[3, 3, 0, 0]}>
                      {chartRevenue.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? "#3B82F6" : "#6366F1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <Activity size={28} className="mx-auto mb-2 opacity-30" />
                    Sin datos aún
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </CRMLayout>
  );
}
