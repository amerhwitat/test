# VoiceConnect: architecture and capabilities

*Project article · 31 October 2026*

VoiceConnect is an experimental browser and desktop voice/video application built around WebRTC. Its goal is to let a small group of people meet in a named room, exchange messages, and optionally share camera, microphone, and screen media.

## How a meeting works

A participant opens VoiceConnect, chooses a nickname and room name, grants the requested device permissions, and joins. The signaling service introduces participants who selected the same room. The clients then negotiate peer-to-peer WebRTC connections for media and data.

The current implementation uses a full-mesh topology and is capped at eight participants. Each participant establishes a connection to the others. This is suitable for small demonstrations, but it is not equivalent to a scalable Selective Forwarding Unit (SFU) architecture: CPU and network use increase as participants are added.

## What is included

- Room-based participant discovery and peer introduction.
- WebRTC audio/video with camera and microphone selection, preview, mute, and camera toggle.
- Nicknames and locally selected avatars.
- UTF-8 room chat and emoji.
- Optional screen sharing, subject to explicit browser or operating-system permission.
- A desktop shell and platform-specific packaging workflows for Windows, Linux, and macOS.
- Configurable STUN/TURN ICE settings and a server endpoint for short-lived TURN credentials when correctly configured.
- Companion Java, Python, and C++ UTF-8 chat clients. These are chat companions, not native WebRTC media clients.

## What the architecture does not claim

Room names are selectors, not proof of identity. A public deployment needs authenticated accounts or invitations, room authorization, origin restrictions, rate limits, abuse controls, TLS/WSS, secure TURN operations, monitoring, and a security review. The included deployment files are a template; they do not mean a public service has been deployed.

The mesh design is not an SFU. The application does not provide a built-in VPN, global peer discovery, offline messaging, resumable file transfer, or certified end-to-end encryption. Do not describe these as available features.

## Project and release status

The Windows desktop build and GUI are subject to automated CI acceptance. A source change or successful package build alone does not prove that every button works on a user's physical Windows device. The Windows click-through test is being added to exercise Chromium's trusted mouse-input path against the packaged Electron application.

CI preview packages are not signed production releases. Production publication requires the repository's release gates, signing/notarization credentials, physical-device acceptance, and the security/deployment evidence documented in the repository.

## Getting involved

See the [VoiceConnect README](../README.md) for prerequisites, local development commands, platform packaging, and deployment notes. Report reproducible issues with the operating system, app version or commit, steps to reproduce, and sanitized logs. Never include passwords, TURN secrets, private invitations, or unredacted peer IP addresses in public issue reports.
