# Containerized development environment

```bash
docker build -t amerhwitat-test:local .
docker run --rm -it amerhwitat-test:local
```

This image is a reproducible development/test environment with common language toolchains. It runs as a non-root user.
