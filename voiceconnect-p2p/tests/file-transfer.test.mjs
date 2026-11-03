import test from "node:test";
import assert from "node:assert/strict";
import { MAX_FILE_BYTES, FILE_CHUNK_BYTES, encodeBase64, decodeBase64, validateFileOffer, assembleFileChunks } from "../file-transfer.js";

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

test("file chunks reassemble in order and support empty files", () => {
  const first = new Uint8Array(FILE_CHUNK_BYTES).fill(7);
  const last = new Uint8Array([8, 9]);
  const result = assembleFileChunks([first, last], FILE_CHUNK_BYTES + 2);
  assert.equal(result.length, FILE_CHUNK_BYTES + 2);
  assert.equal(result[0], 7);
  assert.equal(result.at(-1), 9);
  assert.equal(assembleFileChunks([], 0).length, 0);
});

test("interrupted or malformed chunk sequences are rejected", () => {
  assert.throws(() => assembleFileChunks([new Uint8Array([1])], 2), /incomplete|invalid/i);
  assert.throws(() => assembleFileChunks([], 1), /chunk count/i);
  assert.throws(() => assembleFileChunks([new Uint8Array([1, 2])], 1), /incomplete|invalid/i);
});
