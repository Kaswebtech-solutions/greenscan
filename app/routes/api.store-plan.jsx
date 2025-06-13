import { json } from "@remix-run/node";

export const loader = async () => {
  // TODO: Replace this with your real logic to get the plan from your database/store
  const planName = "basic"; // or "starter", "pro", etc.

  return json({ planName });
};
