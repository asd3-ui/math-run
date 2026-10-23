import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
    this.worldId = 1;
    
    // الإضاءة والظلال
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(this.ambientLight);
    
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(30, 50, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.dirLight.shadow.bias = -0.0005;
    scene.add(this.dirLight);

    // ضباب واقعي
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    // مجسمات حقيقية (GLTF)
    this.models = { tree: null, rock: null, neon: null };
    this.loadModels();
  }

  loadModels() {
    const loader = new GLTFLoader();
    // روابط لمجسمات احترافية (شجرة، صخرة، عمود نيون)
    const urls = {
      tree: 'https://threejs.org/examples/models/gltf/Tree.glb',
      rock: 'https://threejs.org/examples/models/gltf/Rock.glb',
      neon: 'https://threejs.org/examples/models/gltf/Neon.glb'
    };

    loader.load(urls.tree, (gltf) => { this.models.tree = gltf.scene; this.populateProps(); });
    loader.load(urls.rock, (gltf) => { this.models.rock = gltf.scene; this.populateProps(); });
  }

  setEnvironment(worldData) {
    this.worldId = worldData.id;
    this.scene.background = new THREE.Color(worldData.skyBottom);
    this.scene.fog.color.setHex(worldData.fog);
    this.scene.fog.density = worldData.fogDensity;
    
    this.ambientLight.color.setHex(worldData.ambient);
    this.dirLight.color.setHex(worldData.lightColor);
    
    this.populateProps();
  }

  populateProps() {
    // مسح القديم
    this.props.forEach(p => {
      this.scene.remove(p);
      // لا نقوم بحذف الـ geometry/material لأنها مشتركة في GLTF
    });
    this.props = [];

    // اختيار المجسم المناسب للبيئة
    let model = this.models.tree;
    if (this.worldId === 2) model = this.models.rock;
    else if (this.worldId === 3) model = this.models.neon;

    if (!model) return; // انتظر التحميل

    for (let i = 0; i < 60; i++) {
      const clone = model.clone();
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side * (8 + Math.random() * 25);
      const z = -Math.random() * 600;
      
      // تكبير/تصغير عشوائي
      const scale = 1 + Math.random() * 1.5;
      clone.scale.set(scale, scale, scale);
      clone.position.set(x, 0, z);
      clone.rotation.y = Math.random() * Math.PI * 2;
      
      clone.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      
      this.scene.add(clone);
      this.props.push(clone);
    }
  }

  update(dt, speed) {
    for (const p of this.props) {
      p.position.z += speed * dt;
      if (p.position.z > 25) p.position.z -= 600;
    }
  }
}
