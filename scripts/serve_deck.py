#!/usr/bin/env python3
"""Serve an HTML deck on this computer's network so a phone can pair with it as a remote.

The phone remote cannot pair with a deck opened from file:// or localhost, because the QR code
would point the phone at itself. This helper serves only the deck and the local files it
references, finds the computer's address on the local network, and opens the deck there, so the
deck's QR code carries a URL the phone can reach on the same Wi-Fi.

    python3 scripts/serve_deck.py                  # the bundled demo deck
    python3 scripts/serve_deck.py deck.html --port 8080 --no-open
"""
from __future__ import annotations

import argparse
import functools
import http.server
import re
import socket
import sys
import webbrowser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DECK = ROOT / "assets" / "html-slideshow-starter" / "paper-presentation.html"
REFERENCE = re.compile(r"""(?:src|href)\s*=\s*["']([^"'#?]+)|url\(\s*["']?([^"')#?]+)""", re.IGNORECASE)


def lan_address() -> str | None:
    """This computer's address on the local network. Connecting a UDP socket sends no packet."""
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.0.2.1", 9))  # TEST-NET-1: never routed, only used to pick an interface
        address = probe.getsockname()[0]
    except OSError:
        return None
    finally:
        probe.close()
    return None if address.startswith("127.") else address


def allowed_files(deck: Path) -> set[Path]:
    """The deck plus local files it references; nothing else in its folder is served."""
    folder = deck.parent.resolve()
    allowed = {deck.resolve()}
    for match in REFERENCE.finditer(deck.read_text(encoding="utf-8", errors="ignore")):
        target = unquote(match.group(1) or match.group(2) or "").strip()
        if not target or re.match(r"^[a-z][a-z0-9+.-]*:|^//", target, re.IGNORECASE):
            continue  # data:, https:, mailto:, protocol-relative
        path = (folder / target.lstrip("/")).resolve()
        if path.is_file() and folder in path.parents:
            allowed.add(path)
    return allowed


class DeckHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, deck: Path, allowed: set[Path], **kwargs):
        self.deck, self.allowed = deck, allowed
        super().__init__(*args, directory=str(deck.parent), **kwargs)

    def send_head(self):
        path = unquote(urlsplit(self.path).path)
        if path in ("", "/"):
            self.send_response(302)
            self.send_header("Location", "/" + self.deck.name)
            self.end_headers()
            return None
        target = (self.deck.parent / path.lstrip("/")).resolve()
        if target not in self.allowed:
            self.send_error(404, "Only the deck and the files it references are served")
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # re-rendered decks show up on reload
        super().end_headers()

    def log_message(self, format, *args):  # keep the terminal for the instructions
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve a deck on your Wi-Fi so a phone can be its remote")
    parser.add_argument("deck", nargs="?", type=Path, default=DEFAULT_DECK, help="HTML deck (default: the bundled demo)")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-open", action="store_true", help="Do not open the deck in a browser")
    args = parser.parse_args()

    deck = args.deck.resolve()
    if not deck.is_file():
        parser.error(f"{args.deck} not found")
    handler = functools.partial(DeckHandler, deck=deck, allowed=allowed_files(deck))
    try:
        server = http.server.ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    except OSError as exc:
        parser.error(f"port {args.port} is busy ({exc.strerror}); try --port {args.port + 1}")

    address = lan_address()
    host = address or "localhost"
    url = f"http://{host}:{args.port}/{deck.name}"
    print(f"Serving {deck.name}\n\n  Open on this computer:  {url}")
    if address:
        print("  Phone remote:           press R in the deck (or click the phone button) and scan the QR code.")
        print("                          The phone must be on the same Wi-Fi; guest and venue networks often block this.")
    else:
        print("  No network address found; the phone remote needs this computer on Wi-Fi or Ethernet.")
    print("\n  Only the deck and the files it references are shared. Press Ctrl+C to stop.\n")
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    sys.exit(main())
