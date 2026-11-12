// ============ SCENE MANAGER ============
// Passes events to the active scene and switches scenes.

const scenes = [sceneArcade, sceneNight, sceneDrums, sceneMeme]; // add new scenes here

const sceneManager = {
  index: 0,
  get current() { return scenes[this.index]; },

  init() {
    scenes.forEach(s => { s.sound.init(); s.visual.init(); });
    ['noteOn', 'noteOff', 'padOn', 'padOff', 'knob', 'bend']
      .forEach(kind => hub.on(kind, e => this.handle(e)));
    this.current.sound.enter();
    this.current.visual.enter();
  },

  handle(e) {
    // Bank B pads 6-8 are reserved for the looper
    if (looper.control(e)) return;

    // Bank B pads 1..N are reserved for scene switching
    const isScenePad = (e.kind === 'padOn' || e.kind === 'padOff')
      && e.bank === 'B' && e.pad <= scenes.length;
    if (isScenePad) {
      if (e.kind === 'padOn') this.switchTo(e.pad - 1);
      return;
    }

    looper.record(e); // remembers the hit if the looper is recording
    this.current.sound.onEvent(e);
    this.current.visual.onEvent(e);
  },

  // used by the looper: play an event in a specific scene (sound always, visuals only if it is on screen)
  deliver(e, i) {
    const s = scenes[i];
    if (!s) return;
    s.sound.onEvent(e);
    if (i === this.index) s.visual.onEvent(e);
    else if (s.visual.onBackgroundEvent) s.visual.onBackgroundEvent(e); // optional: scene is not on screen
  },

  // optional small overlays from scenes that are not on screen (e.g. looped memes in a corner box)
  drawOverlays() {
    scenes.forEach((s, i) => { if (i !== this.index && s.visual.drawOverlay) s.visual.drawOverlay(); });
  },

  switchTo(i) {
    if (i === this.index) return;
    this.current.sound.exit();
    this.current.visual.exit();
    this.index = i;
    this.current.sound.enter();
    this.current.visual.enter();
  },
};