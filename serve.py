#!/usr/bin/env python3
"""Static file server + CORS proxy for football-data.org.

Loads the API key from FOOTBALL_DATA_API_KEY env var or a .env file.
The key stays server-side; the client never sees it.
"""

import http.server
import os
import socketserver
import sys
import urllib.error
import urllib.parse
import urllib.request

API_HOST = "https://api.football-data.org"
PROXY_PREFIX = "/api/"
WEB_PORT = 8000
ENV_VAR = "FOOTBALL_DATA_API_KEY"
INDEX_PATHS = {"/", "/index.html"}


def load_env_file(path):
    if not os.path.isfile(path):
        return {}
    parsed = {}
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            parsed[key.strip()] = value.strip().strip('"').strip("'")
    return parsed


def load_api_key(root):
    value = os.environ.get(ENV_VAR)
    if value:
        return value, "environment variable"

    parsed = load_env_file(os.path.join(root, ".env"))
    if parsed.get(ENV_VAR):
        try:
            os.chmod(os.path.join(root, ".env"), 0o600)
        except OSError:
            pass
        return parsed[ENV_VAR], ".env file"

    return None, None


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args, **_kwargs):
        return

    def _cors(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path in INDEX_PATHS:
            self._serve_index()
            return
        if self.path.startswith(PROXY_PREFIX):
            self._proxy(self.path[len(PROXY_PREFIX) - 1:])
            return
        super().do_GET()

    def _serve_index(self):
        path = self.translate_path("/index.html")
        try:
            with open(path, "r", encoding="utf-8") as f:
                html = f.read()
        except FileNotFoundError:
            self.send_error(404, "index.html not found")
            return

        body = html.encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _proxy(self, path):
        parsed = urllib.parse.urlparse(path)
        if parsed.scheme or parsed.netloc or ".." in parsed.path:
            self.send_error(400, "Invalid request")
            return

        url = API_HOST + parsed.path
        if parsed.query:
            url += "?" + parsed.query

        req = urllib.request.Request(url)
        token = self.server.api_key
        if token:
            req.add_header("X-Auth-Token", token)
        try:
            with urllib.request.urlopen(req) as r:
                body = r.read()
                self.send_response(r.status)
                self._cors()
                self.send_header("Content-Type", r.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        except urllib.error.HTTPError as e:
            body = e.read()
            self.send_response(e.code)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            msg = str(e).encode()
            self.send_response(502)
            self._cors()
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)


class Server(socketserver.TCPServer):
    allow_reuse_address = True

    def __init__(self, address, handler, api_key):
        super().__init__(address, handler)
        self.api_key = api_key


def main():
    port = WEB_PORT
    if len(sys.argv) > 1:
        port = int(sys.argv[1])

    root = os.path.dirname(os.path.abspath(__file__))
    api_key, source = load_api_key(root)
    os.chdir(os.path.join(root, "public"))

    with Server(("localhost", port), Handler, api_key) as httpd:
        print(f"App:    http://localhost:{port}/")
        print(f"Proxy:  http://localhost:{port}{PROXY_PREFIX} -> {API_HOST}")
        if api_key:
            print(f"Key:    loaded from {source} (length {len(api_key)})")
        else:
            print("Key:    NOT FOUND - set FOOTBALL_DATA_API_KEY or create a .env file")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
