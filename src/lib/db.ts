import { prisma } from "./prisma";

export interface CreateInstallationInput {
  stripeAccountId: string;
  accessToken: string;
  country: string;
  pricingModel?: "flat" | "outcome" | "ltd";
}

/**
 * Create or update an installation after OAuth success.
 */
export async function createInstallation(input: CreateInstallationInput) {
  return prisma.installation.upsert({
    where: { stripeAccountId: input.stripeAccountId },
    update: {
      accessToken: input.accessToken,
      updatedAt: new Date(),
    },
    create: {
      stripeAccountId: input.stripeAccountId,
      accessToken: input.accessToken,
      country: input.country,
      pricingModel: input.pricingModel ?? "flat",
    },
  });
}

/**
 * Get installation by Stripe account ID.
 */
export async function getInstallation(stripeAccountId: string) {
  return prisma.installation.findUnique({
    where: { stripeAccountId },
  });
}

/**
 * Update VAU/ABU flags on an installation.
 */
export async function updateComplianceFlags(
  installationId: string,
  flags: { vauEnabled?: boolean; abuEnabled?: boolean }
) {
  return prisma.installation.update({
    where: { id: installationId },
    data: {
      vauEnabled: flags.vauEnabled,
      abuEnabled: flags.abuEnabled,
    },
  });
}
