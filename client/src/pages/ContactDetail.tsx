import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Briefcase, Building2,
  Save, X, Loader2, Activity, FileText, Target, Plus, Clock,
  User, DollarSign,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "llamada" as const, title: "", description: "" });

  const contactId = parseInt(params.id || "0");

  const { data: contact, isLoading, refetch } = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !!contactId }
  );

  const { data: activityList, refetch: refetchActivities } = trpc.activities.getByLead.useQuery(
    { leadId: 0 }, // placeholder — we'll use contact activities
    { enabled: false }
  );

  const [form, setForm] = useState<any>({});
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target?.value ?? e }));

  const handleEdit = () => {
    if (!contact) return;
    setForm({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      jobTitle: contact.jobTitle || "",
      department: contact.department || "",
      city: contact.city || "",
      country: contact.country || "",
      notes: contact.notes || "",
    });
    setEditing(true);
  };

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contacto actualizado"); setEditing(false); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Actividad registrada");
      setShowActivity(false);
      setActivityForm({ type: "llamada", title: "", description: "" });
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSave = () => {
    updateContact.mutate({ id: contactId, ...form });
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

  if (!contact) {
    return (
      <CRMLayout>
        <div className="text-center py-32">
          <p className="text-muted-foreground">Contacto no encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/contacts")}>
            <ArrowLeft size={14} className="mr-2" /> Volver a Contactos
          </Button>
        </div>
      </CRMLayout>
    );
  }

  const initials = `${contact.firstName.charAt(0)}${contact.lastName?.charAt(0) || ""}`;

  return (
    <CRMLayout>
      <div className="space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/contacts")} className="text-muted-foreground">
              <ArrowLeft size={16} className="mr-1.5" /> Contactos
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold">{contact.firstName} {contact.lastName}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {contact.jobTitle && <span className="text-sm text-muted-foreground">{contact.jobTitle}</span>}
                  {contact.department && (
                    <Badge variant="secondary" className="text-xs">{contact.department}</Badge>
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
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleSave} disabled={updateContact.isPending}>
                  {updateContact.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Guardar
                </Button>
              </>
            ) : (
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleEdit}>
                <Edit size={14} className="mr-1.5" /> Editar
              </Button>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: Mail,   label: "Enviar Email", color: "text-blue-500" },
            { icon: Phone,  label: "Llamar",       color: "text-green-500" },
            { icon: Target, label: "Nueva Oportunidad", color: "text-amber-500" },
          ].map(a => (
            <Button key={a.label} variant="outline" size="sm" className="h-8 text-xs">
              <a.icon size={13} className={`mr-1.5 ${a.color}`} />
              {a.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left panel */}
          <div className="xl:col-span-1 space-y-4">
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
                    <div className="space-y-1"><Label className="text-xs">Móvil</Label><Input value={form.mobile} onChange={set("mobile")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Cargo</Label><Input value={form.jobTitle} onChange={set("jobTitle")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Departamento</Label><Input value={form.department} onChange={set("department")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Ciudad</Label><Input value={form.city} onChange={set("city")} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">País</Label><Input value={form.country} onChange={set("country")} className="h-8 text-sm" /></div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[
                      { icon: Mail,     label: "Email",       value: contact.email },
                      { icon: Phone,    label: "Teléfono",    value: contact.phone },
                      { icon: Phone,    label: "Móvil",       value: contact.mobile },
                      { icon: Briefcase,label: "Cargo",       value: contact.jobTitle },
                      { icon: Building2,label: "Departamento",value: contact.department },
                      { icon: MapPin,   label: "Ubicación",   value: [contact.city, contact.country].filter(Boolean).join(", ") || null },
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

            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creado</span>
                  <span className="font-medium">{contact.createdAt ? new Date(contact.createdAt).toLocaleDateString("es-ES") : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span className="font-medium">{contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString("es-ES") : "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel */}
          <div className="xl:col-span-2">
            <Tabs defaultValue="actividad">
              <TabsList>
                <TabsTrigger value="actividad"><Activity size={13} className="mr-1.5" /> Actividad</TabsTrigger>
                <TabsTrigger value="notas"><FileText size={13} className="mr-1.5" /> Notas</TabsTrigger>
                <TabsTrigger value="oportunidades"><Target size={13} className="mr-1.5" /> Oportunidades</TabsTrigger>
              </TabsList>

              {/* Actividad */}
              <TabsContent value="actividad" className="mt-4 space-y-4">
                {/* Log activity */}
                {showActivity ? (
                  <Card className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-2">
                        {(["llamada", "reunion", "visita", "email"] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setActivityForm(f => ({ ...f, type: t }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${activityForm.type === t ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Título de la actividad..."
                        value={activityForm.title}
                        onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Descripción o notas..."
                        value={activityForm.description}
                        onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowActivity(false)}>Cancelar</Button>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600"
                          disabled={!activityForm.title.trim() || createActivity.isPending}
                          onClick={() => createActivity.mutate({ ...activityForm, contactId })}>
                          {createActivity.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                          Registrar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowActivity(true)}>
                    <Plus size={13} className="mr-1.5" /> Registrar Actividad
                  </Button>
                )}

                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <div className="space-y-0">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-white" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">Contacto creado</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock size={10} /> {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString("es-ES") : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notas */}
              <TabsContent value="notas" className="mt-4 space-y-4">
                <Card className="border-border/50">
                  <CardContent className="p-4 space-y-2">
                    <Textarea
                      placeholder="Escribe una nota sobre este contacto..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" disabled={!newNote.trim()}>
                        <Plus size={13} className="mr-1.5" /> Agregar Nota
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {contact.notes ? (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                        <div>
                          <p className="text-sm font-medium">Admin</p>
                          <p className="text-sm text-muted-foreground mt-1">{contact.notes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin notas aún</p>
                  </div>
                )}
              </TabsContent>

              {/* Oportunidades */}
              <TabsContent value="oportunidades" className="mt-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Oportunidades asociadas</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => navigate("/opportunities")}>
                        <Plus size={13} className="mr-1.5" /> Nueva Oportunidad
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Target size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin oportunidades asociadas</p>
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
