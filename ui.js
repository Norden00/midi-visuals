// ============ ON-SCREEN CONTROL PANEL ============
// Buttons and sliders under the canvas, so you can run the show with the mouse
// (or a touch screen) as well as with the MPK Mini. It only calls the same
// functions the pads and keys already use, so both always stay in sync.

const ui = {
  init() {
    const css = `
      body { background:#111; color:#ddd; font:14px/1.4 monospace; overflow:auto !important; }
      canvas { image-rendering: pixelated; }
      #panel { width:960px; max-width:100vw; box-sizing:border-box; padding:12px 12px 24px; }
      #panel .row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:0 0 12px; }
      #panel .label { width:70px; color:#888; font-size:12px; letter-spacing:1px; }
      #panel button { font:inherit; color:#ddd; background:#2a2a35; border:1px solid #444; border-radius:6px;
        padding:8px 14px; cursor:pointer; }
      #panel button:hover:not(:disabled) { background:#3a3a4a; }
      #panel button:disabled { opacity:.35; cursor:default; }
      #panel button.active { background:#29adff; color:#000; border-color:#29adff; }
      #panel button.rec { background:#ff004d; color:#fff; border-color:#ff004d; }
      #panel button.live { background:#00e436; color:#000; border-color:#00e436; }
      #panel .status { margin-left:8px; color:#ffa300; }
      #panel .chip { background:#222; border:1px solid #444; border-radius:12px; padding:2px 10px; }
      #panel input[type=range] { width:130px; vertical-align:middle; }
      #panel select { font:inherit; background:#2a2a35; color:#ddd; border:1px solid #444; border-radius:4px; padding:4px; }
      #panel label { display:inline-flex; align-items:center; gap:4px; cursor:pointer; }
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

    // --- settings ---
    const setRow = row('SETTINGS');
    const bpmLabel = el('label', { textContent: 'BPM ' }, setRow);
    this.bpm = el('input', { type: 'range', min: 60, max: 180, step: 1 }, bpmLabel);
    this.bpmVal = el('span', {}, bpmLabel);
    this.bpm.addEventListener('input', () => { if (looper.state === 'idle') looper.bpm = +this.bpm.value; });

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

    const fs = el('button', { type: 'button', textContent: 'Fullscreen canvas' }, setRow);
    onClick(fs, () => { const c = document.querySelector('canvas'); if (c && c.requestFullscreen) c.requestFullscreen(); });

    el('div', { textContent: 'Shortcuts: R record · Space play/stop · Z undo · X clear · M metronome · H loop bar',
      style: 'color:#666;font-size:12px;margin-top:4px' }, this.panel);

    setInterval(() => this.update(), 100);
    this.update();
  },

  update() {
    const L = looper, s = L.state;

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
      playing: L.rec ? 'Overdubbing' : L.overdubArmed ? 'Overdub starts next round' : 'Looping' }[s];
    this.status.textContent = `${text}  ·  ${bpm} BPM  ·  ${bars} bar${bars > 1 ? 's' : ''} (${secs}s)`;

    // layers
    const chips = L.layers.map((l, i) => `${i + 1}: ${scenes[l.events[0].scene].name} · ${l.events.length} events`);
    const label = this.layerRow.firstChild;
    while (this.layerRow.childNodes.length > 1) this.layerRow.removeChild(this.layerRow.lastChild);
    if (!chips.length) this.layerRow.appendChild(Object.assign(document.createElement('span'), { textContent: 'none yet', style: 'color:#666' }));
    chips.forEach(t => this.layerRow.appendChild(Object.assign(document.createElement('span'), { className: 'chip', textContent: t })));

    // settings follow the looper (knobs 4 and 5 can change them too)
    const free = s === 'idle';
    this.bpm.disabled = this.bars.disabled = !free;
    if (document.activeElement !== this.bpm) this.bpm.value = L.bpm;
    this.bpmVal.textContent = ' ' + L.bpm;
    if (document.activeElement !== this.bars) this.bars.value = L.bars;
    this.checks.forEach(({ c, get }) => { c.checked = get(); });
  },
};