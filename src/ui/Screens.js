import { LevelConfigs, Worlds } from '../data/questions.js';
import { Characters } from '../data/characters.js';

export class Screens {
  constructor(save) {
    this.save = save;
    this.handlers = {};

    this.menu = document.getElementById('menu');
    this.levelSelect = document.getElementById('level-select');
    this.shop = document.getElementById('shop');
    this.characters = document.getElementById('characters');
    this.pause = document.getElementById('pause');
    this.gameover = document.getElementById('gameover');
    this.levelComplete = document.getElementById('level-complete');

    this.menuCoins = document.getElementById('menu-coins');
    this.shopCoins = document.getElementById('shop-coins');
    this.menuLevel = document.getElementById('menu-level');
    this.levelsGrid = document.getElementById('levels-grid');
    this.charactersGrid = document.getElementById('characters-grid');

    this.bindGlobal();
    this.refresh();
  }

  bindGlobal() {
    document.querySelectorAll('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => this.handlers.back?.(btn.dataset.back));
    });
    document.querySelectorAll('[data-buy]').forEach(item => {
      item.addEventListener('click', () => this.handlers.buy?.(item.dataset.buy));
    });

    document.getElementById('btn-play').addEventListener('click', () => this.handlers.play?.(this.save.unlockedLevel));
    document.getElementById('btn-endless').addEventListener('click', () => this.handlers.endless?.());
    document.getElementById('btn-levels').addEventListener('click', () => this.show('levels'));
    document.getElementById('btn-shop').addEventListener('click', () => this.show('shop'));
    document.getElementById('btn-characters').addEventListener('click', () => { this.show('characters'); this.refreshCharacters(); });
    document.getElementById('btn-retry').addEventListener('click', () => this.handlers.play?.(this.save.unlockedLevel));
    document.getElementById('btn-next').addEventListener('click', () => this.handlers.next?.());
    document.getElementById('btn-resume').addEventListener('click', () => this.handlers.resume?.());
  }

  show(name) {
    [this.menu, this.levelSelect, this.shop, this.characters, this.pause, this.gameover, this.levelComplete]
      .forEach(el => el?.classList.add('hidden'));

    if (!name) return;
    if (name === 'menu') { this.menu.classList.remove('hidden'); this.refreshCoins(); }
    else if (name === 'levels') { this.levelSelect.classList.remove('hidden'); this.refreshLevels(); }
    else if (name === 'shop') { this.shop.classList.remove('hidden'); this.refreshCoins(); }
    else if (name === 'characters') { this.characters.classList.remove('hidden'); this.refreshCharacters(); }
    else if (name === 'pause') this.pause.classList.remove('hidden');
    else if (name === 'gameover') this.gameover.classList.remove('hidden');
    else if (name === 'levelcomplete') this.levelComplete.classList.remove('hidden');
  }

  refresh() {
    this.refreshCoins();
    this.menuLevel.textContent = this.save.unlockedLevel;
  }

  refreshCoins() {
    this.menuCoins.textContent = this.save.coins;
    this.shopCoins.textContent = this.save.coins;
  }

  refreshLevels() {
    this.levelsGrid.innerHTML = '';
    
    // تجميع المراحل حسب العالم
    Worlds.forEach((world, worldIndex) => {
      const worldHeader = document.createElement('div');
      worldHeader.style.cssText = 'grid-column: 1 / -1; text-align: right; padding: 15px 5px 5px; font-size: 18px; font-weight: bold; color: #a78bfa; border-bottom: 1px solid rgba(124,92,255,0.3); margin-bottom: 5px;';
      worldHeader.textContent = `🌍 العالم ${worldIndex + 1}: ${world.name}`;
      this.levelsGrid.appendChild(worldHeader);

      const worldLevels = LevelConfigs.filter(l => l.worldId === world.id);
      
      worldLevels.forEach((cfg) => {
        const levelIndex = cfg.id - 1;
        const unlocked = cfg.id <= this.save.unlockedLevel;
        const btn = document.createElement('button');
        btn.className = 'level-btn' + (unlocked ? '' : ' locked');
        btn.innerHTML = `<span class="num">${cfg.id}</span><span class="name">${cfg.name}</span>`;
        btn.disabled = !unlocked;
        btn.addEventListener('click', () => this.handlers.play?.(cfg.id));
        this.levelsGrid.appendChild(btn);
      });
    });
  }

  refreshCharacters() {
    this.charactersGrid.innerHTML = '';
    Characters.forEach(c => {
      const owned = this.save.ownedCharacters.includes(c.id);
      const selected = this.save.selectedCharacter === c.id;
      const btn = document.createElement('button');
      btn.className = 'character-item' + (selected ? ' selected' : '') + (owned ? '' : ' locked');
      btn.innerHTML = `
        <div class="avatar" style="background: rgba(255,255,255,0.08);">${c.emoji}</div>
        <div class="cname">${c.name}</div>
        <div class="ctag">${owned ? (selected ? '✓ مختار' : 'امتلكته') : `${c.price} 🪙`}</div>
      `;
      btn.addEventListener('click', () => this.handlers.character?.(c));
      this.charactersGrid.appendChild(btn);
    });
  }

  showGameOver(coins, correct, bestCombo) {
    document.getElementById('go-coins').textContent = coins;
    document.getElementById('go-correct').textContent = correct;
    document.getElementById('go-combo').textContent = bestCombo;
    this.show('gameover');
  }

  showLevelComplete(coins, correct) {
    document.getElementById('lc-coins').textContent = coins;
    document.getElementById('lc-correct').textContent = correct;
    this.show('levelcomplete');
  }
}
