package org.chimera.integration;

import java.util.List;

public record AcceptanceReport(boolean accepted, List<String> observedMarkers, List<String> missingEvidence) {
    public AcceptanceReport {
        observedMarkers = List.copyOf(observedMarkers);
        missingEvidence = List.copyOf(missingEvidence);
    }

    public static AcceptanceReport from(BootEvidence evidence) {
        return new AcceptanceReport(evidence.accepted(), evidence.markers(), evidence.missingEvidence());
    }
}