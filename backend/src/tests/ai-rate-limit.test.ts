import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { closeTestServer, postJson, startTestServer, type TestServer } from "./helpers.js";

interface ApiError {
  error: { code: string; message: string };
}

let testServer: TestServer;

before(async () => {
  delete process.env.AI_API_KEY;
  process.env.AI_RATE_LIMIT_MAX = "1";
  testServer = await startTestServer();
});

after(async () => {
  delete process.env.AI_RATE_LIMIT_MAX;
  await closeTestServer(testServer.server);
});

test("POST /api/ai-analyst aplica rate limit por cliente", async () => {
  const payload = { mode: "chat", district_id: 1, question: "¿Cómo está el índice?" };
  const first = await postJson<{ answer: string }>(testServer.baseUrl, "/api/ai-analyst", payload);
  assert.equal(first.status, 200);

  const second = await postJson<ApiError>(testServer.baseUrl, "/api/ai-analyst", payload);
  assert.equal(second.status, 429);
  assert.equal(second.body.error.code, "RATE_LIMITED");
});
