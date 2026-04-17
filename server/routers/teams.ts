import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { isTeamsConfigured, getTeamsConfig, getTeamsOAuthUrl } from "../_core/teams";

export const teamsRouter = router({
  isConfigured: protectedProcedure.query(() => {
    return { configured: isTeamsConfigured() };
  }),

  getStatus: protectedProcedure.query(() => {
    return {
      configured: isTeamsConfigured(),
      features: {
        notifications: true,
        slashCommands: true,
        taskAssignment: true,
        bidirectionalWebhooks: true,
      },
    };
  }),

  getOAuthUrl: protectedProcedure.query(async () => {
    const url = await getTeamsOAuthUrl();
    return { url };
  }),

  getConfig: protectedProcedure.query(() => {
    const config = getTeamsConfig();
    return {
      configured: config.configured,
      botId: config.botId ? "***" : undefined,
    };
  }),
});
