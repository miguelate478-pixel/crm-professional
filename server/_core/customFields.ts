/**
 * Sistema de Campos Personalizados
 * Permite crear campos dinámicos por organización
 */

export type FieldType = "text" | "number" | "email" | "phone" | "date" | "select" | "checkbox" | "textarea";
export type EntityType = "lead" | "contact" | "opportunity" | "company";

export interface CustomField {
  id: number;
  organizationId: number;
  entityType: EntityType;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // Para select
  defaultValue?: any;
  visibleTo?: string[]; // Roles que pueden ver
  editableBy?: string[]; // Roles que pueden editar
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValue {
  id: number;
  fieldId: number;
  entityId: number;
  value: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Valida un valor contra un campo personalizado
 */
export function validateCustomFieldValue(field: CustomField, value: any): { valid: boolean; error?: string } {
  if (field.required && (value === null || value === undefined || value === "")) {
    return { valid: false, error: `${field.label} es requerido` };
  }

  if (value === null || value === undefined || value === "") {
    return { valid: true };
  }

  switch (field.type) {
    case "text":
    case "textarea":
      if (typeof value !== "string") {
        return { valid: false, error: `${field.label} debe ser texto` };
      }
      break;

    case "number":
      if (typeof value !== "number" && isNaN(Number(value))) {
        return { valid: false, error: `${field.label} debe ser un número` };
      }
      break;

    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return { valid: false, error: `${field.label} debe ser un email válido` };
      }
      break;

    case "phone":
      if (!/^\+?[\d\s\-()]+$/.test(String(value))) {
        return { valid: false, error: `${field.label} debe ser un teléfono válido` };
      }
      break;

    case "date":
      if (isNaN(new Date(String(value)).getTime())) {
        return { valid: false, error: `${field.label} debe ser una fecha válida` };
      }
      break;

    case "select":
      if (field.options && !field.options.includes(String(value))) {
        return { valid: false, error: `${field.label} tiene un valor inválido` };
      }
      break;

    case "checkbox":
      if (typeof value !== "boolean") {
        return { valid: false, error: `${field.label} debe ser verdadero o falso` };
      }
      break;
  }

  return { valid: true };
}

/**
 * Obtiene campos personalizados para una entidad
 */
export function getFieldsForEntity(fields: CustomField[], entityType: EntityType): CustomField[] {
  return fields
    .filter(f => f.entityType === entityType)
    .sort((a, b) => a.order - b.order);
}

/**
 * Obtiene campos visibles para un rol
 */
export function getVisibleFields(fields: CustomField[], role: string): CustomField[] {
  return fields.filter(f => !f.visibleTo || f.visibleTo.includes(role));
}

/**
 * Obtiene campos editables para un rol
 */
export function getEditableFields(fields: CustomField[], role: string): CustomField[] {
  return fields.filter(f => !f.editableBy || f.editableBy.includes(role));
}

/**
 * Plantillas de campos personalizados por industria
 */
export const FIELD_TEMPLATES = {
  "real_estate": [
    {
      name: "property_type",
      label: "Tipo de Propiedad",
      type: "select" as FieldType,
      entityType: "opportunity" as EntityType,
      options: ["Casa", "Apartamento", "Terreno", "Comercial"],
      required: true,
      order: 1,
    },
    {
      name: "property_size",
      label: "Tamaño (m²)",
      type: "number" as FieldType,
      entityType: "opportunity" as EntityType,
      required: false,
      order: 2,
    },
    {
      name: "location",
      label: "Ubicación",
      type: "text" as FieldType,
      entityType: "opportunity" as EntityType,
      required: true,
      order: 3,
    },
  ],
  "saas": [
    {
      name: "company_size",
      label: "Tamaño de Empresa",
      type: "select" as FieldType,
      entityType: "company" as EntityType,
      options: ["1-10", "11-50", "51-200", "201-500", "500+"],
      required: false,
      order: 1,
    },
    {
      name: "industry",
      label: "Industria",
      type: "select" as FieldType,
      entityType: "company" as EntityType,
      options: ["Tech", "Finance", "Healthcare", "Retail", "Manufacturing", "Other"],
      required: false,
      order: 2,
    },
    {
      name: "budget",
      label: "Presupuesto Anual",
      type: "number" as FieldType,
      entityType: "opportunity" as EntityType,
      required: false,
      order: 3,
    },
  ],
  "services": [
    {
      name: "service_type",
      label: "Tipo de Servicio",
      type: "select" as FieldType,
      entityType: "opportunity" as EntityType,
      options: ["Consultoría", "Implementación", "Soporte", "Capacitación"],
      required: true,
      order: 1,
    },
    {
      name: "duration_months",
      label: "Duración (meses)",
      type: "number" as FieldType,
      entityType: "opportunity" as EntityType,
      required: false,
      order: 2,
    },
  ],
};
