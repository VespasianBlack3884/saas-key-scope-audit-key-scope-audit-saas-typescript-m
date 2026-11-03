import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

const onboardingSchema = z.object({
  project_id: z.string().optional(),
  name: z.string().min(1),
  scopes: z.array(z.string()).optional(),
  idempotency_key: z.string().min(1)
});

export type OnboardingRequest = z.infer<typeof onboardingSchema>;

const capabilityByScope: Record<string, string[]> = {
  account_admin: ["account.keys.list", "account.keys.update", "account.budget.set", "account.routing.set"],
  billing_admin: ["account.balance", "account.budget.get", "account.autorecharge.get", "account.subscription.get", "account.tier"],
  access_review: ["pdf.generate"]
};

export function reachableCapabilities(scopes: string[]): string[] {
  return [...new Set(scopes.flatMap((scope) => capabilityByScope[scope] ?? []))].sort();
}

export async function onboardAndReview(input: unknown, client: InfraiClient) {
  const request = onboardingSchema.parse(input);
  const created = await client.request<{ key_id: string; key?: string }>("POST", "/account/keys/create", request);
  const scopes = request.scopes ?? [];
  const reachable = reachableCapabilities(scopes);
  const review = await client.request<{ id?: string; url?: string }>("POST", "/pdf/generate", {
    markdown: `# Access review\n\nDate: ${new Date().toISOString().slice(0, 10)}\n\nKey: ${request.name}\n\nScopes: ${scopes.join(", ") || "none"}\n\nReachable capabilities: ${reachable.join(", ") || "none"}`,
    page_size: "A4",
    orientation: "portrait",
    store: true
  });
  return {
    key_id: created.key_id,
    first_seen_key: created.key,
    reachable_capabilities: reachable,
    access_review_document: review
  };
}

export async function inspectAccount(client: InfraiClient) {
  const [keys, budget, usage] = await Promise.all([
    client.request("GET", "/account/keys/list"),
    client.request("GET", "/account/budget/get"),
    client.request("GET", "/account/usage")
  ]);
  return { keys, budget, usage };
}

async function main() {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  const result = await onboardAndReview({
    name: "course-platform-admin",
    scopes: ["account_admin", "access_review"],
    idempotency_key: "course-platform-onboarding-001"
  }, new InfraiClient(key));
  console.log(JSON.stringify({ key_id: result.key_id, reachable_capabilities: result.reachable_capabilities, access_review_document: result.access_review_document }, null, 2));
  console.log("The returned plaintext key is shown once; store it because it cannot be retrieved a second time.");
}

if (import.meta.main) main().catch((error) => {
  if (error instanceof Error) console.error(error.message);
  process.exitCode = 1;
});
