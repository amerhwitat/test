# Aurora Native Compositor

Development-stage Qt 6 Wayland compositor boundary for Aurora Fluent Glass.

It provides the foundation for real XDG-shell clients, native input, compositor-managed cursor surfaces, and GPU-backed composition while leaving the existing Python/Node desktop implementation available as the portable fallback.

Build with a Qt 6 installation containing `WaylandCompositor`:

```bash
cmake -S aurora_native -B build/aurora-native
cmake --build build/aurora-native --config Release
```

Run only in a nested/test graphical environment until the compositor has complete output, client-surface, cursor, security, and recovery handling.
