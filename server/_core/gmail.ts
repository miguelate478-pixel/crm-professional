/**
 * Gmail integration via Google OAuth2
 * Allows reading and sending emails from within the CRM
 */
import { ENV } from "./env";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  ENV.gmailClientId || ENV.googleClientId,
  ENV.gmailClientSecret || ENV.googleClientSecret,
  `${ENV.APP_URL}/api/gmail/callback`
);

export function getGmailAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state,
    prompt: "consent",
  });
}

export async function exchangeGmailCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

function getGmailService(accessToken: string) {
  const client = new google.auth.OAuth2(
    ENV.gmailClientId || ENV.googleClientId,
    ENV.gmailClientSecret || ENV.googleClientSecret
  );
  client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: client });
}

export async function listEmails(accessToken: string, opts: {
  maxResults?: number;
  query?: string;
  pageToken?: string;
} = {}) {
  const gmail = getGmailService(accessToken);
  const { maxResults = 20, query = "", pageToken } = opts;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query || undefined,
    pageToken: pageToken || undefined,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) return { emails: [], nextPageToken: null };

  // Fetch details for each message
  const details = await Promise.all(
    messages.slice(0, maxResults).map(async (msg) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        const headers = detail.data.payload?.headers || [];
        const get = (name: string) => headers.find(h => h.name === name)?.value || "";
        return {
          id: msg.id,
          threadId: msg.threadId,
          subject: get("Subject") || "(Sin asunto)",
          from: get("From"),
          to: get("To"),
          date: get("Date"),
          snippet: detail.data.snippet || "",
          labelIds: detail.data.labelIds || [],
          isRead: !(detail.data.labelIds || []).includes("UNREAD"),
        };
      } catch {
        return null;
      }
    })
  );

  return {
    emails: details.filter(Boolean),
    nextPageToken: listRes.data.nextPageToken || null,
  };
}

export async function getEmail(accessToken: string, messageId: string) {
  const gmail = getGmailService(accessToken);
  const detail = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = detail.data.payload?.headers || [];
  const get = (name: string) => headers.find(h => h.name === name)?.value || "";

  // Extract body
  let body = "";
  const extractBody = (part: any): string => {
    if (part.mimeType === "text/html" && part.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8");
    }
    if (part.mimeType === "text/plain" && part.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8");
    }
    if (part.parts) {
      for (const p of part.parts) {
        const result = extractBody(p);
        if (result) return result;
      }
    }
    return "";
  };

  if (detail.data.payload) {
    body = extractBody(detail.data.payload);
  }

  return {
    id: detail.data.id,
    threadId: detail.data.threadId,
    subject: get("Subject") || "(Sin asunto)",
    from: get("From"),
    to: get("To"),
    cc: get("Cc"),
    date: get("Date"),
    body,
    labelIds: detail.data.labelIds || [],
    isRead: !(detail.data.labelIds || []).includes("UNREAD"),
  };
}

export async function sendEmail(accessToken: string, opts: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  replyToMessageId?: string;
  threadId?: string;
}) {
  const gmail = getGmailService(accessToken);

  // Build RFC 2822 message
  const lines = [
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : null,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    opts.replyToMessageId ? `In-Reply-To: ${opts.replyToMessageId}` : null,
    "",
    opts.body,
  ].filter(Boolean).join("\r\n");

  const encoded = Buffer.from(lines).toString("base64url");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
      threadId: opts.threadId || undefined,
    },
  });

  return { id: res.data.id, threadId: res.data.threadId };
}

export async function markAsRead(accessToken: string, messageId: string) {
  const gmail = getGmailService(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

export async function getGmailProfile(accessToken: string) {
  const gmail = getGmailService(accessToken);
  const profile = await gmail.users.getProfile({ userId: "me" });
  return {
    email: profile.data.emailAddress,
    messagesTotal: profile.data.messagesTotal,
    threadsTotal: profile.data.threadsTotal,
  };
}

export function isGmailConfigured(): boolean {
  return !!(ENV.gmailClientId || ENV.googleClientId) && !!(ENV.gmailClientSecret || ENV.googleClientSecret);
}
