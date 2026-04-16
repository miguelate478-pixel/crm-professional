import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { leadsRouter } from "./routers/leads";
import { contactsRouter } from "./routers/contacts";
import { opportunitiesRouter } from "./routers/opportunities";
import { tasksRouter } from "./routers/tasks";
import { quotationsRouter } from "./routers/quotations";
import { reportsRouter } from "./routers/reports";
import { goalsRouter } from "./routers/goals";
import { usersRouter } from "./routers/users";
import { activitiesRouter } from "./routers/activities";
import { companiesRouter } from "./routers/companies";
import { productsRouter } from "./routers/products";
import { automationsRouter } from "./routers/automations";
import * as db from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  leads: leadsRouter,
  contacts: contactsRouter,
  opportunities: opportunitiesRouter,
  tasks: tasksRouter,
  quotations: quotationsRouter,
  reports: reportsRouter,
  goals: goalsRouter,
  users: usersRouter,
  activities: activitiesRouter,
  companies: companiesRouter,
  products: productsRouter,
  automations: automationsRouter,

  search: router({
    global: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return db.globalSearch(ctx.user.organizationId, input.query);
      }),
  }),

  notifications: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotifications(ctx.user.organizationId);
    }),
  }),
});

export type AppRouter = typeof appRouter;
