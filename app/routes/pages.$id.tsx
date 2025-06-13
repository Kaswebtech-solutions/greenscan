import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // or "~/shopify.server" if using aliases
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id } = params;
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      page(id: "gid://shopify/Page/${id}") {
        id
        title
        body
      }
    }
  `);

  const data = await response.json();

  return json({ page: data.data.page });
}
