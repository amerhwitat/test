## Latest candidate evidence — commit 2d551f2440c41ecac8cc455429ecf991a37aa63e (2026-10-31)

This is the current source candidate. The following three workflows completed successfully on this exact SHA:

- [Cross-platform validation #41182742327](https://github.com/amerhwitat/test/actions/runs/41182742327): PASS.
- [Security analysis #41182742208](https://github.com/amerhwitat/test/actions/runs/41182742208): PASS (CodeQL analysis, dependency audit, secret scan and SBOM job).
- [Python/Web/Aurora #41182742197](https://github.com/amerhwitat/test/actions/runs/41182742197): PASS (Python 3.8, Python 3.14, Node/Web and native Aurora).

Verified platform outputs and acceptance steps:

- Linux desktop: build and artifact upload PASS.
- macOS desktop: build and artifact upload PASS; unsigned preview only.
- Windows desktop: npm tests and base package build PASS; Direct3D 11 and OpenGL variants PASS; MSI install/uninstall verification PASS; packaged GUI startup PASS; diagnostics upload PASS.
- Browser extension validation and packaging: PASS.
- Native Java, Python and C++ companion chat-client build checks: PASS.
- Production Compose/container/Caddy configuration checks: PASS; no production deployment.
- CycloneDX SBOM and Gitleaks scan artifacts generated; dependency audit and CodeQL jobs PASS.

Important qualification: a successful CodeQL workflow run means the analysis job completed, but it does not by itself prove that all previously reported PR alerts are closed or formally dispositioned. The code-scanning alert inventory could not be independently retrieved through the available repository interface in this pass. Keep any outstanding alert/review finding open until inspected in GitHub Security > Code scanning.

Preview artifacts (GitHub login/repository access may be required; artifacts expire according to GitHub retention):

- [Windows desktop package](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13036600045) — 1.56 GB.
- [Windows Direct3D 11 variant](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13036425508).
- [Windows OpenGL variant](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13036370554).
- [Windows diagnostics](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13035855753).
- [macOS desktop package](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13035453531).
- [Linux desktop package](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13034594842).
- [Browser extensions](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13034944067).
- [Native chat clients](https://github.com/amerhwitat/test/actions/runs/41182742327/artifacts/13035303821).
- [CycloneDX SBOM](https://github.com/amerhwitat/test/actions/runs/41182742208/artifacts/13034609652).
- [Gitleaks SARIF report](https://github.com/amerhwitat/test/actions/runs/41182742208/artifacts/13035767059).

These are pull-request CI preview artifacts, not signed production release assets. They are not evidence of physical-device acceptance, production deployment, signing/notarization, or independent security review.

# VoiceConnect release-gate status

Last updated: 2026-10-31
Release status: **BLOCKED — preview only; not production-certified**

This file records verified evidence, not intended behavior. Source changes, queued jobs, simulated tests, container builds, and generated packages do not count as physical-device or production acceptance.

## Historical candidate evidence — superseded by the latest candidate above

Candidate commit: `90371ef0a48cfd00d5232147c0c4d6488be9d95b`.
Cross-platform workflow run: [#41181548364](https://github.com/amerhwitat/test/actions/runs/41181548364).

- Linux desktop package build and artifact upload: PASS.
- macOS desktop package build and artifact upload: PASS. This is an unsigned CI preview package, not a signed/notarized release.
- Browser extension validation/package: PASS.
- Native companion chat client builds: PASS.
- Production infrastructure Compose/container/Caddy validation: PASS; no production deployment occurred.
- Windows npm tests: PASS. Windows base package build is still running; MSI install/uninstall, packaged GUI startup and Windows artifact upload have not yet run.
- CodeQL on this candidate: FAIL — reports 3 high-severity and 2 medium-severity alerts in PR #8. Treat all as release blockers until each alert is inspected, fixed or formally dispositioned with evidence, and a clean scan passes. The available check summary does not include sufficient alert detail to safely prescribe source edits.
- The workflow's dependency audit steps passed on the Linux/macOS jobs. This does not clear CodeQL findings or constitute an independent review.

Preview artifact pages (GitHub login and repository access may be required):
- [Linux desktop](https://github.com/amerhwitat/test/actions/runs/41181548364/artifacts/13035541279)
- [macOS desktop](https://github.com/amerhwitat/test/actions/runs/41181548364/artifacts/13035172130)
- [Browser extensions](https://github.com/amerhwitat/test/actions/runs/41181548364/artifacts/13035546093)
- [Native chat clients](https://github.com/amerhwitat/test/actions/runs/41181548364/artifacts/13035581040)

These are preview downloads from a pull-request run, not public production release assets. Artifact retention and repository access controls apply.

## Automated source and CI controls

- `voiceconnect-p2p/package-lock.json` is committed. The lockfile workflow generated it and a clean `npm ci --ignore-scripts` verification passed in run #41120372384.
- Desktop CI uses the committed lockfile when present and Node 24.22.1. Dependency audit reports must be valid, complete JSON; missing/incomplete/error reports fail closed. High and critical findings block builds.
- Electron is pinned to 45.2.0. A clean three-platform audit for the current final commit is still required; older Electron 41.x audit results do not prove the 45.2.0 dependency graph is clean.
- Windows CI builds base, Direct3D 11 and OpenGL variants, verifies MSI installation/uninstallation, and launch-tests packaged apps. These steps passed on source candidate `2d551f2440c41ecac8cc455429ecf991a37aa63e` in cross-platform run #41182742327; the documentation-only status update is commit `d1087673f608c2f7994e9e0a69d0e8c0ed533b46`.
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
