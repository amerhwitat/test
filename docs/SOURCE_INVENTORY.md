# Source Inventory — Python 3.8.1 Consolidation

## Destination

**`amerhwitat/test`** is the consolidation repository. **`amerhwitat/ChimeraIIOS` is not modified.**

## Imported source families

| Source | Destination | Role |
|---|---|---|
| `amerhwitat/nlp` | `research/nlp/` | NLP, OCR, Thamudic, GUI and related Python research |
| `amerhwitat/PDFreaderPY` | `research/pdfreaderPY/` | PDF reader/document tooling |
| `amerhwitat/bruteforce` | `security_research/bruteforce/` | Isolated security/cryptocurrency research |

## Known `nlp` Python source inventory

The source repository contains Python programs including BTC/OCR tools, GUI variants, neural-network utilities, search utilities, and Thamudic scanners/readers. The repository is GPL-3.0 licensed.

Notable source files include:

- `BTC.py`
- `btc_scanner.py`
- `btc_testnet_gui.py`
- `burn-to-hex.py`
- `burn-to-hex-rand.py`
- `burn-to-hex-rand002.py`
- `calic_1.py`
- `calic_2.py`
- `chatGPT-prog.py`
- `chatGPT-prog002.py`
- `copilot_gui.py`
- `copilot_gui_2.py`
- `copilot_gui_3.py`
- `copilot-btc-gui.py`
- `crack001.py` through `crack007.py`
- `gen-hex.py`
- `gen-public-addrs.py`
- `genx.py`
- `hex-segwit-converter.py`
- `nn-predict.py`
- `npl-mem-sumary.py`
- `npl-summary.py`
- `pub-key-get.py`
- `relation.py`
- `search_engines.py`
- `search_gui.py`
- `search_gui_requests.py`
- `test.py`
- `thamudic-scanner.py`
- `thamudic-scanner-2.py`
- `thamudic.py`

## PDFreaderPY

The original `temp.py` source has been vendored at `research/pdfreaderPY/temp.py`.

## Security research

The `bruteforce` repository contains cryptocurrency/security research programs. They are intentionally isolated from the Chimera II core. No functionality is added that would facilitate unauthorized credential or private-key recovery.

## Historical Chimera II material

Prior Chimera II design/code material is represented in the available conversation/library archive, including the 4096-bit/8192-bit architecture, assembler/disassembler concepts, emulator execution engine, ISA specifications and Python-oriented tooling. The archive confirms that the practical implementation direction is a software-defined/emulated research processor rather than existing custom silicon. fileciteturn16file0L21-L39

The available technical specification defines an R8192 fixed 64-bit instruction word, 1024 8192-bit GPRs, predicate/mask registers, vector/tensor registers, and a configurable emulator/toolchain roadmap. fileciteturn16file3L182-L203 fileciteturn16file3L204-L232

The crash-dump archive also contains the earlier assembler/disassembler and emulator execution-engine source/design material. fileciteturn16file4L247-L277

## Reproducible import

Run from a machine with network access:

```bash
python3.8 tools/import_github_sources.py
```

The importer uses only the Python standard library, targets Python 3.8.1, writes UTF-8 source files, and never executes imported code.
