import * as THREE from 'three';

const PANEL_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66'];

function makeTextTexture(text, bg) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Rounded background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Inner shading
  const grd = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,0.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 20;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 230px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText(String(text), size / 2, size / 2 + 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export class Gate {
  constructor(scene, answers, correctIndex) {
    this.scene = scene;
    this.correctIndex = correctIndex;
    this.answers = answers;
    this.checked = false;

    this.group = new THREE.Group();
    this.panels = [];
    this.bases = [];

    for (let i = 0; i < 3; i++) {
      const colorHex = PANEL_COLORS[i];
      const tex = makeTextTexture(answers[i], colorHex);

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        opacity: 0.95,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide
      });

      const laneX = (i - 1) * 3;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), mat);
      panel.position.set(laneX, 2.4, 0);
      panel.castShadow = true;
      this.group.add(panel);
      this.panels.push(panel);

      // Three dimensional answer portal: metallic frame, luminous rails and a heavy base.
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex), metalness: 0.68, roughness: 0.28,
        emissive: new THREE.Color(colorHex), emissiveIntensity: 0.7
      });
      const trimMaterial = new THREE.MeshStandardMaterial({
        color: 0xe9f6ff, metalness: 0.82, roughness: 0.22
      });
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.55, 0.22), frameMaterial);
        post.position.set(laneX + side * 1.42, 1.82, -0.04);
        post.castShadow = true;
        this.group.add(post);
        const innerLight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.8, 0.035), trimMaterial);
        innerLight.position.set(laneX + side * 1.31, 2.25, -0.17);
        this.group.add(innerLight);
      }
      const header = new THREE.Mesh(new THREE.BoxGeometry(2.98, 0.16, 0.22), frameMaterial);
      header.position.set(laneX, 3.58, -0.04);
      header.castShadow = true;
      this.group.add(header);
      const headerGlow = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.045, 0.04), trimMaterial);
      headerGlow.position.set(laneX, 3.58, -0.17);
      this.group.add(headerGlow);

      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e, metalness: 0.5, roughness: 0.34,
        emissive: new THREE.Color(colorHex), emissiveIntensity: 0.4
      });
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.35, 0.7), baseMat);
      base.position.set(laneX, 0.175, 0);
      base.castShadow = true;
      this.group.add(base);
      this.bases.push(base);
    }

    this.group.position.set(0, 0, -120);
    scene.add(this.group);
  }

  highlightCorrect() {
    if (this.panels[this.correctIndex]) {
      this.panels[this.correctIndex].material.emissiveIntensity = 1.5;
      if (this.bases[this.correctIndex]) {
        this.bases[this.correctIndex].material.emissiveIntensity = 1.5;
      }
    }
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
