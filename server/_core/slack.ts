import { ENV } from "./env";
import * as db from "../db";

/**
 * Slack Integration Module
 * Handles notifications via Slack Webhooks
 */

/**
 * Check if Slack is configured
 */
export function isSlackConfigured(): boolean {
  return !!ENV.SLACK_BOT_TOKEN;
}

/**
 * Send message to Slack via webhook
 */
async function sendSlackMessage(channel: string, blocks: any[]) {
  if (!ENV.SLACK_BOT_TOKEN) return;

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel,
        blocks,
      }),
    });

    if (!response.ok) {
      console.error("[Slack] Error sending message:", response.statusText);
    }
  } catch (error) {
    console.error("[Slack] Error sending message:", error);
  }
}

/**
 * Send notification for new lead
 */
export async function notifyNewLead(lead: any) {
  if (!isSlackConfigured()) return;

  await sendSlackMessage("#leads", [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🆕 *New Lead Created*\n*${lead.firstName} ${lead.lastName}*\nEmail: ${lead.email}\nPhone: ${lead.phone || "N/A"}\nSource: ${lead.source}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View in CRM" },
          url: `${ENV.APP_URL}/leads/${lead.id}`,
        },
      ],
    },
  ]);
}

/**
 * Send notification for new opportunity
 */
export async function notifyNewOpportunity(opp: any) {
  if (!isSlackConfigured()) return;

  await sendSlackMessage("#opportunities", [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎯 *New Opportunity Created*\n*${opp.name}*\nAmount: $${opp.amount}\nProbability: ${opp.probability}%\nStage: Prospect`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View in CRM" },
          url: `${ENV.APP_URL}/opportunities/${opp.id}`,
        },
      ],
    },
  ]);
}

/**
 * Send notification for new task
 */
export async function notifyNewTask(task: any) {
  if (!isSlackConfigured()) return;

  await sendSlackMessage("#tasks", [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `✅ *New Task Created*\n*${task.title}*\nPriority: ${task.priority}\nDue: ${task.dueDate || "N/A"}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View in CRM" },
          url: `${ENV.APP_URL}/tasks`,
        },
      ],
    },
  ]);
}

/**
 * Send notification for task assignment
 */
export async function notifyTaskAssigned(task: any, userEmail: string) {
  if (!isSlackConfigured()) return;

  const username = userEmail.split("@")[0];

  await sendSlackMessage(`@${username}`, [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `📋 *Task Assigned to You*\n*${task.title}*\nPriority: ${task.priority}\nDue: ${task.dueDate || "N/A"}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Task" },
          url: `${ENV.APP_URL}/tasks`,
        },
      ],
    },
  ]);
}
