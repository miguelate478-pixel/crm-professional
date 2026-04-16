import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const companiesRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), search: z.string().optional() }))
    .query(async ({ ctx, input }) => db.getCompaniesList(ctx.user.organizationId, input)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      industry: z.string().optional(),
      employees: z.number().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => db.createCompany(ctx.user.organizationId, input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      industry: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCompany(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteCompany(ctx.user.organizationId, input.id)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => db.getCompanyById(ctx.user.organizationId, input.id)),
});
