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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus, RefreshCw, History } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [movementDialog, setMovementDialog] = useState<{ open: boolean; productId?: number; productName?: string }>({ open: false });
  const [movementForm, setMovementForm] = useState({ type: "entrada" as "entrada" | "salida" | "ajuste", quantity: "", reason: "", reference: "" });

  const inventoryQuery = trpc.inventory.list.useQuery({ search: search || undefined, lowStock: showLowStock || undefined });
  const movementsQuery = trpc.inventory.movements.useQuery({ limit: 50 });
  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success("Movimiento registrado");
      inventoryQuery.refetch();
      movementsQuery.refetch();
      setMovementDialog({ open: false });
      setMovementForm({ type: "entrada", quantity: "", reason: "", reference: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const inventory = inventoryQuery.data?.data || [];
  const movements = movementsQuery.data || [];
  const lowStockCount = inventory.filter(i => i.minStock !== null && i.quantity <= (i.minStock ?? 0)).length;

  const handleMovement = () => {
    if (!movementDialog.productId || !movementForm.quantity) return;
    adjustMutation.mutate({
      productId: movementDialog.productId,
      type: movementForm.type,
      quantity: parseFloat(movementForm.quantity),
      reason: movementForm.reason || undefined,
      reference: movementForm.reference || undefined,
    });
  };

  const getStockStatus = (item: any) => {
    if (item.minStock !== null && item.quantity <= (item.minStock ?? 0)) return "low";
    if (item.quantity === 0) return "empty";
    return "ok";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground mt-1">Control de stock y movimientos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Movimientos Hoy</p>
                <p className="text-2xl font-bold">{movements.filter(m => m.createdAt?.startsWith(new Date().toISOString().split("T")[0])).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Actual</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant={showLowStock ? "default" : "outline"}
              onClick={() => setShowLowStock(!showLowStock)}
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Stock Bajo
            </Button>
            <Button variant="outline" size="sm" onClick={() => inventoryQuery.refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Producto</th>
                      <th className="px-4 py-3 text-left font-semibold">SKU</th>
                      <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                      <th className="px-4 py-3 text-center font-semibold">Stock</th>
                      <th className="px-4 py-3 text-center font-semibold">Mín.</th>
                      <th className="px-4 py-3 text-left font-semibold">Ubicación</th>
                      <th className="px-4 py-3 text-center font-semibold">Estado</th>
                      <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay productos en inventario</td></tr>
                    ) : inventory.map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{item.productName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.productSku || "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.productCategory || "-"}</td>
                          <td className="px-4 py-3 text-center font-bold text-lg">{item.quantity}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{item.minStock ?? "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.location || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            {status === "empty" && <Badge variant="destructive">Sin stock</Badge>}
                            {status === "low" && <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Stock bajo</Badge>}
                            {status === "ok" && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">OK</Badge>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMovementDialog({ open: true, productId: item.productId, productName: item.productName ?? "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Movimiento
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Producto</th>
                      <th className="px-4 py-3 text-center font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-center font-semibold">Cantidad</th>
                      <th className="px-4 py-3 text-center font-semibold">Stock Anterior</th>
                      <th className="px-4 py-3 text-center font-semibold">Stock Nuevo</th>
                      <th className="px-4 py-3 text-left font-semibold">Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No hay movimientos registrados</td></tr>
                    ) : movements.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{new Date(m.createdAt).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3 font-medium">{m.productName}</td>
                        <td className="px-4 py-3 text-center">
                          {m.type === "entrada" && <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><TrendingUp className="w-3 h-3 mr-1" />Entrada</Badge>}
                          {m.type === "salida" && <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><TrendingDown className="w-3 h-3 mr-1" />Salida</Badge>}
                          {m.type === "ajuste" && <Badge variant="outline">Ajuste</Badge>}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{m.quantity}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{m.previousStock}</td>
                        <td className="px-4 py-3 text-center font-semibold">{m.newStock}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={movementDialog.open} onOpenChange={(o) => setMovementDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento - {movementDialog.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Movimiento</Label>
              <Select value={movementForm.type} onValueChange={(v) => setMovementForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">📦 Entrada (aumenta stock)</SelectItem>
                  <SelectItem value="salida">📤 Salida (reduce stock)</SelectItem>
                  <SelectItem value="ajuste">🔧 Ajuste (establece stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={movementForm.quantity}
                onChange={e => setMovementForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Razón (opcional)</Label>
              <Input
                placeholder="Ej: Compra a proveedor, Venta, Daño..."
                value={movementForm.reason}
                onChange={e => setMovementForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div>
              <Label>Referencia (opcional)</Label>
              <Input
                placeholder="Ej: Factura #123, Orden #456..."
                value={movementForm.reference}
                onChange={e => setMovementForm(f => ({ ...f, reference: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialog({ open: false })}>Cancelar</Button>
            <Button onClick={handleMovement} disabled={!movementForm.quantity || adjustMutation.isPending}>
              {adjustMutation.isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
