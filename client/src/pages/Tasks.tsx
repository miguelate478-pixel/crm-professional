import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Clock, User, CheckSquare, Phone, Video, MapPin,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, Trash2, X,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

type TaskStatus = "pendiente" | "en_progreso" | "completada";
type TaskPriority = "baja" | "media" | "alta";

const priorityConfig: Record<TaskPriority, { label: string; className: string; dot: string }> = {
  alta:  { label: "Alta",  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",       dot: "bg-red-500" },
  media: { label: "Media", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  baja:  { label: "Baja",  className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",   dot: "bg-slate-400" },
};

// ── New Task Dialog ────────────────────────────────────────────────────────────

function NewTaskDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", priority: "media" as TaskPriority,
    dueDate: "", status: "pendiente" as TaskStatus,
  });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const create = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarea creada");
      onSuccess();
      onClose();
      setForm({ title: "", description: "", priority: "media", dueDate: "", status: "pendiente" });
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    create.mutate({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder="Ej: Llamar a cliente para seguimiento" value={form.title} onChange={set("title")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha límite</Label>
              <Input type="date" value={form.dueDate} onChange={set("dueDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea placeholder="Notas adicionales..." value={form.description} onChange={set("description")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            Crear Tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Task Item ──────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onDelete }: { task: any; onToggle: () => void; onDelete: () => void }) {
  const priority = priorityConfig[task.priority as TaskPriority] ?? priorityConfig.media;
  const isOverdue = task.status !== "completada" && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${
      task.status === "completada"
        ? "border-border/30 bg-muted/20 opacity-60"
        : isOverdue
        ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10"
        : "border-border/50 bg-card hover:border-border"
    }`}>
      <Checkbox
        checked={task.status === "completada"}
        onCheckedChange={onToggle}
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${task.status === "completada" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.className}`}>
              {priority.label}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <X size={12} />
            </Button>
          </div>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue && task.status !== "completada" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
              <Clock size={11} />
              <span>{task.dueDate}{isOverdue && task.status !== "completada" ? " · Vencida" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mini Calendar ──────────────────────────────────────────────────────────────

function MiniCalendar({ taskDates }: { taskDates: Set<number> }) {
  const today = new Date();
  const [current, setCurrent] = useState(today);
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold capitalize">{monthName}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrent(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrent(new Date(year, month + 1, 1))}><ChevronRight size={14} /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["D","L","M","X","J","V","S"].map(d => (
            <div key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }, (_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasTask = taskDates.has(day);
            return (
              <div key={day} className={`relative text-xs py-1.5 rounded-lg cursor-pointer transition-colors ${isToday ? "bg-blue-600 text-white font-bold" : "hover:bg-muted text-foreground"}`}>
                {day}
                {hasTask && !isToday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const { confirm } = useConfirm();

  const { data, isLoading, refetch } = trpc.tasks.list.useQuery({
    limit: 100,
    status: filter !== "all" ? filter : undefined,
  });

  // Fetch all tasks for counts (unfiltered)
  const { data: allData } = trpc.tasks.list.useQuery({ limit: 1000 });
  const tasks = data?.data ?? [];
  const allTasks = allData?.data ?? tasks;

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => { toast.success("Tarea eliminada"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const toggleTask = (task: any) => {
    updateStatus.mutate({
      id: task.id,
      status: task.status === "completada" ? "pendiente" : "completada",
    });
  };

  const counts = {
    pendiente:   allTasks.filter(t => t.status === "pendiente").length,
    en_progreso: allTasks.filter(t => t.status === "en_progreso").length,
    completada:  allTasks.filter(t => t.status === "completada").length,
  };

  const taskDates = new Set(
    tasks.filter(t => t.dueDate).map(t => new Date(t.dueDate!).getDate())
  );

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tareas y Actividades</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona tu agenda y actividades comerciales</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} className="mr-1.5" /> Actualizar</Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1.5" /> Nueva Tarea
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Tasks list */}
          <div className="xl:col-span-3 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pendientes",  value: counts.pendiente,   color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20" },
                { label: "En Progreso", value: counts.en_progreso, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
                { label: "Completadas", value: counts.completada,  color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              ].map(s => (
                <Card key={s.label} className="border-border/50">
                  <CardContent className={`p-4 ${s.bg} rounded-xl`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(["all", "pendiente", "en_progreso", "completada"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {f === "all" ? "Todas" : f === "pendiente" ? "Pendientes" : f === "en_progreso" ? "En Progreso" : "Completadas"}
                </button>
              ))}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center">
                <CheckSquare size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay tareas aún</p>
                <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
                  <Plus size={14} className="mr-1.5" /> Crear primera tarea
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task)}
                    onDelete={async () => {
                      const ok = await confirm({ title: "¿Eliminar tarea?", description: "Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "destructive" });
                      if (ok) deleteTask.mutate({ id: task.id });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <MiniCalendar taskDates={taskDates} />
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Próximas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tasks.filter(t => t.status !== "completada" && t.dueDate).slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <CheckSquare size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">{task.dueDate}</p>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status !== "completada" && t.dueDate).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin tareas próximas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewTaskDialog open={showNew} onClose={() => setShowNew(false)} onSuccess={() => refetch()} />
    </CRMLayout>
  );
}
