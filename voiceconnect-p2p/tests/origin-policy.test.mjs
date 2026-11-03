import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedRequestOrigin } from "../server.js";

const request = (host = "127.0.0.1:63902", encrypted = false) => ({
  headers: { host },
  socket: { encrypted }
});

test("allows same-origin browser module requests in local desktop mode", () => {
  assert.equal(isAllowedRequestOrigin(request(), "http://127.0.0.1:63902", {
    allowedOrigins: new Set(), production: false
  }), true);
});

test("allows configured production origins", () => {
  assert.equal(isAllowedRequestOrigin(request(), "https://meet.example.com", {
    allowedOrigins: new Set(["https://meet.example.com"]), production: true
  }), true);
});

test("rejects unlisted cross-origin requests", () => {
  for (const production of [false, true]) {
    assert.equal(isAllowedRequestOrigin(request(), "https://attacker.example", {
      allowedOrigins: new Set(), production
    }), false);
  }
});

test("rejects malformed and opaque origins", () => {
  for (const origin of ["null", "not a URL", "file://"]) {
    assert.equal(isAllowedRequestOrigin(request(), origin, {
      allowedOrigins: new Set(), production: false
    }), false);
  }
});

test("rejects DNS-rebinding hostnames even when the Host header matches", () => {
  assert.equal(isAllowedRequestOrigin(request("attacker.example:63902"), "http://attacker.example:63902", {
    allowedOrigins: new Set(), production: false
  }), false);
});

test("uses HTTPS for a loopback TLS listener", () => {
  assert.equal(isAllowedRequestOrigin(request("localhost", true), "https://localhost", {
    allowedOrigins: new Set(), production: false
  }), true);
});
