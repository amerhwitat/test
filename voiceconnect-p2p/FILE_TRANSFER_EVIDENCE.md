# VoiceConnect P2P file-transfer acceptance evidence

> Status: **PENDING — no physical-device acceptance is claimed by this template.**
>
> Complete this record only after running the test on the stated devices and saving the receiver-side evidence. Do not enter real names, public IP addresses, room tokens, invitation URLs, or other secrets.

## Build under test

- Repository: `amerhwitat/test`
- Branch: `feat/voiceconnect-p2p-camera`
- Commit SHA: `c6b99309e0b29415e3babc939e38aa628e5b1a4e`
- Workflow run: [cross-platform validation](https://github.com/amerhwitat/test/actions/runs/41106058951)
- Artifact name / download URL: **PENDING**
- App version: **PENDING**
- Test date (UTC): **PENDING**
- Tester initials or non-identifying label: **PENDING**

## Device and network matrix

| Role | Non-identifying device label | OS / version | App build | Network type |
|---|---|---|---|---|
| Sender | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| Receiver | **PENDING** | **PENDING** | **PENDING** | **PENDING** |

Confirm that sender and receiver are two distinct physical devices, not two windows or two processes on one host.

## Transfer acceptance cases

Record PASS only when the receiver's saved file is independently checked against the sender's original file (size and SHA-256). Attach sanitized logs or screenshots with personal data and invitation material redacted.

| Case | Procedure | Expected result | Status | Evidence / notes |
|---|---|---|---|---|
| FT-01 | Send a small binary file between the two devices | Receiver approves; bytes and SHA-256 match | **PENDING** | |
| FT-02 | Send a zero-byte file | Empty file is saved and hash matches | **PENDING** | |
| FT-03 | Send a file near the 25 MiB limit | Transfer completes within configured limit; hash matches | **PENDING** | |
| FT-04 | Attempt a file larger than 25 MiB | Sender/receiver rejects it safely; no partial file is presented as complete | **PENDING** | |
| FT-05 | Decline an incoming offer | No file is written | **PENDING** | |
| FT-06 | Interrupt the data channel mid-transfer | Transfer fails visibly; incomplete data is not acknowledged as complete | **PENDING** | |
| FT-07 | Repeat after reconnecting the peer | A new transfer succeeds; no claim of resume support | **PENDING** | |
| FT-08 | Save As to a new destination | Native picker chooses destination; exact bytes are saved | **PENDING** | |
| FT-09 | Choose an existing destination and decline overwrite | Existing file remains byte-for-byte unchanged | **PENDING** | |
| FT-10 | Choose an existing destination and approve overwrite | Existing file is replaced only after explicit approval | **PENDING** | |
| FT-11 | Cancel Save As | No destination file is created or modified | **PENDING** | |
| FT-12 | Use path traversal and reserved-name filenames | Filename is sanitized; output stays within selected destination | **PENDING** | |

## Windows desktop Save As detail

- Windows version/build: **PENDING**
- Installer artifact and SHA-256: **PENDING**
- Installation / launch result: **PENDING**
- Save As selected path (redact user-specific directories): **PENDING**
- Overwrite confirmation shown: **PENDING**
- Cancel preserved existing file: **PENDING**
- Approved overwrite result: **PENDING**
- Saved file size: **PENDING**
- Sender SHA-256: **PENDING**
- Receiver SHA-256: **PENDING**
- Screenshot/log references (redacted): **PENDING**

## Browser acceptance

| Browser | Version / OS | Save/download picker result | Status | Evidence |
|---|---|---|---|---|
| Chrome | **PENDING** | **PENDING** | **PENDING** | |
| Edge | **PENDING** | **PENDING** | **PENDING** | |
| Firefox | **PENDING** | **PENDING** | **PENDING** | |

## Evidence integrity

For every successful transfer, record:

- Original file byte count and SHA-256.
- Received file byte count and SHA-256.
- Whether the receiver's acknowledgement arrived only after verification.
- Whether the file was saved to the explicitly selected destination.
- Any failure, timeout, retry, or unexpected UI behavior.

Do not mark a case PASS based solely on a unit test, mocked IPC call, source inspection, CI packaging success, or two app instances on one device. Do not claim malware scanning: SHA-256 verifies integrity, not safety. Do not claim transfer resume after a disconnect; resume is not currently implemented.

## Sign-off

- Physical two-device matrix complete: **NO — PENDING**
- Windows native Save As / overwrite / cancel complete: **NO — PENDING**
- Browser save-picker checks complete: **NO — PENDING**
- Evidence reviewed by: **PENDING**
- Release approval: **NOT GRANTED**
