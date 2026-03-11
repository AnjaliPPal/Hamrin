import "server-only";
import { Resend } from "resend";
import { Client as PostmarkClient, Models } from "postmark";
import { BrevoClient } from "@getbrevo/brevo";
import { env } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const postmark =
  env.EMAIL_PROVIDER === "postmark" && env.POSTMARK_API_KEY
    ? new PostmarkClient(env.POSTMARK_API_KEY)
    : null;
const brevoClient =
  env.EMAIL_PROVIDER === "brevo" && env.BREVO_API_KEY
    ? new BrevoClient({ apiKey: env.BREVO_API_KEY })
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
  const hasProvider = resend || postmark || brevoClient;
  if (env.EMAIL_PROVIDER === "none" || !hasProvider) {
    console.log("📧 [Email disabled] Would send:", params.subject, "→", params.to);
    return { success: true };
  }

  try {
    if (env.EMAIL_PROVIDER === "brevo" && brevoClient) {
      await brevoClient.transactionalEmails.sendTransacEmail({
        subject: params.subject,
        htmlContent: params.html,
        sender: { email: params.from, name: "Hamrin" },
        to: [{ email: params.to }],
      });
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

/**
 * Send 50% discount offer to at-risk customer
 */
export async function sendDiscountEmail(
  email: string,
  data: {
    customerName?: string;
    amount: number;
    updateCardLink: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = "We miss you — 50% off your next month 🎁";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">50% Off Your Next Month</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.customerName || "there"},</p>
            
            <p>We noticed your payment of <strong>$${data.amount.toFixed(2)}</strong> didn't go through, and we want to help.</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0; color: #059669;"><strong>🎁 Use code SAVE50 for 50% off your next month</strong></p>
            </div>
            
            <p>Update your card below and we'll apply the discount automatically:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.updateCardLink}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Update Card & Claim 50% Off
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Questions? Just reply to this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message from your subscription provider.
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

    console.log("✅ Discount offer email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("❌ Discount email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Module 6: Reactivation email — win back a churned customer
 */
export async function sendReactivationEmail(
  email: string,
  data: {
    customerName?: string;
    subject: string;
    body: string;
    offerType: "percent_off" | "none";
    offerValue?: number;
    reactivationLink: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const offerBlock =
      data.offerType === "percent_off" && data.offerValue
        ? `<div style="background:#f0fdf4;padding:16px;border-left:4px solid #2ECC88;margin:20px 0;border-radius:0 8px 8px 0;">
             <p style="margin:0;color:#166534;font-weight:600;">🎁 Special offer: ${data.offerValue}% off your first month back</p>
           </div>`
        : "";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;padding:20px;">
  <div style="padding:32px 0 16px;">
    <p style="font-size:22px;font-weight:800;margin:0 0 4px;">hamrin<span style="color:#EAB308;">.ai</span></p>
  </div>
  <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;">
    <p>Hi ${data.customerName ?? "there"},</p>
    <p style="white-space:pre-line;">${data.body}</p>
    ${offerBlock}
    <div style="text-align:center;margin:32px 0;">
      <a href="${data.reactivationLink}"
         style="display:inline-block;background:#111827;color:#fff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
        Reactivate my subscription →
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>
  </div>
  <p style="color:#9ca3af;font-size:12px;margin-top:20px;text-align:center;">
    You're receiving this because you previously subscribed. 
    <a href="${data.reactivationLink}?unsubscribe=1" style="color:#9ca3af;">Unsubscribe</a>
  </p>
</body>
</html>`;

    const result = await sendEmail({ from: getFromEmail(), to: email, subject: data.subject, html });
    if (!result.success) return { success: false, error: result.error };

    console.log("✅ Reactivation email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("❌ Reactivation email error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Module 6: Reactivation success email — welcome the customer back
 */
export async function sendReactivationSuccessEmail(
  email: string,
  data: {
    customerName?: string;
    dashboardLink?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = "Welcome back! Your subscription is active 🎉";
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;padding:20px;">
  <div style="padding:32px 0 16px;">
    <p style="font-size:22px;font-weight:800;margin:0 0 4px;">hamrin<span style="color:#EAB308;">.ai</span></p>
  </div>
  <div style="padding:32px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;">
    <p style="font-size:24px;font-weight:800;margin:0 0 16px;">Welcome back, ${data.customerName ?? "there"}! 🎉</p>
    <p>Your subscription is now active again. We're glad to have you back.</p>
    <div style="background:#fff;padding:16px;border-radius:10px;margin:20px 0;border:1px solid #d1fae5;">
      <p style="margin:0;color:#065f46;font-weight:600;">✅ Subscription reactivated successfully</p>
    </div>
    ${data.dashboardLink ? `<div style="text-align:center;margin:24px 0;">
      <a href="${data.dashboardLink}"
         style="display:inline-block;background:#111827;color:#fff;padding:12px 28px;text-decoration:none;border-radius:10px;font-weight:700;">
        Go to your account →
      </a>
    </div>` : ""}
    <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>
  </div>
</body>
</html>`;

    const result = await sendEmail({ from: getFromEmail(), to: email, subject, html });
    if (!result.success) return { success: false, error: result.error };

    console.log("✅ Reactivation success email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("❌ Reactivation success email error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
