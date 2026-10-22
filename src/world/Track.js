import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.segmentLength = 20;
    this.segmentCount = 20;
    this.segments = [];
    this.groundColor = 0x2b2b40;

    this.build();
  }

  build() {
    // Clear
    for (const seg of this.segments) {
      this.scene.remove(seg);
      seg.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.segments = [];

    const roadMat = new THREE.MeshStandardMaterial({ color: this.groundColor, roughness: 0.95 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x7c5cff, emissive: 0x7c5cff, emissiveIntensity: 0.7
    });

    for (let i = 0; i < this.segmentCount; i++) {
      const seg = new THREE.Group();

      const road = new THREE.Mesh(new THREE.PlaneGeometry(9, this.segmentLength), roadMat);
      road.rotation.x = -Math.PI / 2;
      seg.add(road);

      for (const x of [-1.5, 1.5]) {
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, this.segmentLength * 0.55),
          lineMat
        );
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.01, 0);
        seg.add(line);
      }

      for (const x of [-4.55, 4.55]) {
        const edge = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.12, this.segmentLength),
          edgeMat
        );
        edge.position.set(x, 0.06, 0);
        seg.add(edge);
      }

      seg.position.z = -i * this.segmentLength;
      this.scene.add(seg);
      this.segments.push(seg);
    }
  }

  setGroundColor(color) {
    this.groundColor = color;
    this.build();
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
