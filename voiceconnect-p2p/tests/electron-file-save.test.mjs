import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_RECEIVED_FILE_BYTES,
  sanitizeReceivedFilename,
  decodeReceivedFilePayload,
  persistSelectedFile
} = require("../electron-file-save.cjs");

test("received filenames cannot escape paths or use Windows device names", () => {
  const safe = sanitizeReceivedFilename("../../folder\\\\evil?.txt");
  assert.ok(!safe.includes("/") && !safe.includes("\\\\") && !safe.startsWith(".") && !safe.includes("?"));
  assert.equal(sanitizeReceivedFilename("CON"), "_CON");
  assert.equal(sanitizeReceivedFilename("trailing. "), "trailing");
  assert.equal(sanitizeReceivedFilename(""), "received-file");
  assert.ok(sanitizeReceivedFilename("x".repeat(300)).length <= 180);
});

test("received Base64 is canonical and bounded to 25 MiB", () => {
  assert.deepEqual(decodeReceivedFilePayload(Buffer.from([0, 1, 255]).toString("base64")), Buffer.from([0, 1, 255]));
  assert.deepEqual(decodeReceivedFilePayload(""), Buffer.alloc(0));
  assert.throws(() => decodeReceivedFilePayload("%%%"), /Base64/i);
  assert.throws(() => decodeReceivedFilePayload("YQ"), /Base64/i);
  assert.throws(() => decodeReceivedFilePayload(Buffer.alloc(MAX_RECEIVED_FILE_BYTES + 1).toString("base64")), /25 MB/i);
});

test("new destination is created exclusively and exact bytes are written", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voiceconnect-save-"));
  try {
    const target = path.join(dir, "received.bin");
    const bytes = Buffer.from([0, 7, 128, 255]);
    const result = await persistSelectedFile(target, bytes);
    assert.deepEqual(result, { ok: true, filePath: target, overwritten: false });
    assert.deepEqual(fs.readFileSync(target), bytes);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("existing destination is preserved unless overwrite is explicitly confirmed", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voiceconnect-save-"));
  try {
    const target = path.join(dir, "existing.bin");
    fs.writeFileSync(target, "original");
    const declined = await persistSelectedFile(target, Buffer.from("replacement"), {
      confirmOverwrite: async () => false
    });
    assert.deepEqual(declined, { ok: false, canceled: true });
    assert.equal(fs.readFileSync(target, "utf8"), "original");
    const accepted = await persistSelectedFile(target, Buffer.from("replacement"), {
      confirmOverwrite: async () => true
    });
    assert.deepEqual(accepted, { ok: true, filePath: target, overwritten: true });
    assert.equal(fs.readFileSync(target, "utf8"), "replacement");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("a destination that appears during creation is not silently overwritten", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voiceconnect-save-"));
  try {
    const target = path.join(dir, "raced.bin");
    let first = true;
    const result = await persistSelectedFile(target, Buffer.from("new"), {
      exists: () => false,
      fs: {
        existsSync: fs.existsSync,
        writeFileSync(file, data, options) {
          if (first) {
            first = false;
            fs.writeFileSync(file, "racer");
            const error = new Error("already exists");
            error.code = "EEXIST";
            throw error;
          }
          fs.writeFileSync(file, data, options);
        }
      },
      confirmOverwrite: async () => false
    });
    assert.deepEqual(result, { ok: false, canceled: true });
    assert.equal(fs.readFileSync(target, "utf8"), "racer");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
