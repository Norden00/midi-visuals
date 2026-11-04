# MIDI Visuals

Live performance: an Akai MPK Mini controls sound (Tone.js) and visuals (p5.js).

## Run it
1. Open this folder in VS Code.
2. Install the **Live Server** extension, then click **Go Live** (bottom right).
3. Use **Chrome or Edge**. Click the canvas once to unlock audio.

## Controls
- Keys 48-72: play notes
- Bank A pads 1-4 (notes 44-47) and Bank B pads (notes 32-39): triggers
- Bank B pad 1, 2, ...: switch scene
- Knob 2: master volume, knob 3: animation speed (Arcade scene)
- Joystick left/right: pitch bend

## Files
- `config.js` settings and helpers
- `input.js` raw MIDI -> events
- `hub.js` event hub
- `scenes/` one file per scene (sound + visual)
- `scene-manager.js` scene list and switching
- `main.js` setup and draw

## Team rules
- Pull before you start, commit and push often.
- One person per file at a time.
