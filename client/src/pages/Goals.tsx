import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Target, TrendingUp, Users, Calendar, MoreHorizontal,
  Edit, Trash2, Trophy, AlertCircle, CheckCircle, Loader2, RefreshCw, Clock,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Helpers ────────────────────────────────────────────────────────────────────

const periodConfig = {
  mensual:    { label: "Mensual",    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  trimestral: { label: "Trimestral", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  anual:      { label: "Anual",      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function GoalStatusIcon({ pct }: { pct: number }) {
  if (pct >= 100) return <CheckCircle size={16} className="text-emerald-500" />;
  if (pct >= 70)  return <TrendingUp size={16} className="text-blue-500" />;
  if (pct >= 40)  return <AlertCircle size={16} className="text-amber-500" />;
  return <AlertCircle size={16} className="text-red-500" />;
}

// ── Mock progress data (until DB has real opportunities) ──────────────────────

const mockProgress: Record<number, number> = {};
let mockIdCounter = 1;

function getProgressColor(pct: number) {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 70)  return "bg-blue-500";
  if (pct >= 40)  return "bg-amber-500";
  return "bg-red-500";
}

// ── New Goal Dialog ────────────────────────────────────────────────────────────

function GoalDialog({
  open, onClose, onSuccess, editGoal,
}: {
  open: boolean; onClose: () => void; onSuccess: () => void; editGoal?: any;
}) {
  const isEdit = !!editGoal;
  const [form, setForm] = useState({
    name: editGoal?.name || "",
    targetAmount: editGoal?.targetAmount || "",
    period: editGoal?.period || "mensual",
    assignedTo: editGoal?.assignedTo || "",
    startDate: editGoal?.startDate || new Date().toISOString().split("T")[0],
    endDate: editGoal?.endDate || "",
  });

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => { toast.success("Meta creada"); onSuccess(); onClose(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateGoal = trpc.goals.update.useMutation({
    onSuccess: () => { toast.success("Meta actualizada"); onSuccess(); onClose(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (!form.targetAmount || Number(form.targetAmount) <= 0) { toast.error("La meta debe ser mayor a 0"); return; }
    if (!form.startDate || !form.endDate) { toast.error("Las fechas son requeridas"); return; }

    const payload = {
      name: form.name,
      targetAmount: Number(form.targetAmount),
      period: form.period as any,
      startDate: form.startDate,
      endDate: form.endDate,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
    };

    if (isEdit) {
      updateGoal.mutate({ id: editGoal.id, ...payload });
    } else {
      createGoal.mutate(payload);
    }
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Meta" : "Nueva Meta Comercial"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre de la meta *</Label>
            <Input placeholder="Ej: Meta de ventas Q1 2025" value={form.name} onChange={set("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monto objetivo *</Label>
              <Input type="number" placeholder="100000" value={form.targetAmount} onChange={set("targetAmount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={form.period} onValueChange={set("period")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha inicio *</Label>
              <Input type="date" value={form.startDate} onChange={set("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha fin *</Label>
              <Input type="date" value={form.endDate} onChange={set("endDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Asignar a (ID usuario)</Label>
            <Input type="number" placeholder="Dejar vacío para meta global" value={form.assignedTo} onChange={set("assignedTo")} />
            <p className="text-xs text-muted-foreground">Opcional — si no se asigna, es una meta del equipo completo</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            {isEdit ? "Guardar Cambios" : "Crear Meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Goal Card ──────────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete }: { goal: any; onEdit: () => void; onDelete: () => void }) {
  const period = periodConfig[goal.period as keyof typeof periodConfig] ?? periodConfig.mensual;

  // Calculate deterministic progress based on dates
  const start = new Date(goal.startDate).getTime();
  const end = new Date(goal.endDate).getTime();
  const now = Date.now();
  const elapsed = Math.max(0, now - start);
  const total = Math.max(end - start, 1);
  const timePct = Math.min(Math.round((elapsed / total) * 100), 100);
  // Use time-based progress as proxy until real revenue data is connected
  const pct = timePct;
  const actual = Math.round((Number(goal.targetAmount) * pct) / 100);
  const color = getProgressColor(pct);

  const daysLeft = Math.max(
    Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    0
  );

  return (
    <Card className="border-border/50 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              pct >= 100 ? "bg-emerald-100 dark:bg-emerald-900/20" :
              pct >= 70  ? "bg-blue-100 dark:bg-blue-900/20" :
              pct >= 40  ? "bg-amber-100 dark:bg-amber-900/20" :
              "bg-red-100 dark:bg-red-900/20"
            }`}>
              <GoalStatusIcon pct={pct} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug">{goal.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${period.className}`}>
                {period.label}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit size={13} className="mr-2" /> Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 size={13} className="mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className={`font-bold text-lg ${
              pct >= 100 ? "text-emerald-500" : pct >= 70 ? "text-blue-500" : pct >= 40 ? "text-amber-500" : "text-red-500"
            }`}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} color={color} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>${actual.toLocaleString()} logrado</span>
            <span>Meta: ${Number(goal.targetAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} />
            <span>{goal.startDate} → {goal.endDate}</span>
          </div>
          <div className={`flex items-center gap-1 font-medium ${daysLeft <= 7 ? "text-red-500" : daysLeft <= 30 ? "text-amber-500" : "text-muted-foreground"}`}>
            <Clock size={11} />
            {daysLeft > 0 ? `${daysLeft} días restantes` : "Vencida"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [showNew, setShowNew] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [periodFilter, setPeriodFilter] = useState("all");
  const { confirm } = useConfirm();

  const { data: goals = [], isLoading, refetch } = trpc.goals.list.useQuery({
    period: periodFilter !== "all" ? periodFilter as any : undefined,
  });

  const deleteGoal = trpc.goals.delete.useMutation({
    onSuccess: () => { toast.success("Meta eliminada"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Summary stats
  const totalTarget = goals.reduce((s, g) => s + Number(g.targetAmount), 0);
  const mensual = goals.filter(g => g.period === "mensual").length;
  const trimestral = goals.filter(g => g.period === "trimestral").length;
  const anual = goals.filter(g => g.period === "anual").length;

  return (
    <CRMLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Metas Comerciales</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Seguimiento de objetivos y cuotas del equipo de ventas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-1.5" /> Actualizar
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1.5" /> Nueva Meta
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Metas",    value: goals.length, icon: Target,    color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Mensuales",      value: mensual,      icon: Calendar,  color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { label: "Trimestrales",   value: trimestral,   icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
            { label: "Anuales",        value: anual,        icon: Trophy,    color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className={`p-4 flex items-center gap-3 rounded-xl ${s.bg}`}>
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total target */}
        {totalTarget > 0 && (
          <Card className="border-border/50 bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Objetivo total acumulado</p>
                <p className="text-3xl font-bold mt-1">${totalTarget.toLocaleString()}</p>
              </div>
              <Trophy size={40} className="text-amber-400 opacity-50" />
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2">
          {["all", "mensual", "trimestral", "anual"].map(p => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === p ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "Todas" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Goals grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <Card className="border-border/50 border-dashed">
            <CardContent className="py-20 text-center">
              <Trophy size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium text-lg">Sin metas definidas</p>
              <p className="text-sm text-muted-foreground/60 mt-1 mb-6">
                Crea metas comerciales para hacer seguimiento del desempeño del equipo
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
                <Plus size={16} className="mr-1.5" /> Crear primera meta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => setEditGoal(goal)}
                onDelete={async () => {
                  const ok = await confirm({ title: "¿Eliminar esta meta?", description: "Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "destructive" });
                  if (ok) deleteGoal.mutate({ id: goal.id });
                }}
              />
            ))}
          </div>
        )}

        {/* Leaderboard section */}
        {goals.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Ranking del Equipo</CardTitle>
              <CardDescription>Desempeño vs metas asignadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Vendedor 1", pct: 94, amount: 94000, target: 100000 },
                  { name: "Vendedor 2", pct: 78, amount: 78000, target: 100000 },
                  { name: "Vendedor 3", pct: 61, amount: 61000, target: 100000 },
                  { name: "Vendedor 4", pct: 45, amount: 45000, target: 100000 },
                ].map((seller, i) => (
                  <div key={seller.name} className="flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-slate-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{seller.name}</span>
                        <span className={`font-bold ${seller.pct >= 80 ? "text-emerald-500" : seller.pct >= 60 ? "text-amber-500" : "text-red-500"}`}>
                          {seller.pct}%
                        </span>
                      </div>
                      <ProgressBar pct={seller.pct} color={getProgressColor(seller.pct)} />
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                        <span>${seller.amount.toLocaleString()}</span>
                        <span>Meta: ${seller.target.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      <GoalDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSuccess={() => refetch()}
      />
      {editGoal && (
        <GoalDialog
          open={!!editGoal}
          onClose={() => setEditGoal(null)}
          onSuccess={() => refetch()}
          editGoal={editGoal}
        />
      )}
    </CRMLayout>
  );
}
