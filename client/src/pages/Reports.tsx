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
  Users, Target, TrendingUp, BarChart3, Eye, Edit, Trash2, Download, Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Report {
  id: number;
  name: string;
  description: string | null;
  folder: string;
  updatedAt: string;
  isStarred: boolean;
  type: "tabla" | "grafico" | "embudo";
}

const folders = ["Todos", "General", "Ventas", "Leads", "Eficacia", "M4G"];

const typeConfig = {
  tabla:   { label: "Tabla",   className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  grafico: { label: "Gráfico", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  embudo:  { label: "Embudo",  className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
};

// ── Create Report Dialog ───────────────────────────────────────────────────────

function CreateReportDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", type: "tabla" as Report["type"], folder: "General" });
  const [loading, setLoading] = useState(false);
  const createMutation = trpc.reports.create.useMutation();

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    
    setLoading(true);
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        description: form.description || undefined,
        type: form.type,
        folder: form.folder,
      });
      toast.success(`Informe "${form.name}" creado`);
      setForm({ name: "", description: "", type: "tabla", folder: "General" });
      onCreated();
      onClose();
    } catch (error) {
      toast.error("Error al crear el informe");
    } finally {
      setLoading(false);
    }
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
                  {folders.filter(f => f !== "Todos").map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleCreate} disabled={loading}>
            {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plus size={14} className="mr-1.5" />}
            Crear Informe
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
  const [showCreate, setShowCreate] = useState(false);

  // Queries
  const { data: reports = [], isLoading, refetch } = trpc.reports.list.useQuery({
    folder: folder === "Todos" ? undefined : folder,
    search: search || undefined,
  });
  const toggleStarMutation = trpc.reports.toggleStar.useMutation();
  const deleteMutation = trpc.reports.delete.useMutation();

  const handleToggleStar = async (id: number) => {
    try {
      await toggleStarMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      toast.error("Error al actualizar favorito");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar informe "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Informe eliminado");
      refetch();
    } catch (error) {
      toast.error("Error al eliminar informe");
    }
  };

  const starredCount = reports.filter(r => r.isStarred).length;
  const graphicCount = reports.filter(r => r.type === "grafico").length;

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
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2 size={40} className="mx-auto text-muted-foreground/30 mb-3 animate-spin" />
                <p className="text-muted-foreground font-medium">Cargando informes...</p>
              </div>
            ) : (
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
                  {reports.map(report => {
                    const type = typeConfig[report.type];
                    const lastAccess = new Date(report.updatedAt).toLocaleDateString("es-ES");
                    return (
                      <tr key={report.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer">
                        <td className="py-3 px-4">
                          <input type="checkbox" className="rounded border-border" />
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => handleToggleStar(report.id)}
                            className={`transition-colors ${report.isStarred ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-400"}`}
                          >
                            <Star size={14} className={report.isStarred ? "fill-current" : ""} />
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
                          <span className="text-sm text-muted-foreground">{report.description || "-"}</span>
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
                            {lastAccess}
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
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(report.id, report.name)}
                              >
                                <Trash2 size={13} className="mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {!isLoading && reports.length === 0 && (
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
            { label: "Favoritos",      value: starredCount, icon: Star, color: "text-amber-500" },
            { label: "Gráficos",       value: graphicCount, icon: BarChart3, color: "text-indigo-500" },
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
      onCreated={() => refetch()}
    />
    </>
  );
}
