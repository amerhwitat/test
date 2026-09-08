# Aurora Fluent Glass

Aurora Fluent Glass is the Chimera II desktop-shell visual/interaction profile. It takes inspiration from modern desktop conventions, especially Windows 11's Fluent principles, while retaining Aurora's own identity.

## Design targets

- Glass/Mica-like long-lived surfaces and Acrylic-like transient surfaces.
- Calm dark-first visual hierarchy with Aurora cyan/violet accents.
- Rounded geometry, depth, elevation and adaptive contrast.
- Centered taskbar, Start/search surface, widgets and workspace navigation.
- Pointer-responsive feedback and smooth transitions.
- Snap intent preview near display edges.
- Reduced-motion support through `prefers-reduced-motion`.
- Wayland remains the compositor/protocol boundary; the web shell is a visualization and control surface, not a replacement for the native compositor.

## Implementation boundary

```text
Wayland compositor / native renderer
          |
          +-- input + cursor + surfaces + frame scheduling
          |
          +-- Aurora shell state
                    |
                    +-- Python Chimera runtime
                    +-- Node web supervisor
                    +-- browser visualization/control UI
```

The current web implementation intentionally does not fake OS-level cursor movement. Pointer motion drives local visual feedback and snap intent. Actual cursor composition and window placement belong to the Wayland compositor.

## Behavior model

### Pointer

- Pointer movement is handled with `pointermove` for immediate visual response.
- Interactive surfaces use radial highlighting and short transitions.
- Edge proximity creates a snap preview.
- The OS cursor itself remains under the compositor's control.

### Start and search

- Start opens from the centered taskbar or Chimera brand control.
- Search focuses automatically when opened.
- Escape dismisses Start.
- Ctrl/Cmd+K opens Start/search.

### Window/surface behavior

The web shell exposes navigation to system panels. A future native Aurora compositor can map the same state machine to XDG toplevel surfaces and native snap placement.

## Research basis

Microsoft's current Fluent guidance emphasizes effortless/calm/personal/familiar/coherent experiences, adaptive Mica/Acrylic materials, elevation, geometry, and reactive motion. Wayland's protocol keeps the core minimal and delegates display composition to the compositor. Qt Wayland Compositor is a practical reference for implementing a native custom compositor with QML/C++ APIs and hardware-accelerated rendering.

References:

- https://learn.microsoft.com/en-us/windows/apps/design/design-principles
- https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/materials
- https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
- https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/ui/apply-snap-layout-menu
- https://wayland.freedesktop.org/docs/book/Protocol.html
- https://doc.qt.io/qt-6/qtwaylandcompositor-index.html

## Performance direction

For a production compositor, keep the high-frequency path native/GPU accelerated. Python should own orchestration, state and research services; Node should provide the web bridge; the native compositor should own input, frame timing, cursor composition and client surfaces.
