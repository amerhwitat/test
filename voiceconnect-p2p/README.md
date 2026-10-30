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


### Provision a new Linux VPS (Hetzner Cloud)

A Terraform baseline is provided in `infra/hetzner/`. Defaults are Ubuntu 24.04, Hetzner location `fsn1` (Falkenstein), and server type `cx23`. Review current provider pricing, quotas, IPv4 charges, bandwidth and regional latency before applying; these defaults are a starting point, not a purchase authorization or a guaranteed price.

1. Create a Hetzner Cloud project and API token with only the permissions needed to create/manage servers, firewalls and SSH keys.
2. Generate an SSH key locally. Supply only its **public** key in `terraform.tfvars`; never commit the API token or private key.
3. Set `TF_VAR_hcloud_token` in your local shell or secret manager. Copy `terraform.tfvars.example` to `terraform.tfvars`, replace the public key and set `admin_cidrs` to your actual fixed SSH source IP CIDR (never leave the documentation example in place).
4. From `infra/hetzner`, run `terraform init`, inspect `terraform plan`, then `terraform apply` only after reviewing the resources and recurring cost.
5. Set the DNS A record for the chosen hostname to Terraform's `server_ipv4` output. Confirm DNS propagation. Configure the GitHub `production` environment variables/secrets documented above, including the resulting server address, deploy user `voiceconnect`, SSH private key and verified host key.
6. Deploy using the guarded workflow. Keep the SSH firewall source restricted to your admin CIDR.

The Terraform firewall opens TCP 80/443/3478, UDP 80/443/3478 and UDP 49160–49200; SSH is restricted to `admin_cidrs`. Reassess the unused UDP 80/443 rules and IPv6 exposure for your environment before apply. The bootstrap creates a non-root deployment account and installs Docker Engine/Compose; it does not configure DNS, obtain TLS, create provider billing, or deploy the app itself.

**Important:** No Hetzner account, API token, SSH key, billing authorization, domain or DNS zone is connected to this repository session. The VPS has not been created. Provisioning incurs provider charges and requires you to run/approve Terraform from your account.


## Desktop startup diagnostics and release signing

The Electron desktop shell binds its bundled UI service to an ephemeral loopback port and waits for the HTTP listener to report readiness before creating the main window. This avoids the previous startup race and avoids conflicts with another process using port 8787. Startup diagnostics are written to Electron's user-data directory under `logs/startup.log`; initialization failures display a native error dialog with the log location.

A Windows CI smoke test now launches the packaged `win-unpacked/VoiceConnect P2P.exe`, checks that the process remains alive, and requires the startup-complete log entry. This is automated runner evidence, not a substitute for testing the MSI installer, Windows Start-menu launch, upgrade/uninstall, real cameras/microphones, and screen capture on a user's physical Windows device.

Before creating a release tag, configure these GitHub repository Actions secrets:

- `WINDOWS_CSC_LINK`: base64-encoded PFX certificate or supported certificate URL for Authenticode signing.
- `WINDOWS_CSC_KEY_PASSWORD`: PFX password.
- `APPLE_CSC_LINK`: base64-encoded Developer ID Application certificate in P12 format or supported certificate URL.
- `APPLE_CSC_KEY_PASSWORD`: P12 password.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: Apple notarization credentials.

The release workflow fails closed if the Windows signing certificate or macOS Developer ID/notarization credentials are absent. Cross-platform PR validation builds remain unsigned and do not publish. Protect these secrets and rotate them according to your signing-key policy. A successful build is not evidence of successful signature verification or notarization; inspect the generated Windows signatures with SignTool and macOS packages with `codesign` / `spctl` / notarization status before publication.


## Camera, microphone, and desktop-sharing consent

