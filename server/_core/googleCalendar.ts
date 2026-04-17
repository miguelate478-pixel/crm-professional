import { ENV } from "./env";
import * as db from "../db";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  ENV.googleClientId,
  ENV.googleClientSecret,
  ENV.googleRedirectUri
);

/**
 * Get Google Calendar OAuth URL for user authorization
 */
export function getGoogleCalendarAuthUrl(state: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("[GoogleCalendar] Token exchange failed:", error);
    throw error;
  }
}

/**
 * Get Google Calendar service with user's tokens
 */
function getCalendarService(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Sync Google Calendar events to CRM
 */
export async function syncGoogleCalendarEvents(
  organizationId: number,
  userId: number,
  integrationId: number,
  accessToken: string
) {
  try {
    const calendar = getCalendarService(accessToken);

    // Get events from Google Calendar (last 30 days to next 90 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: ninetyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    // Save events to database
    for (const event of events) {
      if (!event.id || !event.summary) continue;

      await db.upsertGoogleCalendarEvent({
        organizationId,
        integrationId,
        googleEventId: event.id,
        title: event.summary,
        description: event.description || null,
        startTime: event.start?.dateTime || event.start?.date || "",
        endTime: event.end?.dateTime || event.end?.date || null,
        location: event.location || null,
        attendees: event.attendees ? JSON.stringify(event.attendees) : null,
        syncedAt: new Date().toISOString(),
      });
    }

    // Update sync timestamp
    await db.updateGoogleCalendarIntegration(integrationId, {
      syncedAt: new Date().toISOString(),
    });

    return { success: true, eventCount: events.length };
  } catch (error) {
    console.error("[GoogleCalendar] Sync failed:", error);
    throw error;
  }
}

/**
 * Create event in Google Calendar from CRM task/activity
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    location?: string;
    attendees?: string[];
  }
) {
  try {
    const calendar = getCalendarService(accessToken);

    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime || event.startTime },
      location: event.location,
      attendees: event.attendees?.map(email => ({ email })),
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: googleEvent,
    });

    return response.data;
  } catch (error) {
    console.error("[GoogleCalendar] Create event failed:", error);
    throw error;
  }
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  event: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  }
) {
  try {
    const calendar = getCalendarService(accessToken);

    const updateData: any = {};
    if (event.title) updateData.summary = event.title;
    if (event.description) updateData.description = event.description;
    if (event.startTime) updateData.start = { dateTime: event.startTime };
    if (event.endTime) updateData.end = { dateTime: event.endTime };
    if (event.location) updateData.location = event.location;

    const response = await calendar.events.update({
      calendarId: "primary",
      eventId: googleEventId,
      requestBody: updateData,
    });

    return response.data;
  } catch (error) {
    console.error("[GoogleCalendar] Update event failed:", error);
    throw error;
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
) {
  try {
    const calendar = getCalendarService(accessToken);
    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });
    return { success: true };
  } catch (error) {
    console.error("[GoogleCalendar] Delete event failed:", error);
    throw error;
  }
}
