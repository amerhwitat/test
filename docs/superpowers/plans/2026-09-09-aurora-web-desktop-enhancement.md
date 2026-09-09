# Aurora Web Desktop Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Chimera II Aurora Web UI into a graphical glass desktop whose applications launch in dedicated browser tabs/windows, while providing a realistic browser-safe terminal across the Web UI repositories.

**Architecture:** Keep the existing Aurora desktop as the common visual shell and add a small cross-repository application registry containing app metadata and launch URLs. Browser launches use `window.open()` with a graceful same-tab fallback when popup blocking prevents a new tab. The terminal becomes a realistic simulated shell with prompt state, filesystem navigation, aliases, pipes/redirection display, history, completion, help/man metadata, OS-family aliases, and explicit sandboxing of destructive or host-side operations.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, existing Web APIs, GitHub Contents API, existing Chimera JSON/HTTP APIs. No browser ActiveX, Java applets, or COM execution is required or relied upon.

**Spec:** This plan implements the approved Aurora Web UI enhancement request and the Library reference image `Aurora Wayland Glass Desktop.png` / `Chimera II OS Aurora Showcase.png`.

## Global Constraints

- Preserve the existing Chimera II architecture, ISA, boot, kernel, and service APIs.
- Web UI must remain browser-safe and must not execute arbitrary host commands.
- Destructive commands are simulated/blocked rather than executed against the host.
- Modern browsers do not support Java browser applets or ActiveX as general Web UI primitives; provide modern HTML/CSS/JS equivalents and optional native-launch hooks instead.
- Application launch must work from pinned apps, taskbar icons, Start menu, and terminal `open`/`launch` commands.
- New application windows/tabs must preserve the Aurora glass visual language.
- Keep the shared CLI catalog as the compatibility source of truth.

---

### Task 1: Shared Aurora application registry

**Files:**
- Create: `web/aurora_apps.json`
- Modify: `web/index.html`
- Modify: `web/app.js`
- Test: `tests/test_api_contract.py` or existing Web UI contract test

- [ ] Add application metadata for System, Files, Terminal, Browser, Settings, System Monitor, 3D Aurora, Developer, Research, ISA Explorer, Runtime, and Network.
- [ ] Define `id`, `title`, `icon`, `url`, `mode`, and `description` for each app.
- [ ] Load the registry at startup and expose it to the Start menu/taskbar launcher.
- [ ] Add a single launch function using `window.open(url, target, features)` and fallback to `location.href` when blocked.
- [ ] Keep local app URLs relative so each repository can host its own application pages.
- [ ] Add contract tests for registry loading and launch markup.

### Task 2: Aurora glass desktop shell

**Files:**
- Modify: `web/index.html`
- Modify: `web/style.css`
- Modify: `web/app.js`

- [ ] Add desktop icons for Home, Trash, Applications, and Files.
- [ ] Add left glass dock with Aurora, Browser, Terminal, Files, Settings, Developer, and launcher buttons.
- [ ] Add top bar with workspaces, search, connectivity, audio, battery, clock, and boot state.
- [ ] Add right widget rail for clock/calendar, weather placeholder, CPU/memory/disk, and network state.
- [ ] Add glass Start menu with profile, categories, pinned applications, recommended items, and power control.
- [ ] Add animated depth, backdrop blur, translucent surfaces, rounded corners, subtle glow, hover/focus states, and reduced-motion support.
- [ ] Ensure responsive behavior at desktop and tablet widths.

### Task 3: Dedicated Web application surfaces

**Files:**
- Create or modify application pages under `web/apps/`
- Modify: `web/aurora_apps.json`

- [ ] Provide dedicated routes/pages for Files, Browser, Settings, System Monitor, 3D Aurora, Developer, Research, ISA Explorer, Runtime, and Network.
- [ ] Each page uses the same Aurora glass shell and includes a Back-to-Desktop action.
- [ ] App pages consume existing repository APIs when available instead of inventing runtime state.
- [ ] The Terminal remains an application surface rather than a host shell.

### Task 4: Realistic Web terminal

**Files:**
- Modify: `web/cli_terminal.js`
- Modify: `web/app.js`
- Modify: `web/index.html`
- Modify: `web/style.css`
- Modify: `web/cli_catalog.json`
- Test: terminal/browser contract tests

