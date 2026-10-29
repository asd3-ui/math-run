import './styles.css';
import { Game } from './core/Game.js';
import { HUD } from './ui/HUD.js';
import { Screens } from './ui/Screens.js';
import { AudioSystem } from './systems/Audio.js';
import { loadSave, writeSave } from './systems/Progress.js';
import { NativeBridge } from './platform/NativeBridge.js';

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

// ============ طبقة التكامل مع الهاتف (أزرار، اهتزاز، دورة حياة...) ============
const bridge = new NativeBridge({ game, screens, audio });
game.setBridge(bridge);
bridge.init();

// ربط الأزرار
screens.handlers.play = (levelNum) => game.startLevel(levelNum - 1);
screens.handlers.next = () => {
  if (game.isEndless) game.startEndless();
  else game.startLevel(game.levelIndex + 1);
};
screens.handlers.buy = (type) => game.buyPowerup(type);
screens.handlers.endless = () => game.startEndless();
screens.handlers.resume = () => game.togglePause();

// ============ زر كتم الصوت في شاشة الإيقاف ============
// أزرار الصوت في الهاتف تتحكم بمستوى الصوت تلقائيًا (اللعبة تستخدم قناة الوسائط)،
// وهذا الزر يكتم/يفتح صوت اللعبة بالكامل ويحفظ الاختيار.
const muteBtn = document.getElementById('btn-mute');
let muted = !!save.muted;
audio.setMuted(muted);
const syncMuteBtn = () => {
  muteBtn.textContent = muted ? '🔇 الصوت: مغلق' : '🔊 الصوت: مفتوح';
};
syncMuteBtn();
muteBtn.addEventListener('click', () => {
  muted = !muted;
  audio.setMuted(muted);
  save.muted = muted;
  writeSave(save);
  syncMuteBtn();
  if (!muted) audio.click();
});

// تفعيل الصوت عند أول تفاعل (متطلب المتصفحات)
const unlockAudio = () => { audio.resume(); };
document.addEventListener('click', unlockAudio, { passive: true });
document.addEventListener('touchstart', unlockAudio, { passive: true });
document.addEventListener('keydown', unlockAudio, { passive: true });
