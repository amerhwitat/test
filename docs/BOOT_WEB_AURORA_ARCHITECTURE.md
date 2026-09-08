# Chimera II host boot, services and Aurora web architecture

## Runtime sequence

```text
start_chimera.py
  -> Node.js 24 LTS web supervisor
      -> Python chimera_py.main
          -> Spitfire host boot model
              -> Koronos kernel runtime
                  -> RegisterN / Spotnik / VFS / TensorFS / Nucleus / Hive
                  -> CEF / Kore / DMA / N-bit runtime
                  -> Python API :8765
          -> Aurora Wayland host-session bridge
      -> Aurora web UI :3000
          -> /api/* proxy -> Python :8765
```

The Python implementation is a host/emulation runtime. The Spitfire stage models the boot contract and handoff; it does not pretend that a Python process can replace UEFI/BIOS or execute an MBR in real mode. A real bare-metal boot target remains a separate firmware/ISA artifact.

## Running

```bash
python3 start_chimera.py
```

Then open `http://127.0.0.1:3000`.

The Python runtime can also be run directly:

```bash
python3 -m chimera_py
```

## Aurora

The runtime reports the Aurora Wayland session boundary as a service. A native compositor is an external host capability and should be launched only on a graphical Linux/Unix session. Set `CHIMERA_AURORA_COMMAND` and `CHIMERA_START_AURORA=1` when a local compositor executable is intentionally available. Headless servers retain the API/web mode without attempting to take over the display.

## Web bridge

Node.js is deliberately kept as the browser-facing server while Python owns the emulator/kernel state. Node proxies `/api/*` to the Python runtime, so browser code never needs direct access to Python internals. No external npm packages are required.

Node 24.20.0 is the current LTS line as of September 2026; Node 26.8.1 is the current release line. Python 3.14.7 is the current stable Python release; Python 3.15.0rc2 is a pre-release and is not used as the production baseline.

## Virtualization boundary

QEMU remains the future machine-level boundary rather than being reimplemented in Python. Its system-emulation model provides a virtual machine, CPU, memory and devices, while TCG supplies CPU emulation. The Chimera Python runtime therefore exposes a clean host/emulator boundary suitable for a future QEMU machine target.
