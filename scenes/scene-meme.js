// ============ SCENE 4: MEME FX ============
// Keys 48-59 play 12 meme sounds, keys 60-72 repeat them one octave up.
// Pads play 5 extra effects. Each sound also shows a big pixel text/effect on screen.
//
// KEYS (default octave, C = 48):
//   C vineBoom   C# airhorn    D sadTrombone  D# recordScratch  E winError   F coin
//   F# dunDunDun G rimshot     G# slideUp     A slideDown       A# honk      B sparkle
// MEME CLIPS (recorded sound, replace the synth sounds on these keys):
//   White keys, middle octave:
//     C (60) ah (own pixel visual)   D (62) goOnMute       F (65) youNeedToLeave   G (67) state
//     A (69) hitTheRoad              B (71) private        top C (72) rocketLeague
//     E (64) keeps the synthesized winError.
//   Black keys, middle octave:
//     C# (61) miBombo   D# (63) nooo   F# (66) theRock   G# (68) tooMuchFood   A# (70) fah (own pixel visual)
//   Black keys, low octave (these two synth sounds are gone, the other low black keys keep theirs):
//     G# (56) laughingCat   A# (58) scream
// PADS: A1 explosion, A2 crickets, A3 siren, A4 applause, B5 bassDrop
// (Bank B pads 1-4 are kept free for switching scenes.)
//
// LOOPER: looped memes show their visuals too, but toned down (see MEME_LOOP_FX).
// If another scene is on screen, looped memes appear in a small box in the top-right corner.
//
// REAL MEME SOUNDS: this scene synthesizes its sounds, so it works with no files.
// To use a real recording instead, put an audio file in a "sounds" folder next to
// index.html and list it in SAMPLE_FILES below. If the file is missing, the
// synthesized version plays. Only use sounds you are allowed to use.

const MEME_KEYS = ['vineBoom', 'airhorn', 'sadTrombone', 'recordScratch', 'winError', 'coin',
                   'dunDunDun', 'rimshot', 'slideUp', 'slideDown', 'honk', 'sparkle'];
const MEME_PADS = { A1: 'explosion', A2: 'crickets', A3: 'siren', A4: 'applause', B5: 'bassDrop' };

// Keys that play something else than MEME_KEYS (note number -> name)
const MEME_NOTES = {
  // white keys
  60: 'ah', 62: 'goOnMute', 65: 'youNeedToLeave', 67: 'state', 69: 'hitTheRoad', 71: 'private', 72: 'rocketLeague',
  // black keys
  61: 'miBombo', 63: 'nooo', 66: 'theRock', 68: 'tooMuchFood', 70: 'fah',
  56: 'laughingCat', 58: 'scream',
};

// Video clips (shown on screen, muted). Their sound comes from SAMPLE_FILES below.
const MEME_VIDEOS = {
  hitTheRoad: 'videos/hit-the-road.mp4',
  private:    'videos/private.mp4',
  state:      'videos/state.mp4',
  youNeedToLeave: 'videos/you-need-to-leave.mp4',
  goOnMute:   'videos/go-on-mute.mp4',
  rocketLeague: 'videos/rocket-league.mp4',
  miBombo:    'videos/mi-bombo.mp4',
  nooo:       'videos/nooo.mp4',
  theRock:    'videos/the-rock.mp4',
  tooMuchFood: 'videos/too-much-food.mp4',
  laughingCat: 'videos/laughing-cat.mp4',
  scream:     'videos/scream.mp4',
  // ah and fah have no video on purpose (it was only a speaker icon): they use the 'shout' pixel effect
};

const SAMPLE_FILES = {
  hitTheRoad: 'sounds/hit-the-road.m4a',
  private:    'sounds/private.m4a',
  state:      'sounds/state.m4a',
  youNeedToLeave: 'sounds/you-need-to-leave.m4a',
  goOnMute:   'sounds/go-on-mute.m4a',
  rocketLeague: 'sounds/rocket-league.m4a',
  ah:         'sounds/ah.m4a',
  fah:        'sounds/fah.m4a',
  miBombo:    'sounds/mi-bombo.m4a',
  nooo:       'sounds/nooo.m4a',
  theRock:    'sounds/the-rock.m4a',
  tooMuchFood: 'sounds/too-much-food.m4a',
  laughingCat: 'sounds/laughing-cat.m4a',
  scream:     'sounds/scream.m4a',
  // vineBoom: 'sounds/vine-boom.mp3',
  // airhorn:  'sounds/airhorn.mp3',
};

