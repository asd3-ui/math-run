import assert from 'node:assert/strict';
import { Worlds, LevelConfigs, EndlessConfig } from '../src/data/questions.js';
import { Characters } from '../src/data/characters.js';
import { calculateCoinReward, chooseWrongLane, evaluateGate } from '../src/systems/RunRules.js';

assert.equal(Worlds.length, 5, 'The game must retain all five worlds.');
assert.equal(LevelConfigs.length, 100, 'The game must retain all 100 levels.');
assert.equal(new Set(LevelConfigs.map((level) => level.id)).size, 100, 'Level IDs must be unique.');
assert.ok(LevelConfigs.every((level) => level.worldData && level.ops.length && level.target > 0 && level.speed > 0), 'Every level must have world, math and difficulty data.');
assert.equal(EndlessConfig.id, 999, 'Endless mode ID must remain stable.');
assert.ok(Characters.length >= 6, 'The existing character roster must remain available.');
assert.ok(Characters.some((character) => character.id === 'boy'), 'The default character must remain available.');

// Every possible correct lane gets an obstacle in a different lane.
for (let correctIndex = 0; correctIndex < 3; correctIndex++) {
  for (const randomValue of [0, 0.25, 0.5, 0.75, 0.999]) {
    const obstacleLane = chooseWrongLane(correctIndex, () => randomValue);
    assert.notEqual(obstacleLane, correctIndex, 'Obstacle must never block the correct answer.');
    assert.equal(evaluateGate({ playerLane: correctIndex, correctIndex, obstacleLane }).correct, true);
    assert.equal(evaluateGate({ playerLane: obstacleLane, correctIndex, obstacleLane }).reason, 'obstacle');
    const otherWrongLane = [0, 1, 2].find((lane) => lane !== correctIndex && lane !== obstacleLane);
    assert.equal(evaluateGate({ playerLane: otherWrongLane, correctIndex, obstacleLane }).reason, 'incorrect');
  }
}
assert.equal(calculateCoinReward(0), 10, 'Base reward must be 10 coins.');
assert.equal(calculateCoinReward(1), 15, 'First combo reward must be 15 coins.');
assert.equal(calculateCoinReward(5), 35, 'Combo reward must scale consistently.');
assert.equal(calculateCoinReward(-5), 10, 'Negative combos must not reduce the base reward.');

console.log('Gameplay regression tests passed: 5 worlds, 100 levels, gates, obstacle lanes, combo rewards, endless mode, and characters.');
