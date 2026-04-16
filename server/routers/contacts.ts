import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const contactsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        companyId: z.number().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getContactsList(ctx.user.organizationId, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        jobTitle: z.string().optional(),
        department: z.string().optional(),
        companyId: z.number().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createContact(ctx.user.organizationId, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
        department: z.string().optional(),
        companyId: z.number().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateContact(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteContact(ctx.user.organizationId, input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getContactById(ctx.user.organizationId, input.id);
    }),
});
