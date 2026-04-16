import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const automationsRouter = router({
  run: protectedProcedure.mutation(async ({ ctx }) => {
    return db.runAutomations(ctx.user.organizationId, ctx.user.id);
  }),
});
