import * as db from "../db";

/**
 * Sistema de Scoring Inteligente de Leads
 * Calcula puntuación automática basada en:
 * - Fuente del lead
 * - Actividad reciente
 * - Interacciones
 * - Datos completados
 * - Probabilidad de conversión
 */

export interface ScoringRule {
  name: string;
  weight: number;
  calculate: (lead: any) => number;
}

const SCORING_RULES: ScoringRule[] = [
  {
    name: "Completitud de datos",
    weight: 20,
    calculate: (lead) => {
      let score = 0;
      if (lead.firstName) score += 5;
      if (lead.lastName) score += 5;
      if (lead.email) score += 5;
      if (lead.phone) score += 5;
      return score;
    },
  },
  {
    name: "Fuente del lead",
    weight: 15,
    calculate: (lead) => {
      const sourceScores: Record<string, number> = {
        "referencia": 15,
        "website": 12,
        "evento": 10,
        "linkedin": 10,
        "email": 8,
        "llamada": 5,
        "otro": 3,
      };
      return sourceScores[lead.source?.toLowerCase()] || 3;
    },
  },
  {
    name: "Estado del lead",
    weight: 25,
    calculate: (lead) => {
      const statusScores: Record<string, number> = {
        "venta": 100,
        "conf_visita": 80,
        "agendo_visita": 70,
        "contactado": 60,
        "recontacto": 50,
        "propuesta": 75,
        "negociacion": 85,
        "nuevo": 20,
        "no_efectivo": 5,
        "reciclado": 15,
        "visita_no_asistida": 10,
        "separacion": 5,
        "no_se_presento": 5,
        "reprog_visita": 40,
      };
      return statusScores[lead.status?.toLowerCase()] || 10;
    },
  },
  {
    name: "Recencia de actividad",
    weight: 20,
    calculate: (lead) => {
      if (!lead.updatedAt) return 0;
      const daysSinceUpdate = (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 1) return 20;
      if (daysSinceUpdate < 7) return 15;
      if (daysSinceUpdate < 30) return 10;
      if (daysSinceUpdate < 90) return 5;
      return 0;
    },
  },
  {
    name: "Empresa y contexto",
    weight: 20,
    calculate: (lead) => {
      let score = 0;
      if (lead.company) score += 10;
      if (lead.jobTitle) score += 10;
      return score;
    },
  },
];

/**
 * Calcula el score de un lead
 */
export function calculateLeadScore(lead: any): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const rule of SCORING_RULES) {
    const ruleScore = rule.calculate(lead);
    totalScore += ruleScore * rule.weight;
    totalWeight += rule.weight;
  }

  return Math.round((totalScore / totalWeight) * 100) / 100;
}

/**
 * Obtiene la categoría de score
 */
export function getScoreCategory(score: number): "hot" | "warm" | "cold" {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

/**
 * Obtiene el color para el score
 */
export function getScoreColor(score: number): string {
  const category = getScoreCategory(score);
  if (category === "hot") return "bg-red-500 dark:bg-red-600";
  if (category === "warm") return "bg-amber-500 dark:bg-amber-600";
  return "bg-blue-500 dark:bg-blue-600";
}

/**
 * Actualiza el score de todos los leads de una organización
 */
export async function updateAllLeadScores(organizationId: number): Promise<void> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  
  for (const lead of leads.data) {
    const newScore = calculateLeadScore(lead);
    if (newScore !== lead.score) {
      await db.updateLead(organizationId, lead.id, { score: newScore });
    }
  }
}

/**
 * Obtiene los leads más prometedores (hot leads)
 */
export async function getHotLeads(organizationId: number, limit: number = 10): Promise<any[]> {
  const leads = await db.getLeadsList(organizationId, { limit: 100 });
  
  const scoredLeads = leads.data.map((lead: any) => ({
    ...lead,
    calculatedScore: calculateLeadScore(lead),
  }));

  return scoredLeads
    .filter((lead: any) => getScoreCategory(lead.calculatedScore) === "hot")
    .sort((a: any, b: any) => b.calculatedScore - a.calculatedScore)
    .slice(0, limit);
}

/**
 * Obtiene estadísticas de scoring
 */
export async function getScoringStats(organizationId: number): Promise<{
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
}> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  
  const stats = {
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    averageScore: 0,
  };

  let totalScore = 0;

  for (const lead of leads.data) {
    const score = calculateLeadScore(lead);
    totalScore += score;
    
    const category = getScoreCategory(score);
    if (category === "hot") stats.hotLeads++;
    else if (category === "warm") stats.warmLeads++;
    else stats.coldLeads++;
  }

  stats.averageScore = leads.data.length > 0 ? Math.round((totalScore / leads.data.length) * 100) / 100 : 0;

  return stats;
}
