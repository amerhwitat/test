import { createHash, createPublicKey, sign, verify } from "node:crypto";

const MAX_TTL_MS = 15 * 60 * 1000;
const canonical = value => JSON.stringify({
  version: value.version,
  peerId: value.peerId,
  publicKey: value.publicKey,
  nickname: value.nickname,
  addresses: value.addresses,
  issuedAt: value.issuedAt,
  expiresAt: value.expiresAt
});

export function createSignedPeerRecord({ publicKey, privateKey, nickname = "Peer", addresses = [], now = Date.now(), ttlMs = MAX_TTL_MS }) {
  if (!publicKey || !privateKey) throw new TypeError("Ed25519 public and private keys are required");
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > MAX_TTL_MS) throw new RangeError("Peer record TTL must be between 1 second and 15 minutes");
  if (!Array.isArray(addresses) || addresses.length > 8 || addresses.some(address => typeof address !== "string" || address.length > 256)) throw new TypeError("Invalid peer multiaddress list");
  const publicKeyDer = publicKey.export({ type: "spki", format: "der" }).toString("base64");
  const der = Buffer.from(publicKeyDer, "base64");
  const peerId = createHash("sha256").update(der).digest("hex");
  const record = {
    version: 1,
    peerId,
    publicKey: publicKeyDer,
    nickname: String(nickname).replace(/[<>\u0000-\u001f]/g, "").slice(0, 32) || "Peer",
    addresses: [...new Set(addresses)],
    issuedAt: now,
    expiresAt: now + ttlMs
  };
  record.signature = sign(null, Buffer.from(canonical(record)), privateKey).toString("base64");
  return record;
}

export function verifySignedPeerRecord(record, { now = Date.now() } = {}) {
  try {
    if (!record || record.version !== 1 || typeof record.publicKey !== "string" || typeof record.signature !== "string") return false;
    if (!Number.isSafeInteger(record.issuedAt) || !Number.isSafeInteger(record.expiresAt) || record.issuedAt > now + 30000 || record.expiresAt <= now || record.expiresAt - record.issuedAt > MAX_TTL_MS) return false;
    if (!Array.isArray(record.addresses) || record.addresses.length > 8 || record.addresses.some(address => typeof address !== "string" || address.length > 256)) return false;
    const der = Buffer.from(record.publicKey, "base64");
    if (der.toString("base64") !== record.publicKey) return false;
    const publicKey = createPublicKey({ key: der, type: "spki", format: "der" });
    const peerId = createHash("sha256").update(der).digest("hex");
    if (peerId !== record.peerId) return false;
    return verify(null, Buffer.from(canonical(record)), publicKey, Buffer.from(record.signature, "base64"));
  } catch {
    return false;
  }
}

export { MAX_TTL_MS };