// How looped memes look, so the loop does not turn the screen into total chaos
const MEME_LOOP_FX = {
  minGap: 10,      // frames between two looped effects (60 = 1 second). Hits closer than that are skipped
  strength: 0.4,   // flashes, shakes and darkening from the loop (1 = as strong as live)
  videoSize: 0.7,  // looped clips are drawn smaller than live ones
  maxFx: 8,        // max effects on screen at once
  overlay: true,   // corner box with looped memes while another scene is on screen
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
  // video clips: life = clip length in frames (60 per second)
  hitTheRoad:    { label: 'HIT THE ROAD DUDE', fx: 'video',   life: 72 },
  private:       { label: 'PRIVATE',           fx: 'video',   life: 110 },
  state:         { label: 'STATE?',            fx: 'video',   life: 42 },
  youNeedToLeave:{ label: 'YOU NEED TO LEAVE', fx: 'video',   life: 76 },
  goOnMute:      { label: 'GO ON MUTE',        fx: 'video',   life: 152 },
  rocketLeague:  { label: 'ROCKET LEAGUE',     fx: 'video',   life: 108 },
  miBombo:       { label: 'MI BOMBO',          fx: 'video',   life: 60 },
  nooo:          { label: 'NOOO!',             fx: 'video',   life: 60 },
  theRock:       { label: 'THE ROCK',          fx: 'video',   life: 60 },
  tooMuchFood:   { label: 'TOO MUCH FOOD',     fx: 'video',   life: 60 },
  laughingCat:   { label: 'HAHAHA',            fx: 'video',   life: 156 },
  scream:        { label: 'AAARGH!',           fx: 'video',   life: 60 },
  ah:            { label: 'AAAH!',             fx: 'shout',   life: 60 },
  fah:           { label: 'FAAAH!',            fx: 'shout',   life: 56 },
};

