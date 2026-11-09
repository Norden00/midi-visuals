// ============ SCENE 4: MEME FX ============
// Keys 48-59 play 12 meme sounds, keys 60-72 repeat them one octave up.
// Pads play 5 extra effects. Each sound also shows a big pixel text/effect on screen.
//
// KEYS (default octave, C = 48):
//   C vineBoom   C# airhorn    D sadTrombone  D# recordScratch  E winError   F coin
//   F# dunDunDun G rimshot     G# slideUp     A slideDown       A# honk      B sparkle
// PADS: A1 explosion, A2 crickets, A3 siren, A4 applause, B5 bassDrop
// (Bank B pads 1-4 are kept free for switching scenes.)
//
// REAL MEME SOUNDS: this scene synthesizes its sounds, so it works with no files.
// To use a real recording instead, put an audio file in a "sounds" folder next to
// index.html and list it in SAMPLE_FILES below. If the file is missing, the
// synthesized version plays. Only use sounds you are allowed to use.

const MEME_KEYS = ['vineBoom', 'airhorn', 'sadTrombone', 'recordScratch', 'winError', 'coin',
                   'dunDunDun', 'rimshot', 'slideUp', 'slideDown', 'honk', 'sparkle'];
const MEME_PADS = { A1: 'explosion', A2: 'crickets', A3: 'siren', A4: 'applause', B5: 'bassDrop' };

const SAMPLE_FILES = {
  // vineBoom: 'sounds/vine-boom.mp3',
  // airhorn:  'sounds/airhorn.mp3',
};

// what each sound looks like: label, effect type, how many frames it lasts
const MEME_LOOK = {
  vineBoom:      { label: 'BOOM',              fx: 'shake',   life: 24 },
  airhorn:       { label: 'AIR HORN!',         fx: 'flash',   life: 30 },
  sadTrombone:   { label: 'wah wah wah waaah', fx: 'sad',     life: 90 },
  recordScratch: { label: '*scratch*',         fx: 'glitch',  life: 24 },
  winError:      { label: 'ERROR',             fx: 'box',     life: 50 },
  coin:          { label: '+1 COIN',           fx: 'rise',    life: 40 },
  dunDunDun:     { label: 'DUN DUN DUN',       fx: 'shake',   life: 40 },
  rimshot:       { label: 'ba dum tss',        fx: 'flash',   life: 24 },
  slideUp:       { label: 'wheee',             fx: 'rise',    life: 40 },
  slideDown:     { label: 'wooooo',            fx: 'fall',    life: 40 },
  honk:          { label: 'HONK',              fx: 'shake',   life: 20 },
  sparkle:       { label: 'WOW',               fx: 'sparkle', life: 30 },
  explosion:     { label: 'BOOM!!',            fx: 'flash',   life: 40 },
  crickets:      { label: '...',               fx: 'sad',     life: 70 },
  siren:         { label: 'WEE WOO',           fx: 'glitch',  life: 60 },
  applause:      { label: 'GG',                fx: 'sparkle', life: 60 },
  bassDrop:      { label: 'DROP',              fx: 'shake',   life: 45 },
};

const memeForNote = n => (n >= 48 ? MEME_KEYS[(n - 48) % 12] : null);

