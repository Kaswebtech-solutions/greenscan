import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // or "~/shopify.server" if using aliases
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id } = params;
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      collection(id: "gid://shopify/Collection/${id}") {
        id
        title
        description
      }
    }
  `);

  const data = await response.json();

  return json({ collection: data.data.collection });
}
