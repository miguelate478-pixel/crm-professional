/**
 * Email service using Resend, Gmail, or SMTP.
 * Falls back to console.log if no email service is configured (dev mode).
 */

import { ENV } from "./env";
import nodemailer from "nodemailer";

const RESEND_API_KEY = ENV.resendApiKey;
const FROM_EMAIL = process.env.FROM_EMAIL || "CRM Pro <noreply@crmpro.app>";
const APP_URL = process.env.APP_URL || "https://crm-professional-production.up.railway.app";

// ── SMTP Transporter ──────────────────────────────────────────────────────────

let smtpTransporter: nodemailer.Transporter | null = null;

function getSMTPTransporter() {
  if (smtpTransporter) return smtpTransporter;

  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPassword) {
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPassword,
    },
  });

  return smtpTransporter;
}

// ── Main Send Email Function ──────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Try SMTP first
  const smtpTransporter = getSMTPTransporter();
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: ENV.smtpFromEmail,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent via SMTP to ${to}`);
      return true;
    } catch (e) {
      console.error("[Email] SMTP send error:", e);
      // Fall through to Resend
    }
  }

  // Try Resend
  if (RESEND_API_KEY) {
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
      console.log(`[Email] Sent via Resend to ${to}`);
      return true;
    } catch (e) {
      console.error("[Email] Resend send error:", e);
    }
  }

  // Dev mode fallback
  console.log(`[Email] No email service configured — would send to ${to}: ${subject}`);
  return true;
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
