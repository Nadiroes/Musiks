#!/usr/bin/env python3
"""Génère des pistes audio de démonstration pour Muziks (mode démo hors GPU).
Synthèse simple : accords, mélodies, percussions — formats WAV mono 22050 Hz."""
import numpy as np
import wave, os

SR = 22050
OUT = "/home/z/my-project/public/demo"
os.makedirs(OUT, exist_ok=True)

def write_wav(path, samples):
    samples = np.clip(samples, -1, 1)
    data = (samples * 32000).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())

def note(freq, dur, kind="saw", vol=0.5, detune=0.0, decay=0.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    f = freq * (1 + detune)
    if kind == "saw":
        ph = (f * t) % 1.0
        s = 2 * ph - 1
    elif kind == "square":
        s = np.sign(np.sin(2 * np.pi * f * t)) * 0.7
    elif kind == "tri":
        s = 2 * np.abs(2 * ((f * t) % 1.0) - 1) - 1
    elif kind == "sine":
        s = np.sin(2 * np.pi * f * t)
    elif kind == "bass":  # sine + harmoniques
        s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)
        s *= 0.6
    else:
        s = np.sin(2 * np.pi * f * t)
    env = np.ones_like(s)
    a = int(0.01 * SR)
    env[:a] = np.linspace(0, 1, a)
    if decay > 0:
        d = int(decay * SR)
        d = min(d, len(s))
        env[-d:] *= np.linspace(1, 0, d)
    return s * env * vol

def kick(dur=0.22, vol=0.9):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    f = 120 * np.exp(-t * 22) + 40
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    return s * vol

def hat(dur=0.05, vol=0.25):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    s = np.random.RandomState(7).uniform(-1, 1, len(t)) * np.exp(-t * 90)
    return s * vol

def snare(dur=0.16, vol=0.5):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    s = np.random.RandomState(3).uniform(-1, 1, len(t)) * np.exp(-t * 26)
    s += 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return s * vol

def place(buf, snd, at):
    i = int(at * SR)
    j = min(i + len(snd), len(buf))
    if i < len(buf):
        buf[i:j] += snd[: j - i]

def master(buf, gain=0.9):
    peak = np.max(np.abs(buf)) or 1.0
    return buf / peak * gain

NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
def f(name, octave):
    semis = NAMES.index(name) + 12 * (octave + 1) - 57
    return 440.0 * (2 ** (semis / 12))

def chord(names_oct, dur, kind="saw", vol=0.16, detunes=(0.0, 0.004, -0.004)):
    out = np.zeros(int(SR * dur))
    for k, (n, o) in enumerate(names_oct):
        out += note(f(n, o), dur, kind, vol / len(names_oct), detunes[k % len(detunes)])
    return out

# ---------------- 1. Neon Skyline (Synthwave 110 BPM, Am) ----------------
def neon_skyline():
    bpm = 110; beat = 60 / bpm; bar = beat * 4
    total = bar * 8
    buf = np.zeros(int(SR * total))
    Am = [("A", 3), ("C", 4), ("E", 4)]; F = [("F", 3), ("A", 3), ("C", 4)]
    C = [("C", 4), ("E", 4), ("G", 4)]; G = [("G", 3), ("B", 3), ("D", 4)]
    prog = [Am, F, C, G]
    for b in range(8):
        ch = prog[b % 4]
        at = b * bar
        place(buf, chord(ch, bar * 0.98, "saw", 0.14), at)
        root = ch[0]
        for k in range(8):
            place(buf, note(f(root[0], root[1] - 1), beat * 0.45, "bass", 0.4), at + k * beat / 2)
        for k in range(16):
            n = ch[k % 3]
            place(buf, note(f(n[0], n[1] + 1), beat * 0.3, "square", 0.07), at + k * beat / 4)
        for k in range(4):
            place(buf, kick(vol=0.8), at + k * beat)
            place(buf, hat(vol=0.18), at + k * beat + beat / 2)
            if k % 2 == 1:
                place(buf, snare(vol=0.4), at + k * beat)
    return master(buf)

# ---------------- 2. Sunset Boulevard (Lo-fi 80 BPM) ----------------
def sunset_blvd():
    rs = np.random.RandomState(42)
    bpm = 80; beat = 60 / bpm; bar = beat * 4
    total = bar * 8
    buf = np.zeros(int(SR * total))
    prog = [
        [("C", 3), ("E", 3), ("G", 3), ("B", 3)],
        [("A", 2), ("C", 3), ("E", 3), ("G", 3)],
        [("F", 2), ("A", 2), ("C", 3), ("E", 3)],
        [("G", 2), ("B", 2), ("D", 3), ("F", 3)],
    ]
    for b in range(8):
        ch = prog[b % 4]
        at = b * bar
        for n, o in ch:
            place(buf, note(f(n, o), bar * 0.9, "tri", 0.12, decay=bar * 0.5), at + rs.uniform(0, 0.03))
        n, o = ch[0]
        place(buf, note(f(n, o), beat * 1.8, "bass", 0.42), at)
        place(buf, note(f(n, o), beat * 1.8, "bass", 0.3), at + beat * 2.5)
        for k in range(4):
            place(buf, kick(vol=0.5), at + k * beat)
            place(buf, hat(vol=0.1), at + k * beat + beat / 2)
            if k % 2 == 1:
                place(buf, snare(vol=0.22), at + k * beat)
        if b % 2 == 1:
            mel = [("E", 4), ("G", 4), ("A", 4), ("G", 4)]
            for k, (n, o) in enumerate(mel):
                place(buf, note(f(n, o), beat * 0.7, "sine", 0.16, decay=0.4), at + beat * (k + 0.5))
    noise = rs.uniform(-1, 1, len(buf)) * 0.012
    buf += noise
    return master(buf, 0.85)

