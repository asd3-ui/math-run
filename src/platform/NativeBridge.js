import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor/keep-awake';
import { ScreenOrientation, OrientationType } from '@capacitor/screen-orientation';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';

const native = Capacitor.isNativePlatform();

export class NativeBridge {
  constructor({ game, screens, audio }) {
    this.game = game;
    this.screens = screens;
    this.audio = audio;
    this.wakeLock = null;
  }

  async init() {
    this.bindBackButton();
    this.bindAppLifecycle();
    this.bindNetwork();

    if (native) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a15' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch { /* الشريط غير مدعوم على هذا الجهاز */ }
    }

    // إعادة منع إطفاء الشاشة عند العودة (بعض الأنظمة تلغي الـ WakeLock)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.game.state === 'playing') this.keepScreenOn();
    });
  }

  // ==================== زر الرجوع (Back) ====================
  bindBackButton() {
    if (native) {
      // زر الرجوع المادي في أندرويد
      App.addListener('backButton', () => this.handleBackButton());
      return;
    }
    // وضع المتصفح / PWA: اعتراض زر الرجوع وإيماءة الرجوع عبر History API
    try {
      history.pushState({ mathRun: true }, '', location.href);
      window.addEventListener('popstate', () => {
        this.handleBackButton();
        history.pushState({ mathRun: true }, '', location.href);
      });
    } catch { /* History API غير متاح */ }
  }

  handleBackButton() {
    // 1) إغلاق نافذة تأكيد الخروج إن كانت مفتوحة
    if (this.screens.current === 'exit-confirm') { this.screens.hideExitConfirm(); return; }

    // 2) أثناء اللعب ← إيقاف مؤقت
    if (this.game.state === 'playing') { this.hapticLight(); this.game.togglePause(); return; }

    // 3) أثناء الإيقاف المؤقت ← استئناف
    if (this.game.state === 'paused') { this.game.togglePause(); return; }

    // 4) شاشات النتائج ← القائمة الرئيسية
    if (this.game.state === 'gameover' || this.game.state === 'levelcomplete') {
      this.game.backTo('menu');
      return;
    }

    // 5) الشاشات الفرعية ← القائمة الرئيسية
    if (['levels', 'shop', 'characters'].includes(this.screens.current)) {
      this.game.backTo('menu');
      return;
    }

    // 6) القائمة الرئيسية ← تأكيد الخروج
    this.screens.showExitConfirm(() => {
      if (native) App.exitApp();
      else window.close();
    });
  }

  // ==================== دورة حياة التطبيق ====================
  // مكالمة واردة / تبديل تطبيق / زر الطاقة (إطفاء الشاشة) / التنبيهات
  bindAppLifecycle() {
    if (native) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) this.onForeground();
        else this.onBackground();
      });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.onBackground();
      else this.onForeground();
    });
  }

  onBackground() {
    // إيقاف تلقائي عند أي مقاطعة هاتفية (مكالمة، إشعار، إطفاء شاشة...)
    if (this.game.state === 'playing') this.game.togglePause();
    this.allowSleep();
    if (native) StatusBar.show().catch(() => {});
  }

  onForeground() {
    // نُبقي اللعبة متوقفة مؤقتًا لتقرّر أنت متى تستأنف (سلوك آمن أثناء المكالمات)
    if (native) {
      if (this.game.state === 'playing') StatusBar.hide().catch(() => {});
    }
  }

  // ==================== منع إطفاء الشاشة ====================
  async keepScreenOn() {
    try {
      if (native) await KeepAwake.keepAwake();
      else if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch { /* غير مدعوم */ }
  }

  async allowSleep() {
    try {
      if (native) await KeepAwake.allowSleep();
      else if (this.wakeLock) { await this.wakeLock.release(); this.wakeLock = null; }
    } catch { /* تجاهل */ }
  }

  // ==================== قفل اتجاه الشاشة ====================
  async lockLandscape() {
    try { await ScreenOrientation.lock({ orientation: OrientationType.LANDSCAPE }); } catch { /* الوضع الطبيعي */ }
  }

  async unlockOrientation() {
    try { await ScreenOrientation.unlock(); } catch { /* تجاهل */ }
  }

  // ==================== الاهتزاز (Haptics) ====================
  haptic(style) {
    if (native) { Haptics.impact({ style }).catch(() => {}); return; }
    if (navigator.vibrate) {
      const ms = style === ImpactStyle.Heavy ? 60 : style === ImpactStyle.Medium ? 30 : 12;
      navigator.vibrate(ms);
    }
  }
  hapticLight()   { this.haptic(ImpactStyle.Light); }
  hapticMedium()  { this.haptic(ImpactStyle.Medium); }
  hapticHeavy()   { this.haptic(ImpactStyle.Heavy); }
  hapticSuccess() {
    if (native) { Haptics.notification({ type: NotificationType.Success }).catch(() => {}); return; }
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
  }
  hapticError() {
    if (native) { Haptics.notification({ type: NotificationType.Error }).catch(() => {}); return; }
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
  }

  // ==================== حالة الشبكة ====================
  async bindNetwork() {
    try {
      const status = await Network.getStatus();
      this.updateNetworkBanner(status.connected);
      Network.addListener('networkStatusChange', (s) => this.updateNetworkBanner(s.connected));
    } catch { /* غير مدعوم */ }
  }

  updateNetworkBanner(connected) {
    document.getElementById('offline-banner')?.classList.toggle('hidden', connected);
  }

  // ==================== تزامن حالة اللعب مع النظام ====================
  onGameplayStart() {
    this.keepScreenOn();
    this.lockLandscape();
    if (native) StatusBar.hide().catch(() => {});
  }

  onGameplayPaused() {
    this.allowSleep();
    if (native) StatusBar.show().catch(() => {});
  }

  onGameplayResumed() {
    this.keepScreenOn();
    if (native) StatusBar.hide().catch(() => {});
  }

  onGameplayEnd() {
    this.allowSleep();
    this.unlockOrientation();
    if (native) StatusBar.show().catch(() => {});
  }
}
