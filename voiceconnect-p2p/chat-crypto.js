function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

export async function deriveChatKey(passphrase) {
  if (typeof passphrase !== "string" || passphrase.length < 12) {
    throw new TypeError("Chat passphrase must contain at least 12 characters");
  }
  const material = await globalThis.crypto.subtle.importKey(
    "raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("voiceconnect-p2p-chat-v1"),
      iterations: 310000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptChatPayload(text, key) {
  if (typeof text !== "string" || !key) throw new TypeError("Plaintext and chat key are required");
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(text)
  );
  return {
    encrypted: true,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptChatPayload(message, key) {
  if (!message?.encrypted || !message.iv || !message.ciphertext || !key) {
    throw new TypeError("Encrypted message, IV, ciphertext and chat key are required");
  }
  const plaintext = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(message.iv) },
    key,
    base64ToBytes(message.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}
