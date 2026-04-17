import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Edit, DollarSign, Calendar, Target, Clock,
  Plus, Save, X, Loader2, Activity, FileText, CheckSquare,
  TrendingUp, ChevronDown, PhoneCall, Video, MapPin, Mail,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Stage config ───────────────────────────────────────────────────────────────

const DEFAULT_STAGES = [
  { id: 1, name: "Prospecto",   color: "bg-slate-500",   light: "bg-slate-100 dark:bg-slate-800",      text: "text-slate-600 dark:text-slate-300",    probability: 10 },
  { id: 2, name: "Calificado",  color: "bg-blue-500",    light: "bg-blue-50 dark:bg-blue-900/20",       text: "text-blue-700 dark:text-blue-300",       probability: 30 },
  { id: 3, name: "Propuesta",   color: "bg-amber-500",   light: "bg-amber-50 dark:bg-amber-900/20",     text: "text-amber-700 dark:text-amber-300",     probability: 50 },
  { id: 4, name: "Negociación", color: "bg-orange-500",  light: "bg-orange-50 dark:bg-orange-900/20",   text: "text-orange-700 dark:text-orange-300",   probability: 75 },
  { id: 5, name: "Cerrado",     color: "bg-emerald-500", light: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300",  probability: 100 },
];

// ── Timeline item ──────────────────────────────────────────────────────────────

function TimelineItem({ icon: Icon, color, title, desc, time }: any) {
  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={14} className="text-white" />
      </div>
      <div className="flex-1 pb-4 border-b border-border/30 last:border-0">
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock size={10} /> {time}
        </p>
      </div>
    </div>
  );
}

// ── Probability bar ────────────────────────────────────────────────────────────

function ProbabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "llamada" as const, title: "", description: "" });

  const oppId = parseInt(params.id || "0");

  const { data: opp, isLoading, refetch } = trpc.opportunities.getById.useQuery(
    { id: oppId },
    { enabled: !!oppId }
  );

  // Real activities
  const { data: activities, refetch: refetchActivities } = trpc.activities.getByOpportunity.useQuery(
    { opportunityId: oppId },
    { enabled: !!oppId }
  );

  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Actividad registrada");
      refetchActivities();
      setShowActivityForm(false);
      setActivityForm({ type: "llamada", title: "", description: "" });
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const [form, setForm] = useState<any>({});
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target?.value ?? e }));

  const handleEdit = () => {
    if (!opp) return;
    setForm({
      name: opp.name || "",
      description: opp.description || "",
      amount: opp.amount != null ? String(opp.amount) : "",
      probability: opp.probability != null ? String(opp.probability) : "0",
      expectedCloseDate: opp.expectedCloseDate || "",
      stageId: String(opp.stageId),
    });
    setEditing(true);
  };

  const updateOpp = trpc.opportunities.update.useMutation({
    onSuccess: () => { toast.success("Oportunidad actualizada"); setEditing(false); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const moveStage = trpc.opportunities.moveStage.useMutation({
    onSuccess: () => { toast.success("Etapa actualizada"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSave = () => {
    updateOpp.mutate({
      id: oppId,
      name: form.name,
      description: form.description || undefined,
      amount: form.amount ? Number(form.amount) : undefined,
      probability: Number(form.probability),
      expectedCloseDate: form.expectedCloseDate || undefined,
      stageId: Number(form.stageId),
    });
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      </CRMLayout>
    );
  }

  if (!opp) {
    return (
      <CRMLayout>
        <div className="text-center py-32">
          <p className="text-muted-foreground">Oportunidad no encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/opportunities")}>
            <ArrowLeft size={14} className="mr-2" /> Volver a Oportunidades
          </Button>
        </div>
      </CRMLayout>
    );
  }

  const stage = DEFAULT_STAGES.find(s => s.id === opp.stageId) ?? DEFAULT_STAGES[0];

  const timeline = [
    { icon: Target, color: "bg-blue-500", title: "Oportunidad creada", desc: opp.name, time: opp.createdAt },
    ...(opp.amount ? [{ icon: DollarSign, color: "bg-emerald-500", title: "Monto registrado", desc: `$${Number(opp.amount).toLocaleString()}`, time: opp.createdAt }] : []),
    ...(opp.updatedAt !== opp.createdAt ? [{ icon: TrendingUp, color: "bg-indigo-500", title: "Oportunidad actualizada", desc: `Etapa: ${stage.name}`, time: opp.updatedAt }] : []),
  ];

  return (
    <CRMLayout>
      <div className="space-y-6 max-w-6xl">

        {/* Back + Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/opportunities")} className="text-muted-foreground">
              <ArrowLeft size={16} className="mr-1.5" /> Oportunidades
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <DollarSign size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{opp.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${stage.light} ${stage.text}`}>{stage.name}</span>
                  {opp.amount != null && (
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      ${Number(opp.amount).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X size={14} className="mr-1.5" /> Cancelar
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleSave} disabled={updateOpp.isPending}>
                  {updateOpp.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Guardar
                </Button>
              </>
            ) : (
              <>
                {/* Stage change dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <TrendingUp size={14} className="mr-1.5" /> Cambiar Etapa <ChevronDown size={13} className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {DEFAULT_STAGES.map(s => (
                      <DropdownMenuItem
                        key={s.id}
                        disabled={s.id === opp.stageId}
                        onClick={() => moveStage.mutate({ id: oppId, stageId: s.id })}
                      >
                        <div className={`w-2 h-2 rounded-full ${s.color} mr-2`} />
                        {s.name}
                        {s.id === opp.stageId && <span className="ml-auto text-xs text-muted-foreground">Actual</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleEdit}>
                  <Edit size={14} className="mr-1.5" /> Editar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: CheckSquare, label: "Nueva Tarea",  color: "text-amber-500" },
            { icon: FileText,    label: "Nueva Nota",   color: "text-blue-500" },
            { icon: Calendar,    label: "Agendar",      color: "text-violet-500" },
          ].map(a => (
            <Button key={a.label} variant="outline" size="sm" className="h-8 text-xs">
              <a.icon size={13} className={`mr-1.5 ${a.color}`} />
              {a.label}
            </Button>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left: Info */}
          <div className="xl:col-span-1 space-y-4">

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Información de la Oportunidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input value={form.name} onChange={set("name")} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Monto</Label>
                      <Input type="number" value={form.amount} onChange={set("amount")} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Probabilidad (%)</Label>
                      <Input type="number" min="0" max="100" value={form.probability} onChange={set("probability")} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fecha estimada de cierre</Label>
                      <Input type="date" value={form.expectedCloseDate} onChange={set("expectedCloseDate")} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Etapa</Label>
                      <Select value={form.stageId} onValueChange={set("stageId")}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEFAULT_STAGES.map(s => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descripción</Label>
                      <Textarea value={form.description} onChange={set("description")} rows={2} className="text-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { icon: DollarSign, label: "Monto",       value: opp.amount != null ? `$${Number(opp.amount).toLocaleString()}` : null },
                      { icon: TrendingUp, label: "Probabilidad", value: opp.probability != null ? `${opp.probability}%` : null },
                      { icon: Calendar,   label: "Cierre Est.",  value: opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString("es-ES") : null },
                    ].map(f => f.value ? (
                      <div key={f.label} className="flex items-center gap-2.5">
                        <f.icon size={14} className="text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                          <p className="text-sm font-medium">{f.value}</p>
                        </div>
                      </div>
                    ) : null)}
                    {opp.description && (
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">{opp.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Probability visual */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Probabilidad de cierre</p>
                <ProbabilityBar value={opp.probability ?? 0} />
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${stage.light} ${stage.text}`}>{stage.name}</span>
                  <span>{stage.probability}% esperado</span>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creado</span>
                  <span className="font-medium">{opp.createdAt ? new Date(opp.createdAt).toLocaleDateString("es-ES") : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span className="font-medium">{opp.updatedAt ? new Date(opp.updatedAt).toLocaleDateString("es-ES") : "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Tabs */}
          <div className="xl:col-span-2">
            <Tabs defaultValue="actividad">
              <TabsList>
                <TabsTrigger value="actividad"><Activity size={13} className="mr-1.5" /> Actividad</TabsTrigger>
                <TabsTrigger value="notas"><FileText size={13} className="mr-1.5" /> Notas</TabsTrigger>
                <TabsTrigger value="tareas"><CheckSquare size={13} className="mr-1.5" /> Tareas</TabsTrigger>
              </TabsList>

              {/* Actividad */}
              <TabsContent value="actividad" className="mt-4 space-y-3">
                {showActivityForm ? (
                  <Card className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {(["llamada", "reunion", "visita", "email"] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setActivityForm(f => ({ ...f, type: t as any }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activityForm.type === t ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                          >
                            {t === "llamada" ? "📞 Llamada" : t === "reunion" ? "🎥 Reunión" : t === "visita" ? "📍 Visita" : "✉️ Email"}
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Título de la actividad..."
                        value={activityForm.title}
                        onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Descripción o resultado..."
                        value={activityForm.description}
                        onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowActivityForm(false)}>Cancelar</Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600"
                          disabled={!activityForm.title.trim() || createActivity.isPending}
                          onClick={() => createActivity.mutate({ ...activityForm, opportunityId: oppId })}
                        >
                          {createActivity.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                          Registrar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowActivityForm(true)}>
                    <Plus size={13} className="mr-1.5" /> Registrar Actividad
                  </Button>
                )}
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    {timeline.length > 0 ? (
                      <div className="space-y-0">
                        {timeline.map((item, i) => (
                          <TimelineItem key={i} {...item} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sin actividad registrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notas */}
              <TabsContent value="notas" className="mt-4 space-y-4">
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Escribe una nota sobre esta oportunidad..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" disabled={!newNote.trim()}>
                          <Plus size={13} className="mr-1.5" /> Agregar Nota
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {opp.description && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Admin</p>
                            <p className="text-xs text-muted-foreground">{opp.createdAt ? new Date(opp.createdAt).toLocaleDateString("es-ES") : ""}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!opp.description && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin notas aún</p>
                  </div>
                )}
              </TabsContent>

              {/* Tareas */}
              <TabsContent value="tareas" className="mt-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Tareas asociadas</CardTitle>
                      <Button size="sm" variant="outline">
                        <Plus size={13} className="mr-1.5" /> Nueva Tarea
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin tareas asociadas</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
