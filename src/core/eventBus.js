export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach(fn => fn(payload));
  }
}

export const bus = new EventBus();