- [ ] Implement shell state: current directory, environment variables, aliases, exit status, command history, and session prompt.
- [ ] Implement safe simulated filesystem commands: `pwd`, `ls`, `cd`, `cat`, `head`, `tail`, `mkdir`, `touch`, `cp`, `mv`, `rm` as virtual operations.
- [ ] Implement text pipelines and common transforms in the simulation: `echo`, `printf`, `grep`, `sort`, `uniq`, `wc`, `cut`, `tr`, `tee`, `find`.
- [ ] Implement shell operators as simulated execution: `|`, `>`, `>>`, `&&`, `||`, `;`.
- [ ] Implement aliases and OS aliases such as `dir`/`ls`, `type`/`cat`, PowerShell `Get-ChildItem`, etc.
- [ ] Implement `help`, `man`, `apropos`, `which`, and command metadata from the catalog.
- [ ] Implement Tab completion from the catalog and virtual filesystem.
- [ ] Implement Ctrl/Cmd+K, arrow-key history, Ctrl+L clear, and terminal focus behavior.
- [ ] Keep host-dangerous commands blocked/simulated and display a clear sandbox notice.
- [ ] Add `open`/`launch` integration to the Aurora app registry.

### Task 5: Propagate the shell and desktop to CPU4096Simulator

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/cli_terminal.js`
- Modify/create: `public/cli_catalog.json`
- Modify/create: `public/aurora_apps.json`

- [ ] Add the Aurora glass shell around the existing CPU simulator console.
- [ ] Convert app controls to browser-tab/window launchers.
- [ ] Preserve CPU, ISA, runtime, keygen, demo, and existing API-backed commands.
- [ ] Add the same realistic terminal semantics and catalog.

### Task 6: Propagate the shell and terminal to ChimeraIIOS

**Files:**
- Modify: `web/index.html`
- Modify: `web/app.js`
- Modify: `web/style.css`
- Modify: `web/cli_terminal.js`
- Modify/create: `web/aurora_apps.json`

- [ ] Add the full Aurora desktop shell around the architecture explorer.
- [ ] Add application launch surfaces for Architecture, ISA Explorer, Kernel, Standards, Runtime, Research, and Terminal.
- [ ] Preserve the existing `data/chimera.json` architecture rendering.
- [ ] Add terminal/app registry integration.

### Task 7: Native/Aurora repository integration

**Files:**
- Modify only Web UI assets in `amerhwitat/amerhwitat.github.io` if an existing Web UI entry point is present.
- Modify `amerhwitat/keygen` only where its runtime/catalog data is directly consumed by Web UI.

- [ ] Do not create a redundant Web UI in repositories without an existing Web entry point unless the repository is explicitly a Web UI target.
- [ ] Reuse the existing Aurora/Spitfire/Koronos/Jasper catalogs as metadata sources.

### Task 8: Verification

- [ ] Run JavaScript syntax checks for all changed Web UI scripts.
- [ ] Run repository-specific unit/integration tests.
- [ ] Verify application launch URLs are valid relative URLs.
- [ ] Verify blocked commands never call host APIs such as shell execution.
- [ ] Verify `open`/`launch` commands resolve through the app registry.
- [ ] Verify boot remains locked until 100%.
- [ ] Verify keyboard navigation, reduced motion, and responsive layout.
- [ ] Check GitHub Actions after pushes and do not claim green status until the new commits have completed.

---

## Design notes

The Library reference image calls for a futuristic glass desktop with a scenic wallpaper, left vertical dock, glass Start menu, top status bar, right-side resource widgets, central glass windows, and a bottom dock/taskbar. fileciteturn162file1L24-L40 The Chimera showcase additionally calls for the 3D Aurora/WebGL/N-Bit visualization and a browser-like Web Interface panel. fileciteturn162file3L70-L72

Legacy ActiveX and Java browser applets are deliberately not used as a dependency. Modern Chromium browsers no longer support the Java NPAPI plugin model, and current Java documentation describes browser applets as obsolete; Java recommends native/self-contained application packaging instead. citeturn0search2turn0search5turn0search8
