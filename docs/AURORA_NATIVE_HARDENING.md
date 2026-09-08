# Aurora Native Compositor Hardening

This branch hardens the native Aurora display-server foundation without changing the existing Python/Node fallback.

## Runtime contract

- `QtWaylandCompositor` owns the Wayland server boundary.
- `XdgShell` is the desktop shell and is the authority for toplevel/popup surface roles.
- `XdgDecorationManagerV1` advertises server-side decoration preference.
- `WaylandSeat` exposes pointer and keyboard capabilities.
- `WaylandOutput` presents the compositor scene to a native output window.
- Python remains the Chimera control plane; Node remains the browser/web control plane.

## Motion policy

Window movement is expressed as compositor-owned state transitions rather than browser animation. The target profile is a short, interruptible OutCubic transition for shell-managed placement and immediate input feedback. Reduced-motion policy must disable non-essential transitions.

## Safety

The native compositor remains opt-in. It must be tested nested or in a VM before being selected as a host display server. A failure to initialize hardware integration must leave the Python/Node desktop fallback usable.

## Upstream basis

Qt 6.11 documents `XdgShell` as the desktop-oriented shell for movable/resizable windows and exposes XDG decoration negotiation and low-level compositor APIs. See:

- https://doc.qt.io/qt-6/qtwaylandcompositor-index.html
- https://doc.qt.io/qt-6/qtwaylandcompositor-shellextensions.html
- https://doc.qt.io/qt-6/qml-qtwayland-compositor-xdgshell-xdgdecorationmanagerv1.html

This document intentionally does not claim that the native compositor is production-ready until a real Qt/Wayland build and nested compositor test have passed.
