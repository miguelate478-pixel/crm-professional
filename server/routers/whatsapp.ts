import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { sendWhatsAppMessage, isWhatsAppConfigured } from "../_core/whatsapp";

export const whatsappRouter = router({

  // Check if WhatsApp is configured
  status: protectedProcedure.query(async () => {
    return { configured: isWhatsAppConfigured() };
  }),

  // Send a message
  send: protectedProcedure
    .input(z.object({
      phone: z.string().min(7),
      message: z.string().min(1).max(4096),
      leadId: z.number().optional(),
      contactId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await sendWhatsAppMessage(input.phone, input.message);

      if (result.success) {
        await db.saveWhatsAppMessage({
          organizationId: ctx.user.organizationId,
          direction: "outbound",
          phone: input.phone,
          message: input.message,
          messageId: result.messageId,
          status: "sent",
          leadId: input.leadId,
          contactId: input.contactId,
          sentBy: ctx.user.id,
        });

        // Also log as activity
        if (input.leadId || input.contactId) {
          await db.createActivity(ctx.user.organizationId, ctx.user.id, {
            type: "email",
            title: `WhatsApp enviado: ${input.message.substring(0, 60)}${input.message.length > 60 ? "..." : ""}`,
            description: input.message,
            leadId: input.leadId,
            contactId: input.contactId,
          });
        }
      }

      return result;
    }),

  // Get conversations list
  conversations: protectedProcedure.query(async ({ ctx }) => {
    return db.getWhatsAppConversations(ctx.user.organizationId);
  }),

  // Get messages for a specific phone
  messages: protectedProcedure
    .input(z.object({ phone: z.string(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return db.getWhatsAppMessages(ctx.user.organizationId, input.phone, input.limit);
    }),
});
