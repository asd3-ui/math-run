import * as THREE from 'three';

export class Obstacle {
  constructor(scene, lane, worldType) {
    this.scene = scene;
    this.lane = lane;
    this.group = new THREE.Group();
    
    // إذا كان لديك مجسم حقيقي، يمكنك استبدال هذا الكود به
    // لكن هنا نستخدم أشكال هندسية بتصميم أفضل
    let mat, geo;
    if (worldType === 'rock') {
      mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
      geo = new THREE.DodecahedronGeometry(1.5);
    } else if (worldType === 'neon') {
      mat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2 });
      geo = new THREE.BoxGeometry(1.5, 2, 1);
    } else {
      mat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
      geo = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = geo.parameters.height ? geo.parameters.height / 2 : 1.5;
    this.group.add(mesh);

    // إضاءة تحذيرية حول العائق
    const ringGeo = new THREE.RingGeometry(1.5, 2.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.group.add(ring);

    this.group.position.set((lane - 1) * 3, 0, -45); // يظهر قبل البوابة
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
