import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Download, DollarSign, FileText, Clock, CheckCircle, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-700",
  emitida: "bg-blue-100 text-blue-700",
  pagada: "bg-green-100 text-green-700",
  vencida: "bg-red-100 text-red-700",
  anulada: "bg-gray-100 text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador", emitida: "Emitida", pagada: "Pagada", vencida: "Vencida", anulada: "Anulada",
};

type InvoiceItem = { description: string; quantity: number; unitPrice: number; discount: number; productId?: number };

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; invoiceId?: number }>({ open: false });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; invoiceId?: number; invoiceNumber?: string; remaining?: number }>({ open: false });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "transferencia" as any, reference: "", notes: "" });

  const [form, setForm] = useState({
    contactId: "", companyId: "", dueDate: "", taxRate: "19", notes: "", terms: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, discount: 0 }] as InvoiceItem[],
  });

  const invoicesQuery = trpc.invoices.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter as any });
  const detailQuery = trpc.invoices.getById.useQuery(
    { id: detailDialog.invoiceId! },
    { enabled: !!detailDialog.invoiceId }
  );
  const productsQuery = trpc.products.list.useQuery({ limit: 100 });

  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => { toast.success("Factura creada"); invoicesQuery.refetch(); setCreateDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => { toast.success("Factura eliminada"); invoicesQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const paymentMutation = trpc.invoices.addPayment.useMutation({
    onSuccess: () => {
      toast.success("Pago registrado");
      invoicesQuery.refetch();
      detailQuery.refetch();
      setPaymentDialog({ open: false });
      setPaymentForm({ amount: "", method: "transferencia", reference: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const exportMutation = trpc.invoices.exportPDF.useMutation({
    onSuccess: (data) => {
      if (data.html) {
        const w = window.open();
        if (w) { w.document.write(data.html); w.document.close(); setTimeout(() => w.print(), 500); }
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const invoices = invoicesQuery.data?.data || [];
  const total = invoicesQuery.data?.total || 0;
  const products = productsQuery.data || [];

  const totalEmitida = invoices.filter(i => i.status === "emitida").reduce((s, i) => s + (i.total || 0), 0);
  const totalPagada = invoices.filter(i => i.status === "pagada").reduce((s, i) => s + (i.total || 0), 0);
  const totalVencida = invoices.filter(i => i.status === "vencida").reduce((s, i) => s + (i.total || 0), 0);

  const resetForm = () => setForm({ contactId: "", companyId: "", dueDate: "", taxRate: "19", notes: "", terms: "", items: [{ description: "", quantity: 1, unitPrice: 0, discount: 0 }] });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0, discount: 0 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: any) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const calcSubtotal = () => form.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discount / 100), 0);
  const calcTax = () => calcSubtotal() * (parseFloat(form.taxRate || "0") / 100);
  const calcTotal = () => calcSubtotal() + calcTax();

  const handleCreate = () => {
    if (!form.items.some(i => i.description && i.quantity > 0)) { toast.error("Agrega al menos un ítem"); return; }
    createMutation.mutate({
      dueDate: form.dueDate || undefined,
      taxRate: parseFloat(form.taxRate || "19"),
      notes: form.notes || undefined,
      terms: form.terms || undefined,
      items: form.items.filter(i => i.description).map(i => ({ ...i, productId: i.productId })),
    });
  };

  const handlePayment = () => {
    if (!paymentDialog.invoiceId || !paymentForm.amount) return;
    paymentMutation.mutate({
      invoiceId: paymentDialog.invoiceId,
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      reference: paymentForm.reference || undefined,
      notes: paymentForm.notes || undefined,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground mt-1">Gestiona facturas y pagos</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />Nueva Factura
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Clock className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-2xl font-bold">${totalEmitida.toLocaleString("es-CO")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Cobrado</p>
                <p className="text-2xl font-bold text-green-600">${totalPagada.toLocaleString("es-CO")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><DollarSign className="w-5 h-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-2xl font-bold text-red-600">${totalVencida.toLocaleString("es-CO")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "borrador", "emitida", "pagada", "vencida", "anulada"].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "Todas" : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Número</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
                  <th className="px-4 py-3 text-center font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-right font-semibold">Pagado</th>
                  <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay facturas</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">{inv.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.dueDate || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={STATUS_COLORS[inv.status] + " hover:" + STATUS_COLORS[inv.status]}>
                        {STATUS_LABELS[inv.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">${Number(inv.total).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-3 text-right text-green-600">${Number(inv.paidAmount).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">
                      ${Math.max(0, Number(inv.total) - Number(inv.paidAmount)).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailDialog({ open: true, invoiceId: inv.id })}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        {inv.status !== "pagada" && inv.status !== "anulada" && (
                          <Button size="sm" variant="ghost" className="text-green-600"
                            onClick={() => setPaymentDialog({ open: true, invoiceId: inv.id, invoiceNumber: inv.number, remaining: Number(inv.total) - Number(inv.paidAmount) })}>
                            <DollarSign className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => exportMutation.mutate({ id: inv.id })}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500"
                          onClick={() => { if (confirm("¿Eliminar factura?")) deleteMutation.mutate({ id: inv.id }); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Vencimiento</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <Label>IVA (%)</Label>
                <Input type="number" min="0" max="100" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Ítems</Label>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Agregar</Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Input placeholder="Descripción" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Cant." min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Precio" min="0" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Desc%" min="0" max="100" value={item.discount} onChange={e => updateItem(i, "discount", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-1 text-right text-sm font-semibold">
                      ${(item.quantity * item.unitPrice * (1 - item.discount / 100)).toLocaleString("es-CO")}
                    </div>
                    <div className="col-span-1 text-center">
                      {form.items.length > 1 && (
                        <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => removeItem(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${calcSubtotal().toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA ({form.taxRate}%)</span><span>${calcTax().toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span className="text-blue-600">${calcTotal().toLocaleString("es-CO")}</span></div>
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea placeholder="Notas adicionales..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Términos y Condiciones</Label>
              <Textarea placeholder="Términos de pago..." value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando..." : "Crear Factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(o) => setPaymentDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago - {paymentDialog.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              Saldo pendiente: <span className="font-bold text-orange-600">${paymentDialog.remaining?.toLocaleString("es-CO")}</span>
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Label>Método de Pago</Label>
              <Select value={paymentForm.method} onValueChange={v => setPaymentForm(f => ({ ...f, method: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                  <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                  <SelectItem value="cheque">📄 Cheque</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Referencia (opcional)</Label>
              <Input placeholder="Número de transacción..." value={paymentForm.reference} onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false })}>Cancelar</Button>
            <Button onClick={handlePayment} disabled={!paymentForm.amount || paymentMutation.isPending}>
              {paymentMutation.isPending ? "Guardando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => setDetailDialog({ open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle Factura - {detailQuery.data?.number}</DialogTitle>
          </DialogHeader>
          {detailQuery.data && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Estado:</span> <Badge className={STATUS_COLORS[detailQuery.data.status]}>{STATUS_LABELS[detailQuery.data.status]}</Badge></div>
                <div><span className="text-muted-foreground">Emisión:</span> <span className="font-medium">{detailQuery.data.issueDate}</span></div>
                <div><span className="text-muted-foreground">Vencimiento:</span> <span className="font-medium">{detailQuery.data.dueDate || "-"}</span></div>
              </div>
              <table className="w-full border-collapse">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailQuery.data.items || []).map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">${Number(item.unitPrice).toLocaleString("es-CO")}</td>
                      <td className="px-3 py-2 text-right font-semibold">${Number(item.total).toLocaleString("es-CO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="w-56 space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(detailQuery.data.subtotal).toLocaleString("es-CO")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IVA ({detailQuery.data.taxRate}%)</span><span>${Number(detailQuery.data.tax).toLocaleString("es-CO")}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="text-blue-600">${Number(detailQuery.data.total).toLocaleString("es-CO")}</span></div>
                  <div className="flex justify-between text-green-600"><span>Pagado</span><span>${Number(detailQuery.data.paidAmount).toLocaleString("es-CO")}</span></div>
                  <div className="flex justify-between font-bold text-orange-600"><span>Saldo</span><span>${Math.max(0, Number(detailQuery.data.total) - Number(detailQuery.data.paidAmount)).toLocaleString("es-CO")}</span></div>
                </div>
              </div>
              {(detailQuery.data.payments || []).length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Pagos</p>
                  {(detailQuery.data.payments || []).map((p: any) => (
                    <div key={p.id} className="flex justify-between py-1 border-b text-sm">
                      <span className="text-muted-foreground">{p.paymentDate} · {p.method}</span>
                      <span className="text-green-600 font-semibold">${Number(p.amount).toLocaleString("es-CO")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => exportMutation.mutate({ id: detailDialog.invoiceId! })}>
              <Download className="w-4 h-4 mr-2" />Exportar PDF
            </Button>
            <Button onClick={() => setDetailDialog({ open: false })}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
