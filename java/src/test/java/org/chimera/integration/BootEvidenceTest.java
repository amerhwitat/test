package org.chimera.integration;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class BootEvidenceTest {
    @Test void kernelReadyAloneDoesNotPassUserspaceGate() {
        var evidence = new BootEvidence(List.of("KORONOS READY", "Runtime supervisor alive"));
        assertTrue(evidence.kernelReady());
        assertFalse(evidence.userspaceReady());
        assertFalse(evidence.accepted());
        assertEquals(List.of("USERSPACE READY: init pid=<positive pid>"), evidence.missingEvidence());
    }

    @Test void requiresPositiveInitPidMarker() {
        assertFalse(new BootEvidence(List.of("KORONOS READY", "USERSPACE READY: init pid=0")).accepted());
        assertFalse(new BootEvidence(List.of("KORONOS READY", "USERSPACE READY: init pid=unknown")).accepted());
    }

    @Test void acceptsBothKernelAndUserspaceEvidence() {
        var report = AcceptanceReport.from(new BootEvidence(List.of(
                "KORONOS READY", "USERSPACE READY: init pid=12")));
        assertTrue(report.accepted());
        assertTrue(report.missingEvidence().isEmpty());
    }

    @Test void reportsMissingKernelAndUserspaceEvidence() {
        var report = AcceptanceReport.from(new BootEvidence(List.of("boot complete")));
        assertFalse(report.accepted());
        assertEquals(2, report.missingEvidence().size());
    }
}