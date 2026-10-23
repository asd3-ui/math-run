import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.segmentLength = 20;
    this.segmentCount = 25;
    this.segments = [];
    this.roadTexture = this.createRoadTexture();
    this.build(0x343941);
  }

  createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#343941';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Subtle asphalt grain, generated locally (no remote texture dependency).
    for (let i = 0; i < 6500; i++) {
      const shade = 38 + Math.floor(Math.random() * 48);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * 0.23})`;
      const size = Math.random() * 2 + 0.4;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    texture.anisotropy = 4;
    return texture;
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
      color: groundColor, map: this.roadTexture, roughness: 0.94, metalness: 0.02
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
