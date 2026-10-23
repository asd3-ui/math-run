import assert from 'node:assert/strict';
import { Worlds, LevelConfigs, EndlessConfig } from '../src/data/questions.js';
import { Characters } from '../src/data/characters.js';
import { QuestionSystem, calculateCoinReward, chooseWrongLane, evaluateGate } from '../src/systems/QuestionSystem.js';

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

// Exercise actual question generation to catch invalid answer arrays or answer indices.
const questionSystem = new QuestionSystem();
for (const level of LevelConfigs) {
  for (let i = 0; i < 5; i++) {
    const question = questionSystem.next(level);
    assert.equal(question.answers.length, 3, 'Every question must present three answers.');
    assert.equal(new Set(question.answers).size, 3, 'Answer options must be unique.');
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.answers.length);
    assert.equal(question.answers[question.correctIndex], question.answer, 'Correct answer index must match answer value.');
  }
}

console.log('Gameplay regression tests passed: all worlds and levels, generated questions, answer indexing, gate/obstacle outcomes, combo rewards, endless mode, and characters.');

if (process.env.RUN_GAME_E2E === '1') {
  const { spawn } = await import('node:child_process');
  const { chromium } = await import('playwright');
  const server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js', 'preview',
    '--host', '127.0.0.1', '--port', '4173', '--strictPort'
  ], { stdio: 'ignore' });
  let browser;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        const response = await fetch('http://127.0.0.1:4173/');
        if (response.ok) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'Vite preview server must start for the browser gameplay test.');

    browser = await chromium.launch({
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:4173/?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.locator('#btn-play').click();
    await page.waitForFunction(() => {
      const hud = document.querySelector('#hud');
      return hud && !hud.classList.contains('hidden') && document.querySelectorAll('.answer-chip').length === 3;
    }, null, { timeout: 10000 });

    const questionText = await page.locator('#question').innerText();
    const match = questionText.match(/(\\d+)\\s*([+\\-−×÷^])\\s*(\\d+)/);
    assert.ok(match, `Question should contain a supported arithmetic expression: ${questionText}`);
    const a = Number(match[1]);
    const b = Number(match[3]);
    const expected = match[2] === '+' ? a + b
      : match[2] === '-' || match[2] === '−' ? a - b
      : match[2] === '×' ? a * b
      : match[2] === '÷' ? a / b
      : Math.pow(a, b);
    const answers = await page.locator('.answer-chip').allInnerTexts();
    const correctLane = answers.findIndex((answer) => Number(answer.trim()) === expected);
    assert.ok(correctLane >= 0, 'Rendered answer chips must include the mathematically correct answer.');

    const initialCoins = Number(await page.locator('#coins').innerText());
    if (correctLane < 1) await page.keyboard.press('ArrowLeft');
    else if (correctLane > 1) await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('#progress')?.textContent?.startsWith('1/'), null, { timeout: 16000 });
    const earnedCoins = Number(await page.locator('#coins').innerText());
    assert.ok(earnedCoins > initialCoins, 'Passing the correct gate must award coins.');
    assert.deepEqual(pageErrors, [], 'The game must not throw uncaught browser errors during a live round.');
    console.log(`Browser gameplay smoke test passed: correct answer lane ${correctLane}, progress advanced, and coins increased from ${initialCoins} to ${earnedCoins}.`);
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
}
