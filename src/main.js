import './styles.css';
import { Game } from './core/Game.js';
import { HUD } from './ui/HUD.js';
import { Screens } from './ui/Screens.js';
import { AudioSystem } from './systems/Audio.js';
import { loadSave } from './systems/Progress.js';

const save = loadSave();
const audio = new AudioSystem();
const hud = new HUD();
const screens = new Screens(save);
const game = new Game({ hud, screens, audio, save });

// ربط الأزرار
screens.handlers.play = (levelNum) => game.startLevel(levelNum - 1);
screens.handlers.next = () => {
  if (game.isEndless) game.startEndless();
  else game.startLevel(game.levelIndex + 1);
};
screens.handlers.buy = (type) => game.buyPowerup(type);
screens.handlers.endless = () => game.startEndless();
screens.handlers.resume = () => game.togglePause();

// تفعيل الصوت عند أول تفاعل
const unlockAudio = () => { audio.resume(); };
document.addEventListener('click', unlockAudio, { once: false });
document.addEventListener('touchstart', unlockAudio, { once: false });
