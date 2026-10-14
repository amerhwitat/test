# Java runtime acceptance contracts

This Maven module turns the repository's evidence policy into executable Java contracts: a kernel-ready marker alone does not prove userspace readiness. An accepted report requires both `KORONOS READY` and `USERSPACE READY: init pid=<positive pid>`.

## Build and test

Requires JDK 17+ and Maven 3.9+.

```sh
mvn -f java/pom.xml test
mvn -f java/pom.xml package
```

This is an evidence parser/acceptance model, not a kernel boot simulator. Real QEMU, installer, recovery and Aurora acceptance must still be measured from actual boot logs.
