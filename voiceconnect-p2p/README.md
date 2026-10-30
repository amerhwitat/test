# VoiceConnect P2P

An independent, browser-based voice and camera application inspired by the interaction model of Microsoft's DirectX 9 SDK **VoiceConnect** sample. It does not copy or link against DirectPlay or DirectPlay Voice.

## Features in this first prototype

- Room-based peer discovery through a lightweight WebSocket signaling service.
- WebRTC audio/video media connections between browsers (mesh topology, up to 8 room members by signaling policy).
- Camera and microphone selection, local preview, mute, and camera enable/disable.
- STUN-assisted ICE negotiation for direct paths when possible.
- No media server in the application path by design; media is sent peer-to-peer when network topology permits.

## Requirements

- Node.js 20+
- A modern browser with WebRTC support.
- HTTPS for camera/microphone permissions when accessed from another machine. `http://localhost` is permitted for local development.

## Run locally

```sh
cd voiceconnect-p2p
npm install
npm start
```

Open http://localhost:8787 in two browser profiles/devices, enter the same room name, join, and enable camera & microphone on each side.

## How it works

1. The WebSocket server validates a room name, announces peers, and relays SDP/ICE signaling messages only.
2. Browsers negotiate an `RTCPeerConnection` for each other participant.
3. Audio and video tracks travel over WebRTC's encrypted media transport. A direct peer route is attempted through ICE/STUN.
4. If direct connectivity is blocked by symmetric NAT, carrier NAT, or firewall policy, configure a TURN service; TURN relays packets and is not the same as a centralized media mixer.

This resembles BitTorrent only in the goal of avoiding a central media distributor. It is not a BitTorrent swarm: each participant establishes a live WebRTC connection to each other participant. Mesh bandwidth grows with participant count, so a larger room should use an SFU or a different topology.

## TURN configuration

The demo ships with a public STUN server for connectivity checks. Production deployments should provide authenticated TURN credentials and configure `iceServers` in `app.js`. Do not embed long-lived TURN secrets in a public client bundle; issue short-lived credentials from an authenticated backend.

## Deployment and security

- Deploy behind HTTPS/WSS.
- Add authentication, authorization, room secrets, rate limits, abuse reporting, and origin validation before exposing this publicly.
- The included room server is a prototype: room names are not passwords, signaling is unauthenticated, and it has no persistence.
- The static server is intended for this directory only; deploy behind a reverse proxy with normal operational hardening.
- Browser media access is permission-gated. The app does not activate camera or microphone until the user presses **Enable camera & mic**.
- WebRTC encrypts media in transit, but this prototype does not provide end-to-end identity verification or a guarantee against malicious signaling.

## Current limitations / next milestones

- No TURN credential service or deployment manifests yet.
- No screen sharing, text chat, recording, file transfer, contacts, or mobile-native wrappers.
- No automated browser-to-browser integration test in this initial commit.
- Mesh calls are suitable for small groups; do not treat the configured 8-peer room limit as a tested performance guarantee.

## Relationship to the original sample

The DirectX 9 SDK documentation lists VoiceConnect among the DirectPlay C++ samples. DirectPlay Voice is deprecated and unavailable on modern Windows versions, so this project is a clean, independent WebRTC implementation of a similar user-facing use case, not a port of the legacy runtime.

## License

No DirectX SDK sample source is included. Add a project license before redistributing this application.
