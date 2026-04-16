import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const opportunitiesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        stageId: z.number().optional(),
        pipelineId: z.number().optional(),
        assignedTo: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getOpportunitiesList(ctx.user.organizationId, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getOpportunityById(ctx.user.organizationId, input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        amount: z.number().min(0).optional(),
        probability: z.number().min(0).max(100).default(0),
        expectedCloseDate: z.string().optional(),
        pipelineId: z.number(),
        stageId: z.number(),
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        leadId: z.number().optional(),
        assignedTo: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createOpportunity(ctx.user.organizationId, ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        amount: z.number().min(0).optional(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseDate: z.string().optional(),
        stageId: z.number().optional(),
        assignedTo: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateOpportunity(ctx.user.organizationId, id, data);
    }),

  moveStage: protectedProcedure
    .input(z.object({ id: z.number(), stageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.updateOpportunity(ctx.user.organizationId, input.id, { stageId: input.stageId });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteOpportunity(ctx.user.organizationId, input.id);
    }),

  getPipelines: protectedProcedure.query(async ({ ctx }) => {
    return db.getPipelinesList(ctx.user.organizationId);
  }),

  getStages: protectedProcedure
    .input(z.object({ pipelineId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getPipelineStages(input.pipelineId);
    }),
});