const sceneMeme = {
  name: 'MEME FX',

  sound: {
    init() {
      const poly = (type, vol, env, dest) => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type }, volume: vol,
        envelope: env || { attack: 0.005, decay: 0.1, sustain: 0.8, release: 0.1 },
      }).connect(dest || Tone.Destination);

      // airhorn: three stacked saws with a little vibrato
      this.vibrato = new Tone.Vibrato(6, 0.12).toDestination();
      this.horn = poly('sawtooth', -16, { attack: 0.01, decay: 0.05, sustain: 0.9, release: 0.08 }, this.vibrato);

      // sad trombone: dull saw through a low-pass filter
      this.dullFilter = new Tone.Filter(900, 'lowpass').toDestination();
      this.trombone = poly('sawtooth', -10, { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.15 }, this.dullFilter);

      this.beep = poly('square', -18);
      this.chime = poly('triangle', -14, { attack: 0.002, decay: 0.2, sustain: 0.2, release: 0.5 });
      this.dun = poly('sawtooth', -12, { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 });
      this.tick = poly('sine', -22, { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 });
      this.polys = [this.horn, this.trombone, this.beep, this.chime, this.dun, this.tick];

      // one-voice instruments (each hit needs a strictly later start time, see play())
      this.boom = new Tone.MembraneSynth({
        pitchDecay: 0.4, octaves: 4,
        envelope: { attack: 0.001, decay: 1.0, sustain: 0, release: 0.5 }, volume: -2,
      }).toDestination();
      this.rumble = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.5 }, volume: -8,
      }).toDestination();
      this.tom = new Tone.MembraneSynth({
        pitchDecay: 0.08, octaves: 2,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }, volume: -6,
      }).toDestination();
      this.tss = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 }, volume: -16,
      }).connect(new Tone.Filter(6000, 'highpass').toDestination());
      this.scratchFilter = new Tone.Filter(800, 'bandpass').toDestination();
      this.scratch = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.05 }, volume: -8,
      }).connect(this.scratchFilter);
      this.slide = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 }, volume: -12,
      }).toDestination();
      this.siren = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 }, volume: -20,
      }).toDestination();
      this.sub = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.9, release: 0.3 }, volume: -2,
      }).toDestination();
      this.crowd = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }, volume: -8,
      }).connect(new Tone.Filter(2000, 'bandpass').toDestination());

      // optional real recordings
      this.samples = {};
      for (const [name, url] of Object.entries(SAMPLE_FILES)) {
        this.samples[name] = new Tone.Player({
          url, onerror: () => console.warn('Could not load sample', url, '- using synth'),
        }).toDestination();
      }
    },

    enter() {},
    exit() { this.polys.forEach(p => p.releaseAll()); },

    play(name, velocity) {
      const v = map(velocity, 1, 127, 0.2, 1);
      const base = Tone.now();
      // one-voice instruments must start strictly later than their previous hit
      const at = (inst, extra = 0) => {
        const t = Math.max(base, (inst._last ?? 0) + 0.001);
        inst._last = t + extra;
        return t;
      };

      const sample = this.samples[name];
      if (sample && sample.loaded) {
        sample.volume.value = Tone.gainToDb(v);
        sample.start(at(sample));
        return;
      }

      switch (name) {
        case 'vineBoom': {
          this.boom.triggerAttackRelease('C1', '2n', at(this.boom), v);
          this.rumble.triggerAttackRelease('4n', at(this.rumble), v * 0.6);
          break;
        }
        case 'airhorn': {
          const t = base;
          this.horn.triggerAttackRelease(['A#3', 'D4', 'F4'], 0.22, t, v);
          this.horn.triggerAttackRelease(['A#3', 'D4', 'F4'], 0.22, t + 0.3, v);
          this.horn.triggerAttackRelease(['A#3', 'D4', 'F4'], 0.7, t + 0.6, v);
          break;
        }
        case 'sadTrombone': {
          const t = base;
          this.trombone.triggerAttackRelease('A#3', 0.4, t, v);
          this.trombone.triggerAttackRelease('A3', 0.4, t + 0.45, v);
          this.trombone.triggerAttackRelease('G#3', 0.4, t + 0.9, v);
          this.trombone.triggerAttackRelease('G3', 1.1, t + 1.35, v);
          break;
        }
        case 'recordScratch': {
          const t = at(this.scratch);
          this.scratchFilter.frequency.setValueAtTime(500, t);
          this.scratchFilter.frequency.exponentialRampToValueAtTime(4000, t + 0.1);
          this.scratchFilter.frequency.exponentialRampToValueAtTime(300, t + 0.35);
          this.scratch.triggerAttackRelease(0.35, t, v);
          break;
        }
        case 'winError': {
          this.beep.triggerAttackRelease('E5', 0.1, base, v);
          this.beep.triggerAttackRelease('E5', 0.2, base + 0.16, v);
          break;
        }
        case 'coin': {
          this.chime.triggerAttackRelease('B5', 0.08, base, v);
          this.chime.triggerAttackRelease('E6', 0.5, base + 0.08, v);
          break;
        }
        case 'dunDunDun': {
          this.dun.triggerAttackRelease(['D2', 'A2'], 0.25, base, v);
          this.dun.triggerAttackRelease(['D2', 'A2'], 0.25, base + 0.4, v);
          this.dun.triggerAttackRelease(['D2', 'A2'], 1.1, base + 0.8, v);
          break;
        }
        case 'rimshot': {
          const t = at(this.tom, 0.15);
          this.tom.triggerAttackRelease('G2', '16n', t, v);
          this.tom.triggerAttackRelease('C2', '16n', t + 0.15, v);
          this.tss.triggerAttackRelease(0.3, at(this.tss), v);
          break;
        }
        case 'slideUp': {
          const t = at(this.slide);
          this.slide.triggerAttackRelease(400, 0.45, t, v);
          this.slide.frequency.setValueAtTime(400, t);
          this.slide.frequency.exponentialRampToValueAtTime(2000, t + 0.4);
          break;
        }
        case 'slideDown': {
          const t = at(this.slide);
          this.slide.triggerAttackRelease(2000, 0.45, t, v);
          this.slide.frequency.setValueAtTime(2000, t);
          this.slide.frequency.exponentialRampToValueAtTime(300, t + 0.4);
          break;
        }
        case 'honk': {
          this.beep.triggerAttackRelease('F#3', 0.1, base, v);
          this.beep.triggerAttackRelease('F#3', 0.3, base + 0.15, v);
          break;
        }
        case 'sparkle': {
          ['C6', 'E6', 'G6', 'C7'].forEach((n, i) =>
            this.chime.triggerAttackRelease(n, 0.2, base + i * 0.07, v));
          break;
        }
        case 'explosion': {
          this.rumble.triggerAttackRelease('1n', at(this.rumble), v);
          this.boom.triggerAttackRelease('C0', '2n', at(this.boom), v);
          break;
        }
        case 'crickets': {
          for (let i = 0; i < 8; i++)
            this.tick.triggerAttackRelease('E7', 0.03, base + (i % 4) * 0.06 + Math.floor(i / 4) * 0.4, v);
          break;
        }
        case 'siren': {
          const t = at(this.siren, 1.2);
          this.siren.triggerAttackRelease(700, 1.2, t, v);
          for (let i = 0; i < 4; i++)
            this.siren.frequency.setValueAtTime(i % 2 ? 700 : 950, t + i * 0.3);
          break;
        }
        case 'applause': {
          const t = at(this.crowd, 0.9);
          for (let i = 0; i < 15; i++)
            this.crowd.triggerAttackRelease(0.04, t + i * 0.06, v);
          break;
        }
        case 'bassDrop': {
          const t = at(this.sub);
          this.sub.triggerAttackRelease(150, 1.0, t, v);
          this.sub.frequency.setValueAtTime(150, t);
          this.sub.frequency.exponentialRampToValueAtTime(35, t + 0.9);
          break;
        }
      }
    },

    onEvent(e) {
      if (e.kind === 'noteOn') {
        const name = memeForNote(e.note);
        if (name) this.play(name, e.velocity);
      }
      if (e.kind === 'padOn') {
        const name = MEME_PADS[e.bank + e.pad];
        if (name) this.play(name, e.velocity);
      }
    },
  },

  visual: {
    fx: [],
    init() {},
    enter() { this.fx = []; },
    exit() {},

    onEvent(e) {
      let name = null;
      if (e.kind === 'noteOn') name = memeForNote(e.note);
      if (e.kind === 'padOn') name = MEME_PADS[e.bank + e.pad];
      if (name) this.fx.push({ name, age: 0, c: PALETTE[floor(random(PALETTE.length))] });
    },

    draw() {
      background(30, 10, 45);
      push();
      const cx = width / 2, cy = height / 2;

      // screen shake (applied to everything drawn after it)
      for (const f of this.fx) {
        if (MEME_LOOK[f.name].fx === 'shake') {
          const m = 14 * (1 - f.age / MEME_LOOK[f.name].life);
          translate(random(-m, m), random(-m, m));
        }
      }

      for (const f of this.fx) {
        const look = MEME_LOOK[f.name];
        fill(f.c);
        switch (look.fx) {
          case 'flash':
            fill(255, max(0, 255 - f.age * 18));
            rect(0, 0, width, height);
            break;
          case 'glitch':
            for (let i = 0; i < 8; i++)
              rect(0, snap(random(height)), width, CELL * floor(random(1, 4)));
            break;
          case 'box':
            fill(200); rect(snap(cx - 200), snap(cy - 80), 400, 160);
            fill(0, 0, 170); rect(snap(cx - 200), snap(cy - 80), 400, CELL * 3);
            fill(220, 0, 0); rect(snap(cx - 190), snap(cy - 20), CELL * 4, CELL * 4);
            break;
          case 'rise':
            for (let i = 0; i < 10; i++)
              rect(snap(width * (i + 0.5) / 10), snap(height - f.age * 12 - i * 10), CELL * 2, CELL * 2);
            break;
          case 'fall':
            for (let i = 0; i < 10; i++)
              rect(snap(width * (i + 0.5) / 10), snap(f.age * 12 - i * 10), CELL * 2, CELL * 2);
            break;
          case 'sparkle':
            for (let i = 0; i < 10; i++)
              rect(snap(random(width)), snap(random(height)), CELL, CELL);
            break;
          case 'sad':
            fill(0, 0, 0, min(f.age * 6, 150));
            rect(0, 0, width, height);
            fill(80, 160, 255);
            for (let i = 0; i < 8; i++)
              rect(snap(width * (i + 0.5) / 8), snap(f.age * 8 - i * 20), CELL, CELL * 2);
            break;
        }
        f.age++;
      }

      // big meme text for the newest effect
      const last = this.fx[this.fx.length - 1];
      if (last) {
        const bump = last.age < 5 ? (5 - last.age) * 6 : 0;
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        textSize(56 + bump);
        fill(0); text(MEME_LOOK[last.name].label, cx + 4, cy + 4);
        fill(255); text(MEME_LOOK[last.name].label, cx, cy);
      }
      pop();
      this.fx = this.fx.filter(f => f.age < MEME_LOOK[f.name].life);
    },
  },
};