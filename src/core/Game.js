import * as THREE from 'three';
import { Player } from '../world/Player.js';
import { Track } from '../world/Track.js';
import { Gate } from '../world/Gate.js';
import { Obstacle } from '../world/Obstacle.js'; // استيراد العائق
import { Environment } from '../world/Environment.js';
import { Particles } from '../world/Particles.js';
import { QuestionSystem } from '../systems/QuestionSystem.js';
import { PowerUps } from '../systems/PowerUps.js';
import { LevelConfigs, EndlessConfig } from '../data/questions.js';
import { Characters } from '../data/characters.js';
import { writeSave } from '../systems/Progress.js';

export class Game {
  constructor({ hud, screens, audio, save }) {
    this.hud = hud;
    this.screens = screens;
    this.audio = audio;
    this.save = save;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);
    this.camera.position.set(0, 7.5, 13);
    this.camera.lookAt(0, 1.5, -10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; // تفعيل الظلال
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    this.env = new Environment(this.scene);
    this.track = new Track(this.scene);
    this.player = new Player(this.scene);
    this.particles = new Particles(this.scene);
    this.questions = new QuestionSystem();
    this.powerups = new PowerUps();

    this.state = 'menu';
    this.gate = null;
    this.obstacle = null; // متغير لحفظ العائق الحالي
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
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.player.moveLane(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.player.moveLane(1);
    else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') this.togglePause();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    const owned = this.save.ownedCharacters.includes(c.id);
    if (owned) {
      this.save.selectedCharacter = c.id;
      this.applySelectedCharacter();
      writeSave(this.save);
      this.audio.click();
      this.screens.refreshCharacters();
    } else {
      if (this.save.coins >= c.price) {
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
    // ربط البيئة الجديدة
    this.env.setEnvironment(config.worldData);
    this.track.setGroundColor(config.worldData.ground);

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
    this.audio.startMusic();
    this.spawnRound();
  }

  clearLevelObjects() {
    if (this.gate) { this.gate.dispose(); this.gate = null; }
    if (this.obstacle) { this.obstacle.dispose(); this.obstacle = null; }
  }

  spawnRound() {
    const q = this.questions.next(this.levelConfig);
    this.hud.setQuestion(q.text);
    this.hud.setAnswers(q.answers);

    this.clearLevelObjects();

    // 1. إنشاء البوابات الثلاث
    this.gate = new Gate(this.scene, q.answers, q.correctIndex);
    this.gate.q = q;

    // 2. اختيار مسار عشوائي (غير المسار الصحيح) ووضع عائق فيه
    const wrongLanes = [0, 1, 2].filter(i => i !== q.correctIndex);
    const obstacleLane = wrongLanes[Math.floor(Math.random() * wrongLanes.length)];
    
    // إخفاء البوابة في مسار العائق
    this.gate.panels[obstacleLane].visible = false;
    this.hud.disableAnswer(obstacleLane);
    
    // إنشاء العائق
    this.obstacle = new Obstacle(this.scene, obstacleLane, this.levelConfig.worldData.obstacleType);

    if (this.pendingRemove) {
      this.applyRemoveToGate();
      this.pendingRemove = false;
    }
  }

  usePowerup(type) {
    if (this.state !== 'playing') return;
    if ((this.save.powerups[type] || 0) <= 0) return;

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
    if (!price) return;
    if (this.save.coins < price) { this.audio.beep(180, 0.15, 'sawtooth'); return; }
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
      this.audio.startMusic();
    }
  }

  updatePlaying(dt) {
    const frozen = this.powerups.isFrozen();
    const effectiveSpeed = frozen ? this.speed * 0.35 : this.speed;

    this.speed = Math.min(this.levelConfig.speed + 16, this.speed + dt * 0.35);

    this.track.update(dt, effectiveSpeed);
    this.env.update(dt, effectiveSpeed);
    this.player.update(dt, effectiveSpeed, true);
    this.particles.update(dt);

    if (this.gate) {
      this.gate.group.position.z += effectiveSpeed * dt;
      
      if (this.obstacle) {
          this.obstacle.group.position.z += effectiveSpeed * dt;
      }

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

    // إذا اصطدم بالعائق
    const hitObstacle = this.obstacle && this.player.lane === this.obstacle.lane;

    if (this.player.lane === gate.correctIndex && !hitObstacle) {
      // إجابة صحيحة
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;
      const gain = 10 + this.combo * 5;
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

      gate.panels[gate.correctIndex].visible = false;
      writeSave(this.save);

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
          this.audio.bump();
      } else {
          gate.panels.forEach(p => p.material.color.set(0xff2b2b));
          gate.highlightCorrect();
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
    this.renderer.render(this.scene, this.camera);
  }
}
