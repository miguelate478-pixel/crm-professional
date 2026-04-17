import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, MoreHorizontal, DollarSign, Calendar, User, Target,
  AlertCircle, Edit, Trash2, Eye, LayoutGrid, List, Loader2, RefreshCw,
  Download, Search, Filter, X, GripVertical,
} from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { exportToCSV, exportToExcel } from "@/lib/export";

import { validateRequired, validatePositiveNumber, validatePercentage } from "@/lib/validation";

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_STAGES = [
  { id: 1, name: "Prospecto",   color: "bg-slate-500",   light: "bg-slate-100 dark:bg-slate-800",         text: "text-slate-600 dark:text-slate-300",   probability: 10 },
  { id: 2, name: "Calificado",  color: "bg-blue-500",    light: "bg-blue-50 dark:bg-blue-900/20",          text: "text-blue-700 dark:text-blue-300",      probability: 30 },
  { id: 3, name: "Propuesta",   color: "bg-amber-500",   light: "bg-amber-50 dark:bg-amber-900/20",        text: "text-amber-700 dark:text-amber-300",    probability: 50 },
  { id: 4, name: "Negociación", color: "bg-orange-500",  light: "bg-orange-50 dark:bg-orange-900/20",      text: "text-orange-700 dark:text-orange-300",  probability: 75 },
  { id: 5, name: "Cerrado",     color: "bg-emerald-500", light: "bg-emerald-50 dark:bg-emerald-900/20",    text: "text-emerald-700 dark:text-emerald-300", probability: 100 },
];

function ProbabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value}%</span>
    </div>
  );
}

// ── New Opportunity Dialog ─────────────────────────────────────────────────────

