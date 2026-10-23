import * as THREE from 'three';

export class Obstacle {
  constructor(scene, lane, worldType) {
    this.scene = scene;
    this.lane = lane;
    this.group = new THREE.Group();
    
    let mat, geo;
    
    if (worldType === 'tree') {
      mat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
      geo = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 8);
    } else if (worldType === 'rock') {
      mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 1.0 });
      geo = new THREE.DodecahedronGeometry(1.2);
    } else if (worldType === 'neon') {
      mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.5 });
      geo = new THREE.BoxGeometry(1.5, 2, 1);
    } else if (worldType === 'asteroid') {
      mat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
      geo = new THREE.IcosahedronGeometry(1.3, 1);
    } else {
      mat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 1.5 });
      geo = new THREE.ConeGeometry(1, 2, 6);
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = geo.parameters.height ? geo.parameters.height / 2 : 1.2;
    this.group.add(mesh);

    // إضافة توهج حول العائق
    const glowGeo = new THREE.RingGeometry(1.5, 2, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    this.group.add(glow);

    this.group.position.set((lane - 1) * 3, 0, -120);
    scene.add(this.group);
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
