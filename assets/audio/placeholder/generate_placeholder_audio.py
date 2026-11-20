"""
Genera audio PROVISIONAL (sintetizado, libre de derechos) para pruebas.
Solo usa la biblioteca estándar de Python. Sustituir por audio definitivo.

Uso (desde animaciones/):
    .venv\\Scripts\\python.exe assets\\audio\\placeholder\\generate_placeholder_audio.py
"""
import math
import os
import random
import struct
import wave

SR = 22050
OUT = os.path.dirname(os.path.abspath(__file__))


def write(name, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    k = 0.89 / peak
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * k)) * 32767)) for s in samples))
    print("ok", name, f"{len(samples) / SR:.1f}s")


def drone(seconds=45.0):
    rnd = random.Random(1)
    n = int(SR * seconds)
    out, lp, lp2 = [], 0.0, 0.0
    for i in range(n):
        t = i / SR
        lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.07 * t)
        s = 0.5 * math.sin(2 * math.pi * 55 * t)
        s += 0.35 * math.sin(2 * math.pi * 55.6 * t + 1.3)
        s += 0.18 * math.sin(2 * math.pi * 82.4 * t) * lfo
        s += 0.08 * math.sin(2 * math.pi * 164.8 * t + math.sin(2 * math.pi * 0.2 * t))
        # ruido grave (viento / rumor)
        lp += 0.02 * (rnd.uniform(-1, 1) - lp)
        lp2 += 0.05 * (lp - lp2)
        s += 2.2 * lp2
        fade = min(1, t / 3, (seconds - t) / 3)
        out.append(s * fade * (0.75 + 0.25 * lfo))
    return out


def pencil(seconds=4.0):
    rnd = random.Random(2)
    n = int(SR * seconds)
    env = [0.0] * n
    i = 0
    while i < n:
        length = int(SR * rnd.uniform(0.08, 0.28))
        gap = int(SR * rnd.uniform(0.02, 0.12))
        amp = rnd.uniform(0.4, 1)
        for j in range(length):
            if i + j < n:
                x = j / length
                env[i + j] = amp * math.sin(math.pi * x) ** 0.6
        i += length + gap
    out, prev, hp = [], 0.0, 0.0
    for k in range(n):
        w = rnd.uniform(-1, 1)
        hp = 0.92 * (hp + w - prev)  # paso alto: papel rasposo
        prev = w
        grain = 1 + 0.6 * (rnd.random() < 0.02)
        out.append(hp * env[k] * grain)
    return out


def boom(seconds=2.6):
    rnd = random.Random(3)
    n = int(SR * seconds)
    out, lp, phase = [], 0.0, 0.0
    for i in range(n):
        t = i / SR
        f = 35 + 60 * math.exp(-t * 6)
        phase += 2 * math.pi * f / SR
        s = math.sin(phase) * math.exp(-t * 1.6)
        lp += 0.08 * (rnd.uniform(-1, 1) - lp)
        s += 1.5 * lp * math.exp(-t * 9)
        out.append(s)
    return out


def eraser(seconds=0.9):
    rnd = random.Random(4)
    n = int(SR * seconds)
    out, lp = [], 0.0
    for i in range(n):
        x = i / n
        lp += 0.35 * (rnd.uniform(-1, 1) - lp)
        env = math.sin(math.pi * x) ** 1.5 * (0.7 + 0.3 * math.sin(2 * math.pi * 9 * x))
        out.append(lp * env)
    return out


if __name__ == "__main__":
    write("ambient-drone.wav", drone())
    write("pencil-scratch.wav", pencil())
    write("hit-boom.wav", boom())
    write("eraser-swish.wav", eraser())
