// ============ CONFIG ============
// Shared settings and small helpers. Change numbers here, not all over the code.

const MAP = {
  padsA: [44, 45, 46, 47],                  // pads 5-8 left out: they overlap keys 48-51
  padsB: [32, 33, 34, 35, 36, 37, 38, 39],
  knobs: [2, 3, 4, 5, 6, 7, 8],             // CC1 left out on purpose
};

const CELL = 8; // pixel-block size for the arcade look
const PALETTE = ['#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c'];

const snap = v => Math.floor(v / CELL) * CELL;                // round to the pixel grid
const toNote = midi => Tone.Frequency(midi, 'midi').toNote(); // 60 -> "C4"

const AUDIO_LOOKAHEAD = 0.01; // seconds. Tone's default is 0.1, which is the delay you feel
Tone.getContext().lookAhead = AUDIO_LOOKAHEAD;