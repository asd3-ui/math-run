/**
 * Pure rules shared by gameplay and automated regression tests.
 * Keep these decisions independent of rendering, audio, and timers.
 */
export function evaluateGate({ playerLane, correctIndex, obstacleLane }) {
  const hitObstacle = Number.isInteger(obstacleLane) && playerLane === obstacleLane;
  const correct = playerLane === correctIndex && !hitObstacle;
  return {
    correct,
    hitObstacle,
    reason: correct ? 'correct' : hitObstacle ? 'obstacle' : 'incorrect'
  };
}

export function calculateCoinReward(combo) {
  const safeCombo = Math.max(0, Math.floor(Number(combo) || 0));
  return 10 + safeCombo * 5;
}

export function chooseWrongLane(correctIndex, random = Math.random) {
  const lanes = [0, 1, 2].filter((lane) => lane !== correctIndex);
  return lanes[Math.min(lanes.length - 1, Math.floor(Math.max(0, Math.min(0.999999, random())) * lanes.length))];
}
