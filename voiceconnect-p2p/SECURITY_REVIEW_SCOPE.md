# VoiceConnect independent security review scope

**Review status: NOT STARTED.** This is a review brief, not a security certification.

## Reviewer independence
The reviewer must be independent of the implementation author, identify relevant application-security and WebRTC/cryptography experience, and issue a dated report tied to an exact commit SHA. Automated CI and author self-review do not satisfy this requirement.

## Systems and trust boundaries
- Browser extension popup, permissions and message boundaries.
- Electron main process, preload bridge, renderer, IPC allowlist and native file-save dialog.
- Signaling HTTP API and WebSocket /signal endpoint.
- Room invitation creation, HMAC signature verification, expiry and room admission.
- WebRTC peer connections, SDP/ICE forwarding, room isolation and peer identity.
- STUN/TURN credential generation, expiry, shared-secret handling and relay configuration.
- File offers, chunk framing, transfer state, memory reservation, timeouts, cancellation and SHA-256 validation.
- Nickname/avatar/profile persistence and optional address sharing.
- Chat plaintext and experimental encrypted-chat implementation.
- Docker Compose, Caddy reverse proxy, coturn, container privileges, network exposure and secret delivery.
- CI workflows, dependency lockfile, SBOM, build artifacts, signing and release publication.

## Required review activities
1. Threat-model malicious room members, unauthenticated Internet clients, compromised dependencies, malicious files, replay, resource exhaustion, stolen invitations and leaked deployment credentials.
2. Verify authorization and ensure invitation checks cannot be bypassed by direct WebSocket messages, reconnects or peer exchange.
3. Test origin validation, WebSocket payload limits, HTTP body limits, rate limits, connection/room caps, malformed JSON, invalid UTF-8, oversized fields and reconnect storms.
4. Review HMAC key management, invitation token entropy/expiry/replay semantics, TURN REST credential lifetime, secret rotation and timing-safe comparisons.
5. Review Electron context isolation, sandboxing, preload API surface, navigation, external links, IPC sender validation, path traversal and overwrite races.
6. Review file-transfer state transitions, duplicate/out-of-order chunks, memory accounting, timeout races, channel closure, malformed base64, hash mismatch and Save As cancellation.
7. Perform a cryptographic design review of chat encryption: KDF parameters, salt/nonce lifecycle, key derivation, authentication, replay handling, metadata leakage and key rotation. Do not call it end-to-end secure until independently reviewed.
8. Review browser-extension permissions, content-script scope, messaging origin validation and storage.
9. Review container hardening, exposed ports, Caddy headers, coturn relay ranges, host firewall, SSH deployment and backup/restore.
10. Review dependency provenance, SBOM, known vulnerabilities, licenses, build provenance, signing, notarization and artifact integrity.
11. Perform authorized dynamic testing against a non-production deployment, including abuse/rate-limit tests and WebRTC relay tests. Do not test third-party systems or production users without written authorization.

## Privacy-specific implementation check
- Verify profile persistence stores only the minimum data explicitly consented to.
- The branch omits observed IP from the persisted peer registry unless address sharing is explicitly enabled. A unit test covers both consent states; verify this end-to-end and inspect retention of pre-existing registry entries.
- Confirm IP addresses, invitation tokens, TURN credentials, media and file contents are not logged or exposed in diagnostics.

## Findings register
| ID | Severity | Component | Reproduction | Impact | Remediation | Retest |
|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## Reviewer attestation
- Reviewer name and organization:
- Relevant qualifications:
- Conflict-of-interest statement:
- Commit SHA reviewed:
- Test environment:
- Date:
- Report URL / immutable artifact digest:
- Critical/high findings outstanding:
- Residual risk accepted by:
- Reviewer signature:

**Release gate:** no production security sign-off while the review is unperformed, findings remain unresolved, or the report does not identify the exact reviewed commit.

- Legacy peer registry migration strips previously persisted `observedIp` values because older versions did not record whether address-sharing consent was enabled. Confirm the migration on an upgrade test with a populated persistent volume.
