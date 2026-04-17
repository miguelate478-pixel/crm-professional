import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, History, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [movementDialog, setMovementDialog] = useState<{
    open: boolean;
    productId?: number;
    productName?: string;
    currentStock?: number;
  }>({ open: false });
  const [movementForm, setMovementForm] = useState({
    type: "entrada" as "entrada" | "salida" | "ajuste",
    quantity: "",
    reason: "",
    reference: "",
  });

  // Traer TODOS los productos
  const productsQuery = trpc.products.list.useQuery({ limit: 200 });
  // Traer inventario existente
  const inventoryQuery = trpc.inventory.list.useQuery({ limit: 200 });
  // Traer movimientos
  const movementsQuery = trpc.inventory.movements.useQuery({ limit: 100 });

  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: (data) => {
      toast.success(`Stock actualizado → ${data.newStock} unidades`);
      inventoryQuery.refetch();
      movementsQuery.refetch();
      setMovementDialog({ open: false });
      setMovementForm({ type: "entrada", quantity: "", reason: "", reference: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  // Combinar productos con su stock actual
  const products = productsQuery.data || [];
  const inventoryMap = new Map(
    (inventoryQuery.data?.data || []).map((i) => [i.productId, i])
  );

  const allProducts = products
    .filter((p: any) => p.isActive !== false)
    .map((p: any) => {
      const inv = inventoryMap.get(p.id);
      return {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        productCategory: p.category,
        productPrice: p.price,
        quantity: inv?.quantity ?? 0,
        minStock: inv?.minStock ?? 0,
        location: inv?.location ?? null,
      };
    })
    .filter((p) =>
      !search ||
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.productSku?.toLowerCase().includes(search.toLowerCase())
    );

  const movements = movementsQuery.data || [];
  const lowStockCount = allProducts.filter((p) => p.quantity <= (p.minStock ?? 0) && p.minStock > 0).length;
  const sinStockCount = allProducts.filter((p) => p.quantity === 0).length;
  const totalUnidades = allProducts.reduce((s, p) => s + p.quantity, 0);

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

  const openMovement = (product: any, type: "entrada" | "salida" | "ajuste") => {
    setMovementForm({ type, quantity: "", reason: "", reference: "" });
    setMovementDialog({
      open: true,
      productId: product.productId,
      productName: product.productName,
      currentStock: product.quantity,
    });
  };

  const getStockBadge = (quantity: number, minStock: number) => {
    if (quantity === 0)
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Sin stock</Badge>;
    if (minStock > 0 && quantity <= minStock)
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">Stock bajo</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">OK</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stock y movimientos de todos tus productos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/products"}>
            <Package className="w-4 h-4 mr-2" />
            Ir a Productos
          </Button>
          <Button variant="outline" size="sm" onClick={() => { inventoryQuery.refetch(); productsQuery.refetch(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Productos</p>
                <p className="text-2xl font-bold mt-1">{allProducts.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">en catálogo</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Unidades</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{totalUnidades}</p>
                <p className="text-xs text-muted-foreground mt-0.5">en stock</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock Bajo</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">{lowStockCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">bajo mínimo</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sin Stock</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{sinStockCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">agotados</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="stock">Stock Actual</TabsTrigger>
            <TabsTrigger value="movements">
              Movimientos
              {movements.length > 0 && (
                <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{movements.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
          <Input
            placeholder="Buscar producto o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* STOCK ACTUAL */}
        <TabsContent value="stock" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Categoría</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Mín.</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                          <p className="text-muted-foreground font-medium">No hay productos</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Agrega productos en el módulo <strong>Productos</strong> primero
                          </p>
                        </td>
                      </tr>
                    ) : allProducts.map((item) => (
                      <tr key={item.productId} className="border-b border-border/30 hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {item.productName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell font-mono text-xs">
                          {item.productSku || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {item.productCategory || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-2xl font-bold ${item.quantity === 0 ? "text-red-500" : item.quantity <= (item.minStock ?? 0) && item.minStock > 0 ? "text-orange-500" : "text-foreground"}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                          {item.minStock > 0 ? item.minStock : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStockBadge(item.quantity, item.minStock ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 px-2"
                              onClick={() => openMovement(item, "entrada")}
                              title="Entrada de stock"
                            >
                              <ArrowUpCircle className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline text-xs">Entrada</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                              onClick={() => openMovement(item, "salida")}
                              title="Salida de stock"
                            >
                              <ArrowDownCircle className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline text-xs">Salida</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground h-8 px-2"
                              onClick={() => openMovement(item, "ajuste")}
                              title="Ajustar stock"
                            >
                              <SlidersHorizontal className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline text-xs">Ajuste</span>
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
        </TabsContent>

        {/* MOVIMIENTOS */}
        <TabsContent value="movements" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cantidad</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Anterior</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Nuevo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                          <p className="text-muted-foreground font-medium">Sin movimientos aún</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Los movimientos aparecen aquí cuando haces entradas, salidas o ajustes
                          </p>
                        </td>
                      </tr>
                    ) : movements.map((m) => (
                      <tr key={m.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(m.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 font-medium">{m.productName}</td>
                        <td className="px-4 py-3 text-center">
                          {m.type === "entrada" && (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 gap-1">
                              <TrendingUp className="w-3 h-3" />Entrada
                            </Badge>
                          )}
                          {m.type === "salida" && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 gap-1">
                              <TrendingDown className="w-3 h-3" />Salida
                            </Badge>
                          )}
                          {m.type === "ajuste" && (
                            <Badge variant="outline" className="gap-1">
                              <SlidersHorizontal className="w-3 h-3" />Ajuste
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{m.quantity}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{m.previousStock}</td>
                        <td className="px-4 py-3 text-center font-semibold hidden md:table-cell">{m.newStock}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{m.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de movimiento */}
      <Dialog open={movementDialog.open} onOpenChange={(o) => !o && setMovementDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementForm.type === "entrada" && <ArrowUpCircle className="w-5 h-5 text-emerald-600" />}
              {movementForm.type === "salida" && <ArrowDownCircle className="w-5 h-5 text-red-600" />}
              {movementForm.type === "ajuste" && <SlidersHorizontal className="w-5 h-5 text-blue-600" />}
              {movementForm.type === "entrada" ? "Entrada de Stock" : movementForm.type === "salida" ? "Salida de Stock" : "Ajuste de Stock"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Producto info */}
            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{movementDialog.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock actual: <span className="font-bold text-foreground">{movementDialog.currentStock} unidades</span>
                </p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo de movimiento</Label>
              <Select
                value={movementForm.type}
                onValueChange={(v) => setMovementForm((f) => ({ ...f, type: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">📦 Entrada — aumenta el stock</SelectItem>
                  <SelectItem value="salida">📤 Salida — reduce el stock</SelectItem>
                  <SelectItem value="ajuste">🔧 Ajuste — establece el stock exacto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cantidad */}
            <div className="space-y-1.5">
              <Label>
                {movementForm.type === "ajuste" ? "Nuevo stock total" : "Cantidad"}
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder={movementForm.type === "ajuste" ? `Actual: ${movementDialog.currentStock}` : "0"}
                value={movementForm.quantity}
                onChange={(e) => setMovementForm((f) => ({ ...f, quantity: e.target.value }))}
                autoFocus
              />
              {movementForm.quantity && movementForm.type !== "ajuste" && (
                <p className="text-xs text-muted-foreground">
                  Stock resultante:{" "}
                  <span className="font-bold text-foreground">
                    {movementForm.type === "entrada"
                      ? (movementDialog.currentStock ?? 0) + parseFloat(movementForm.quantity || "0")
                      : Math.max(0, (movementDialog.currentStock ?? 0) - parseFloat(movementForm.quantity || "0"))
                    } unidades
                  </span>
                </p>
              )}
            </div>

            {/* Razón */}
            <div className="space-y-1.5">
              <Label>Razón <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                placeholder="Ej: Compra a proveedor, Venta, Daño, Inventario físico..."
                value={movementForm.reason}
                onChange={(e) => setMovementForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>

            {/* Referencia */}
            <div className="space-y-1.5">
              <Label>Referencia <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                placeholder="Ej: Factura #123, Orden #456..."
                value={movementForm.reference}
                onChange={(e) => setMovementForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialog({ open: false })}>
              Cancelar
            </Button>
            <Button
              onClick={handleMovement}
              disabled={!movementForm.quantity || adjustMutation.isPending}
              className={
                movementForm.type === "entrada"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : movementForm.type === "salida"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {adjustMutation.isPending ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
