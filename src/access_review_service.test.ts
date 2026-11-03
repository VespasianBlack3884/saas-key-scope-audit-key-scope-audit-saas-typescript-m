import assert from "node:assert/strict";
import { reachableCapabilities } from "./access_review_service.ts";

const result = reachableCapabilities(["access_review", "account_admin", "account_admin"]);
assert.deepEqual(result, ["account.budget.set", "account.keys.list", "account.keys.update", "account.routing.set", "pdf.generate"]);
console.log("scope decision test passed");