VoiceConnect does not request camera or microphone access at page load. When the user activates **Enable camera & mic**, the app asks separately whether it may use the camera and whether it may use the microphone. Either device can be declined independently; the capture constraints include only approved devices. Electron desktop builds pass those explicit choices through a narrow preload IPC bridge, and the main process limits media permission grants to the trusted loopback UI origin. The browser/operating system may additionally present its own device permission prompt. Device tracks remain local until the user joins a room and publishes them; mute and camera-off controls remain available.

Screen sharing is a separate action. VoiceConnect first explains that desktop/window capture is about to begin and asks for approval. Only after approval does it call `getDisplayMedia`, which presents the platform's source-selection flow where supported. The user chooses the screen or window and can stop sharing using the app control or the platform's sharing indicator. System-audio capture depends on OS/browser support and the user's selection; it is not guaranteed on every platform. Declining device or screen access does not prevent text chat.

These app-level consent prompts supplement, and do not replace, the browser/OS permission controls. Users can revoke camera/microphone permission in operating-system privacy settings or browser site settings at any time.

Electron additionally validates the calling renderer's loopback origin and checks each requested media type against its separate consent before granting the corresponding permission. The renderer preload exposes only the narrow consent request method; Node integration remains disabled and context isolation remains enabled.


## Fully self-contained, no-paid-infrastructure mode

The Electron desktop application includes its own loopback UI/signaling process. It does not require a Hetzner account, cloud server, domain, DNS, API token, billing authorization, Docker host, or production secrets to launch. The embedded service is used only to serve the local desktop UI and to support the optional multi-participant room mode on that same service.

For a direct two-person call, use **Direct peer connection** instead of **Join a live meeting**:

1. Both participants open the desktop application. No account or hosted room is required.
2. Each participant enables the camera and/or microphone they choose to share. The app asks for explicit permission.
3. The caller selects **Create offer (caller)** and sends the generated connection text privately to the other participant.
4. The receiver pastes the offer and selects **Create answer (receiver)**, then sends the generated answer privately back.
5. The caller pastes the answer and selects **Apply answer (caller)**. When ICE succeeds, audio/video and chat use a direct WebRTC connection; chat travels over a WebRTC data channel.
6. Screen sharing is separately consented and uses the selected display/window capture source.

The offer and answer include gathered ICE candidates and must be exchanged as complete text. Keep the application open during exchange. Treat these blobs as private connection metadata: exchange them only with the intended participant and do not post them publicly. This direct mode is currently a two-peer/manual-signaling workflow; it does not provide automatic peer discovery, multi-party rooms, or a persistent public directory.

**Network limits:** direct mode uses the default public STUN service to attempt NAT discovery. STUN is not a media relay. No paid infrastructure or TURN account is required, but symmetric NAT, carrier-grade NAT, strict corporate firewalls, blocked UDP, and some VPN configurations can prevent a direct path. In those cases a TURN relay is required; without a TURN server, the application cannot guarantee connectivity on every network. A fully serverless design cannot guarantee traversal of restrictive NATs because some network pairs require a relay. Media is peer-to-peer when a direct route is established.

The standard shared-room mode remains optional and uses a signaling service for automatic discovery and room chat. It can be self-hosted on an existing computer/server without Hetzner, but remote peers need a reachable signaling endpoint. The desktop direct mode avoids that dependency for two participants. Static web hosting is still needed if you choose to distribute/run the browser version from a website; the installed desktop packages do not depend on public web hosting for their local UI.

The Hetzner Terraform, Docker Compose, Caddy and coturn files are optional deployment examples only. They are not required by the desktop app or direct connection workflow and are never automatically provisioned. No cloud resources are created and no billing is initiated by using direct mode.


## Nickname and avatar identity in calls and chat

Each participant can edit a display nickname (up to 32 characters) and choose a local PNG, JPEG, WebP or GIF avatar in **Profile & privacy**. The image is resized and compressed locally to a small WebP data URL; the original image file is not uploaded to an image-hosting service. The profile is stored in that app/browser's local storage and is reused on subsequent launches of the same profile. Select **Update profile** to broadcast changes to active room participants and direct-call peers.

