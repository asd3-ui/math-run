import * as THREE from 'three';

const LANE_WIDTH = 3;

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.lane = 1;
    this.targetX = 0;
    this.x = 0;
    this.runTime = 0;
    this.characterConfig = null;

    this.group = new THREE.Group();
    this.bodyParts = {};
    this.buildBody({
      bodyColor: 0x4dabf7,
      headColor: 0xffdbac
    });

    scene.add(this.group);
  }

  buildBody(cfg) {
    // Clear old
    while (this.group.children.length > 0) {
      const c = this.group.children[0];
      this.group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    }

    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.bodyColor, roughness: 0.6, metalness: 0.1 });
    const headMat = new THREE.MeshStandardMaterial({ color: cfg.headColor, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.85, 6, 12), bodyMat);
    body.position.y = 1.15;
    this.group.add(body);
    this.bodyParts.body = body;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), headMat);
    head.position.y = 2.1;
    this.group.add(head);
    this.bodyParts.head = head;

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    for (const dx of [-0.15, 0.15]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), eyeMat);
      eye.position.set(dx, 2.15, -0.36);
      this.group.add(eye);
    }

    this.legs = [];
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2b40, roughness: 0.7 });
    for (let i = 0; i < 2; i++) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.6, 6, 10), legMat);
      leg.position.set(i === 0 ? -0.2 : 0.2, 0.42, 0);
      this.group.add(leg);
      this.legs.push(leg);
    }

    this.arms = [];
    for (let i = 0; i < 2; i++) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 6, 10), bodyMat);
      arm.position.set(i === 0 ? -0.62 : 0.62, 1.2, 0);
      this.group.add(arm);
      this.arms.push(arm);
    }

    this.characterConfig = cfg;
  }

  setCharacter(cfg) {
    this.buildBody(cfg);
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
    this.x += (this.targetX - this.x) * Math.min(1, dt * 14);
    this.group.position.x = this.x;

    if (alive) {
      this.runTime += dt * (speed * 0.32);
      const swing = Math.sin(this.runTime) * 0.7;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[0].rotation.x = -swing;
      this.arms[1].rotation.x = swing;
      this.group.position.y = Math.abs(Math.sin(this.runTime * 2)) * 0.1;
    } else {
      this.legs[0].rotation.x = 0;
      this.legs[1].rotation.x = 0;
      this.arms[0].rotation.x = 0;
      this.arms[1].rotation.x = 0;
    }
  }
}
