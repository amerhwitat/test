export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const FILE_CHUNK_BYTES = 12 * 1024;

export function encodeBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

export function decodeBase64(value) {
  if (typeof value !== "string" || value.length > FILE_CHUNK_BYTES * 2) throw new TypeError("Invalid file chunk");
  const binary = atob(value);
  if (binary.length > FILE_CHUNK_BYTES) throw new RangeError("File chunk exceeds limit");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function validateFileOffer(offer) {
  return Boolean(offer && typeof offer.id === "string" && /^[a-f0-9-]{36}$/i.test(offer.id) &&
    typeof offer.name === "string" && offer.name.length > 0 && offer.name.length <= 255 && !offer.name.includes("/") && !offer.name.includes("\\") && !/[\x00-\x1f]/.test(offer.name) &&
    Number.isSafeInteger(offer.size) && offer.size >= 0 && offer.size <= MAX_FILE_BYTES &&
    typeof offer.type === "string" && offer.type.length <= 128 &&
    Number.isSafeInteger(offer.totalChunks) && offer.totalChunks === Math.ceil(offer.size / FILE_CHUNK_BYTES) &&
    typeof offer.sha256 === "string" && /^[a-f0-9]{64}$/i.test(offer.sha256));
}

export function assembleFileChunks(chunks, expectedSize) {
  if (!Number.isSafeInteger(expectedSize) || expectedSize < 0 || expectedSize > MAX_FILE_BYTES) {
    throw new RangeError("Invalid expected file size");
  }
  const expectedCount = Math.ceil(expectedSize / FILE_CHUNK_BYTES);
  if (!Array.isArray(chunks) || chunks.length !== expectedCount) {
    throw new TypeError("File chunk count does not match the offer");
  }
  const output = new Uint8Array(expectedSize);
  let offset = 0;
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const expectedLength = Math.min(FILE_CHUNK_BYTES, expectedSize - offset);
    if (!(chunk instanceof Uint8Array) || chunk.length !== expectedLength) {
      throw new TypeError("File is incomplete or contains an invalid chunk");
    }
    output.set(chunk, offset);
    offset += chunk.length;
  }
  if (offset !== expectedSize) throw new TypeError("File length does not match the offer");
  return output;
}
