export class HUD {
  constructor() {
    this.hudEl = document.getElementById('hud');
    this.questionEl = document.getElementById('question');
    this.answersEl = document.getElementById('answers');
    this.coinEl = document.getElementById('coins');
    this.heartsEl = document.getElementById('hearts');
    this.speedEl = document.getElementById('speed');
    this.progressEl = document.getElementById('progress');
    this.comboBadge = document.getElementById('combo-badge');
    this.comboCount = document.getElementById('combo-count');
    this.pauseBtn = document.getElementById('btn-pause');

    this.powerupBtns = document.querySelectorAll('.powerup-btn');
    this.onUsePowerup = () => {};
    this.onPause = () => {};

    this.answerChips = [];
    this.answersEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const chip = document.createElement('div');
      chip.className = 'answer-chip';
      chip.dataset.lane = i;
      chip.textContent = '—';
      this.answersEl.appendChild(chip);
      this.answerChips.push(chip);
    }

    this.powerupBtns.forEach(btn => {
      btn.addEventListener('click', () => this.onUsePowerup(btn.dataset.type));
    });

    this.pauseBtn.addEventListener('click', () => this.onPause());
  }

  setOnUsePowerup(fn) { this.onUsePowerup = fn; }
  setOnPause(fn) { this.onPause = fn; }

  setQuestion(text) {
    this.questionEl.textContent = text;
    this.questionEl.classList.remove('correct', 'wrong');
    this.answerChips.forEach(c => c.classList.remove('disabled'));
  }

  setAnswers(list) {
    this.answerChips.forEach((chip, i) => {
      chip.textContent = list[i];
      chip.classList.remove('disabled');
    });
  }

  disableAnswer(lane) {
    if (this.answerChips[lane]) this.answerChips[lane].classList.add('disabled');
  }

  setCoins(n) { this.coinEl.textContent = n; }
  setHearts(n) { this.heartsEl.textContent = n > 0 ? '❤️'.repeat(n) : '💀'; }
  setSpeed(s) { this.speedEl.textContent = Math.round(s); }
  setProgress(current, target) { this.progressEl.textContent = `${current}/${target}`; }

  setPowerups(p) {
    this.powerupBtns.forEach(btn => {
      const t = btn.dataset.type;
      const n = p[t] || 0;
      btn.querySelector('.count').textContent = n;
      btn.disabled = n <= 0;
    });
  }

  setPowerupActive(type, active) {
    const btn = [...this.powerupBtns].find(b => b.dataset.type === type);
    if (btn) btn.classList.toggle('active', active);
  }

  showCombo(count) {
    if (count < 2) { this.comboBadge.classList.add('hidden'); return; }
    this.comboCount.textContent = count;
    this.comboBadge.classList.remove('hidden');
    this.comboBadge.style.animation = 'none';
    void this.comboBadge.offsetWidth;
    this.comboBadge.style.animation = 'comboPulse 0.5s ease';
  }

  hideCombo() { this.comboBadge.classList.add('hidden'); }

  flashCorrect() {
    this.questionEl.classList.add('correct');
    setTimeout(() => this.questionEl.classList.remove('correct'), 600);
  }

  flashWrong() {
    this.questionEl.classList.add('wrong');
    setTimeout(() => this.questionEl.classList.remove('wrong'), 600);
  }

  show() { this.hudEl.classList.remove('hidden'); }
  hide() { this.hudEl.classList.add('hidden'); this.hideCombo(); }
}
