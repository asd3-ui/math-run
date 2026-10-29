export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicInterval = null;
    this.isPlayingMusic = false;
    this.tempo = 120; 
    this.step = 0;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.9;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.2;
    this.musicGain.connect(this.masterGain);
  }

  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // كتم/فتح صوت اللعبة بالكامل (يستجيب لأزرار الصوت في الهاتف عبر قناة الوسائط)
  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.9;
  }

  beep(freq, duration, type = 'sine', gain = 0.1) {
    this.ensure();
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g).connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // مؤثرات صوتية
  correct() { this.beep(880, 0.1, 'triangle', 0.15); setTimeout(() => this.beep(1108, 0.15, 'triangle', 0.15), 80); }
  wrong() { this.beep(150, 0.2, 'sawtooth', 0.2); setTimeout(() => this.beep(100, 0.3, 'sawtooth', 0.2), 150); }
  coin() { this.beep(1500, 0.05, 'square', 0.08); }
  powerup() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.beep(f, 0.1, 'sine', 0.1), i * 50)); }
  click() { this.beep(600, 0.05, 'square', 0.05); }
  bump() { this.beep(80, 0.3, 'sawtooth', 0.3); }
  victory() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.2, 'square', 0.1), i * 100)); }
  gameOver() { [300, 250, 200, 150].forEach((f, i) => setTimeout(() => this.beep(f, 0.3, 'sawtooth', 0.15), i * 150)); }

  // محرك الموسيقى الديناميكية
  startMusic(speedLevel = 1) {
    this.ensure();
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.tempo = 110 + (speedLevel * 5); 
    
    // نمط موسيقى Synthwave (Baseline + Arpeggio)
    const bassNotes = [110.00, 110.00, 130.81, 146.83]; // A2, C3, D3
    const arpNotes = [440.00, 523.25, 659.25, 880.00, 659.25, 523.25]; // A4, C5, E5, A5
    
    const playStep = () => {
      if (!this.isPlayingMusic) return;
      
      const time = this.ctx.currentTime;
      const stepDuration = 60 / this.tempo / 2; // 8th notes

      // الباص (في كل نبضة)
      if (this.step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = bassNotes[Math.floor(this.step / 8) % bassNotes.length];
        bassGain.gain.setValueAtTime(0.3, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        bassOsc.connect(bassGain).connect(this.musicGain);
        bassOsc.start(); bassOsc.stop(time + 0.2);
      }

      // اللحن (في كل خطوة)
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'square';
      arpOsc.frequency.value = arpNotes[this.step % arpNotes.length];
      arpGain.gain.setValueAtTime(0.1, time);
      arpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      arpOsc.connect(arpGain).connect(this.musicGain);
      arpOsc.start(); arpOsc.stop(time + 0.1);

      this.step++;
      setTimeout(playStep, stepDuration * 1000);
    };
    playStep();
  }

  setMusicTempo(speed) {
    this.tempo = 110 + speed * 2; // تزيد السرعة مع تقدم اللعبة
  }

  stopMusic() {
    this.isPlayingMusic = false;
  }
}
