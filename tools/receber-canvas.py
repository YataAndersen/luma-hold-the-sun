# -*- coding: utf-8 -*-
"""Recebe PNGs do canvas do jogo e grava em press/.

Existe porque o dataURL do canvas nao consegue atravessar o canal da ferramenta de
browser, e captura de tela do desktop e fragil (janela em outro monitor, cromo do
navegador, escala). Assim a imagem sai do proprio canvas, na resolucao exata, sem
intermediario.
"""
import base64, http.server, os, socketserver

DESTINO = "E:/VIBE CODING/Playing For a Better World/Hold the Sun/LUMA - PROJETO PRINCIPAL/press"

class H(http.server.SimpleHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0))
        corpo = self.rfile.read(n).decode('utf-8')
        nome, _, dados = corpo.partition('|')
        nome = os.path.basename(nome) or 'shot.png'
        b64 = dados.split(',', 1)[-1]
        caminho = os.path.join(DESTINO, nome)
        with open(caminho, 'wb') as f:
            f.write(base64.b64decode(b64))
        print('gravado:', caminho, os.path.getsize(caminho), 'bytes', flush=True)
        self.send_response(200); self._cors(); self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *a): pass

with socketserver.TCPServer(("127.0.0.1", 8899), H) as s:
    print('receptor em 8899', flush=True)
    s.serve_forever()
