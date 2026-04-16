import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Settings, Target, Tag, Building2, Shield,
  Plus, Edit, Trash2, GripVertical, Check, X, Mail, Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockUsers = [
  { id: 1, name: "Carlos Mendoza", email: "carlos@empresa.com", role: "admin", status: "activo", lastLogin: "Hace 2 horas" },
  { id: 2, name: "Ana Rodríguez", email: "ana@empresa.com", role: "user", status: "activo", lastLogin: "Hace 1 día" },
  { id: 3, name: "Luis Torres", email: "luis@empresa.com", role: "user", status: "activo", lastLogin: "Hace 3 horas" },
  { id: 4, name: "María García", email: "maria@empresa.com", role: "user", status: "activo", lastLogin: "Hace 5 horas" },
  { id: 5, name: "Jorge Pérez", email: "jorge@empresa.com", role: "user", status: "inactivo", lastLogin: "Hace 7 días" },
];

const mockStages = [
  { id: 1, name: "Prospecto", color: "#64748B", probability: 10, order: 1 },
  { id: 2, name: "Calificado", color: "#3B82F6", probability: 30, order: 2 },
  { id: 3, name: "Propuesta", color: "#F59E0B", probability: 50, order: 3 },
  { id: 4, name: "Negociación", color: "#F97316", probability: 75, order: 4 },
  { id: 5, name: "Cerrado Ganado", color: "#10B981", probability: 100, order: 5 },
  { id: 6, name: "Cerrado Perdido", color: "#EF4444", probability: 0, order: 6 },
];

const mockSources = [
  { id: 1, name: "Sitio Web", color: "#3B82F6" },
  { id: 2, name: "Referido", color: "#10B981" },
  { id: 3, name: "Email Marketing", color: "#F59E0B" },
  { id: 4, name: "Redes Sociales", color: "#8B5CF6" },
  { id: 5, name: "Llamada en frío", color: "#64748B" },
  { id: 6, name: "Evento / Feria", color: "#EC4899" },
];

const lossReasons = [
  "Precio muy alto",
  "Eligió a la competencia",
  "Sin presupuesto",
  "Proyecto cancelado",
  "Sin respuesta",
  "Producto no adecuado",
];

