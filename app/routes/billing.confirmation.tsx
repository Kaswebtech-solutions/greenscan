import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);

  const shop = session.shop;

  const url = new URL(request.url);
  const planParam = url.searchParams.get("plan");

  // Capitalize first letter for better display
  const plan = planParam
    ? planParam.charAt(0).toUpperCase() + planParam.slice(1) + " Plan"
    : "Unknown Plan";

  return json({ shop, plan });
}

export default function BillingConfirmationPage() {
  const { shop, plan } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Subscription Confirmed</h1>
      <p>
        Thank you for subscribing to the <strong>{plan}</strong> for{" "}
        <strong>{shop}</strong>!
      </p>
    </div>
  );
}
