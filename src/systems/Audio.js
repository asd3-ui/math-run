export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.musicPlaying = false;
    this.enabled = true;
    this.musicNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C E G C G E
    this.musicIndex = 0;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.masterGain);
  }

  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  beep(freq, duration, type = 'sine', gain = 0.1) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g).connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  correct() {
    if (!this.enabled) return;
    this.beep(659, 0.12);
    setTimeout(() => this.beep(880, 0.14), 100);
    setTimeout(() => this.beep(1109, 0.18), 220);
  }

  wrong() {
    if (!this.enabled) return;
    this.beep(220, 0.15, 'sawtooth', 0.09);
    setTimeout(() => this.beep(160, 0.22, 'sawtooth', 0.09), 140);
    setTimeout(() => this.beep(110, 0.3, 'sawtooth', 0.09), 320);
  }

  coin() { this.beep(1200, 0.06, 'triangle', 0.06); setTimeout(() => this.beep(1600, 0.08, 'triangle', 0.05), 50); }
  powerup() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.1, 'sine', 0.08), i * 60));
  }
  click() { this.beep(880, 0.05, 'square', 0.05); }
  bump() { this.beep(120, 0.2, 'sawtooth', 0.12); }

  victory() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => setTimeout(() => this.beep(f, 0.2, 'sine', 0.1), i * 120));
  }

  gameOver() {
    const notes = [523.25, 440, 349.23, 261.63];
    notes.forEach((f, i) => setTimeout(() => this.beep(f, 0.35, 'sine', 0.1), i * 180));
  }

  startMusic() {
    if (!this.enabled || this.musicPlaying) return;
    this.ensure();
    if (!this.ctx) return;
    this.musicPlaying = true;
    const playNote = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const freq = this.musicNotes[this.musicIndex % this.musicNotes.length];
      this.musicIndex++;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(g).connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
      this.musicTimer = setTimeout(playNote, 400);
    };
    playNote();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }

  setEnabled(v) { this.enabled = v; if (!v) this.stopMusic(); }
}
