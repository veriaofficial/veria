from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 3000

server = HTTPServer(("0.0.0.0", PORT), SimpleHTTPRequestHandler)

print("================================")
print("          VERIA ONLINE")
print("================================")
print("Website: http://localhost:3000")
print("Press Ctrl+C to stop the server.")

server.serve_forever()
