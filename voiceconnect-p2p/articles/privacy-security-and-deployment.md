# VoiceConnect privacy, security and deployment boundaries

*Security and operations article · 31 October 2026*

VoiceConnect handles live audio, video, chat, participant profile data, and signaling metadata. Deployers should understand which information is processed locally, which is shared with peers, and what remains an operational responsibility.

## Device permissions

Camera, microphone, and screen capture should be requested only when the user invokes the corresponding feature. The operating system or browser mediates access. Users should be able to deny permission and should stop capture when they no longer intend to share.

## Profile and participant information

Nicknames and avatars are stored in the local profile. When a participant joins a room, the profile information is shared with room peers. The optional peer registry can store the signaling server's observed remote address and profile metadata only when the relevant opt-in is enabled. A reverse proxy may affect which address the server observes; forwarded headers must not be trusted unless the proxy overwrites untrusted values.

IP addresses and profile metadata are sensitive operational data. Keep any registry private, restrict filesystem access, set a retention period, and provide an appropriate deletion process. Do not expose a raw peer registry as a public directory.

## Transport, signaling and chat

WebRTC media and data channels use WebRTC's transport security. The signaling service still needs TLS/WSS in a public deployment. The optional application-level chat encryption feature is experimental and has not been independently audited; it must not be marketed as certified end-to-end encryption.

Room names alone are not authentication. Where invitation-token mode is enabled, configure strong server-side secrets and exact allowed origins. Keep admin credentials, invitation-signing secrets, and TURN shared secrets in protected deployment secret storage. Never embed them in the client bundle or commit them to source control.

## TURN and network operations

STUN helps clients discover candidate network paths. TURN relays traffic when direct peer connectivity is unavailable. A configured TURN endpoint or a healthy HTTP endpoint does not prove that media relay works. Validate real allocations and ICE relay candidates from external networks. The repository deployment template currently documents TURN UDP/TCP on port 3478; it does not claim a configured TURN/TLS listener on port 443.

## Production checklist

Before inviting public users:

- Deploy signaling behind HTTPS/WSS with a strict origin allowlist.
- Enable authenticated accounts or room-scoped, expiring invitations.
- Apply per-user and per-room rate limits and abuse controls.
- Configure TURN with protected secrets, firewall rules, monitoring, and external relay tests.
- Protect and expire any opt-in peer registry data.
- Review Electron IPC, browser extension permissions, signaling authorization, file-transfer limits, and cryptographic design.
- Complete two-physical-device acceptance across distinct networks.
- Complete an independent security review against the exact release commit.
- Sign Windows binaries with Authenticode and sign/notarize macOS packages with valid Apple credentials.

## What current CI can and cannot establish

CI can build packages, run automated tests, scan dependencies and source, produce an SBOM, and validate deployment configuration. It cannot establish real-world camera/microphone behavior on every device, successful TURN relay across arbitrary networks, a production DNS/TLS deployment, an independent penetration test, or a signed publisher identity unless those specific gates and credentials are present.

Treat preview artifacts as test builds. A production release is appropriate only after all release gates are complete and the tagged commit is merged into the protected main branch.
