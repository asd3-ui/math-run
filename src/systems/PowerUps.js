export class PowerUps {
  constructor() { this.reset(); }
  reset() {
    this.freezeUntil = 0;
    this.removeUsed = false;
    this.shieldActive = false;
  }
  activate(type) {
    if (type === 'freeze') this.freezeUntil = performance.now() + 4000;
    else if (type === 'remove') this.removeUsed = true;
    else if (type === 'shield') this.shieldActive = true;
  }
  isFrozen() { return performance.now() < this.freezeUntil; }
}
