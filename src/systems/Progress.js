const KEY = 'math_runner_3d_save_v2';

export const defaultSave = () => ({
  coins: 0,
  unlockedLevel: 1,
  bestLevel: 1,
  selectedCharacter: 'boy',
  ownedCharacters: ['boy', 'girl'],
  powerups: { freeze: 1, remove: 1, shield: 1, heart: 0 },
  stats: { totalCorrect: 0, bestCombo: 0, totalCoins: 0 },
  settings: { sound: true, music: true }
});

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    return {
      ...base, ...parsed,
      powerups: { ...base.powerups, ...(parsed.powerups || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}
