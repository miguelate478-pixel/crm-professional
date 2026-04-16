import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const quotationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["borrador", "enviada", "aceptada", "rechazada"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getQuotationsList(ctx.user.organizationId, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        opportunityId: z.number().optional(),
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        validUntil: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string().min(1),
            quantity: z.number().min(1),
            unitPrice: z.number().min(0),
            discount: z.number().min(0).max(100).default(0),
            productId: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createQuotation(ctx.user.organizationId, ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["borrador", "enviada", "aceptada", "rechazada"]).optional(),
        validUntil: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateQuotation(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteQuotation(ctx.user.organizationId, input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getQuotationById(ctx.user.organizationId, input.id);
    }),
});
