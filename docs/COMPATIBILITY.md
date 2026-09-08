# Compatibility Policy

## Python

The repository keeps **Python 3.8 source compatibility** because the consolidated legacy material targets Python 3.8.1. Python 3.8 itself reached end-of-life on 2024-10-07, so the compatibility track is for preservation and migration, not a secure production recommendation.

The preferred deployment target is a currently supported Python release. CI exercises the standard-library core across Python 3.8, 3.11 and 3.13.

## Dependency strategy

The core runtime has no mandatory third-party dependency. PDF, computer-vision, numerical and ML features are optional adapters. `requirements-python38.txt` is a conservative compatibility track; `requirements-modern.txt` is a modern deployment track and should be resolved/tested per platform.

## Unicode and Arabic/RTL

Text processing uses Unicode normalization and UTF-8. The architecture deliberately keeps language-specific OCR/NLP engines behind adapters so Arabic, RTL and historical-language workflows can evolve independently.

## ABI and provenance

Existing interfaces are preserved where practical. Legacy source is retained under provenance-specific directories rather than silently rewritten into the core. `amerhwitat/ChimeraIIOS` is a separate repository and is not modified by this project.
