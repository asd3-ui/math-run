function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class QuestionSystem {
  next(config) {
    const { ops, max } = config;
    let op = ops[Math.floor(Math.random() * ops.length)];
    
    // إذا كان العالم صعباً، لا نعطي جمعاً سهلاً جداً
    if (config.difficulty > 3 && op === '+' && Math.random() < 0.5) {
        op = '×';
    }

    let a, b, answer, text;

    if (op === '+') {
      a = randInt(1, max); b = randInt(1, max); answer = a + b;
      text = `${a} + ${b} = ؟`;
    } else if (op === '-') {
      a = randInt(Math.max(2, Math.floor(max / 2)), max);
      b = randInt(1, a); answer = a - b;
      text = `${a} − ${b} = ؟`;
    } else if (op === '×') {
      a = randInt(2, Math.min(12, Math.ceil(max / 2))); 
      b = randInt(2, Math.min(12, Math.ceil(max / 2))); 
      answer = a * b;
      text = `${a} × ${b} = ؟`;
    } else if (op === '÷') {
      b = randInt(2, Math.min(12, Math.ceil(max / 2)));
      answer = randInt(2, Math.min(12, Math.ceil(max / 2)));
      a = b * answer;
      text = `${a} ÷ ${b} = ؟`;
    } else if (op === '^') {
      a = randInt(2, 5); b = randInt(2, 3); answer = Math.pow(a, b);
      text = `${a} ^ ${b} = ؟`;
    }

    const distractors = this.makeDistractors(answer);
    const answers = [answer, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = answers.indexOf(answer);

    return { text, answer, answers, correctIndex };
  }

  makeDistractors(answer) {
    const set = new Set();
    let guard = 0;
    while (set.size < 2 && guard++ < 80) {
      // ذكاء في توليد الأرقام الخاطئة: قريبة من الإجابة
      const range = Math.max(3, Math.floor(Math.abs(answer) * 0.3) + 2);
      const delta = randInt(1, range) * (Math.random() < 0.5 ? -1 : 1);
      const d = answer + delta;
      if (d !== answer && d >= 0) set.add(d);
    }
    while (set.size < 2) set.add(answer + set.size + 1);
    return [...set];
  }
}

/** Pure gameplay rules shared by the live game and automated tests. */
export function evaluateGate({ playerLane, correctIndex, obstacleLane }) {
  const hitObstacle = Number.isInteger(obstacleLane) && playerLane === obstacleLane;
  const correct = playerLane === correctIndex && !hitObstacle;
  return { correct, hitObstacle, reason: correct ? 'correct' : hitObstacle ? 'obstacle' : 'incorrect' };
}

export function calculateCoinReward(combo) {
  const safeCombo = Math.max(0, Math.floor(Number(combo) || 0));
  return 10 + safeCombo * 5;
}

export function chooseWrongLane(correctIndex, random = Math.random) {
  const lanes = [0, 1, 2].filter((lane) => lane !== correctIndex);
  const index = Math.min(lanes.length - 1, Math.floor(Math.max(0, Math.min(0.999999, random())) * lanes.length));
  return lanes[index];
}
