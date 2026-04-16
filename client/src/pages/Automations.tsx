import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Plus, Play, Trash2, Clock, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Label maps ─────────────────────────────────────────────────────────────────

const triggerLabels: Record<string, string> = {
  lead_created: "Lead creado",
  lead_status_changed: "Estado de lead cambia a...",
  opportunity_stage_changed: "Oportunidad cambia a etapa...",
  task_overdue: "Tarea vencida",
  lead_inactive: "Lead inactivo por X días",
};

const actionLabels: Record<string, string> = {
  create_task: "Crear tarea",
  send_notification: "Enviar notificación",
  assign_lead: "Asignar lead",
  change_status: "Cambiar estado",
};

const triggerColors: Record<string, string> = {
  lead_created: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  lead_status_changed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  opportunity_stage_changed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  task_overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  lead_inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const actionColors: Record<string, string> = {
  create_task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  send_notification: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  assign_lead: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  change_status: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// ── New Automation Dialog ──────────────────────────────────────────────────────

function NewAutomationDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    trigger: "" as any,
    triggerValue: "",
    action: "" as any,
    actionValue: "",
    isActive: true,
    daysThreshold: "",
  });

  const createAutomation = trpc.automations.create.useMutation({
    onSuccess: () => {
      toast.success("Automatización creada");
      onSuccess();
      onClose();
      setForm({ name: "", trigger: "" as any, triggerValue: "", action: "" as any, actionValue: "", isActive: true, daysThreshold: "" });
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const set = (k: string) => (v: any) => setForm(f => ({ ...f, [k]: v }));
  const setE = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const needsTriggerValue = form.trigger === "lead_status_changed" || form.trigger === "opportunity_stage_changed";
  const needsDays = form.trigger === "lead_inactive";

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (!form.trigger) { toast.error("Selecciona un disparador"); return; }
    if (!form.action) { toast.error("Selecciona una acción"); return; }
    createAutomation.mutate({
      name: form.name,
      trigger: form.trigger,
      triggerValue: form.triggerValue || undefined,
      action: form.action,
      actionValue: form.actionValue || undefined,
      isActive: form.isActive,
      daysThreshold: needsDays && form.daysThreshold ? Number(form.daysThreshold) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Nueva Automatización
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Ej: Tarea al calificar lead" value={form.name} onChange={setE("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Disparador (Cuando...)</Label>
            <Select onValueChange={set("trigger")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar evento..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(triggerLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {needsTriggerValue && (
            <div className="space-y-1.5">
              <Label>{form.trigger === "lead_status_changed" ? "Estado objetivo" : "Etapa objetivo"}</Label>
              <Input
                placeholder={form.trigger === "lead_status_changed" ? "Ej: calificado" : "Ej: Propuesta"}
                value={form.triggerValue}
                onChange={setE("triggerValue")}
              />
            </div>
          )}
          {needsDays && (
            <div className="space-y-1.5">
              <Label>Días de inactividad</Label>
              <Input type="number" placeholder="Ej: 7" value={form.daysThreshold} onChange={setE("daysThreshold")} min="1" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Acción (Entonces...)</Label>
            <Select onValueChange={set("action")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar acción..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(actionLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.action && (
            <div className="space-y-1.5">
              <Label>Valor de la acción</Label>
              <Input
                placeholder={form.action === "create_task" ? "Ej: Seguimiento: {leadName}" : "Valor..."}
                value={form.actionValue}
                onChange={setE("actionValue")}
              />
              {form.action === "create_task" && (
                <p className="text-xs text-muted-foreground">Usa {"{leadName}"} o {"{oppName}"} como variables</p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-medium">Activa al crear</p>
              <p className="text-xs text-muted-foreground">La automatización se ejecutará inmediatamente</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={set("isActive")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500"
            onClick={handleSubmit}
            disabled={createAutomation.isPending}
          >
            {createAutomation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Zap size={14} className="mr-2" />}
            Crear Automatización
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [showNew, setShowNew] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { confirm } = useConfirm();

  const { data: automations = [], isLoading, refetch } = trpc.automations.list.useQuery();

  const updateAutomation = trpc.automations.update.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteAutomation = trpc.automations.delete.useMutation({
    onSuccess: () => { toast.success("Automatización eliminada"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const runAll = trpc.automations.runAll.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Automatizaciones ejecutadas");
      refetch();
    },
    onError: (e) => toast.error("Error al ejecutar: " + e.message),
  });

  const activeCount = automations.filter((a: any) => a.isActive).length;

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Automatizaciones</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Reglas automáticas para tu flujo de trabajo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-1.5" /> Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAll.mutate()}
              disabled={runAll.isPending}
              className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
            >
              {runAll.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Play size={14} className="mr-1.5" />}
              Ejecutar ahora
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => setShowNew(true)}
              >
                <Plus size={16} className="mr-1.5" /> Nueva Automatización
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Zap size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.length}</p>
                <p className="text-xs text-muted-foreground">Total reglas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hidden sm:block">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">Inactivas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automations list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-muted-foreground" />
            </div>
          ) : automations.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-amber-500" />
                </div>
                <p className="font-semibold text-lg">Sin automatizaciones</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Crea reglas automáticas para ahorrar tiempo y no perder ningún lead
                </p>
                {isAdmin && (
                  <Button
                    size="sm"
                    className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500"
                    onClick={() => setShowNew(true)}
                  >
                    <Plus size={14} className="mr-1.5" /> Crear primera automatización
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            automations.map((auto: any) => {
              const trigger = auto.trigger as string;
              const action = auto.action as string;
              const isActive = Boolean(auto.isActive);

              return (
                <Card
                  key={auto.id}
                  className={`border-border/50 transition-all duration-200 ${isActive ? "" : "opacity-60"}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-muted"}`}>
                        <Zap size={18} className={isActive ? "text-white" : "text-muted-foreground"} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">{auto.name}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${triggerColors[trigger] ?? "bg-muted text-muted-foreground"}`}>
                                {triggerLabels[trigger] ?? trigger}
                                {auto.triggerValue ? `: "${auto.triggerValue}"` : ""}
                                {auto.daysThreshold ? ` ${auto.daysThreshold} días` : ""}
                              </span>
                              <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${actionColors[action] ?? "bg-muted text-muted-foreground"}`}>
                                {actionLabels[action] ?? action}
                              </span>
                            </div>
                            {auto.actionValue && (
                              <p className="text-xs text-muted-foreground mt-1.5 font-mono bg-muted/50 px-2 py-1 rounded-md inline-block">
                                "{auto.actionValue}"
                              </p>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isAdmin && (
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) =>
                                  updateAutomation.mutate({ id: Number(auto.id), isActive: checked })
                                }
                              />
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: "¿Eliminar automatización?",
                                    description: "Esta acción no se puede deshacer.",
                                    confirmText: "Eliminar",
                                    variant: "destructive",
                                  });
                                  if (ok) deleteAutomation.mutate({ id: Number(auto.id) });
                                }}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={11} />
                            {auto.lastRun
                              ? `Última ejecución: ${new Date(auto.lastRun as string).toLocaleString("es-ES")}`
                              : "Sin ejecuciones aún"}
                          </div>
                          {Number(auto.runCount) > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 size={11} className="text-emerald-500" />
                              {auto.runCount} ejecuciones
                            </div>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ml-auto ${isActive ? "border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400" : "border-slate-200 text-slate-500"}`}
                          >
                            {isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Info box */}
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-900/10">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Cómo funcionan las automatizaciones</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">
                Las automatizaciones se ejecutan manualmente con "Ejecutar ahora" o puedes programarlas para que corran periódicamente.
                La regla de <strong>lead inactivo</strong> busca leads sin actividad en los últimos X días y crea tareas de seguimiento automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <NewAutomationDialog open={showNew} onClose={() => setShowNew(false)} onSuccess={() => refetch()} />
    </CRMLayout>
  );
}
