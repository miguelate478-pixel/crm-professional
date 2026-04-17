import * as db from "../db";

/**
 * Sistema de Deduplicación de Leads
 * Detecta y fusiona leads duplicados
 */

export interface DuplicateMatch {
  lead1Id: number;
  lead2Id: number;
  similarity: number;
  reason: string;
}

/**
 * Calcula similitud entre dos strings (0-100)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = getEditDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

/**
 * Calcula distancia de edición (Levenshtein)
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  
  return costs[s2.length];
}

/**
 * Detecta duplicados potenciales
 */
export async function findDuplicates(organizationId: number, threshold: number = 85): Promise<DuplicateMatch[]> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  const duplicates: DuplicateMatch[] = [];

  for (let i = 0; i < leads.data.length; i++) {
    for (let j = i + 1; j < leads.data.length; j++) {
      const lead1 = leads.data[i];
      const lead2 = leads.data[j];

      // Comparar email exacto
      if (lead1.email && lead2.email && lead1.email === lead2.email) {
        duplicates.push({
          lead1Id: lead1.id,
          lead2Id: lead2.id,
          similarity: 100,
          reason: "Email idéntico",
        });
        continue;
      }

      // Comparar teléfono exacto
      if (lead1.phone && lead2.phone && lead1.phone === lead2.phone) {
        duplicates.push({
          lead1Id: lead1.id,
          lead2Id: lead2.id,
          similarity: 100,
          reason: "Teléfono idéntico",
        });
        continue;
      }

      // Comparar nombre + empresa
      const fullName1 = `${lead1.firstName} ${lead1.lastName}`.toLowerCase().trim();
      const fullName2 = `${lead2.firstName} ${lead2.lastName}`.toLowerCase().trim();
      
      const nameSimilarity = stringSimilarity(fullName1, fullName2);
      const companySimilarity = stringSimilarity(lead1.company || "", lead2.company || "");

      if (nameSimilarity >= threshold && companySimilarity >= 80) {
        duplicates.push({
          lead1Id: lead1.id,
          lead2Id: lead2.id,
          similarity: Math.round((nameSimilarity + companySimilarity) / 2),
          reason: `Nombre similar (${Math.round(nameSimilarity)}%) + Empresa similar (${Math.round(companySimilarity)}%)`,
        });
      }
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Fusiona dos leads
 */
export async function mergeDuplicates(
  organizationId: number,
  primaryLeadId: number,
  secondaryLeadId: number
): Promise<any> {
  const primary = await db.getLeadById(organizationId, primaryLeadId);
  const secondary = await db.getLeadById(organizationId, secondaryLeadId);

  if (!primary || !secondary) {
    throw new Error("Lead no encontrado");
  }

  // Combinar datos (preferir datos más completos)
  const merged = {
    firstName: primary.firstName || secondary.firstName,
    lastName: primary.lastName || secondary.lastName,
    email: primary.email || secondary.email,
    phone: primary.phone || secondary.phone,
    company: primary.company || secondary.company,
    jobTitle: primary.jobTitle || secondary.jobTitle,
    source: primary.source || secondary.source,
    notes: `${primary.notes || ""}\n---\nMerged from: ${secondary.firstName} ${secondary.lastName}\n${secondary.notes || ""}`.trim(),
  };

  // Actualizar lead primario
  await db.updateLead(organizationId, primaryLeadId, merged);

  // Eliminar lead secundario
  await db.deleteLead(organizationId, secondaryLeadId);

  return merged;
}

/**
 * Obtiene estadísticas de duplicados
 */
export async function getDuplicationStats(organizationId: number): Promise<{
  totalLeads: number;
  potentialDuplicates: number;
  duplicateGroups: number;
}> {
  const leads = await db.getLeadsList(organizationId, { limit: 1000 });
  const duplicates = await findDuplicates(organizationId, 85);

  // Agrupar duplicados
  const groups = new Map<number, Set<number>>();
  
  for (const dup of duplicates) {
    if (!groups.has(dup.lead1Id)) {
      groups.set(dup.lead1Id, new Set([dup.lead1Id]));
    }
    if (!groups.has(dup.lead2Id)) {
      groups.set(dup.lead2Id, new Set([dup.lead2Id]));
    }
    
    groups.get(dup.lead1Id)!.add(dup.lead2Id);
    groups.get(dup.lead2Id)!.add(dup.lead1Id);
  }

  return {
    totalLeads: leads.data.length,
    potentialDuplicates: duplicates.length,
    duplicateGroups: groups.size,
  };
}
