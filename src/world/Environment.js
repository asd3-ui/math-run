import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.skyColor = new THREE.Color(0x87ceeb);
    scene.background = this.skyColor;
    scene.fog = new THREE.Fog(this.skyColor.getHex(), 90, 240);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0xa8c7ff, 0.5);
    dir2.position.set(-10, 10, -10);
    scene.add(dir2);

    this.props = [];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x0a3a1a, emissiveIntensity: 0.2 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x777788, roughness: 0.9 });

    for (let i = 0; i < 90; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side * (7 + Math.random() * 16);
      const z = -Math.random() * 500;

      let prop;
      if (Math.random() < 0.75) {
        // Tree
        prop = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.2, 8), trunkMat);
        trunk.position.y = 1.1;
        const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), leafMat);
        leaf1.position.y = 3.4;
        const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 8), leafMat);
        leaf2.position.y = 4.8;
        prop.add(trunk, leaf1, leaf2);
      } else {
        // Rock
        prop = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 0.6), rockMat);
        prop.position.y = 0.8;
      }
      prop.position.set(x, 0, z);
      scene.add(prop);
      this.props.push(prop);
    }
  }

  setSky(color) {
    this.skyColor.setHex(color);
    this.scene.background = this.skyColor;
    this.scene.fog.color.setHex(color);
  }

  update(dt, speed) {
    for (const p of this.props) {
      p.position.z += speed * dt;
      if (p.position.z > 25) p.position.z -= 500;
    }
  }
}
