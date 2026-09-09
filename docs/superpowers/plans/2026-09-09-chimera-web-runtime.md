# Chimera II Web Runtime Implementation Plan

## Goal
Build a capable, sandboxed Chimera II Web Runtime for the `test` repository: Aurora Three.js/WebGL desktop, Chimera application registry, Linux/Windows desktop profiles, virtual users/groups, terminal/help, and sandboxed sudo.

## Architecture
`test` is the Web UI integration/conformance hub; `ChimeraIIOS` remains the canonical OS source. Browser execution uses a virtual filesystem, virtual process/application model, identity store, capability policy, terminal, and Three.js/WebGL desktop. Optional native/VM backends are explicit authenticated adapters.

## Tasks

1. **Runtime registry and capabilities** — add a versioned runtime manifest, deny-by-default capability policy, application registry, and adapter metadata for WebGL/WASM/Worker/native/VM execution.
2. **Virtual filesystem/processes** — add persistent IndexedDB/OPFS-backed virtual roots with in-memory fallback and Worker-isolated processes; enforce path isolation.
3. **Users/groups** — add virtual users, groups, secure Web Crypto password verification/storage, administrator first-run setup, sessions, logout and expiry; never store plaintext passwords.
4. **Sandboxed sudo** — add authentication, group/policy checks, command allowlists, `sudo -u`, session timestamps and a virtual `/var/log/chimera/sudo.log`; privileges cannot cross the browser sandbox.
5. **Unified terminal** — connect `man`, `apropos`, `whatis`, `info`, `help`, `chimera-help`, Linux/POSIX/Bash/Zsh and Windows/PowerShell catalogs to the same runtime.
6. **Aurora Three.js/WebGL desktop** — make the existing Aurora desktop consume runtime state; use WebGL2/Three.js with DOM/CSS fallback; expose renderer diagnostics without extra host privileges.
7. **Linux/Windows profiles** — integrate Aurora, GNOME, KDE Plasma, Xfce, Cinnamon, MATE, LXQt/LXDE, Budgie, Pantheon, Deepin, Enlightenment, COSMIC, Windows 11, Windows 10 and Classic Windows through one profile contract.
8. **Application adapters** — add WASM/Worker slots for browser-compatible Chimera applications such as C/C++ tooling, CPU4096/ISA visualization, PDF/NLP/image tools; unsupported native programs are explicitly marked native/VM.
9. **Native/VM bridge** — define authenticated, origin-checked, capability-scoped interfaces with revocation; never implement unrestricted host execution.
10. **Web System Center** — integrate launcher, terminal, Help, Files, Settings, user/session status, runtime/WebGL diagnostics, process/resource status and authorized sudo audit viewer.
11. **Documentation/migration** — document execution modes, security, user/sudo semantics, profile behavior and migration from the previous Aurora runtime.
12. **Verification** — run browser/contract/security tests, CMake/CTest where applicable, verify all profiles, user isolation, sudo denial/authorization, VFS isolation, WebGL fallback, and application capability accuracy before claiming completion.

## Security constraints

- Browser code never receives unrestricted host shell, root, filesystem, credential or desktop-session access.
- `sudo` is root-equivalent only inside the Chimera Web Runtime unless an explicitly authorized native/VM backend is connected.
- Privileged operations are policy-checked and audited.
- Web applications are deny-by-default for ungranted capabilities.
- Native/VM bridges require authenticated, origin-checked, capability-scoped sessions.
- Existing desktop, terminal, help, compiler and ISA contracts remain compatible.
