import {
  Page,
  InlineGrid,
  Card,
  Text,
  List,
  Button,
  BlockStack
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  const plans = [
    {
      title: "Free: Try a basic compliance check for free",
      price: "€0 / month",
      features: [
        "Paste‐only text scanner (no Shopify API)",
        "3 scans / month of your own text",
        "Highlights vague environmental phrases (“eco‐friendly,” “green,” etc.)",
        "Basic, rule‐based compliance tips",
        "No credit card required"
      ],
      planKey: "basic"
    },
    {
      title: "Starter: Unlimited scans of products/pages",
      price: "€9.99 / month",
      features: [
        "Unlimited product/page scans via Shopify API",
        "Pick any Product, Page, or Collection to scan",
        "Real‐time EU directive rule updates",
        "Email support (24 h response)",
      ],
      planKey: "starter"
    },
    {
      title: "Pro: AI rewrites, audit reports & history",
      price: "€29.99 / month",
      features: [
        "All Starter features, plus:",
        "AI‐powered compliant rewrites (via OpenAI)",
        "Downloadable PDF audit report",
        "Scan history dashboard",
        "Priority support",
        "Early access to new features"
      ],
      planKey: "pro"
    }
  ];

  const handleUpgrade = async (planKey) => {
    const response = await fetch("/upgrade-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ planKey })
    });

    if (response.ok) {
      const { confirmationUrl } = await response.json();
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
      } else {
        window.location.href = "/billing/confirmation?plan=" + planKey;
      }
    } else {
      const { error } = await response.json();
      alert("Error upgrading plan: " + error);
    }
  };

  return (
    <Page>
      <TitleBar title="Additional Page" />
      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
        {plans.map((plan, index) => (
          <Card key={index} padding="400">
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {plan.title}
              </Text>
              <Text as="p" variant="headingLg">
                {plan.price}
              </Text>
              <List>
                {plan.features.map((feature, idx) => (
                  <List.Item key={idx}>{feature}</List.Item>
                ))}
              </List>
              <Button variant="primary" onClick={() => handleUpgrade(plan.planKey)}>
                Upgrade Plan
              </Button>
            </BlockStack>
          </Card>
        ))}
      </InlineGrid>
    </Page>
  );
}
