import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText, Search, Star, MoreHorizontal, Plus, Clock,
  Users, Target, TrendingUp, BarChart3, Eye, Edit, Trash2, Download,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────

interface Report {
  id: number;
  name: string;
  description: string;
  folder: string;
  lastAccess: string;
  starred: boolean;
  type: "tabla" | "grafico" | "embudo";
}

const mockReports: Report[] = [
  { id: 1,  name: "Oportunidades ganadas sin lote", description: "Oportunidades cerradas sin lote asignado",          folder: "M4G",     lastAccess: "08/09/2025", starred: false, type: "tabla"   },
  { id: 2,  name: "Lotes x Oportunidad",            description: "Relación de lotes por oportunidad",                folder: "M4G",     lastAccess: "10/11/2025", starred: false, type: "tabla"   },
  { id: 3,  name: "Primer Asesor",                  description: "Primer asesor asignado por lead",                  folder: "M4G",     lastAccess: "17/07/2025", starred: false, type: "tabla"   },
  { id: 4,  name: "Oportunidades para Actualizar",  description: "Oportunidades pendientes de actualización",        folder: "M4G",     lastAccess: "26/06/2025", starred: false, type: "tabla"   },
  { id: 5,  name: "REPORTE GENERAL POP MKT-VENTAS", description: "Reporte general de marketing y ventas",           folder: "M4G",     lastAccess: "25/11/2025", starred: false, type: "tabla"   },
  { id: 6,  name: "Leads x Fuentes",                description: "Distribución de leads por fuente de captación",   folder: "M4G",     lastAccess: "10/11/2025", starred: false, type: "grafico" },
  { id: 7,  name: "Prueba",                         description: "-",                                               folder: "M4G",     lastAccess: "21/03/2025", starred: false, type: "tabla"   },
  { id: 8,  name: "Info Ventas Procesables",        description: "Información detallada de ventas procesables",     folder: "M4G",     lastAccess: "25/02/2025", starred: false, type: "tabla"   },
  { id: 9,  name: "Contactos con Oportunidad",      description: "Contactos que tienen oportunidades asociadas",    folder: "M4G",     lastAccess: "21/02/2025", starred: false, type: "tabla"   },
  { id: 10, name: "Reporte Prueba",                 description: "-",                                               folder: "M4G",     lastAccess: "28/01/2025", starred: false, type: "tabla"   },
  { id: 11, name: "Reporte de Ventas",              description: "Resumen de ventas por período",                   folder: "Ventas",  lastAccess: "26/12/2024", starred: false, type: "grafico" },
  { id: 12, name: "Prueba 123",                     description: "-",                                               folder: "M4G",     lastAccess: "03/12/2024", starred: false, type: "tabla"   },
  { id: 13, name: "Leads - Prioridades",            description: "Leads ordenados por prioridad y score",           folder: "Leads",   lastAccess: "05/11/2024", starred: false, type: "tabla"   },
  { id: 14, name: "Reporte de Leads",               description: "Reporte completo de posibles clientes",          folder: "Leads",   lastAccess: "17/10/2024", starred: true,  type: "tabla"   },
  { id: 15, name: "Eficacia Asesor / Lead",         description: "Ratio de conversión por asesor",                 folder: "Eficacia",lastAccess: "14/04/2026", starred: true,  type: "grafico" },
  { id: 16, name: "Embudo de Conversión",           description: "Funnel completo Lead → Venta",                   folder: "Eficacia",lastAccess: "14/04/2026", starred: true,  type: "embudo"  },
];

const folders = ["Todos", "M4G", "Ventas", "Leads", "Eficacia"];

