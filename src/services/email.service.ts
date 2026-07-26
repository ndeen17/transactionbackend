import { env } from "../config/env.js";
import { resend } from "../config/resend.js";

interface SendOtpEmailParams {
  to: string;
  firstName: string;
  code: string;
}

export async function sendOtpEmail({ to, firstName, code }: SendOtpEmailParams) {
  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 420px; margin: 0 auto;">
      <p style="font-size: 15px; color: #0b0b0f;">Hi ${escapeHtml(firstName)},</p>
      <p style="font-size: 15px; color: #0b0b0f;">Use the code below to verify your email and finish creating your Astera Banking account.</p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="display: inline-block; font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #1a4fd6; padding: 16px 24px; background: #eaf2ff; border-radius: 16px;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #7c8592;">This code expires in ${env.OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Your verification code",
      html,
    });

    if (error) {
      console.error("[email] Resend rejected the OTP email:", error);
      return;
    }

    if (env.DEBUG_LOG_OTP) {
      console.log(`[email] OTP email queued, Resend id: ${data?.id}`);
    }
  } catch (err) {
    console.error("[email] failed to send OTP email:", err);
  }
}

interface SendKycApprovedEmailParams {
  to: string;
  firstName: string;
}

export async function sendKycApprovedEmail({ to, firstName }: SendKycApprovedEmailParams) {
  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 420px; margin: 0 auto;">
      <p style="font-size: 15px; color: #0b0b0f;">Hi ${escapeHtml(firstName)},</p>
      <p style="font-size: 15px; color: #0b0b0f;">Good news — your identity verification has been approved. Your Astera Banking account now has full access.</p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="display: inline-block; font-size: 15px; font-weight: 600; color: #16a34a; padding: 14px 24px; background: #f0fdf4; border-radius: 16px;">Account verified ✓</span>
      </div>
      <p style="font-size: 13px; color: #7c8592;">You can log in any time to view your account and send or receive money.</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Your account has been verified",
      html,
    });

    if (error) {
      console.error("[email] Resend rejected the KYC approval email:", error);
    }
  } catch (err) {
    console.error("[email] failed to send KYC approval email:", err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
