import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { isSlackConfigured } from "../_core/slack";

export const slackRouter = router({
  isConfigured: protectedProcedure
    .query(() => {
      return { configured: isSlackConfigured() };
    }),

  getOAuthUrl: protectedProcedure
    .query(() => {
      const clientId = process.env.SLACK_CLIENT_ID;
      const redirectUri = `${process.env.APP_URL}/api/slack/callback`;
      const scopes = [
        "chat:write",
        "commands",
        "incoming-webhook",
        "users:read",
        "users:read.email",
      ].join(",");

      const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
      return { url };
    }),

  getStatus: protectedProcedure
    .query(() => {
      return {
        configured: isSlackConfigured(),
        features: {
          notifications: true,
          slashCommands: true,
          taskAssignment: true,
        },
      };
    }),
});
