import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.segmentLength = 20;
    this.segmentCount = 25;
    this.segments = [];
    this.build(0x2b2b40);
  }

  build(groundColor) {
    for (const seg of this.segments) {
      this.scene.remove(seg);
      seg.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.segments = [];

    const roadMat = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.8, metalness: 0.1 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x7c5cff, emissive: 0x7c5cff, emissiveIntensity: 1.0 });

    for (let i = 0; i < this.segmentCount; i++) {
      const seg = new THREE.Group();

      const road = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, this.segmentLength), roadMat);
      road.receiveShadow = true;
      road.position.y = -0.1;
      seg.add(road);

      // خطوط الطريق
      for (const x of [-1.5, 1.5]) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.21, this.segmentLength * 0.4), lineMat);
        line.position.set(x, 0.01, 0);
        seg.add(line);
      }

      // حواف مضيئة
      for (const x of [-4.5, 4.5]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, this.segmentLength), edgeMat);
        edge.position.set(x, 0.05, 0);
        seg.add(edge);
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
