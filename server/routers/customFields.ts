import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const customFieldsRouter = router({
  list: protectedProcedure
    .input(z.object({ entityType: z.enum(["lead", "contact", "opportunity", "company"]).optional() }))
    .query(async ({ ctx, input }) => db.getCustomFields(ctx.user.organizationId, input.entityType)),

  create: adminProcedure
    .input(z.object({
      entityType: z.enum(["lead", "contact", "opportunity", "company"]),
      name: z.string().min(1).regex(/^[a-z_]+$/, "Solo letras minúsculas y guiones bajos"),
      label: z.string().min(1),
      type: z.enum(["text", "number", "email", "phone", "date", "select", "checkbox", "textarea"]),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
      defaultValue: z.string().optional(),
      order: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => db.createCustomField(ctx.user.organizationId, input)),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      label: z.string().optional(),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
      defaultValue: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, options, ...data } = input;
      return db.updateCustomField(ctx.user.organizationId, id, {
        ...data,
        options: options ? JSON.stringify(options) : undefined,
      } as any);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteCustomField(ctx.user.organizationId, input.id)),

  getValues: protectedProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number() }))
    .query(async ({ ctx, input }) => db.getCustomFieldValues(input.entityType, input.entityId)),

  setValue: protectedProcedure
    .input(z.object({ fieldId: z.number(), entityType: z.string(), entityId: z.number(), value: z.string() }))
    .mutation(async ({ ctx, input }) =>
      db.setCustomFieldValue(input.fieldId, input.entityType, input.entityId, input.value)
    ),
});
