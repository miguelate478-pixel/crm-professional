import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Video, Phone, Loader2, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type ActivityType = "reunion" | "llamada";

interface NewActivityForm {
  title: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  leadId: string;
  contactId: string;
  opportunityId: string;
}

const defaultForm: NewActivityForm = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  time: "09:00",
  duration: "30",
  description: "",
  leadId: "",
  contactId: "",
  opportunityId: "",
};

// ── New Activity Dialog ────────────────────────────────────────────────────────

function NewActivityDialog({
  open,
  onClose,
  type,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  type: ActivityType;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<NewActivityForm>(defaultForm);
  const [loading, setLoading] = useState(false);

  const createMutation = trpc.activities.create.useMutation();

  const set = (field: keyof NewActivityForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("El título es requerido");
      return;
    }
    if (!form.date) {
      toast.error("La fecha es requerida");
      return;
    }

    setLoading(true);
    try {
      const startTime = `${form.date}T${form.time}:00`;
      const durationMs = parseInt(form.duration || "30") * 60 * 1000;
      const endTime = new Date(new Date(startTime).getTime() + durationMs).toISOString();

      await createMutation.mutateAsync({
        type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startTime,
        endTime,
        leadId: form.leadId ? parseInt(form.leadId) : undefined,
        contactId: form.contactId ? parseInt(form.contactId) : undefined,
        opportunityId: form.opportunityId ? parseInt(form.opportunityId) : undefined,
      });

      toast.success(type === "reunion" ? "Reunión creada" : "Llamada registrada");
      setForm(defaultForm);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al crear");
    } finally {
      setLoading(false);
    }
  };

  const title = type === "reunion" ? "Nueva Reunión" : "Nueva Llamada";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "reunion" ? <Video size={18} /> : <Phone size={18} />}
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              placeholder={type === "reunion" ? "Reunión de seguimiento" : "Llamada de prospección"}
              value={form.title}
              onChange={set("title")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Hora</Label>
              <Input type="time" value={form.time} onChange={set("time")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Duración (minutos)</Label>
            <Input
              type="number"
              min="1"
              placeholder="30"
              value={form.duration}
              onChange={set("duration")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Notas o agenda..."
              value={form.description}
              onChange={set("description")}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Relacionar con (opcional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Lead ID"
                type="number"
                value={form.leadId}
                onChange={set("leadId")}
              />
              <Input
                placeholder="Contacto ID"
                type="number"
                value={form.contactId}
                onChange={set("contactId")}
              />
              <Input
                placeholder="Oport. ID"
                type="number"
                value={form.opportunityId}
                onChange={set("opportunityId")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Activity Row ───────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: any }) {
  const start = item.startTime ? new Date(item.startTime) : null;
  const end = item.endTime ? new Date(item.endTime) : null;

  let duration = "—";
  if (start && end) {
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }

  const related = item.leadId
    ? `Lead #${item.leadId}`
    : item.opportunityId
    ? `Oportunidad #${item.opportunityId}`
    : item.contactId
    ? `Contacto #${item.contactId}`
    : "—";

  return (
    <tr className="border-b border-border/30 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium text-sm">{item.title}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {start ? (
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {start.toLocaleDateString("es-ES")} {start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          {duration}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
      <td className="px-4 py-3">
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs border-0">
          Programado
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{related}</td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const [tab, setTab] = useState<ActivityType>("reunion");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: meetings, refetch: refetchMeetings } = trpc.activities.list.useQuery({
    type: "reunion",
    limit: 50,
  });

  const { data: calls, refetch: refetchCalls } = trpc.activities.list.useQuery({
    type: "llamada",
    limit: 50,
  });

  const handleCreated = () => {
    refetchMeetings();
    refetchCalls();
  };

  const items = tab === "reunion" ? meetings : calls;

  return (
    <CRMLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reuniones y Llamadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tus reuniones y llamadas programadas
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus size={16} />
          {tab === "reunion" ? "Nueva Reunión" : "Nueva Llamada"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("reunion")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            tab === "reunion"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Video size={15} />
          Reuniones
          {meetings?.length ? (
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              {meetings.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setTab("llamada")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            tab === "llamada"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Phone size={15} />
          Llamadas
          {calls?.length ? (
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              {calls.length}
            </span>
          ) : null}
        </button>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {!items?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {tab === "reunion" ? (
                <Video size={40} className="text-muted-foreground/30 mb-3" />
              ) : (
                <Phone size={40} className="text-muted-foreground/30 mb-3" />
              )}
              <p className="text-sm text-muted-foreground">
                No hay {tab === "reunion" ? "reuniones" : "llamadas"} registradas
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus size={14} />
                {tab === "reunion" ? "Crear primera reunión" : "Registrar primera llamada"}
              </Button>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Título</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Fecha / Hora</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Duración</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Participantes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Relacionado con</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewActivityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={tab}
        onCreated={handleCreated}
      />
    </CRMLayout>
  );
}
