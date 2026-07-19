import { bus } from "../../core/eventBus.js";

export class AnalysisEngine {
    constructor() {
        this.lastAnalysisFrame = 0;
        this.analysisInterval = 60; // Analyze every 60 frames
    }

    process(history) {
        if (history.length < 60) return; // Need enough data

        const latest = history[history.length - 1];
        if (latest.frame - this.lastAnalysisFrame < this.analysisInterval) return;
        this.lastAnalysisFrame = latest.frame;

        const results = {
            trends: this.detectTrends(history),
            oscillations: this.detectOscillations(history),
            frame: latest.frame,
            time: latest.time
        };

        bus.emit("perception:update", results);
    }

    detectTrends(history) {
        const windowSize = 30;
        const recent = history.slice(-windowSize);
        const older = history.slice(-windowSize * 2, -windowSize);

        const getAvg = (arr, key) => arr.reduce((acc, val) => acc + val[key], 0) / arr.length;

        const keys = ['stability', 'complexity', 'lifelike', 'changeRate'];
        const trends = {};

        keys.forEach(key => {
            const recentAvg = getAvg(recent, key);
            const olderAvg = getAvg(older, key);
            const diff = recentAvg - olderAvg;
            const threshold = 0.05;

            if (diff > threshold) trends[key] = 'increasing';
            else if (diff < -threshold) trends[key] = 'decreasing';
            else trends[key] = 'stable';
        });

        return trends;
    }

    detectOscillations(history) {
        // Simple autocorrelation or peak counting for changeRate
        const values = history.slice(-100).map(h => h.changeRate);
        const peaks = [];
        for (let i = 1; i < values.length - 1; i++) {
            if (values[i] > values[i-1] && values[i] > values[i+1] && values[i] > 0.1) {
                peaks.push(i);
            }
        }

        if (peaks.length >= 3) {
            const intervals = [];
            for (let i = 1; i < peaks.length; i++) {
                intervals.push(peaks[i] - peaks[i-1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((acc, v) => acc + Math.pow(v - avgInterval, 2), 0) / intervals.length;

            if (variance < 5) { // Consistent rhythm
                return { type: 'periodic', period: Math.round(avgInterval) };
            }
        }

        return { type: 'stochastic' };
    }
}

export const analysisEngine = new AnalysisEngine();
