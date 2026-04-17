import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Edit, Mail, Phone, Building2, User,
  Calendar, CheckSquare, FileText, Target, Clock, Plus,
  Star, TrendingUp, Save, X, Loader2, Activity, PhoneCall, Video, MapPin,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Status config ──────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  nuevo:      { label: "Nuevo",      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  contactado: { label: "Contactado", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  calificado: { label: "Calificado", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  descartado: { label: "Descartado", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "llamada" as const, title: "", description: "" });

  const leadId = parseInt(params.id || "0");

  const { data: lead, isLoading, refetch } = trpc.leads.getById.useQuery(
    { id: leadId },
    { enabled: !!leadId }
  );

  // Real activities from DB
  const { data: activities, refetch: refetchActivities } = trpc.activities.getByLead.useQuery(
    { leadId },
    { enabled: !!leadId }
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

  // Sync form when lead loads
  const handleEdit = () => {
    if (!lead) return;
    setForm({
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      jobTitle: lead.jobTitle || "",
      source: lead.source || "",
      status: lead.status || "nuevo",
      notes: lead.notes || "",
    });
    setEditing(true);
  };

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead actualizado"); setEditing(false); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSave = () => {
    updateLead.mutate({ id: leadId, ...form });
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

  if (!lead) {
    return (
      <CRMLayout>
        <div className="text-center py-32">
          <p className="text-muted-foreground">Lead no encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/leads")}>
            <ArrowLeft size={14} className="mr-2" /> Volver a Leads
          </Button>
        </div>
      </CRMLayout>
    );
  }

  const st = statusConfig[lead.status ?? "nuevo"] ?? statusConfig.nuevo;
  const initials = `${lead.firstName.charAt(0)}${lead.lastName?.charAt(0) || ""}`;

  // Activity type icons
  const activityIcons: Record<string, any> = {
    llamada: PhoneCall, reunion: Video, visita: MapPin, email: Mail,
  };
  const activityColors: Record<string, string> = {
    llamada: "bg-blue-500", reunion: "bg-violet-500", visita: "bg-amber-500", email: "bg-indigo-500",
  };

  // Build timeline: system events + real activities
  const systemEvents = [
    { icon: User, color: "bg-slate-500", title: "Lead creado", desc: `Fuente: ${lead.source || "Desconocida"}`, time: lead.createdAt },
    ...(lead.updatedAt && lead.updatedAt !== lead.createdAt ? [{ icon: CheckSquare, color: "bg-emerald-500", title: "Lead actualizado", desc: `Estado: ${lead.status}`, time: lead.updatedAt }] : []),
  ];

  const realActivities = (activities ?? []).map(a => ({
    icon: activityIcons[a.type] ?? Activity,
    color: activityColors[a.type] ?? "bg-slate-500",
    title: a.title,
    desc: a.description ?? "",
    time: a.createdAt,
  }));

  const timeline = [...systemEvents, ...realActivities].sort((a, b) =>
    new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime()
  );

  return (
    <CRMLayout>
      <div className="space-y-6 max-w-6xl">

        {/* Back + Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="text-muted-foreground">
              <ArrowLeft size={16} className="mr-1.5" /> Leads
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold">{lead.firstName} {lead.lastName}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${st.className}`}>{st.label}</span>
                  {lead.jobTitle && <span className="text-sm text-muted-foreground">{lead.jobTitle}</span>}
                  {lead.company && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 size={12} /> {lead.company}
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
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleSave} disabled={updateLead.isPending}>
                  {updateLead.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Guardar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <Target size={14} className="mr-1.5" /> Convertir a Oportunidad
                </Button>
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
            { icon: Mail,     label: "Enviar Email",  color: "text-blue-500" },
            { icon: Phone,    label: "Llamar",        color: "text-green-500" },
            { icon: Calendar, label: "Agendar Reunión", color: "text-violet-500" },
            { icon: CheckSquare, label: "Nueva Tarea", color: "text-amber-500" },
          ].map(a => (
            <Button key={a.label} variant="outline" size="sm" className="h-8 text-xs">
              <a.icon size={13} className={`mr-1.5 ${a.color}`} />
              {a.label}
            </Button>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left: Info + Edit */}
          <div className="xl:col-span-1 space-y-4">

            {/* Contact info */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label className="text-xs">Nombre</Label><Input value={form.firstName} onChange={set("firstName")} className="h-8 text-sm" /></div>
                      <div className="space-y-1"><Label className="text-xs">Apellido</Label><Input value={form.lastName} onChange={set("lastName")} className="h-8 text-sm" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={set("email")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={set("phone")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={set("company")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Cargo</Label><Input value={form.jobTitle} onChange={set("jobTitle")} className="h-8 text-sm" /></div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estado</Label>
                      <Select value={form.status} onValueChange={set("status")}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nuevo">Nuevo</SelectItem>
                          <SelectItem value="contactado">Contactado</SelectItem>
                          <SelectItem value="calificado">Calificado</SelectItem>
                          <SelectItem value="descartado">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fuente</Label>
                      <Select value={form.source} onValueChange={set("source")}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sitio Web">Sitio Web</SelectItem>
                          <SelectItem value="Referido">Referido</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Redes Sociales">Redes Sociales</SelectItem>
                          <SelectItem value="Llamada">Llamada en frío</SelectItem>
                          <SelectItem value="Evento">Evento / Feria</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[
                      { icon: Mail,       label: "Email",    value: lead.email },
                      { icon: Phone,      label: "Teléfono", value: lead.phone },
                      { icon: Building2,  label: "Empresa",  value: lead.company },
                      { icon: User,       label: "Cargo",    value: lead.jobTitle },
                      { icon: TrendingUp, label: "Fuente",   value: lead.source },
                    ].map(f => f.value ? (
                      <div key={f.label} className="flex items-center gap-2.5">
                        <f.icon size={14} className="text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                          <p className="text-sm font-medium">{f.value}</p>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Lead Score</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star size={16} className="text-amber-400 fill-current" />
                      <span className="text-2xl font-bold">{lead.score ?? 0}</span>
                      <span className="text-muted-foreground text-sm">/ 100</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3B82F6" strokeWidth="3"
                        strokeDasharray={`${(lead.score ?? 0)} 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {lead.score ?? 0}
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lead.score ?? 0}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creado</span>
                  <span className="font-medium">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-ES") : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span className="font-medium">{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString("es-ES") : "—"}</span>
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
                {/* Log new activity */}
                {showActivityForm ? (
                  <Card className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {(["llamada", "reunion", "visita", "email"] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setActivityForm(f => ({ ...f, type: t as any }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${activityForm.type === t ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
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
                          onClick={() => createActivity.mutate({ ...activityForm, leadId })}
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
                        placeholder="Escribe una nota sobre este lead..."
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
                {lead.notes && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Admin</p>
                            <p className="text-xs text-muted-foreground">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-ES") : ""}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{lead.notes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!lead.notes && (
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
