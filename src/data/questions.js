// 5 عوالم × 20 مرحلة = 100 مرحلة
export const Worlds = [
  { name: 'السهول الخضراء', sky: 0x87ceeb, ground: 0x2ecc71, fog: 0x87ceeb, id: 1 },
  { name: 'الصحراء الذهبية', sky: 0xf5b8a8, ground: 0xd4a373, fog: 0xf5b8a8, id: 2 },
  { name: 'مدينة النيون', sky: 0x1a0a4e, ground: 0x2b2b40, fog: 0x1a0a4e, id: 3 },
  { name: 'الفضاء الخارجي', sky: 0x050510, ground: 0x111122, fog: 0x050510, id: 4 },
  { name: 'الجحيم الناري', sky: 0xff4500, ground: 0x8b0000, fog: 0xff4500, id: 5 }
];

export const LevelConfigs = Array.from({ length: 100 }, (_, i) => {
  const worldIndex = Math.floor(i / 20); // 0 to 4
  const world = Worlds[worldIndex];
  const levelInWorld = (i % 20) + 1;
  
  // تحديد نوع الأسئلة بناءً على العالم
  let ops = ['+'];
  if (worldIndex === 0) ops = ['+', '-']; // السهول: جمع وطرح
  else if (worldIndex === 1) ops = ['×', '÷']; // الصحراء: ضرب وقسمة
  else if (worldIndex === 2) ops = ['+', '-', '×', '÷']; // المدينة: الكل
  else if (worldIndex === 3) ops = ['×', '÷', '^']; // الفضاء: أسس (سنضيفها)
  else if (worldIndex === 4) ops = ['+', '-', '×', '÷']; // الجحيم: صعوبة عالية

  // زيادة الصعوبة داخل العالم
  const maxNumber = 10 + (worldIndex * 10) + Math.floor(levelInWorld / 2);
  const speed = 16 + (worldIndex * 3) + (levelInWorld * 0.2);
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
    sky: world.sky,
    ground: world.ground,
    fog: world.fog,
    difficulty: worldIndex + 1
  };
});

export const EndlessConfig = {
  id: 999, name: 'لا نهائي',
  ops: ['+', '-', '×', '÷'], max: 30, target: 999, speed: 20,
  sky: 0x050510, ground: 0x111122, fog: 0x050510
};
