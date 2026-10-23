import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.segmentLength = 20;
    this.segmentCount = 25;
    this.segments = [];
    this.roadTextures = this.createRoadTextures();
    this.build(0x343941);
  }

  createRoadTextures() {
    const width = this.scene.userData.lowPower ? 128 : 256;
    const height = this.scene.userData.lowPower ? 512 : 1024;
    const albedo = document.createElement('canvas');
    albedo.width = width;
    albedo.height = height;
    const ctx = albedo.getContext('2d', { alpha: false });
    ctx.fillStyle = '#343941';
    ctx.fillRect(0, 0, width, height);

    const heightData = new Uint8Array(width * height);
    for (let i = 0; i < heightData.length; i++) {
      heightData[i] = 90 + Math.floor(Math.random() * 90);
    }
    const image = ctx.createImageData(width, height);
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = width;
    roughCanvas.height = height;
    const roughCtx = roughCanvas.getContext('2d', { alpha: false });
    const roughImage = roughCtx.createImageData(width, height);
    const normalImage = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const noise = heightData[i];
        const grain = Math.random() * 34;
        const shade = Math.max(0, Math.min(255, 43 + (noise - 135) * 0.16 + grain));
        image.data[i * 4] = shade * 0.88;
        image.data[i * 4 + 1] = shade * 0.92;
        image.data[i * 4 + 2] = shade;
        image.data[i * 4 + 3] = 255;

        const rough = 190 + Math.floor(Math.random() * 60);
        roughImage.data[i * 4] = rough;
        roughImage.data[i * 4 + 1] = rough;
        roughImage.data[i * 4 + 2] = rough;
        roughImage.data[i * 4 + 3] = 255;

        const left = heightData[y * width + Math.max(0, x - 1)];
        const right = heightData[y * width + Math.min(width - 1, x + 1)];
        const up = heightData[Math.max(0, y - 1) * width + x];
        const down = heightData[Math.min(height - 1, y + 1) * width + x];
        const nx = (left - right) * 0.65;
        const ny = (up - down) * 0.65;
        const nz = 255;
        const length = Math.hypot(nx, ny, nz) || 1;
        normalImage.data[i * 4] = 128 + (nx / length) * 127;
        normalImage.data[i * 4 + 1] = 128 + (ny / length) * 127;
        normalImage.data[i * 4 + 2] = 128 + (nz / length) * 127;
        normalImage.data[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = width;
    normalCanvas.height = height;
    normalCanvas.getContext('2d', { alpha: false }).putImageData(normalImage, 0, 0);
    roughCtx.putImageData(roughImage, 0, 0);

    const makeTexture = (canvas, color = false) => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 2);
      texture.anisotropy = this.scene.userData.lowPower ? 1 : 4;
      if (color) texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };
    return {
      albedo: makeTexture(albedo, true),
      normal: makeTexture(normalCanvas),
      roughness: makeTexture(roughCanvas)
    };
  }

  build(groundColor) {
    for (const seg of this.segments) {
      this.scene.remove(seg);
      seg.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
    this.segments = [];

    if (this.roadMaterial) this.roadMaterial.dispose();
    if (this.shoulderMaterial) this.shoulderMaterial.dispose();
    if (this.lineMaterial) this.lineMaterial.dispose();
    if (this.edgeMaterial) this.edgeMaterial.dispose();
    if (this.reflectorMaterial) this.reflectorMaterial.dispose();

    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: groundColor, map: this.roadTextures.albedo, normalMap: this.roadTextures.normal, roughnessMap: this.roadTextures.roughness, normalScale: new THREE.Vector2(0.22, 0.22), roughness: 0.94, metalness: 0.02
    });
    this.shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x686b70, roughness: 1 });
    this.lineMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e5d8, roughness: 0.72 });
    this.edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd3d8, metalness: 0.55, roughness: 0.32
    });
    this.reflectorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd56a, emissive: 0x6b3d05, emissiveIntensity: 0.35, roughness: 0.4
    });

    for (let i = 0; i < this.segmentCount; i++) {
      const seg = new THREE.Group();
      const road = new THREE.Mesh(new THREE.BoxGeometry(9, 0.24, this.segmentLength), this.roadMaterial);
      road.receiveShadow = true;
      road.position.y = -0.12;
      seg.add(road);

      for (const side of [-1, 1]) {
        const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.16, this.segmentLength), this.shoulderMaterial);
        shoulder.position.set(side * 5.15, -0.14, 0);
        shoulder.receiveShadow = true;
        seg.add(shoulder);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, this.segmentLength), this.lineMaterial);
        edge.position.set(side * 4.45, 0.015, 0);
        seg.add(edge);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, this.segmentLength), this.edgeMaterial);
        rail.position.set(side * 5.85, 0.18, 0);
        rail.castShadow = true;
        seg.add(rail);

        for (let j = 0; j < 4; j++) {
          const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.5), this.reflectorMaterial);
          reflector.position.set(side * 5.85, 0.43, -this.segmentLength / 2 + 2.5 + j * 5);
          seg.add(reflector);
        }
      }

      // Broken lane markings read more naturally at speed than continuous blocks.
      for (const x of [-1.5, 1.5]) {
        for (let j = 0; j < 3; j++) {
          const line = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 2.4), this.lineMaterial);
          line.position.set(x, 0.015, -this.segmentLength / 2 + 3 + j * 6.2);
          seg.add(line);
        }
      }

      seg.position.z = -i * this.segmentLength;
      this.scene.add(seg);
      this.segments.push(seg);
    }
  }

  setGroundColor(color) {
    this.build(color);
  }

  update(dt, speed) {
    for (const seg of this.segments) {
      seg.position.z += speed * dt;
      if (seg.position.z > this.segmentLength) {
        seg.position.z -= this.segmentLength * this.segmentCount;
      }
    }
  }
}
