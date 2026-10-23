import './styles.css';
import { Game } from './core/Game.js';
import { HUD } from './ui/HUD.js';
import { Screens } from './ui/Screens.js';
import { AudioSystem } from './systems/Audio.js';
import { loadSave } from './systems/Progress.js';

// ============ تسجيل Service Worker للعمل بدون إنترنت ============
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Resolve the worker relative to the deployed app so project-site URLs work too.
    const workerUrl = new URL('sw.js', window.location.href);
    navigator.serviceWorker
      .register(workerUrl)
      .catch(() => { /* تجاهل الأخطاء */ });
  });
}

// ============ تهيئة اللعبة ============
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

// تفعيل الصوت عند أول تفاعل (متطلب المتصفحات)
const unlockAudio = () => { audio.resume(); };
document.addEventListener('click', unlockAudio, { passive: true });
document.addEventListener('touchstart', unlockAudio, { passive: true });
document.addEventListener('keydown', unlockAudio, { passive: true });
