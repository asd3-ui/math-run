import * as THREE from 'three';

/**
 * Procedural world renderer for five distinct biomes.
 * All geometry and sky textures are generated locally: no fragile remote asset URLs.
 * Keep the scene mobile-aware; distant scenery uses simple meshes and shared materials.
 */
export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
    this.worldId = 1;
    this.elapsed = 0;
    this.backdrop = new THREE.Group();
    this.scene.add(this.backdrop);

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

  addMesh(parent, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, castShadow = false) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  disposeGroup(group) {
    group.traverse((object) => {
      if (object.geometry && !Object.values(this.sharedGeometries).includes(object.geometry)) {
        object.geometry.dispose();
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material && !Object.values(this.sharedMaterials).includes(material)) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
      }
    });
    group.clear();
  }

  createSkyTexture(top, bottom, accent) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#' + top.toString(16).padStart(6, '0'));
    gradient.addColorStop(0.58, '#' + accent.toString(16).padStart(6, '0'));
    gradient.addColorStop(1, '#' + bottom.toString(16).padStart(6, '0'));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  addSky(worldData) {
    const skyTexture = this.createSkyTexture(
      worldData.skyTop ?? 0x4a90e2,
      worldData.skyBottom ?? 0xd8ebff,
      worldData.fog ?? worldData.skyBottom ?? 0xd8ebff
    );
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(430, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide, depthWrite: false, fog: false })
    );
    sky.name = 'procedural-sky-dome';
    this.backdrop.add(sky);
    this.skyDome = sky;
  }

  addMountainRange(side, color, z, height, seed = 0) {
    const points = [];
    const count = 18;
    points.push(new THREE.Vector2(-70, 0));
    for (let i = 0; i <= count; i++) {
      const x = -70 + (140 * i / count);
      const wave = Math.abs(Math.sin((i + seed) * 1.73)) * 0.55 + Math.abs(Math.cos((i + seed) * 0.61)) * 0.45;
      points.push(new THREE.Vector2(x, 2 + wave * height));
    }
    points.push(new THREE.Vector2(70, 0));
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape, 1),
      new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, side: THREE.DoubleSide, fog: true })
    );
    mesh.position.set(side * 10, -1.5, z);
    mesh.scale.set(1, 1, 1);
    mesh.userData.parallax = 0.08;
    this.backdrop.add(mesh);
    return mesh;
  }

  addCloud(x, y, z, scale = 1, tint = 0xffffff) {
    const cloud = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: tint, roughness: 1, flatShading: true });
    const parts = [
      [-1.2, 0, 0, 1.2], [0, 0.35, 0, 1.35], [1.15, 0.05, 0, 0.95], [0.15, -0.18, 0.45, 1.0]
    ];
    for (const [px, py, pz, size] of parts) {
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), material);
      mesh.position.set(px, py, pz);
      cloud.add(mesh);
    }
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    cloud.userData.drift = 0.25 + Math.random() * 0.35;
    this.backdrop.add(cloud);
    this.clouds.push(cloud);
  }

  buildBackdrop(worldData) {
    this.disposeGroup(this.backdrop);
    this.clouds = [];
    this.landmarks = [];
    this.animatedLandmarks = [];
    this.eventLight = null;
    this.addSky(worldData);

    const id = worldData.id || 1;
    const lowPower = Boolean(this.scene.userData.lowPower);
    if (id === 1) {
      const sun = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe8a3, fog: false }));
      sun.position.set(-42, 34, -260);
      sun.userData.eventType = 'sun';
      this.backdrop.add(sun);
      this.animatedLandmarks.push(sun);
      this.addMountainRange(-1, 0x63826f, -300, 26, 1);
      this.addMountainRange(1, 0x3e665b, -390, 38, 4);
      this.addMountainRange(1, 0x9bb8a5, -245, 15, 7);
      for (let i = 0; i < (lowPower ? 4 : 7); i++) this.addCloud(-48 + Math.random() * 96, 24 + Math.random() * 22, -130 - Math.random() * 260, 1.5 + Math.random() * 2.4, 0xf5fbff);
    } else if (id === 2) {
      const dustVortex = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.38, 8, 42),
        new THREE.MeshBasicMaterial({ color: 0xf3c47c, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
      );
      dustVortex.position.set(24, 3.5, -205);
      dustVortex.rotation.x = Math.PI / 2.5;
      dustVortex.userData.eventType = 'dust';
      this.backdrop.add(dustVortex);
      this.animatedLandmarks.push(dustVortex);
      this.addMountainRange(-1, 0xc28e60, -280, 25, 3);
      this.addMountainRange(1, 0xe1b97f, -390, 42, 8);
      this.addMountainRange(1, 0xd4a06e, -225, 14, 2);
      for (let i = 0; i < (lowPower ? 3 : 5); i++) this.addCloud(-44 + Math.random() * 88, 28 + Math.random() * 15, -160 - Math.random() * 230, 1.1 + Math.random() * 2, 0xffedcf);
    } else if (id === 3) {
      const beacon = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(5 + i * 2.2, 0.12, 8, 56),
          new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff3bd4 : 0x30eaff, transparent: true, opacity: 0.78 })
        );
        halo.rotation.x = Math.PI / 2 + i * 0.22;
        halo.rotation.y = i * 0.45;
        beacon.add(halo);
      }
      beacon.position.set(0, 19, -190);
      beacon.userData.eventType = 'beacon';
      this.backdrop.add(beacon);
      this.animatedLandmarks.push(beacon);
      const buildingColors = [0x182544, 0x202b4a, 0x30305c, 0x1b3b52];
      for (let i = 0; i < (lowPower ? 18 : 34); i++) {
        const side = i % 2 ? 1 : -1;
        const height = 12 + Math.random() * 42;
        const width = 3 + Math.random() * 7;
        const building = this.addMesh(
          this.backdrop, new THREE.BoxGeometry(width, height, 7 + Math.random() * 8),
          new THREE.MeshStandardMaterial({ color: buildingColors[i % buildingColors.length], roughness: 0.65, metalness: 0.22, emissive: 0x101a44, emissiveIntensity: 0.18 }),
          side * (18 + Math.random() * 44), height / 2 - 1, -110 - Math.random() * 310, 1, 1, 1
        );
        building.userData.parallax = 0.03;
        if (i % 3 === 0) {
          const strip = this.addMesh(this.backdrop, new THREE.BoxGeometry(0.16, height * 0.72, 0.12),
            new THREE.MeshBasicMaterial({ color: i % 2 ? 0x30eaff : 0xff3bd4 }),
            building.position.x - width * 0.22, height * 0.52, building.position.z - 3.7);
          strip.userData.parallax = 0.03;
        }
      }
    } else if (id === 4) {
      const planetMat = new THREE.MeshStandardMaterial({ color: 0x4d5cb0, roughness: 0.88, metalness: 0.08 });
      const planet = this.addMesh(this.backdrop, new THREE.SphereGeometry(28, 28, 20), planetMat, 42, 35, -260);
      planet.userData.parallax = 0.01;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(39, 1.4, 8, 80), new THREE.MeshStandardMaterial({ color: 0x9a9bd2, roughness: 0.7, metalness: 0.22, side: THREE.DoubleSide }));
      ring.position.copy(planet.position);
      ring.rotation.set(1.05, 0.2, -0.28);
      this.backdrop.add(ring);
      ring.userData.eventType = 'planet-ring';
      this.animatedLandmarks.push(ring);
      ring.userData.parallax = 0.01;
      for (let i = 0; i < (lowPower ? 8 : 15); i++) {
        const rock = this.addMesh(this.backdrop, this.sharedGeometries.rock, this.sharedMaterials.rock,
          (Math.random() - 0.5) * 100, 8 + Math.random() * 42, -90 - Math.random() * 350,
          1.4 + Math.random() * 4, 1 + Math.random() * 3, 1.5 + Math.random() * 4);
        rock.userData.parallax = 0.06;
      }
    } else {
      this.addMountainRange(-1, 0x421b22, -300, 28, 6);
      this.addMountainRange(1, 0x782a1d, -390, 42, 2);
      this.addMountainRange(1, 0x59231e, -235, 16, 9);
      const glow = new THREE.PointLight(0xff4b14, 65, 220, 2);
      glow.position.set(0, 20, -180);
      this.backdrop.add(glow);
      this.eventLight = glow;
      for (let i = 0; i < (lowPower ? 6 : 10); i++) {
        const volcano = this.addMesh(this.backdrop, this.sharedGeometries.lava, this.sharedMaterials.lava,
          (Math.random() - 0.5) * 95, 8 + Math.random() * 12, -110 - Math.random() * 280,
          3 + Math.random() * 5, 4 + Math.random() * 8, 3 + Math.random() * 5);
        volcano.userData.parallax = 0.05;
        const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4b16 });
        const lava = this.addMesh(this.backdrop, new THREE.ConeGeometry(0.55, 4, 7), lavaMat,
          volcano.position.x, volcano.position.y + 5, volcano.position.z - 1);
        lava.userData.parallax = 0.05;
      }
    }
  }

  setEnvironment(worldData) {
    this.worldId = worldData.id || 1;
    this.worldData = worldData;
    this.scene.background = new THREE.Color(worldData.skyBottom ?? 0xc6d8e8);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(worldData.fog ?? worldData.skyBottom ?? 0xc6d8e8);
      this.scene.fog.density = worldData.fogDensity ?? 0.012;
    } else {
      this.scene.fog = new THREE.FogExp2(worldData.fog ?? 0xc6d8e8, worldData.fogDensity ?? 0.012);
    }
    this.hemisphereLight.color.setHex(worldData.skyTop ?? 0xdcecff);
    this.hemisphereLight.groundColor.setHex(worldData.ground ?? 0x5b5144);
    this.ambientLight.color.setHex(worldData.ambient ?? 0x8da6b5);
    this.dirLight.color.setHex(worldData.lightColor ?? 0xfff0d7);
    this.dirLight.intensity = this.worldId === 3 || this.worldId === 4 ? 1.45 : 2.0;
    this.dirLight.position.set(this.worldId === 2 ? 16 : -18, 32, 18);
    this.buildBackdrop(worldData);
    this.populateProps();
  }

  makeTree(group, variant) {
    const { trunk, leaf, roundLeaf } = this.sharedGeometries;
    const m = this.sharedMaterials;
    this.addMesh(group, trunk, m.bark, 0, 1.15, 0, 0.85, 1, 0.85, true);
    if (variant % 2 === 0) {
      this.addMesh(group, leaf, m.leaf, 0, 2.9, 0, 1.25, 1.15, 1.25, true);
      this.addMesh(group, leaf, m.leafLight, 0, 3.75, 0, 0.82, 0.92, 0.82, true);
    } else {
      this.addMesh(group, roundLeaf, m.leaf, 0, 3.05, 0, 1.35, 1.15, 1.25, true);
      this.addMesh(group, roundLeaf, m.leafLight, 0.48, 3.55, 0.1, 0.78, 0.72, 0.78, true);
    }
  }

  makeDesert(group, variant) {
    const { rock, cactus } = this.sharedGeometries;
    const m = this.sharedMaterials;
    if (variant % 3 === 0) {
      this.addMesh(group, cactus, m.cactus, 0, 1.35, 0, 1, 1, 1, true);
      this.addMesh(group, cactus, m.cactus, -0.42, 1.65, 0, 0.65, 0.42, 0.65, true).rotation.z = -0.9;
      this.addMesh(group, cactus, m.cactus, 0.38, 1.95, 0, 0.62, 0.35, 0.62, true).rotation.z = 0.9;
    } else {
      this.addMesh(group, rock, m.sand, 0, 0.55, 0, 1.1 + Math.random(), 0.55 + Math.random() * 0.45, 0.9, true);
    }
  }

  makeCity(group, variant) {
    const { tower } = this.sharedGeometries;
    const m = this.sharedMaterials;
    const height = 4 + Math.random() * 12;
    this.addMesh(group, tower, m.city, 0, height / 2, 0, 1.1, height, 1.1, true);
    for (let row = 0; row < Math.min(5, Math.floor(height / 2)); row++) {
      for (const side of [-1, 1]) {
        this.addMesh(group, this.sharedGeometries.post, m.window, side * 0.46, 1.1 + row * 1.9, 0.82, 1.1, 0.72, 0.5);
      }
    }
    if (variant % 2 === 0) this.addMesh(group, this.sharedGeometries.post, m.window, 0, height + 0.7, 0, 1, 1.4, 1);
  }

  makeSpace(group) {
    const { rock, crystal } = this.sharedGeometries;
    const m = this.sharedMaterials;
    this.addMesh(group, rock, m.rock, 0, 1.8, 0, 1.5, 1.1, 1.25, true);
    this.addMesh(group, crystal, m.crystal, 0.35, 2.9, 0.15, 0.55, 0.8, 0.55, true);
  }

  makeVolcanic(group, variant) {
    const { lava, rock } = this.sharedGeometries;
    const m = this.sharedMaterials;
    this.addMesh(group, lava, m.lava, 0, 1.2, 0, 1.1, 1.2, 1, true);
    this.addMesh(group, rock, m.glow, variant % 2 ? 0.2 : -0.2, 1.2, 0.15, 0.35, 0.22, 0.35);
  }

  populateProps() {
    for (const prop of this.props) {
      this.scene.remove(prop);
      prop.traverse?.((object) => {
        if (object.geometry && !Object.values(this.sharedGeometries).includes(object.geometry)) object.geometry.dispose();
        if (object.material && !Object.values(this.sharedMaterials).includes(object.material)) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
    }
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
          this.scene.add(bush);
          this.props.push(bush);
        }
      }
    }
  }

  update(dt, speed) {
    this.elapsed += dt;
    for (const cloud of this.clouds || []) {
      cloud.position.x += cloud.userData.drift * dt;
      if (cloud.position.x > 70) cloud.position.x = -70;
    }
    for (const object of this.backdrop.children) {
      const parallax = object.userData.parallax || 0;
      if (parallax) {
        object.position.z += speed * dt * parallax;
        if (object.position.z > 30) object.position.z -= 440;
      }
    }
    for (const landmark of this.animatedLandmarks || []) {
      const type = landmark.userData.eventType;
      if (type === 'sun') landmark.scale.setScalar(1 + Math.sin(this.elapsed * 0.7) * 0.025);
      else if (type === 'dust') {
        landmark.rotation.z += dt * 0.75;
        landmark.scale.y = 0.8 + Math.sin(this.elapsed * 2.2) * 0.18;
      } else if (type === 'beacon') {
        landmark.rotation.y += dt * 0.22;
        landmark.rotation.z = Math.sin(this.elapsed * 0.45) * 0.08;
      } else if (type === 'planet-ring') landmark.rotation.z += dt * 0.035;
    }
    if (this.eventLight) this.eventLight.intensity = 55 + (Math.sin(this.elapsed * 3.1) + 1) * 9;

    for (const prop of this.props) {
      prop.position.z += speed * dt;
      if (prop.position.z > 24) prop.position.z -= 620;
    }
  }

  dispose() {
    for (const prop of this.props) this.scene.remove(prop);
    this.props = [];
    this.disposeGroup(this.backdrop);
    this.scene.remove(this.backdrop);
    for (const geometry of Object.values(this.sharedGeometries)) geometry.dispose();
    for (const material of Object.values(this.sharedMaterials)) material.dispose();
  }
}
