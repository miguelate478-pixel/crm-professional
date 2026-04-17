import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, CheckSquare,
  Video, Phone, Clock, Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type ViewMode = "month" | "week" | "day";

interface CalendarEvent {
  id: number;
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM
  endTime?: string;
  type: "task" | "meeting" | "call";
  status?: string;
  priority?: string;
}

const TYPE_CONFIG = {
  task:    { label: "Tarea",   color: "bg-blue-500",   light: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",   icon: CheckSquare },
  meeting: { label: "Reunión", color: "bg-violet-500", light: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", icon: Video },
  call:    { label: "Llamada", color: "bg-green-500",  light: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",  icon: Phone },
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// ── New Event Dialog ───────────────────────────────────────────────────────────

function NewEventDialog({ open, onClose, defaultDate, onSuccess }: {
  open: boolean; onClose: () => void; defaultDate: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    type: "task" as "task" | "meeting" | "call",
    title: "", date: defaultDate, time: "09:00", duration: "60", description: "",
  });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const createTask = trpc.tasks.create.useMutation({ onSuccess: () => { toast.success("Tarea creada"); onSuccess(); onClose(); } });
  const createActivity = trpc.activities.create.useMutation({ onSuccess: () => { toast.success("Evento creado"); onSuccess(); onClose(); } });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (form.type === "task") {
      createTask.mutate({ title: form.title, description: form.description || undefined, dueDate: form.date, priority: "media", status: "pendiente" });
    } else {
      const startTime = `${form.date}T${form.time}:00`;
      const endTime = new Date(new Date(startTime).getTime() + parseInt(form.duration) * 60000).toISOString();
      createActivity.mutate({ type: form.type === "meeting" ? "reunion" : "llamada", title: form.title, description: form.description || undefined, startTime, endTime });
    }
  };

  const isPending = createTask.isPending || createActivity.isPending;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar size={18} /> Nuevo Evento</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            {(["task","meeting","call"] as const).map(t => {
              const cfg = TYPE_CONFIG[t];
              return (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors border", form.type === t ? `${cfg.color} text-white border-transparent` : "border-border text-muted-foreground hover:text-foreground")}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder={form.type === "task" ? "Llamar a cliente..." : form.type === "meeting" ? "Reunión de seguimiento..." : "Llamada de prospección..."} value={form.title} onChange={set("title")} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={set("date")} />
            </div>
            {form.type !== "task" && (
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={form.time} onChange={set("time")} />
              </div>
            )}
            {form.type !== "task" && (
              <div className="space-y-1.5">
                <Label>Duración (min)</Label>
                <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea placeholder="Descripción o agenda..." value={form.description} onChange={set("description")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            {isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Event pill ─────────────────────────────────────────────────────────────────

function EventPill({ event }: { event: CalendarEvent }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity", cfg.light)}>
      <Icon size={9} className="flex-shrink-0" />
      <span className="truncate">{event.time ? `${event.time} ` : ""}{event.title}</span>
    </div>
  );
}

// ── Month View ─────────────────────────────────────────────────────────────────

function MonthView({ year, month, events, onDayClick }: {
  year: number; month: number; events: CalendarEvent[]; onDayClick: (date: string) => void;
}) {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };

  const cells = [];
  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  // Next month
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  return (
    <div className="flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: "repeat(6, 1fr)" }}>
        {cells.map((cell, i) => {
          const isToday = cell.current && cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dayEvents = cell.current ? getEventsForDay(cell.day) : [];
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;

          return (
            <div
              key={i}
              onClick={() => cell.current && onDayClick(dateStr)}
              className={cn(
                "border-b border-r border-border/30 p-1.5 min-h-[90px] transition-colors",
                cell.current ? "cursor-pointer hover:bg-muted/30" : "bg-muted/10",
                isToday && "bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                isToday ? "bg-blue-600 text-white" : cell.current ? "text-foreground" : "text-muted-foreground/40"
              )}>
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => <EventPill key={e.id} event={e} />)}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ──────────────────────────────────────────────────────────────────

function WeekView({ date, events, onDayClick }: { date: Date; events: CalendarEvent[]; onDayClick: (d: string) => void }) {
  const today = new Date();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-border/50 sticky top-0 bg-background z-10">
        <div className="py-2 text-xs text-muted-foreground text-center">Hora</div>
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div key={i} className={cn("py-2 text-center cursor-pointer hover:bg-muted/30", isToday && "bg-blue-50/50 dark:bg-blue-900/10")}
              onClick={() => onDayClick(d.toISOString().split("T")[0])}>
              <p className="text-xs text-muted-foreground">{DAYS[d.getDay()]}</p>
              <p className={cn("text-sm font-semibold", isToday && "text-blue-600")}>{d.getDate()}</p>
            </div>
          );
        })}
      </div>
      {/* Time slots */}
      {hours.map(h => (
        <div key={h} className="grid grid-cols-8 border-b border-border/20 min-h-[60px]">
          <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1">{h}:00</div>
          {days.map((d, i) => {
            const dateStr = d.toISOString().split("T")[0];
            const slotEvents = events.filter(e => e.date === dateStr && e.time && parseInt(e.time.split(":")[0]) === h);
            return (
              <div key={i} className="border-l border-border/20 p-0.5 space-y-0.5">
                {slotEvents.map(e => <EventPill key={e.id} event={e} />)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [current, setCurrent] = useState(today);
  const [view, setView] = useState<ViewMode>("month");
  const [showNew, setShowNew] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);

  const year = current.getFullYear();
  const month = current.getMonth();

  // Fetch tasks and activities
  const { data: tasksData, refetch: refetchTasks } = trpc.tasks.list.useQuery({ limit: 200 });
  const { data: meetingsData, refetch: refetchMeetings } = trpc.activities.list.useQuery({ type: "reunion", limit: 100 });
  const { data: callsData, refetch: refetchCalls } = trpc.activities.list.useQuery({ type: "llamada", limit: 100 });

  const refetchAll = () => { refetchTasks(); refetchMeetings(); refetchCalls(); };

  // Build unified events array
  const events: CalendarEvent[] = [
    ...(tasksData?.data ?? []).map(t => ({
      id: t.id,
      title: t.title,
      date: t.dueDate ?? "",
      type: "task" as const,
      status: t.status ?? undefined,
      priority: t.priority ?? undefined,
    })).filter(e => e.date),
    ...(meetingsData ?? []).map(a => ({
      id: a.id,
      title: a.title,
      date: a.startTime ? a.startTime.split("T")[0] : "",
      time: a.startTime ? a.startTime.split("T")[1]?.slice(0, 5) : undefined,
      type: "meeting" as const,
    })).filter(e => e.date),
    ...(callsData ?? []).map(a => ({
      id: a.id,
      title: a.title,
      date: a.startTime ? a.startTime.split("T")[0] : "",
      time: a.startTime ? a.startTime.split("T")[1]?.slice(0, 5) : undefined,
      type: "call" as const,
    })).filter(e => e.date),
  ];

  const navigate = (dir: number) => {
    if (view === "month") setCurrent(new Date(year, month + dir, 1));
    else if (view === "week") { const d = new Date(current); d.setDate(d.getDate() + dir * 7); setCurrent(d); }
    else { const d = new Date(current); d.setDate(d.getDate() + dir); setCurrent(d); }
  };

  const title = view === "month"
    ? `${MONTHS[month]} ${year}`
    : view === "week"
    ? `Semana del ${current.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
    : current.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  // Today's events
  const todayStr = today.toISOString().split("T")[0];
  const todayEvents = events.filter(e => e.date === todayStr);

  return (
    <CRMLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}><ChevronLeft size={16} /></Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrent(new Date())}>Hoy</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}><ChevronRight size={16} /></Button>
            </div>
            <h1 className="text-xl font-bold capitalize">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              {(["month","week","day"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                    view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
                </button>
              ))}
            </div>

            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 h-8 text-xs"
              onClick={() => { setSelectedDate(today.toISOString().split("T")[0]); setShowNew(true); }}>
              <Plus size={14} className="mr-1.5" /> Nuevo Evento
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn("w-2.5 h-2.5 rounded-full", cfg.color)} />
              {cfg.label}s
            </div>
          ))}
          <div className="ml-auto text-xs text-muted-foreground">
            {todayEvents.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {todayEvents.length} evento{todayEvents.length !== 1 ? "s" : ""} hoy
              </span>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 border border-border/50 rounded-xl overflow-hidden flex flex-col bg-background">
          {view === "month" && (
            <MonthView
              year={year} month={month} events={events}
              onDayClick={date => { setSelectedDate(date); setShowNew(true); }}
            />
          )}
          {view === "week" && (
            <WeekView
              date={current} events={events}
              onDayClick={date => { setSelectedDate(date); setShowNew(true); }}
            />
          )}
          {view === "day" && (
            <div className="flex-1 overflow-auto p-6">
              <h2 className="text-lg font-semibold mb-4">
                {current.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h2>
              {events.filter(e => e.date === current.toISOString().split("T")[0]).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Sin eventos para este día</p>
                  <Button size="sm" variant="outline" className="mt-4"
                    onClick={() => { setSelectedDate(current.toISOString().split("T")[0]); setShowNew(true); }}>
                    <Plus size={14} className="mr-1.5" /> Agregar evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.filter(e => e.date === current.toISOString().split("T")[0])
                    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
                    .map(e => {
                      const cfg = TYPE_CONFIG[e.type];
                      const Icon = cfg.icon;
                      return (
                        <div key={e.id} className={cn("flex items-center gap-3 p-4 rounded-xl border", cfg.light)}>
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cfg.color)}>
                            <Icon size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{e.title}</p>
                            {e.time && <p className="text-xs opacity-70 flex items-center gap-1 mt-0.5"><Clock size={10} /> {e.time}</p>}
                          </div>
                          <Badge className="ml-auto text-xs border-0 bg-white/50 dark:bg-black/20">{cfg.label}</Badge>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NewEventDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        defaultDate={selectedDate}
        onSuccess={refetchAll}
      />
    </CRMLayout>
  );
}