- **Room conferences:** the signaling service distributes the current nickname, avatar and user GUID to participants. Peer video cards show the participant avatar and nickname, and room chat messages include the sender avatar and nickname.
- **Direct conferences:** after the WebRTC data channel opens, both clients exchange profile metadata directly. The remote participant's avatar and nickname appear above the remote video. Direct chat displays the sender's avatar and nickname, and profile changes are sent to the other participant.
- **Local privacy:** avatars are embedded in the profile/message payload and are visible to connected participants. The optional savePeer consent controls persistent server-side peer-registry storage; local profile storage does not require that consent. A nickname and avatar are display metadata, not verified identity or authentication. Users can change or remove the avatar at any time.


## Peer exchange and known contacts

VoiceConnect now supports **room-scoped peer exchange**. A participant may explicitly opt to share the IP address observed by the signaling endpoint. Only then is that address included in their room profile and exchanged with other members of that room. No public IP is inferred from browser ICE candidates, no unrelated network traffic is inspected, and the application does not scan IP ranges or probe arbitrary hosts.

In the Electron desktop build, choosing **Remember peer** stores the voluntarily shared address in the user's private application-data directory as `data/known-peers.json` (under Electron's per-user `userData` directory). The file is atomically replaced and created with owner-only permissions where the OS supports POSIX file modes. The list is loaded at startup and can be deleted entry-by-entry. Browser-only builds keep the list in local storage because browsers cannot safely write arbitrary files.

A saved IP address is an identity hint and last-observed signaling address, **not necessarily a reachable WebRTC endpoint**. WebRTC peers are normally reached using ICE candidate exchange and a signaling offer/answer; a browser cannot safely or reliably reconnect by opening an arbitrary TCP connection to the other participant's observed IP. Use a room invitation or private direct offer/answer exchange to reconnect.

This release implements room-scoped peer exchange, not a global internet-wide DHT crawler. The internet does not provide a legitimate list of all active chat users. A future global discovery mode should use a user-opt-in DHT namespace with signed Peer IDs, expiring address records, block lists, abuse controls and explicit address-publication consent. It must never enumerate unrelated devices.

## Optional chat encryption

The chat panel includes an opt-in shared-passphrase mode. It derives an AES-256-GCM key with PBKDF2-SHA-256 (310,000 iterations) and encrypts room and direct chat text before sending it. The passphrase is not transmitted to the signaling server; every participant must receive the exact same passphrase through a separate trusted channel. Wrong passphrases or modified ciphertext fail authentication. Message metadata (nickname, avatar, timing and any voluntarily shared IP) is not hidden by this chat option. This experimental passphrase mode has not received an independent cryptographic audit and should not be used as a substitute for a reviewed secure messenger.

WebRTC audio, video and data channels are already encrypted in transit by the WebRTC security architecture (DTLS-SRTP for media and DTLS for data channels). That transport encryption is mandatory in WebRTC; the application does not offer an insecure plaintext media mode. The passphrase switch controls the additional application-level encryption of chat text only. Use HTTPS/WSS for signaling so invitation tokens and profile updates are also protected in transit.

## DirectX 11 and OpenGL Windows variants

The Windows desktop build now has two separately packaged Chromium GPU-backend variants:

- `npm run build:win:directx` — Electron/Chromium ANGLE using the Direct3D 11 backend.
- `npm run build:win:opengl` — Electron/Chromium ANGLE using the OpenGL backend.
- `npm run build:win` — standard Windows NSIS, MSI and portable targets.

The variants use distinct Electron entry points, product names and output directories (`dist/directx` and `dist/opengl`). These are GPU-rendering backend builds of the same Electron/WebRTC application, not separate native DirectX 12 and OpenGL rewrites. Hardware support and fallback behavior must be verified on actual Windows GPU/driver combinations. Windows CI builds and archives both variants; successful CI packaging is required before release.

## External protocol research and code provenance

