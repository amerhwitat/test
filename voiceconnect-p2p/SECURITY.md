# Security policy and review status

## Supported security boundary

VoiceConnect is a peer-to-peer conferencing prototype. WebRTC data channels provide transport encryption (DTLS); this protects data in transit between established peers. The application still relies on its signaling service for room membership and peer connection setup. Signaling, room authorization, invitation issuance, profile metadata, local storage, Electron IPC, operating-system file dialogs, and deployment infrastructure remain separate security boundaries.

File-transfer controls currently include explicit receiver approval, a 25 MiB per-file cap, a 50 MiB aggregate incoming reservation cap, four concurrent incoming offers, bounded 12 KiB chunks, bounded control messages, filename path-separator/control-character rejection, backpressure, and SHA-256 integrity verification before Save As. The Electron save IPC validates the sender frame, canonical Base64 and decoded size before opening the native Save dialog.

SHA-256 is an integrity check against accidental corruption or in-transit modification; it is not malware detection and does not independently establish the sender's real-world identity. File name, MIME type, and digest are untrusted peer-supplied metadata. The application does not execute received files.

## Threats and residual risks

- A malicious or compromised peer can send malware, exploit a vulnerable file parser, or socially engineer a recipient into opening a dangerous file.
- A compromised signaling server can disrupt or misroute session setup and expose metadata. WebRTC transport encryption does not secure the signaling service itself.
- Browser fallback downloads may use the browser's configured download directory rather than an interactive Save As picker.
- Browser save pickers require a secure context and a user gesture; browser support and overwrite prompts vary.
- The current in-memory transfer protocol has no resume, durable partial-file store, transfer receipt persistence, or cryptographic signed file manifest. Disconnects abort active transfers.
- The current mesh architecture and deployment template have not received an independent penetration test or formal security audit.
- Global DHT discovery, authenticated public bootstrap infrastructure, relay-only NAT traversal acceptance, hardware GPU compatibility, Windows Authenticode signing, macOS signing/notarization, and live production deployment remain separate release gates.

## Required release review

Before a production release, reviewers must verify:

1. All control messages are schema-validated, bounded and scoped to the expected peer/channel and transfer identifier.
2. Transfer memory reservations are released on reject, cancel, digest failure, timeout, disconnect, and page shutdown.
3. Sender UI reports delivery only after receiver integrity confirmation; a local send call is not a delivery receipt.
4. Save operations are user-initiated, constrained to a user-selected destination, and have tested cancel/overwrite behavior. No silent overwrite or path traversal is permitted.
5. Electron IPC checks the trusted sender frame and validates all payload fields; renderer privileges remain disabled and context isolation stays enabled.
6. Signaling uses HTTPS/WSS, exact origin allowlists, authenticated room-scoped invitations, short-lived TURN credentials, rate limits and secure secret storage.
7. Logs do not expose file contents, credentials, invitation tokens, or unnecessary peer IP/profile data.
8. Dependency, static-analysis, SAST, dependency-audit, secret-scanning and platform installer checks pass. A qualified reviewer completes a manual security review and records findings/remediation.
9. Two-device large-file, interrupted-transfer, Windows installer/Save As/overwrite, browser save-picker, restrictive NAT/TURN, and physical GPU tests pass with retained evidence.

## Safe file handling guidance

Scan received files with current endpoint protection before opening them. Keep Windows Defender or the organization's endpoint security current; keep macOS system protections and OS updates current; use distribution-approved security tools on Linux. Do not disable protection or bypass quarantine, SmartScreen, Gatekeeper, or browser warnings. Treat executables, scripts, macro-enabled documents, archives and password-protected archives as high risk. See the README's **File safety and malware scanning** section.

## Reporting vulnerabilities

Do not publish exploit details or sensitive user data in public issues. Use GitHub's private vulnerability reporting feature for this repository if enabled, or contact the repository maintainer privately through a verified channel. Include affected commit/version, reproduction steps, impact, and any relevant logs with secrets and personal data removed. Do not attach live malware to a public issue.

## Review status

This document is a security review checklist and threat-model summary, not an attestation that a third-party audit has occurred. No independent penetration test, formal cryptographic audit, malware scanning integration, or production acceptance sign-off is claimed.
