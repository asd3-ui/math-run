import * as THREE from 'three';

const LANE_WIDTH = 3;

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.lane = 1;
    this.targetX = 0;
    this.x = 0;
    this.runTime = 0;
    
    this.group = new THREE.Group();
    this.bodyParts = {};
    this.buildBody({ bodyColor: 0x4dabf7, headColor: 0xffdbac });
    scene.add(this.group);
  }

  buildBody(cfg) {
    // تنظيف
    while (this.group.children.length > 0) {
      const c = this.group.children[0];
      this.group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }

    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.bodyColor, roughness: 0.4, metalness: 0.1 });
    const headMat = new THREE.MeshStandardMaterial({ color: cfg.headColor, roughness: 0.5 });

    // جسم أكثر واقعية
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 8, 16), bodyMat);
    body.position.y = 1.15;
    this.group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), headMat);
    head.position.y = 2.15;
    this.group.add(head);

    // عيون
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    for (const dx of [-0.15, 0.15]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), eyeMat);
      eye.position.set(dx, 2.2, -0.38);
      this.group.add(eye);
    }

    // أطراف
    this.legs = [];
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2b40, roughness: 0.8 });
    for (let i = 0; i < 2; i++) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.6, 8, 12), legMat);
      leg.position.set(i === 0 ? -0.2 : 0.2, 0.42, 0);
      this.group.add(leg);
      this.legs.push(leg);
    }

    this.arms = [];
    for (let i = 0; i < 2; i++) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 8, 12), bodyMat);
      arm.position.set(i === 0 ? -0.62 : 0.62, 1.25, 0);
      this.group.add(arm);
      this.arms.push(arm);
    }
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
    // تحكم سلس مع تأثير الميلان (Lean)
    const diff = this.targetX - this.x;
    this.x += diff * Math.min(1, dt * 12);
    this.group.position.x = this.x;
    
    // الميلان عند تغيير المسار
    const targetRotationZ = diff * -0.15; 
    this.group.rotation.z += (targetRotationZ - this.group.rotation.z) * dt * 10;

    if (alive) {
      this.runTime += dt * (speed * 0.35);
      const swing = Math.sin(this.runTime) * 0.8;
      
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[0].rotation.x = -swing;
      this.arms[1].rotation.x = swing;
      
      // ارتداد أثناء الجري
      this.group.position.y = Math.abs(Math.sin(this.runTime * 2)) * 0.12;
    } else {
      this.legs[0].rotation.x = 0;
      this.legs[1].rotation.x = 0;
      this.arms[0].rotation.x = 0;
      this.arms[1].rotation.x = 0;
    }
  }
}