function NewOpportunityDialog({ open, onClose, onSuccess, pipelineId }: {
  open: boolean; onClose: () => void; onSuccess: () => void; pipelineId: number;
}) {
  const [form, setForm] = useState({
    name: "", description: "", amount: "", probability: "30",
    expectedCloseDate: "", stageId: "1",
  });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const create = trpc.opportunities.create.useMutation({
    onSuccess: () => { toast.success("Oportunidad creada"); onSuccess(); onClose(); setForm({ name: "", description: "", amount: "", probability: "30", expectedCloseDate: "", stageId: "1" }); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSubmit = () => {
    const nameErr = validateRequired(form.name, "El nombre");
    if (nameErr) { toast.error(nameErr); return; }
    const amountErr = validatePositiveNumber(form.amount, "El monto");
    if (amountErr) { toast.error(amountErr); return; }
    const probErr = validatePercentage(form.probability, "La probabilidad");
    if (probErr) { toast.error(probErr); return; }
    create.mutate({
      name: form.name,
      description: form.description || undefined,
      amount: form.amount ? Number(form.amount) : undefined,
      probability: Number(form.probability),
      expectedCloseDate: form.expectedCloseDate || undefined,
      pipelineId,
      stageId: Number(form.stageId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nueva Oportunidad</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Ej: Proyecto ERP - Empresa ABC" value={form.name} onChange={set("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Monto estimado</Label>
            <Input type="number" placeholder="0" value={form.amount} onChange={set("amount")} />
          </div>
          <div className="space-y-1.5">
            <Label>Probabilidad (%)</Label>
            <Input type="number" placeholder="30" min="0" max="100" value={form.probability} onChange={set("probability")} />
          </div>
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select value={form.stageId} onValueChange={set("stageId")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEFAULT_STAGES.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha estimada de cierre</Label>
            <Input type="date" value={form.expectedCloseDate} onChange={set("expectedCloseDate")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Descripción</Label>
            <Textarea placeholder="Descripción breve..." value={form.description} onChange={set("description")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            Crear Oportunidad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Kanban Card ────────────────────────────────────────────────────────────────

function KanbanCard({ 
  opp, 
  onDelete, 
  onRefetch, 
  onClick,
  isDragging,
  onDragStart,
}: { 
  opp: any; 
  onDelete: () => void; 
  onRefetch: () => void; 
  onClick: () => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const moveStage = trpc.opportunities.moveStage.useMutation({
    onSuccess: () => { toast.success("Etapa actualizada"); onRefetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const isStale = opp.updatedAt && (Date.now() - new Date(opp.updatedAt).getTime()) > 10 * 24 * 60 * 60 * 1000;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-card border rounded-xl p-4 transition-all duration-200 group ${
        isDragging ? "opacity-50 scale-95 shadow-lg" : "hover:shadow-md cursor-grab active:cursor-grabbing"
      } ${isStale ? "border-amber-300 dark:border-amber-700" : "border-border/50"}`}
      onClick={onClick}
    >
      {isStale && (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mb-2">
          <AlertCircle size={12} /> Estancada
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <GripVertical size={14} className="text-muted-foreground/40 mt-0.5 flex-shrink-0" />
          <p className="font-semibold text-sm leading-snug flex-1 break-words">{opp.name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <MoreHorizontal size={13} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {DEFAULT_STAGES.map(s => s.id !== opp.stageId && (
              <DropdownMenuItem key={s.id} onClick={(e) => { e.stopPropagation(); moveStage.mutate({ id: opp.id, stageId: s.id }); }}>
                → Mover a {s.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 size={13} className="mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {opp.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{opp.description}</p>}
      <div className="mt-3">
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {opp.amount ? `${Number(opp.amount).toLocaleString()}` : "Sin monto"}
        </p>
        <ProbabilityBar value={opp.probability ?? 0} />
      </div>
      {opp.expectedCloseDate && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={11} />
          {new Date(opp.expectedCloseDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
        </div>
      )}
    </div>
  );
}

// ── Kanban Column ──────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  opps,
  onDelete,
  onRefetch,
  onCardClick,
  onDragOver,
  onDrop,
  draggedOppId,
}: {
  stage: typeof DEFAULT_STAGES[0];
  opps: any[];
  onDelete: (id: number) => void;
  onRefetch: () => void;
  onCardClick: (opp: any) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: number) => void;
  draggedOppId: number | null;
}) {
  const total = opps.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
      className="flex-shrink-0 w-72"
    >
      <div className="rounded-xl border border-border/50 overflow-hidden h-full flex flex-col">
        <div className={`px-4 py-3 ${stage.light} border-b border-border/30`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <span className={`font-semibold text-sm ${stage.text}`}>{stage.name}</span>
            </div>
            <span className="text-xs bg-background/50 px-2 py-0.5 rounded-full">{opps.length}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">${total.toLocaleString()}</p>
        </div>
        <div className="p-3 space-y-3 min-h-[400px] bg-muted/20 flex-1 overflow-y-auto">
          {opps.map(opp => (
            <KanbanCard
              key={opp.id}
              opp={opp}
              onRefetch={onRefetch}
              onClick={() => onCardClick(opp)}
              isDragging={draggedOppId === opp.id}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("opportunityId", String(opp.id));
              }}
              onDelete={() => onDelete(opp.id)}
            />
          ))}
          {opps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40 text-xs">Sin oportunidades</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const [showNew, setShowNew] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [stageFilter, setStageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draggedOppId, setDraggedOppId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { confirm } = useConfirm();

  const { data, isLoading, refetch } = trpc.opportunities.list.useQuery({ limit: 100 });
  const rawOpps = data?.data ?? [];

  // Apply filters
  const opps = rawOpps.filter(o => {
    const matchStage = stageFilter === "all" || o.stageId === Number(stageFilter);
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const deleteOpp = trpc.opportunities.delete.useMutation({
    onSuccess: () => { toast.success("Oportunidad eliminada"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const moveStage = trpc.opportunities.moveStage.useMutation({
    onSuccess: () => { toast.success("Oportunidad movida"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const totalPipeline = rawOpps.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const weighted = rawOpps.reduce((s, o) => s + (Number(o.amount) || 0) * (o.probability ?? 0) / 100, 0);

  const { data: pipelinesData } = trpc.opportunities.getPipelines.useQuery();
  const PIPELINE_ID = pipelinesData?.[0]?.id ?? 1;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    const oppId = Number(e.dataTransfer.getData("opportunityId"));
    const opp = rawOpps.find(o => o.id === oppId);
    
    if (opp && opp.stageId !== stageId) {
      moveStage.mutate({ id: oppId, stageId });
    }
    setDraggedOppId(null);
  };

  const handleDeleteOpp = async (id: number) => {
    const ok = await confirm({ title: "¿Eliminar oportunidad?", description: "Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "destructive" });
    if (ok) deleteOpp.mutate({ id });
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline de Oportunidades</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {opps.length} oportunidades · Pipeline: ${totalPipeline.toLocaleString()} · Ponderado: ${Math.round(weighted).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} className="mr-1.5" /> Actualizar</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const exportData = opps.map(o => ({
                Nombre: o.name,
                Etapa: DEFAULT_STAGES.find(s => s.id === o.stageId)?.name ?? "",
                Monto: o.amount ?? 0,
                Probabilidad: `${o.probability ?? 0}%`,
                "Cierre Estimado": o.expectedCloseDate ?? "",
                Descripción: o.description ?? "",
              }));
              exportToCSV(exportData, `oportunidades_${new Date().toISOString().split("T")[0]}`);
              toast.success(`${exportData.length} oportunidades exportadas`);
            }}>
              <Download size={14} className="mr-1.5" /> Exportar CSV
            </Button>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setView("kanban")} className={`p-2 transition-colors ${view === "kanban" ? "bg-muted" : "hover:bg-muted/50"}`}><LayoutGrid size={15} /></button>
              <button onClick={() => setView("list")} className={`p-2 transition-colors ${view === "list" ? "bg-muted" : "hover:bg-muted/50"}`}><List size={15} /></button>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1.5" /> Nueva Oportunidad
            </Button>
          </div>
        </div>

        {/* Stage summary */}
        <div className="grid grid-cols-5 gap-3">
          {DEFAULT_STAGES.map(stage => {
            const stageOpps = opps.filter(o => o.stageId === stage.id);
            const total = stageOpps.reduce((s, o) => s + (Number(o.amount) || 0), 0);
            return (
              <Card key={stage.id} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <div className={`w-2 h-2 rounded-full ${stage.color} mx-auto mb-1.5`} />
                  <p className="text-xs font-medium text-muted-foreground">{stage.name}</p>
                  <p className="text-lg font-bold mt-0.5">{stageOpps.length}</p>
                  <p className="text-xs text-muted-foreground">${(total / 1000).toFixed(0)}k</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar oportunidades..."
              className="pl-9 h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <Filter size={13} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {DEFAULT_STAGES.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || stageFilter !== "all") && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => { setSearch(""); setStageFilter("all"); }}>
              <X size={13} className="mr-1" /> Limpiar
            </Button>
          )}
          {(search || stageFilter !== "all") && (
            <span className="text-xs text-muted-foreground">{opps.length} resultado{opps.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>
        ) : view === "kanban" ? (
          /* Kanban */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {DEFAULT_STAGES.map(stage => {
              const stageOpps = opps.filter(o => o.stageId === stage.id);
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  opps={stageOpps}
                  onDelete={handleDeleteOpp}
                  onRefetch={refetch}
                  onCardClick={(opp) => navigate(`/opportunities/${opp.id}`)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  draggedOppId={draggedOppId}
                />
              );
            })}
          </div>
        ) : (
          /* List */
          <Card className="border-border/50">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Oportunidad</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Etapa</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monto</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Probabilidad</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">Cierre Est.</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {opps.map(opp => {
                    const stage = DEFAULT_STAGES.find(s => s.id === opp.stageId) ?? DEFAULT_STAGES[0];
                    return (
                      <tr key={opp.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/opportunities/${opp.id}`)}>

                        <td className="py-4 px-6">
                          <p className="font-medium text-sm">{opp.name}</p>
                          {opp.description && <p className="text-xs text-muted-foreground">{opp.description}</p>}
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stage.light} ${stage.text}`}>{stage.name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {opp.amount ? `${Number(opp.amount).toLocaleString()}` : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell w-32"><ProbabilityBar value={opp.probability ?? 0} /></td>
                        <td className="py-4 px-4 hidden xl:table-cell text-sm text-muted-foreground">
                          {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString("es-ES") : "—"}
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={15} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye size={13} className="mr-2" /> Ver detalle</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={async (e) => {
                                e.stopPropagation();
                                await handleDeleteOpp(opp.id);
                              }}>
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
              {opps.length === 0 && (
                <div className="py-16 text-center">
                  <Target size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Sin oportunidades aún</p>
                  <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
                    <Plus size={14} className="mr-1.5" /> Crear primera oportunidad
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <NewOpportunityDialog open={showNew} onClose={() => setShowNew(false)} onSuccess={() => refetch()} pipelineId={PIPELINE_ID} />
    </CRMLayout>
  );
}
