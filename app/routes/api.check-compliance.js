import { json } from "@remix-run/node";
import axios from "axios";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { content } = await request.json();

  if (!session.shop) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Fetch the current plan and scan count
  let existingPlan = await prisma.storePlan.findUnique({
    where: { storeName: session.shop },
  });

  const now = new Date();

  // If no plan, create one
  if (!existingPlan) {
    existingPlan = await prisma.storePlan.create({
      data: {
        storeName: session.shop,
        planName: "basic",
        scanCount: 0,
        lastReset: now,
      },
    });
  }

  const planName = existingPlan.planName || "basic";
  let scanCount = existingPlan.scanCount || 0;

  // Reset monthly usage if 1 month passed
  const lastReset = existingPlan.lastReset;
  const nextReset = new Date(lastReset);
  nextReset.setMonth(nextReset.getMonth() + 1);

  if (now > nextReset) {
    await prisma.storePlan.update({
      where: { storeName: session.shop },
      data: {
        scanCount: 0,
        lastReset: now,
      },
    });
    scanCount = 0;
  }

  // Enforce limit
  if (planName === "basic" && scanCount >= 3) {
    return json({
      error: "Monthly scan limit reached for Basic plan. Upgrade to continue.",
    }, { status: 403 });
  }

  // Increment scan count
  await prisma.storePlan.update({
    where: { storeName: session.shop },
    data: {
      scanCount: { increment: 1 },
    },
  });

  // Generate prompt
  const prompt = `
You are an expert in the EU Green Claims Directive. Analyze the following marketing text and identify specific phrases that violate the directive based on the following rules:

1. No vague/unsubstantiated claims (e.g. “eco-friendly”, “green”, “climate neutral”)
2. All environmental claims must be evidence-based.
3. Certification/eco-labels must be valid and recognized (e.g., EU Ecolabel, FSC)
4. Carbon neutrality claims must include lifecycle offset proof.
5. No comparative claims unless objective reference is provided.

Return a JSON response:
{
  "compliance_status": "Compliant" or "Non-Compliant",
  "issues": [
    {
      "problematic_text": "...",
      "reason": "...",
      "suggested_fix": "..."
    }
  ]
}

Text:
"""${content}"""
`.trim();

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a legal compliance assistant helping enforce the EU Green Claims Directive.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const output = response.data.choices?.[0]?.message?.content;
    console.log("Raw OpenAI response:", output);

    if (!output) throw new Error("Empty response from OpenAI");

    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in OpenAI output");

    const parsed = JSON.parse(jsonMatch[0]);

    // ✅ Save to DB
    await prisma.complianceScan.create({
      data: {
        storeName: session.shop,
        customerText: content,
        violateText: parsed.issues?.map(i => i.problematic_text).join("; ") || null,
        reason: parsed.issues?.map(i => i.reason).join("; ") || null,
        suggestedText: parsed.issues?.map(i => i.suggested_fix).join("; ") || null,
      },
    });

    return json(parsed);
  } catch (err) {
    console.error("OpenAI error:", err);
    return json({ error: "Compliance check failed." }, { status: 500 });
  }

};
