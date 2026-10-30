"use strict";

const fs = require("node:fs");

const MAX_RECEIVED_FILE_BYTES = 25 * 1024 * 1024;

function sanitizeReceivedFilename(value) {
  let name = String(value || "received-file")
    .replace(/[\\\\/<>:"|?*\\u0000-\\u001f]/g, "_")
    .replace(/^[. ]+/g, "")
    .replace(/[. ]+$/g, "")
    .slice(0, 180)
    .replace(/[. ]+$/g, "");
  if (!name) name = "received-file";
  const stem = name.split(".")[0].toUpperCase();
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(stem)) name = "_" + name;
  return name;
}

function decodeReceivedFilePayload(encoded) {
  if (typeof encoded !== "string" || encoded.length > 36 * 1024 * 1024 ||
      encoded.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(encoded) ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new TypeError("Invalid Base64 file payload");
  }
  const data = Buffer.from(encoded, "base64");
  if (data.length > MAX_RECEIVED_FILE_BYTES || data.toString("base64") !== encoded) {
    throw new RangeError("File exceeds the 25 MB transfer limit or is not canonical Base64");
  }
  return data;
}

async function persistSelectedFile(filePath, data, options = {}) {
  if (typeof filePath !== "string" || !filePath || !Buffer.isBuffer(data) ||
      data.length > MAX_RECEIVED_FILE_BYTES) {
    throw new TypeError("Invalid selected file path or file data");
  }
  const fileSystem = options.fs || fs;
  const exists = options.exists || fileSystem.existsSync;
  const confirmOverwrite = options.confirmOverwrite || (async () => false);
  if (exists(filePath)) {
    const approved = await confirmOverwrite(filePath);
    if (!approved) return { ok: false, canceled: true };
    fileSystem.writeFileSync(filePath, data, { flag: "w" });
    return { ok: true, filePath, overwritten: true };
  }
  try {
    fileSystem.writeFileSync(filePath, data, { flag: "wx" });
    return { ok: true, filePath, overwritten: false };
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const approved = await confirmOverwrite(filePath);
    if (!approved) return { ok: false, canceled: true };
    fileSystem.writeFileSync(filePath, data, { flag: "w" });
    return { ok: true, filePath, overwritten: true };
  }
}

module.exports = {
  MAX_RECEIVED_FILE_BYTES,
  sanitizeReceivedFilename,
  decodeReceivedFilePayload,
  persistSelectedFile
};
