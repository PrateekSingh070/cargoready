import { useEffect, useState } from "react";
import { activeStreak } from "@/features/gamification/streak";
import { useProgress } from "@/store/progress";

export function useTrainingStreak() {
  const streak = useProgress((state) => state.progress.streak);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  return activeStreak(streak, now);
}
