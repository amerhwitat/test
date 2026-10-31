import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readStoredJson } from "../storage.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("profile storage falls back safely when JSON is malformed", () => {
  const storage = { getItem: () => "{broken-json" };
  const fallback = {};
  assert.equal(readStoredJson(storage, "vc-profile", fallback), fallback);
});

test("profile storage returns parsed profile data", () => {
  const storage = { getItem: () => JSON.stringify({ nickname: "Tester" }) };
  assert.deepEqual(readStoredJson(storage, "vc-profile", {}), { nickname: "Tester" });
});

test("connect panels cannot sit above and intercept controls in later sections", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const rules = [...css.matchAll(/\.connect\\s*\\{([^}]*)\\}/g)].map(match => match[1]);
  assert.ok(rules.length > 0, "connect panel styles should exist");
  for (const declarations of rules) {
    assert.doesNotMatch(declarations, /position\\s*:\\s*sticky/i);
    assert.doesNotMatch(declarations, /z-index\\s*:\\s*[1-9]/i);
  }
});
