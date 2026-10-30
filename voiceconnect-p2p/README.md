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


## Build artifacts and GitHub Releases

The cross-platform GitHub Actions workflow builds Windows (NSIS + portable), Linux (AppImage + .deb), and macOS (DMG + ZIP) packages and uploads each platform's outputs as workflow artifacts. It also compiles the Java, Python and C++ UTF-8 chat companion clients (not native WebRTC media implementations).

To publish a versioned GitHub Release, push a tag named `voiceconnect-vX.Y.Z` (for example `voiceconnect-v0.3.1`). The release workflow rebuilds all three desktop platforms, collects their outputs, generates `SHA256SUMS.txt`, and publishes the assets to the repository's GitHub Releases page. A release is only published if every platform package job succeeds. Do not create a release tag until the validation workflow is green.


## Multi-user meeting lobby and screen sharing

The lobby is room-based and supports up to eight concurrent participants in a peer-to-peer mesh. Participants joining the same room are automatically introduced to one another. Each participant may enable their camera and microphone, mute audio, disable video, and send UTF-8 chat messages to the room. Use a room name known to the invitees; production deployments should add authenticated invitations and room access controls.

The **Share screen** control uses the browser/Electron screen-capture permission prompt. A participant can share a display/window/tab, and the selected video track is renegotiated to each connected peer. Selecting **Stop sharing** or ending the operating-system share prompt restores the camera track when the camera is active. Screen audio capture is not included in this iteration. Screen capture requires a secure context (HTTPS or localhost) and explicit user permission.

This is a full-mesh design: each participant sends media to each other participant. Bandwidth and CPU use grow with room size; eight is a conservative demo cap, not an SFU-scale architecture. For larger meetings, deploy an SFU such as mediasoup, LiveKit or Janus, with authenticated signaling and TURN.


## TURN credentials (short-lived)

The signaling service exposes `GET /api/ice-servers`. If `TURN_URL` and `TURN_SHARED_SECRET` are configured on the server, it issues coturn-compatible REST credentials with a one-hour expiry using HMAC-SHA1. The shared secret is never sent to clients. Configure the TURN server with the same REST shared secret and set `TURN_URL=turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349?transport=tcp`. Optionally set `STUN_URL`. Without both TURN environment variables, only the configured STUN server is returned. Protect this endpoint with authenticated rate limiting before production; short-lived credentials reduce exposure but do not by themselves prevent abuse.

The browser requests this ICE configuration before opening its signaling WebSocket. Display capture now requests optional system audio as well as video; browser/OS support varies, and the user must explicitly grant capture permission.

## Security and deployment boundary

This repository is still a prototype, not a production conferencing service. Room names currently act as room selectors, not authenticated authorization. Before public use deploy behind HTTPS/WSS, configure a strict origin allowlist, authentication and room-scoped invitation tokens, per-account/room rate limits, abuse reporting, secure TURN, and persistent encrypted account storage. Never commit TURN secrets. Do not expose raw peer IPs in a public directory; the opt-in local registry is operator-local metadata.

## Scaling and native media

The built-in mesh is suitable only for small rooms. For larger meetings, add a separately deployed SFU (for example LiveKit, mediasoup or Janus) and route browser media through authenticated SFU room tokens; a mesh cannot be relabeled as SFU. The Java, Python and C++ programs remain UTF-8 chat companions. Native camera/microphone and screen sharing in those clients require platform WebRTC SDK bindings and separate device/media integration tests; compilation of the chat clients does not validate media functionality.


## Room authentication and invitation tokens

When `VOICECONNECT_AUTH_SECRET` is configured, joining a room requires a signed, room-scoped, unexpired invitation token. Generate one server-side with `POST /api/invitations`, JSON body `{"room":"team-room","ttlSeconds":3600}`, and an admin bearer token in `VOICECONNECT_ADMIN_SECRET`. Tokens use HMAC-SHA256, are scoped to one room and expire within at most 24 hours. The signing secret is never returned. Production startup refuses to run without a 32-character `VOICECONNECT_AUTH_SECRET`. Set `ALLOWED_ORIGINS` to exact comma-separated browser origins. HTTP, WebSocket upgrade, chat and signaling have basic in-memory rate limits.

