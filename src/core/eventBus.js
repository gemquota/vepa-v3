// VEPA v3 — EventBus (pub/sub)
// Decoupled communication for all engines and UI components.

class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event - Event name
   * @param {Function} fn - Callback: (data) => void
   * @returns {Function} Unsubscribe function
   */
  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event, fn) {
    const set = this._listeners.get(event);
    if (set) {
      set.delete(fn);
      if (set.size === 0) this._listeners.delete(event);
    }
  }

  /**
   * Emit an event synchronously.
   * @param {string} event - Event name
   * @param {*} data - Payload passed to each listener
   */
  emit(event, data) {
    const set = this._listeners.get(event);
    if (set) {
      for (const fn of set) {
        try { fn(data); } catch (e) { console.error(`[EventBus:${event}]`, e); }
      }
    }
  }

  /**
   * Subscribe to an event once.
   */
  once(event, fn) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      fn(data);
    };
    this.on(event, wrapper);
  }

  /** Remove all listeners (optionally for a specific event). */
  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }

  /** Number of listeners for an event (or total). */
  listenerCount(event) {
    if (event) {
      const set = this._listeners.get(event);
      return set ? set.size : 0;
    }
    let count = 0;
    for (const set of this._listeners.values()) count += set.size;
    return count;
  }
}

export default EventBus;
