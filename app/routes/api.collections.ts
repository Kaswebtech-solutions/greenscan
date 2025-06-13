import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }: { request: Request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      collections(first: 250) {
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

  const collections = jsonResp.data.collections.edges.map((edge: any) => ({
    label: edge.node.title,
    value: edge.node.id,
  }));

  return json({ collections });
}
