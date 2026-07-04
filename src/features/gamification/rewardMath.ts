const xpPerLevel = 100;

export function levelForXp(xp: number) {
  return Math.floor(Math.max(0, xp) / xpPerLevel) + 1;
}

export function levelProgress(xp: number) {
  return { earned: Math.max(0, xp) % xpPerLevel, required: xpPerLevel };
}

export function pointsForQuiz(correctAnswers: readonly boolean[]) {
  let combo = 0;
  return correctAnswers.reduce((xp, correct) => {
    combo = correct ? combo + 1 : 0;
    return (
      xp + (correct ? Math.round(10 * Math.min(2, 1 + (combo - 1) * 0.25)) : 0)
    );
  }, 0);
}
