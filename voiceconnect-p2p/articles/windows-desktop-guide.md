# Installing and troubleshooting the VoiceConnect Windows desktop app

*Technical guide · 31 October 2026*

This guide covers building and checking the Windows Electron desktop application. It does not imply that a particular installer is signed or that a release is production-certified.

## Requirements

- A supported 64-bit Windows installation.
- Node.js 20 or newer for source builds (the CI workflow pins its own Node version).
- Network access to the configured signaling service for multi-device meetings.
- A working camera and microphone if you intend to use audio/video.

## Build from source

From a PowerShell or Command Prompt window:

```powershell
cd voiceconnect-p2p
npm ci
npm test
npm run build:win
```

The Windows build workflow also creates Direct3D 11 and OpenGL variants and performs package/install/startup checks. Build outputs are written under `dist\`. The exact output names depend on the Electron Builder configuration and workflow.

## First launch and permissions

1. Launch VoiceConnect from the installed application or portable build.
2. Choose a nickname and, if desired, a local avatar.
3. Join a room using the name shared by the other participants.
4. Select the intended microphone and camera.
5. When Windows or the application asks for camera or microphone access, grant only the permissions you intend to use.
6. Use the in-app mute and camera controls to stop sending the corresponding track.
7. Start screen sharing only when needed, choose the intended display/window, and stop sharing when finished.

A permission prompt may be controlled by Windows privacy settings as well as the application. Denying permission should not be treated as consent; open Windows Settings and review the Camera and Microphone privacy controls if a device is unavailable.

## If a button does not respond

Try these checks in order:

1. Confirm the window is not covered by another dialog or an invisible overlay.
2. Resize or maximize the window and retry.
3. Check that the control is enabled; some actions are intentionally unavailable until a room or media device is ready.
4. Restart the application and retry before joining a room.
5. Record the app version/commit and the exact control, screen state, and steps that reproduce the problem.

The project CI now includes a packaged-Windows GUI test that uses Chromium's mouse-input dispatch and checks whether selected click handlers actually run. A passing automated test is useful evidence, but it does not replace testing on different Windows display scales, hardware, accessibility settings, and physical devices.

## Troubleshooting connectivity

VoiceConnect uses a signaling connection to introduce participants and WebRTC ICE to establish media paths. A successful window launch does not guarantee that two peers can connect. Firewalls and NAT may require a correctly configured TURN server. The desktop HTTP proxy settings do not automatically tunnel WebRTC UDP media.

For a real multi-device test, use two separate devices and preferably two distinct networks. Verify signaling, ICE candidate selection, media in both directions, and screen-sharing behavior. Do not publish private signaling URLs, room invitations, TURN credentials, or raw peer IPs in support requests.

## Download and trust

Use only artifacts linked from the project's official GitHub Actions run or GitHub Release. CI artifacts may require GitHub access and expire according to their retention policy. Unsigned preview packages can trigger Windows SmartScreen or publisher warnings; do not bypass a warning unless you have verified the artifact's origin and checksum. A production Windows release must pass the Authenticode signature gate.
