#!/usr/bin/env python3
"""VoiceConnect UTF-8 room chat client with nickname/avatar support.
Requires: pip install websockets. Avatar files are sent only to the selected room.
"""
import argparse
import asyncio
import base64
import json
import mimetypes
import uuid
from pathlib import Path
import websockets

MAX_AVATAR_BYTES = 36 * 1024

def load_avatar(path):
    if not path:
        return ""
    image = Path(path)
    raw = image.read_bytes()
    if not raw or len(raw) > MAX_AVATAR_BYTES:
        raise ValueError(f"Avatar must be between 1 byte and {MAX_AVATAR_BYTES} bytes")
    mime, _ = mimetypes.guess_type(image.name)
    if mime not in ("image/png", "image/jpeg", "image/webp", "image/gif"):
        raise ValueError("Avatar must be PNG, JPEG, WebP or GIF")
    return f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")

async def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="ws://127.0.0.1:8787/signal")
    p.add_argument("--room", default="open-room-01")
    p.add_argument("--nick", default="Python user", help="Display nickname (max 32 characters)")
    p.add_argument("--avatar", help="Optional local PNG/JPEG/WebP/GIF avatar (max 36 KiB)")
    a = p.parse_args()
    nickname = " ".join(a.nick.split())[:32] or "Guest"
    avatar = load_avatar(a.avatar)
    user_guid = str(uuid.uuid4())
    async with websockets.connect(a.url, max_size=262144) as ws:
        await ws.send(json.dumps({"type": "join", "room": a.room}, ensure_ascii=False))
        await ws.send(json.dumps({"type": "profile", "userGuid": user_guid,
            "nickname": nickname, "avatar": avatar, "saveLocally": False}, ensure_ascii=False))
        async def receive():
            async for raw in ws:
                m = json.loads(raw)
                kind = m.get("type")
                if kind == "joined":
                    print("Joined", m["room"], "peers:", len(m["peers"]))
                elif kind == "chat":
                    message = m["message"]
                    print(f'[{message.get("nickname", "Guest")}] {message.get("text", "")}')
                elif kind in ("peer-joined", "peer-profile"):
                    peer = m.get("peer", {})
                    print(f'[{peer.get("nickname", "Peer")}] profile available')
                elif kind in ("peer-left", "error"):
                    print(m)
        task = asyncio.create_task(receive())
        try:
            while True:
                line = await asyncio.to_thread(input, "> ")
                if line.strip():
                    await ws.send(json.dumps({"type": "chat", "text": line}, ensure_ascii=False))
        except (EOFError, KeyboardInterrupt):
            await ws.send(json.dumps({"type": "leave"}))
        finally:
            task.cancel()

if __name__ == "__main__":
    asyncio.run(main())