const typeConfig = {
  tabla:   { label: "Tabla",   className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  grafico: { label: "Gráfico", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  embudo:  { label: "Embudo",  className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
};

// ── Create Report Dialog ───────────────────────────────────────────────────────

function CreateReportDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (r: Report) => void }) {
  const [form, setForm] = useState({ name: "", description: "", type: "tabla" as Report["type"], folder: "General" });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    const newReport: Report = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description || "-",
      folder: form.folder,
      lastAccess: new Date().toLocaleDateString("es-ES"),
      starred: false,
      type: form.type,
    };
    onCreated(newReport);
    toast.success(`Informe "${form.name}" creado`);
    setForm({ name: "", description: "", type: "tabla", folder: "General" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Crear Nuevo Informe</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre del informe *</Label>
            <Input placeholder="Ej: Reporte de ventas mensual" value={form.name} onChange={set("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input placeholder="Descripción breve..." value={form.description} onChange={set("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={set("type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tabla">Tabla</SelectItem>
                  <SelectItem value="grafico">Gráfico</SelectItem>
                  <SelectItem value="embudo">Embudo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Carpeta</Label>
              <Select value={form.folder} onValueChange={set("folder")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Ventas">Ventas</SelectItem>
                  <SelectItem value="Leads">Leads</SelectItem>
                  <SelectItem value="Eficacia">Eficacia</SelectItem>
                  <SelectItem value="M4G">M4G</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleCreate}>
            <Plus size={14} className="mr-1.5" /> Crear Informe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("Todos");
  const [reports, setReports] = useState(mockReports);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = reports.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const matchFolder = folder === "Todos" || r.folder === folder;
    return matchSearch && matchFolder;
  });

  const toggleStar = (id: number) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, starred: !r.starred } : r));
  };

  return (
    <>
    <CRMLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Informes</h1>
            <p className="text-muted-foreground text-sm mt-1">Reportes guardados y personalizados</p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowCreate(true)}>
            <Plus size={15} className="mr-1.5" /> Crear Informe
          </Button>
        </div>

        {/* Folders + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Folder tabs */}
          <div className="flex gap-1 flex-wrap">
            {folders.map(f => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  folder === f
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${folder === "Todos" ? "" : folder}...`}
              className="pl-9 h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Reports table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="w-8 py-3 px-4" />
                  <th className="w-8 py-3 px-2" />
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nombre del Informe
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    Descripción
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">
                    Carpeta
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Último Acceso
                  </th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(report => {
                  const type = typeConfig[report.type];
                  return (
                    <tr key={report.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer">
                      <td className="py-3 px-4">
                        <input type="checkbox" className="rounded border-border" />
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => toggleStar(report.id)}
                          className={`transition-colors ${report.starred ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-400"}`}
                        >
                          <Star size={14} className={report.starred ? "fill-current" : ""} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                            {report.type === "tabla" ? (
                              <FileText size={13} className="text-blue-500" />
                            ) : report.type === "grafico" ? (
                              <BarChart3 size={13} className="text-indigo-500" />
                            ) : (
                              <Target size={13} className="text-violet-500" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {report.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{report.description}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type.className}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{report.folder}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={11} />
                          {report.lastAccess}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye size={13} className="mr-2" /> Ver informe</DropdownMenuItem>
                            <DropdownMenuItem><Edit size={13} className="mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem><Download size={13} className="mr-2" /> Exportar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Trash2 size={13} className="mr-2" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No se encontraron informes</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Crea un nuevo informe o ajusta los filtros</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Informes", value: reports.length, icon: FileText, color: "text-blue-500" },
            { label: "Favoritos",      value: reports.filter(r => r.starred).length, icon: Star, color: "text-amber-500" },
            { label: "Gráficos",       value: reports.filter(r => r.type === "grafico").length, icon: BarChart3, color: "text-indigo-500" },
            { label: "Carpetas",       value: folders.length - 1, icon: Target, color: "text-violet-500" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon size={18} className={s.color} />
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </CRMLayout>

    <CreateReportDialog
      open={showCreate}
      onClose={() => setShowCreate(false)}
      onCreated={(r) => setReports(prev => [r, ...prev])}
    />
    </>
  );
}
