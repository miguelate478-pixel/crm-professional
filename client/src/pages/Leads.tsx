import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, MoreHorizontal, Mail, Phone, Building2,
  TrendingUp, Users, Star, UserCheck, Trash2, Edit, Eye,
  Target, Calendar, X, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  Upload, Download, UserPlus, Bookmark, BookmarkCheck, AlertTriangle,
  Zap, User,
} from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useConfirm } from "@/components/ui/confirm-dialog";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { validateEmail, validateRequired, validatePhone } from "@/lib/validation";

// ── Types ──────────────────────────────────────────────────────────────────────

type LeadStatus = "nuevo" | "contactado" | "calificado" | "descartado";

const statusConfig: Record<string, { label: string; className: string }> = {
  nuevo:       { label: "Nuevo",       className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  contactado:  { label: "Contactado",  className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  calificado:  { label: "Calificado",  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  descartado:  { label: "Descartado",  className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-slate-400";
  return (
    <div className={`flex items-center gap-1 font-semibold text-sm ${color}`}>
      <Star size={11} className="fill-current" />
      {score}
    </div>
  );
}

// ── New Lead Dialog ────────────────────────────────────────────────────────────

function NewLeadDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    company: "", jobTitle: "", source: "", status: "nuevo" as LeadStatus, notes: "",
    assignedTo: "0" as string,
  });

  // Duplicate detection state
  const [dupQuery, setDupQuery] = useState<{ email?: string; phone?: string; firstName?: string; lastName?: string } | null>(null);
  const [dupDismissed, setDupDismissed] = useState(false);

  const { data: dupData } = trpc.leads.checkDuplicates.useQuery(
    dupQuery ?? {},
    { enabled: !!dupQuery && !dupDismissed }
  );

  const { data: usersData } = trpc.users.list.useQuery();
  const users = usersData ?? [];

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead creado correctamente");
      onSuccess();
      onClose();
      setForm({ firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", source: "", status: "nuevo", notes: "", assignedTo: "0" });
      setDupQuery(null);
      setDupDismissed(false);
    },
    onError: (e) => toast.error("Error al crear lead: " + e.message),
  });

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const handleBlurCheck = () => {
    if (dupDismissed) return;
    const q: any = {};
    if (form.email) q.email = form.email;
    if (form.phone) q.phone = form.phone;
    if (form.firstName && form.lastName) { q.firstName = form.firstName; q.lastName = form.lastName; }
    if (Object.keys(q).length > 0) setDupQuery(q);
  };

  const handleSubmit = () => {
    const nameErr = validateRequired(form.firstName, "El nombre");
    if (nameErr) { toast.error(nameErr); return; }
    const emailErr = validateEmail(form.email);
    if (emailErr) { toast.error(emailErr); return; }
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    createLead.mutate({
      ...form,
      assignedTo: form.assignedTo && form.assignedTo !== "0" ? Number(form.assignedTo) : undefined,
    });
  };

  const hasDups = dupData && dupData.duplicates.length > 0 && !dupDismissed;
  const firstDup = hasDups ? dupData.duplicates[0] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Lead</DialogTitle>
        </DialogHeader>

        {/* Duplicate warning */}
        {hasDups && firstDup && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={15} />
              <p className="text-sm font-semibold">Posible duplicado encontrado</p>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Ya existe un lead con este {dupData.matchField === "email" ? "email" : dupData.matchField === "phone" ? "teléfono" : "nombre"}:{" "}
              <strong>"{firstDup.firstName} {firstDup.lastName ?? ""}"</strong>{" "}
              (Estado: {firstDup.status})
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
                onClick={() => { onClose(); navigate(`/leads/${firstDup.id}`); }}
              >
                <Eye size={11} className="mr-1" /> Ver lead existente
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-amber-700 dark:text-amber-400"
                onClick={() => setDupDismissed(true)}
              >
                Continuar de todas formas
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Juan" value={form.firstName} onChange={set("firstName")} onBlur={handleBlurCheck} />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido</Label>
            <Input placeholder="García" value={form.lastName} onChange={set("lastName")} onBlur={handleBlurCheck} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="juan@empresa.com" value={form.email} onChange={set("email")} onBlur={handleBlurCheck} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input placeholder="+57 300 000 0000" value={form.phone} onChange={set("phone")} onBlur={handleBlurCheck} />
          </div>
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <Input placeholder="Tech Solutions" value={form.company} onChange={set("company")} />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <Input placeholder="CEO" value={form.jobTitle} onChange={set("jobTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Select onValueChange={set("source")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
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
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select defaultValue="nuevo" onValueChange={set("status")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="calificado">Calificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Asignar a</Label>
            <Select value={form.assignedTo} onValueChange={set("assignedTo")}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sin asignar</SelectItem>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notas</Label>
            <Textarea placeholder="Información adicional..." value={form.notes} onChange={set("notes")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={handleSubmit}
            disabled={createLead.isPending}
          >
            {createLead.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            Crear Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Lead Dialog ───────────────────────────────────────────────────────────

function EditLeadDialog({ lead, open, onClose, onSuccess }: { lead: any; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: lead?.firstName || "",
    lastName: lead?.lastName || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    company: lead?.company || "",
    jobTitle: lead?.jobTitle || "",
    source: lead?.source || "",
    status: lead?.status || "nuevo",
    notes: lead?.notes || "",
  });

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead actualizado"); onSuccess(); onClose(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar Lead</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.firstName} onChange={set("firstName")} /></div>
          <div className="space-y-1.5"><Label>Apellido</Label><Input value={form.lastName} onChange={set("lastName")} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={set("phone")} /></div>
          <div className="space-y-1.5"><Label>Empresa</Label><Input value={form.company} onChange={set("company")} /></div>
          <div className="space-y-1.5"><Label>Cargo</Label><Input value={form.jobTitle} onChange={set("jobTitle")} /></div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="calificado">Calificado</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Select value={form.source} onValueChange={set("source")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
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
          <div className="col-span-2 space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={set("notes")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={() => updateLead.mutate({ id: lead.id, ...form })}
            disabled={updateLead.isPending}
          >
            {updateLead.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Lead Dialog ─────────────────────────────────────────────────────────

function AssignLeadDialog({ lead, open, onClose, onSuccess }: { lead: any; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { data: usersData } = trpc.users.list.useQuery();
  const users = usersData ?? [];

  const assignLead = trpc.leads.assign.useMutation({
    onSuccess: () => { toast.success("Lead asignado correctamente"); onSuccess(); onClose(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={16} /> Asignar Lead
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Asignar <strong>{lead?.firstName} {lead?.lastName}</strong> a:
          </p>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar asesor..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u: any) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                      {(u.name ?? "?").charAt(0)}
                    </div>
                    {u.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={() => { if (selectedUser) assignLead.mutate({ id: lead.id, userId: Number(selectedUser) }); }}
            disabled={!selectedUser || assignLead.isPending}
          >
            {assignLead.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");
  const PAGE_SIZE = 20;
  const { confirm } = useConfirm();

  // ── Saved views (localStorage) ─────────────────────────────────────────────
  const VIEWS_KEY = "crm_lead_views";
  const [savedViews, setSavedViews] = useState<Array<{ name: string; search: string; status: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(VIEWS_KEY) ?? "[]"); } catch { return []; }
  });
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState("");

  const saveCurrentView = () => {
    if (!viewName.trim()) { toast.error("Escribe un nombre para la vista"); return; }
    const newViews = [...savedViews, { name: viewName.trim(), search, status: statusFilter }];
    setSavedViews(newViews);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(newViews));
    toast.success(`Vista "${viewName}" guardada`);
    setViewName("");
    setShowSaveView(false);
  };

  const applyView = (view: { search: string; status: string }) => {
    setSearch(view.search);
    setStatusFilter(view.status);
    setPage(0);
  };

  const deleteView = (idx: number) => {
    const newViews = savedViews.filter((_, i) => i !== idx);
    setSavedViews(newViews);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(newViews));
    toast.success("Vista eliminada");
  };

  // ── Automations ────────────────────────────────────────────────────────────
  const runAutomations = trpc.automations.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Automatizaciones ejecutadas: ${data.tasksCreated} tarea${data.tasksCreated !== 1 ? "s" : ""} creada${data.tasksCreated !== 1 ? "s" : ""}`);
      refetch();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const { data, isLoading, refetch } = trpc.leads.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    search: search || undefined,
    assignedTo: viewMode === "mine" ? undefined : undefined, // handled via myLeads
  });

  const { data: myLeadsData } = trpc.leads.myLeads.useQuery(undefined, {
    enabled: viewMode === "mine",
  });

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => { toast.success("Lead eliminado"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const leads = viewMode === "mine" ? (myLeadsData?.data ?? []) : (data?.data ?? []);
  const total = viewMode === "mine" ? (myLeadsData?.total ?? 0) : (data?.total ?? 0);

  const counts = {
    total,
    nuevo:      leads.filter(l => l.status === "nuevo").length,
    contactado: leads.filter(l => l.status === "contactado").length,
    calificado: leads.filter(l => l.status === "calificado").length,
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setPage(0); };
  const hasFilters = search || statusFilter !== "all";

  const handleExport = () => {
    const exportData = leads.map(l => ({
      Nombre: l.firstName,
      Apellido: l.lastName || "",
      Email: l.email || "",
      Teléfono: l.phone || "",
      Empresa: l.company || "",
      Cargo: l.jobTitle || "",
      Fuente: l.source || "",
      Estado: l.status || "",
      Score: l.score || 0,
      Creado: l.createdAt,
    }));
    exportToCSV(exportData, `leads_${new Date().toISOString().split("T")[0]}`);
    toast.success(`${exportData.length} leads exportados`);
  };

  return (
    <CRMLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona y califica tus prospectos</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* View mode toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Todos
              </button>
              <button
                onClick={() => setViewMode("mine")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "mine" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <User size={11} /> Mis Leads
              </button>
            </div>

            {/* Saved views */}
            {savedViews.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Bookmark size={13} className="mr-1.5" /> Vistas ({savedViews.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {savedViews.map((v, i) => (
                    <DropdownMenuItem key={i} className="flex items-center justify-between group">
                      <span className="flex-1 cursor-pointer" onClick={() => applyView(v)}>{v.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-2"
                        onClick={e => { e.stopPropagation(); deleteView(i); }}
                      >
                        <X size={12} />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Save current view */}
            {showSaveView ? (
              <div className="flex items-center gap-1">
                <Input
                  placeholder="Nombre de la vista..."
                  className="h-8 text-xs w-36"
                  value={viewName}
                  onChange={e => setViewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveCurrentView(); if (e.key === "Escape") setShowSaveView(false); }}
                  autoFocus
                />
                <Button size="sm" className="h-8 text-xs bg-blue-600" onClick={saveCurrentView}>Guardar</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowSaveView(false)}><X size={13} /></Button>
              </div>
            ) : (
              hasFilters && (
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowSaveView(true)}>
                  <BookmarkCheck size={13} className="mr-1.5" /> Guardar vista
                </Button>
              )
            )}

            {/* Automations */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => runAutomations.mutate()}
              disabled={runAutomations.isPending}
            >
              {runAutomations.isPending
                ? <Loader2 size={13} className="mr-1.5 animate-spin" />
                : <Zap size={13} className="mr-1.5 text-amber-500" />
              }
              Automatizar
            </Button>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-1.5" /> Actualizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download size={14} className="mr-1.5" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download size={13} className="mr-2" /> Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const exportData = leads.map(l => ({ Nombre: l.firstName, Apellido: l.lastName || "", Email: l.email || "", Teléfono: l.phone || "", Empresa: l.company || "", Estado: l.status || "" }));
                  exportToExcel(exportData, `leads_${new Date().toISOString().split("T")[0]}`);
                  toast.success("Exportado a Excel");
                }}>
                  <Download size={13} className="mr-2" /> Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} className="mr-1.5" /> Importar CSV
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1.5" /> Nuevo Lead
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Leads",  value: counts.total,      icon: Users,     color: "text-blue-500" },
            { label: "Nuevos",       value: counts.nuevo,      icon: TrendingUp, color: "text-indigo-500" },
            { label: "Contactados",  value: counts.contactado, icon: Mail,      color: "text-amber-500" },
            { label: "Calificados",  value: counts.calificado, icon: UserCheck, color: "text-emerald-500" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, empresa..."
              className="pl-9 h-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <Filter size={13} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="contactado">Contactado</SelectItem>
              <SelectItem value="calificado">Calificado</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
              <X size={13} className="mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-0 px-6 pt-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isLoading ? "Cargando..." : `${leads.length} leads`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Empresa</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Contacto</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">Fuente</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Score</th>
                      <th className="py-3 px-4 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => {
                      const st = statusConfig[lead.status ?? "nuevo"] ?? statusConfig.nuevo;
                      return (
                        <tr
                          key={lead.id}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {lead.firstName.charAt(0)}{lead.lastName?.charAt(0) || ""}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{lead.firstName} {lead.lastName}</p>
                                <p className="text-xs text-muted-foreground">{lead.jobTitle || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Building2 size={13} className="text-muted-foreground" />
                              {lead.company || "—"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell">
                            <div className="space-y-0.5">
                              {lead.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={10} /> {lead.email}</div>}
                              {lead.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={10} /> {lead.phone}</div>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden xl:table-cell">
                            <span className="text-xs bg-muted px-2 py-1 rounded-md">{lead.source || "—"}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.className}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell">
                            <ScoreBadge score={lead.score ?? 0} />
                          </td>
                          <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                  <Eye size={13} className="mr-2" /> Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditLead(lead)}>
                                  <Edit size={13} className="mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/opportunities?leadId=${lead.id}`)}>
                                  <Target size={13} className="mr-2" /> Convertir a oportunidad
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={async () => {
                                    const ok = await confirm({ title: "¿Eliminar lead?", description: "Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "destructive" });
                                    if (ok) deleteLead.mutate({ id: lead.id });
                                  }}
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

              {!isLoading && leads.length === 0 && (
                <div className="py-16 text-center">
                  <Users size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No hay leads aún</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Crea tu primer lead para empezar</p>
                  <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
                    <Plus size={14} className="mr-1.5" /> Crear primer lead
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={14} className="mr-1" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Página {page + 1} de {Math.ceil(total / PAGE_SIZE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total}
              >
                Siguiente <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}      </div>

      <NewLeadDialog open={showNew} onClose={() => setShowNew(false)} onSuccess={() => refetch()} />
      {editLead && (
        <EditLeadDialog
          lead={editLead}
          open={!!editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => refetch()}
        />
      )}
      <ImportCSVDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => { refetch(); toast.success("Leads importados correctamente"); }}
      />
    </CRMLayout>
  );
}
