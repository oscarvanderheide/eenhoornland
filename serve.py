# Dev server for the game and the browser tests: like `python3 -m http.server 8765`, but with a bigger connection
# queue, so the browser loading many modules at once never gets a dropped connection. Usage: python3 serve.py [port]
import http.server, functools, os, sys
class Server(http.server.ThreadingHTTPServer): request_queue_size = 128
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
print(f'http://127.0.0.1:{port}/'); Server(('127.0.0.1', port), functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.dirname(os.path.abspath(__file__)))).serve_forever()
