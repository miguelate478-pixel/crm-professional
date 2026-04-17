import { useState } from "react";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  RefreshCw,
  X,
  ArrowLeft,
  CreditCard,
  Banknote,
  Receipt,
  AlertCircle,
  Clock,
  TrendingUp,
  Printer,
  ChevronDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

type InvoiceStatus = "borrador" | "emitida" | "pagada" | "vencida" | "anulada";
type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "cheque" | "otro";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  productId?: string;
}

interface Payment {
  amount: number;
  method: PaymentMethod;
  reference: string;
  paymentDate: string;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string; icon: any; dot: string }
> = {
  borrador: {
    label: "Borrador",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: FileText,
    dot: "bg-slate-400",
  },
  emitida: {
    label: "Emitida",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Send,
    dot: "bg-blue-500",
  },
  pagada: {
    label: "Pagada",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle,
    dot: "bg-emerald-500",
  },
  vencida: {
    label: "Vencida",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
    dot: "bg-red-500",
  },
  anulada: {
    label: "Anulada",
    className:
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
    icon: XCircle,
    dot: "bg-zinc-400",
  },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  cheque: "Cheque",
  otro: "Otro",
};

const TAX_RATE = 18;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.borrador;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.className}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Register Payment Dialog ────────────────────────────────────────────────────

