export interface TeamsConfig {
  webhookUrl: string;
  botId: string;
  botPassword: string;
  channelId?: string;
  configured: boolean;
}

export interface TeamsNotification {
  type: "lead" | "opportunity" | "task";
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl?: string;
}

export interface TeamsCommand {
  command: string;
  args: string[];
  userId: string;
  channelId: string;
}

let teamsConfig: TeamsConfig | null = null;

export function isTeamsConfigured(): boolean {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  const botId = process.env.TEAMS_BOT_ID;
  const botPassword = process.env.TEAMS_BOT_PASSWORD;

  return !!(webhookUrl && botId && botPassword);
}

export function getTeamsConfig(): TeamsConfig {
  return {
    webhookUrl: process.env.TEAMS_WEBHOOK_URL || "",
    botId: process.env.TEAMS_BOT_ID || "",
    botPassword: process.env.TEAMS_BOT_PASSWORD || "",
    configured: isTeamsConfigured(),
  };
}

export async function sendTeamsNotification(notification: TeamsNotification): Promise<boolean> {
  if (!isTeamsConfigured()) {
    console.warn("Teams is not configured");
    return false;
  }

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const payload: any = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: notification.title,
      themeColor: "0078D4",
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: notification.type.toUpperCase(),
          text: notification.message,
          facts: Object.entries(notification.data).map(([key, value]) => ({
            name: key,
            value: String(value),
          })),
        },
      ],
      potentialAction: notification.actionUrl
        ? [
            {
              "@type": "OpenUri",
              name: "View Details",
              targets: [
                {
                  os: "default",
                  uri: notification.actionUrl,
                },
              ],
            },
          ]
        : [],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending Teams notification:", error);
    return false;
  }
}

export async function handleTeamsCommand(command: TeamsCommand): Promise<string> {
  const { command: cmd, args } = command;

  switch (cmd) {
    case "crm-lead":
      return handleCreateLeadCommand(args);
    case "crm-opp":
      return handleCreateOpportunityCommand(args);
    case "crm-task":
      return handleCreateTaskCommand(args);
    case "crm-help":
      return getHelpMessage();
    default:
      return `Unknown command: ${cmd}. Type /crm-help for available commands.`;
  }
}

function handleCreateLeadCommand(args: string[]): string {
  if (args.length < 2) {
    return "Usage: /crm-lead <name> <email> [phone] [company]";
  }

  const [name, email, phone, company] = args;
  // In a real implementation, this would create a lead in the database
  return `✅ Lead created: ${name} (${email})`;
}

function handleCreateOpportunityCommand(args: string[]): string {
  if (args.length < 2) {
    return "Usage: /crm-opp <name> <amount> [stage]";
  }

  const [name, amount, stage] = args;
  // In a real implementation, this would create an opportunity in the database
  return `✅ Opportunity created: ${name} ($${amount})`;
}

function handleCreateTaskCommand(args: string[]): string {
  if (args.length < 1) {
    return "Usage: /crm-task <title> [priority] [dueDate]";
  }

  const [title, priority, dueDate] = args;
  // In a real implementation, this would create a task in the database
  return `✅ Task created: ${title}`;
}

function getHelpMessage(): string {
  return `
**Available CRM Commands:**

\`/crm-lead <name> <email> [phone] [company]\` - Create a new lead
\`/crm-opp <name> <amount> [stage]\` - Create a new opportunity
\`/crm-task <title> [priority] [dueDate]\` - Create a new task
\`/crm-help\` - Show this help message

**Recommended Channels:**
- #leads - Notifications for new leads
- #opportunities - Notifications for new opportunities
- #tasks - Notifications for new tasks
`;
}

export async function getTeamsOAuthUrl(): Promise<string> {
  const clientId = process.env.TEAMS_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/api/teams/callback`;
  const scopes = ["https://graph.microsoft.com/.default"];

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join(" ")}`;
  return url;
}

export async function exchangeTeamsCode(code: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const clientId = process.env.TEAMS_CLIENT_ID;
    const clientSecret = process.env.TEAMS_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL}/api/teams/callback`;

    const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!response.ok) {
      console.error("Failed to exchange Teams code");
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error("Error exchanging Teams code:", error);
    return null;
  }
}
