#!/usr/bin/env python3
"""VoiceConnect UTF-8 room chat client. Requires: pip install websockets"""
import argparse, asyncio, json, uuid
import websockets

async def main():
    p=argparse.ArgumentParser();p.add_argument("--url",default="ws://127.0.0.1:8787/signal");p.add_argument("--room",default="open-room-01");p.add_argument("--nick",default="Python user");a=p.parse_args()
    async with websockets.connect(a.url,max_size=262144) as ws:
        await ws.send(json.dumps({"type":"join","room":a.room},ensure_ascii=False))
        async def receive():
            async for raw in ws:
                m=json.loads(raw)
                if m.get("type")=="joined": print("Joined",m["room"],"peers:",len(m["peers"]))
                elif m.get("type")=="chat": print(f'[{m["message"]["nickname"]}] {m["message"]["text"]}')
                elif m.get("type") in ("peer-joined","peer-left","error"): print(m)
        task=asyncio.create_task(receive())
        try:
            while True:
                line=await asyncio.to_thread(input,"> ")
                if line.strip(): await ws.send(json.dumps({"type":"chat","text":line},ensure_ascii=False))
        except (EOFError,KeyboardInterrupt): await ws.send(json.dumps({"type":"leave"}))
        finally: task.cancel()
if __name__=="__main__": asyncio.run(main())
