// 5 عوالم، كل عالم له بيئة مختلفة وعوائق مختلفة
export const Worlds = [
  { 
    id: 1, name: 'السهول الخضراء', 
    skyTop: 0x4a90e2, skyBottom: 0xd8ebff, ground: 0x2ecc71, fog: 0xd8ebff, fogDensity: 0.015,
    lightColor: 0xffffff, ambient: 0x8899aa, obstacleType: 'tree'
  },
  { 
    id: 2, name: 'الصحراء الذهبية', 
    skyTop: 0xffa07a, skyBottom: 0xffe4b5, ground: 0xd4a373, fog: 0xffe4b5, fogDensity: 0.02,
    lightColor: 0xffd700, ambient: 0xaa8855, obstacleType: 'rock'
  },
  { 
    id: 3, name: 'مدينة النيون', 
    skyTop: 0x0a0a2e, skyBottom: 0x1a0a4e, ground: 0x2b2b40, fog: 0x1a0a4e, fogDensity: 0.03,
    lightColor: 0xff00ff, ambient: 0x4400aa, obstacleType: 'neon'
  },
  { 
    id: 4, name: 'الفضاء الخارجي', 
    skyTop: 0x000000, skyBottom: 0x050510, ground: 0x111122, fog: 0x000000, fogDensity: 0.01,
    lightColor: 0x00ffff, ambient: 0x111133, obstacleType: 'asteroid'
  },
  { 
    id: 5, name: 'الجحيم الناري', 
    skyTop: 0x8b0000, skyBottom: 0xff4500, ground: 0x3a1a1a, fog: 0xff4500, fogDensity: 0.04,
    lightColor: 0xff4500, ambient: 0x551100, obstacleType: 'lava'
  }
];

export const LevelConfigs = Array.from({ length: 100 }, (_, i) => {
  const worldIndex = Math.floor(i / 20);
  const world = Worlds[worldIndex];
  const levelInWorld = (i % 20) + 1;
  
  let ops = ['+'];
  if (worldIndex === 0) ops = ['+', '-'];
  else if (worldIndex === 1) ops = ['×', '÷'];
  else if (worldIndex === 2) ops = ['+', '-', '×', '÷'];
  else if (worldIndex === 3) ops = ['×', '÷', '^'];
  else if (worldIndex === 4) ops = ['+', '-', '×', '÷'];

  const maxNumber = 10 + (worldIndex * 15) + Math.floor(levelInWorld / 2);
  const speed = 15 + (worldIndex * 2) + (levelInWorld * 0.2);
  const target = 8 + Math.floor(levelInWorld / 2);

  return {
    id: i + 1,
    name: `المستوى ${i + 1}`,
    worldName: world.name,
    worldId: world.id,
    ops: ops,
    max: maxNumber,
    target: target,
    speed: speed,
    worldData: world // نمرر بيانات البيئة كاملة
  };
});

export const EndlessConfig = {
  id: 999, name: 'لا نهائي', ops: ['+', '-', '×', '÷'], max: 30, target: 999, speed: 20,
  worldId: 3, worldData: Worlds[2]
};
