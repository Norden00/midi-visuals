// ============ LOOPER ============
// Record what you play for a fixed number of bars, then it loops while you play on top.
// Every recording pass is a "layer". Layers remember which scene they were played in,
// so you can record drums in the Drums scene, switch to Arcade, and play a melody over it.
//
// CONTROLS (Bank B pads, reserved for the looper):
//   Pad B6  (or R key)      record. First press = count-in, then it records for LOOP_CONFIG.bars bars
//                           and starts looping. While looping: press = overdub on the next round,
//                           press during an overdub = stop it. Press during count-in = cancel.
//   Pad B7  (or Space)      stop / restart the loop
//   Pad B8  (or Z / X)      undo last layer. Press twice quickly (or X) = clear everything
//   Knob 4                  BPM (60-180), only before recording
//   Knob 5                  loop length: 1, 2, 4 or 8 bars, only before recording
//   M key = metronome on/off, H key = show/hide the loop display

const LOOP_CONFIG = {
  bpm: 100,        // starting tempo
  bars: 4,         // starting loop length in bars (4 beats per bar)
  countIn: true,   // one bar of clicks before recording starts
  metronome: true, // clicks during count-in, recording and overdub
  quantize: true,  // snap recorded hits to 16th notes so the beat is tight
  showHud: true,   // loop display at the bottom of the screen
};
const LOOP_BARS = [1, 2, 4, 8];

