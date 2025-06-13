import { json, redirect } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";


export const action: ActionFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const { planKey } = await request.json();

  const normalizedPlanKey = String(planKey).toLowerCase().trim();

  let lineItems = [];

  if (normalizedPlanKey === "starter") {
    lineItems = [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: 9.99, currencyCode: "EUR" },
            interval: "EVERY_30_DAYS"
          }
        }
      }
    ];
  } else if (normalizedPlanKey === "pro") {
    lineItems = [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: 29.99, currencyCode: "EUR" },
            interval: "EVERY_30_DAYS"
          }
        }
      }
    ];
  } else if (normalizedPlanKey === "basic") {
    // No billing needed; just redirect to a confirmation page
    await prisma.storePlan.upsert({
      where: { storeName: session.shop },
      update: { planName: normalizedPlanKey },
      create: {
        storeName: session.shop,
        planName: normalizedPlanKey
      }
    });
    
    return json({ confirmationUrl: `/billing/confirmation?plan=basic` });
  } else {
    return json({ error: "Invalid plan key" }, { status: 400 });
  }

  const mutation = `
    mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
      appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: true) {
        confirmationUrl
        appSubscription {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    name: `${normalizedPlanKey}-plan`,
    returnUrl: process.env.SHOPIFY_APP_URL + "/billing/confirmation?plan=" + normalizedPlanKey,
    lineItems
  };

  const response = await admin.graphql(mutation, { variables });
  const result = await response.json();

  const userErrors = result.data?.appSubscriptionCreate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    return json({ error: userErrors[0].message }, { status: 400 });
  }

  const confirmationUrl = result.data?.appSubscriptionCreate?.confirmationUrl;
  if (!confirmationUrl) {
    return json({ error: "No confirmation URL returned." }, { status: 400 });
  }

  await prisma.storePlan.upsert({
    where: { storeName: session.shop },
    update: { planName: normalizedPlanKey },
    create: {
      storeName: session.shop,
      planName: normalizedPlanKey
    }
  });
  
  
  return json({ confirmationUrl });
};
