import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, MoreHorizontal, Package, Edit, Trash2,
  Loader2, RefreshCw, ToggleLeft, ToggleRight,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string;
  description: string;
  category: string;
  price: string;
  cost: string;
  sku: string;
  stock: string;
  minStock: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", category: "", price: "", cost: "", sku: "", stock: "0", minStock: "0",
};

// ── Create/Edit Dialog ─────────────────────────────────────────────────────────

function ProductDialog({
  open, onClose, onSuccess, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initial?: { id: number } & Partial<ProductForm>;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<ProductForm>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    price: initial?.price ?? "",
    cost: initial?.cost ?? "",
    sku: initial?.sku ?? "",
    stock: "0",
    minStock: "0",
  });

  const set = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const createMut = trpc.products.create.useMutation({
    onSuccess: async (data) => {
      // Si tiene stock inicial, registrarlo en inventario
      if (Number(form.stock) > 0) {
        await setStockMut.mutateAsync({
          productId: data.id,
          quantity: Number(form.stock),
          minStock: Number(form.minStock) || 0,
        });
      }
      toast.success("Producto creado");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("Producto actualizado"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const setStockMut = trpc.inventory.setStock.useMutation();

  const loading = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error("El precio es requerido"); return; }
    const payload = {
      name: form.name.trim(),
      description: form.description || undefined,
      category: form.category || undefined,
      price: Number(form.price),
      cost: form.cost ? Number(form.cost) : undefined,
      sku: form.sku || undefined,
    };
    if (isEdit) {
      updateMut.mutate({ id: initial!.id, name: payload.name, price: payload.price, category: payload.category });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="Nombre del producto" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input value={form.category} onChange={set("category")} placeholder="Software, Servicios..." />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={set("sku")} placeholder="PROD-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Precio *</Label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={set("price")} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Costo</Label>
              <Input type="number" step="0.01" min="0" value={form.cost} onChange={set("cost")} placeholder="0.00" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={set("description")} placeholder="Descripción del producto..." rows={3} />
            </div>
            {!isEdit && (
              <>
                <div className="space-y-1.5">
                  <Label>Stock inicial</Label>
                  <Input type="number" min="0" step="1" value={form.stock} onChange={set("stock")} placeholder="0" />
                  <p className="text-xs text-muted-foreground">Unidades disponibles al crear</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Stock mínimo</Label>
                  <Input type="number" min="0" step="1" value={form.minStock} onChange={set("minStock")} placeholder="0" />
                  <p className="text-xs text-muted-foreground">Alerta cuando baje de este nivel</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(v), 300);
  };

  const { data: productsRaw, isLoading, refetch } = trpc.products.list.useQuery({
    limit: 100,
    search: debouncedSearch || undefined,
  });

  const toggleMut = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.products.delete.useMutation({
    onSuccess: () => { toast.success("Producto eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    deleteMut.mutate({ id });
  };

  // Derive categories for filter
  const allCategories = Array.from(new Set((productsRaw ?? []).map(p => p.category).filter(Boolean))) as string[];

  const products = (productsRaw ?? []).filter(p =>
    categoryFilter === "todos" || p.category === categoryFilter
  );

  const margin = (price: number, cost?: number | null) => {
    if (!cost || cost === 0) return null;
    return (((price - cost) / price) * 100).toFixed(1);
  };

  return (
    <CRMLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {products.length > 0
                ? `${products.length} producto${products.length !== 1 ? "s" : ""}`
                : "Catálogo de productos y servicios"}
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} className="mr-1.5" /> Nuevo Producto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-9 h-9"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {allCategories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package size={40} className="text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">Sin productos aún</p>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                  {debouncedSearch || categoryFilter !== "todos"
                    ? "No se encontraron resultados"
                    : "Agrega tu primer producto para comenzar"}
                </p>
                {!debouncedSearch && categoryFilter === "todos" && (
                  <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus size={14} className="mr-1.5" /> Nuevo Producto
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Nombre</th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Categoría</th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">SKU</th>
                      <th className="text-right py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Precio</th>
                      <th className="text-right py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Costo</th>
                      <th className="text-right py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide hidden xl:table-cell">Margen</th>
                      <th className="text-center py-3 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Estado</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const m = margin(product.price, product.cost);
                      return (
                        <tr key={product.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0">
                                <Package size={14} />
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 hidden md:table-cell">
                            {product.category ? (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{product.category}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 hidden lg:table-cell">
                            <span className="text-xs font-mono text-muted-foreground">{product.sku ?? "—"}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold">
                            ${Number(product.price).toLocaleString("es", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right text-muted-foreground hidden lg:table-cell">
                            {product.cost != null
                              ? `$${Number(product.cost).toLocaleString("es", { minimumFractionDigits: 2 })}`
                              : "—"}
                          </td>
                          <td className="py-3 px-3 text-right hidden xl:table-cell">
                            {m != null ? (
                              <span className={`text-xs font-semibold ${Number(m) >= 50 ? "text-emerald-500" : Number(m) >= 25 ? "text-amber-500" : "text-red-500"}`}>
                                {m}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => toggleMut.mutate({ id: product.id, isActive: !product.isActive })}
                              className="flex items-center justify-center mx-auto"
                              title={product.isActive ? "Desactivar" : "Activar"}
                            >
                              {product.isActive ? (
                                <ToggleRight size={22} className="text-emerald-500" />
                              ) : (
                                <ToggleLeft size={22} className="text-muted-foreground" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditTarget(product)}>
                                  <Edit size={13} className="mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(product.id, product.name)}
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
          </CardContent>
        </Card>

      </div>

      {/* Dialogs */}
      <ProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />
      {editTarget && (
        <ProductDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => refetch()}
          initial={{
            id: editTarget.id,
            name: editTarget.name,
            description: editTarget.description ?? "",
            category: editTarget.category ?? "",
            price: editTarget.price?.toString() ?? "",
            cost: editTarget.cost?.toString() ?? "",
            sku: editTarget.sku ?? "",
          }}
        />
      )}
    </CRMLayout>
  );
}
