# ISO-Tool test/integration notes

The shared ISO-Tool behavior for related repositories is fail-forward at independent job boundaries. Runtime/process errors are recorded in the live details log, the failed job is marked skipped/failed, cumulative progress advances, and the next independent job continues.

Workflow entry points are `analyze-source`, `build-compiled-images`, `import-boot-image`, `build-iso`, and `validate-image`.

The application can inspect/import bounded boot sectors from local ISO/IMG/BIN files and can operate on a local source repository without Internet access.

Remote acquisition can periodically monitor connectivity and retry network operations after connection restoration. Network transitions are logged.

The application window exposes a live operation-details area in Python/Tkinter, C# WPF, and VC++ Win32 implementations. Fatal safety, authorization, staging, or final-image integrity failures remain capable of stopping the pipeline.

Canonical implementation: `amerhwitat/nlp/ISO-Tool/`.
