import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../rate-limit.js";

test("rate limiter allows only the configured number within a window", () => {
  let now = 1000;
  const allow = createRateLimiter({ clock: () => now, cleanupEvery: 1 });
  assert.equal(allow("peer-a", 2, 1000), true);
  assert.equal(allow("peer-a", 2, 1000), true);
  assert.equal(allow("peer-a", 2, 1000), false);
  now += 1000;
  assert.equal(allow("peer-a", 2, 1000), true);
});

test("rate limiter prunes expired keys and stays bounded", () => {
  let now = 0;
  const allow = createRateLimiter({ maxKeys: 2, cleanupEvery: 1, clock: () => now });
  assert.equal(allow("ip-a", 1, 100), true);
  assert.equal(allow("ip-b", 1, 100), true);
  assert.equal(allow("ip-c", 1, 100), false);
  now = 100;
  assert.equal(allow("ip-c", 1, 100), true);
  assert.equal(allow.size(), 1);
});

test("invalid rate-limit arguments fail closed", () => {
  const allow = createRateLimiter();
  assert.equal(allow("", 2, 1000), false);
  assert.equal(allow("peer", 0, 1000), false);
  assert.equal(allow("peer", 2, 0), false);
});
