// ============ ON-SCREEN CONTROL PANEL ============
// A panel that floats over the bottom of the (full-window) canvas.
//   P = show/hide the panel     F = fullscreen on/off
// Everything here calls the same functions the pads and keys already use,
// so the MIDI controller and the panel always stay in sync.

const ui = {
  init() {
    const css = `
      #panel { position:fixed; left:0; right:0; bottom:0; z-index:10; box-sizing:border-box;
        max-height:70vh; overflow:auto; padding:10px 14px 12px;
        background:rgba(12,12,18,.86); border-top:1px solid #333; backdrop-filter:blur(6px);
        color:#ddd; font:14px/1.4 monospace; }
      #panel.hidden { display:none; }
      #panel .row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:0 0 8px; }
      #panel .label { width:70px; color:#888; font-size:12px; letter-spacing:1px; }
      #panel button, #showPanel { font:inherit; color:#ddd; background:#2a2a35; border:1px solid #444;
        border-radius:6px; padding:7px 14px; cursor:pointer; }
      #panel button:hover:not(:disabled) { background:#3a3a4a; }
      #panel button:disabled { opacity:.35; cursor:default; }
      #panel button.active { background:#29adff; color:#000; border-color:#29adff; }
      #panel button.rec { background:#ff004d; color:#fff; border-color:#ff004d; }
      #panel button.live { background:#00e436; color:#000; border-color:#00e436; }
      #panel .status { margin-left:8px; color:#ffa300; }
      #panel .chip { background:#222; border:1px solid #444; border-radius:12px; padding:2px 10px; }
      #panel input[type=range] { width:130px; vertical-align:middle; }
      #panel select { font:inherit; background:#2a2a35; color:#ddd; border:1px solid #444; border-radius:4px; padding:4px; }
      #panel label { display:inline-flex; align-items:center; gap:4px; cursor:pointer; margin-right:14px; }
      /* small button that brings the panel back; nearly invisible so it never shows up on the LED screen */
      #showPanel { position:fixed; right:10px; bottom:10px; z-index:11; padding:4px 10px; opacity:.06; }
      #showPanel:hover { opacity:1; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const el = (tag, props = {}, parent) => {
      const n = Object.assign(document.createElement(tag), props);
      if (parent) parent.appendChild(n);
      return n;
    };
    const row = (label) => {
      const r = el('div', { className: 'row' }, this.panel);
      el('span', { className: 'label', textContent: label }, r);
      return r;
    };
    // click handler that also gives the button back focus, so Space/R don't trigger it twice
    const onClick = (btn, fn) => btn.addEventListener('click', () => { fn(); this.update(); btn.blur(); });

    this.panel = el('div', { id: 'panel' }, document.body);
    this.panel.addEventListener('pointerdown', () => Tone.start()); // any click unlocks audio

    this.showBtn = el('button', { id: 'showPanel', type: 'button', textContent: '☰ P', title: 'Show controls (P)' }, document.body);
    this.showBtn.style.display = 'none';
    onClick(this.showBtn, () => this.setPanel(true));

    // --- view ---
    const viewRow = row('VIEW');
    this.fsBtn = el('button', { type: 'button' }, viewRow);
    const hideBtn = el('button', { type: 'button', textContent: 'Hide panel (P)' }, viewRow);
    onClick(this.fsBtn, () => this.toggleFullscreen());
    onClick(hideBtn, () => this.setPanel(false));

    // --- scenes ---
    const sceneRow = row('SCENES');
    this.sceneBtns = scenes.map((s, i) => {
      const b = el('button', { type: 'button', textContent: `${i + 1}  ${s.name}` }, sceneRow);
      onClick(b, () => sceneManager.switchTo(i));
      return b;
    });

    // --- loop ---
    const loopRow = row('LOOP');
    this.recBtn = el('button', { type: 'button' }, loopRow);
    this.playBtn = el('button', { type: 'button' }, loopRow);
    this.undoBtn = el('button', { type: 'button', textContent: 'Undo layer' }, loopRow);
    this.clearBtn = el('button', { type: 'button', textContent: 'Clear all' }, loopRow);
    this.status = el('span', { className: 'status' }, loopRow);
    onClick(this.recBtn, () => looper.pressRecord());
    onClick(this.playBtn, () => looper.pressPlayStop());
    onClick(this.undoBtn, () => looper.undo());
    onClick(this.clearBtn, () => looper.clear());

    this.layerRow = row('LAYERS');
    this.layerLabel = this.layerRow.firstChild;

    // --- settings ---
    const setRow = row('SETTINGS');
    const bpmLabel = el('label', { textContent: 'BPM ' }, setRow);
    this.bpm = el('input', { type: 'range', min: 60, max: 180, step: 1 }, bpmLabel);
    this.bpmVal = el('span', {}, bpmLabel);
    this.bpm.addEventListener('input', () => { if (looper.state === 'idle') looper.bpm = +this.bpm.value; });
    this.bpm.addEventListener('change', () => this.bpm.blur());

    const barsLabel = el('label', { textContent: 'Bars ' }, setRow);
    this.bars = el('select', {}, barsLabel);
    LOOP_BARS.forEach(b => el('option', { value: b, textContent: b }, this.bars));
    this.bars.addEventListener('change', () => { if (looper.state === 'idle') looper.bars = +this.bars.value; this.bars.blur(); });

    const check = (text, get, set) => {
      const l = el('label', {}, setRow);
      const c = el('input', { type: 'checkbox' }, l);
      el('span', { textContent: text }, l);
      c.addEventListener('change', () => { set(c.checked); c.blur(); });
      return { c, get };
    };
    this.checks = [
      check('Metronome', () => looper.metronome, v => { looper.metronome = v; }),
      check('Quantize', () => looper.quantize, v => { looper.quantize = v; }),
      check('Loop bar on canvas', () => looper.showHud, v => { looper.showHud = v; }),
    ];

    const volLabel = el('label', { textContent: 'Volume ' }, setRow);
    this.vol = el('input', { type: 'range', min: 0, max: 1, step: 0.01, value: 1 }, volLabel);
    this.vol.addEventListener('input', () => { Tone.Destination.volume.value = -40 + this.vol.value * 40; });
    this.vol.addEventListener('change', () => this.vol.blur());

    el('div', { textContent: 'Shortcuts: P panel · F fullscreen · R record · Space play/stop · Z undo · X clear · M metronome · H loop bar',
      style: 'color:#777;font-size:12px' }, this.panel);

    // P and F work from the keyboard (not while typing in a slider or dropdown)
    window.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const k = (e.key || '').toLowerCase();
      if (k === 'p') this.setPanel(this.panel.classList.contains('hidden'));
      else if (k === 'f') this.toggleFullscreen();
    });
    document.addEventListener('fullscreenchange', () => this.update());

    setInterval(() => this.update(), 100);
    this.update();
  },

  setPanel(show) {
    this.panel.classList.toggle('hidden', !show);
    this.showBtn.style.display = show ? 'none' : 'block';
  },

  toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  },

  update() {
    const L = looper, s = L.state;

    this.fsBtn.textContent = document.fullscreenElement ? 'Exit fullscreen (F)' : 'Fullscreen (F)';
    this.sceneBtns.forEach((b, i) => b.classList.toggle('active', i === sceneManager.index));

    // record button
    let rec = '● Record', recClass = '';
    if (s === 'countin') rec = 'Cancel count-in';
    else if (s === 'recording') { rec = 'Cancel take'; recClass = 'rec'; }
    else if (s === 'playing' && L.rec) { rec = 'Stop overdub'; recClass = 'rec'; }
    else if (s === 'playing' && L.overdubArmed) rec = 'Cancel overdub';
    else if (s === 'playing' || s === 'stopped') rec = '● Overdub';
    this.recBtn.textContent = rec;
    this.recBtn.className = recClass;

    // play / stop
    this.playBtn.textContent = s === 'playing' ? '■ Stop' : '▶ Play';
    this.playBtn.className = s === 'playing' ? 'live' : '';
    this.playBtn.disabled = !(s === 'playing' || s === 'stopped');
    this.undoBtn.disabled = !L.layers.length;
    this.clearBtn.disabled = !L.layers.length && s === 'idle';

    // status text
    const bpm = s === 'idle' ? L.bpm : Math.round(60000 / L.beat);
    const bars = s === 'idle' || s === 'stopped' ? L.bars : L.recBars;
    const secs = (bars * 4 * 60 / bpm).toFixed(1);
    const text = { idle: 'Ready', countin: 'Count-in…', recording: 'Recording', stopped: 'Stopped',
      playing: L.rec ? 'Overdubbing' : L.overdubCountdown(performance.now()) ? 'Count-in…' : L.overdubArmed ? 'Overdub starts soon' : 'Looping' }[s];
    this.status.textContent = `${text}  ·  ${bpm} BPM  ·  ${bars} bar${bars > 1 ? 's' : ''} (${secs}s)`;

    // layers (only rebuilt when something changed)
    const chips = L.layers.map((l, i) => `${i + 1}: ${scenes[l.events[0].scene].name} · ${l.events.length} events`);
    const sig = chips.join('|');
    if (sig !== this._sig) {
      this._sig = sig;
      while (this.layerRow.childNodes.length > 1) this.layerRow.removeChild(this.layerRow.lastChild);
      if (!chips.length) this.layerRow.appendChild(Object.assign(document.createElement('span'), { textContent: 'none yet', style: 'color:#666' }));
      chips.forEach(t => this.layerRow.appendChild(Object.assign(document.createElement('span'), { className: 'chip', textContent: t })));
    }

    // settings follow the looper (knobs 4 and 5 can change them too)
    const free = s === 'idle';
    this.bpm.disabled = this.bars.disabled = !free;
    if (document.activeElement !== this.bpm) this.bpm.value = L.bpm;
    this.bpmVal.textContent = ' ' + L.bpm;
    if (document.activeElement !== this.bars) this.bars.value = L.bars;
    this.checks.forEach(({ c, get }) => { c.checked = get(); });
  },
};