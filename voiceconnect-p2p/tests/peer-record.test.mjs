import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { createSignedPeerRecord, verifySignedPeerRecord, MAX_TTL_MS } from "../discovery/peer-record.js";

test("signed peer record verifies and is bound to its Ed25519 identity", () => {
  const pair = generateKeyPairSync("ed25519");
  const record = createSignedPeerRecord({ ...pair, nickname: "Alice", addresses: ["/dns4/peer.example/tcp/443/wss"], now: 10000 });
  assert.equal(verifySignedPeerRecord(record, { now: 11000 }), true);
  assert.equal(record.expiresAt - record.issuedAt, MAX_TTL_MS);
  assert.equal(verifySignedPeerRecord({ ...record, nickname: "Mallory" }, { now: 11000 }), false);
  assert.equal(verifySignedPeerRecord({ ...record, peerId: "0".repeat(64) }, { now: 11000 }), false);
});

test("peer records reject expiry, future issuance and excessive TTL", () => {
  const pair = generateKeyPairSync("ed25519");
  const record = createSignedPeerRecord({ ...pair, now: 60000 });
  assert.equal(verifySignedPeerRecord(record, { now: record.expiresAt }), false);
  assert.equal(verifySignedPeerRecord(record, { now: 0 }), false);
  assert.throws(() => createSignedPeerRecord({ ...pair, ttlMs: MAX_TTL_MS + 1 }), /TTL/);
});

test("peer records reject invalid address counts and overlong values", () => {
  const pair = generateKeyPairSync("ed25519");
  assert.throws(() => createSignedPeerRecord({ ...pair, addresses: Array(9).fill("/ip4/127.0.0.1/tcp/1") }), /multiaddress/);
});
