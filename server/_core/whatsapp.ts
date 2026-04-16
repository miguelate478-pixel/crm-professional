/**
 * WhatsApp Business Cloud API integration
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "crm-whatsapp-verify";
const WA_API = "https://graph.facebook.com/v19.0";

export function isWhatsAppConfigured(): boolean {
  return !!(WA_TOKEN && WA_PHONE_ID);
}

// ── Send text message ─────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp no está configurado. Agrega WHATSAPP_TOKEN y WHATSAPP_PHONE_ID en las variables de entorno." };
  }

  // Normalize phone: remove spaces, dashes, ensure starts with +
  const phone = to.replace(/[\s\-\(\)]/g, "").replace(/^00/, "+");

  try {
    const res = await fetch(`${WA_API}/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });

    const data = await res.json() as any;

    if (!res.ok) {
      console.error("[WhatsApp] Send error:", data);
      return { success: false, error: data?.error?.message ?? "Error al enviar mensaje" };
    }

    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (e: any) {
    console.error("[WhatsApp] Network error:", e);
    return { success: false, error: e.message };
  }
}

// ── Send template message ─────────────────────────────────────────────────────

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = "es",
  components: any[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp no configurado" };
  }

  const phone = to.replace(/[\s\-\(\)]/g, "").replace(/^00/, "+");

  try {
    const res = await fetch(`${WA_API}/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: { name: templateName, language: { code: languageCode }, components },
      }),
    });

    const data = await res.json() as any;
    if (!res.ok) return { success: false, error: data?.error?.message ?? "Error" };
    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Webhook verification ──────────────────────────────────────────────────────

export function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  if (mode === "subscribe" && token === WA_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

// ── Parse incoming webhook ────────────────────────────────────────────────────

export interface IncomingMessage {
  from: string;       // phone number
  messageId: string;
  text?: string;
  timestamp: number;
  type: string;
  name?: string;      // contact name if available
}

export function parseWebhookPayload(body: any): IncomingMessage[] {
  const messages: IncomingMessage[] = [];
  try {
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value;
        if (!value?.messages) continue;
        for (const msg of value.messages) {
          messages.push({
            from: msg.from,
            messageId: msg.id,
            text: msg.text?.body,
            timestamp: parseInt(msg.timestamp),
            type: msg.type,
            name: value?.contacts?.[0]?.profile?.name,
          });
        }
      }
    }
  } catch (e) {
    console.error("[WhatsApp] Parse webhook error:", e);
  }
  return messages;
}
