# Aurora Native Compositor

This directory contains the first native Aurora compositor boundary for Chimera II. It is deliberately separate from the browser shell so the same Aurora interaction model can evolve into a real Wayland compositor.

## Architecture

```text
Wayland clients
      |
      v
Qt Wayland Compositor
  +-- XDG Shell
  +-- seat/input
  +-- buffer integration
      |
      v
Aurora shell / Qt Quick
  +-- Fluent Glass surfaces
  +-- pointer-responsive motion
  +-- taskbar/dock
  +-- workspace/window policy
      |
      v
Chimera Python runtime / Node supervisor
```

Qt's Wayland Compositor provides QML and C++ APIs for custom display servers and includes XDG Shell support. XDG toplevels provide the standard desktop requests for moving and resizing application surfaces. See the official Qt documentation and Wayland protocol documentation before adding compositor policy.

## Build

Requirements: Qt 6 with Gui, Quick, and WaylandCompositor components; a working Wayland/EGL-capable graphics stack is recommended.

```bash
cmake -S aurora_native -B build/aurora-native
cmake --build build/aurora-native --config Release
./build/aurora-native/aurora-compositor
```

This prototype intentionally does not replace an existing production compositor automatically. It is a separately launched development compositor and should first be tested in a nested/virtual environment.

## Input and motion

The native path is intended to consume Wayland pointer events and schedule visual updates from the compositor frame loop. The current shell demonstrates pointer-aware interpolation; native pointer prediction, cursor surfaces, frame pacing, and hardware-buffer paths are subsequent stages.

## Safety boundary

Do not start this compositor on a user's primary graphical session until it has been tested in a nested environment or VM. A compositor owns display/session resources and a failure can terminate the graphical session.
