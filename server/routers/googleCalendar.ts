import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import * as googleCalendar from "../_core/googleCalendar";

export const googleCalendarRouter = router({
  // Get OAuth URL for authorization
  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const state = `${ctx.user.id}-${Date.now()}`;
    const authUrl = googleCalendar.getGoogleCalendarAuthUrl(state);
    return { authUrl, state };
  }),

  // Exchange code for tokens and create integration
  connectCalendar: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tokens = await googleCalendar.exchangeCodeForTokens(input.code);

        if (!tokens.access_token) {
          throw new Error("No access token received");
        }

        // Create integration record
        const integration = await db.createGoogleCalendarIntegration(
          ctx.user.organizationId,
          ctx.user.id,
          {
            googleCalendarId: "primary",
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
          }
        );

        return { success: true, integration };
      } catch (error) {
        console.error("[GoogleCalendar] Connect failed:", error);
        throw new Error("Failed to connect Google Calendar");
      }
    }),

  // Get current integration
  getIntegration: protectedProcedure.query(async ({ ctx }) => {
    const integrations = await db.getGoogleCalendarIntegration(
      ctx.user.organizationId,
      ctx.user.id
    );
    return integrations[0] || null;
  }),

  // Sync events from Google Calendar
  syncEvents: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const integrations = await db.getGoogleCalendarIntegration(
        ctx.user.organizationId,
        ctx.user.id
      );

      if (!integrations[0]) {
        throw new Error("Google Calendar not connected");
      }

      const integration = integrations[0];
      const result = await googleCalendar.syncGoogleCalendarEvents(
        ctx.user.organizationId,
        ctx.user.id,
        integration.id,
        integration.accessToken
      );

      return result;
    } catch (error) {
      console.error("[GoogleCalendar] Sync failed:", error);
      throw new Error("Failed to sync Google Calendar events");
    }
  }),

  // Get synced events
  getEvents: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const integrations = await db.getGoogleCalendarIntegration(
        ctx.user.organizationId,
        ctx.user.id
      );

      if (!integrations[0]) {
        return [];
      }

      return db.getGoogleCalendarEvents(
        ctx.user.organizationId,
        integrations[0].id,
        input
      );
    }),

  // Create event in Google Calendar from CRM
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        startTime: z.string(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        attendees: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const integrations = await db.getGoogleCalendarIntegration(
          ctx.user.organizationId,
          ctx.user.id
        );

        if (!integrations[0]) {
          throw new Error("Google Calendar not connected");
        }

        const googleEvent = await googleCalendar.createGoogleCalendarEvent(
          integrations[0].accessToken,
          input
        );

        // Save to CRM database
        await db.upsertGoogleCalendarEvent({
          organizationId: ctx.user.organizationId,
          integrationId: integrations[0].id,
          googleEventId: googleEvent.id || "",
          title: googleEvent.summary || "",
          description: googleEvent.description || null,
          startTime: googleEvent.start?.dateTime || googleEvent.start?.date || "",
          endTime: googleEvent.end?.dateTime || googleEvent.end?.date || null,
          location: googleEvent.location || null,
          attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
        });

        return googleEvent;
      } catch (error) {
        console.error("[GoogleCalendar] Create event failed:", error);
        throw new Error("Failed to create Google Calendar event");
      }
    }),

  // Update event in Google Calendar
  updateEvent: protectedProcedure
    .input(
      z.object({
        googleEventId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const integrations = await db.getGoogleCalendarIntegration(
          ctx.user.organizationId,
          ctx.user.id
        );

        if (!integrations[0]) {
          throw new Error("Google Calendar not connected");
        }

        const googleEvent = await googleCalendar.updateGoogleCalendarEvent(
          integrations[0].accessToken,
          input.googleEventId,
          input
        );

        return googleEvent;
      } catch (error) {
        console.error("[GoogleCalendar] Update event failed:", error);
        throw new Error("Failed to update Google Calendar event");
      }
    }),

  // Delete event from Google Calendar
  deleteEvent: protectedProcedure
    .input(z.object({ googleEventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const integrations = await db.getGoogleCalendarIntegration(
          ctx.user.organizationId,
          ctx.user.id
        );

        if (!integrations[0]) {
          throw new Error("Google Calendar not connected");
        }

        await googleCalendar.deleteGoogleCalendarEvent(
          integrations[0].accessToken,
          input.googleEventId
        );

        // Delete from CRM database
        await db.deleteGoogleCalendarEvent(ctx.user.organizationId, input.googleEventId);

        return { success: true };
      } catch (error) {
        console.error("[GoogleCalendar] Delete event failed:", error);
        throw new Error("Failed to delete Google Calendar event");
      }
    }),

  // Disconnect Google Calendar
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const integrations = await db.getGoogleCalendarIntegration(
        ctx.user.organizationId,
        ctx.user.id
      );

      if (integrations[0]) {
        await db.updateGoogleCalendarIntegration(integrations[0].id, {
          isActive: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("[GoogleCalendar] Disconnect failed:", error);
      throw new Error("Failed to disconnect Google Calendar");
    }
  }),
});
