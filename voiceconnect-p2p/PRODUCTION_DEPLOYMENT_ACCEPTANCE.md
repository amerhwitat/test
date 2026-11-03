# VoiceConnect production deployment acceptance

**Status: NOT DEPLOYED / NOT VERIFIED.** Deployment is deliberately manual and gated by the protected GitHub `production` environment.

## Before enabling the production environment
- Merge the reviewed code to `main`; the deploy workflow checks out and deploys `main`, never the feature branch.
- Configure required reviewers on the GitHub `production` environment so the deploy job requires human approval.
- Configure Actions secrets: `VOICECONNECT_SERVER_HOST`, `VOICECONNECT_SERVER_USER`, `VOICECONNECT_SERVER_SSH_KEY`, `VOICECONNECT_SERVER_KNOWN_HOSTS`, `VOICECONNECT_TURN_SHARED_SECRET`, `VOICECONNECT_AUTH_SECRET`, `VOICECONNECT_ADMIN_SECRET`.
- Configure Actions variables: `VOICECONNECT_DOMAIN`, `VOICECONNECT_ACME_EMAIL`, `VOICECONNECT_TURN_EXTERNAL_IP`.
- Use a dedicated least-privilege deployment account and a pinned SSH host key. Restrict inbound SSH to the deployment runner strategy where practical.
- Generate unique random secrets of at least 32 characters. Never reuse the sample values in CI or documentation.
- Set DNS A/AAAA records to the host and ensure ports 80/tcp, 443/tcp, 443/udp, 3478/tcp+udp and relay UDP 49160–49200 are correctly routed and firewalled.
- Confirm the host has supported Docker Engine and Docker Compose, adequate disk capacity, backups for persistent volumes and an incident/rollback owner.

## Deployment
1. Review the exact `main` commit and the release-gate report.
2. Dispatch `VoiceConnect production deploy` and enter `DEPLOY`.
3. Approve the protected `production` environment deployment only after checking the commit and change window.
4. The workflow checks required secrets, transfers a mode-0600 environment file, deploys Compose, then verifies HTTPS health, TURN credential configuration, admin invitation issuance and a WSS signaling welcome handshake.
5. The deployment workflow does not prove media relay quality or NAT traversal. Perform real ICE/TURN allocation and two-device call tests from networks outside the server's network.

## Post-deployment checks
- Verify the certificate chain and expiry from an external network.
- Verify `/api/health` reports `ok:true` and TURN configured.
- Verify `/api/ice-servers` issues short-lived credentials and never cache/log the credential response.
- Verify an authorized admin can issue a short-lived invitation; verify unauthorized callers cannot.
- Verify WSS `/signal` connection, origin rejection and room invitation enforcement.
- Verify TURN UDP and TCP allocations using authenticated clients from a second network, then verify actual WebRTC relay candidate selection.
- Verify coturn relay port range is reachable, firewall rules are narrow, and no unintended container ports are exposed.
- Verify restart recovery, persistent volume ownership, log rotation, monitoring, backup and restore.
- Record commit SHA, image digest, domain, UTC test time, sanitized logs and tester sign-off.

## Rollback
- Keep the previous image digest and a tested deployment bundle.
- Roll back to the last known-good `main` commit using the same reviewed deployment procedure.
- Do not delete persistent volumes during rollback.
- Rotate TURN, auth and admin secrets immediately if exposure is suspected; revoke outstanding invitations by rotating the invitation signing secret.

Production is not accepted until the above checks and the two-device evidence template are completed. A healthy HTTP endpoint or a successful container build alone is insufficient.
