import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Plus, RefreshCw, Clock, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  completed:  { label: "Completada",  color: "bg-green-100 text-green-700",  icon: CheckCircle },
  no_answer:  { label: "Sin respuesta", color: "bg-gray-100 text-gray-600",  icon: PhoneMissed },
  busy:       { label: "Ocupado",     color: "bg-orange-100 text-orange-700", icon: PhoneMissed },
  failed:     { label: "Fallida",     color: "bg-red-100 text-red-700",      icon: XCircle },
  scheduled:  { label: "Programada", color: "bg-blue-100 text-blue-700",    icon: Clock },
};

const OUTCOME_LABELS: Record<string, string> = {
  interested:     "Interesado",
  not_interested: "No interesado",
  callback:       "Llamar de nuevo",
  no_answer:      "Sin respuesta",
  left_voicemail: "Dejó mensaje",
  other:          "Otro",
};

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    phone: "", direction: "outbound" as "inbound" | "outbound",
    status: "completed" as any, duration: "", notes: "", outcome: "" as any,
    calledAt: new Date().toISOString().slice(0, 16),
  });

  const callsQuery = trpc.calls.list.useQuery({ limit: 100 });
  const statsQuery = trpc.calls.getStats.useQuery();
  const createMutation = trpc.calls.create.useMutation({
    onSuccess: () => {
      toast.success("Llamada registrada");
      callsQuery.refetch();
      statsQuery.refetch();
      setCreateOpen(false);
      setForm({ phone: "", direction: "outbound", status: "completed", duration: "", notes: "", outcome: "" as any, calledAt: new Date().toISOString().slice(0, 16) });
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.calls.delete.useMutation({
    onSuccess: () => { toast.success("Llamada eliminada"); callsQuery.refetch(); statsQuery.refetch(); },
  });

  const calls = callsQuery.data?.data || [];
  const stats = statsQuery.data;

  const handleCreate = () => {
    createMutation.mutate({
      phone: form.phone || undefined,
      direction: form.direction,
      status: form.status,
      duration: form.duration ? parseInt(form.duration) * 60 : 0,
      notes: form.notes || undefined,
      outcome: form.outcome || undefined,
      calledAt: form.calledAt ? new Date(form.calledAt).toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Llamadas</h1>
          <p className="text-muted-foreground text-sm mt-1">Historial y registro de llamadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => callsQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Registrar Llamada
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold mt-1">{stats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">llamadas</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hoy</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{stats?.today ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">realizadas</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completadas</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats?.completed ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">exitosas</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duración Prom.</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">{formatDuration(stats?.avgDuration ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">por llamada</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dirección</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Resultado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Duración</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Notas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Phone className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No hay llamadas registradas</p>
                      <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />Registrar primera llamada
                      </Button>
                    </td>
                  </tr>
                ) : calls.map((call) => {
                  const statusCfg = STATUS_CONFIG[call.status] ?? STATUS_CONFIG.completed;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={call.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {call.direction === "inbound" ? (
                            <PhoneIncoming className="w-4 h-4 text-green-500" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-xs text-muted-foreground capitalize">
                            {call.direction === "inbound" ? "Entrante" : "Saliente"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{call.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusCfg.color} hover:${statusCfg.color} border-0 gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {call.outcome ? OUTCOME_LABELS[call.outcome] : "—"}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="font-mono text-sm">{formatDuration(call.duration ?? 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate hidden lg:table-cell">
                        {call.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {call.calledAt ? new Date(call.calledAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0"
                          onClick={() => { if (confirm("¿Eliminar llamada?")) deleteMutation.mutate({ id: call.id }); }}>
                          <XCircle className="w-3 h-3" />
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              Registrar Llamada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">📞 Saliente</SelectItem>
                    <SelectItem value="inbound">📲 Entrante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">✅ Completada</SelectItem>
                    <SelectItem value="no_answer">📵 Sin respuesta</SelectItem>
                    <SelectItem value="busy">🔴 Ocupado</SelectItem>
                    <SelectItem value="failed">❌ Fallida</SelectItem>
                    <SelectItem value="scheduled">📅 Programada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="+57 300 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duración (minutos)</Label>
                <Input type="number" min="0" placeholder="0" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Resultado</Label>
                <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">😊 Interesado</SelectItem>
                    <SelectItem value="not_interested">😐 No interesado</SelectItem>
                    <SelectItem value="callback">🔄 Llamar de nuevo</SelectItem>
                    <SelectItem value="no_answer">📵 Sin respuesta</SelectItem>
                    <SelectItem value="left_voicemail">📬 Dejó mensaje</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha y hora</Label>
              <Input type="datetime-local" value={form.calledAt} onChange={e => setForm(f => ({ ...f, calledAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea placeholder="Resumen de la llamada..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {createMutation.isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
