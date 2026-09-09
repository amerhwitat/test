# Performance & Concurrency Policy

Use bounded concurrency for independent test workloads and tooling. Keep tests deterministic, avoid shared mutable fixtures, cap workers, and never trade correctness for throughput. Benchmark before increasing parallelism.
