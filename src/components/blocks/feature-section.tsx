import { FeatureSteps } from "@/components/ui/feature-section"

const features = [
  {
    step: "Step 1",
    title: "Connect Stripe in 60 seconds",
    content:
      "One OAuth click links your Stripe account. No API keys to copy, no webhooks to configure manually. Hamrin is live before your coffee cools.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop",
  },
  {
    step: "Step 2",
    title: "Watch failed payments recover automatically",
    content:
      "Our smart retry engine detects declined cards and re-attempts at the optimal moment — recovering up to 72% of failed payments without lifting a finger.",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
  },
  {
    step: "Step 3",
    title: "Stop cancellations before they happen",
    content:
      "When a subscriber clicks cancel, Hamrin steps in with a personalised offer — pause, discount, or feedback — and turns churns into saves in real time.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
  },
  {
    step: "Step 4",
    title: "Track every dollar, every day",
    content:
      "Your recovery dashboard shows recovered revenue, churn risk scores, Visa compliance, and GDPR data retention — all updated live.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2070&auto=format&fit=crop",
  },
]

export function HamrinFeatureStepsDemo() {
  return (
    <FeatureSteps
      features={features}
      label="How it works"
      title="From zero to recovering revenue in minutes"
      autoPlayInterval={4500}
    />
  )
}
