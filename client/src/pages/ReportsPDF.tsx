/**
 * PDF Reports — generates printable reports using browser print API
 * No external dependencies needed.
 */
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Printer, TrendingUp, Users, Target,
  DollarSign, BarChart3, CheckSquare, Loader2, Eye,
} from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

const COLORS = ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#06B6D4"];

// ── Report types ───────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: "pipeline",  label: "Reporte de Pipeline",       icon: Target,     description: "Oportunidades por etapa con montos y probabilidades" },
  { id: "leads",     label: "Reporte de Leads",          icon: Users,      description: "Leads por fuente, estado y score" },
  { id: "sales",     label: "Reporte de Ventas",         icon: DollarSign, description: "Ingresos por mes y top oportunidades" },
  { id: "tasks",     label: "Reporte de Tareas",         icon: CheckSquare,description: "Tareas pendientes, vencidas y completadas" },
  { id: "contacts",  label: "Reporte de Contactos",      icon: Users,      description: "Directorio completo de contactos y empresas" },
];

// ── Print styles ───────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    #print-area, #print-area * { visibility: visible; }
    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
    .no-print { display: none !important; }
    @page { margin: 1.5cm; size: A4; }
  }
`;

// ── Report Preview ─────────────────────────────────────────────────────────────

function PipelineReport({ data }: { data: any }) {
  const opps = data?.opps?.data ?? [];
  const funnel = data?.funnel ?? [];
  const total = opps.reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Oportunidades", value: opps.length.toString(), color: "text-blue-600" },
          { label: "Valor Total Pipeline", value: fmt(total), color: "text-emerald-600" },
          { label: "Prob. Promedio", value: opps.length ? `${Math.round(opps.reduce((s: number, o: any) => s + (o.probability || 0), 0) / opps.length)}%` : "0%", color: "text-violet-600" },
        ].map(s => (
          <div key={s.label} className="border border-border/50 rounded-lg p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {funnel.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Distribución por Etapa</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="stageName" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [fmt(Number(v)), "Monto"]} />
              <Bar dataKey="totalAmount" name="Monto" radius={[4,4,0,0]}>
                {funnel.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Detalle de Oportunidades</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border border-border/30">Oportunidad</th>
              <th className="text-right p-2 border border-border/30">Monto</th>
              <th className="text-right p-2 border border-border/30">Prob.</th>
            </tr>
          </thead>
          <tbody>
            {opps.slice(0, 20).map((o: any) => (
              <tr key={o.id} className="hover:bg-muted/20">
                <td className="p-2 border border-border/20">{o.name}</td>
                <td className="p-2 border border-border/20 text-right font-medium text-emerald-600">{o.amount ? fmt(Number(o.amount)) : "—"}</td>
                <td className="p-2 border border-border/20 text-right">{o.probability ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadsReport({ data }: { data: any }) {
  const leads = data?.leads?.data ?? [];
  const sources = data?.sources ?? [];

  const byStatus = leads.reduce((acc: any, l: any) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(byStatus).map(([status, count]: any) => (
          <div key={status} className="border border-border/50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{count}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{status}</p>
          </div>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm mb-3">Leads por Fuente</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sources.map((s: any) => ({ name: s.source ?? "Sin fuente", value: Number(s.count) }))}
                  cx="50%" cy="50%" outerRadius={70} dataKey="value">
                  {sources.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {sources.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span>{s.source ?? "Sin fuente"}</span>
                </div>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Listado de Leads</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border border-border/30">Nombre</th>
              <th className="text-left p-2 border border-border/30">Empresa</th>
              <th className="text-left p-2 border border-border/30">Estado</th>
              <th className="text-right p-2 border border-border/30">Score</th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 30).map((l: any) => (
              <tr key={l.id} className="hover:bg-muted/20">
                <td className="p-2 border border-border/20">{l.firstName} {l.lastName}</td>
                <td className="p-2 border border-border/20 text-muted-foreground">{l.company ?? "—"}</td>
                <td className="p-2 border border-border/20 capitalize">{l.status}</td>
                <td className="p-2 border border-border/20 text-right font-medium">{l.score ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesReport({ data }: { data: any }) {
  const revenue = data?.revenue ?? [];
  const opps = data?.opps?.data ?? [];
  const totalRevenue = opps.reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor Total Pipeline</p>
        </div>
        <div className="border border-border/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{opps.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Oportunidades Activas</p>
        </div>
      </div>

      {revenue.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Ingresos por Mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue.map((r: any) => ({ mes: r.month?.slice(5), ingresos: Number(r.revenue) }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [fmt(Number(v)), "Ingresos"]} />
              <Bar dataKey="ingresos" fill="#10B981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Top Oportunidades</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border border-border/30">Oportunidad</th>
              <th className="text-right p-2 border border-border/30">Monto</th>
              <th className="text-right p-2 border border-border/30">Prob.</th>
              <th className="text-right p-2 border border-border/30">Cierre</th>
            </tr>
          </thead>
          <tbody>
            {[...opps].sort((a: any, b: any) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 15).map((o: any) => (
              <tr key={o.id} className="hover:bg-muted/20">
                <td className="p-2 border border-border/20">{o.name}</td>
                <td className="p-2 border border-border/20 text-right font-medium text-emerald-600">{o.amount ? fmt(Number(o.amount)) : "—"}</td>
                <td className="p-2 border border-border/20 text-right">{o.probability ?? 0}%</td>
                <td className="p-2 border border-border/20 text-right text-muted-foreground">{o.expectedCloseDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksReport({ data }: { data: any }) {
  const tasks = data?.tasks?.data ?? [];
  const pending = tasks.filter((t: any) => t.status === "pendiente");
  const inProgress = tasks.filter((t: any) => t.status === "en_progreso");
  const done = tasks.filter((t: any) => t.status === "completada");
  const overdue = pending.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pendientes", value: pending.length, color: "text-amber-600" },
          { label: "En Progreso", value: inProgress.length, color: "text-blue-600" },
          { label: "Completadas", value: done.length, color: "text-emerald-600" },
          { label: "Vencidas", value: overdue.length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="border border-border/50 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-red-600">⚠ Tareas Vencidas ({overdue.length})</h3>
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-red-50 dark:bg-red-900/20"><th className="text-left p-2 border border-border/30">Tarea</th><th className="text-right p-2 border border-border/30">Vencimiento</th></tr></thead>
            <tbody>{overdue.map((t: any) => (<tr key={t.id}><td className="p-2 border border-border/20">{t.title}</td><td className="p-2 border border-border/20 text-right text-red-600">{t.dueDate}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Todas las Tareas</h3>
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-muted/50"><th className="text-left p-2 border border-border/30">Tarea</th><th className="text-left p-2 border border-border/30">Estado</th><th className="text-left p-2 border border-border/30">Prioridad</th><th className="text-right p-2 border border-border/30">Vence</th></tr></thead>
          <tbody>{tasks.slice(0, 30).map((t: any) => (<tr key={t.id} className="hover:bg-muted/20"><td className="p-2 border border-border/20">{t.title}</td><td className="p-2 border border-border/20 capitalize">{t.status}</td><td className="p-2 border border-border/20 capitalize">{t.priority}</td><td className="p-2 border border-border/20 text-right text-muted-foreground">{t.dueDate ?? "—"}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReportsPDFPage() {
  const [selectedReport, setSelectedReport] = useState("pipeline");
  const [period, setPeriod] = useState("all");
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Data queries
  const { data: oppsData } = trpc.opportunities.list.useQuery({ limit: 200 });
  const { data: leadsData } = trpc.leads.list.useQuery({ limit: 200 });
  const { data: funnelData } = trpc.reports.getSalesFunnel.useQuery({});
  const { data: revenueData } = trpc.reports.getRevenueByMonth.useQuery({ months: 12 });
  const { data: sourcesData } = trpc.reports.getLeadsBySource.useQuery();
  const { data: tasksData } = trpc.tasks.list.useQuery({ limit: 200 });
  const { data: authData } = trpc.auth.me.useQuery();

  const reportData = {
    pipeline: { opps: oppsData, funnel: funnelData },
    leads: { leads: leadsData, sources: sourcesData },
    sales: { opps: oppsData, revenue: revenueData },
    tasks: { tasks: tasksData },
    contacts: {},
  };

  const handlePrint = () => {
    setGenerating(true);
    setTimeout(() => {
      window.print();
      setGenerating(false);
      toast.success("Reporte enviado a imprimir / guardar como PDF");
    }, 500);
  };

  const currentReport = REPORT_TYPES.find(r => r.id === selectedReport)!;
  const user = authData as any;

  return (
    <>
      <style>{PRINT_STYLES}</style>
      <CRMLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reportes PDF</h1>
              <p className="text-muted-foreground text-sm mt-1">Genera e imprime reportes profesionales</p>
            </div>
            <div className="flex items-center gap-2 no-print">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handlePrint} disabled={generating} className="bg-gradient-to-r from-blue-600 to-indigo-600 h-9">
                {generating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Printer size={14} className="mr-2" />}
                Imprimir / PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Report selector */}
            <div className="xl:col-span-1 space-y-2 no-print">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tipo de Reporte</p>
              {REPORT_TYPES.map(r => {
                const Icon = r.icon;
                return (
                  <button key={r.id} onClick={() => setSelectedReport(r.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${selectedReport === r.id ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-border/50 hover:border-border"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedReport === r.id ? "bg-blue-600" : "bg-muted"}`}>
                      <Icon size={15} className={selectedReport === r.id ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Report preview */}
            <div className="xl:col-span-3">
              <div id="print-area" ref={printRef} className="bg-background border border-border/50 rounded-xl p-6 space-y-6">
                {/* Report header */}
                <div className="flex items-start justify-between border-b border-border/50 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">CR</div>
                      <span className="font-bold text-lg">CRM Pro</span>
                    </div>
                    <h2 className="text-xl font-bold">{currentReport.label}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{currentReport.description}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Generado: {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
                    {user?.name && <p>Por: {user.name}</p>}
                    <Badge className="mt-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      {period === "all" ? "Todo el tiempo" : period === "month" ? "Este mes" : period === "quarter" ? "Este trimestre" : "Este año"}
                    </Badge>
                  </div>
                </div>

                {/* Report content */}
                {selectedReport === "pipeline" && <PipelineReport data={reportData.pipeline} />}
                {selectedReport === "leads" && <LeadsReport data={reportData.leads} />}
                {selectedReport === "sales" && <SalesReport data={reportData.sales} />}
                {selectedReport === "tasks" && <TasksReport data={reportData.tasks} />}
                {selectedReport === "contacts" && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Reporte de contactos próximamente</p>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-border/50 pt-4 text-xs text-muted-foreground text-center">
                  CRM Pro · Reporte generado el {new Date().toLocaleString("es-ES")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CRMLayout>
    </>
  );
}
