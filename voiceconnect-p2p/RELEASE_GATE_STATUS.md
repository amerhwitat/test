# VoiceConnect release-gate status

Last updated: 2026-10-30
Release status: **BLOCKED — preview only; not production-certified**

This file records verified evidence, not intended behavior. Source changes, queued jobs, simulated tests, container builds, and generated packages do not count as physical-device or production acceptance.

## Automated source and CI controls

- `voiceconnect-p2p/package-lock.json` is committed. The lockfile workflow generated it and a clean `npm ci --ignore-scripts` verification passed in run #41120372384.
- Desktop CI uses the committed lockfile when present and Node 24.22.1. Dependency audit reports must be valid, complete JSON; missing/incomplete/error reports fail closed. High and critical findings block builds.
- Electron is pinned to 45.2.0. A clean three-platform audit for the current final commit is still required; older Electron 41.x audit results do not prove the 45.2.0 dependency graph is clean.
- Windows CI is configured to build base, Direct3D 11 and OpenGL variants, install/uninstall each MSI, and launch-test each packaged app. A prior run did not complete those acceptance steps. Require a fresh green run on the latest commit.
- Infrastructure CI validates Compose interpolation, builds the production signaling container and validates Caddy configuration. This does not prove DNS, TLS, external firewall, TURN allocation or real media relay.
- `voiceconnect-security.yml` adds CodeQL JavaScript/TypeScript analysis, a lockfile-based `npm audit --audit-level=high` gate, Gitleaks history scanning and CycloneDX SBOM generation. GitHub Dependency Review was removed after its action reported that this repository's dependency graph is disabled. The replacement audit does not depend on that setting. The workflow must pass on the final commit; no independent security review is implied.
- `voiceconnect-release.yml` requires clean npm audit, npm tests, Windows Authenticode signatures, macOS code-signature verification, Gatekeeper assessment and notarization stapling. A release tag must point to a commit reachable from `main`.
- Preview publication in `voiceconnect-build.yml` remains explicitly labeled unsigned and prerelease. It requires the tagged commit to be reachable from `main` and complete platform audit artifacts.

## Two-physical-device acceptance — NOT RUN

Use `DEVICE_ACCEPTANCE_EVIDENCE_TEMPLATE.md` and `FILE_TRANSFER_TEST_PLAN.md` on two separate physical devices and distinct user profiles. Test camera/microphone consent and denial, device switching, direct and room calls, screen sharing, different NATs, authenticated TURN UDP/TCP relay, 25 MiB transfers, hashes, Save As, overwrite/cancel, interruptions, reconnect, expiry and memory caps. Record OS/browser/app versions, commit SHA, UTC timestamps, sanitized logs and hashes. A CI browser process or same-host test is not a substitute.

No physical-device results are claimed. Actual hardware, two separate networks and human operation are required.

## Signing and notarization — OWNER CREDENTIALS REQUIRED

Configure protected Actions secrets for Windows (`WINDOWS_CSC_LINK`, `WINDOWS_CSC_KEY_PASSWORD`) and Apple (`MACOS_CSC_LINK` or `APPLE_CSC_LINK`, corresponding key password, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`) or a supported managed signing service. Never commit certificates or private keys. The signed release workflow verifies the signatures and notarization; it will fail closed when required credentials are absent or invalid.

No signing secrets were inspected or assumed to exist. No signed package, notarized application or trusted publisher identity is claimed.

## Live deployment — NOT DEPLOYED

`voiceconnect-deploy-production.yml` is a manual, protected-environment workflow. It checks deployment secrets, deploys only the `main` branch, and verifies HTTPS health, TURN credential configuration, admin invitation issuance and a WSS welcome handshake. It must not be dispatched until the code is merged, the `production` GitHub Environment has required reviewers, and the owner has configured all deployment secrets and variables.

See `PRODUCTION_DEPLOYMENT_ACCEPTANCE.md` for DNS, SSH, firewall, Caddy/TLS, coturn, monitoring, backup, external TURN allocation and rollback requirements. The HTTP health/ICE configuration checks do not establish actual TURN allocation or successful ICE relay. No production server, DNS, certificate, or external TURN test is claimed.

## Independent security and cryptographic review — NOT STARTED

`SECURITY_REVIEW_SCOPE.md` defines the independent review brief and required reviewer attestation. The review must cover signaling authorization, invitations, TURN credentials, WebSocket abuse controls, Electron IPC, browser extensions, file-transfer state/resource controls, container/deployment boundaries, dependency provenance and the experimental chat encryption design. The reviewer must be independent and report against an exact commit SHA. CodeQL, Gitleaks, dependency review, npm audit and SBOM generation are useful automated controls, not a penetration test or cryptographic audit.

No independent review, penetration test or cryptographic certification is claimed.

## Explicit functional limitations

- Discovery is room-scoped; no global Kademlia/libp2p DHT or global peer lookup service is implemented.
- TURN TLS on port 443 is not part of the current deployment template; the template uses TURN UDP/TCP on 3478 plus a configured UDP relay range.
- Java/Python/C++ companion clients are chat clients, not native WebRTC media clients.
- File transfers do not support resume after disconnect, offline inbox, folder transfer or malware scanning.
- Experimental encrypted chat is not independently audited and must not be marketed as certified end-to-end encryption.

## Publication decision

Keep PR #8 draft and unmerged until latest-commit automated workflows pass, all dependency advisories are reviewed, physical-device evidence is complete, an independent security reviewer signs off, and deployment and signing decisions are evidenced. Production release additionally requires signed/notarized packages and successful live HTTPS/WSS/TURN validation.

Do not create a production tag, merge, or publish on the basis of queued checks or source changes alone.
