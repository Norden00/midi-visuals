// ============ EVENT HUB ============
// A message board: things announce events, other things listen.

const hub = {
  listeners: {},
  on(kind, fn) { (this.listeners[kind] ||= []).push(fn); },
  emit(event) { (this.listeners[event.kind] || []).forEach(fn => fn(event)); },
};
