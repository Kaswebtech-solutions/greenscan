import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // adjust as needed

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) {
    return json({ error: "Page ID missing" }, { status: 400 });
  }

  const { admin } = await authenticate.admin(request);

  // Parse body content
  const contentType = request.headers.get("content-type");
  let body: string | null = null;

  if (contentType?.includes("application/json")) {
    const bodyData = await request.json();
    body = bodyData.description;
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    body = formData.get("description") as string;
  }

  if (typeof body !== "string" || body.trim() === "") {
    return json({ error: "Invalid body content" }, { status: 400 });
  }

  // Wrap in <p> if needed
  const hasBlockTags = /<(p|div|section|ul|ol|li|table|h[1-6])\b/i.test(body);
  if (!hasBlockTags) {
    body = `<p>${body}</p>`;
  }

  // Construct Shopify GID for the page
  const pageGID = `gid://shopify/Page/${id}`;

  const mutation = `
    mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          title
          body
          handle
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: pageGID,
    page: {
      body: body
    }
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    console.log("GraphQL result:", JSON.stringify(response, null, 2));  
    return json({ response });
   
  } catch (error: any) {
    console.error("GraphQL error:", JSON.stringify(error, null, 2));
    return json({ error: "Internal server error", details: error }, { status: 500 });
  }
}
