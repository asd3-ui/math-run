export const LevelConfigs = [
  { id: 1,  name: 'البداية',    ops: ['+'],                 max: 10, target: 8,  speed: 15, sky: 0x87ceeb, ground: 0x2b2b40 },
  { id: 2,  name: 'الجمع',      ops: ['+'],                 max: 20, target: 10, speed: 16, sky: 0x87ceeb, ground: 0x2b2b40 },
  { id: 3,  name: 'الطرح',      ops: ['+', '-'],            max: 15, target: 10, speed: 17, sky: 0x9ad0f5, ground: 0x2b2b40 },
  { id: 4,  name: 'المزج',      ops: ['+', '-'],            max: 25, target: 12, speed: 19, sky: 0xa8c8f0, ground: 0x3a3a55 },
  { id: 5,  name: 'الضرب',      ops: ['×'],                 max: 10, target: 12, speed: 20, sky: 0xf5b8a8, ground: 0x4a3545 },
  { id: 6,  name: 'الجدول',     ops: ['×'],                 max: 12, target: 14, speed: 21, sky: 0xf0a898, ground: 0x4a3545 },
  { id: 7,  name: 'القسمة',     ops: ['÷'],                 max: 12, target: 14, speed: 22, sky: 0xc7a8f5, ground: 0x3a2a55 },
  { id: 8,  name: 'الكل معاً',  ops: ['+', '-', '×', '÷'],  max: 15, target: 16, speed: 24, sky: 0xa8c7f5, ground: 0x2a2a55 },
  { id: 9,  name: 'الخبير',     ops: ['+', '-', '×', '÷'],  max: 20, target: 18, speed: 25, sky: 0x6d5a9e, ground: 0x1a1a3e },
  { id: 10, name: 'البطل',      ops: ['+', '-', '×', '÷'],  max: 25, target: 20, speed: 27, sky: 0x4a3a7e, ground: 0x0f0f2e },
  { id: 11, name: 'الأسطورة',   ops: ['+', '-', '×', '÷'],  max: 30, target: 22, speed: 29, sky: 0x2a1a5e, ground: 0x0a0a2e },
  { id: 12, name: 'الحكيم',     ops: ['+', '-', '×', '÷'],  max: 40, target: 25, speed: 32, sky: 0x1a0a4e, ground: 0x050520 }
];

export const EndlessConfig = {
  id: 999, name: 'لا نهائي',
  ops: ['+', '-', '×', '÷'], max: 20, target: 999, speed: 18,
  sky: 0x87ceeb, ground: 0x2b2b40
};
