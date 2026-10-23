import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
    this.currentWorldId = 1;
    
    // إضاءة أساسية
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(20, 40, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    scene.add(this.dirLight);

    // ضباب
    this.scene.fog = new THREE.FogExp2(0xffffff, 0.01);
    
    // سماء متدرجة (Sky Dome)
    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90e2) },
        bottomColor: { value: new THREE.Color(0xd8ebff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    this.sky = new THREE.Mesh(skyGeo, this.skyMat);
    scene.add(this.sky);
  }

  setEnvironment(worldData) {
    this.currentWorldId = worldData.id;
    
    // تحديث الألوان
    this.skyMat.uniforms.topColor.value.setHex(worldData.skyTop);
    this.skyMat.uniforms.bottomColor.value.setHex(worldData.skyBottom);
    this.scene.fog.color.setHex(worldData.fog);
    this.scene.fog.density = worldData.fogDensity;
    
    this.ambientLight.color.setHex(worldData.ambient);
    this.dirLight.color.setHex(worldData.lightColor);

    // مسح العناصر القديمة
    this.props.forEach(p => {
      this.scene.remove(p);
      p.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    });
    this.props = [];

    this.generateProps(worldData.obstacleType);
  }

  generateProps(type) {
    // مواد مختلفة لكل بيئة
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.6 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 1.0 });
    const neonMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2 });
    const spaceMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.9 });
    const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 1.5 });

    for (let i = 0; i < 70; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side * (7 + Math.random() * 20);
      const z = -Math.random() * 600;
      let prop = new THREE.Group();

      if (type === 'tree') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.5), trunkMat);
        trunk.position.y = 1.25; trunk.castShadow = true;
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8 + Math.random()*0.5), leafMat);
        leaf.position.y = 3.5; leaf.castShadow = true;
        prop.add(trunk, leaf);
      } else if (type === 'rock') {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5 + Math.random()*2), rockMat);
        rock.position.y = 0.5; rock.castShadow = true; rock.receiveShadow = true;
        prop.add(rock);
      } else if (type === 'neon') {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6 + Math.random()*4, 0.8), neonMat);
        pillar.position.y = 3; pillar.castShadow = true;
        prop.add(pillar);
      } else if (type === 'asteroid') {
        const ast = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random()*2, 1), spaceMat);
        ast.position.y = 1.5; ast.castShadow = true;
        prop.add(ast);
      } else if (type === 'lava') {
        const lRock = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 5), lavaMat);
        lRock.position.y = 2; lRock.castShadow = true;
        prop.add(lRock);
      }

      prop.position.set(x, 0, z);
      this.scene.add(prop);
      this.props.push(prop);
    }
  }

  update(dt, speed) {
    for (const p of this.props) {
      p.position.z += speed * dt;
      if (p.position.z > 25) p.position.z -= 600;
    }
  }
}
