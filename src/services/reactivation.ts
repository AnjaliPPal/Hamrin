import "server-only";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendReactivationEmail } from "@/services/email";

interface CampaignEmail {
  dayOffset: number;
  subject: string;
  body: string;
  offerType: "percent_off" | "none";
  offerValue: number;
}

/**
 * Build the reactivation URL for a churned customer.
 * Encodes churnedCustomerId + emailIndex so the /reactivate page can attribute the conversion.
 */
export function buildReactivationLink(
  churnedCustomerId: string,
  emailIndex: number
): string {
  const base = env.NEXT_PUBLIC_APP_URL ?? "";
  const params = new URLSearchParams({
    cid: churnedCustomerId,
    ei: String(emailIndex),
  });
  return `${base}/reactivate?${params.toString()}`;
}

/**
 * Daily cron job — called by POST /api/reactivation/send.
 *
 * For each installation with reactivation enabled:
 *   1. Fetch its campaign config
 *   2. Find churned customers who haven't reactivated
 *   3. For each campaign email step, find customers who:
 *      - Were churned >= dayOffset days ago
 *      - Haven't received this email step yet
 *   4. Send the email and record a ReactivationEmail row
 *
 * Returns counts of emails sent / skipped.
 */
export async function runReactivationCron(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Only installations with reactivation enabled
  const installations = await prisma.installation.findMany({
    where: { reactivationEnabled: true },
    select: { id: true },
  });

  for (const installation of installations) {
    const campaign = await prisma.reactivationCampaign.findUnique({
      where: { installationId: installation.id },
    });

    if (!campaign?.enabled) { skipped++; continue; }

    const emailSteps = (campaign.emails as unknown as CampaignEmail[]);
    if (!emailSteps.length) { skipped++; continue; }

    // Churned customers for this installation who haven't reactivated yet
    const churnedCustomers = await prisma.churnedCustomer.findMany({
      where: { installationId: installation.id, reactivatedAt: null },
      include: { reactivationEmails: { select: { emailIndex: true } } },
    });

    for (const customer of churnedCustomers) {
      const daysSinceChurn = Math.floor(
        (Date.now() - customer.cancelledAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const sentIndexes = new Set(customer.reactivationEmails.map((e) => e.emailIndex));

      for (let i = 0; i < emailSteps.length; i++) {
        const step = emailSteps[i];

        // Already sent this step
        if (sentIndexes.has(i)) continue;

        // Not yet time to send this step
        if (daysSinceChurn < step.dayOffset) continue;

        // Previous steps not yet sent — enforce sequential order
        if (i > 0 && !sentIndexes.has(i - 1)) continue;

        const reactivationLink = buildReactivationLink(customer.id, i);

        try {
          const result = await sendReactivationEmail(customer.customerEmail, {
            subject: step.subject,
            body: step.body,
            offerType: step.offerType,
            offerValue: step.offerValue,
            reactivationLink,
          });

          if (result.success) {
            await prisma.reactivationEmail.create({
              data: {
                churnedCustomerId: customer.id,
                emailIndex: i,
              },
            });
            sent++;
            console.log(
              `✅ Reactivation email [step ${i}] sent to ${customer.customerEmail}`
            );
          } else {
            errors++;
            console.error(
              `❌ Reactivation email [step ${i}] failed for ${customer.customerEmail}:`,
              result.error
            );
          }
        } catch (err) {
          errors++;
          console.error(
            `❌ Reactivation email exception for ${customer.customerEmail}:`,
            err
          );
        }

        // Only send one step per customer per cron run
        break;
      }
    }
  }

  return { sent, skipped, errors };
}
