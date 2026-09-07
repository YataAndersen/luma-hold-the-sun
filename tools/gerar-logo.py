# -*- coding: utf-8 -*-
"""Logo do LUMA.

O simbolo NAO e um sol generico: e o anel da respiracao, que virou a assinatura visual
do jogo. Ele aparece quase fechado, com um vao no alto — o instante exato em que o jogo
pede o gesto. A marca carrega a mecanica, nao so o tema.

A tipografia e a Inter Light, que ja e a fonte da interface, em caixa baixa e com
entreletras larga: o mesmo tratamento que o CSS do jogo aplica em todo rotulo.
"""
import math
from PIL import Image, ImageDraw, ImageFont

INTER = "C:/Users/Yata/AppData/Local/Microsoft/Windows/Fonts/Inter-Light-slnt=0.ttf"

SOL_NUCLEO = (255, 249, 236)
SOL_ANEL   = (255, 216, 147)
TINTA      = (248, 240, 226)

def desenhar_logo(largura, cor_texto=TINTA, com_assinatura=True, escala_ss=4):
    """Devolve um RGBA do logo. Desenha grande e reduz: anti-aliasing por supersampling,
    que e o que mantem a linha fina do anel limpa em tamanho pequeno."""
    L = largura * escala_ss
    diam = int(L * 0.46)
    folga_txt = int(L * 0.065)
    alt_txt = int(L * 0.20)
    alt_ass = int(L * 0.085) if com_assinatura else 0
    # A altura precisa da descida da fonte alem do em-size, senao a assinatura corta.
    H = diam + folga_txt + int(alt_txt * 1.32) + (int(alt_ass * 1.5) + int(L*0.05) if com_assinatura else 0)

    im = Image.new('RGBA', (L, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    cx, cy, r = L // 2, diam // 2, diam // 2 - int(L * 0.018)
    esp = max(2, int(L * 0.016))

    # O anel: um arco de ~305 graus, aberto no alto. O vao e o que diz "ainda enchendo".
    d.arc([cx-r, cy-r, cx+r, cy+r], start=-62, end=243, fill=SOL_ANEL + (255,), width=esp)

    # Halo interno suave, para o nucleo nao ficar colado num vazio.
    for i in range(int(r*0.62), 0, -1):
        a = int(26 * (1 - i / (r*0.62)) ** 2)
        if a <= 0: continue
        d.ellipse([cx-i, cy-i, cx+i, cy+i], fill=SOL_ANEL + (a,))

    nucleo = int(r * 0.30)
    d.ellipse([cx-nucleo, cy-nucleo, cx+nucleo, cy+nucleo], fill=SOL_NUCLEO + (255,))

    # Wordmark
    f = ImageFont.truetype(INTER, alt_txt)
    palavra, tracking = "luma", int(alt_txt * 0.30)
    larguras = [d.textlength(c, font=f) for c in palavra]
    total = sum(larguras) + tracking * (len(palavra) - 1)
    x = (L - total) / 2
    y = diam + folga_txt
    for c, w in zip(palavra, larguras):
        d.text((x, y), c, font=f, fill=cor_texto + (255,))
        x += w + tracking

    if com_assinatura:
        fa = ImageFont.truetype(INTER, alt_ass)
        sub, tr2 = "hold the sun", int(alt_ass * 0.42)
        ws = [d.textlength(c, font=fa) for c in sub]
        tot2 = sum(ws) + tr2 * (len(sub) - 1)
        x = (L - tot2) / 2
        y2 = y + alt_txt + int(L * 0.045)
        for c, w in zip(sub, ws):
            d.text((x, y2), c, font=fa, fill=cor_texto + (150,))
            x += w + tr2

    return im.resize((largura, max(1, H // escala_ss)), Image.LANCZOS)


if __name__ == '__main__':
    import os
    os.makedirs('press', exist_ok=True)
    for w, nome, ass in [(640, 'logo-luma.png', True), (320, 'logo-luma-small.png', True), (256, 'logo-luma-mark.png', False)]:
        im = desenhar_logo(w, com_assinatura=ass)
        im.save('press/' + nome)
        print(nome, im.size)
