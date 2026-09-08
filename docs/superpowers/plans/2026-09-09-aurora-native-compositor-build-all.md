# Aurora Native Compositor Build-All Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved Aurora native Wayland foundation into a buildable, testable, opt-in desktop compositor path while preserving the existing Python/Node runtime and ABI.

**Architecture:** Qt 6.11 Wayland Compositor owns the native Wayland server, XDG Shell surface roles, output, seat, and compositor scene. Python remains the Chimera control plane and Node remains the browser/web plane; the native compositor is selected only when explicitly requested. The compositor is validated in a nested/windowed session before any host-display use.

**Tech Stack:** C++20, Qt 6.11 Wayland Compositor, Qt Quick/QML, CMake, Ninja, Wayland/EGL, GitHub Actions, Python 3.8/3.14, Node 24 LTS.

**Spec:** `docs/AURORA_NATIVE_HARDENING.md`

## Global Constraints

- Do not modify `amerhwitat/ChimeraIIOS`.
- Keep the existing Python/Node fallback unchanged and usable.
- Native Aurora remains opt-in until nested-session verification passes.
- Preserve the current ABI and Chimera runtime contracts.
- Use XDG Shell for desktop-style windows and XDG decoration negotiation.
- Prefer Wayland-EGL for graphics; retain shared-memory fallback behavior from Qt.
- Motion must be interruptible and reduced-motion aware.
- No production-completion claim without fresh build, QML, runtime, input, integration, and CI evidence.

---

### Task 1: Make the native compositor scene actually build and create an output window

**Files:**
- Modify: `native/aurora/Aurora.qml`
- Modify: `native/aurora/CMakeLists.txt`
- Modify: `native/aurora/main.cpp`
- Test: `.github/workflows/python.yml`

**Interfaces:**
- Consumes: Qt `WaylandCompositor`, `XdgShell`, `XdgDecorationManagerV1`, `WaylandOutput`, `WaylandSeat`, `ShellSurfaceItem`.
- Produces: an executable that creates a real `QQuickWindow`-backed `WaylandOutput`, listens on `aurora-0`, and maps XDG toplevels into the scene.

- [ ] **Step 1: Write the failing CI/build check.** Add a native job that installs Qt 6.11.2 with `aqtinstall`, installs Wayland/EGL development packages, configures `native/aurora`, builds with Ninja, and runs a QML import/lint check.
- [ ] **Step 2: Run the check.** Expected failure: the current QML uses a `Rectangle` where `WaylandOutput.window` requires a `QWindow`.
- [ ] **Step 3: Implement the minimal fix.** Replace the hidden `Rectangle` with a visible Qt Quick `Window`, keep the compositor opt-in, and preserve the existing shell/output/seat contract.
- [ ] **Step 4: Add explicit Qt 6.11 compatibility.** Keep the CMake requirement aligned with the documented APIs and make the QML resource available to Qt tooling.
- [ ] **Step 5: Re-run the native configure/build/lint check.** Expected: configuration, compilation, resource generation, and QML validation succeed.
- [ ] **Step 6: Commit the focused native fix.**

### Task 2: Add deterministic native smoke tests

**Files:**
- Create: `native/aurora/tests/aurora_qml_smoke.cmake`
- Modify: `native/aurora/CMakeLists.txt`
- Modify: `.github/workflows/python.yml`

**Interfaces:**
- Consumes: built `aurora_compositor`, Qt runtime, isolated `XDG_RUNTIME_DIR`.
- Produces: a repeatable smoke test proving the compositor starts, creates its Wayland socket, and exits cleanly under a bounded timeout.

- [ ] **Step 1: Write the failing smoke test.** Assert that an isolated runtime directory is created, `aurora-0` appears, and the process stays alive long enough for a client probe.
- [ ] **Step 2: Run it and observe the failure against the current implementation.** The test must fail for a concrete missing output/window/socket condition rather than silently pass.
- [ ] **Step 3: Implement the minimum runtime/test harness.** Use a temporary runtime directory and bounded process lifetime; never replace the host desktop session.
- [ ] **Step 4: Re-run the smoke test.** Expected: socket creation succeeds and the process is terminated by the harness after the probe.
- [ ] **Step 5: Commit the smoke-test harness.**

### Task 3: Add a Wayland client connectivity probe

**Files:**
- Create: `native/aurora/tests/aurora_client_probe.cpp`
- Modify: `native/aurora/CMakeLists.txt`
- Modify: `.github/workflows/python.yml`

**Interfaces:**
- Consumes: `WAYLAND_DISPLAY=aurora-0`, Wayland client library.
- Produces: a minimal client that connects, receives globals, and exits successfully.

