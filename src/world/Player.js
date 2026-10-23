import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const LANE_WIDTH = 3;

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.lane = 1;
    this.targetX = 0;
    this.x = 0;
    this.runTime = 0;
    this.modelMixer = null;
    this.modelRoot = null;
    this.modelActions = [];
    this.group = new THREE.Group();
    this.buildBody({ bodyColor: 0x4dabf7, headColor: 0xffdbac });
    scene.add(this.group);
  }

  buildBody(cfg) {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      child.traverse?.(part => {
        if (part.geometry) part.geometry.dispose();
        if (part.material) {
          if (Array.isArray(part.material)) part.material.forEach(m => m.dispose());
          else part.material.dispose();
        }
      });
    }

    const mat = (color, roughness = 0.72, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const bodyMat = mat(cfg.bodyColor, 0.48, 0.04);
    const skinMat = mat(cfg.headColor, 0.72);
    const pantsMat = mat(0x26364b, 0.88);
    const shoeMat = mat(0x151a21, 0.5, 0.08);
    const hairMat = mat(cfg.headColor === 0x1a1a2e ? 0x12131a : 0x35261e, 0.95);
    const eyeMat = mat(0x151515, 0.3);
    const accentMat = mat(0xf1f5f9, 0.4, 0.1);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.72, 6, 12), bodyMat);
    torso.position.y = 1.38;
    this.torso = torso;
    torso.castShadow = true;
    torso.receiveShadow = true;
    this.group.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 10), skinMat);
    neck.position.y = 1.91;
    this.group.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 24, 18), skinMat);
    head.position.y = 2.22;
    this.head = head;
    head.castShadow = true;
    this.group.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.385, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
    hair.position.set(0, 2.34, 0.015);
    this.group.add(hair);

    for (const dx of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeMat);
      eye.position.set(dx, 2.23, -0.326);
      this.group.add(eye);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), accentMat);
      glint.position.set(dx - 0.01, 2.245, -0.363);
      this.group.add(glint);
    }

    this.legs = [];
    this.arms = [];
    this.legPivots = [];
    this.armPivots = [];

    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.19, 0.82, 0);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.47, 5, 10), pantsMat);
      leg.position.y = -0.27;
      leg.castShadow = true;
      legPivot.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.14, 0.42), shoeMat);
      shoe.position.set(0, -0.55, -0.1);
      shoe.castShadow = true;
      legPivot.add(shoe);
      this.group.add(legPivot);
      this.legPivots.push(legPivot);
      this.legs.push(leg);

      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.46, 1.68, 0);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.42, 5, 10), bodyMat);
      arm.position.y = -0.27;
      arm.castShadow = true;
      armPivot.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skinMat);
      hand.position.y = -0.55;
      armPivot.add(hand);
      this.group.add(armPivot);
      this.armPivots.push(armPivot);
      this.arms.push(arm);
    }

    // Small backpack silhouette gives the runner depth from the follow camera.
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.22), bodyMat);
    pack.material = bodyMat;
    pack.position.set(0, 1.4, 0.38);
    pack.castShadow = true;
    this.group.add(pack);
  }

  setCharacter(cfg) {
    this.modelMixer?.stopAllAction();
    this.modelMixer = null;
    this.modelRoot = null;
    this.buildBody(cfg);
  }

  /**
   * Optional production asset hook. Supply a licensed, rigged GLB with embedded
   * run/idle clips; the procedural runner remains visible if loading fails.
   */
  async loadAnimatedModel(url) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const root = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Runner GLB has invalid bounds.');
    const scale = 2.55 / size.y;
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    root.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = false;
      }
    });
    this.group.add(root);
    if (this.modelRoot) this.group.remove(this.modelRoot);
    this.modelRoot = root;
    for (const child of this.group.children) {
      if (child !== root) child.visible = false;
    }
    this.modelMixer = new THREE.AnimationMixer(root);
    const clips = gltf.animations || [];
    const runClip = clips.find((clip) => /run|jog|sprint/i.test(clip.name)) || clips[0];
    this.modelActions = [];
    if (runClip) {
      const action = this.modelMixer.clipAction(runClip);
      action.play();
      this.modelActions.push(action);
    }
    return { animations: clips.map((clip) => clip.name), model: root };
  }

  moveLane(dir) {
    this.lane = Math.max(0, Math.min(2, this.lane + dir));
    this.targetX = (this.lane - 1) * LANE_WIDTH;
  }

  setLane(lane) {
    this.lane = Math.max(0, Math.min(2, lane));
    this.targetX = (this.lane - 1) * LANE_WIDTH;
    this.x = this.targetX;
    this.group.position.x = this.x;
  }

  update(dt, speed, alive) {
    if (this.modelMixer) {
      this.modelMixer.timeScale = alive ? 1 : 0.12;
      this.modelMixer.update(dt);
    }
    if (this.modelRoot) this.modelRoot.visible = true;
    const diff = this.targetX - this.x;
    this.x += diff * Math.min(1, dt * 10);
    this.group.position.x = this.x;
    const lean = THREE.MathUtils.clamp(diff * -0.09, -0.3, 0.3);
    this.group.rotation.z += (lean - this.group.rotation.z) * Math.min(1, dt * 8);

    if (alive) {
      this.runTime += dt * (speed * 0.34);
      const stride = this.runTime;
      const swing = Math.sin(stride) * 0.82;
      this.legPivots[0].rotation.x = swing;
      this.legPivots[1].rotation.x = -swing;
      this.armPivots[0].rotation.x = -swing * 0.85;
      this.armPivots[1].rotation.x = swing * 0.85;
      const bounce = Math.abs(Math.sin(stride * 2)) * 0.095;
      this.group.position.y = bounce;
      if (this.torso) {
        this.torso.rotation.z = Math.sin(stride) * 0.035;
        this.torso.rotation.x = Math.cos(stride * 2) * 0.025;
      }
      if (this.head) {
        this.head.rotation.z = Math.sin(stride * 0.5) * 0.025;
        this.head.position.y = 2.22 + bounce * 0.22;
      }
      this.group.rotation.y += (Math.sin(stride * 0.5) * 0.035 - this.group.rotation.y) * Math.min(1, dt * 4);
    } else {
      for (const pivot of this.legPivots) pivot.rotation.x *= Math.max(0, 1 - dt * 8);
      for (const pivot of this.armPivots) pivot.rotation.x *= Math.max(0, 1 - dt * 8);
      this.group.position.y *= Math.max(0, 1 - dt * 8);
      if (this.torso) {
        this.torso.rotation.z *= Math.max(0, 1 - dt * 8);
        this.torso.rotation.x *= Math.max(0, 1 - dt * 8);
      }
      if (this.head) {
        this.head.rotation.z *= Math.max(0, 1 - dt * 8);
        this.head.position.y += (2.22 - this.head.position.y) * Math.min(1, dt * 8);
      }
      this.group.rotation.y *= Math.max(0, 1 - dt * 4);
    }
  }
}
