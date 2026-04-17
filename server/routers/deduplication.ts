import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { findDuplicates, mergeDuplicates, getDuplicationStats } from "../_core/leadDeduplication";

export const deduplicationRouter = router({
  findDuplicates: protectedProcedure
    .input(z.object({ threshold: z.number().default(85) }))
    .query(async ({ ctx, input }) => {
      return findDuplicates(ctx.user.organizationId, input.threshold);
    }),

  mergeDuplicates: protectedProcedure
    .input(z.object({ primaryLeadId: z.number(), secondaryLeadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return mergeDuplicates(ctx.user.organizationId, input.primaryLeadId, input.secondaryLeadId);
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      return getDuplicationStats(ctx.user.organizationId);
    }),
});