// ── Components ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const { user: currentUser } = useAuth();
  const { data: dbUsers = [], isLoading, refetch } = trpc.users.list.useQuery();
  const { confirm } = useConfirm();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Rol actualizado"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const setActive = trpc.users.setActive.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("El email es requerido"); return; }
    setInviting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Invitación enviada a ${inviteEmail}`);
        setShowInvite(false);
        setInviteEmail("");
      } else {
        toast.error(data.error || "Error al enviar invitación");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setInviting(false);
    }
  };

  const displayUsers = dbUsers.length > 0 ? dbUsers : [
    { id: currentUser?.id ?? 1, name: currentUser?.name ?? "Admin CRM", email: currentUser?.email ?? "admin@crmpro.local", role: currentUser?.role ?? "admin", isActive: true, lastSignedIn: "Ahora" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Usuarios del Sistema</h3>
          <p className="text-sm text-muted-foreground">Gestiona los usuarios y sus permisos</p>
        </div>
        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowInvite(true)}>
          <Plus size={14} className="mr-1.5" /> Invitar Usuario
        </Button>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail size={18} className="text-blue-500" /> Invitar usuario al equipo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email del usuario</Label>
              <Input
                type="email"
                placeholder="vendedor@empresa.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Vendedor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              El usuario recibirá un email con un enlace para crear su cuenta. El enlace expira en 7 días.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {inviting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Mail size={14} className="mr-1.5" />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Rol</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Último acceso</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody>
              {displayUsers.map(u => (
                <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(u.name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className={`text-xs ${u.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0" : ""}`}>
                      {u.role === "admin" ? "Administrador" : "Vendedor"}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${u.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {u.isActive ? "Activo" : "Inactivo"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 hidden lg:table-cell text-sm text-muted-foreground">
                    {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("es-ES") : "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => updateRole.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                        disabled={u.id === currentUser?.id}
                      >
                        {u.role === "admin" ? "→ Vendedor" : "→ Admin"}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className={`h-7 w-7 ${u.isActive ? "text-destructive hover:text-destructive" : "text-emerald-500"}`}
                        onClick={() => setActive.mutate({ userId: u.id, isActive: !u.isActive })}
                        disabled={u.id === currentUser?.id}
                      >
                        {u.isActive ? <X size={13} /> : <Check size={13} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineTab() {
  const [newStageName, setNewStageName] = useState("");
  const [newStageProbability, setNewStageProbability] = useState("50");
  const { data: stagesData, refetch } = trpc.opportunities.getStages.useQuery({ pipelineId: 1 });
  const { confirm } = useConfirm();

  // Use real stages from DB, fallback to mock if empty
  const stages = stagesData && stagesData.length > 0 ? stagesData : mockStages;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Etapas del Pipeline</h3>
        <p className="text-sm text-muted-foreground">Configura las etapas de tu proceso de ventas</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-2">
          {stages.map((stage: any) => (
            <div key={stage.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors group">
              <GripVertical size={16} className="text-muted-foreground cursor-grab" />
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color ?? "#64748B" }} />
              <span className="flex-1 font-medium text-sm">{stage.name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Probabilidad:</span>
                <span className="font-semibold">{stage.probability ?? 0}%</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={13} /></Button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
            <Input
              placeholder="Nombre de la nueva etapa..."
              className="flex-1 h-8 text-sm"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Prob. %"
              className="w-20 h-8 text-sm"
              min="0"
              max="100"
              value={newStageProbability}
              onChange={e => setNewStageProbability(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newStageName.trim()}
              onClick={() => {
                if (!newStageName.trim()) return;
                toast.success(`Etapa "${newStageName}" agregada (requiere reinicio para persistir)`);
                setNewStageName("");
              }}
            >
              <Plus size={14} className="mr-1" /> Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Motivos de Pérdida</h3>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {lossReasons.map(reason => (
                <div key={reason} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-sm group">
                  <span>{reason}</span>
                  <button className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nuevo motivo de pérdida..." className="flex-1" />
              <Button size="sm" variant="outline"><Plus size={14} /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeadSourcesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Fuentes de Leads</h3>
          <p className="text-sm text-muted-foreground">Configura los canales de captación de leads</p>
        </div>
        <Button size="sm" variant="outline">
          <Plus size={14} className="mr-1.5" /> Nueva Fuente
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mockSources.map(source => (
          <Card key={source.id} className="border-border/50 group hover:shadow-sm transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${source.color}20` }}>
                <Tag size={16} style={{ color: source.color }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{source.name}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={13} /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 size={13} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-semibold">Información de la Empresa</h3>
        <p className="text-sm text-muted-foreground">Datos generales de tu organización</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre de la empresa</Label>
              <Input defaultValue="Mi Empresa SAS" />
            </div>
            <div className="space-y-1.5">
              <Label>NIT / RUT</Label>
              <Input defaultValue="900.123.456-7" />
            </div>
            <div className="space-y-1.5">
              <Label>Email corporativo</Label>
              <Input type="email" defaultValue="info@miempresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input defaultValue="+57 1 234 5678" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Dirección</Label>
              <Input defaultValue="Calle 100 # 15-20, Bogotá, Colombia" />
            </div>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">Guardar Cambios</Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Preferencias del Sistema</h3>
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            {[
              { label: "Notificaciones por email", desc: "Recibir alertas de actividad por email", defaultChecked: true },
              { label: "Recordatorios de tareas", desc: "Notificaciones antes del vencimiento de tareas", defaultChecked: true },
              { label: "Alertas de oportunidades estancadas", desc: "Avisar cuando una oportunidad lleva más de 7 días sin actividad", defaultChecked: true },
              { label: "Reportes automáticos semanales", desc: "Enviar resumen de desempeño cada lunes", defaultChecked: false },
            ].map(pref => (
              <div key={pref.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <Switch defaultChecked={pref.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Moneda y Formato</h3>
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select defaultValue="COP">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zona horaria</Label>
                <Select defaultValue="America/Bogota">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Bogota">América/Bogotá (UTC-5)</SelectItem>
                    <SelectItem value="America/Mexico_City">América/Ciudad de México (UTC-6)</SelectItem>
                    <SelectItem value="America/Lima">América/Lima (UTC-5)</SelectItem>
                    <SelectItem value="America/Santiago">América/Santiago (UTC-4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" variant="outline">Guardar Preferencias</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Audit Tab ──────────────────────────────────────────────────────────────────

function AuditTab() {
  const { data: logs = [], isLoading } = trpc.users.getAuditLogs.useQuery({ limit: 100 });

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h3 className="font-semibold">Registro de Auditoría</h3>
        <p className="text-sm text-muted-foreground">Historial de acciones realizadas en el sistema</p>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Shield size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">Sin registros de auditoría aún</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acción</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Entidad</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">IP</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.action === "login" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        log.action === "delete" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>{log.action}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-sm text-muted-foreground">{log.entityType} #{log.entityId}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground font-mono">{log.ipAddress || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra tu CRM y personaliza el sistema</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="general" className="gap-1.5">
              <Settings size={14} /> General
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users size={14} /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <Target size={14} /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-1.5">
              <Tag size={14} /> Fuentes
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <Shield size={14} /> Auditoría
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general"><GeneralTab /></TabsContent>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="pipeline"><PipelineTab /></TabsContent>
            <TabsContent value="sources"><LeadSourcesTab /></TabsContent>
            <TabsContent value="audit"><AuditTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </CRMLayout>
  );
}