function PaymentDialog({
  open,
  invoiceId,
  maxAmount,
  onClose,
  onSuccess,
}: {
  open: boolean;
  invoiceId: string;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("transferencia");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const addPayment = trpc.invoices.addPayment.useMutation({
    onSuccess: () => {
      toast.success("Pago registrado correctamente");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (amt > maxAmount + 0.01) {
      toast.error(`El monto no puede superar el saldo pendiente (${formatCurrency(maxAmount)})`);
      return;
    }
    if (!paymentDate) {
      toast.error("Selecciona la fecha de pago");
      return;
    }
    addPayment.mutate({
      id: invoiceId,
      amount: amt,
      method,
      reference,
      paymentDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-500" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                S/
              </span>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                className="pl-9"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo pendiente: {formatCurrency(maxAmount)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(paymentMethodLabels) as [
                    PaymentMethod,
                    string
                  ][]
                ).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Referencia / N° operación</Label>
            <Input
              placeholder="Ej: OP-123456"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de pago</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600"
            onClick={handleSubmit}
            disabled={addPayment.isPending}
          >
            {addPayment.isPending && (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            )}
            <CheckCircle size={14} className="mr-1.5" />
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Invoice View ────────────────────────────────────────────────────────

function CreateInvoiceView({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const defaultDue = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];

  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, discount: 0, total: 0 },
  ]);

  const { data: contactsData } = trpc.contacts.list.useQuery({ limit: 100 });
  const contacts = contactsData?.data ?? [];

  const { data: productsData } = trpc.products.list.useQuery({ limit: 100 });
  const products = (productsData as any)?.data ?? [];

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Factura creada correctamente");
      onSuccess();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const calcItemTotal = (item: InvoiceItem) =>
    item.quantity * item.unitPrice * (1 - item.discount / 100);

  const updateItem = (i: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        updated.total = calcItemTotal(updated);
        return updated;
      })
    );
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, discount: 0, total: 0 },
    ]);

  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, item) => s + calcItemTotal(item), 0);
  const tax = subtotal * (TAX_RATE / 100);
  const total = subtotal + tax;

  const handleSave = (emit: boolean) => {
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      toast.error("Agrega al menos un producto o servicio");
      return;
    }
    if (!issueDate) {
      toast.error("Selecciona la fecha de emisión");
      return;
    }
    createInvoice.mutate({
      issueDate,
      dueDate: dueDate || undefined,
      contactId: contactId || undefined,
      notes: notes || undefined,
      terms: terms || undefined,
      status: emit ? "emitida" : "borrador",
      taxRate: TAX_RATE,
      items: validItems.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        total: calcItemTotal(i),
        productId: i.productId,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Nueva Factura
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Completa los datos para generar la factura
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={createInvoice.isPending}
          >
            {createInvoice.isPending && (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            )}
            <FileText size={14} className="mr-1.5" />
            Guardar Borrador
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={() => handleSave(true)}
            disabled={createInvoice.isPending}
          >
            {createInvoice.isPending && (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            )}
            <Send size={14} className="mr-1.5" />
            Emitir Factura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt size={16} className="text-blue-500" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Fecha de emisión</Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de vencimiento</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                        {c.company ? ` — ${c.company}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales para el cliente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Términos y condiciones</Label>
                <Textarea
                  placeholder="Ej: Pago a 30 días, sin descuentos adicionales..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500" />
                  Productos / Servicios
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus size={13} className="mr-1" />
                  Agregar línea
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Descripción
                      </th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">
                        Cant.
                      </th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                        Precio Unit.
                      </th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">
                        Desc. %
                      </th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                        IGV
                      </th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                        Total
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const lineSubtotal = calcItemTotal(item);
                      const lineIgv = lineSubtotal * (TAX_RATE / 100);
                      const lineTotal = lineSubtotal + lineIgv;
                      return (
                        <tr
                          key={i}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <Input
                              placeholder="Descripción del producto o servicio..."
                              value={item.description}
                              onChange={(e) =>
                                updateItem(i, "description", e.target.value)
                              }
                              className="text-sm border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            {products.length > 0 && (
                              <Select
                                value={item.productId ?? ""}
                                onValueChange={(v) => {
                                  const prod = products.find(
                                    (p: any) => p.id === v
                                  );
                                  if (prod) {
                                    updateItem(i, "productId", v);
                                    updateItem(
                                      i,
                                      "description",
                                      prod.name ?? ""
                                    );
                                    updateItem(
                                      i,
                                      "unitPrice",
                                      Number(prod.price ?? 0)
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className="h-6 text-xs border-0 bg-transparent p-0 mt-1 text-muted-foreground focus:ring-0 w-auto gap-1">
                                  <SelectValue placeholder="Seleccionar producto..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                              className="text-sm text-right w-full"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                S/
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(
                                    i,
                                    "unitPrice",
                                    Number(e.target.value)
                                  )
                                }
                                className="text-sm text-right pl-7"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) =>
                                  updateItem(
                                    i,
                                    "discount",
                                    Number(e.target.value)
                                  )
                                }
                                className="text-sm text-right pr-6"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                %
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-sm text-muted-foreground">
                            {formatCurrency(lineIgv)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="text-sm font-semibold">
                              {formatCurrency(lineTotal)}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            {items.length > 1 && (
                              <button
                                onClick={() => removeItem(i)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: totals */}
        <div className="space-y-4">
          <Card className="border-border/50 sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  IGV ({TAX_RATE}%)
                </span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                  {formatCurrency(total)}
                </span>
              </div>
              <Separator />
              <div className="space-y-2 pt-1">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => handleSave(true)}
                  disabled={createInvoice.isPending}
                >
                  {createInvoice.isPending ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Send size={14} className="mr-1.5" />
                  )}
                  Emitir Factura
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSave(false)}
                  disabled={createInvoice.isPending}
                >
                  <FileText size={14} className="mr-1.5" />
                  Guardar Borrador
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                IGV Perú — 18%
              </p>
              <p className="text-xs text-muted-foreground">
                El IGV se calcula automáticamente sobre el subtotal de cada
                línea después de aplicar descuentos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Detail View ────────────────────────────────────────────────────────

function InvoiceDetailView({
  invoiceId,
  onBack,
  onRefresh,
}: {
  invoiceId: string;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const { confirm } = useConfirm();

  const { data: invoice, isLoading, refetch } = trpc.invoices.getById.useQuery(
    { id: invoiceId },
    { enabled: !!invoiceId }
  );

  const updateStatus = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      refetch();
      onRefresh();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const exportPDF = trpc.invoices.exportPDF.useMutation({
    onSuccess: () => toast.success("PDF generado"),
    onError: (e) => toast.error("Error al exportar: " + e.message),
  });

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Factura eliminada");
      onBack();
      onRefresh();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground">Factura no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft size={14} className="mr-1.5" /> Volver
        </Button>
      </div>
    );
  }

  const inv = invoice as any;
  const status = (inv.status ?? "borrador") as InvoiceStatus;
  const subtotal = Number(inv.subtotal ?? 0);
  const tax = Number(inv.tax ?? 0);
  const total = Number(inv.total ?? 0);
  const paidAmount = Number(inv.paidAmount ?? 0);
  const balance = total - paidAmount;
  const items: any[] = inv.items ?? [];
  const payments: any[] = inv.payments ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {inv.number}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Emitida el{" "}
              {inv.issueDate
                ? new Date(inv.issueDate).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status !== "pagada" && status !== "anulada" && (
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600"
              size="sm"
              onClick={() => setShowPayment(true)}
            >
              <CreditCard size={14} className="mr-1.5" />
              Registrar Pago
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPDF.mutate({ id: invoiceId })}
            disabled={exportPDF.isPending}
          >
            {exportPDF.isPending ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Download size={14} className="mr-1.5" />
            )}
            Exportar PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === "borrador" && (
                <DropdownMenuItem
                  onClick={() =>
                    updateStatus.mutate({ id: invoiceId, status: "emitida" })
                  }
                >
                  <Send size={13} className="mr-2" /> Emitir factura
                </DropdownMenuItem>
              )}
              {status === "emitida" && (
                <DropdownMenuItem
                  onClick={() =>
                    updateStatus.mutate({ id: invoiceId, status: "pagada" })
                  }
                >
                  <CheckCircle size={13} className="mr-2" /> Marcar como pagada
                </DropdownMenuItem>
              )}
              {status !== "anulada" && (
                <DropdownMenuItem
                  onClick={() =>
                    updateStatus.mutate({ id: invoiceId, status: "anulada" })
                  }
                >
                  <XCircle size={13} className="mr-2" /> Anular factura
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  const ok = await confirm({
                    title: "¿Eliminar factura?",
                    description:
                      "Esta acción no se puede deshacer. Se eliminará permanentemente.",
                    confirmText: "Eliminar",
                    variant: "destructive",
                  });
                  if (ok) deleteInvoice.mutate({ id: invoiceId });
                }}
              >
                <Trash2 size={13} className="mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice document */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice header card */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <Receipt size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-lg">FACTURA</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {inv.number}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end text-sm">
                    <Calendar size={13} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Emisión:</span>
                    <span className="font-medium">
                      {inv.issueDate
                        ? new Date(inv.issueDate).toLocaleDateString("es-PE")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end text-sm">
                    <Clock size={13} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Vencimiento:</span>
                    <span
                      className={`font-medium ${
                        status === "vencida"
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString("es-PE")
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {inv.contact && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Facturar a
                  </p>
                  <p className="font-semibold">
                    {inv.contact.firstName} {inv.contact.lastName}
                  </p>
                  {inv.contact.email && (
                    <p className="text-sm text-muted-foreground">
                      {inv.contact.email}
                    </p>
                  )}
                  {inv.contact.phone && (
                    <p className="text-sm text-muted-foreground">
                      {inv.contact.phone}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items table */}
          <Card className="border-border/50">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Descripción
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                      Cant.
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                      Precio Unit.
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 hidden sm:table-cell">
                      Desc.
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="text-sm font-medium">
                          {item.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-right text-sm">
                        {formatCurrency(Number(item.unitPrice ?? 0))}
                      </td>
                      <td className="py-3.5 px-3 text-right text-sm text-muted-foreground hidden sm:table-cell">
                        {item.discount ? `${item.discount}%` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-sm">
                        {formatCurrency(Number(item.total ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/50">
                    <td
                      colSpan={3}
                      className="py-3 px-4 hidden sm:table-cell"
                    />
                    <td className="py-3 px-3 text-right text-sm text-muted-foreground hidden sm:table-cell">
                      Subtotal
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium">
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="py-1 px-4 hidden sm:table-cell"
                    />
                    <td className="py-1 px-3 text-right text-sm text-muted-foreground hidden sm:table-cell">
                      IGV ({TAX_RATE}%)
                    </td>
                    <td className="py-1 px-4 text-right text-sm font-medium">
                      {formatCurrency(tax)}
                    </td>
                  </tr>
                  <tr className="border-t border-border/50 bg-muted/20">
                    <td
                      colSpan={3}
                      className="py-3 px-4 hidden sm:table-cell"
                    />
                    <td className="py-3 px-3 text-right font-bold hidden sm:table-cell">
                      Total
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lg text-blue-600 dark:text-blue-400">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          {(inv.notes || inv.terms) && (
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-3">
                {inv.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Notas
                    </p>
                    <p className="text-sm">{inv.notes}</p>
                  </div>
                )}
                {inv.terms && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Términos y condiciones
                    </p>
                    <p className="text-sm text-muted-foreground">{inv.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: payment summary + history */}
        <div className="space-y-4">
          {/* Payment summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estado de pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total factura</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagado</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Saldo pendiente</span>
                <span
                  className={`font-bold text-lg ${
                    balance <= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(Math.max(0, balance))}
                </span>
              </div>
              {total > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progreso de pago</span>
                    <span>
                      {Math.min(100, Math.round((paidAmount / total) * 100))}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (paidAmount / total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {status !== "pagada" && status !== "anulada" && balance > 0 && (
                <Button
                  className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600"
                  size="sm"
                  onClick={() => setShowPayment(true)}
                >
                  <CreditCard size={13} className="mr-1.5" />
                  Registrar Pago
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment history */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote size={15} className="text-muted-foreground" />
                Historial de pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-6">
                  <Banknote
                    size={28}
                    className="mx-auto text-muted-foreground/30 mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sin pagos registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                            {paymentMethodLabels[p.method as PaymentMethod] ??
                              p.method}
                          </span>
                        </div>
                        {p.reference && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Ref: {p.reference}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleDateString(
                                "es-PE"
                              )
                            : "—"}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                        {formatCurrency(Number(p.amount ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showPayment && (
        <PaymentDialog
          open={showPayment}
          invoiceId={invoiceId}
          maxAmount={Math.max(0, balance)}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            refetch();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { confirm } = useConfirm();

  const { data, isLoading, refetch } = trpc.invoices.list.useQuery({
    limit: 200,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  });

  const invoices = (data as any)?.data ?? [];

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Factura eliminada");
      refetch();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateStatus = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      refetch();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const allInvoices: any[] = (data as any)?.data ?? [];

  const porCobrar = allInvoices
    .filter((i: any) => i.status === "emitida")
    .reduce((s: number, i: any) => s + (Number(i.total) - Number(i.paidAmount ?? 0)), 0);

  const cobrado = allInvoices
    .filter((i: any) => i.status === "pagada")
    .reduce((s: number, i: any) => s + Number(i.total ?? 0), 0);

  const vencido = allInvoices
    .filter((i: any) => i.status === "vencida")
    .reduce((s: number, i: any) => s + (Number(i.total) - Number(i.paidAmount ?? 0)), 0);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = invoices.filter((inv: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inv.number ?? "").toLowerCase().includes(q) ||
      (inv.contact?.firstName ?? "").toLowerCase().includes(q) ||
      (inv.contact?.lastName ?? "").toLowerCase().includes(q)
    );
  });

  const statusFilters: { value: string; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "borrador", label: "Borrador" },
    { value: "emitida", label: "Emitida" },
    { value: "pagada", label: "Pagada" },
    { value: "vencida", label: "Vencida" },
    { value: "anulada", label: "Anulada" },
  ];

  // ── Render sub-views ───────────────────────────────────────────────────────

  if (view === "create") {
    return (
      <CRMLayout>
        <CreateInvoiceView
          onBack={() => setView("list")}
          onSuccess={() => {
            refetch();
            setView("list");
          }}
        />
      </CRMLayout>
    );
  }

  if (view === "detail" && selectedId) {
    return (
      <CRMLayout>
        <InvoiceDetailView
          invoiceId={selectedId}
          onBack={() => setView("list")}
          onRefresh={() => refetch()}
        />
      </CRMLayout>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestiona y controla todas tus facturas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw size={14} className="mr-1.5" />
              Actualizar
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
              onClick={() => setView("create")}
            >
              <Plus size={16} className="mr-1.5" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Por Cobrar
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(porCobrar)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allInvoices.filter((i: any) => i.status === "emitida").length} facturas emitidas
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cobrado
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(cobrado)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allInvoices.filter((i: any) => i.status === "pagada").length} facturas pagadas
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Vencido
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(vencido)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allInvoices.filter((i: any) => i.status === "vencida").length} facturas vencidas
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 border-l-4 border-l-slate-400">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Facturas
                  </p>
                  <p className="text-xl font-bold mt-1">{allInvoices.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allInvoices.filter((i: any) => i.status === "borrador").length} borradores
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FileText size={16} className="text-slate-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar por número o cliente..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1.5 opacity-70">
                    {
                      allInvoices.filter(
                        (i: any) => i.status === f.value
                      ).length
                    }
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2
                  size={32}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Cliente
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                        Vencimiento
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Estado
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Total
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Pagado
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Saldo
                      </th>
                      <th className="py-3 px-4 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv: any) => {
                      const status = (inv.status ?? "borrador") as InvoiceStatus;
                      const total = Number(inv.total ?? 0);
                      const paid = Number(inv.paidAmount ?? 0);
                      const balance = total - paid;
                      const isOverdue =
                        status === "vencida" ||
                        (status === "emitida" &&
                          inv.dueDate &&
                          new Date(inv.dueDate) < new Date());

                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedId(inv.id);
                            setView("detail");
                          }}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${statusConfig[status]?.dot ?? "bg-slate-400"}`}
                              />
                              <span className="font-mono text-sm font-semibold">
                                {inv.number}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {inv.contact ? (
                              <div>
                                <p className="text-sm font-medium">
                                  {inv.contact.firstName} {inv.contact.lastName}
                                </p>
                                {inv.contact.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {inv.contact.email}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar size={12} />
                              {inv.issueDate
                                ? new Date(inv.issueDate).toLocaleDateString(
                                    "es-PE"
                                  )
                                : "—"}
                            </div>
                          </td>
                          <td className="py-4 px-4 hidden lg:table-cell">
                            <div
                              className={`flex items-center gap-1.5 text-sm ${
                                isOverdue
                                  ? "text-red-600 dark:text-red-400 font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Clock size={12} />
                              {inv.dueDate
                                ? new Date(inv.dueDate).toLocaleDateString(
                                    "es-PE"
                                  )
                                : "—"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={status} />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-sm">
                              {formatCurrency(total)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right hidden sm:table-cell">
                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              {formatCurrency(paid)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right hidden sm:table-cell">
                            <span
                              className={`text-sm font-semibold ${
                                balance <= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : balance > 0 && isOverdue
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-foreground"
                              }`}
                            >
                              {formatCurrency(Math.max(0, balance))}
                            </span>
                          </td>
                          <td
                            className="py-4 px-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreHorizontal size={15} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedId(inv.id);
                                    setView("detail");
                                  }}
                                >
                                  <Eye size={13} className="mr-2" /> Ver detalle
                                </DropdownMenuItem>
                                {status === "borrador" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus.mutate({
                                        id: inv.id,
                                        status: "emitida",
                                      })
                                    }
                                  >
                                    <Send size={13} className="mr-2" /> Emitir
                                  </DropdownMenuItem>
                                )}
                                {(status === "emitida" ||
                                  status === "vencida") && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus.mutate({
                                        id: inv.id,
                                        status: "pagada",
                                      })
                                    }
                                  >
                                    <CheckCircle size={13} className="mr-2" />{" "}
                                    Marcar pagada
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={async () => {
                                    const ok = await confirm({
                                      title: "¿Eliminar factura?",
                                      description:
                                        "Esta acción no se puede deshacer.",
                                      confirmText: "Eliminar",
                                      variant: "destructive",
                                    });
                                    if (ok)
                                      deleteInvoice.mutate({ id: inv.id });
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
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="py-20 text-center">
                <Receipt
                  size={44}
                  className="mx-auto text-muted-foreground/20 mb-3"
                />
                <p className="font-medium text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "No se encontraron facturas con ese filtro"
                    : "Aún no hay facturas"}
                </p>
                {!search && statusFilter === "all" && (
                  <Button
                    size="sm"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={() => setView("create")}
                  >
                    <Plus size={14} className="mr-1.5" />
                    Crear primera factura
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
