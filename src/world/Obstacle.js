import * as THREE from 'three';

export class Obstacle {
  constructor(scene, lane, worldType) {
    this.scene = scene;
    this.lane = lane;
    this.worldType = worldType;
    this.group = new THREE.Group();

    const materials = {
      bark: new THREE.MeshStandardMaterial({ color: 0x65452b, roughness: 0.96 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x2f6840, roughness: 0.9 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x777a7e, roughness: 0.97 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x354253, roughness: 0.36, metalness: 0.58 }),
      glow: new THREE.MeshStandardMaterial({ color: 0x67eaff, emissive: 0x0aa8e8, emissiveIntensity: 1.25, metalness: 0.2, roughness: 0.25 }),
      magma: new THREE.MeshStandardMaterial({ color: 0x4c201b, roughness: 1 }),
      hot: new THREE.MeshStandardMaterial({ color: 0xff672e, emissive: 0xff2c08, emissiveIntensity: 1.8, roughness: 0.4 }),
      warning: new THREE.MeshStandardMaterial({ color: 0xff6b4a, emissive: 0x8a170c, emissiveIntensity: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.62, roughness: 0.45 })
    };
    const geometries = {
      rock: new THREE.DodecahedronGeometry(1.25, 1),
      smallRock: new THREE.DodecahedronGeometry(0.55, 0),
      box: new THREE.BoxGeometry(1.55, 2.4, 1.1),
      frameEdges: new THREE.EdgesGeometry(new THREE.BoxGeometry(1.68, 2.52, 1.2)),
      neonBar: new THREE.BoxGeometry(1.2, 0.14, 1.18),
      asteroid: new THREE.IcosahedronGeometry(1.25, 1),
      ring: new THREE.TorusGeometry(1.55, 0.075, 8, 28),
      volcano: new THREE.ConeGeometry(1.2, 2.8, 7),
      hotLarge: new THREE.SphereGeometry(0.34, 12, 8),
      hotSmall: new THREE.SphereGeometry(0.28, 12, 8),
      trunk: new THREE.CylinderGeometry(0.42, 0.55, 2.8, 9),
      treeTop: new THREE.ConeGeometry(1.15, 2.0, 9),
      treeTip: new THREE.ConeGeometry(0.82, 1.65, 9),
      warning: new THREE.RingGeometry(1.25, 1.55, 32)
    };
    const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.group.add(mesh);
      return mesh;
    };

    if (worldType === 'rock') {
      add(geometries.rock, materials.stone, 0, 1.05, 0, 1.1, 0.9, 0.85);
      add(geometries.smallRock, materials.stone, 0.65, 0.55, 0.15, 0.9, 0.75, 0.8);
    } else if (worldType === 'neon') {
      add(geometries.box, materials.metal, 0, 1.2, 0);
      const frame = new THREE.Mesh(geometries.frameEdges, materials.glow);
      frame.position.y = 1.2;
      this.group.add(frame);
      add(geometries.neonBar, materials.glow, 0, 2.0, 0);
    } else if (worldType === 'asteroid') {
      add(geometries.asteroid, materials.stone, 0, 1.3, 0, 1.15, 0.92, 1.05);
      const ring = add(geometries.ring, materials.glow, 0, 1.25, 0);
      ring.rotation.x = Math.PI / 2.8;
    } else if (worldType === 'lava') {
      add(geometries.volcano, materials.magma, 0, 1.4, 0, 1.1, 1, 1);
      add(geometries.hotLarge, materials.hot, -0.32, 1.1, -0.42, 0.8, 1.4, 0.45);
      add(geometries.hotSmall, materials.hot, 0.42, 0.75, -0.35, 0.8, 1.2, 0.4);
    } else {
      add(geometries.trunk, materials.bark, 0, 1.4, 0);
      add(geometries.treeTop, materials.leaf, 0, 3.0, 0);
      add(geometries.treeTip, materials.leaf, 0, 3.8, 0);
    }

    const warning = add(geometries.warning, materials.warning, 0, 0.035, 0);
    warning.rotation.x = -Math.PI / 2;
    this.resources = { materials, geometries };
    this.reset(lane, worldType);
    scene.add(this.group);
  }

  reset(lane, worldType = this.worldType) {
    this.lane = lane;
    this.worldType = worldType;
    this.group.position.set((lane - 1) * 3, 0, -45);
    this.group.visible = true;
  }

  dispose() {
    this.scene.remove(this.group);
    for (const geometry of Object.values(this.resources.geometries)) geometry.dispose();
    for (const material of Object.values(this.resources.materials)) material.dispose();
    this.resources = { materials: {}, geometries: {} };
  }
}
