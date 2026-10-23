import * as THREE from 'three';
import { Player } from '../world/Player.js';
import { Track } from '../world/Track.js';
import { Gate } from '../world/Gate.js';
import { Obstacle } from '../world/Obstacle.js';
import { Environment } from '../world/Environment.js';
import { Particles } from '../world/Particles.js';
import { QuestionSystem, calculateCoinReward, chooseWrongLane, evaluateGate } from '../systems/QuestionSystem.js';
import { PowerUps } from '../systems/PowerUps.js';
import { LevelConfigs, EndlessConfig } from '../data/questions.js';
import { Characters } from '../data/characters.js';
import { writeSave } from '../systems/Progress.js';


class AdaptiveQuality {
  constructor(renderer, mobile) {
    this.renderer = renderer;
    this.mobile = mobile;
    this.tier = mobile ? 1 : 2;
    this.frameTime = 1 / 60;
    this.elapsed = 0;
    this.decisionElapsed = 0;
    this.stableElapsed = 0;
    this.fps = 60;
    this.debug = new URLSearchParams(window.location.search).has('debug');
    this.overlay = null;
    this.pixelRatio = 1;
    this.apply(true);
    if (this.debug) {
      this.overlay = document.createElement('pre');
      Object.assign(this.overlay.style, {
        position: 'fixed', zIndex: '99999', left: '6px', top: '6px',
        margin: '0', padding: '7px 9px', borderRadius: '6px',
        color: '#e8f8ff', background: 'rgba(3,8,20,.82)',
        font: '11px/1.45 monospace', pointerEvents: 'none', whiteSpace: 'pre'
      });
      document.body.appendChild(this.overlay);
    }
  }

  apply(force = false) {
    const pixelLimits = [0.85, 1.0, 1.5];
    const ratio = Math.min(window.devicePixelRatio || 1, pixelLimits[this.tier] * (this.mobile ? 1 : 1.3), this.mobile ? 1.25 : 2);
    if (force || ratio !== this.pixelRatio) {
      this.pixelRatio = ratio;
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    const shadows = this.tier === 2 && !this.mobile;
    if (this.renderer.shadowMap.enabled !== shadows) {
      this.renderer.shadowMap.enabled = shadows;
      this.renderer.shadowMap.needsUpdate = true;
    }
    this.renderer.domElement.dataset.quality = ['low', 'balanced', 'high'][this.tier];
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.frameTime += (dt - this.frameTime) * 0.08;
    this.fps = 1 / Math.max(0.001, this.frameTime);
    this.elapsed += dt;
    this.decisionElapsed += dt;
    this.stableElapsed += dt;

    if (this.decisionElapsed >= 2.5) {
      if (this.frameTime > 0.027 && this.tier > 0) {
        this.tier--;
        this.stableElapsed = 0;
        this.apply();
      } else if (this.frameTime < 0.017 && this.tier < (this.mobile ? 1 : 2) && this.stableElapsed > 12) {
        this.tier++;
        this.stableElapsed = 0;
        this.apply();
      }
      this.decisionElapsed = 0;
    }

    if (this.overlay && this.elapsed >= 1) {
      const info = this.renderer.info;
      const heap = performance.memory
        ? `JS heap: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)}/${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(0)} MB`
        : 'JS heap: not exposed by this WebView';
      this.overlay.textContent = [
        `FPS ${this.fps.toFixed(0)} | ${(1000 / Math.max(1, this.fps)).toFixed(1)} ms/frame`,
        `quality: ${['low', 'balanced', 'high'][this.tier]} | DPR: ${this.pixelRatio.toFixed(2)}`,
        `draw calls: ${info.render.calls} | triangles: ${info.render.triangles}`,
        `geometries: ${info.memory.geometries} | textures: ${info.memory.textures}`,
        heap
      ].join('\n');
      this.elapsed = 0;
    }
  }
}

export class Game {
  constructor({ hud, screens, audio, save }) {
    this.hud = hud;
    this.screens = screens;
    this.audio = audio;
    this.save = save;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);
    this.camera.position.set(0, 7.5, 13);
    this.camera.lookAt(0, 1.5, -10);

