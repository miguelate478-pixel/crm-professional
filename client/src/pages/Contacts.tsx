import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, MoreHorizontal, Mail, Phone, Building2,
  MapPin, Briefcase, Users, Edit, Trash2, Eye, Globe,
  Loader2, RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact {
  id: number;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  companyId?: number | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ── Mock fallback data (used only when DB is empty) ────────────────────────────

const mockContacts: Contact[] = [
  { id: 1, firstName: "Juan", lastName: "García", email: "juan@techsolutions.com", phone: "+57 300 123 4567", jobTitle: "CEO", department: "Dirección", city: "Bogotá", country: "Colombia", createdAt: "2024-01-15" },
  { id: 2, firstName: "Ana", lastName: "Martínez", email: "ana@digitalinnovate.com", phone: "+57 310 234 5678", jobTitle: "CTO", department: "Tecnología", city: "Medellín", country: "Colombia", createdAt: "2024-01-14" },
  { id: 3, firstName: "Pedro", lastName: "López", email: "pedro@globalcorp.com", phone: "+57 320 345 6789", jobTitle: "Director Comercial", department: "Ventas", city: "Cali", country: "Colombia", createdAt: "2024-01-13" },
];

// ── New Contact Dialog ─────────────────────────────────────────────────────────

function NewContactDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
    city: "",
    country: "",
  });

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contacto creado exitosamente");
      onCreated();
      onClose();
      setForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", department: "", city: "", country: "" });
    },
    onError: (err) => {
      toast.error(`Error al crear contacto: ${err.message}`);
    },
  });

  const handleSubmit = () => {
    if (!form.firstName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    createContact.mutate({
      firstName: form.firstName,
      lastName: form.lastName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
      department: form.department || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Contacto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Juan" value={form.firstName} onChange={set("firstName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido</Label>
            <Input placeholder="García" value={form.lastName} onChange={set("lastName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="juan@empresa.com" value={form.email} onChange={set("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input placeholder="+57 300 000 0000" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <Input placeholder="CEO" value={form.jobTitle} onChange={set("jobTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <Input placeholder="Ventas" value={form.department} onChange={set("department")} />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input placeholder="Bogotá" value={form.city} onChange={set("city")} />
          </div>
          <div className="space-y-1.5">
            <Label>País</Label>
            <Input placeholder="Colombia" value={form.country} onChange={set("country")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createContact.isPending}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={handleSubmit}
            disabled={createContact.isPending}
          >
            {createContact.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Crear Contacto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Contact Dialog ────────────────────────────────────────────────────────

function EditContactDialog({
  contact,
  onClose,
  onUpdated,
}: {
  contact: Contact | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    jobTitle: contact?.jobTitle ?? "",
    department: contact?.department ?? "",
    city: contact?.city ?? "",
    country: contact?.country ?? "",
  });

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contacto actualizado");
      onUpdated();
      onClose();
    },
    onError: (err) => {
      toast.error(`Error al actualizar: ${err.message}`);
    },
  });

  if (!contact) return null;

  const handleSubmit = () => {
    if (!form.firstName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    updateContact.mutate({
      id: contact.id,
      firstName: form.firstName,
      lastName: form.lastName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={!!contact} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Contacto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.firstName} onChange={set("firstName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido</Label>
            <Input value={form.lastName} onChange={set("lastName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={set("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <Input value={form.jobTitle} onChange={set("jobTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input value={form.city} onChange={set("city")} />
          </div>
          <div className="space-y-1.5">
            <Label>País</Label>
            <Input value={form.country} onChange={set("country")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateContact.isPending}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={handleSubmit}
            disabled={updateContact.isPending}
          >
            {updateContact.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const { confirm } = useConfirm();

  const { data, isLoading, refetch } = trpc.contacts.list.useQuery({
    limit: 100,
    search: search || undefined,
  });

  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contacto eliminado");
      refetch();
    },
    onError: (err) => {
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  const contacts: Contact[] = data?.data ?? [];

  const filteredContacts = contacts.filter(c =>
    !search || `${c.firstName} ${c.lastName ?? ""} ${c.email ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contactos y Empresas</h1>
            <p className="text-muted-foreground text-sm mt-1">Directorio completo de contactos y organizaciones</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1.5" /> Nuevo Contacto
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contactos..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="contacts">
          <TabsList>
            <TabsTrigger value="contacts">
              <Users size={14} className="mr-1.5" /> Contactos ({filteredContacts.length})
            </TabsTrigger>
          </TabsList>

          {/* Contacts tab */}
          <TabsContent value="contacts" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredContacts.map(contact => (
                  <Card key={contact.id} className="border-border/50 hover:shadow-md transition-all duration-200 group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditContact(contact)}>
                              <Edit size={13} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                const ok = await confirm({ title: "¿Eliminar contacto?", description: "Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "destructive" });
                                if (ok) deleteContact.mutate({ id: contact.id });
                              }}
                            >
                              <Trash2 size={13} className="mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 space-y-2">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail size={12} className="flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone size={12} className="flex-shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {(contact.city || contact.country) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin size={12} className="flex-shrink-0" />
                            <span>{[contact.city, contact.country].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                        {contact.department && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Briefcase size={12} className="flex-shrink-0" />
                            <span>{contact.department}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                          <Mail size={11} className="mr-1" /> Email
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                          <Phone size={11} className="mr-1" /> Llamar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="col-span-3 py-16 text-center">
                    <Users size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No hay contactos aún</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Crea tu primer contacto para empezar</p>
                    <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
                      <Plus size={14} className="mr-1.5" /> Crear primer contacto
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewContactDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => refetch()}
      />

      <EditContactDialog
        contact={editContact}
        onClose={() => setEditContact(null)}
        onUpdated={() => refetch()}
      />
    </CRMLayout>
  );
}
