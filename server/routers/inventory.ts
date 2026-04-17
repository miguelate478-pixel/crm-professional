import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const inventoryRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      search: z.string().optional(),
      lowStock: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => db.getInventoryList(ctx.user.organizationId, input)),

  getByProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => db.getInventoryByProduct(ctx.user.organizationId, input.productId)),

  adjust: protectedProcedure
    .input(z.object({
      productId: z.number(),
      type: z.enum(["entrada", "salida", "ajuste"]),
      quantity: z.number().min(0),
      reason: z.string().optional(),
      reference: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      db.createInventoryMovement(ctx.user.organizationId, ctx.user.id, input)
    ),

  setStock: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number().min(0),
      minStock: z.number().min(0).optional(),
      maxStock: z.number().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { productId, quantity, ...opts } = input;
      return db.upsertInventory(ctx.user.organizationId, productId, quantity, opts);
    }),

  movements: protectedProcedure
    .input(z.object({
      productId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) =>
      db.getInventoryMovements(ctx.user.organizationId, input.productId, input)
    ),
});
