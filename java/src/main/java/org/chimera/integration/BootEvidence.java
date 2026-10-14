package org.chimera.integration;

import java.util.List;
import java.util.Objects;

/**
 * Evidence-based readiness contract. Kernel/boot markers alone never imply a
 * userspace process is alive. This model evaluates supplied evidence; it does
 * not claim to observe or boot a machine itself.
 */
public record BootEvidence(List<String> markers) {
    public static final String KORONOS_READY = "KORONOS READY";
    public static final String USERSPACE_PREFIX = "USERSPACE READY: init pid=";

    public BootEvidence {
        markers = List.copyOf(Objects.requireNonNull(markers, "markers"));
    }

    public boolean kernelReady() {
        return markers.stream().anyMatch(marker -> marker != null && marker.contains(KORONOS_READY));
    }

    public boolean userspaceReady() {
        return markers.stream().filter(Objects::nonNull)
                .anyMatch(marker -> marker.startsWith(USERSPACE_PREFIX) && validPid(marker.substring(USERSPACE_PREFIX.length())));
    }

    public boolean accepted() {
        return kernelReady() && userspaceReady();
    }

    public List<String> missingEvidence() {
        var missing = new java.util.ArrayList<String>();
        if (!kernelReady()) missing.add("KORONOS READY");
        if (!userspaceReady()) missing.add("USERSPACE READY: init pid=<positive pid>");
        return List.copyOf(missing);
    }

    private static boolean validPid(String value) {
        try { return Integer.parseInt(value.trim()) > 0; }
        catch (NumberFormatException exception) { return false; }
    }
}