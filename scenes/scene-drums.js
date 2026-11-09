// ============ SCENE 3: DRUMS ON THE KEYS ============
// ALL keys (48-72) play drums, so the whole keyboard is a drum kit.
// Pads play effects. Edit the two tables below to change the layout.
//
// KEYS (default octave):
//   C  kick      C# kick2     D  snare     D# clap      E  snare
//   F  tomLow    F# hatClosed G  tomMid    G# hatOpen   A  tomHigh
//   A# hatClosed B  crash     | 60-72: second set, see table below
//
// PADS: A1 zap, A2 zapUp, A3 riser, A4 impact, B5 crash
// (Bank B pads 1-4 are kept free for switching scenes.)

const DRUM_KEYS = {
  48: 'kick',     49: 'kick2',     50: 'snare',     51: 'clap',     52: 'snare',
  53: 'tomLow',   54: 'hatClosed', 55: 'tomMid',    56: 'hatOpen',  57: 'tomHigh',
  58: 'hatClosed', 59: 'crash',
  60: 'kick',     61: 'hatOpen',   62: 'snare',     63: 'clap',     64: 'tomLow',
  65: 'tomMid',   66: 'hatClosed', 67: 'tomHigh',   68: 'hatOpen',  69: 'crash',
  70: 'kick2',    71: 'snare',     72: 'crash',
};

const FX_PADS = {
  A1: 'zap', A2: 'zapUp', A3: 'riser', A4: 'impact', B5: 'crash',
};

