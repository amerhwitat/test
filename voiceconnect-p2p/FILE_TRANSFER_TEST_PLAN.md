# VoiceConnect file-transfer acceptance plan

This plan defines tests required before production publication. Record device OS/build, browser version, network type, commit SHA, timestamps, result, and sanitized logs for every run. A passing unit test is not a substitute for these integration tests.

## Two-device transfer matrix

Use two physically separate devices and distinct user accounts/profiles. Connect them through the deployed HTTPS/WSS signaling service. Verify that the peers are the intended recipients.

| Case | Sender | Receiver | Expected result |
|---|---|---|---|
| Empty file | 0-byte file | Accept | SHA-256 verified; Save As creates an empty file |
| Small binary | Random binary under 12 KiB | Accept | Exact byte-for-byte match |
| Chunk boundary | 12 KiB, 12 KiB + 1 byte | Accept | Correct chunk count and exact hash |
| Large file | Random 25 MiB file | Accept | Completes without unbounded buffering; exact hash |
| Oversize | 25 MiB + 1 byte | Send | Rejected locally before offer |
| Decline | Any permitted file | Reject | Sender sees rejection; no saved file |
| Corrupt chunk | Inject malformed or altered chunk in a controlled test build | Accept | Receiver cancels/discards; no Save As |
| Interrupted sender | Disconnect sender mid-transfer | Accept first | Receiver drops incomplete transfer and releases reservation |
| Interrupted receiver | Disconnect receiver mid-transfer | Accept | Sender marks transfer interrupted, not delivered |
| Reconnect | Reconnect after interruption | Retry same file | New transfer starts cleanly; no stale chunks are reused |
| Concurrent offers | Offer 4 files, then a 5th | Accept/reject | Limits enforced and memory reservation remains bounded |

## Windows desktop Save As

On a supported Windows 10/11 test machine:

1. Receive and accept a small file; choose a new folder/name in the native Save dialog.
2. Confirm the resulting bytes match the sender's SHA-256.
3. Save another file to an existing filename. Verify the OS dialog asks before overwrite.
4. Choose **No/Cancel** and confirm the original file remains byte-for-byte unchanged.
5. Repeat and explicitly confirm overwrite; verify the destination now matches the new file.
6. Cancel the Save dialog and verify the app does not report a successful save.
7. Test a long but valid filename and a filename containing reserved Windows characters; ensure safe handling.
8. Install and uninstall the packaged MSI on a clean Windows VM; verify the app launches and Save As works after installation.

## Browser save picker

Run on supported Chromium browsers over HTTPS or localhost:

1. Receive and verify a file.
2. Click **Save as…** directly from the user gesture and choose a new destination.
3. Confirm the bytes match SHA-256.
4. Choose an existing destination and verify the browser's overwrite confirmation behavior.
5. Cancel the picker and verify no success status is shown.
6. Test denied/unsupported picker behavior and the normal-download fallback. Record that the fallback may use the configured downloads folder instead of an interactive path picker.

The File System Access API is secure-context gated and picker methods require user activation. Browser support is not uniform; record the exact browser/version and do not claim universal picker support.

## Evidence and release gate

Attach test logs and hashes (not file contents) to the release evidence. A case is **not passed** merely because code exists or CI is queued. Production file-transfer acceptance requires all cases above to pass on actual devices, plus a security review and a documented malware-handling policy.
