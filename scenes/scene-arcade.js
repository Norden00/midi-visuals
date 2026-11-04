// ============ SCENE 1: ARCADE ============

const sceneArcade = {
  name: 'ARCADE',

  sound: {
    init() {
      this.keys = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 },
        volume: -14,
      }).toDestination();
      this.pads = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
        volume: -10,
      }).toDestination();
    },
    enter() {},
    exit() { this.keys.releaseAll(); },
    onEvent(e) {
      if (e.kind === 'noteOn' && e.note >= 24 && e.note <= 108)
        this.keys.triggerAttack(toNote(e.note), undefined, map(e.velocity, 1, 127, 0.15, 1));
      if (e.kind === 'noteOff' && e.note >= 24 && e.note <= 108)
        this.keys.triggerRelease(toNote(e.note));
      if (e.kind === 'padOn') {
        const base = e.bank === 'A' ? 48 : 36;
        this.pads.triggerAttackRelease(toNote(base + e.pad * 2), 0.15, undefined,
          map(e.velocity, 1, 127, 0.2, 1));
      }
    },
  },

  visual: {
    bursts: [], bend: 0, knobs: {},
    init() {},
    enter() { this.bursts = []; },
    exit() {},
    onEvent(e) {
      if (e.kind === 'noteOn') {
        this.bursts.push({
          x: snap(map(e.note, 48, 72, 40, width - 40)),
          y: height / 2, age: 0,
          size: map(e.velocity, 1, 127, 0.5, 1.5),
          c: PALETTE[e.note % PALETTE.length],
        });
      }
      if (e.kind === 'padOn') {
        this.bursts.push({
          x: snap(map(e.pad, 1, 8, 60, width - 60)),
          y: e.bank === 'A' ? height * 0.75 : height * 0.25,
          age: 0, size: 2, c: PALETTE[e.pad % PALETTE.length],
        });
      }
      if (e.kind === 'bend') this.bend = e.value;
      if (e.kind === 'knob') this.knobs[e.number] = e.value;
    },
    draw() {
      background(20);
      const speed = 1 + (this.knobs[3] ?? 0.3) * 3; // knob 3 = animation speed
      for (const b of this.bursts) {
        fill(b.c);
        const r = b.age * 2 * b.size;
        for (let a = 0; a < TWO_PI; a += PI / 4) {
          rect(snap(b.x + cos(a) * r), snap(b.y + sin(a) * r + this.bend * 60), CELL, CELL);
        }
        b.age += speed;
      }
      this.bursts = this.bursts.filter(b => b.age < 40);
    },
  },
};
