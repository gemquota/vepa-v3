// VEPA v3 — Timeline Engine
// Circular buffer of simulation snapshots for history playback.

class TimelineEngine {
  constructor(config = {}) {
    this.config = {
      maxFrames: config.maxFrames || 300,
      recordInterval: config.recordInterval || 10,
      ...config,
    };
    this.frames = [];
    this._frameCount = 0;
    this._playing = false;
    this._playbackIndex = 0;
    this._playbackSpeed = 1;
  }

  record(snapshot) {
    this._frameCount++;
    if (this._frameCount % this.config.recordInterval !== 0) return;

    this.frames.push({
      tick: this._frameCount,
      data: snapshot,
      time: Date.now(),
    });

    // Trim to max
    if (this.frames.length > this.config.maxFrames) {
      this.frames.shift();
    }
  }

  play(speed = 1) {
    this._playing = true;
    this._playbackSpeed = speed;
    this._playbackIndex = 0;
  }

  pause() { this._playing = false; }

  stop() {
    this._playing = false;
    this._playbackIndex = 0;
  }

  step() {
    if (!this._playing || this.frames.length === 0) return null;
    const frame = this.frames[this._playbackIndex];
    this._playbackIndex += this._playbackSpeed;
    if (this._playbackIndex >= this.frames.length) {
      this._playbackIndex = 0;
    }
    return frame ? frame.data : null;
  }

  isPlaying() { return this._playing; }
  getFrameCount() { return this.frames.length; }
  clear() { this.frames = []; this._frameCount = 0; }
}

export default TimelineEngine;
