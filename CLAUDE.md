# MIDI Visuals

Live performance project by Elias and a friend (5-10 min on a 3x3 m stage, "happy vibes", arcade/8-bit style,
inspired by AFISHAL's "Without You" remix video). An **Akai MPK Mini** controls **sound (Tone.js)** and
**visuals (p5.js)** in one browser page. Output goes to a laptop screen and an LED screen (via HDMI).
Hardware details of the LED screen (resolution, shape) are still unknown. DMX lights were dropped.

## Run it
- Open this folder in VS Code, use the Live Server extension ("Go Live"), open in **Chrome or Edge** (Web MIDI).
- Click the page once after every reload to unlock audio.
- Plain script tags, global variables, no build step. Libraries from CDN: p5 1.9.4, Tone 14.8.49.
  (p5.sound is deprecated and not used.)
- No automated tests. Check JS syntax with `node --check file.js`. Debug in the browser console
  (Cmd+Option+J). A 404 = wrong file name or folder. "X is not defined" = script order or a typo.

## Files and load order (index.html must keep this order)
config.js, input.js, hub.js, scenes/scene-arcade.js, scenes/scene-night.js, scenes/scene-drums.js,
scenes/scene-meme.js, scene-manager.js, looper.js, ui.js, main.js

- `config.js`: MAP (pad/knob numbers), CELL=8, PALETTE, `snap()`, `toNote()`, Tone lookAhead = 0.01
  (Tone's default 0.1 s caused audible delay).
- `input.js`: `parseMidi()` turns raw MIDI into events (below). `hub.js`: tiny event bus (`hub.on/emit`).
- `scenes/*.js`: one scene per file. `scene-manager.js`: active scene, switching, passes events on.
- `looper.js`: record/overdub looper. `ui.js`: on-screen control panel. `main.js`: setup, draw, MIDI connect.

## How it works
MIDI -> `parseMidi` -> `hub` -> `sceneManager.handle` -> active scene.
Event kinds: `noteOn {note, velocity}`, `noteOff {note}`, `padOn/padOff {bank:'A'|'B', pad, velocity}`,
`knob {number, value 0..1}`, `bend {value -1..1}`.

Every scene is `{ name, sound: {init, enter, exit, onEvent}, visual: {init, enter, exit, onEvent, draw} }`.
`init` runs once at startup (create synths there), `enter/exit` on scene switch. Sound and visual halves
must not depend on each other. To add a scene: copy a scene file, add its `<script>` before
`scene-manager.js`, add it to the `scenes` array.

`sceneManager.handle` order: `looper.control(e)` (looper pads) -> scene-switch pads -> `looper.record(e)` ->
active scene. The looper plays recorded events back through `sceneManager.deliver(e, sceneIndex)`.

## Controller map (measured on this MPK Mini, default octave, left unchanged on purpose)
- Keys 48-72, note-on status 144, note-off status 128. Pads send note-on on the same channel as the keys.
- Pad Bank A = notes 44-51, Bank B = notes 32-39. Only A1-A4 (44-47) are used, because A5-A8 (48-51)
  collide with the lowest keys.
- Knobs send CC 1-8. Joystick up/down also sends CC1, so **knob 1 is not used** (MAP.knobs = CC 2-8).
  Joystick left/right = pitch bend (status 224).
- Reserved pads: **Bank B pad 1..N switch scenes** (N = number of scenes, now 4); **B6 record,
  B7 play/stop, B8 undo (twice quickly = clear)**. Free for scenes: A1-A4 and B5.
- Knob 2 = master volume (global). Knob 3 = animation speed (Arcade). Knob 4 = BPM and knob 5 = loop
  length (1/2/4/8 bars), both only before recording.
- Limit: Bank B pad 6 is the looper, so scene switching only works for up to 5 scenes. For more, change
  to next/previous scene pads.

## Scenes (done)
1. ARCADE: square-wave synth, pad blips, pixel-burst visuals.
2. NIGHT RAIN: soft triangle synth with delay, drum-like pads, falling pixel rain.
3. DRUMS: every key 48-72 is a drum (`DRUM_KEYS` table), pads are effects (`FX_PADS`).
4. MEME FX: 12 meme sounds on keys (repeat every octave) and 5 on pads, with big text/effects.
   Sounds are synthesized. Own files: put audio in `sounds/` and pictures/GIFs in `images/`, list them
   in `SAMPLE_FILES` / `MEME_IMAGES` at the top of `scene-meme.js` (missing files fall back safely).
   `MEME_LOOK` sets label/effect per name; unknown names get a default look.

## Looper (done)
Count-in (1 bar), records N bars, then loops; further presses overdub on the next round. Hits are
quantized to 16ths, layers remember the scene they were played in, undo removes the last layer.
Knobs and joystick are not recorded. Keyboard shortcuts: R, Space, Z, X, M (metronome), H (loop bar).
Clock is a 5 ms `setInterval` plus `performance.now()`.

## UI (done)
Canvas is drawn at a fixed 960x540 and scaled by CSS to fill the window (pixelated, 16:9 with black bars).
`ui.js` adds a panel floating over the bottom: scene buttons, record/play/undo/clear, layers, BPM, bars,
metronome, quantize, volume. **P** hides/shows it, **F** toggles fullscreen. Panel buttons call the same
functions as the pads.

## Gotchas
- Tone's single-voice instruments (Synth, MembraneSynth, NoiseSynth, MetalSynth, Player) throw
  "Start time must be strictly greater than previous start time" if two hits get the same start time.
  `play()` in the drums and meme scenes uses an `at()` helper to prevent that. The Night Rain pad
  MembraneSynth does not have this guard yet.
- Browsers block audio until a click, so `Tone.start()` runs on canvas and panel clicks.
- Keep the arcade look: snap coordinates with `snap()`, draw blocks of CELL px, use PALETTE.

## Team rules (two people, one GitHub repo, private)
- Elias is on a Mac, the friend on Windows and new to GitHub. Both use VS Code.
- `git pull` before starting, commit small and often, push when something works.
- One person per file at a time. Tell each other before editing shared files: `index.html`,
  `scene-manager.js`, `main.js`, `config.js`.
- Keep explanations simple and step by step. Say exactly which file and which lines to change.

## Ideas / not done yet
- Test on the real LED screen (resolution, brightness, fullscreen). Set `createCanvas` to its size if needed.
- Design the show's arc (intro, build-up, drop, finale) and which loops are built in each part.
- Possible: separate "show" window for the LED screen while controls stay on the laptop; on-screen
  pads/keys for the friend; next/previous scene pads; beat-synced visuals; more scenes.
