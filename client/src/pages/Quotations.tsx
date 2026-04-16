import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Search, MoreHorizontal, FileText, DollarSign, Calendar,
  Eye, Edit, Trash2, Send, CheckCircle, XCircle, Download, Filter,
  Loader2, RefreshCw, X,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { exportToCSV } from "@/lib/export";
import { validatePositiveNumber } from "@/lib/validation";

// ── Types ──────────────────────────────────────────────────────────────────────

type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada";

const statusConfig: Record<QuoteStatus, { label: string; className: string; icon: any }> = {
  borrador:  { label: "Borrador",  className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",       icon: FileText    },
  enviada:   { label: "Enviada",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",         icon: Send        },
  aceptada:  { label: "Aceptada",  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",             icon: XCircle     },
};

// ── New Quotation Dialog ───────────────────────────────────────────────────────

function NewQuotationDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [clientName, setClientName] = useState("");

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 - item.discount / 100), 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  const create = trpc.quotations.create.useMutation({
    onSuccess: () => {
      toast.success("Cotización creada");
      onSuccess();
      onClose();
      setItems([{ description: "", quantity: 1, unitPrice: 0, discount: 0 }]);
      setNotes("");
      setValidUntil("");
      setClientName("");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSubmit = () => {
    const validItems = items.filter(i => i.description.trim());
    if (validItems.length === 0) { toast.error("Agrega al menos un producto/servicio"); return; }
    // Validate each item
    for (const item of validItems) {
      const priceErr = validatePositiveNumber(String(item.unitPrice), "El precio");
      if (priceErr) { toast.error(priceErr); return; }
      if (item.quantity < 1) { toast.error("La cantidad debe ser al menos 1"); return; }
      if (item.discount < 0 || item.discount > 100) { toast.error("El descuento debe estar entre 0 y 100"); return; }
    }
    create.mutate({
      validUntil: validUntil || undefined,
      notes: clientName ? `Cliente: ${clientName}${notes ? ` | ${notes}` : ""}` : notes || undefined,
      items: validItems,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva Cotización</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cliente / Empresa</Label>
              <Input placeholder="Nombre del cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Válida hasta</Label>
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Productos / Servicios</Label>
              <Button variant="outline" size="sm" onClick={addItem}><Plus size={13} className="mr-1" /> Agregar línea</Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                <div className="col-span-5">Descripción</div>
                <div className="col-span-2">Cantidad</div>
                <div className="col-span-2">Precio Unit.</div>
                <div className="col-span-2">Desc. %</div>
                <div className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input placeholder="Descripción..." value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", Number(e.target.value))} className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(i, "discount", Number(e.target.value))} className="text-sm" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${subtotal.toLocaleString("es", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">IVA (19%)</span><span className="font-medium">${tax.toLocaleString("es", { minimumFractionDigits: 2 })}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-blue-600 dark:text-blue-400">${total.toLocaleString("es", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Input placeholder="Términos, condiciones o notas adicionales..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" onClick={() => handleSubmit()} disabled={create.isPending}>Guardar Borrador</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => handleSubmit()} disabled={create.isPending}>
            {create.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            <Send size={14} className="mr-1.5" /> Crear Cotización
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const { confirm } = useConfirm();

  const { data, isLoading, refetch } = trpc.quotations.list.useQuery({
    limit: 100,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  const quotes = data?.data ?? [];

  const updateStatus = trpc.quotations.update.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteQuote = trpc.quotations.delete.useMutation({
    onSuccess: () => { toast.success("Cotización eliminada"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const filtered = quotes.filter(q =>
    !search || q.number.toLowerCase().includes(search.toLowerCase())
  );

  const totalAccepted = quotes.filter(q => q.status === "aceptada").reduce((s, q) => s + (Number(q.total) || 0), 0);
  const totalPending  = quotes.filter(q => q.status === "enviada").reduce((s, q) => s + (Number(q.total) || 0), 0);

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cotizaciones</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona propuestas y documentos comerciales</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} className="mr-1.5" /> Actualizar</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const exportData = quotes.map(q => ({
                Número: q.number,
                Estado: q.status ?? "",
                Subtotal: q.subtotal ?? 0,
                IVA: q.tax ?? 0,
                Total: q.total ?? 0,
                "Válida hasta": q.validUntil ?? "",
                Notas: q.notes ?? "",
                Creado: q.createdAt ?? "",
              }));
              exportToCSV(exportData, `cotizaciones_${new Date().toISOString().split("T")[0]}`);
              toast.success(`${exportData.length} cotizaciones exportadas`);
            }}>
              <Download size={14} className="mr-1.5" /> Exportar CSV
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1.5" /> Nueva Cotización
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",      value: quotes.length,                                          color: "text-blue-500" },
            { label: "Aceptadas",  value: quotes.filter(q => q.status === "aceptada").length,     color: "text-emerald-500", sub: `$${(totalAccepted/1000).toFixed(0)}k` },
            { label: "Pendientes", value: quotes.filter(q => q.status === "enviada").length,      color: "text-amber-500",   sub: `$${(totalPending/1000).toFixed(0)}k` },
            { label: "Borradores", value: quotes.filter(q => q.status === "borrador").length,     color: "text-slate-500" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
                {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por número..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="aceptada">Aceptada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Número</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Subtotal</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">IVA</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Válida hasta</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(quote => {
                    const st = statusConfig[quote.status as QuoteStatus] ?? statusConfig.borrador;
                    const StatusIcon = st.icon;
                    return (
                      <tr key={quote.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <FileText size={15} className="text-muted-foreground" />
                            <span className="font-mono text-sm font-medium">{quote.number}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 pl-5">{quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("es-ES") : ""}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${st.className}`}>
                            <StatusIcon size={11} /> {st.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right hidden md:table-cell text-sm text-muted-foreground">
                          ${Number(quote.subtotal || 0).toLocaleString("es", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="py-4 px-4 text-right hidden md:table-cell text-sm text-muted-foreground">
                          ${Number(quote.tax || 0).toLocaleString("es", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            ${Number(quote.total || 0).toLocaleString("es", { minimumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar size={12} /> {quote.validUntil || "—"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={15} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: quote.id, status: "enviada" })}><Send size={13} className="mr-2" /> Marcar como Enviada</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: quote.id, status: "aceptada" })}><CheckCircle size={13} className="mr-2" /> Marcar como Aceptada</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: quote.id, status: "rechazada" })}><XCircle size={13} className="mr-2" /> Marcar como Rechazada</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={async () => {
                                const ok = await confirm({ title: "¿Eliminar cotización?", description: "Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "destructive" });
                                if (ok) deleteQuote.mutate({ id: quote.id });
                              }}>
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
            {!isLoading && filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Sin cotizaciones aún</p>
                <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowNew(true)}>
                  <Plus size={14} className="mr-1.5" /> Crear primera cotización
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewQuotationDialog open={showNew} onClose={() => setShowNew(false)} onSuccess={() => refetch()} />
    </CRMLayout>
  );
}
