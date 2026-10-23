import * as THREE from 'three';

const PANEL_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66'];
const FRAME_GEOMETRY = {
  panel: new THREE.PlaneGeometry(2.6, 2.6),
  post: new THREE.BoxGeometry(0.14, 3.55, 0.22),
  innerLight: new THREE.BoxGeometry(0.045, 2.8, 0.035),
  header: new THREE.BoxGeometry(2.98, 0.16, 0.22),
  headerGlow: new THREE.BoxGeometry(2.65, 0.045, 0.04),
  base: new THREE.BoxGeometry(2.75, 0.35, 0.7)
};
const frameMaterials = PANEL_COLORS.map(color => new THREE.MeshStandardMaterial({
  color: new THREE.Color(color), metalness: 0.68, roughness: 0.28,
  emissive: new THREE.Color(color), emissiveIntensity: 0.7
}));
const baseMaterials = PANEL_COLORS.map(color => new THREE.MeshStandardMaterial({
  color: 0x1a1a2e, metalness: 0.5, roughness: 0.34,
  emissive: new THREE.Color(color), emissiveIntensity: 0.4
}));
const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe9f6ff, metalness: 0.82, roughness: 0.22 });

function drawAnswerTexture(canvas, text, bg) {
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  const grd = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,0.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, size - 12, size - 12);
  ctx.fillStyle = '#fff';
  ctx.font = '900 112px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 9;
  const label = String(text);
  if (label.length > 4) ctx.font = '900 82px Arial, sans-serif';
  ctx.fillText(label, size / 2, size / 2 + 3, size - 26);
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
    this.answerCanvases = [];
    this.answerTextures = [];

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      drawAnswerTexture(canvas, answers[i], PANEL_COLORS[i]);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 1;
      this.answerCanvases.push(canvas);
      this.answerTextures.push(texture);

      const material = new THREE.MeshStandardMaterial({
        map: texture, transparent: true, opacity: 0.98,
        emissive: new THREE.Color(PANEL_COLORS[i]), emissiveIntensity: 0.35,
        side: THREE.DoubleSide
      });
      const laneX = (i - 1) * 3;
      const panel = new THREE.Mesh(FRAME_GEOMETRY.panel, material);
      panel.position.set(laneX, 2.4, 0);
      panel.castShadow = false;
      this.group.add(panel);
      this.panels.push(panel);

      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(FRAME_GEOMETRY.post, frameMaterials[i]);
        post.position.set(laneX + side * 1.42, 1.82, -0.04);
        this.group.add(post);
        const innerLight = new THREE.Mesh(FRAME_GEOMETRY.innerLight, trimMaterial);
        innerLight.position.set(laneX + side * 1.31, 2.25, -0.17);
        this.group.add(innerLight);
      }
      const header = new THREE.Mesh(FRAME_GEOMETRY.header, frameMaterials[i]);
      header.position.set(laneX, 3.58, -0.04);
      this.group.add(header);
      const headerGlow = new THREE.Mesh(FRAME_GEOMETRY.headerGlow, trimMaterial);
      headerGlow.position.set(laneX, 3.58, -0.17);
      this.group.add(headerGlow);
      const base = new THREE.Mesh(FRAME_GEOMETRY.base, baseMaterials[i]);
      base.position.set(laneX, 0.175, 0);
      this.group.add(base);
      this.bases.push(base);
    }
    this.group.position.set(0, 0, -120);
    this.group.visible = false;
    scene.add(this.group);
    this.reset(answers, correctIndex);
  }

  reset(answers, correctIndex) {
    this.answers = answers;
    this.correctIndex = correctIndex;
    this.checked = false;
    this.group.position.set(0, 0, -120);
    this.group.visible = true;
    for (let i = 0; i < 3; i++) {
      this.panels[i].visible = true;
      drawAnswerTexture(this.answerCanvases[i], answers[i], PANEL_COLORS[i]);
      this.answerTextures[i].needsUpdate = true;
      this.panels[i].material.emissiveIntensity = 0.35;
      this.bases[i].material.emissiveIntensity = 0.4;
    }
  }

  highlightCorrect() {
    if (this.panels[this.correctIndex]) {
      this.panels[this.correctIndex].material.emissiveIntensity = 1.5;
      if (this.bases[this.correctIndex]) this.bases[this.correctIndex].material.emissiveIntensity = 1.5;
    }
  }

  dispose() {
    this.scene.remove(this.group);
    for (const texture of this.answerTextures) texture.dispose();
    // Shared gate geometry/materials intentionally live for the lifetime of the game.
  }
}
