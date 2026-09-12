# Chimera 128D + P2P Portfolio Integration

`test` is the host-side integration and conformance target for Chimera II. It can exercise multidimensional boot, kernel, service, network, robotics, NLP and document state.

The 128D semantic profile is represented through deterministic state objects and vectors. Optional P2P tests validate authenticated envelopes, capability exchange, sequence/replay protection, payload hashing and snapshot/delta synchronization.

The integration is test-only unless explicitly configured; it does not scan the Internet, exchange credentials/private keys, transfer arbitrary executables or execute remote commands.

Python remains the host integration language while Node.js, Java and native implementations consume shared conformance vectors.

Original project code is GPLv3-or-later; third-party components retain their licenses.