const memeForNote = n => MEME_NOTES[n] || (n >= 48 ? MEME_KEYS[(n - 48) % 12] : null);

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
    videos: {},
    mini: null,         // the looped meme shown in the corner box while another scene is on screen
    lastLoopFx: -999,   // frame of the last looped effect (for MEME_LOOP_FX.minGap)
    init() {
      // load the clips once, hidden and muted (the sound half plays the audio)
      for (const [name, url] of Object.entries(MEME_VIDEOS)) {
        const v = createVideo(url);
        v.hide();
        v.elt.muted = true;
        v.elt.playsInline = true;
        v.elt.onerror = () => console.warn('Could not load video', url);
        this.videos[name] = v;
      }
    },
    enter() { this.fx = []; this.mini = null; },
    exit() { Object.values(this.videos).forEach(v => v.elt.pause()); },

    videoReady(name) {
      const v = this.videos[name];
      return v && v.elt.readyState >= 2; // 2 = has a frame to show
    },

    nameFor(e) {
      if (e.kind === 'noteOn') return memeForNote(e.note);
      if (e.kind === 'padOn') return MEME_PADS[e.bank + e.pad];
      return null;
    },

    playVideo(name) {
      const v = this.videos[name];
      if (!v) return;
      v.elt.currentTime = 0; // restart the clip from the beginning
      v.elt.play().catch(() => {});
    },

    // looped hits are thinned out: not too close together, and a clip that is
    // still in its first half is not restarted
    loopHitAllowed(name, stillPlaying) {
      if (frameCount - this.lastLoopFx < MEME_LOOP_FX.minGap) return false;
      if (MEME_VIDEOS[name] && stillPlaying) return false;
      this.lastLoopFx = frameCount;
      return true;
    },

    onEvent(e) {
      const name = this.nameFor(e);
      if (!name) return;
      if (e.fromLoop) {
        const playing = this.fx.some(f => f.name === name && f.age < MEME_LOOK[name].life / 2);
        if (!this.loopHitAllowed(name, playing)) return;
      }
      this.playVideo(name);
      this.fx.push({ name, age: 0, loop: !!e.fromLoop, c: PALETTE[floor(random(PALETTE.length))] });
      while (this.fx.length > MEME_LOOP_FX.maxFx) this.fx.shift(); // drop the oldest
    },

    // looped meme while another scene is on screen
    onBackgroundEvent(e) {
      if (!MEME_LOOP_FX.overlay) return;
      const name = this.nameFor(e);
      if (!name) return;
      const m = this.mini;
      if (!this.loopHitAllowed(name, m && m.name === name && m.age < MEME_LOOK[name].life / 2)) return;
      this.playVideo(name);
      this.mini = { name, age: 0, c: PALETTE[floor(random(PALETTE.length))] };
    },

    // small corner box (top-right) drawn on top of the other scene
    drawOverlay() {
      const m = this.mini;
      if (!m) return;
      if (m.age >= MEME_LOOK[m.name].life) { this.mini = null; return; }
      push();
      noStroke();
      const right = width - CELL * 2, top = CELL * 2;
      if (this.videoReady(m.name)) {
        const el = this.videos[m.name].elt;
        const k = min(240 / el.videoWidth, 180 / el.videoHeight);
        const w = snap(el.videoWidth * k), h = snap(el.videoHeight * k);
        const x = snap(right - w), y = top + CELL;
        fill(m.c); rect(x - CELL, y - CELL, w + CELL * 2, h + CELL * 2);
        image(this.videos[m.name], x, y, w, h);
      } else {
        const label = MEME_LOOK[m.name].label;
        textSize(20); textStyle(BOLD); textAlign(RIGHT, TOP);
        const w = snap(textWidth(label) + CELL * 4);
        fill(m.c); rect(snap(right - w), top, w, CELL * 5);
        fill(0); text(label, right - CELL * 2, top + CELL);
      }
      pop();
      m.age++;
    },

    draw() {
      background(30, 10, 45);
      push();
      const cx = width / 2, cy = height / 2;

      const k = f => (f.loop ? MEME_LOOP_FX.strength : 1); // looped effects are softer

      // screen shake (applied to everything drawn after it)
      for (const f of this.fx) {
        if (MEME_LOOK[f.name].fx === 'shake') {
          const m = 14 * k(f) * (1 - f.age / MEME_LOOK[f.name].life);
          translate(random(-m, m), random(-m, m));
        }
      }

      for (const f of this.fx) {
        const look = MEME_LOOK[f.name];
        fill(f.c);
        switch (look.fx) {
          case 'flash':
            fill(255, max(0, 255 - f.age * 18) * k(f));
            rect(0, 0, width, height);
            break;
          case 'glitch':
            for (let i = 0; i < (f.loop ? 3 : 8); i++)
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
          case 'video': {
            if (!this.videoReady(f.name)) break;
            // fit the clip inside the screen (keeps its shape), chunky colored frame around it
            const el = this.videos[f.name].elt;
            const size = f.loop ? MEME_LOOP_FX.videoSize : 1; // looped clips are smaller
            const s = size * min((width - CELL * 4) / el.videoWidth, (height - CELL * 4) / el.videoHeight);
            const w = snap(el.videoWidth * s), h = snap(el.videoHeight * s);
            const x = snap(cx - w / 2), y = snap(cy - h / 2);
            rect(x - CELL, y - CELL, w + CELL * 2, h + CELL * 2);
            image(this.videos[f.name], x, y, w, h);
            break;
          }
          case 'shout': {
            // pixel sound waves: square rings growing out from the middle, plus a little shake
            const m = 10 * k(f) * (1 - f.age / MEME_LOOK[f.name].life);
            translate(random(-m, m), random(-m, m));
            for (let i = 0; i < 4; i++) {
              const r = snap(40 + f.age * 9 - i * 60);
              if (r <= 0) continue;
              fill(PALETTE[(i + floor(f.age / 4)) % PALETTE.length]);
              rect(snap(cx - r), snap(cy - r), r * 2, CELL * 2);        // top
              rect(snap(cx - r), snap(cy + r), r * 2 + CELL * 2, CELL * 2); // bottom
              rect(snap(cx - r), snap(cy - r), CELL * 2, r * 2);        // left
              rect(snap(cx + r), snap(cy - r), CELL * 2, r * 2);        // right
            }
            break;
          }
          case 'sad':
            fill(0, 0, 0, min(f.age * 6, 150) * k(f));
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
      if (last && !(MEME_VIDEOS[last.name] && this.videoReady(last.name))) {
        const bump = last.age < 5 && !last.loop ? (5 - last.age) * 6 : 0;
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        textSize((last.loop ? 36 : 56) + bump); // looped text is smaller
        fill(0); text(MEME_LOOK[last.name].label, cx + 4, cy + 4);
        fill(255); text(MEME_LOOK[last.name].label, cx, cy);
      }
      pop();
      this.fx = this.fx.filter(f => f.age < MEME_LOOK[f.name].life);
    },
  },
};