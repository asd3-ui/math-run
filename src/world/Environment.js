import * as THREE from 'three';

/**
 * Procedural environment: deliberately self-contained so the game does not
 * depend on fragile third-party model URLs or CORS to render its world.
 */
export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
    this.worldId = 1;
    this.elapsed = 0;

    this.hemisphereLight = new THREE.HemisphereLight(0xdcecff, 0x5b5144, 1.35);
    scene.add(this.hemisphereLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff0d7, 2.0);
    this.dirLight.position.set(-18, 32, 18);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.left = -28;
    this.dirLight.shadow.camera.right = 28;
    this.dirLight.shadow.camera.top = 38;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 90;
    this.dirLight.shadow.bias = -0.00025;
    this.dirLight.shadow.normalBias = 0.035;
    scene.add(this.dirLight);

    this.scene.fog = new THREE.FogExp2(0xc6d8e8, 0.012);
    this.sharedGeometries = {};
    this.sharedMaterials = {};
    this.createSharedAssets();
    this.setEnvironment({
      id: 1, skyTop: 0x80b8e8, skyBottom: 0xd7e7f2, ground: 0x59704b,
      fog: 0xc6d8e8, fogDensity: 0.012, lightColor: 0xfff0d7,
      ambient: 0x8da6b5, obstacleType: 'tree'
    });
  }

  createSharedAssets() {
    const geo = this.sharedGeometries;
    geo.trunk = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 7);
    geo.leaf = new THREE.ConeGeometry(1.15, 2.5, 8);
    geo.roundLeaf = new THREE.IcosahedronGeometry(1.15, 1);
    geo.rock = new THREE.IcosahedronGeometry(1.1, 1);
    geo.cactus = new THREE.CylinderGeometry(0.28, 0.34, 2.7, 8);
    geo.tower = new THREE.BoxGeometry(1.6, 1, 1.6);
    geo.crystal = new THREE.OctahedronGeometry(1.2, 0);
    geo.lava = new THREE.ConeGeometry(1.2, 2.4, 6);
    geo.post = new THREE.CylinderGeometry(0.06, 0.08, 1.25, 6);
    geo.bush = new THREE.DodecahedronGeometry(0.55, 0);

    const mat = this.sharedMaterials;
    mat.bark = new THREE.MeshStandardMaterial({ color: 0x63432c, roughness: 0.95 });
    mat.leaf = new THREE.MeshStandardMaterial({ color: 0x2f6540, roughness: 0.88 });
    mat.leafLight = new THREE.MeshStandardMaterial({ color: 0x53854a, roughness: 0.9 });
    mat.sand = new THREE.MeshStandardMaterial({ color: 0xc69a5a, roughness: 1 });
    mat.rock = new THREE.MeshStandardMaterial({ color: 0x777b80, roughness: 0.96 });
    mat.cactus = new THREE.MeshStandardMaterial({ color: 0x3e7955, roughness: 0.9 });
    mat.city = new THREE.MeshStandardMaterial({ color: 0x34445c, roughness: 0.65, metalness: 0.22 });
    mat.window = new THREE.MeshStandardMaterial({ color: 0x91eaff, emissive: 0x2a8cb5, emissiveIntensity: 1.25, roughness: 0.25 });
    mat.crystal = new THREE.MeshStandardMaterial({ color: 0x4eeaff, emissive: 0x087caa, emissiveIntensity: 0.8, metalness: 0.25, roughness: 0.3 });
    mat.lava = new THREE.MeshStandardMaterial({ color: 0x63231d, roughness: 1 });
    mat.glow = new THREE.MeshStandardMaterial({ color: 0xff702b, emissive: 0xff3d0a, emissiveIntensity: 1.5, roughness: 0.45 });
    mat.post = new THREE.MeshStandardMaterial({ color: 0xd7e1e8, metalness: 0.65, roughness: 0.32 });
  }

  setEnvironment(worldData) {
    this.worldId = worldData.id || 1;
    this.worldData = worldData;
    this.scene.background = new THREE.Color(worldData.skyBottom ?? 0xc6d8e8);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(worldData.fog ?? worldData.skyBottom ?? 0xc6d8e8);
      this.scene.fog.density = worldData.fogDensity ?? 0.012;
    }
    this.hemisphereLight.color.setHex(worldData.skyTop ?? 0xdcecff);
    this.hemisphereLight.groundColor.setHex(worldData.ground ?? 0x5b5144);
    this.ambientLight.color.setHex(worldData.ambient ?? 0x8da6b5);
    this.dirLight.color.setHex(worldData.lightColor ?? 0xfff0d7);
    this.dirLight.intensity = this.worldId === 3 || this.worldId === 4 ? 1.45 : 2.0;
    this.dirLight.position.set(this.worldId === 2 ? 16 : -18, 32, 18);
    this.populateProps();
  }

  addMesh(parent, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  makeTree(group, variant) {
    const { trunk, leaf, roundLeaf } = this.sharedGeometries;
    const m = this.sharedMaterials;
    this.addMesh(group, trunk, m.bark, 0, 1.15, 0, 0.85, 1, 0.85);
    if (variant % 2 === 0) {
      this.addMesh(group, leaf, m.leaf, 0, 2.9, 0, 1.25, 1.15, 1.25);
      this.addMesh(group, leaf, m.leafLight, 0, 3.75, 0, 0.82, 0.92, 0.82);
    } else {
      this.addMesh(group, roundLeaf, m.leaf, 0, 3.05, 0, 1.35, 1.15, 1.25);
      this.addMesh(group, roundLeaf, m.leafLight, 0.48, 3.55, 0.1, 0.78, 0.72, 0.78);
    }
  }

  makeDesert(group, variant) {
    const { rock, cactus } = this.sharedGeometries;
    const m = this.sharedMaterials;
    if (variant % 3 === 0) {
      this.addMesh(group, cactus, m.cactus, 0, 1.35, 0);
      this.addMesh(group, cactus, m.cactus, -0.42, 1.65, 0, 0.65, 0.42, 0.65).rotation.z = -0.9;
      this.addMesh(group, cactus, m.cactus, 0.38, 1.95, 0, 0.62, 0.35, 0.62).rotation.z = 0.9;
    } else {
      this.addMesh(group, rock, m.sand, 0, 0.55, 0, 1.1 + Math.random(), 0.55 + Math.random() * 0.45, 0.9);
    }
  }

  makeCity(group, variant) {
    const { tower } = this.sharedGeometries;
    const m = this.sharedMaterials;
    const height = 4 + Math.random() * 12;
    this.addMesh(group, tower, m.city, 0, height / 2, 0, 1.1, height, 1.1);
    for (let row = 0; row < Math.min(5, Math.floor(height / 2)); row++) {
      for (const side of [-1, 1]) {
        this.addMesh(group, this.sharedGeometries.post, m.window, side * 0.46, 1.1 + row * 1.9, 0.82, 1.1, 0.72, 0.5);
      }
    }
    if (variant % 2 === 0) {
      this.addMesh(group, this.sharedGeometries.post, m.window, 0, height + 0.7, 0, 1, 1.4, 1);
    }
  }

  makeSpace(group) {
    const { rock, crystal } = this.sharedGeometries;
    const m = this.sharedMaterials;
    this.addMesh(group, rock, m.rock, 0, 1.8, 0, 1.5, 1.1, 1.25);
    this.addMesh(group, crystal, m.crystal, 0.35, 2.9, 0.15, 0.55, 0.8, 0.55);
  }

  makeVolcanic(group, variant) {
    const { lava, rock } = this.sharedGeometries;
    const m = this.sharedMaterials;
    this.addMesh(group, lava, m.lava, 0, 1.2, 0, 1.1, 1.2, 1);
    this.addMesh(group, rock, m.glow, variant % 2 ? 0.2 : -0.2, 1.2, 0.15, 0.35, 0.22, 0.35);
  }

  populateProps() {
    for (const prop of this.props) this.scene.remove(prop);
    this.props = [];

    const sideCount = this.scene.userData.lowPower ? 18 : 28;
    for (let i = 0; i < sideCount; i++) {
      for (const side of [-1, 1]) {
        const group = new THREE.Group();
        const variant = i + (side > 0 ? 1 : 0);
        if (this.worldId === 1) this.makeTree(group, variant);
        else if (this.worldId === 2) this.makeDesert(group, variant);
        else if (this.worldId === 3) this.makeCity(group, variant);
        else if (this.worldId === 4) this.makeSpace(group);
        else this.makeVolcanic(group, variant);

        group.position.set(side * (7.2 + Math.random() * 13), 0, -i * 22 - Math.random() * 12);
        group.rotation.y = Math.random() * Math.PI * 2;
        const scale = 0.65 + Math.random() * 0.75;
        group.scale.setScalar(scale);
        this.scene.add(group);
        this.props.push(group);

        if (this.worldId === 1 && variant % 2 === 0) {
          const bush = new THREE.Mesh(this.sharedGeometries.bush, this.sharedMaterials.leafLight);
          bush.position.set(group.position.x * 0.86, 0.35, group.position.z - 6);
          bush.scale.setScalar(0.7 + Math.random() * 0.5);
          bush.castShadow = true;
          this.scene.add(bush);
          this.props.push(bush);
        }
      }
    }
  }

  update(dt, speed) {
    this.elapsed += dt;
    for (const prop of this.props) {
      prop.position.z += speed * dt;
      if (prop.position.z > 24) prop.position.z -= 620;
    }
  }
}
