import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const usersRouter = router({
  // List all users in org
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUsersByOrg(ctx.user.organizationId);
  }),

  // Update role (admin only)
  updateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      return db.updateUserRole(ctx.user.organizationId, input.userId, input.role);
    }),

  // Activate/deactivate user (admin only)
  setActive: adminProcedure
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return db.setUserActive(ctx.user.organizationId, input.userId, input.isActive);
    }),

  // Get audit logs (admin only)
  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return db.getAuditLogs(ctx.user.organizationId, input.limit);
    }),
});
