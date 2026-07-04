import { Icon } from "@/components/Icon";
import { Card, ProgressBar } from "@/components/ui";
import type { Course } from "@/content/schema";
import { evaluateBadges } from "@/features/gamification/badgeRules";
import { levelForXp, levelProgress } from "@/features/gamification/rewardMath";
import { useTrainingStreak } from "@/features/gamification/useTrainingStreak";
import { totalXp, type TrainingProgress } from "@/store/progressData";

export function RewardsPanel({
  course,
  progress,
}: {
  course: Course;
  progress: TrainingProgress;
}) {
  const xp = totalXp(progress);
  const level = levelForXp(xp);
  const next = levelProgress(xp);
  const streak = useTrainingStreak();
  const badges = evaluateBadges(course, progress);
  return (
    <Card className="rewards-panel" aria-labelledby="rewards-title">
      <h2 id="rewards-title">Training rewards</h2>
      <div className="reward-metrics">
        <p>
          <strong>Level {level}</strong> · {xp} XP
        </p>
        <p>
          {streak} {streak === 1 ? "day" : "days"} in a row
        </p>
      </div>
      <ProgressBar
        label="XP toward next level"
        value={next.earned}
        max={next.required}
      />
      <p className="next-level">
        {next.required - next.earned} XP to Level {level + 1}
      </p>
      <h3>
        Badges · {badges.filter((badge) => badge.earned).length} of{" "}
        {badges.length} earned
      </h3>
      <ul className="reward-badges">
        {badges.map((badge) => (
          <li key={badge.id} data-earned={badge.earned}>
            <Icon name={badge.earned ? "check" : "lock"} />
            <div>
              <strong>{badge.name}</strong>
              <span className="sr-only">
                {" "}
                {badge.earned ? "Earned" : "Locked"}
              </span>
              <p>{badge.criteria}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