- [ ] **Step 1: Write the failing client-probe test.** Configure the probe to fail if it cannot connect or if the compositor does not advertise `wl_compositor` and `xdg_wm_base`.
- [ ] **Step 2: Run the probe against the compositor.** Expected failure until the runtime smoke harness is connected correctly.
- [ ] **Step 3: Implement the minimal registry listener and clean disconnect path.**
- [ ] **Step 4: Re-run the probe.** Expected: connection and required globals succeed.
- [ ] **Step 5: Commit the client probe.**

### Task 4: Harden window lifecycle, motion, and reduced-motion behavior

**Files:**
- Modify: `native/aurora/Aurora.qml`
- Create: `native/aurora/AuroraMotion.qml`
- Modify: `docs/AURORA_NATIVE_HARDENING.md`

**Interfaces:**
- Consumes: XDG toplevel creation/destruction and shell surface state.
- Produces: bounded window placement, stacking, interruptible motion, reduced-motion switch, and no stale signal connections.

- [ ] **Step 1: Write tests/assertions for lifecycle and reduced motion.** Validate that a created surface gets one shell item, destroyed surfaces are removed, and reduced motion produces zero non-essential animation duration.
- [ ] **Step 2: Verify the assertions fail for the current static implementation.**
- [ ] **Step 3: Implement lifecycle ownership and a small motion policy component.** Use `ShellSurfaceItem`'s documented `moveItem`/surface behavior and keep animation out of the input-critical path.
- [ ] **Step 4: Re-run the assertions and native smoke test.**
- [ ] **Step 5: Commit the motion/lifecycle hardening.**

### Task 5: Add native build and nested-session CI gates

**Files:**
- Modify: `.github/workflows/python.yml`
- Modify: `native/aurora/CMakeLists.txt`
- Create: `native/aurora/tests/README.md`

**Interfaces:**
- Consumes: native compositor and probe targets.
- Produces: a CI gate that reports Python, Node, native configure/build, QML validation, socket creation, and client connectivity independently.

- [ ] **Step 1: Add a CI job using Qt 6.11.2 and Ubuntu Wayland dependencies.**
- [ ] **Step 2: Configure and build with Ninja.**
- [ ] **Step 3: Run QML validation and CTest smoke/connectivity checks under isolated runtime state.**
- [ ] **Step 4: Keep the existing Python 3.8/3.14 and Node 24 jobs unchanged except for shared naming where necessary.**
- [ ] **Step 5: Commit the CI gate.**

### Task 6: Integrate the opt-in native launcher without changing fallback semantics

**Files:**
- Modify: `chimera_py/aurora.py`
- Modify: `chimera_py/orchestrator.py`
- Modify: `tests/test_boot_runtime.py`
- Modify: `docs/BOOT_WEB_AURORA_ARCHITECTURE.md`

**Interfaces:**
- Consumes: existing `CHIMERA_START_AURORA`, `CHIMERA_AURORA_COMMAND`, adapter discovery, and host-session bridge.
- Produces: explicit native compositor selection with safe fallback and a status/result object that distinguishes `native`, `fallback`, and `unavailable`.

- [ ] **Step 1: Add failing tests for explicit native selection and fallback.**
- [ ] **Step 2: Run them and verify the current adapter lacks the new status distinction.**
- [ ] **Step 3: Implement the minimal status contract without changing default startup behavior.**
- [ ] **Step 4: Re-run the full Python test suite.**
- [ ] **Step 5: Commit the integration.**

### Task 7: Full verification and approval gate

**Files:**
- No implementation changes unless a verification failure identifies a concrete defect.

**Interfaces:**
- Consumes: all previous tasks and CI results.
- Produces: evidence for merge readiness, or a precise blocker list.

- [ ] **Step 1: Run the full Python test suite.**
- [ ] **Step 2: Run Python compilation checks.**
- [ ] **Step 3: Run Node syntax checks and web bridge integration checks.**
- [ ] **Step 4: Run native CMake configure/build.**
- [ ] **Step 5: Run QML validation.**
- [ ] **Step 6: Run nested compositor smoke and Wayland client connectivity tests.**
- [ ] **Step 7: Verify PR checks and review state on GitHub.**
- [ ] **Step 8: Only if every required gate is green, approve and merge PR #4 using the verified head SHA.**

## Completion Gate

The work is not considered complete merely because files exist or a PR is mergeable. Completion requires fresh evidence for: native compilation, QML validation, Wayland socket creation, XDG client connection, window mapping, pointer/keyboard availability, motion policy, Python↔native selection, Node↔Python bridge, full Chimera boot path, and CI. Until those are observed, PR #4 remains open and the native compositor remains opt-in.
