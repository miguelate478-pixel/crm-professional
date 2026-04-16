import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckSquare, Phone, Video, Users, Building2, Target,
  Filter, Inbox, Clock,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type Category =
  | "tareas"
  | "reuniones"
  | "llamadas"
  | "leads"
  | "contactos"
  | "oportunidades";

const priorityConfig: Record<string, { label: string; className: string }> = {
  alta:  { label: "Alta",  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  media: { label: "Media", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  baja:  { label: "Baja",  className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  en_progreso: { label: "En progreso", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completada:  { label: "Completada",  className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  nuevo:       { label: "Nuevo",       className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  contactado:  { label: "Contactado",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  calificado:  { label: "Calificado",  className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  descartado:  { label: "Descartado",  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Left Panel Item ────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left",
        active
          ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800/50"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
            active
              ? "bg-blue-600 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main Table ─────────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox size={40} className="text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">No hay {label} pendientes</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkQueuePage() {
  const [selected, setSelected] = useState<Category>("tareas");

  // Data queries
  const { data: tasksData } = trpc.tasks.list.useQuery({ status: "pendiente", limit: 100 });
  const { data: meetingsData } = trpc.activities.list.useQuery({ type: "reunion", limit: 100 });
  const { data: callsData } = trpc.activities.list.useQuery({ type: "llamada", limit: 100 });
  const { data: leadsData } = trpc.leads.myLeads.useQuery();
  const { data: contactsData } = trpc.contacts.list.useQuery({ limit: 100 });
  const { data: oppsData } = trpc.opportunities.list.useQuery({ limit: 100 });

  const taskCount = tasksData?.total ?? 0;
  const meetingCount = meetingsData?.length ?? 0;
  const callCount = callsData?.length ?? 0;
  const leadCount = leadsData?.total ?? 0;
  const contactCount = contactsData?.total ?? 0;
  const oppCount = oppsData?.total ?? 0;

  return (
    <CRMLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cola de Trabajo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Todas tus actividades y elementos pendientes
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter size={14} />
          Filtrar
        </Button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* ── Left Panel ── */}
        <div className="w-56 flex-shrink-0 space-y-4">
          {/* Mi Actividad Abierta */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">
              Mi Actividad Abierta
            </p>
            <div className="space-y-0.5">
              <NavItem
                icon={CheckSquare}
                label="Tareas"
                count={taskCount}
                active={selected === "tareas"}
                onClick={() => setSelected("tareas")}
              />
              <NavItem
                icon={Video}
                label="Reuniones"
                count={meetingCount}
                active={selected === "reuniones"}
                onClick={() => setSelected("reuniones")}
              />
              <NavItem
                icon={Phone}
                label="Llamadas"
                count={callCount}
                active={selected === "llamadas"}
                onClick={() => setSelected("llamadas")}
              />
            </div>
          </div>

          {/* Mi Cola de Trabajo */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">
              Mi Cola de Trabajo
            </p>
            <div className="space-y-0.5">
              <NavItem
                icon={Users}
                label="Posibles clientes"
                count={leadCount}
                active={selected === "leads"}
                onClick={() => setSelected("leads")}
              />
              <NavItem
                icon={Building2}
                label="Contactos"
                count={contactCount}
                active={selected === "contactos"}
                onClick={() => setSelected("contactos")}
              />
              <NavItem
                icon={Target}
                label="Oportunidades"
                count={oppCount}
                active={selected === "oportunidades"}
                onClick={() => setSelected("oportunidades")}
              />
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <Card className="flex-1 overflow-hidden border-border/50 flex flex-col">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-sm">
              {selected === "tareas" && "Tareas Pendientes"}
              {selected === "reuniones" && "Reuniones"}
              {selected === "llamadas" && "Llamadas"}
              {selected === "leads" && "Posibles Clientes"}
              {selected === "contactos" && "Contactos"}
              {selected === "oportunidades" && "Oportunidades"}
            </h2>
          </div>

          <div className="flex-1 overflow-auto">
            {/* ── Tasks Table ── */}
            {selected === "tareas" && (
              <>
                {!tasksData?.data?.length ? (
                  <EmptyState label="tareas" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Asunto</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Fecha de vencimiento</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Estado</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Prioridad</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Relacionado con</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasksData.data.map((task) => {
                        const overdue = isOverdue(task.dueDate);
                        const status = statusConfig[task.status ?? "pendiente"];
                        const priority = priorityConfig[task.priority ?? "media"];
                        return (
                          <tr key={task.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{task.title}</td>
                            <td className="px-4 py-3">
                              {task.dueDate ? (
                                <span className={cn("flex items-center gap-1.5 text-xs", overdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                                  {overdue && <Clock size={12} />}
                                  {task.dueDate}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs font-medium border-0", status?.className)}>
                                {status?.label ?? task.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs font-medium border-0", priority?.className)}>
                                {priority?.label ?? task.priority}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {task.leadId ? `Lead #${task.leadId}` : task.opportunityId ? `Oportunidad #${task.opportunityId}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── Meetings / Calls Table ── */}
            {(selected === "reuniones" || selected === "llamadas") && (
              <>
                {(() => {
                  const items = selected === "reuniones" ? meetingsData : callsData;
                  if (!items?.length) return <EmptyState label={selected === "reuniones" ? "reuniones" : "llamadas"} />;
                  return (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Asunto</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Fecha</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Descripción</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Relacionado con</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{item.title}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {item.startTime ? new Date(item.startTime).toLocaleDateString("es-ES") : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                              {item.description ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {item.leadId ? `Lead #${item.leadId}` : item.opportunityId ? `Oportunidad #${item.opportunityId}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </>
            )}

            {/* ── Leads Table ── */}
            {selected === "leads" && (
              <>
                {!leadsData?.data?.length ? (
                  <EmptyState label="leads asignados" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Nombre</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Empresa</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Estado</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsData.data.map((lead) => {
                        const status = statusConfig[lead.status ?? "nuevo"];
                        return (
                          <tr key={lead.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{lead.company ?? "—"}</td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs font-medium border-0", status?.className)}>
                                {status?.label ?? lead.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{lead.email ?? "—"}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{lead.phone ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── Contacts Table ── */}
            {selected === "contactos" && (
              <>
                {!contactsData?.data?.length ? (
                  <EmptyState label="contactos" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Nombre</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Cargo</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Teléfono</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Ciudad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactsData.data.map((contact) => (
                        <tr key={contact.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{contact.firstName} {contact.lastName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{contact.jobTitle ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{contact.email ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{contact.phone ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{contact.city ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── Opportunities Table ── */}
            {selected === "oportunidades" && (
              <>
                {!oppsData?.data?.length ? (
                  <EmptyState label="oportunidades" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Nombre</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Monto</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Probabilidad</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Cierre esperado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oppsData.data.map((opp) => {
                        const overdue = isOverdue(opp.expectedCloseDate);
                        return (
                          <tr key={opp.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{opp.name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {opp.amount != null ? `$${Number(opp.amount).toLocaleString()}` : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {opp.probability != null ? `${opp.probability}%` : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {opp.expectedCloseDate ? (
                                <span className={cn("text-xs", overdue ? "text-red-500 font-medium flex items-center gap-1" : "text-muted-foreground")}>
                                  {overdue && <Clock size={12} />}
                                  {opp.expectedCloseDate}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </CRMLayout>
  );
}
