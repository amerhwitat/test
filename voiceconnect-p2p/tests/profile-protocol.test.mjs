import test from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";
import { startServer } from "../server.js";

function waitForMessage(socket, predicate, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("Timed out waiting for VoiceConnect message"));
    }, timeoutMs);
    function onMessage(raw) {
      let message;
      try { message = JSON.parse(raw.toString()); } catch { return; }
      if (!predicate(message)) return;
      clearTimeout(timer);
      socket.off("message", onMessage);
      resolve(message);
    }
    socket.on("message", onMessage);
  });
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  return socket;
}

async function closeSocket(socket) {
  if (!socket || socket.readyState === WebSocket.CLOSED) return;
  await new Promise(resolve => {
    socket.once("close", resolve);
    socket.close();
  });
}

test("room profile metadata is synchronized and attached to chat", async () => {
  const { server, port } = await startServer({ host: "127.0.0.1", port: 0 });
  const url = "ws://127.0.0.1:" + port + "/signal";
  let alice;
  let bob;
  try {
    alice = await connect(url);
    const aliceJoined = waitForMessage(alice, m => m.type === "joined");
    alice.send(JSON.stringify({ type: "join", room: "profile-contract" }));
    await aliceJoined;

    const aliceSaved = waitForMessage(alice, m => m.type === "profile-saved");
    alice.send(JSON.stringify({
      type: "profile",
      userGuid: "123e4567-e89b-42d3-a456-426614174000",
      nickname: "Alice",
      avatar: "data:image/png;base64,aGVsbG8=",
      saveLocally: false,
      shareAddress: false
    }));
    await aliceSaved;

    bob = await connect(url);
    const bobJoined = waitForMessage(bob, m => m.type === "joined");
    const aliceSawBobJoin = waitForMessage(alice, m => m.type === "peer-joined");
    bob.send(JSON.stringify({ type: "join", room: "profile-contract" }));
    const joined = await bobJoined;
    await aliceSawBobJoin;
    assert.equal(joined.peers.length, 1);
    assert.equal(joined.peers[0].nickname, "Alice");
    assert.equal(joined.peers[0].avatar, "data:image/png;base64,aGVsbG8=");

    const aliceSawBobProfile = waitForMessage(alice, m => m.type === "peer-profile");
    const bobSaved = waitForMessage(bob, m => m.type === "profile-saved");
    bob.send(JSON.stringify({
      type: "profile",
      userGuid: "123e4567-e89b-42d3-a456-426614174001",
      nickname: "Bob",
      avatar: "data:image/webp;base64,d29ybGQ=",
      saveLocally: false,
      shareAddress: true
    }));
    await bobSaved;
    const profileUpdate = await aliceSawBobProfile;
    assert.equal(profileUpdate.peer.nickname, "Bob");
    assert.equal(profileUpdate.peer.avatar, "data:image/webp;base64,d29ybGQ=");
    assert.equal(profileUpdate.peer.addressShared, true);
    assert.equal(typeof profileUpdate.peer.observedIp, "string");
    assert.ok(profileUpdate.peer.observedIp.length > 0);

    const bobPeerExchange = waitForMessage(bob, m => m.type === "peer-exchange");
    bob.send(JSON.stringify({ type: "peer-exchange" }));
    const exchange = await bobPeerExchange;
    assert.equal(exchange.peers.length, 1);
    assert.equal(exchange.peers[0].nickname, "Alice");
    assert.equal(exchange.peers[0].addressShared, false);

    const aliceSawChat = waitForMessage(alice, m => m.type === "chat");
    bob.send(JSON.stringify({ type: "chat", text: "Hello with profile" }));
    const chat = await aliceSawChat;
    assert.equal(chat.message.nickname, "Bob");
    assert.equal(chat.message.userGuid, "123e4567-e89b-42d3-a456-426614174001");
    assert.equal(chat.message.avatar, "data:image/webp;base64,d29ybGQ=");
    assert.equal(chat.message.text, "Hello with profile");

    const aliceSawEncryptedChat = waitForMessage(alice, m => m.type === "chat" && m.message.encrypted === true);
    bob.send(JSON.stringify({ type: "chat", encrypted: true, iv: "AAECAwQFBgcICQoL", ciphertext: "Y2lwaGVydGV4dA==" }));
    const encryptedChat = await aliceSawEncryptedChat;
    assert.equal(encryptedChat.message.text, "");
    assert.equal(encryptedChat.message.iv, "AAECAwQFBgcICQoL");
    assert.equal(encryptedChat.message.ciphertext, "Y2lwaGVydGV4dA==");

    const aliceSawRevocation = waitForMessage(alice, m => m.type === "peer-profile" && m.peer.profileUpdated === true && m.peer.addressShared === false);
    bob.send(JSON.stringify({ type: "profile", userGuid: "123e4567-e89b-42d3-a456-426614174001", nickname: "Bob", avatar: "data:image/webp;base64,d29ybGQ=", saveLocally: false, shareAddress: false }));
    const revoked = await aliceSawRevocation;
    assert.equal(revoked.peer.addressShared, false);
    assert.equal(revoked.peer.observedIp, undefined);
  } finally {
    await closeSocket(alice);
    await closeSocket(bob);
    await new Promise(resolve => server.close(resolve));
  }
});
