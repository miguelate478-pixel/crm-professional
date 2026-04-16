import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, MoreHorizontal, Building2, Globe, Phone, Mail,
  MapPin, Users, Edit, Trash2, Download, Loader2, RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CompanyForm {
  name: string;
  website: string;
  phone: string;
  email: string;
  industry: string;
  employees: string;
  city: string;
  country: string;
  description: string;
}

const emptyForm: CompanyForm = {
  name: "", website: "", phone: "", email: "",
  industry: "", employees: "", city: "", country: "", description: "",
};

// ── Create/Edit Dialog ─────────────────────────────────────────────────────────

function CompanyDialog({
  open, onClose, onSuccess, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initial?: { id: number } & Partial<CompanyForm>;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<CompanyForm>({
    name: initial?.name ?? "",
    website: initial?.website ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    industry: initial?.industry ?? "",
    employees: initial?.employees ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "",
    description: initial?.description ?? "",
  });

  const set = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const createMut = trpc.companies.create.useMutation({
    onSuccess: () => { toast.success("Empresa creada"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.companies.update.useMutation({
    onSuccess: () => { toast.success("Empresa actualizada"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const loading = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    const payload = {
      name: form.name.trim(),
      website: form.website || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      industry: form.industry || undefined,
      employees: form.employees ? Number(form.employees) : undefined,
      city: form.city || undefined,
      country: form.country || undefined,
      description: form.description || undefined,
    };
    if (isEdit) {
      updateMut.mutate({ id: initial!.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="Nombre de la empresa" />
            </div>
            <div className="space-y-1.5">
              <Label>Industria</Label>
              <Input value={form.industry} onChange={set("industry")} placeholder="Tecnología, Servicios..." />
            </div>
            <div className="space-y-1.5">
              <Label>Empleados</Label>
              <Input type="number" value={form.employees} onChange={set("employees")} placeholder="100" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set("email")} placeholder="info@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Sitio Web</Label>
              <Input value={form.website} onChange={set("website")} placeholder="https://empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={set("city")} placeholder="Bogotá" />
            </div>
            <div className="space-y-1.5">
              <Label>País</Label>
              <Input value={form.country} onChange={set("country")} placeholder="Colombia" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={set("description")} placeholder="Descripción de la empresa..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const confirm = useConfirm();

  // Debounce search
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(v), 300);
  };

  const { data, isLoading, refetch } = trpc.companies.list.useQuery({
    limit: 50,
    offset: 0,
    search: debouncedSearch || undefined,
  });

  const deleteMut = trpc.companies.delete.useMutation({
    onSuccess: () => { toast.success("Empresa eliminada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: "Eliminar empresa",
      description: `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (ok) deleteMut.mutate({ id });
  };

  const handleExportCSV = () => {
    if (!data?.data.length) { toast.error("Sin datos para exportar"); return; }
    const headers = ["ID", "Nombre", "Industria", "Email", "Teléfono", "Ciudad", "País", "Empleados"];
    const rows = data.data.map(c => [
      c.id, c.name, c.industry ?? "", c.email ?? "", c.phone ?? "",
      c.city ?? "", c.country ?? "", c.employees ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "empresas.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const companies = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <CRMLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {total > 0 ? `${total} empresa${total !== 1 ? "s" : ""} registrada${total !== 1 ? "s" : ""}` : "Gestiona tu cartera de empresas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
              <Download size={12} className="mr-1.5" /> Exportar CSV
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-gradient-to-r from-blue-600 to-indigo-600"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={14} className="mr-1.5" /> Nueva Empresa
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              className="pl-9 h-9"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-9 px-3">
            <RefreshCw size={14} />
          </Button>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 size={40} className="text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">Sin empresas aún</p>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                  {debouncedSearch ? "No se encontraron resultados" : "Agrega tu primera empresa para comenzar"}
                </p>
                {!debouncedSearch && (
                  <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus size={14} className="mr-1.5" /> Nueva Empresa
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Nombre</th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Industria</th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Contacto</th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden xl:table-cell">Ubicación</th>
                      <th className="text-right py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Empleados</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Globe size={10} /> {company.website.replace(/^https?:\/\//, "")}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          {company.industry ? (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{company.industry}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            {company.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone size={10} /> {company.phone}
                              </p>
                            )}
                            {company.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail size={10} /> {company.email}
                              </p>
                            )}
                            {!company.phone && !company.email && <span className="text-muted-foreground text-xs">—</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden xl:table-cell">
                          {(company.city || company.country) ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin size={10} />
                              {[company.city, company.country].filter(Boolean).join(", ")}
                            </p>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right hidden lg:table-cell">
                          {company.employees != null ? (
                            <span className="text-xs flex items-center justify-end gap-1">
                              <Users size={10} className="text-muted-foreground" />
                              {company.employees.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditTarget(company)}>
                                <Edit size={13} className="mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(company.id, company.name)}
                              >
                                <Trash2 size={13} className="mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Dialogs */}
      <CompanyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />
      {editTarget && (
        <CompanyDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => refetch()}
          initial={{
            id: editTarget.id,
            name: editTarget.name,
            website: editTarget.website ?? "",
            phone: editTarget.phone ?? "",
            email: editTarget.email ?? "",
            industry: editTarget.industry ?? "",
            employees: editTarget.employees?.toString() ?? "",
            city: editTarget.city ?? "",
            country: editTarget.country ?? "",
            description: editTarget.description ?? "",
          }}
        />
      )}
    </CRMLayout>
  );
}
