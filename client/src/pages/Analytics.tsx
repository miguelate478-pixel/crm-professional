import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  AreaChart, Area,
} from "recharts";
import {
  Plus, RefreshCw, LayoutDashboard, TrendingUp, TrendingDown,
  DollarSign, Target, Users, AlertCircle, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Data ───────────────────────────────────────────────────────────────────────

const oportunidadesPorEtapa = [
  { etapa: "Iniciar Oportunidad",    count: 95,   fill: "#EF4444" },
  { etapa: "Confirmación de Visita", count: 1,    fill: "#F97316" },
  { etapa: "No asistió a Visita",    count: 1,    fill: "#F97316" },
  { etapa: "Asistió a Visita",       count: 843,  fill: "#F59E0B" },
  { etapa: "Selección de lote",      count: 27,   fill: "#84CC16" },
  { etapa: "Información completada", count: 12,   fill: "#10B981" },
  { etapa: "Proforma Aprobada",      count: 39,   fill: "#10B981" },
  { etapa: "Documentación Completa", count: 18,   fill: "#06B6D4" },
  { etapa: "Datos Validados",        count: 23,   fill: "#3B82F6" },
  { etapa: "Cronograma Generado",    count: 9,    fill: "#6366F1" },
  { etapa: "Firma programada",       count: 3,    fill: "#8B5CF6" },
  { etapa: "Venta Procesable",       count: 903,  fill: "#EC4899" },
  { etapa: "Oportunidad Perdida",    count: 29,   fill: "#64748B" },
  { etapa: "Lote Separado",          count: 3,    fill: "#10B981" },
  { etapa: "Proformando",            count: 4,    fill: "#F59E0B" },
  { etapa: "Contactar nuevamente",   count: 5,    fill: "#94A3B8" },
];

const importeAbiertoPorUsuario = [
  { usuario: "Admin",                    importe: 828004.60, variacion: 100 },
  { usuario: "Emerson Rodriguez Figueroa", importe: 146000.00, variacion: 100 },
  { usuario: "Gustavo Rivero Castro",    importe: 95000.00,  variacion: 85  },
  { usuario: "Manuel Alloscía Ortiz",    importe: 78000.00,  variacion: 72  },
  { usuario: "Elizabeth Quiroz",         importe: 65000.00,  variacion: 68  },
];

const ingresosPorMes = [
  { mes: "Ene", ingresos: 0 }, { mes: "Feb", ingresos: 0 },
  { mes: "Mar", ingresos: 575914 }, { mes: "Abr", ingresos: 4279278 },
  { mes: "May", ingresos: 3582960 }, { mes: "Jun", ingresos: 2847654 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000
            ? `S/ ${p.value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [panel, setPanel] = useState("Oportunidad Insights");
  const [userFilter, setUserFilter] = useState("todos");
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newPanelName, setNewPanelName] = useState("");
  const [panels, setPanels] = useState(["Oportunidad Insights"]);

  const handleCreatePanel = () => {
    const name = newPanelName.trim();
    if (!name) return;
    setPanels(prev => [...prev, name]);
    setPanel(name);
    toast.success("Panel " + name + " creado");
    setNewPanelName("");
    setShowCreatePanel(false);
  };

  return (
    <>
    <CRMLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Análisis</h1>
            <p className="text-muted-foreground text-sm mt-1">Paneles de información configurables</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw size={14} className="mr-1.5" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddComponent(true)}>
              <Plus size={14} className="mr-1.5" />
              Agregar componente
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowCreatePanel(true)}>
              <LayoutDashboard size={14} className="mr-1.5" />
              Crear panel de información
            </Button>
          </div>
        </div>

        {/* Panel selector + filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={panel} onValueChange={setPanel}>
            <SelectTrigger className="w-52 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Oportunidad Insights">Oportunidad Insights</SelectItem>
              <SelectItem value="Eficacia Leads">Eficacia Leads</SelectItem>
              <SelectItem value="Facturación">Facturación</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los usuarios</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="gustavo">Gustavo Rivero</SelectItem>
              <SelectItem value="manuel">Manuel Alloscía</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards — igual que Zoho Análisis */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: "INGRESOS DE ESTE MES",
              value: null,
              empty: true,
              icon: DollarSign,
              color: "text-blue-500",
            },
            {
              title: "OPORTUNIDADES CREADO",
              value: "2",
              sub: "Relativo al mes pasado: 11",
              trend: "down",
              trendVal: "▼ 81.8%",
              icon: Target,
              color: "text-indigo-500",
            },
            {
              title: "OPORTUNIDADES EN PROCESO",
              value: "4,938",
              sub: null,
              icon: TrendingUp,
              color: "text-amber-500",
            },
            {
              title: "INGRESOS PERDIDOS",
              value: null,
              empty: true,
              icon: AlertCircle,
              color: "text-red-500",
            },
          ].map((kpi) => (
            <Card key={kpi.title} className="border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {kpi.title}
                </p>
                {kpi.empty ? (
                  <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/30">
                    <kpi.icon size={32} />
                    <p className="text-xs mt-2 text-muted-foreground/50">No hay datos disponibles</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold">{kpi.value}</p>
                    {kpi.trend === "down" && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm font-medium">
                        <TrendingDown size={14} />
                        <span>{kpi.trendVal}</span>
                      </div>
                    )}
                    {kpi.sub && (
                      <p className="text-xs text-muted-foreground mt-2">{kpi.sub}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Ingresos por usuarios — vacío */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                INGRESOS POR USUARIOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
                <DollarSign size={40} />
                <p className="text-sm mt-3 text-muted-foreground/50">No hay datos disponibles</p>
              </div>
            </CardContent>
          </Card>

          {/* Oportunidades por etapas — embudo horizontal */}
          <Card className="xl:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                OPORTUNIDADES POR ETAPAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Funnel visual */}
                <div className="space-y-1.5">
                  {oportunidadesPorEtapa.slice(0, 10).map((etapa) => {
                    const max = Math.max(...oportunidadesPorEtapa.map(e => e.count));
                    const pct = Math.max((etapa.count / max) * 100, 2);
                    return (
                      <div key={etapa.etapa} className="flex items-center gap-2">
                        <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full rounded flex items-center justify-end pr-1.5 transition-all"
                            style={{ width: `${pct}%`, backgroundColor: etapa.fill }}
                          >
                            {pct > 15 && (
                              <span className="text-white text-[10px] font-bold">{etapa.count}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-4 text-right">
                          {pct <= 15 ? etapa.count : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="space-y-1">
                  {oportunidadesPorEtapa.map((etapa) => (
                    <div key={etapa.etapa} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: etapa.fill }} />
                        <span className="text-muted-foreground truncate max-w-[160px]">{etapa.etapa}</span>
                      </div>
                      <span className="font-semibold ml-2">{etapa.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Importe abierto por usuarios */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                IMPORTE ABIERTO POR USUARIOS
              </CardTitle>
              <p className="text-xs text-muted-foreground">* Comparado con Relativo al año pasado</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground">
                    Propietario De Oportunidad
                  </th>
                  <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground">
                    Suma De Importe
                  </th>
                  <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground hidden md:table-cell">
                    Variación
                  </th>
                </tr>
              </thead>
              <tbody>
                {importeAbiertoPorUsuario.map((row, i) => (
                  <tr key={row.usuario} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {row.usuario.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{row.usuario}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className="font-bold text-sm">
                        PEN {row.importe.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right hidden md:table-cell">
                      <span className="text-emerald-500 text-sm font-semibold">
                        ▲ {row.variacion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </CRMLayout>

    {/* Add Component Dialog */}
    <Dialog open={showAddComponent} onOpenChange={setShowAddComponent}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Agregar Componente</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Selecciona el tipo de componente a agregar al panel:</p>
          <div className="grid grid-cols-2 gap-2">
            {["KPI Card", "Grafico de barras", "Grafico de lineas", "Tabla", "Embudo", "Pie Chart"].map(comp => (
              <button
                key={comp}
                className="p-3 rounded-lg border border-border/50 hover:border-blue-500 hover:bg-blue-50/5 text-sm font-medium transition-colors text-left"
                onClick={() => { toast.success("Componente " + comp + " agregado"); setShowAddComponent(false); }}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddComponent(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Create Panel Dialog */}
    <Dialog open={showCreatePanel} onOpenChange={setShowCreatePanel}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Crear Panel de Información</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre del panel *</Label>
            <Input
              placeholder="Ej: Panel de Ventas Q1"
              value={newPanelName}
              onChange={e => setNewPanelName(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">El panel se creará vacío. Luego puedes agregar componentes con el botón "Agregar componente".</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreatePanel(false)}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            disabled={!newPanelName.trim()}
            onClick={handleCreatePanel}
          >
            <LayoutDashboard size={14} className="mr-1.5" /> Crear Panel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
