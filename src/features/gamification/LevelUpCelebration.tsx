import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { Button, Modal } from "@/components/ui";
import { levelForXp } from "@/features/gamification/rewardMath";
import { useProgress } from "@/store/progress";
import { totalXp } from "@/store/progressData";
import { useSettings } from "@/store/settings";

export function LevelUpCelebration() {
  const xp = useProgress((state) => totalXp(state.progress));
  const level = levelForXp(xp);
  const previousLevel = useRef(level);
  const [celebration, setCelebration] = useState<number>();
  const settingsReducedMotion = useSettings(
    (state) => state.preferences.reducedMotion,
  );
  const systemReducedMotion = useReducedMotion();

  useEffect(() => {
    if (level > previousLevel.current) setCelebration(level);
    if (level < previousLevel.current) setCelebration(undefined);
    previousLevel.current = level;
  }, [level]);

  function close() {
    setCelebration(undefined);
  }

  return (
    <Modal
      open={celebration !== undefined}
      title={`Level ${celebration ?? level} reached`}
      onClose={close}
    >
      {celebration !== undefined &&
        !settingsReducedMotion &&
        !systemReducedMotion && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <i
                key={index}
                style={
                  {
                    "--position": `${7 + index * 6.5}%`,
                    "--delay": `${(index % 5) * 35}ms`,
                    "--rotation": `${index * 37}deg`,
                    "--drift": `${((index % 3) - 1) * 1.35}rem`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      <p>
        You’ve earned {xp} XP. Keep going to reach Level {level + 1}.
      </p>
      <div className="modal-actions">
        <Button onClick={close}>Continue training</Button>
      </div>
    </Modal>
  );
}
