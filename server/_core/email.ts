/**
 * Email service using Resend.
 * Falls back to console.log if RESEND_API_KEY is not set (dev mode).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "CRM Pro <noreply@crmpro.app>";
const APP_URL = process.env.APP_URL || "https://crm-professional-production.up.railway.app";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Email] No RESEND_API_KEY — would send to ${to}: ${subject}`);
    return true; // silently succeed in dev
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Email] Send error:", e);
    return false;
  }
}

// ── Password Reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return sendEmail(
    to,
    "Recuperar contraseña — CRM Pro",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; width: 56px; height: 56px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 14px; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: white; margin-bottom: 16px;">CR</div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: white;">CRM Pro</h1>
      </div>
      <h2 style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 8px;">Hola, ${name} 👋</h2>
      <p style="color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
        Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva.
      </p>
      <a href="${resetUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
        Restablecer contraseña
      </a>
      <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 8px;">
        Este enlace expira en <strong style="color: #94a3b8;">1 hora</strong>.
      </p>
      <p style="color: #64748b; font-size: 13px; text-align: center;">
        Si no solicitaste esto, ignora este email.
      </p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px; text-align: center;">
        O copia este enlace: <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
      </p>
    </div>
    `
  );
}

// ── Team Invitation ───────────────────────────────────────────────────────────

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  companyName: string,
  token: string
): Promise<boolean> {
  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;
  return sendEmail(
    to,
    `${inviterName} te invitó a ${companyName} — CRM Pro`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; width: 56px; height: 56px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 14px; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: white; margin-bottom: 16px;">CR</div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: white;">CRM Pro</h1>
      </div>
      <h2 style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 8px;">¡Te invitaron al equipo! 🎉</h2>
      <p style="color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
        <strong style="color: white;">${inviterName}</strong> te invitó a unirte a <strong style="color: white;">${companyName}</strong> en CRM Pro.
      </p>
      <a href="${inviteUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
        Aceptar invitación
      </a>
      <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 8px;">
        Este enlace expira en <strong style="color: #94a3b8;">7 días</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px; text-align: center;">
        O copia este enlace: <a href="${inviteUrl}" style="color: #3b82f6;">${inviteUrl}</a>
      </p>
    </div>
    `
  );
}
