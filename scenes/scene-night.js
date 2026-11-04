// ============ SCENE 2: NIGHT RAIN ============

const sceneNight = {
  name: 'NIGHT RAIN',

  sound: {
    init() {
      this.delay = new Tone.FeedbackDelay('8n', 0.35).toDestination();
      this.delay.wet.value = 0.4;
      this.keys = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 1.0 },
        volume: -12,
      }).connect(this.delay);
      this.pads = new Tone.MembraneSynth({ volume: -8 }).toDestination();
    },
    enter() {},
    exit() { this.keys.releaseAll(); },
    onEvent(e) {
      if (e.kind === 'noteOn' && e.note >= 24 && e.note <= 108)
        this.keys.triggerAttack(toNote(e.note), undefined, map(e.velocity, 1, 127, 0.15, 1));
      if (e.kind === 'noteOff' && e.note >= 24 && e.note <= 108)
        this.keys.triggerRelease(toNote(e.note));
      if (e.kind === 'padOn')
        this.pads.triggerAttackRelease(toNote(30 + e.pad * 2), '8n', undefined,
          map(e.velocity, 1, 127, 0.3, 1));
    },
  },

  visual: {
    drops: [],
    init() {},
    enter() { this.drops = []; },
    exit() {},
    onEvent(e) {
      if (e.kind === 'noteOn') {
        this.drops.push({
          x: snap(map(e.note, 48, 72, 40, width - 40)), y: 0,
          vy: map(e.velocity, 1, 127, 2, 8),
          len: floor(map(e.velocity, 1, 127, 3, 10)),
          c: PALETTE[e.note % PALETTE.length],
        });
      }
      if (e.kind === 'padOn') {
        for (let i = 0; i < 12; i++) {
          this.drops.push({
            x: snap(random(width)), y: 0, vy: random(3, 9),
            len: floor(random(2, 6)), c: PALETTE[e.pad % PALETTE.length],
          });
        }
      }
    },
    draw() {
      background(10, 10, 40);
      for (const d of this.drops) {
        fill(d.c);
        for (let i = 0; i < d.len; i++) rect(d.x, snap(d.y) - i * CELL, CELL, CELL);
        d.y += d.vy;
      }
      this.drops = this.drops.filter(d => d.y - d.len * CELL < height);
    },
  },
};
