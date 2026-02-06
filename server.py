#!/usr/bin/env python3
"""
Simple HTTP server for the idle game.
Run this script to start a local server to host the game.
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # WASM requires these headers for proper functionality
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

def main():
    # Change to script directory
    os.chdir(os.path.dirname(__file__))
    
    print(f"Starting server at http://localhost:{PORT}")
    print("Navigate to http://localhost:8000 to play the game")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            sys.exit(0)

if __name__ == "__main__":
    main()