import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
import { deriveChatKey, encryptChatPayload, decryptChatPayload } from "../chat-crypto.js";

test("AES-GCM chat payload round-trips UTF-8 and rejects a wrong passphrase", async () => {
  const senderKey = await deriveChatKey("a long shared chat secret 2026");
  const receiverKey = await deriveChatKey("a long shared chat secret 2026");
  const wrongKey = await deriveChatKey("a different shared chat secret");
  const payload = await encryptChatPayload("مرحبا 👋 — VoiceConnect", senderKey);
  assert.equal(payload.encrypted, true);
  assert.equal(typeof payload.iv, "string");
  assert.equal(typeof payload.ciphertext, "string");
  assert.equal(await decryptChatPayload(payload, receiverKey), "مرحبا 👋 — VoiceConnect");
  await assert.rejects(() => decryptChatPayload(payload, wrongKey));
});

test("chat encryption refuses weak passphrases", async () => {
  await assert.rejects(() => deriveChatKey("short"), /at least 12 characters/);
});
