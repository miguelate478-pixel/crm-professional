import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const tasksRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["pendiente", "en_progreso", "completada"]).optional(),
        priority: z.enum(["baja", "media", "alta"]).optional(),
        assignedTo: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return db.getTasksList(ctx.user.organizationId, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["pendiente", "en_progreso", "completada"]).default("pendiente"),
        priority: z.enum(["baja", "media", "alta"]).default("media"),
        dueDate: z.string().optional(),
        assignedTo: z.number().optional(),
        leadId: z.number().optional(),
        contactId: z.number().optional(),
        opportunityId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createTask(ctx.user.organizationId, ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["pendiente", "en_progreso", "completada"]).optional(),
        priority: z.enum(["baja", "media", "alta"]).optional(),
        dueDate: z.string().optional(),
        assignedTo: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateTask(ctx.user.organizationId, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteTask(ctx.user.organizationId, input.id);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendiente", "en_progreso", "completada"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.updateTask(ctx.user.organizationId, input.id, { status: input.status });
    }),
});
