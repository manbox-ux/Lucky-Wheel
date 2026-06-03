/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this environment:', e);
    }
  }

  // Plays a physical woodblock/click tick sound
  playTick(frequency = 600, duration = 0.05) {
    this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (browser behavior)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle'; // triangle gives a warmer, woodblock/peg-like click
      osc.frequency.setValueAtTime(frequency, now);
      // Quickly decay frequency for physical impact sound
      osc.frequency.exponentialRampToValueAtTime(100, now + duration);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Ignore audio synthesis glitches
    }
  }

  // Plays an uplifting ding/success sound
  playSuccess() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      // Ignore
    }
  }
}

export const sfx = new SoundEffectsManager();
