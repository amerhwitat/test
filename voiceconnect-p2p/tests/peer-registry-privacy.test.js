import test from "node:test";
import assert from "node:assert/strict";
import { buildRegistryEntry, sanitizePersistedPeer } from "../server.js";

test("peer registry omits observed IP unless address sharing is explicitly enabled", () => {
  const base = {
    peerId: "peer-1",
    userGuid: "user-1",
    nickname: "Guest",
    avatar: "",
    observedIp: "192.0.2.10",
    firstSeen: "2026-10-30T00:00:00.000Z",
    lastSeen: "2026-10-30T00:00:00.000Z"
  };
  const privateEntry = buildRegistryEntry({ ...base, shareAddress: false });
  assert.equal(Object.hasOwn(privateEntry, "observedIp"), false);
  const sharedEntry = buildRegistryEntry({ ...base, shareAddress: true });
  assert.equal(sharedEntry.observedIp, "192.0.2.10");
  const unspecifiedEntry = buildRegistryEntry(base);
  assert.equal(Object.hasOwn(unspecifiedEntry, "observedIp"), false);
});

test("legacy peer registry migration removes previously persisted IP addresses", () => {
  const legacy = { peerId: "peer-2", nickname: "Old Guest", observedIp: "198.51.100.7" };
  const migrated = sanitizePersistedPeer(legacy);
  assert.equal(Object.hasOwn(migrated, "observedIp"), false);
  assert.equal(migrated.nickname, "Old Guest");
  assert.equal(sanitizePersistedPeer(null), null);
  assert.equal(sanitizePersistedPeer([]), null);
});