# ---------------- 3. Midnight Groove (Funk 100 BPM, Em) ----------------
def midnight_groove():
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    total = bar * 8
    buf = np.zeros(int(SR * total))
    roots = [("E", 2), ("E", 2), ("A", 2), ("B", 2)]
    for b in range(8):
        r = roots[b % 4]
        at = b * bar
        patt = [0, 0.75, 1.5, 2, 2.75, 3.5]
        for p in patt:
            place(buf, note(f(r[0], r[1]), beat * 0.4, "bass", 0.5), at + p * beat)
        for p in [0.5, 1, 1.75, 2.5, 3, 3.25]:
            place(buf, note(f(r[0], r[1] + 2), beat * 0.25, "square", 0.09), at + p * beat)
        for p in [0, 1.5, 2.5]:
            place(buf, kick(vol=0.85), at + p * beat)
        for p in [1, 3]:
            place(buf, snare(vol=0.45), at + p * beat)
        for k in range(8):
            place(buf, hat(vol=0.16), at + k * beat / 2 + beat / 4)
        place(buf, chord([(r[0], r[1] + 2), (r[0], r[1] + 3.5)], beat * 0.6, "saw", 0.1), at + beat * 2)
    return master(buf, 0.9)

# ---------------- 4. Rêve Électrique (Electro house 124 BPM, F#m) ----------------
def reve_electrique():
    bpm = 124; beat = 60 / bpm; bar = beat * 4
    total = bar * 8
    buf = np.zeros(int(SR * total))
    prog = [
        [("F#", 3), ("A", 3), ("C#", 4)],
        [("D", 3), ("F#", 3), ("A", 3)],
        [("A", 3), ("C#", 4), ("E", 4)],
        [("E", 3), ("G#", 3), ("B", 3)],
    ]
    for b in range(8):
        ch = prog[b % 4]
        at = b * bar
        for k in range(4):
            place(buf, kick(vol=0.95), at + k * beat)
            place(buf, hat(vol=0.2), at + k * beat + beat / 2)
        place(buf, chord(ch, bar * 0.98, "saw", 0.12), at)
        for k in range(32):
            n = ch[k % 3]
            place(buf, note(f(n[0], n[1] + 1), beat * 0.22, "square", 0.05), at + k * beat / 8)
        if b % 4 == 3:
            for k in range(8):
                place(buf, snare(vol=0.12 + k * 0.04), at + beat * 2 + k * beat / 4)
    return master(buf, 0.9)

# ---------------- 5. Coffee & Rain (Ambient 70 BPM) ----------------
def coffee_rain():
    rs = np.random.RandomState(11)
    bpm = 70; beat = 60 / bpm; bar = beat * 4
    total = bar * 6
    buf = np.zeros(int(SR * total))
    prog = [
        [("C", 3), ("E", 3), ("G", 3)],
        [("A", 2), ("C", 3), ("E", 3)],
        [("F", 2), ("A", 2), ("C", 3)],
        [("G", 2), ("B", 2), ("D", 3)],
    ]
    for b in range(6):
        ch = prog[b % 4]
        at = b * bar
        for j, (n, o) in enumerate(ch):
            place(buf, note(f(n, o), beat * 2.2, "tri", 0.11, decay=1.2), at + j * beat * 0.12)
        for j in range(5):
            n, o = ch[j % 3]
            oo = o + (1 if j % 2 else 2)
            place(buf, note(f(n, oo), beat * 1.1, "sine", 0.13, decay=0.9), at + rs.uniform(0, max(0.1, bar - beat)))
    t = np.linspace(0, total, int(SR * total), endpoint=False)
    rain = rs.uniform(-1, 1, len(t))
    kernel = np.ones(24) / 24
    rain = np.convolve(rain, kernel, mode="same") * 0.35
    buf += rain
    return master(buf, 0.8)

# ---------------- 6. Rock Revival (Rock 140 BPM, Em) ----------------
def rock_revival():
    bpm = 140; beat = 60 / bpm; bar = beat * 4
    total = bar * 8
    buf = np.zeros(int(SR * total))
    roots = [("E", 2), ("G", 2), ("A", 2), ("E", 2)]
    for b in range(8):
        r = roots[b % 4]
        at = b * bar
        pc = np.zeros(int(SR * beat * 0.95))
        for iv in [0, 7, 12]:
            semis = NAMES.index(r[0]) + iv
            fr = 440.0 * (2 ** ((semis - 57 + 12 * (r[1] + 1)) / 12))
            pc += note(fr, beat * 0.95, "saw", 0.3)
        pc = np.tanh(pc * 2.2) * 0.22
        for k in range(2):
            place(buf, pc, at + k * beat * 2)
        for k in range(4):
            place(buf, kick(vol=0.9), at + k * beat)
            place(buf, snare(vol=0.5), at + k * beat + beat / 2)
            for h in range(2):
                place(buf, hat(vol=0.14), at + k * beat + h * beat / 2)
        if b % 4 == 3:
            mel = [("E", 4), ("D", 4), ("B", 3), ("A", 3)]
            for k, (n, o) in enumerate(mel):
                place(buf, note(f(n, o), beat * 0.5, "square", 0.1), at + k * beat)
    return master(buf, 0.85)

tracks = {
    "neon-skyline": neon_skyline,
    "sunset-boulevard": sunset_blvd,
    "midnight-groove": midnight_groove,
    "reve-electrique": reve_electrique,
    "coffee-and-rain": coffee_rain,
    "rock-revival": rock_revival,
}
for name, fn in tracks.items():
    path = os.path.join(OUT, f"{name}.wav")
    write_wav(path, fn())
    print(name, round(os.path.getsize(path) / 1e6, 2), "MB")
print("OK")
