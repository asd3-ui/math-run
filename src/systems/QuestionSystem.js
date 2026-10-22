function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class QuestionSystem {
  next(config) {
    const { ops, max } = config;
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer, text;

    if (op === '+') {
      a = randInt(1, max); b = randInt(1, max); answer = a + b;
      text = `${a} + ${b} = ؟`;
    } else if (op === '-') {
      a = randInt(Math.max(2, Math.floor(max / 2)), max);
      b = randInt(1, a); answer = a - b;
      text = `${a} − ${b} = ؟`;
    } else if (op === '×') {
      a = randInt(2, Math.min(12, max)); b = randInt(2, Math.min(12, max)); answer = a * b;
      text = `${a} × ${b} = ؟`;
    } else {
      b = randInt(2, Math.min(12, max));
      answer = randInt(2, Math.min(12, max));
      a = b * answer;
      text = `${a} ÷ ${b} = ؟`;
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
      const range = Math.max(3, Math.floor(Math.abs(answer) * 0.4) + 2);
      const delta = randInt(1, range) * (Math.random() < 0.5 ? -1 : 1);
      const d = answer + delta;
      if (d !== answer && d >= 0) set.add(d);
    }
    while (set.size < 2) set.add(answer + set.size + 1);
    return [...set];
  }
}
