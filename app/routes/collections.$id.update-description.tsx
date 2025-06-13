import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // Adjust if needed

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) return json({ error: "Collection ID missing" }, { status: 400 });

  const { admin } = await authenticate.admin(request);
  const body = await request.json();
  const { description } = body;

  if (typeof description !== "string") {
    return json({ error: "Invalid description" }, { status: 400 });
  }
  
  const collectionGID = `gid://shopify/Collection/${id}`;

  const mutation = `
    mutation collectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection {
          id
          title
          descriptionHtml
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: collectionGID,
      descriptionHtml: description,
    },
  };

  const response = await admin.graphql(mutation, { variables });
  const result = await response.json();

  const errors = result.data?.collectionUpdate?.userErrors;

  if (errors && errors.length > 0) {
    return json({ error: "Update failed", details: errors }, { status: 400 });
  }

  return json({
    success: true,
    collection: result.data.collectionUpdate.collection,
  });
}
