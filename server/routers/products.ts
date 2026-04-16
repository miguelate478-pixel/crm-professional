import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const productsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50), search: z.string().optional() }))
    .query(async ({ ctx, input }) => db.getProductsList(ctx.user.organizationId, input)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      price: z.number().min(0),
      cost: z.number().min(0).optional(),
      sku: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => db.createProduct(ctx.user.organizationId, input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      price: z.number().optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateProduct(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteProduct(ctx.user.organizationId, input.id)),
});
