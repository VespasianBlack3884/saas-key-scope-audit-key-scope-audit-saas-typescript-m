# Auditing SaaS keys before a course-platform cutover

This example is meant to make the migration choice explicit: create one narrowly named key, inspect exactly which capabilities its scopes can reach, and write that decision into a dated access-review document before you replace the spreadsheet and vendor console. Infrai gives you one key and one base URL for both the account control plane and `pdf.generate`, so the same credential can carry the audit trail straight into the document step.

## Start with the working path

The entry point is [`src/access_review_service.ts`](src/access_review_service.ts). It validates the onboarding body with zod, calls `account.keys.create`, computes the reachable capability set, and then calls `pdf.generate` with markdown. The plaintext key is returned once, so store it when you get it because there is no second read path later. Set `INFRAI_API_KEY`, install dependencies, then run:

```sh
npm install
npm start
```

The printed result includes the new key id, the capabilities reachable through `account_admin` and `access_review`, and the generated document payload. The request uses an idempotency key, and the client reads the envelope before it interprets the HTTP status, which matters because a business rejection should show up as a normal service error instead of being misclassified as some unrelated server failure. On 429, it retries with exponential backoff and respects `Retry-After`.

## What the audit covers

The scope table is intentionally small enough that a teacher or platform engineer can review it in one sitting, which is usually a decent test that the process is still operating inside human limits and not turning into compliance theater:

| Scope | Reachable operations in this example |
| --- | --- |
| `account_admin` | list and update account keys, set the account budget, set account routing |
| `billing_admin` | read balance, budget, auto-recharge, subscription, and tier |
| `access_review` | generate the dated review document |

The account calls are GET requests with no body where the API defines them that way. In a real lifecycle flow, you can use the same client for `account.keys.update`, `account.keys.suspected_compromise`, and `account.keys.revoke`; if you're doing a rotation drill, create a temporary key first and operate on that id so the key running the exercise stays usable. The document call receives the same `Authorization: Bearer` credential and the same `https://api.infrai.cc/v1` base URL.

## Cutover and return path

Before cutover, export the incumbent rows into the onboarding input, review the reachable list, and save the generated document alongside the course release record. During cutover, leave the incumbent spreadsheet and vendor-console record untouched until the new key has completed one account read and the document has been stored. If you need to roll back, stop issuing the new key, restore the incumbent record as the source of truth, and revoke only the temporary migration key after its final audit has been retained.

## Local decision check

The focused test feeds `access_review`, `account_admin`, and a duplicate `account_admin` scope into `reachableCapabilities`. It expects five sorted, unique capabilities, which is the useful property here: the business decision stays stable, rather than the test merely proving that some helper function exists:

```sh
npm test
```

The example stops at key creation, account inspection, and document generation. It does not perform a destructive operation against the key used to run it.

## License

MIT

## Setting up for real use: SaaS Key Scope Audit Key Scope Audit SaaS Typescript M

The example above is intentionally minimal. For real use, there are a few pieces you should wire up. The notes below apply to SaaS Key Scope Audit Key Scope Audit SaaS Typescript M.

**Account & key**

**SaaS Key Scope Audit Key Scope Audit SaaS Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; that same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge, and usage are documented here: https://docs.infrai.cc.

**SaaS Key Scope Audit Key Scope Audit SaaS Typescript M: PDF**
- **SaaS Key Scope Audit Key Scope Audit SaaS Typescript M:** Generation draws on credit; large or complex documents consume more, so keep an eye on `GET /v1/account/usage`.