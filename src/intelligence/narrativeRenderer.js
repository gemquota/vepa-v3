// VEPA v3 — Narrative Renderer
// Scrollable narrative log panel in the UI.

class NarrativeRenderer {
  constructor(container, eventBus) {
    this.container = container;
    this.bus = eventBus;
    this.maxEntries = 100;

    this.el = document.createElement('div');
    this.el.style.cssText = 'font:11px/1.5 monospace;max-height:300px;overflow-y:auto;padding:4px;';

    this.bus.on('narrative:utterance', (entry) => this._addEntry(entry));
  }

  _addEntry(entry) {
    const line = document.createElement('div');
    line.style.cssText = `color:${entry.color};padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.05);`;
    line.innerHTML = `<span style="color:#445566">[${entry.tick}]</span> <b>${entry.voiceName}:</b> ${entry.text}`;
    this.el.appendChild(line);

    // Trim excess
    while (this.el.children.length > this.maxEntries) {
      this.el.removeChild(this.el.firstChild);
    }

    // Auto-scroll
    this.el.scrollTop = this.el.scrollHeight;
  }

  attach() {
    this.container.appendChild(this.el);
  }

  destroy() {
    this.el.remove();
  }
}

export default NarrativeRenderer;
