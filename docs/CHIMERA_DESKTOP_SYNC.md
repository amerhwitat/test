# Chimera II Desktop Synchronization

This repository is an integration target for the Chimera II Web/Desktop stack.

## Canonical implementation

The canonical Aurora Wayland Glass Web desktop implementation is maintained in `amerhwitat/ChimeraIIOS`:

- `web/aurora_3d_desktop.html`
- `web/aurora_3d_desktop.css`
- `web/aurora_3d_desktop.js`
- `web/aurora_3d_desktop.json`
- `web/desktop_profiles.json`
- unified help subsystem under `tools/help/` and `web/help/`

The Web desktop uses Three.js/WebGL for GPU rendering and an accessible HTML UI layer for controls. Linux profiles include GNOME, KDE Plasma, Xfce, Cinnamon, MATE, LXQt/LXDE, Budgie, Pantheon, Deepin, Enlightenment and COSMIC. Windows profiles include Windows 11, Windows 10 and Classic Windows UI. Real host sessions remain behind an authorized backend/VM/RDP boundary.

## Synchronization policy

Keep this integration repository compatible with the canonical desktop contracts and do not grant the browser arbitrary host-shell, filesystem, network or desktop-session privileges.

Canonical source: https://github.com/amerhwitat/ChimeraIIOS
