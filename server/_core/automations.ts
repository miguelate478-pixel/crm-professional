import * as db from "../db";

/**
 * Sistema de Automatizaciones Avanzadas
 * Workflows visuales sin código
 */

export type TriggerType = "lead_created" | "lead_status_changed" | "opportunity_created" | "opportunity_stage_changed" | "inactivity" | "date_reached";
export type ActionType = "create_task" | "send_email" | "change_status" | "change_stage" | "assign_to" | "add_note" | "create_opportunity";

export interface AutomationTrigger {
  type: TriggerType;
  conditions?: Record<string, any>;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, any>;
}

export interface Automation {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ejecuta una automatización
 */
export async function executeAutomation(
  automation: Automation,
  context: {
    leadId?: number;
    opportunityId?: number;
    organizationId: number;
    userId: number;
  }
): Promise<void> {
  if (!automation.isActive) return;

  for (const action of automation.actions) {
    await executeAction(action, context);
  }
}

/**
 * Ejecuta una acción individual
 */
async function executeAction(
  action: AutomationAction,
  context: {
    leadId?: number;
    opportunityId?: number;
    organizationId: number;
    userId: number;
  }
): Promise<void> {
  switch (action.type) {
    case "create_task":
      if (context.leadId) {
        await db.createTask(context.organizationId, context.userId, {
          title: action.config.title,
          description: action.config.description,
          priority: action.config.priority || "media",
          dueDate: action.config.dueDate,
          leadId: context.leadId,
          assignedTo: action.config.assignedTo || context.userId,
          createdBy: context.userId,
        });
      }
      break;

    case "send_email":
      // Implementar envío de email
      console.log("Email action:", action.config);
      break;

    case "change_status":
      if (context.leadId) {
        await db.updateLead(context.organizationId, context.leadId, {
          status: action.config.status,
        });
      }
      break;

    case "change_stage":
      if (context.opportunityId) {
        await db.updateOpportunity(context.organizationId, context.opportunityId, {
          stageId: action.config.stageId,
        });
      }
      break;

    case "assign_to":
      if (context.leadId) {
        await db.updateLead(context.organizationId, context.leadId, {
          assignedTo: action.config.userId,
        });
      }
      break;

    case "add_note":
      if (context.leadId) {
        await db.updateLead(context.organizationId, context.leadId, {
          notes: action.config.note,
        });
      }
      break;

    case "create_opportunity":
      if (context.leadId) {
        await db.createOpportunity(context.organizationId, context.userId, {
          name: action.config.name,
          description: action.config.description,
          amount: action.config.amount,
          probability: action.config.probability || 30,
          pipelineId: action.config.pipelineId,
          stageId: action.config.stageId,
          leadId: context.leadId,
        });
      }
      break;
  }
}

/**
 * Obtiene automatizaciones por trigger
 */
export async function getAutomationsByTrigger(
  organizationId: number,
  triggerType: TriggerType
): Promise<any[]> {
  const automations = await db.getAutomations(organizationId);
  return automations.filter((a: any) => a.trigger.type === triggerType && a.isActive);
}

/**
 * Plantillas de automatización predefinidas
 */
export const AUTOMATION_TEMPLATES = {
  "lead_follow_up": {
    name: "Seguimiento automático de leads",
    description: "Crea una tarea de seguimiento cuando se crea un nuevo lead",
    trigger: { type: "lead_created" as TriggerType },
    actions: [
      {
        type: "create_task" as ActionType,
        config: {
          title: "Seguimiento inicial",
          description: "Contactar al lead dentro de 24 horas",
          priority: "alta",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ],
  },
  "opportunity_from_qualified_lead": {
    name: "Crear oportunidad de lead calificado",
    description: "Crea una oportunidad cuando un lead cambia a estado 'Calificado'",
    trigger: {
      type: "lead_status_changed" as TriggerType,
      conditions: { newStatus: "contactado" },
    },
    actions: [
      {
        type: "create_opportunity" as ActionType,
        config: {
          name: "Oportunidad de {leadName}",
          probability: 30,
          pipelineId: 1,
          stageId: 1,
        },
      },
    ],
  },
  "stale_opportunity_alert": {
    name: "Alerta de oportunidad estancada",
    description: "Crea una tarea cuando una oportunidad no se actualiza por 10 días",
    trigger: {
      type: "inactivity" as TriggerType,
      conditions: { days: 10, entityType: "opportunity" },
    },
    actions: [
      {
        type: "create_task" as ActionType,
        config: {
          title: "Seguimiento de oportunidad estancada",
          description: "Esta oportunidad no ha sido actualizada en 10 días",
          priority: "media",
        },
      },
    ],
  },
};
