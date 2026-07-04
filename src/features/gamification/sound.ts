let context: AudioContext | undefined;

/** Play a short cue from a learner-initiated action. */
export async function playRewardSound(levelUp = false) {
  if (typeof AudioContext === "undefined") return;
  try {
    const audio = (context ??= new AudioContext());
    if (audio.state === "suspended") await audio.resume();
    const start = audio.currentTime;
    const notes = levelUp ? [523.25, 659.25, 783.99] : [659.25, 783.99];
    notes.forEach((frequency, index) => {
      const tone = audio.createOscillator();
      const envelope = audio.createGain();
      const onset = start + index * 0.07;
      tone.type = "sine";
      tone.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, onset);
      envelope.gain.linearRampToValueAtTime(0.055, onset + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.001, onset + 0.13);
      tone.connect(envelope).connect(audio.destination);
      tone.start(onset);
      tone.stop(onset + 0.14);
    });
  } catch {
    // Training stays usable when the browser does not allow audio playback.
  }
}
