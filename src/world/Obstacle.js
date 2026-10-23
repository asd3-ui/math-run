import * as THREE from 'three';

export class Obstacle {
  constructor(scene, lane, worldType) {
    this.scene = scene;
    this.lane = lane;
    this.group = new THREE.Group();
    this.materials = [];
    this.geometries = [];

    const material = (options) => {
      const value = new THREE.MeshStandardMaterial(options);
      this.materials.push(value);
      return value;
    };
    const geometry = (value) => {
      this.geometries.push(value);
      return value;
    };
    const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    };

    const bark = material({ color: 0x65452b, roughness: 0.96 });
    const leaf = material({ color: 0x2f6840, roughness: 0.9 });
    const stone = material({ color: 0x777a7e, roughness: 0.97 });
    const metal = material({ color: 0x354253, roughness: 0.36, metalness: 0.58 });
    const glow = material({ color: 0x67eaff, emissive: 0x0aa8e8, emissiveIntensity: 1.25, metalness: 0.2, roughness: 0.25 });
    const magma = material({ color: 0x4c201b, roughness: 1 });
    const hot = material({ color: 0xff672e, emissive: 0xff2c08, emissiveIntensity: 1.8, roughness: 0.4 });

    if (worldType === 'rock') {
      add(geometry(new THREE.DodecahedronGeometry(1.25, 1)), stone, 0, 1.05, 0, 1.1, 0.9, 0.85);
      add(geometry(new THREE.DodecahedronGeometry(0.55, 0)), stone, 0.65, 0.55, 0.15, 0.9, 0.75, 0.8);
    } else if (worldType === 'neon') {
      add(geometry(new THREE.BoxGeometry(1.55, 2.4, 1.1)), metal, 0, 1.2, 0);
      const frameBase = geometry(new THREE.BoxGeometry(1.68, 2.52, 1.2));
      const frame = new THREE.Mesh(geometry(new THREE.EdgesGeometry(frameBase)), glow);
      frame.position.y = 1.2;
      this.group.add(frame);
      add(geometry(new THREE.BoxGeometry(1.2, 0.14, 1.18)), glow, 0, 2.0, 0);
    } else if (worldType === 'asteroid') {
      add(geometry(new THREE.IcosahedronGeometry(1.25, 1)), stone, 0, 1.3, 0, 1.15, 0.92, 1.05);
      const ring = new THREE.Mesh(geometry(new THREE.TorusGeometry(1.55, 0.075, 8, 28)), glow);
      ring.position.y = 1.25;
      ring.rotation.x = Math.PI / 2.8;
      this.group.add(ring);
    } else if (worldType === 'lava') {
      add(geometry(new THREE.ConeGeometry(1.2, 2.8, 7)), magma, 0, 1.4, 0, 1.1, 1, 1);
      add(geometry(new THREE.SphereGeometry(0.34, 12, 8)), hot, -0.32, 1.1, -0.42, 0.8, 1.4, 0.45);
      add(geometry(new THREE.SphereGeometry(0.28, 12, 8)), hot, 0.42, 0.75, -0.35, 0.8, 1.2, 0.4);
    } else {
      add(geometry(new THREE.CylinderGeometry(0.42, 0.55, 2.8, 9)), bark, 0, 1.4, 0);
      add(geometry(new THREE.ConeGeometry(1.15, 2.0, 9)), leaf, 0, 3.0, 0);
      add(geometry(new THREE.ConeGeometry(0.82, 1.65, 9)), leaf, 0, 3.8, 0);
    }

    // Low-profile warning ring remains readable without obscuring the route.
    const warningMat = material({
      color: 0xff6b4a, emissive: 0x8a170c, emissiveIntensity: 0.45,
      side: THREE.DoubleSide, transparent: true, opacity: 0.62, roughness: 0.45
    });
    const warning = new THREE.Mesh(geometry(new THREE.RingGeometry(1.25, 1.55, 32)), warningMat);
    warning.rotation.x = -Math.PI / 2;
    warning.position.y = 0.035;
    this.group.add(warning);

    this.group.position.set((lane - 1) * 3, 0, -45);
    scene.add(this.group);
  }

  dispose() {
    this.scene.remove(this.group);
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
  }
}
