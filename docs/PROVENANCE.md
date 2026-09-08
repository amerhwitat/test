# Provenance and Import Policy

`amerhwitat/test` is the consolidation target. Source families remain separated by origin:

- `amerhwitat/nlp` -> `research/nlp/`
- `amerhwitat/PDFreaderPY` -> `research/pdfreaderPY/`
- `amerhwitat/bruteforce` -> `security_research/bruteforce/`

`tools/import_github_sources.py` imports Python and Markdown source, records source blob SHAs, and writes `docs/import-manifest.json`. It refuses truncated GitHub trees, rejects path traversal, limits individual imported text files, and can use `GITHUB_TOKEN` from the environment without storing the token.

Imported code is never executed by the importer. Security/cryptocurrency material stays isolated and is not developed into credential or private-key recovery functionality.

For reproducibility, preserve the generated manifest with the imported snapshot when importing source from a moving branch.