The implementation was informed by public protocol specifications and project documentation:

- BitTorrent BEP 5 describes Kademlia DHT peer routing; BEP 11 describes peer exchange after a swarm has been joined.
- libp2p documents Kademlia DHT, Identify, mDNS and opt-in rendezvous discovery as building blocks for decentralized peer identity and routing.
- Chitchatter demonstrates a GPL-2.0 WebRTC chat architecture with direct media and optional TURN fallback.
- aMule demonstrates eMule-compatible Kademlia and source exchange across desktop platforms.

No Chitchatter, aMule, eMule or BitTorrent client source files have been copied into this repository. Their licenses and protocol compatibility obligations are materially different; this implementation uses public protocol concepts and the existing WebRTC stack rather than importing copyleft source without a project-wide license decision. No third-party peer list or scraped IP database is bundled.


## Public IP lookup and invitation links

The lobby includes **Check my public IP**, which queries the external ipify JSON endpoint from the user's browser and displays the address returned by that service. This is the address visible to that lookup endpoint; VPNs, carrier NAT and ISP routing can affect it. VoiceConnect does not silently save it.

To include it in a meeting invitation, the user must check **Include my checked public IP in the invitation link** and create the link. The IP is placed in the URL fragment (`#shared-ip=...`), which browsers do not send in the initial HTTP request. Recipients can read it from the invitation, so users should share such links only with trusted people. The invitation is still room-scoped and requires a valid invitation token.

The IP is informational only. It does not create a port mapping, bypass NAT/firewalls, or guarantee that the recipient can dial the address. WebRTC ICE gathers and checks host, server-reflexive and relayed candidates; TURN is required for some restrictive NAT/firewall combinations. See RFC 8445 and RFC 8656.

## Browser extensions

The source includes lightweight Manifest V3 extensions:
- `extensions/chromium/` — Chrome and Microsoft Edge.
- `extensions/firefox/` — Firefox WebExtension with a Gecko extension ID.

The extension stores only the configured VoiceConnect origin and opens an invitation in a normal browser tab. It does not request page-reading, browsing-history, camera or microphone permissions. Set the server URL in the popup before opening meetings. Default development URL: `http://localhost:8787`.

Load unpacked:
- Chrome: `chrome://extensions` → enable Developer mode → Load unpacked → select `extensions/chromium`.
- Edge: `edge://extensions` → enable Developer mode → Load unpacked → select `extensions/chromium`.
- Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `extensions/firefox/manifest.json`.

Temporary Firefox add-ons are removed when Firefox restarts. Store publication/signing is a separate process; these source directories are not yet store-approved signed extensions. CI packages ZIP artifacts for distribution.

## Signed peer records and global discovery status

`discovery/peer-record.js` defines Ed25519-signed peer records with public-key-bound peer IDs, bounded multiaddress lists, and a maximum 15-minute expiry. Tests cover signature tampering, identity binding and expiry. These records are designed as the authenticated record format for a future libp2p Kademlia deployment.

**Important:** signed records alone are not a live global DHT. The current application still performs room-scoped signaling/peer exchange. A production public Kademlia network additionally needs a running libp2p node, reachable bootstrap peers, a record validator/namespace, peer routing, DHT publication/lookup, revocation/expiry propagation and a browser-compatible relay path. No VoiceConnect-operated bootstrap nodes or domain-independent DHT service are configured in this repository, so global discovery and cross-network DHT reconnection are not claimed as complete.

## Validation boundaries

GitHub Actions can compile/package and perform software startup and MSI smoke tests, but hosted runners do not prove behavior on a user's physical GPU, restrictive home router, carrier NAT or enterprise firewall. Actual Direct3D 11/OpenGL driver coverage, two-device audio/video, TURN relay-only, NAT combinations, upgrade from a previously installed release, and uninstall residue checks require dedicated hardware/network test runs. Do not publish a release as production-verified until those checks have recorded results.
