import "server-only";
import { Resend } from "resend";
import { Client as PostmarkClient, Models } from "postmark";
import * as Brevo from "@getbrevo/brevo";
import { env } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const postmark =
  env.EMAIL_PROVIDER === "postmark" && env.POSTMARK_API_KEY
    ? new PostmarkClient(env.POSTMARK_API_KEY)
    : null;
const brevoApi =
  env.EMAIL_PROVIDER === "brevo" && env.BREVO_API_KEY
    ? (() => {
        const api = new Brevo.TransactionalEmailsApi();
        api.setApiKey("api-key", env.BREVO_API_KEY);
        return api;
      })()
    : null;

function getFromEmail(): string {
  if (env.EMAIL_PROVIDER === "brevo") return env.BREVO_FROM_EMAIL || env.RESEND_FROM_EMAIL;
  if (env.EMAIL_PROVIDER === "postmark") return env.POSTMARK_FROM_EMAIL;
  return env.RESEND_FROM_EMAIL;
}

async function sendEmail(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const hasProvider = resend || postmark || brevoApi;
  if (env.EMAIL_PROVIDER === "none" || !hasProvider) {
    console.log("📧 [Email disabled] Would send:", params.subject, "→", params.to);
    return { success: true };
  }

  try {
    if (env.EMAIL_PROVIDER === "brevo" && brevoApi) {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.subject = params.subject;
      sendSmtpEmail.htmlContent = params.html;
      sendSmtpEmail.sender = { email: params.from, name: "Lamrin" };
      sendSmtpEmail.to = [{ email: params.to }];
      await brevoApi.sendTransacEmail(sendSmtpEmail);
      return { success: true };
    }

    if (env.EMAIL_PROVIDER === "postmark" && postmark) {
      const msg = new Models.Message(
        params.from,
        params.subject,
        params.html,
        undefined,
        params.to
      );
      const result = await postmark.sendEmail(msg);
      if (result.ErrorCode !== 0) {
        return { success: false, error: result.Message ?? "Postmark error" };
      }
      return { success: true };
    }

    if (resend) {
      const result = await resend.emails.send(params);
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    }

    console.log("📧 [Email disabled] Would send:", params.subject, "→", params.to);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Email send failed:", msg);
    return { success: false, error: msg };
  }
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  email: string,
  data: {
    customerName?: string;
    amount: number;
    failureReason: string;
    updateCardLink: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = "Payment failed — easy fix inside 🔧";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Payment Update Needed</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.customerName || "there"},</p>
            
            <p>Your recent payment of <strong>$${data.amount.toFixed(2)}</strong> failed because:</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0; color: #dc2626;"><strong>${data.failureReason}</strong></p>
            </div>
            
            <p>No worries — we'll retry automatically in a few hours.</p>
            
            <p>In the meantime, you can update your card now to avoid any interruption:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.updateCardLink}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Update Card
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Questions? Just reply to this email and we'll help you out.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log("✅ Payment failed email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("❌ Email service error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send recovery success email
 */
export async function sendRecoverySuccessEmail(
  email: string,
  data: {
    customerName?: string;
    amount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = "Payment successful! ✅";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Payment Successful!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.customerName || "there"},</p>
            
            <p>Great news! Your payment of <strong>$${data.amount.toFixed(2)}</strong> has been successfully processed.</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0; color: #059669;"><strong>✅ Payment recovered</strong></p>
            </div>
            
            <p>Your account is now up to date. Thank you!</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log("✅ Recovery success email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("❌ Email service error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send pre-dunning email (card expiry warning)
 */
export async function sendPreDunningEmail(
  email: string,
  data: {
    customerName?: string;
    expiryDate: string;
    daysUntilExpiry: number;
    updateCardLink: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const urgency = data.daysUntilExpiry === 1 
      ? "Last 24 hours — update now" 
      : data.daysUntilExpiry <= 7 
      ? `Only ${data.daysUntilExpiry} days left` 
      : `Your card expires ${data.expiryDate}`;

    const subject = `⚠️ ${urgency}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Card Expiring Soon</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.customerName || "there"},</p>
            
            <p>Your payment card expires on <strong>${data.expiryDate}</strong>.</p>
            
            ${data.daysUntilExpiry <= 7 ? `
            <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Only ${data.daysUntilExpiry} ${data.daysUntilExpiry === 1 ? 'day' : 'days'} remaining</strong></p>
            </div>
            ` : ''}
            
            <p>To avoid any interruption to your service, please update your card now:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.updateCardLink}" 
                 style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Update Card
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Questions? Just reply to this email and we'll help you out.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log("✅ Pre-dunning email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("❌ Email service error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
