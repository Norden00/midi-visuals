// ============ MAIN ============
// Starts everything and connects MIDI to the hub.

// Global controls (outside scenes)
hub.on('knob', e => {
  if (e.number === 2) Tone.Destination.volume.value = map(e.value, 0, 1, -40, 0); // master volume
});

function setup() {
  createCanvas(960, 540);
  noStroke();
  textFont('monospace');
  sceneManager.init();
  looper.init();
  ui.init();

  navigator.requestMIDIAccess().then(access => {
    const connect = () => access.inputs.forEach(input => {
      input.onmidimessage = msg => {
        const event = parseMidi(msg);
        if (event) hub.emit(event);
      };
    });
    connect();
    access.onstatechange = connect;
  });
}

function mousePressed() { Tone.start(); } // browsers need a click before audio

// computer keyboard shortcuts for the looper (R, Space, Z, X, M, H)
function keyPressed() { if (looper.key(key)) return false; }

function draw() {
  sceneManager.current.visual.draw();
  fill(255);
  textSize(16);
  text(`${sceneManager.index + 1}: ${sceneManager.current.name}`, 12, 24);
  looper.draw();
}