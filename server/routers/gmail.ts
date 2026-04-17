import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as gmail from "../_core/gmail";
import * as db from "../db";

export const gmailRouter = router({
  isConfigured: protectedProcedure.query(() => ({
    configured: gmail.isGmailConfigured(),
  })),

  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const state = `${ctx.user.id}-${Date.now()}`;
    const authUrl = gmail.getGmailAuthUrl(state);
    return { authUrl };
  }),

  connect: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tokens = await gmail.exchangeGmailCode(input.code);
      if (!tokens.access_token) throw new Error("No se pudo conectar Gmail");
      // Store token in DB
      await db.upsertGmailIntegration(ctx.user.organizationId, ctx.user.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      });
      return { success: true };
    }),

  getIntegration: protectedProcedure.query(async ({ ctx }) => {
    return db.getGmailIntegration(ctx.user.organizationId, ctx.user.id);
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await db.deleteGmailIntegration(ctx.user.organizationId, ctx.user.id);
    return { success: true };
  }),

  listEmails: protectedProcedure
    .input(z.object({
      maxResults: z.number().default(20),
      query: z.string().optional(),
      pageToken: z.string().optional(),
      folder: z.enum(["inbox", "sent", "all"]).default("inbox"),
    }))
    .query(async ({ ctx, input }) => {
      const integration = await db.getGmailIntegration(ctx.user.organizationId, ctx.user.id);
      if (!integration?.accessToken) throw new Error("Gmail no conectado");

      const queryMap: Record<string, string> = {
        inbox: "in:inbox",
        sent: "in:sent",
        all: "",
      };
      const q = [queryMap[input.folder], input.query].filter(Boolean).join(" ");

      return gmail.listEmails(integration.accessToken, {
        maxResults: input.maxResults,
        query: q,
        pageToken: input.pageToken,
      });
    }),

  getEmail: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      const integration = await db.getGmailIntegration(ctx.user.organizationId, ctx.user.id);
      if (!integration?.accessToken) throw new Error("Gmail no conectado");
      const email = await gmail.getEmail(integration.accessToken, input.messageId);
      // Mark as read
      await gmail.markAsRead(integration.accessToken, input.messageId).catch(() => {});
      return email;
    }),

  sendEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
      cc: z.string().optional(),
      replyToMessageId: z.string().optional(),
      threadId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const integration = await db.getGmailIntegration(ctx.user.organizationId, ctx.user.id);
      if (!integration?.accessToken) throw new Error("Gmail no conectado");
      return gmail.sendEmail(integration.accessToken, input);
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const integration = await db.getGmailIntegration(ctx.user.organizationId, ctx.user.id);
    if (!integration?.accessToken) return null;
    return gmail.getGmailProfile(integration.accessToken).catch(() => null);
  }),
});
