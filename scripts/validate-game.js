import assert from 'node:assert/strict';
import { Worlds, LevelConfigs, EndlessConfig } from '../src/data/questions.js';
import { Characters } from '../src/data/characters.js';

assert.equal(Worlds.length, 5, 'The game must retain all five worlds.');
assert.equal(LevelConfigs.length, 100, 'The game must retain all 100 levels.');
assert.equal(new Set(LevelConfigs.map((level) => level.id)).size, 100, 'Level IDs must be unique.');
assert.ok(LevelConfigs.every((level) => level.worldData && level.ops.length && level.target > 0 && level.speed > 0), 'Every level must have world, math and difficulty data.');
assert.equal(EndlessConfig.id, 999, 'Endless mode ID must remain stable.');
assert.ok(Characters.length >= 6, 'The existing character roster must remain available.');
assert.ok(Characters.some((character) => character.id === 'boy'), 'The default character must remain available.');

console.log('Game data validation passed: 5 worlds, 100 levels, endless mode, and character roster.');
