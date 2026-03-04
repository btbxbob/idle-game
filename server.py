#!/usr/bin/env python3
"""
Simple HTTP server for the idle game.
Run this script to start a local server to host the game.

Usage:
    python3 server.py          # Normal mode with access logs
    python3 server.py --quiet  # Quiet mode without access logs
"""

import http.server
import socketserver
import os
import sys
import argparse

DEFAULT_PORT = 8080
DIRECTORY = "."

# Control access log output
quiet_mode = False


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        """Suppress access logs in quiet mode."""
        if not quiet_mode:
            super().log_message(format, *args)

    def end_headers(self):
        # WASM requires these headers for proper functionality
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    global quiet_mode
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Idle game HTTP server')
    parser.add_argument('--quiet', action='store_true', help='Suppress access logs')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT, help='Server port')
    args = parser.parse_args()
    quiet_mode = args.quiet
    port = args.port
    
    # Change to script directory
    os.chdir(os.path.dirname(__file__))
    
    if quiet_mode:
        print(f"Starting server (quiet mode) at http://localhost:{port}")
    else:
        print(f"Starting server at http://localhost:{port}")
        print(f"Navigate to http://localhost:{port} to play the game")

    with ReusableTCPServer(("", port), QuietHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            sys.exit(0)


if __name__ == "__main__":
    main()
