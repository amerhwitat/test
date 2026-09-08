from __future__ import annotations

import argparse
import os
import sys

from chimera_py.config import AppConfig
from research_app.documents import PdfDocument


def build_parser():
    parser = argparse.ArgumentParser(prog="chimera-research")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("info")
    source = sub.add_parser("source")
    source_sub = source.add_subparsers(dest="source_command")
    source_sub.add_parser("audit")
    pdf = sub.add_parser("pdf")
    pdf_sub = pdf.add_subparsers(dest="pdf_command")
    extract = pdf_sub.add_parser("extract")
    extract.add_argument("file")
    search = pdf_sub.add_parser("search")
    search.add_argument("file")
    search.add_argument("term")
    sub.add_parser("import")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.command == "info":
        config = AppConfig.from_env()
        print("Chimera II research platform")
        print("Python: %s" % sys.version.split()[0])
        print("Data directory: %s" % config.data_dir)
        return 0
    if args.command == "source" and args.source_command == "audit":
        for path in ("research/nlp", "research/pdfreaderPY", "security_research/bruteforce"):
            print(path)
        return 0
    if args.command == "pdf":
        document = PdfDocument.open(args.file)
        try:
            if args.pdf_command == "extract":
                for page in range(1, document.page_count + 1):
                    print(document.text(page), end="")
                return 0
            if args.pdf_command == "search":
                for match in document.search(args.term):
                    print("page %d: %s" % (match["page"], match["text"].strip()))
                return 0
        finally:
            document.close()
    if args.command == "import":
        from tools.import_github_sources import main as import_main
        return import_main()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
