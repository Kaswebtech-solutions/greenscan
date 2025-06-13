import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;

  if (!shop) {
    return json({ apiKey: process.env.SHOPIFY_API_KEY || "", planName: "" });
  }

  const storePlan = await prisma.storePlan.findUnique({
    where: { storeName: shop },
  });

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    planName: storePlan?.planName || "",
  });
};

export default function App() {
  const { apiKey, planName } = useLoaderData();
  const isBasicOrStarter = planName === "basic" || planName === "starter";

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        {/* <Link to="/app" rel="home">
          Home
        </Link>
       
        <Link to="/app/custom">Custom page</Link> */}
        <Link to="/app/plans">Plans</Link>
        {!isBasicOrStarter && <Link to="/app/scan-history">Scan History</Link>}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
