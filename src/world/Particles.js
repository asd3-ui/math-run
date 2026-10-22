import * as THREE from 'three';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.systems = [];

    // Star field background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 80 + 20;
      positions[i * 3 + 2] = -Math.random() * 500 - 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.8 });
    this.stars = new THREE.Points(starGeo, starMat);
    scene.add(this.stars);
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

  update(dt) {
    // Stars drift
    this.stars.rotation.y += dt * 0.02;

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
}
