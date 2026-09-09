# Chimera II Web UI Integration

The `test` repository is the Web UI integration and conformance surface for the Chimera II ecosystem. `ChimeraIIOS` remains the canonical OS implementation/source of truth.

## Included surfaces

- Aurora Wayland Glass-inspired Three.js/WebGL desktop.
- Linux desktop profile adapters: Aurora, GNOME, KDE Plasma, Xfce, Cinnamon, MATE, LXQt, LXDE, Budgie, Pantheon, Deepin, Enlightenment and COSMIC.
- Windows profile adapters: Windows 11, Windows 10 and Classic Windows.
- Unified terminal/help presentation for Linux/POSIX/Bash/Zsh and Windows CMD/PowerShell.
- Hooks for Chimera II ISA/CPU, compiler/IDE, boot lifecycle and research visualizations.

## Runtime boundary

The Web UI is a presentation/simulation layer. It must not gain arbitrary host shell, filesystem, credentials, private-key, network or native desktop-session privileges. Native Linux/Windows sessions require an explicitly authorized backend such as a VM, remote desktop gateway, or controlled native adapter.

## Help integration

The UI uses the Chimera unified documentation model. Local Linux manuals may be indexed by the host installation. Microsoft content is represented through permitted local help and official documentation references when redistribution is not authorized.

## Entry points

- `web/aurora_3d_desktop.html` — standalone 3D desktop.
- `web/aurora_3d_desktop.js` — Three.js scene and desktop behavior.
- `web/aurora_3d_desktop.css` — Aurora glass presentation.
- `web/desktop_profiles.json` — Linux/Windows profile contract.

## Compatibility

The standalone desktop intentionally uses a small, dependency-light command/help catalog in the browser. Production deployments should connect its help/search layer to the canonical Chimera Help API rather than duplicating the complete man database in JavaScript.
