import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { ScreenOrientation } from '@capacitor/screen-orientation';
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

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.game.state === 'playing') this.keepScreenOn();
    });
  }

  bindBackButton() {
    if (native) {
      App.addListener('backButton', () => this.handleBackButton());
      return;
    }
    try {
      history.pushState({ mathRun: true }, '', location.href);
      window.addEventListener('popstate', () => {
        this.handleBackButton();
        history.pushState({ mathRun: true }, '', location.href);
      });
    } catch { /* History API غير متاح */ }
  }

  handleBackButton() {
    if (this.screens.current === 'exit-confirm') { this.screens.hideExitConfirm(); return; }
    if (this.game.state === 'playing') { this.hapticLight(); this.game.togglePause(); return; }
    if (this.game.state === 'paused') { this.game.togglePause(); return; }
    if (this.game.state === 'gameover' || this.game.state === 'levelcomplete') {
      this.game.backTo('menu');
      return;
    }
    if (['levels', 'shop', 'characters'].includes(this.screens.current)) {
      this.game.backTo('menu');
      return;
    }
    this.screens.showExitConfirm(() => {
      if (native) App.exitApp();
      else window.close();
    });
  }

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
    if (this.game.state === 'playing') this.game.togglePause();
    this.allowSleep();
    if (native) StatusBar.show().catch(() => {});
  }

  onForeground() {
    if (native && this.game.state === 'playing') StatusBar.hide().catch(() => {});
  }

  async keepScreenOn() {
    try {
      if (native) await KeepAwake.keepAwake();
      else if ('wakeLock' in navigator) this.wakeLock = await navigator.wakeLock.request('screen');
    } catch { /* غير مدعوم */ }
  }

  async allowSleep() {
    try {
      if (native) await KeepAwake.allowSleep();
      else if (this.wakeLock) { await this.wakeLock.release(); this.wakeLock = null; }
    } catch { /* تجاهل */ }
  }

  async lockLandscape() {
    try { await ScreenOrientation.lock({ orientation: 'landscape' }); } catch { /* الوضع الطبيعي */ }
  }

  async unlockOrientation() {
    try { await ScreenOrientation.unlock(); } catch { /* تجاهل */ }
  }

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
