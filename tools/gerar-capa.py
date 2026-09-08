# -*- coding: utf-8 -*-
"""Capa 630x500 do SUSTINE.

Duas tentativas anteriores falharam por motivos que vale registrar:

  1. Redesenhar a paisagem em PIL saiu pior que o motor — triangulos chapados, sem o
     agrupamento de valor nem a recessao atmosferica. Capa nao pode prometer menos do
     que o jogo entrega.
  2. Recortar o render em paisagem corta a montanha ao meio. Num jogo em retrato o sol
     e a crista ficam verticalmente distantes demais para caber numa janela 1.26; a
     unica forma de encaixar era perder uma das duas massas.

Entao a capa assume o formato: o jogo aparece no seu proprio enquadramento, em pe, e a
marca ocupa o espaco ao lado. O painel vertical tambem comunica de cara que o jogo e
para celular, que e informacao util no card da loja.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

INTER = "C:/Users/Yata/AppData/Local/Microsoft/Windows/Fonts/Inter-Light-slnt=0.ttf"
W, H = 630, 500

# Trocar o arquivo abaixo para recompor a capa a partir de outra captura.
src = Image.open('press/shot-01-gameplay.png').convert('RGB')

# --- fundo: o proprio ceu do jogo, esticado e desfocado, para a marca ter onde pousar ---
fundo = src.resize((W, int(W * src.height / src.width)), Image.LANCZOS)
fundo = fundo.crop((0, int(fundo.height*0.18), W, int(fundo.height*0.18) + H))
fundo = fundo.filter(ImageFilter.GaussianBlur(26))
escurecer = Image.new('RGBA', (W, H), (6, 11, 22, 150))
fundo = Image.alpha_composite(fundo.convert('RGBA'), escurecer).convert('RGB')

# --- o painel do jogo, em pe, no terco direito ---
ph = int(H * 0.86)
pw = int(src.width * ph / src.height)
painel = src.resize((pw, ph), Image.LANCZOS)
px, py = W - pw - 34, (H - ph) // 2

sombra = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(sombra).rectangle([px-6, py-6, px+pw+6, py+ph+6], fill=(0, 0, 0, 140))
fundo = Image.alpha_composite(fundo.convert('RGBA'), sombra.filter(ImageFilter.GaussianBlur(16))).convert('RGB')
fundo.paste(painel, (px, py))
d = ImageDraw.Draw(fundo)
d.rectangle([px, py, px+pw-1, py+ph-1], outline=(255, 249, 236, 40))

# --- a marca, no espaco a esquerda ---
def tracking(draw, xy, txt, fonte, cor, tr):
    x, y = xy
    for c in txt:
        draw.text((x, y), c, font=fonte, fill=cor); x += draw.textlength(c, font=fonte) + tr
    return x

f  = ImageFont.truetype(INTER, 52)
fa = ImageFont.truetype(INTER, 15)
fb = ImageFont.truetype(INTER, 13)

cx = 46
cy = int(H * 0.30)

# O simbolo do anel entra aqui, e nao sobre a arte: no painel o sol ja e aquele circulo,
# e repetir o motivo duas vezes no mesmo quadro enfraquece os dois.
r = 21
d.arc([cx, cy-64, cx+r*2, cy-64+r*2], start=-62, end=243, fill=(255, 216, 147), width=2)
d.ellipse([cx+r-6, cy-64+r-6, cx+r+6, cy-64+r+6], fill=(255, 250, 238))

fim = tracking(d, (cx, cy), "sustine", f, (250, 245, 234), 13)
d.line([(cx+2, cy+66), (fim-13, cy+66)], fill=(255, 216, 147), width=1)
tracking(d, (cx+3, cy+78), "hold the sun", fa, (234, 223, 206), 6)
tracking(d, (cx+3, cy+118), "one touch. breathe in, let go.", fb, (206, 198, 186), 1.2)

fundo.save('press/cover-630x500.png')
print('capa:', fundo.size)