const looper = {
  state: 'idle',        // idle | countin | recording | playing | stopped
  layers: [],           // [{ events: [{t, scene, e}], startCycle }]
  rec: null,            // the pass being recorded right now
  overdubArmed: false,
  overdubCycle: 0,      // the loop round where the armed overdub starts (after its count-in)
  bpm: LOOP_CONFIG.bpm, bars: LOOP_CONFIG.bars,
  metronome: LOOP_CONFIG.metronome, quantize: LOOP_CONFIG.quantize, showHud: LOOP_CONFIG.showHud,
  beat: 600, L: 9600, recBars: 4,   // beat length and loop length in ms (set when recording starts)
  t0: 0, loopStart: 0, lastAbs: 0, lastBeat: -1, lastUndo: 0,
  loopHeld: new Map(),  // notes started by the loop that have not been released yet

  init() {
    this.click = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
      volume: -18,
    }).toDestination();
    setInterval(() => this.tick(), 5); // the loop clock
    hub.on('knob', e => {
      if (this.state !== 'idle') return;
      if (e.number === 4) this.bpm = Math.round(60 + e.value * 120);
      if (e.number === 5) this.bars = LOOP_BARS[Math.min(LOOP_BARS.length - 1, Math.floor(e.value * LOOP_BARS.length))];
    });
  },

  // ---------- controls ----------
  // called by the scene manager first; returns true if the event was a looper pad
  control(e) {
    if ((e.kind !== 'padOn' && e.kind !== 'padOff') || e.bank !== 'B' || e.pad < 6 || e.pad > 8) return false;
    if (e.kind === 'padOn') {
      if (e.pad === 6) this.pressRecord();
      if (e.pad === 7) this.pressPlayStop();
      if (e.pad === 8) this.pressUndo();
    }
    return true;
  },

  key(k) {
    k = (k || '').toLowerCase();
    if (k === 'r') this.pressRecord();
    else if (k === ' ') this.pressPlayStop();
    else if (k === 'z') this.undo();
    else if (k === 'x') this.clear();
    else if (k === 'm') this.metronome = !this.metronome;
    else if (k === 'h') this.showHud = !this.showHud;
    else return false;
    return true;
  },

  pressRecord() {
    switch (this.state) {
      case 'idle': this.startCountIn(); break;
      case 'countin': this.state = 'idle'; break;                 // cancel
      case 'recording': this.rec = null; this.state = 'idle'; break; // discard the first take
      case 'playing':
        if (this.rec) this.commitRec(Math.max(1, performance.now() - this.rec.startMs)); // stop overdub early, keep it
        else if (this.overdubArmed) this.overdubArmed = false;    // cancel the armed overdub
        else { this.overdubArmed = true; this.overdubCycle = this.nextOverdubCycle(); }
        break;
      case 'stopped':                                              // count in, then restart and overdub
        if (LOOP_CONFIG.countIn) {
          this.startPlaying(4 * this.beat);
          this.overdubArmed = true; this.overdubCycle = 0;
        } else {
          this.startPlaying();
          this.rec = this.newRec(0);
        }
        break;
    }
  },

  pressPlayStop() {
    if (this.state === 'playing') this.stop();
    else if (this.state === 'stopped') this.startPlaying();
  },

  pressUndo() {
    const now = performance.now();
    if (now - this.lastUndo < 600) this.clear(); else this.undo();
    this.lastUndo = now;
  },

  undo() {
    this.layers.pop();
    if (!this.layers.length) this.clear();
  },

  clear() {
    this.releaseHeld();
    this.layers = []; this.rec = null; this.overdubArmed = false; this.state = 'idle';
  },

  // ---------- state changes ----------
  startCountIn() {
    const now = performance.now();
    this.beat = 60000 / this.bpm;
    this.recBars = this.bars;
    this.L = this.bars * 4 * this.beat;
    this.t0 = now;
    this.lastBeat = -1;
    if (LOOP_CONFIG.countIn) {
      this.loopStart = now + 4 * this.beat;
      this.state = 'countin';
    } else {
      this.loopStart = now;
      this.state = 'recording';
      this.rec = this.newRec(0);
    }
  },

  // delay = count-in time in ms before the loop starts again from the top
  startPlaying(delay = 0) {
    const now = performance.now();
    this.t0 = now; this.loopStart = now + delay;
    this.lastAbs = -delay; this.lastBeat = -1;
    this.layers.forEach(l => { l.startCycle = 0; });
    this.state = 'playing';
  },

  stop() {
    this.rec = null; this.overdubArmed = false;
    this.releaseHeld();
    this.state = 'stopped';
  },

  releaseHeld() {
    for (const h of this.loopHeld.values()) sceneManager.deliver({ kind: 'noteOff', note: h.note }, h.scene);
    this.loopHeld.clear();
  },

  // first loop round that leaves room for a full 1-bar count-in before the new layer
  nextOverdubCycle() {
    const abs = performance.now() - this.loopStart;
    let c = Math.floor(abs / this.L) + 1;
    if (LOOP_CONFIG.countIn) while (c * this.L - abs < 4 * this.beat) c++;
    return c;
  },

  // ms left of the count-in before an armed overdub starts (0 = no count-in right now)
  overdubCountdown(now) {
    if (this.state !== 'playing' || !this.overdubArmed || this.rec || !LOOP_CONFIG.countIn) return 0;
    const left = this.loopStart + this.overdubCycle * this.L - now;
    return left > 0 && left <= 4 * this.beat ? left : 0;
  },

  newRec(cycle) {
    return { cycle, startMs: this.loopStart + cycle * this.L, events: [], held: {} };
  },

  commitRec(endT = this.L - 1) {
    const r = this.rec; this.rec = null;
    for (const [note, h] of Object.entries(r.held))          // end notes that were still held
      r.events.push({ t: Math.max(h.t + 1, Math.min(endT, this.L - 1)), scene: h.scene, e: { kind: 'noteOff', note: +note } });
    if (r.events.length) this.layers.push({ events: r.events, startCycle: r.cycle + 1 });
  },

  // ---------- recording (called by the scene manager for every playable event) ----------
  record(e) {
    const r = this.rec;
    if (!r || !['noteOn', 'noteOff', 'padOn'].includes(e.kind)) return;
    const L = this.L, step = this.beat / 4;
    const t = Math.max(0, performance.now() - r.startMs);

    if (e.kind === 'noteOff') {
      const h = r.held[e.note];
      if (!h) return;                                         // key was pressed before recording
      delete r.held[e.note];
      r.events.push({ t: Math.min(Math.max(t + h.shift, h.t + 1), L - 1), scene: h.scene, e: { ...e } });
      return;
    }
    let q = t;
    if (this.quantize) { q = Math.round(t / step) * step; if (q >= L) q = 0; }
    else if (q >= L) q = L - 1;
    const scene = sceneManager.index;
    if (e.kind === 'noteOn') r.held[e.note] = { shift: q - t, t: q, scene };
    r.events.push({ t: q, scene, e: { ...e } });
  },

  // ---------- the clock ----------
  clock(now) {
    const active = this.state === 'countin' || this.state === 'recording' ||
      (this.state === 'playing' && (this.rec || this.overdubCountdown(now) > 0));
    if (!active || !this.metronome) return;
    const idx = Math.floor((now - this.t0) / this.beat);
    if (idx > this.lastBeat) {
      this.lastBeat = idx;
      const accent = idx % 4 === 0;
      this.click.triggerAttackRelease(accent ? 'G6' : 'C6', 0.03, Tone.now(), accent ? 0.9 : 0.5);
    }
  },

  tick() {
    const now = performance.now();
    this.clock(now);

    if (this.state === 'countin') {
      if (now < this.loopStart) return;
      this.state = 'recording'; this.rec = this.newRec(0);
    }
    if (this.state === 'recording') {
      if (now - this.loopStart < this.L) return;
      this.commitRec();                                       // first pass is over
      if (!this.layers.length) { this.state = 'idle'; return; } // nothing was played
      this.state = 'playing'; this.lastAbs = this.L; this.overdubArmed = false;
    }
    if (this.state !== 'playing') return;

    const L = this.L, abs = now - this.loopStart, cycle = Math.floor(abs / L);
    const lastCycle = Math.floor(this.lastAbs / L);
    if (this.rec && cycle > this.rec.cycle) this.commitRec();  // overdub pass finished
    if (this.overdubArmed && !this.rec && cycle >= this.overdubCycle) { // count-in done: begin overdub
      this.rec = this.newRec(cycle); this.overdubArmed = false;
    }

    // play every recorded event that became due since the last tick
    for (const layer of this.layers) {
      for (let c = Math.max(lastCycle, layer.startCycle); c <= cycle; c++) {
        for (const ev of layer.events) {
          const ta = c * L + ev.t;
          if (ta >= this.lastAbs && ta < abs) this.fire(ev);
        }
      }
    }
    this.lastAbs = abs;
  },

  fire(ev) {
    const e = { ...ev.e };
    const key = ev.scene + ':' + e.note;
    if (e.kind === 'noteOn') this.loopHeld.set(key, { note: e.note, scene: ev.scene });
    if (e.kind === 'noteOff') this.loopHeld.delete(key);
    sceneManager.deliver(e, ev.scene);
  },

  // ---------- display ----------
  draw() {
    if (!this.showHud) return;
    const now = performance.now();
    const running = this.state !== 'idle' && this.state !== 'stopped';
    const bars = running ? this.recBars : this.bars;
    const beats = bars * 4, bms = running ? this.beat : 60000 / this.bpm;

    let label, col = [200, 200, 200], pos = -1;
    if (this.state === 'idle') label = `LOOP  ${this.bpm} BPM  ${this.bars} bar${this.bars > 1 ? 's' : ''}   R / pad B6 = record`;
    else if (this.state === 'countin') { label = 'COUNT-IN'; col = [255, 200, 0]; }
    else if (this.state === 'recording') { label = '● REC'; col = [255, 60, 60]; pos = (now - this.loopStart) / bms; }
    else if (this.state === 'playing') {
      pos = (((now - this.loopStart) % this.L) + this.L) % this.L / bms;
      if (this.rec) { label = '● OVERDUB'; col = [255, 60, 60]; }
      else if (this.overdubCountdown(now)) { label = 'COUNT-IN  new layer'; col = [255, 200, 0]; }
      else if (this.overdubArmed) { label = '▶ LOOP   overdub soon'; col = [255, 200, 0]; }
      else { label = '▶ LOOP'; col = [60, 255, 120]; }
    } else { label = '■ STOPPED'; }
    if (this.layers.length) label += `   ${this.layers.length} layer${this.layers.length > 1 ? 's' : ''}`;

    push();
    noStroke(); textFont('monospace'); textAlign(LEFT, BASELINE);
    textSize(14); fill(...col); text(label, 12, height - 34);
    const cw = (width - 24) / beats;
    for (let i = 0; i < beats; i++) {
      fill(i <= pos ? color(...col) : color(255, 255, 255, i % 4 === 0 ? 70 : 35));
      rect(12 + i * cw, height - 24, cw - 3, i % 4 === 0 ? 10 : 7);
    }
    let n = 0;
    if (this.state === 'countin') n = 4 - Math.min(3, Math.floor((now - this.t0) / this.beat));
    else { const left = this.overdubCountdown(now); if (left) n = Math.ceil(left / this.beat); }
    if (n) {
      textAlign(CENTER, CENTER); textSize(160); fill(255, 255, 255, 210);
      text(n, width / 2, height / 2);
    }
    pop();
  },
};