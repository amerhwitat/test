# VoiceConnect P2P

Independent browser and desktop voice/video application inspired by the user experience of Microsoft's DirectX 9 SDK VoiceConnect sample. No DirectPlay source or runtime is bundled.

## Features

- Automatic discovery of participants who join the same room.
- WebRTC mesh audio/video, camera/microphone selection, preview, mute and camera toggle.
- Nicknames and avatars, stored locally in the browser profile and announced to room peers.
- Optional consent-based server-side JSON peer registry at `data/peers.json`, including the signaling host's observed client IP, nickname, avatar, first-seen and last-seen timestamps. File permissions are restricted to the creating user where supported.
- STUN and configurable TURN/TLS ICE servers.
- Electron desktop shell and packaging scripts for Windows, Linux and macOS.
- Optional HTTP(S) proxy for Electron's signaling/web requests via `HTTPS_PROXY` / `HTTP_PROXY`.

## Automatic peer discovery and IP handling

Discovery is room-based: when a participant joins a room, the signaling service automatically shares their peer ID, nickname and avatar with the room. Existing members are returned to newcomers. It does not scan arbitrary IP ranges, probe ports, or attempt to discover devices that have not opted into a room.

A browser cannot reliably obtain another peer's real IP address from WebRTC: modern browsers intentionally restrict this information and may expose mDNS host candidates instead. The signaling server sees the remote address of its WebSocket connection. If the user explicitly checks the save-consent box, the server writes that observed address and profile to its local JSON registry. Behind a reverse proxy, set `TRUST_PROXY=1` only when that proxy strips untrusted forwarded headers and writes its own `X-Forwarded-For`. Otherwise the recorded address may be the proxy address. The registry is sensitive data: keep the host private, restrict filesystem access, and apply retention/deletion rules appropriate to your users.

## Run as a local web app

Requirements: Node.js 20+.

```sh
cd voiceconnect-p2p
npm install
npm start
```

Open http://localhost:8787 in two browser profiles/devices. Join the same room and enable camera/microphone. For camera and microphone on remote devices, deploy behind HTTPS/WSS.

## Desktop builds (Windows / Linux / macOS)

Install Node.js 20+ and npm on the target build OS, then:

```sh
npm install
npm run desktop
npm run build:win
npm run build:linux
npm run build:mac
```

Electron Builder generally produces platform-native packages on its corresponding host OS. Build Windows installers on Windows, Linux packages on Linux, and macOS packages on macOS; macOS signing/notarization requires Apple developer credentials. Cross-compiling all three from one host is not guaranteed.

The Electron wrapper starts the local signaling/static server and opens the UI. The app remains a networked P2P client: for multi-device calls, peers still need a reachable signaling endpoint or a separately deployed server. Configure `PORT` if the default is occupied.

## Proxy, firewall traversal and VPN

- Electron can use `HTTPS_PROXY` / `HTTP_PROXY` for app/signaling traffic. This does not tunnel WebRTC's UDP media packets.
- Browser WebRTC ICE attempts direct routes using STUN. When firewalls or symmetric/carrier NAT prevent direct connectivity, configure a TURN server, preferably `turns:` over TCP/TLS port 443. TURN relays encrypted media; it is not a media mixer.
- The UI accepts TURN URL and credentials for the current session. Production should issue short-lived TURN credentials from an authenticated backend, not embed static secrets in the client.
- A true embedded VPN requires privileged OS tunnel interfaces, routing, DNS handling, permissions and platform-specific signing. A browser app cannot install or operate those safely. Use a system VPN such as WireGuard/OpenVPN or build a separately signed native tunnel service and connect this app through it. This project does not claim to include a VPN client.
- For strict networks, configure TURN/TLS and optionally run the signaling endpoint behind a reverse proxy reachable on TCP 443.

## Security and operational limitations

- The JSON peer registry is opt-in but stores IP addresses and profile metadata. Do not enable it without clear consent, a retention policy, secure host access and an appropriate privacy notice.
- The sample room service is not production-authenticated. Room names are not access tokens. Add authentication, room authorization, abuse controls, origin checks, rate limits and TLS termination before public deployment.
- TURN configuration entered in the browser is session-only; secrets are not persisted.
- Peer mesh bandwidth increases with participant count; the current room cap is eight and is not a performance guarantee.
- No automated browser-to-browser, firewall matrix, proxy, or VPN integration test has been executed in this commit.

## License

No DirectX SDK sample source is included. Add a project license before redistribution.


## Local image avatars and duplicate nicknames

Choose a PNG, JPEG, WebP or GIF image using the avatar picker. The image is decoded and resized locally to a maximum 512-pixel edge and WebP before being saved in this browser profile; it is not uploaded as a file to a third-party image host. When you join a room, the optimized avatar is sent to the room signaling service and other participants. The server bounds avatar payload size. Use a small image and remember that room participants can see it.

Nicknames are display labels and are deliberately **not unique**. Each browser profile receives a persistent UUID/GUID stored locally. The server also assigns a unique connection peer ID for each session. Peer cards display the nickname plus the first eight characters of the user GUID, so two people may both be “Alex” without being confused. Registry records are updated by user GUID rather than nickname.

## Build and run on Windows

Install Node.js 20 LTS or newer, then double-click one of these files from File Explorer:

- `build-windows.bat` — installs dependencies if needed, runs syntax checks, then creates the Windows NSIS installer and portable executable in `dist\\`.
- `run-windows.bat` — starts the local signaling/web server for browser use.
- `desktop-windows.bat` — launches the Electron desktop application.

Or run them from Command Prompt. Build macOS packages on macOS and Linux packages on Linux using the npm scripts above; Windows batch files do not cross-compile those operating systems.
