import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { calculateLeadScore, getHotLeads, getScoringStats, getScoreCategory, getScoreColor } from "../_core/leadScoring";
import * as db from "../db";

export const leadScoringRouter = router({
  getScore: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const lead = await db.getLeadById(ctx.user.organizationId, input.leadId);
      if (!lead) throw new Error("Lead no encontrado");
      
      const score = calculateLeadScore(lead);
      return {
        leadId: lead.id,
        score,
        category: getScoreCategory(score),
        color: getScoreColor(score),
      };
    }),

  getHotLeads: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const leads = await getHotLeads(ctx.user.organizationId, input.limit);
      return leads.map(lead => ({
        ...lead,
        score: calculateLeadScore(lead),
        category: getScoreCategory(calculateLeadScore(lead)),
      }));
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      return getScoringStats(ctx.user.organizationId);
    }),

  recalculateAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      const leads = await db.getLeadsList(ctx.user.organizationId, { limit: 1000 });
      let updated = 0;

      for (const lead of leads.data) {
        const newScore = calculateLeadScore(lead);
        if (newScore !== lead.score) {
          await db.updateLead(ctx.user.organizationId, lead.id, { score: newScore });
          updated++;
        }
      }

      return { updated, total: leads.data.length };
    }),
});
