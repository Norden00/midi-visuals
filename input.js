// ============ INPUT: raw MIDI -> clean events ============

function padInfo(note) {
  const a = MAP.padsA.indexOf(note);
  if (a !== -1) return { bank: 'A', pad: a + 1 };
  const b = MAP.padsB.indexOf(note);
  if (b !== -1) return { bank: 'B', pad: b + 1 };
  return null; // not a pad, so it's a key
}

function parseMidi(msg) {
  const [status, d1, d2] = msg.data;
  const type = status & 0xf0;
  const pad = padInfo(d1);

  if (type === 0x90 && d2 > 0)
    return pad ? { kind: 'padOn', ...pad, velocity: d2 }
               : { kind: 'noteOn', note: d1, velocity: d2 };
  if (type === 0x80 || (type === 0x90 && d2 === 0))
    return pad ? { kind: 'padOff', ...pad }
               : { kind: 'noteOff', note: d1 };
  if (type === 0xb0 && MAP.knobs.includes(d1))
    return { kind: 'knob', number: d1, value: d2 / 127 };
  if (type === 0xe0)
    return { kind: 'bend', value: (((d2 << 7) | d1) - 8192) / 8192 };
  return null;
}