const sceneDrums = {
  name: 'DRUMS',

  sound: {
    init() {
      // soft synth for the upper keys
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.4 },
        volume: -16,
      }).toDestination();

      this.kick = new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 6,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
        volume: -4,
      }).toDestination();

      this.snare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
        volume: -8,
      }).toDestination();

      this.clapFilter = new Tone.Filter(1500, 'bandpass').toDestination();
      this.clap = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0 },
        volume: -6,
      }).connect(this.clapFilter);

      this.hat = new Tone.MetalSynth({
        frequency: 250,
        envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
        volume: -20,
      }).toDestination();

      this.tom = new Tone.MembraneSynth({
        pitchDecay: 0.08, octaves: 2,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
        volume: -6,
      }).toDestination();

      this.crashFilter = new Tone.Filter(5000, 'highpass').toDestination();
      this.crash = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 0.5 },
        volume: -14,
      }).connect(this.crashFilter);

      // effects (pads)
      this.zapSynth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
        volume: -14,
      }).toDestination();

      this.sweep = new Tone.Filter(400, 'lowpass').toDestination();
      this.riserNoise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 1.2, decay: 0.1, sustain: 1, release: 0.4 },
        volume: -14,
      }).connect(this.sweep);

      this.boom = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.5 },
        volume: -6,
      }).toDestination();
    },

    enter() {},
    exit() { this.synth.releaseAll(); },

    play(action, velocity) {
      const v = map(velocity, 1, 127, 0.2, 1);
      const t = Tone.now();
      switch (action) {
        case 'kick':      this.kick.triggerAttackRelease('C1', '8n', t, v); break;
        case 'kick2':     this.kick.triggerAttackRelease('G1', '16n', t, v); break;
        case 'snare':     this.snare.triggerAttackRelease('16n', t, v); break;
        case 'clap':
          this.clap.triggerAttackRelease('32n', t, v);
          this.clap.triggerAttackRelease('32n', t + 0.02, v);
          break;
        case 'hatClosed': this.hat.triggerAttackRelease('C4', '32n', t, v); break;
        case 'hatOpen':   this.hat.triggerAttackRelease('C4', '8n', t, v); break;
        case 'tomLow':    this.tom.triggerAttackRelease('D2', '8n', t, v); break;
        case 'tomMid':    this.tom.triggerAttackRelease('G2', '8n', t, v); break;
        case 'tomHigh':   this.tom.triggerAttackRelease('C3', '8n', t, v); break;
        case 'crash':     this.crash.triggerAttackRelease('1n', t, v); break;
        case 'zap':
          this.zapSynth.triggerAttackRelease(1500, '8n', t, v);
          this.zapSynth.frequency.setValueAtTime(1500, t);
          this.zapSynth.frequency.exponentialRampToValueAtTime(100, t + 0.2);
          break;
        case 'zapUp':
          this.zapSynth.triggerAttackRelease(200, '8n', t, v);
          this.zapSynth.frequency.setValueAtTime(200, t);
          this.zapSynth.frequency.exponentialRampToValueAtTime(2000, t + 0.25);
          break;
        case 'riser':
          this.sweep.frequency.setValueAtTime(400, t);
          this.sweep.frequency.exponentialRampToValueAtTime(8000, t + 1.5);
          this.riserNoise.triggerAttackRelease(1.5, t, v);
          break;
        case 'impact':
          this.boom.triggerAttackRelease('1n', t, v);
          this.kick.triggerAttackRelease('C0', '2n', t, v);
          break;
      }
    },

    onEvent(e) {
      if (e.kind === 'noteOn') {
        const drum = DRUM_KEYS[e.note];
        if (drum) this.play(drum, e.velocity);
        else if (e.note >= 60 && e.note <= 108)
          this.synth.triggerAttack(toNote(e.note), undefined, map(e.velocity, 1, 127, 0.15, 1));
      }
      if (e.kind === 'noteOff' && !DRUM_KEYS[e.note] && e.note >= 60 && e.note <= 108)
        this.synth.triggerRelease(toNote(e.note));
      if (e.kind === 'padOn') {
        const fx = FX_PADS[e.bank + e.pad];
        if (fx) this.play(fx, e.velocity);
      }
    },
  },

  visual: {
    fx: [],
    init() {},
    enter() { this.fx = []; },
    exit() {},

    onEvent(e) {
      if (e.kind === 'noteOn') {
        const drum = DRUM_KEYS[e.note];
        if (drum) this.fx.push({ type: drum, age: 0, c: PALETTE[e.note % PALETTE.length] });
        else this.fx.push({ type: 'key', age: 0,
          x: snap(map(e.note, 60, 72, 40, width - 40)),
          c: PALETTE[e.note % PALETTE.length] });
      }
      if (e.kind === 'padOn') {
        const fx = FX_PADS[e.bank + e.pad];
        if (fx) this.fx.push({ type: fx, age: 0, c: PALETTE[e.pad % PALETTE.length] });
      }
    },

    draw() {
      background(15, 10, 25);
      const cx = width / 2, cy = height / 2;
      for (const f of this.fx) {
        fill(f.c);
        switch (f.type) {
          case 'kick':      this.ring(cx, cy, f.age * 14, 20); break;
          case 'kick2':     this.ring(cx, cy, f.age * 9, 14); break;
          case 'snare':     rect(0, snap(cy - 40), width, snap(80 - f.age * 6)); break;
          case 'clap':
            rect(0, snap(cy - 60), width, CELL * 2);
            rect(0, snap(cy + 60), width, CELL * 2);
            break;
          case 'tomLow':    this.ring(width * 0.25, cy, f.age * 8, 12); break;
          case 'tomMid':    this.ring(width * 0.5,  cy, f.age * 8, 12); break;
          case 'tomHigh':   this.ring(width * 0.75, cy, f.age * 8, 12); break;
          case 'hatClosed': case 'hatOpen':
            for (let i = 0; i < 6; i++)
              rect(snap(random(width)), snap(random(height * 0.3)), CELL, CELL);
            break;
          case 'crash':     this.ring(cx, cy, f.age * 20, 32); break;
          case 'zap': {
            const p = f.age / 12;
            for (let i = 0; i < 6; i++)
              rect(snap(p * width - i * 24), snap(p * height - i * 14), CELL, CELL);
            break;
          }
          case 'zapUp': {
            const p = f.age / 12;
            for (let i = 0; i < 6; i++)
              rect(snap(p * width - i * 24), snap(height - p * height + i * 14), CELL, CELL);
            break;
          }
          case 'riser':     rect(0, snap(height - f.age * 6), width, snap(f.age * 6)); break;
          case 'impact':    fill(255, 255 - f.age * 25); rect(0, 0, width, height); break;
          case 'key':       rect(f.x, snap(height - 40 - f.age * 4), CELL * 2, CELL * 2); break;
        }
        f.age++;
      }
      const life = { kick: 25, kick2: 20, snare: 12, clap: 8, tomLow: 25, tomMid: 25, tomHigh: 25,
                     hatClosed: 4, hatOpen: 10, crash: 30, zap: 14, zapUp: 14,
                     riser: 90, impact: 10, key: 40 };
      this.fx = this.fx.filter(f => f.age < life[f.type]);
    },

    ring(cx, cy, r, n) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TWO_PI;
        rect(snap(cx + cos(a) * r), snap(cy + sin(a) * r), CELL * 2, CELL * 2);
      }
    },
  },
};