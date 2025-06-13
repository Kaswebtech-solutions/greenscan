import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }: { request: Request }) {
  const { admin } = await authenticate.admin(request);

  // GraphQL query to fetch first 250 pages with id and title
  const response = await admin.graphql(`
    {
      pages(first: 250) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `);

  const jsonResp = await response.json();

  const pages = jsonResp.data.pages.edges.map((edge: any) => ({
    label: edge.node.title,
    value: edge.node.id,
  }));

  return json({ pages });
}
