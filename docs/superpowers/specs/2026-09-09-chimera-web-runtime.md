# Chimera II Web Runtime Specification

## Purpose
Provide a browser-native, sandboxed Chimera II environment with an Aurora Three.js/WebGL desktop, virtual applications, Linux/Windows command profiles, virtual users/groups, and a sudo-like authorization model.

## Runtime layers

1. Renderer: Three.js/WebGL2 with DOM/CSS fallback.
2. Desktop manager: windows, launcher, dock, taskbar, profiles.
3. Application registry: capability-aware application discovery.
4. Terminal: virtual command adapters and unified man/help resolver.
5. Process model: Web Workers/WASM isolation and quotas.
6. Virtual filesystem: IndexedDB/OPFS with in-memory fallback.
7. Identity: virtual users/groups and Web Crypto password verification.
8. Authorization: deny-by-default capabilities and sandboxed sudo.
9. Optional bridge: authenticated, origin-checked native/VM adapter.

## Capability model

Capabilities are explicit strings and are granted per application/session. Examples: `ui.window`, `vfs.read`, `vfs.write`, `process.worker`, `gpu.webgl`, `help.read`, `compiler.wasm`, `network.fetch`, `native.bridge`. No capability implies host filesystem, host process, host credentials, or host administrator access.

## Users and sudo

The runtime maintains virtual `/etc/passwd`-style identity metadata and groups without exposing host account data. Passwords are never stored in plaintext. A first-run administrator may create the virtual root-equivalent account. `sudo` authenticates against the virtual identity store, evaluates an allowlist policy, creates an auditable virtual session, and executes only sandbox adapters. It cannot invoke host root or escape the virtual filesystem/process boundary.

## Desktop profiles

Profiles include Aurora Wayland Glass, GNOME, KDE Plasma, Xfce, Cinnamon, MATE, LXQt/LXDE, Budgie, Pantheon, Deepin, Enlightenment, COSMIC, Windows 11, Windows 10, and Classic Windows. Profiles alter visual layout and command/help aliases while applications consume one shared runtime contract.

## Application execution modes

- `native-web`: JavaScript/DOM application.
- `webgl`: GPU-rendered application.
- `worker`: isolated Web Worker application.
- `wasm`: WebAssembly module.
- `hybrid`: multiple browser adapters.
- `native_bridge`: requires explicit trusted native service.
- `vm_backend`: requires an explicitly connected virtual machine backend.

Unsupported native applications must be represented accurately rather than emulated deceptively.

## Security requirements

- No arbitrary host shell execution.
- No browser elevation to host root/Administrator.
- No automatic access to host private keys, passwords, SSH credentials, or arbitrary files.
- Native bridge must validate origin, session, capability and revocation state.
- Privileged actions must produce virtual audit records.
- Application resource quotas prevent one workload from monopolizing the browser runtime.

## Compatibility

Existing Aurora desktop contracts, command catalog, man/help catalog, Chimera II ISA metadata, and CPU4096 visualization contracts remain valid. Migration must preserve existing IDs and aliases where possible.

## Acceptance

The implementation is accepted when the runtime can create a virtual user, authenticate it, launch an application, access only granted virtual resources, execute permitted sandboxed sudo operations, search unified help, switch Linux/Windows desktop profiles, and render Aurora through WebGL2 or a documented fallback without acquiring host privileges.