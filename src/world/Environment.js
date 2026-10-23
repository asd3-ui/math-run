import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.skyColor = new THREE.Color(0x87ceeb);
    
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(10, 20, 10);
    scene.add(this.dirLight);

    this.props = [];
    this.currentWorldId = 1;
    
    this.scene.fog = new THREE.Fog(this.skyColor.getHex(), 80, 220);
  }

  setEnvironment(skyColor, groundColor, fogColor, worldId = 1) {
    this.skyColor.setHex(skyColor);
    this.scene.background = this.skyColor;
    this.scene.fog.color.setHex(fogColor);
    this.currentWorldId = worldId;

    // مسح العناصر القديمة
    this.props.forEach(p => {
      this.scene.remove(p);
      p.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    });
    this.props = [];

    // إضاءة مختلفة حسب العالم
    if (worldId === 3) { // النيون
      this.ambientLight.color.setHex(0x7c5cff);
      this.dirLight.color.setHex(0xff00ff);
    } else if (worldId === 4) { // الفضاء
      this.ambientLight.color.setHex(0x111133);
      this.dirLight.color.setHex(0x00ffff);
    } else {
      this.ambientLight.color.setHex(0xffffff);
      this.dirLight.color.setHex(0xffffff);
    }

    this.generateProps(worldId);
  }

  generateProps(worldId) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const neonMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2 });
    const spaceMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.5 });
    const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 1 });

    for (let i = 0; i < 80; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side * (8 + Math.random() * 15);
      const z = -Math.random() * 500;
      let prop = new THREE.Group();

      if (worldId === 1) { // سهول: أشجار
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), trunkMat);
        trunk.position.y = 1;
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), leafMat);
        leaf.position.y = 3;
        prop.add(trunk, leaf);
      } else if (worldId === 2) { // صحراء: صخور وأهرامات صغيرة
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random()), rockMat);
        rock.position.y = 0.8;
        prop.add(rock);
      } else if (worldId === 3) { // نيون: أعمدة مضيئة
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 0.5), neonMat);
        pillar.position.y = 2.5;
        prop.add(pillar);
      } else if (worldId === 4) { // فضاء: كواكب صغيرة
        const planet = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random()*2, 16, 16), spaceMat);
        planet.position.y = 1.5;
        prop.add(planet);
      } else if (worldId === 5) { // جحيم: صخور بركانية
        const lavaRock = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 6), lavaMat);
        lavaRock.position.y = 1.2;
        prop.add(lavaRock);
      }

      prop.position.set(x, 0, z);
      this.scene.add(prop);
      this.props.push(prop);
    }
  }

  update(dt, speed) {
    for (const p of this.props) {
      p.position.z += speed * dt;
      // إعادة التدوير
      if (p.position.z > 25) p.position.z -= 500;
    }
  }
}
