// VEPA v3 — Narrative Consciousness (Multi-Voice Monologue)
// 4 voices: Stabilizer, Diverger, Observer, Dissolver.

const VOICES = {
  STABILIZER: {
    id: 'stabilizer',
    name: 'Stabilizer',
    color: '#44aaff',
    tone: 'cautious,秩序-seeking',
  },
  DIVERGER: {
    id: 'diverger',
    name: 'Diverger',
    color: '#ffaa44',
    tone: 'curious, exploratory',
  },
  OBSERVER: {
    id: 'observer',
    name: 'Observer',
    color: '#88cc88',
    tone: 'detached, analytical',
  },
  DISSOLVER: {
    id: 'dissolver',
    name: 'Dissolver',
    color: '#ff4488',
    tone: 'chaotic, entropic',
  },
};

const UTTERANCES = {
  cluster: {
    stabilizer: [
      'A cluster forms. Order emerges from chaos.',
      'Pattern detected. The system seeks stability.',
    ],
    diverger: [
      'Look — they gather! What new behavior will this spawn?',
      'A meeting of minds... or matter?',
    ],
    observer: [
      'Cluster detected: {size} particles of species {speciesId} at ({x}, {y}).',
      'Spatio-temporal anomaly: particle density above baseline.',
    ],
    dissolver: [
      'They huddle together. Afraid of the void?',
      'Clusters are just entropy delayed.',
    ],
  },
  birth: {
    stabilizer: ['New life. The cycle continues.'],
    diverger: ['A child! What mutations will it carry?'],
    observer: ['Birth event: species {speciesId} at tick {tick}.'],
    dissolver: ['Another replicator. More noise in the system.'],
  },
  death: {
    stabilizer: ['One returns to the void. Balance maintained.'],
    diverger: ['Lost one! But its energy lives on.'],
    observer: ['Death: particle {id} after {age} ticks.'],
    dissolver: ['Yes... feed the entropy.'],
  },
};

class NarrativeConsciousness {
  constructor(eventBus, config = {}) {
    this.bus = eventBus;
    this.config = {
      minInterval: config.minInterval || 120, // Frames between utterances
      voiceWeights: config.voiceWeights || {
        stabilizer: 0.25,
        diverger: 0.25,
        observer: 0.25,
        dissolver: 0.25,
      },
      ...config,
    };
    this.lastUtterance = 0;
    this.history = [];
    this.frameCount = 0;

    // Listen for events
    this.bus.on('insight:clusters', (clusters) => {
      for (const c of clusters) {
        this._considerUtterance('cluster', {
          size: c.size,
          speciesId: c.speciesId,
          x: Math.round(c.avgX),
          y: Math.round(c.avgY),
        });
      }
    });
  }

  update(frameCount) {
    this.frameCount = frameCount;
  }

  _considerUtterance(type, context) {
    if (this.frameCount - this.lastUtterance < this.config.minInterval) return;

    // Select voice by weight
    const voice = this._selectVoice();
    const utterances = UTTERANCES[type];
    if (!utterances || !utterances[voice.id]) return;

    const lines = utterances[voice.id];
    const line = lines[Math.floor(Math.random() * lines.length)];

    // Template substitution
    const text = line
      .replace('{size}', context.size || '?')
      .replace('{speciesId}', context.speciesId ?? '?')
      .replace('{x}', context.x ?? '?')
      .replace('{y}', context.y ?? '?')
      .replace('{id}', context.id ?? '?')
      .replace('{age}', context.age ?? '?')
      .replace('{tick}', String(this.frameCount));

    this.history.push({
      tick: this.frameCount,
      voice: voice.id,
      voiceName: voice.name,
      color: voice.color,
      text,
    });

    this.lastUtterance = this.frameCount;
    this.bus.emit('narrative:utterance', this.history[this.history.length - 1]);
  }

  _selectVoice() {
    const r = Math.random();
    let cumulative = 0;
    for (const [id, weight] of Object.entries(this.config.voiceWeights)) {
      cumulative += weight;
      if (r < cumulative) return VOICES[id.toUpperCase()] || VOICES.OBSERVER;
    }
    return VOICES.OBSERVER;
  }

  getHistory() { return this.history; }
  clear() { this.history = []; }
}

export default NarrativeConsciousness;
export { VOICES };
