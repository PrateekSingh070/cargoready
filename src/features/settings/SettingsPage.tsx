import { useState, useSyncExternalStore } from "react";
import { Button, Card, Modal, Toast } from "@/components/ui";
import { textSizes } from "@/store/preferences";
import { useSettings } from "@/store/settings";
import { browserStorage } from "@/store/storage";
import { useProgress } from "@/store/progress";
import { playRewardSound } from "@/features/gamification/sound";

export default function SettingsPage() {
  const preferences = useSettings((state) => state.preferences);
  const setPreference = useSettings((state) => state.setPreference);
  const isPersistent = useSyncExternalStore(
    browserStorage.subscribe,
    browserStorage.isPersistent,
  );
  const hasProgress = useProgress(
    (state) =>
      !!state.progress.lastLesson ||
      Object.keys(state.progress.lessons).length > 0,
  );
  const clearProgress = useProgress((state) => state.reset);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState("");

  function resetProgress() {
    clearProgress();
    setConfirmReset(false);
    setMessage(
      browserStorage.isPersistent()
        ? "Training progress cleared."
        : "Session progress cleared.",
    );
  }

  return (
    <div className="inner-page settings-page">
      <header className="page-heading">
        <h1>Settings</h1>
        <p>Adjust how CargoReady looks and feels on this device.</p>
      </header>
      {!isPersistent && (
        <p className="notice" role="status">
          Browser storage is unavailable. Changes apply for this session.
        </p>
      )}
      <Card className="settings-card" aria-labelledby="appearance-title">
        <h2 id="appearance-title">Appearance</h2>
        <fieldset className="setting-row">
          <legend>Theme</legend>
          <div className="choice-group">
            {(["light", "dark"] as const).map((theme) => (
              <label className="choice" key={theme}>
                <input
                  type="radio"
                  name="theme"
                  checked={preferences.theme === theme}
                  onChange={() => setPreference("theme", theme)}
                />
                <span>{theme}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="setting-row">
          <legend>Text size</legend>
          <div className="choice-group">
            {textSizes.map((size) => (
              <label className="choice" key={size}>
                <input
                  type="radio"
                  name="text-size"
                  checked={preferences.textSize === size}
                  onChange={() => setPreference("textSize", size)}
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>
      <Card className="settings-card" aria-labelledby="motion-and-sound">
        <h2 id="motion-and-sound">Motion and sound</h2>
        <label className="toggle-row">
          <span>
            Reduce motion{" "}
            <small>CargoReady also follows your device’s motion setting.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={preferences.reducedMotion}
            onChange={(event) =>
              setPreference("reducedMotion", event.target.checked)
            }
          />
        </label>
        <label className="toggle-row">
          <span>
            Sound effects <small>Play a short cue when you earn XP.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={preferences.sound}
            onChange={(event) => {
              const enabled = event.target.checked;
              setPreference("sound", enabled);
              if (enabled) void playRewardSound();
            }}
          />
        </label>
      </Card>
      <Card className="settings-card" aria-labelledby="training-data">
        <h2 id="training-data">Training data</h2>
        <p>
          {hasProgress
            ? "Clear training progress for this device."
            : "There is no training progress on this device yet."}
        </p>
        <Button
          variant="danger"
          disabled={!hasProgress}
          onClick={() => setConfirmReset(true)}
        >
          Reset progress
        </Button>
      </Card>
      <Modal
        open={confirmReset}
        title="Reset progress"
        onClose={() => setConfirmReset(false)}
      >
        <p>
          This clears the training progress saved on this device and cannot be
          undone.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={resetProgress}>
            Reset progress
          </Button>
        </div>
      </Modal>
      <Toast message={message} />
    </div>
  );
}
