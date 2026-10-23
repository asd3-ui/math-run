import * as THREE from 'three';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.systems = [];
    this.worldId = 1;

    const starGeo = new THREE.BufferGeometry();
    const starCount = scene.userData.lowPower ? 180 : 420;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 100 + 15;
      positions[i * 3 + 2] = -Math.random() * 500 - 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.42, transparent: true, opacity: 0.82, sizeAttenuation: true });
    this.stars = new THREE.Points(starGeo, starMat);
    this.stars.visible = false;
    scene.add(this.stars);

    this.atmosphereGeometry = new THREE.BufferGeometry();
    this.atmosphereCount = scene.userData.lowPower ? 80 : 180;
    this.atmospherePositions = new Float32Array(this.atmosphereCount * 3);
    for (let i = 0; i < this.atmosphereCount; i++) {
      this.atmospherePositions[i * 3] = (Math.random() - 0.5) * 62;
      this.atmospherePositions[i * 3 + 1] = Math.random() * 28;
      this.atmospherePositions[i * 3 + 2] = -Math.random() * 260 + 25;
    }
    this.atmosphereGeometry.setAttribute('position', new THREE.BufferAttribute(this.atmospherePositions, 3));
    this.atmosphereMaterial = new THREE.PointsMaterial({
      color: 0xcceebb, size: 0.16, transparent: true, opacity: 0.58,
      depthWrite: false, sizeAttenuation: true
    });
    this.atmosphere = new THREE.Points(this.atmosphereGeometry, this.atmosphereMaterial);
    scene.add(this.atmosphere);
  }

  setWorld(worldId) {
    this.worldId = worldId;
    this.stars.visible = worldId === 4;
    const colors = {
      1: 0xcceebb,
      2: 0xffd08a,
      3: 0x45eaff,
      4: 0xb9c7ff,
      5: 0xff5722
    };
    this.atmosphereMaterial.color.setHex(colors[worldId] || colors[1]);
    this.atmosphereMaterial.size = worldId === 5 ? 0.23 : 0.16;
    this.atmosphereMaterial.opacity = worldId === 2 || worldId === 5 ? 0.68 : 0.5;
  }

  burst(position, color = 0xffd700, count = 20) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = position.x;
      pos[i * 3 + 1] = position.y;
      pos[i * 3 + 2] = position.z;
      vel.push(new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 10
      ));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.35, transparent: true, opacity: 1 });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    const system = { points, vel, life: 1.0 };
    this.systems.push(system);
    return system;
  }

  update(dt, speed = 8) {
    if (this.stars.visible) this.stars.rotation.y += dt * 0.02;
    const attr = this.atmosphereGeometry.attributes.position;
    const positions = attr.array;
    for (let i = 0; i < this.atmosphereCount; i++) {
      const j = i * 3;
      positions[j + 2] += speed * dt * (this.worldId === 2 ? 0.25 : 0.42);
      positions[j] += Math.sin(this.elapsed + i * 0.73) * dt * 0.15;
      positions[j + 1] += Math.sin(this.elapsed * 0.7 + i) * dt * 0.12;
      if (positions[j + 2] > 32) {
        positions[j] = (Math.random() - 0.5) * 62;
        positions[j + 1] = Math.random() * 28;
        positions[j + 2] = -240 - Math.random() * 45;
      }
    }
    attr.needsUpdate = true;
    this.elapsed = (this.elapsed || 0) + dt;

    for (let i = this.systems.length - 1; i >= 0; i--) {
      const s = this.systems[i];
      const pos = s.points.geometry.attributes.position.array;
      for (let j = 0; j < s.vel.length; j++) {
        s.vel[j].y -= 20 * dt;
        pos[j * 3] += s.vel[j].x * dt;
        pos[j * 3 + 1] += s.vel[j].y * dt;
        pos[j * 3 + 2] += s.vel[j].z * dt;
      }
      s.points.geometry.attributes.position.needsUpdate = true;
      s.life -= dt;
      s.points.material.opacity = Math.max(0, s.life);
      if (s.life <= 0) {
        this.scene.remove(s.points);
        s.points.geometry.dispose();
        s.points.material.dispose();
        this.systems.splice(i, 1);
      }
    }
  }

  dispose() {
    this.scene.remove(this.stars);
    this.stars.geometry.dispose();
    this.stars.material.dispose();
    this.scene.remove(this.atmosphere);
    this.atmosphereGeometry.dispose();
    this.atmosphereMaterial.dispose();
    for (const system of this.systems) {
      this.scene.remove(system.points);
      system.points.geometry.dispose();
      system.points.material.dispose();
    }
    this.systems = [];
  }
}
