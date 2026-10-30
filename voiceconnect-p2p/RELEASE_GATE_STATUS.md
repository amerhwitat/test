# VoiceConnect release-gate status

Last updated: 2026-10-30
Release status: **BLOCKED — preview only; not production-certified**

This file records evidence, not aspirations. A source file, unit test, queued job, or generated package does not count as an integration or security acceptance result.

## Automated build and dependency gates

- Windows base, Direct3D 11 (Chromium ANGLE D3D11), and OpenGL (Chromium ANGLE OpenGL) package generation: previous CI attempt completed all three build steps successfully. Its MSI install/uninstall verification was cancelled before completion; GUI startup was therefore not run.
- Linux desktop packaging: passed in workflow run 41116676703.
- macOS desktop packaging: passed in workflow run 41116676703.
- Browser extensions and native companion chat clients: passed in workflow run 41116676703.
- Dependency audit from the previous resolved tree: macOS and Ubuntu each reported 2 high-severity vulnerable package entries, 0 critical. The direct finding was Electron; the transitive finding was extract-zip (symlink/archive path traversal advisories). npm reported Electron 41.10.7 as a non-major remediation candidate. Electron is now pinned to 41.10.7. The next cross-platform audit must prove the findings are gone; this change is not itself proof.
- CI now runs on Node 22, matching the `@electron/rebuild` and `node-abi` engine requirement (Node >=22.12.0), and fails builds if high or critical npm audit findings remain.
- Icon build dependencies `sharp` and `png-to-ico` are declared and pinned rather than installed as undeclared CI-only packages.
- A manually dispatched, branch-restricted workflow has been added to resolve `voiceconnect-p2p/package-lock.json`, verify it with `npm ci`, and commit it to this feature branch. It must be run and the resulting lockfile reviewed before reproducible dependency installation can be claimed.

## Physical-device acceptance — not yet evidenced

Run `FILE_TRANSFER_TEST_PLAN.md` on two physically separate devices using the deployed HTTPS/WSS signaling service. Attach sanitized logs, device/OS/browser versions, commit SHA, timestamps, and SHA-256 hashes for:

- camera and microphone consent, permission denial, device switching, and reconnect;
- two-way audio/video, direct call and room call, network changes, NAT traversal and TURN relay;
- file transfer at empty, sub-chunk, chunk-boundary, and 25 MiB sizes;
- oversize rejection, decline, corrupted chunk, concurrent offers, sender/receiver interruption and reconnect;
- Save As path selection, overwrite approval/decline, picker cancellation, and exact received-file hash;
- Windows base, Direct3D 11 and OpenGL package install/uninstall and GUI launch on a clean Windows 10/11 machine.

CI package generation is not physical-device evidence. No device test is marked passed here.

## Security review

- Re-run npm audit on all three OS runners after the Electron upgrade. Keep the high/critical gate enabled.
- Review the final lockfile and dependency provenance; run a full dependency/license/SBOM review.
- Conduct independent review of signaling authorization, room invitation token issuance/expiry, TURN credential exposure, renderer/IPC boundaries, WebRTC peer validation, file transfer resource limits, and chat encryption. Existing experimental chat encryption has not had an independent cryptographic audit.
- Test denial-of-service and abuse controls, including signaling rate limits, concurrent transfers, malformed chunks, oversized metadata, and reconnection storms.
- Validate HTTPS/WSS and TURN over the actual deployed infrastructure, including restrictive networks. The Compose/Caddy/coturn configuration is a deployment template; no production service or relay deployment is evidenced here.
- Do not claim global DHT/Kademlia discovery; discovery remains room-scoped.

## Signing and notarization — credentials and owner action required

- Windows: configure a valid Authenticode code-signing certificate as protected repository Actions secrets (for example, `CSC_LINK` and `CSC_KEY_PASSWORD`) or use a supported managed signing service. Verify the certificate subject, timestamped signatures, and signature status of the installer and executable.
- macOS: configure Apple Developer ID signing and notarization credentials as protected secrets (for example, `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`, or an App Store Connect API key). Sign, notarize, staple, and validate the DMG/app on a clean macOS machine.
- Never commit certificates, private keys, passwords, API keys, or provisioning profiles to the repository.
- No signing or notarization credentials were available to this automation. Packages remain unsigned unless CI evidence explicitly proves otherwise.

## Publication gate

A preview tag must not be created until the branch is merged to main, all platform jobs and audits pass, the lockfile is committed, Windows install/uninstall and GUI startup pass, physical two-device tests are recorded, security review is signed off, and the release signing decision is documented. Production release additionally requires successful signing/notarization and deployed HTTPS/WSS/TURN validation.
