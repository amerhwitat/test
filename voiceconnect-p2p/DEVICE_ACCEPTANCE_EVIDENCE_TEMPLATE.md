# VoiceConnect two-device acceptance evidence

**Status:** NOT RUN — populate only after tests on two physically separate devices.

## Run metadata
- Tested commit SHA:
- Test date/time (UTC):
- Test operator:
- Signaling deployment URL:
- Deployment version/image digest:
- Test report ID:

## Device A
- Hardware/model:
- OS and build:
- Browser/app version:
- Network (Wi-Fi/mobile/ethernet):
- Public network/NAT notes (do not record public IPs in public artifacts):

## Device B
- Hardware/model:
- OS and build:
- Browser/app version:
- Network (Wi-Fi/mobile/ethernet):
- Public network/NAT notes:

## Test results
Use PASS / FAIL / BLOCKED / NOT RUN. Attach sanitized logs and SHA-256 values; do not attach private files, access tokens, TURN credentials, invitation tokens, or personal media.

| Test | Result | Timestamp | Evidence / SHA-256 | Notes |
|---|---|---|---|---|
| Camera consent and denial | NOT RUN | | | |
| Microphone consent and denial | NOT RUN | | | |
| Device switching and reconnect | NOT RUN | | | |
| Direct call audio/video | NOT RUN | | | |
| Room call audio/video | NOT RUN | | | |
| Screen-share consent and stop | NOT RUN | | | |
| Different NATs / TURN relay | NOT RUN | | | |
| TURN over UDP | NOT RUN | | | |
| TURN over TCP | NOT RUN | | | |
| Empty file transfer | NOT RUN | | | |
| Small and chunk-boundary files | NOT RUN | | | |
| 25 MiB file and SHA-256 | NOT RUN | | | |
| Oversize file rejected | NOT RUN | | | |
| Decline and interrupted transfer | NOT RUN | | | |
| Reconnect starts a clean transfer | NOT RUN | | | |
| Save As / overwrite / cancel | NOT RUN | | | |
| Stalled offer/transfer expiry | NOT RUN | | | |
| 50 MiB aggregate receive cap | NOT RUN | | | |
| Windows MSI install/uninstall | NOT RUN | | | |
| Windows GUI launch after install | NOT RUN | | | |
| Windows D3D11 and OpenGL variants | NOT RUN | | | |

## Integrity evidence
- Sender file SHA-256:
- Receiver saved-file SHA-256:
- Exact byte count:
- Match confirmed by independent sha256sum / Get-FileHash:
- Sanitized browser/Electron logs attached:

## Sign-off
- Tester:
- Independent witness:
- Security reviewer:
- Exceptions / unresolved defects:

A case may be marked PASS only with repeatable evidence from the two physical devices. A CI run, simulator, mocked camera, or same-host browser tabs do not satisfy this acceptance gate.