This is an initial invitation gate, not a full account system: no OIDC login, user database, invitation revocation, durable session management or distributed rate limiter exists yet. Public deployment still needs HTTPS/WSS termination, strict proxy configuration, managed identity, shared rate-limit infrastructure and security review. Keep admin and signing secrets in deployment secret storage; never put them in the client bundle.


## Self-hosted production signaling + TURN deployment

A Docker Compose deployment skeleton is provided:
- `Dockerfile`: non-root Node service with a health check.
- `docker-compose.production.yml`: isolated signaling, Caddy HTTPS reverse proxy and coturn services.
- `Caddyfile`: automatic HTTPS for the configured public domain and secure response headers.
- `.env.production.example`: required secrets, public domain, TURN realm and public IPv4.
- `deploy-production.sh`: validates required configuration and starts the stack.

Deployment (Linux host with Docker Compose v2 and a public DNS name):
1. Copy `.env.production.example` to `.env.production`.
2. Set `DOMAIN`, `ACME_EMAIL`, `ALLOWED_ORIGINS`, `TURN_REALM`, `TURN_EXTERNAL_IP`, `TURN_URL`, and three independent random secrets. Generate secrets with `openssl rand -hex 32`.
3. Point the domain A/AAAA records at the host. Open TCP 80/443, UDP 3478, TCP 3478 and UDP 49160–49200 in both cloud and host firewalls.
4. Run `./deploy-production.sh`.
5. Verify `https://DOMAIN/api/health` and `https://DOMAIN/api/ice-servers` from an external network. Confirm `turnConfigured: true`.
6. Generate a room invitation with the admin API and join from a second device/network. Force relay-only ICE on both clients for a genuine TURN test (the current UI does not yet expose a relay-only toggle; use browser automation/devtools or the documented test harness).

Important: this Compose template currently provisions coturn UDP/TCP on port 3478, not TURN/TLS on 443. TURN/TLS needs a certificate and listener configuration that are deliberately not advertised here. The stack is a deployment template; no live server, DNS name, credentials or firewall have been provisioned by this repository change. Do not expose it publicly until you have set real secrets and completed an external security review.

The built-in health endpoint reports signaling process health and whether TURN is configured. It does not prove media relay works.


### Optional GitHub Actions deployment

The manual workflow `.github/workflows/voiceconnect-deploy-production.yml` deploys this feature branch over SSH after an operator explicitly types `DEPLOY`. Configure a protected GitHub Environment named `production` and these environment secrets/variables before running it.

**Secrets**
- `VOICECONNECT_SERVER_HOST`: server DNS name or public IP.
- `VOICECONNECT_SERVER_USER`: dedicated deployment account (must be able to run Docker Compose).
- `VOICECONNECT_SERVER_SSH_KEY`: private key for that account.
- `VOICECONNECT_SERVER_KNOWN_HOSTS`: pre-verified SSH host-key line(s); do not use an unverified ssh-keyscan result.
- `VOICECONNECT_TURN_SHARED_SECRET`: coturn REST secret (32+ characters).
- `VOICECONNECT_AUTH_SECRET`: invitation-signing secret (32+ characters).
- `VOICECONNECT_ADMIN_SECRET`: admin API secret (32+ characters).

**Variables**
- `VOICECONNECT_DOMAIN`: public DNS hostname.
- `VOICECONNECT_ACME_EMAIL`: certificate contact email.
- `VOICECONNECT_TURN_EXTERNAL_IP`: public IPv4 address used by coturn.

The host must already have Docker Engine with Compose v2, Git, a dedicated non-root deployment account, and firewall/DNS configured. Point the domain A record at the host and allow TCP 80/443, UDP/TCP 3478 and UDP 49160–49200. Use a protected environment and review who can invoke deployments. The workflow transfers the environment file over SSH and runs the deployment script; it does not provision the VPS, DNS records, cloud firewall, or SSH account.

The workflow verifies HTTPS health, TURN credential issuance and invitation issuance after deployment. These HTTP checks are not a substitute for actual ICE relay tests or two-device camera/microphone/screen/system-audio acceptance. Collect those separately before declaring production-ready.
