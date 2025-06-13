import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // 👈 fixed path

export async function loader({ request }: { request: Request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 250) {
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

  const products = jsonResp.data.products.edges.map((edge: any) => ({
    label: edge.node.title,
    value: edge.node.id,
  }));

  return json({ products });
}
