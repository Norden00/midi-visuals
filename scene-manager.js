// ============ SCENE MANAGER ============
// Passes events to the active scene and switches scenes.

const scenes = [sceneArcade, sceneNight]; // add new scenes here

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
    // Bank B pads 1..N are reserved for scene switching
    const isScenePad = (e.kind === 'padOn' || e.kind === 'padOff')
      && e.bank === 'B' && e.pad <= scenes.length;
    if (isScenePad) {
      if (e.kind === 'padOn') this.switchTo(e.pad - 1);
      return;
    }
    this.current.sound.onEvent(e);
    this.current.visual.onEvent(e);
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
