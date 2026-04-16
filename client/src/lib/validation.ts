/**
 * Form validation helpers
 */

export function validateEmail(email: string): string | null {
  if (!email) return null; // optional field
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : "Email inválido";
}

export function validateRequired(value: string, label = "Este campo"): string | null {
  return value.trim() ? null : `${label} es requerido`;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return cleaned.length >= 7 ? null : "Teléfono inválido (mínimo 7 dígitos)";
}

export function validatePositiveNumber(value: string, label = "El valor"): string | null {
  if (!value) return null;
  const n = Number(value);
  if (isNaN(n)) return `${label} debe ser un número`;
  if (n < 0) return `${label} no puede ser negativo`;
  return null;
}

export function validatePercentage(value: string, label = "El porcentaje"): string | null {
  if (!value) return null;
  const n = Number(value);
  if (isNaN(n)) return `${label} debe ser un número`;
  if (n < 0 || n > 100) return `${label} debe estar entre 0 y 100`;
  return null;
}

export function validateDateRange(start: string, end: string): string | null {
  if (!start || !end) return null;
  return new Date(start) <= new Date(end) ? null : "La fecha de inicio debe ser anterior a la fecha de fin";
}

export function validateUrl(url: string): string | null {
  if (!url) return null;
  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return null;
  } catch {
    return "URL inválida";
  }
}

// ── Field error display component helper ──────────────────────────────────────

export type FormErrors = Record<string, string | null>;

export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(e => e !== null);
}