    // Adaptive quality: retain richer desktop rendering while limiting GPU cost on phones.
    this.isMobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.25 : 2));
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.info.autoReset = true;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    // Shadow maps are intentionally smaller on mobile to keep frame time stable.
    this.renderer.domElement.style.touchAction = 'none';
    this.quality = new AdaptiveQuality(this.renderer, this.isMobile);

    this.scene.userData.lowPower = this.isMobile;
    this.env = new Environment(this.scene);
    this.env.dirLight.shadow.mapSize.set(this.isMobile ? 512 : 2048, this.isMobile ? 512 : 2048);
    this.env.dirLight.castShadow = !this.isMobile;
    this.track = new Track(this.scene);
    this.player = new Player(this.scene);
    // Keep the procedural runner available while the optional model loads.
    this.player.loadAnimatedModel('/models/quaternius-platformer-runner.glb')
      .catch((error) => console.warn('Using procedural runner; optional GLB unavailable:', error));
    this.particles = new Particles(this.scene);
    this.questions = new QuestionSystem();
    this.powerups = new PowerUps();

    // Create reusable round objects before play and compile their common shaders during the menu.
    // This avoids allocating/discarding dozens of meshes and compiling materials at each gate.
    this.gate = new Gate(this.scene, [0, 1, 2], 0);
    this.obstacle = new Obstacle(this.scene, 1, 'tree');
    this.renderer.compile(this.scene, this.camera);
    this.gate.group.visible = false;
    this.obstacle.group.visible = false;

    this.state = 'menu';
    this.clock = new THREE.Clock();
    this.levelIndex = 0;
    this.levelConfig = LevelConfigs[0];
    
    this.applySelectedCharacter();
    this.bindEvents();

    this.hud.setOnUsePowerup((t) => this.usePowerup(t));
    this.hud.setOnPause(() => this.togglePause());
    this.screens.handlers.character = (c) => this.selectCharacter(c);
    this.screens.handlers.back = (target) => this.backTo(target);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  applySelectedCharacter() {
    const id = this.save.selectedCharacter || 'boy';
    const cfg = Characters.find(c => c.id === id) || Characters[0];
    this.player.setCharacter({ bodyColor: cfg.bodyColor, headColor: cfg.headColor });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => this.onKey(e));
    let startX = 0, moved = false;
    const el = this.renderer.domElement;
    el.addEventListener('touchstart', (e) => { this.audio.resume(); startX = e.touches[0].clientX; moved = false; }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (moved) return;
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 30) { this.player.moveLane(dx > 0 ? 1 : -1); moved = true; }
    }, { passive: true });
    el.addEventListener('touchend', () => { moved = false; });
    el.addEventListener('mousedown', () => this.audio.resume());
  }

  onKey(e) {
    if (this.state !== 'playing') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') this.player.moveLane(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') this.player.moveLane(1);
    else if (e.key === 'Escape' || e.key === 'p') this.togglePause();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.quality) this.quality.apply(true);
    else this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.25 : 2));
  }

  backTo(target) {
    this.audio.click();
    if (target === 'menu') {
      this.state = 'menu';
      this.clearLevelObjects();
      this.hud.hide();
      this.audio.stopMusic();
      this.screens.show('menu');
      this.screens.refresh();
    }
  }

  selectCharacter(c) {
    if (this.save.ownedCharacters.includes(c.id)) {
      this.save.selectedCharacter = c.id;
      this.applySelectedCharacter();
      writeSave(this.save);
      this.audio.click();
      this.screens.refreshCharacters();
    } else if (this.save.coins >= c.price) {
      this.save.coins -= c.price;
      this.save.ownedCharacters.push(c.id);
      this.save.selectedCharacter = c.id;
      this.applySelectedCharacter();
      writeSave(this.save);
      this.audio.powerup();
      this.screens.refreshCoins();
      this.screens.refreshCharacters();
    } else {
      this.audio.beep(180, 0.2, 'sawtooth');
    }
  }

  startLevel(index) {
    this.audio.resume();
    this.isEndless = false;
    this.levelIndex = Math.max(0, Math.min(LevelConfigs.length - 1, index));
    this.levelConfig = LevelConfigs[this.levelIndex];
    this.beginRun(this.levelConfig);
  }

  startEndless() {
    this.audio.resume();
    this.isEndless = true;
    this.levelIndex = -1;
    this.levelConfig = EndlessConfig;
    this.beginRun(EndlessConfig);
  }

  beginRun(config) {
    this.env.setEnvironment(config.worldData);
    this.track.setGroundColor(config.worldData.ground);
    this.particles.setWorld(config.worldData.id);

    this.state = 'playing';
    this.speed = config.speed;
    this.targetCount = config.target;
    this.correctCount = 0;
    this.hearts = 3;
    this.combo = 0;
    this.bestCombo = 0;
    this.sessionCoins = 0;
    this.spawnCooldown = 0;
    this.pendingRemove = false;
    this.powerups.reset();

    this.clearLevelObjects();
    this.player.setLane(1);

    this.hud.setCoins(this.save.coins);
    this.hud.setHearts(this.hearts);
    this.hud.setSpeed(this.speed);
    this.hud.setProgress(0, config.target);
    this.hud.setPowerups(this.save.powerups);
    this.hud.hideCombo();
    this.hud.show();
    this.screens.show(null);
    
    // بدء الموسيقى
    this.audio.startMusic(config.worldData.id);
    this.spawnRound();
  }

  clearLevelObjects() {
    // Keep the GPU resources alive and reuse them on the next round to prevent frame hitches.
    if (this.gate) this.gate.group.visible = false;
    if (this.obstacle) this.obstacle.group.visible = false;
  }

  spawnRound() {
    const q = this.questions.next(this.levelConfig);
    this.hud.setQuestion(q.text);
    this.hud.setAnswers(q.answers);

    this.clearLevelObjects();

    // 1. إنشاء البوابات الثلاث (جميعها تظهر)
    if (!this.gate) this.gate = new Gate(this.scene, q.answers, q.correctIndex);
    else this.gate.reset(q.answers, q.correctIndex);
    this.gate.q = q;

    // 2. اختيار مسار عشوائي ووضع عائق فيه (في المنتصف وقبل البوابة)
    const obstacleLane = chooseWrongLane(q.correctIndex);
    const obstacleType = this.levelConfig.worldData.obstacleType;
    if (this.obstacle && this.obstacle.worldType !== obstacleType) {
      this.obstacle.dispose();
      this.obstacle = null;
    }
    if (!this.obstacle) this.obstacle = new Obstacle(this.scene, obstacleLane, obstacleType);
    else this.obstacle.reset(obstacleLane, obstacleType);

    // لا نخفي البوابة! نتركها تظهر ليعرف اللاعب أن هذا المسار مسدود
    // لكنه سيصطدم بالعائق إذا اختاره
    if (this.pendingRemove) {
      this.applyRemoveToGate();
      this.pendingRemove = false;
    }
  }

  usePowerup(type) {
    if (this.state !== 'playing' || (this.save.powerups[type] || 0) <= 0) return;

    if (type === 'freeze') {
      if (this.powerups.isFrozen()) return;
      this.save.powerups[type]--;
      this.powerups.activate('freeze');
      this.hud.setPowerupActive('freeze', true);
      setTimeout(() => this.hud.setPowerupActive('freeze', false), 4000);
    } else if (type === 'remove') {
      if (this.powerups.removeUsed) return;
      this.save.powerups[type]--;
      this.powerups.removeUsed = true;
      if (this.gate) this.applyRemoveToGate();
      else this.pendingRemove = true;
    } else if (type === 'shield') {
      if (this.powerups.shieldActive) return;
      this.save.powerups[type]--;
      this.powerups.activate('shield');
      this.hud.setPowerupActive('shield', true);
    }
    this.hud.setPowerups(this.save.powerups);
    writeSave(this.save);
    this.audio.powerup();
  }

  applyRemoveToGate() {
    if (!this.gate) return;
    // حذف الإجابة الخاطئة
    const visibleLanes = [0, 1, 2].filter(i => i !== this.gate.correctIndex && this.gate.panels[i].visible);
    if (visibleLanes.length > 0) {
        const pick = visibleLanes[Math.floor(Math.random() * visibleLanes.length)];
        this.gate.panels[pick].visible = false;
        this.hud.disableAnswer(pick);
    }
  }

  buyPowerup(type) {
    const prices = { freeze: 50, remove: 40, shield: 70, heart: 60 };
    const price = prices[type];
    if (!price || this.save.coins < price) { this.audio.beep(180, 0.15, 'sawtooth'); return; }
    this.save.coins -= price;
    this.save.powerups[type] = (this.save.powerups[type] || 0) + 1;
    writeSave(this.save);
    this.screens.refreshCoins();
    this.audio.coin();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.audio.stopMusic();
      this.screens.show('pause');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.screens.show(null);
      this.audio.startMusic(this.levelConfig.worldData.id);
    }
  }

  updatePlaying(dt) {
    const frozen = this.powerups.isFrozen();
    const effectiveSpeed = frozen ? this.speed * 0.35 : this.speed;

    this.speed = Math.min(this.levelConfig.speed + 16, this.speed + dt * 0.35);

    // تغيير سرعة الموسيقى مع تسارع اللعبة
    this.audio.setMusicTempo(this.speed);

    this.track.update(dt, effectiveSpeed);
    this.env.update(dt, effectiveSpeed);
    this.player.update(dt, effectiveSpeed, true);
    this.particles.update(dt, effectiveSpeed);

    if (this.gate && this.gate.group.visible) {
      this.gate.group.position.z += effectiveSpeed * dt;
      if (this.obstacle) this.obstacle.group.position.z += effectiveSpeed * dt;

      if (!this.gate.checked && this.gate.group.position.z >= 0) {
        this.gate.checked = true;
        this.resolveGate();
      }
      if (this.gate && this.gate.group.position.z > 20) {
        this.clearLevelObjects();
        this.spawnCooldown = 0.4;
      }
    } else if (this.spawnCooldown > 0) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0) this.spawnRound();
    }

    this.hud.setSpeed(this.speed);
  }

  resolveGate() {
    const gate = this.gate;
    if (!gate) return;

    // هل اللاعب في مسار العائق؟
    const decision = evaluateGate({
      playerLane: this.player.lane,
      correctIndex: gate.correctIndex,
      obstacleLane: this.obstacle ? this.obstacle.lane : null
    });
    const hitObstacle = decision.hitObstacle;

    if (decision.correct) {
      // إجابة صحيحة
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;
      const gain = calculateCoinReward(this.combo);
      this.sessionCoins += gain;
      this.save.coins += gain;
      this.save.stats.totalCoins += gain;
      this.correctCount++;
      this.save.stats.totalCorrect++;

      this.hud.setCoins(this.save.coins);
      this.hud.setProgress(this.correctCount, this.targetCount);
      this.hud.flashCorrect();
      this.hud.showCombo(this.combo);
      this.audio.correct();
      this.particles.burst(this.player.group.position.clone().add(new THREE.Vector3(0, 1.5, -1)), 0xffd700, 25);

      if (!this.isEndless && this.correctCount >= this.targetCount) {
        this.finishLevel();
        return;
      }
      setTimeout(() => { this.clearLevelObjects(); }, 160);
      this.spawnCooldown = 1.0;
    } else {
      // إجابة خاطئة أو اصطدام بعائق
      this.combo = 0;
      this.hud.hideCombo();
      this.hud.flashWrong();
      this.audio.wrong();
      this.particles.burst(this.player.group.position.clone().add(new THREE.Vector3(0, 1, -1)), 0xff4757, 15);
      
      if (hitObstacle) {
          this.audio.bump(); // صوت اصطدام
      }

      if (this.powerups.shieldActive) {
        this.powerups.shieldActive = false;
        this.hud.setPowerupActive('shield', false);
      } else {
        this.hearts--;
        this.hud.setHearts(this.hearts);
        if (this.hearts <= 0) {
          setTimeout(() => this.gameOver(), 350);
          return;
        }
      }

      setTimeout(() => {
        if (this.state === 'playing') { this.clearLevelObjects(); this.spawnCooldown = 1.0; }
      }, 1000);
    }
  }

  finishLevel() {
    this.state = 'levelcomplete';
    this.player.update(0, 0, false);
    this.audio.stopMusic();
    const nextLevelNum = this.levelIndex + 2;
    if (nextLevelNum <= LevelConfigs.length) this.save.unlockedLevel = Math.max(this.save.unlockedLevel, nextLevelNum);
    this.save.bestLevel = Math.max(this.save.bestLevel, nextLevelNum);
    this.save.stats.bestCombo = Math.max(this.save.stats.bestCombo, this.bestCombo);
    writeSave(this.save);
    this.audio.victory();
    this.hud.hide();
    this.screens.showLevelComplete(this.sessionCoins, this.correctCount);
  }

  gameOver() {
    this.state = 'gameover';
    this.save.stats.bestCombo = Math.max(this.save.stats.bestCombo, this.bestCombo);
    writeSave(this.save);
    this.audio.stopMusic();
    this.audio.gameOver();
    this.hud.hide();
    this.screens.showGameOver(this.sessionCoins, this.correctCount, this.bestCombo);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.state === 'playing') {
      this.updatePlaying(dt);
    } else {
      this.track.update(dt, 8);
      this.env.update(dt, 8);
      this.particles.update(dt);
      if (this.state !== 'paused') this.player.update(dt, 8, false);
    }
    // Soft follow-camera movement adds speed and weight without affecting lane logic.
    const desiredCameraX = this.player.group.position.x * 0.22;
    this.camera.position.x += (desiredCameraX - this.camera.position.x) * Math.min(1, dt * 2.8);
    this.camera.lookAt(this.player.group.position.x * 0.16, 1.45, -10);
    this.renderer.render(this.scene, this.camera);
    this.quality?.update(dt);
  }
}
