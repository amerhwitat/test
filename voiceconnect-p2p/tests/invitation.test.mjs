import test from "node:test";
import assert from "node:assert/strict";
import { buildInvitationLink, isValidPublicIp } from "../invitation.js";

test("validates IPv4 and IPv6 public address text", () => {
  assert.equal(isValidPublicIp("203.0.113.9"), true);
  assert.equal(isValidPublicIp("2001:db8::1"), true);
  assert.equal(isValidPublicIp("999.999.999.999"), false);
  assert.equal(isValidPublicIp("not-an-ip"), false);
});

test("invitation embeds optional IP only in URL fragment", () => {
  const plain = new URL(buildInvitationLink("https://meet.example/", "room_01", "signed-token-123"));
  assert.equal(plain.searchParams.get("room"), "room_01");
  assert.equal(plain.hash, "");
  const shared = new URL(buildInvitationLink("https://meet.example/", "room_01", "signed-token-123", { includeIp: true, publicIp: "203.0.113.9" }));
  assert.equal(shared.searchParams.has("shared-ip"), false);
  assert.equal(new URLSearchParams(shared.hash.slice(1)).get("shared-ip"), "203.0.113.9");
  assert.throws(() => buildInvitationLink("https://meet.example/", "room_01", "signed-token-123", { includeIp: true, publicIp: "" }), /public IP/);
});
