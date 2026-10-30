import test from "node:test";
import assert from "node:assert/strict";
import { MAX_FILE_BYTES, FILE_CHUNK_BYTES, encodeBase64, decodeBase64, validateFileOffer } from "../file-transfer.js";

test("file chunks round-trip binary bytes", () => {
  const bytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
  assert.deepEqual([...decodeBase64(encodeBase64(bytes))], [...bytes]);
});

test("file offers enforce metadata, chunk count and size bounds", () => {
  const offer = { id: "123e4567-e89b-12d3-a456-426614174000", name: "test.bin", size: FILE_CHUNK_BYTES + 1, type: "application/octet-stream", totalChunks: 2, sha256: "a".repeat(64) };
  assert.equal(validateFileOffer(offer), true);
  assert.equal(validateFileOffer({ ...offer, size: MAX_FILE_BYTES + 1 }), false);
  assert.equal(validateFileOffer({ ...offer, totalChunks: 99 }), false);
  assert.equal(validateFileOffer({ ...offer, name: "../bad" }), false);
});
