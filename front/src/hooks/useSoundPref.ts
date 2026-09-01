import { useCallback, useEffect, useRef, useState } from "react";
import { isDesktop } from "../services";
import { unlockAudio } from "../lib/audio";
import { loadSoundPref, saveSoundPref } from "../lib/prefs";

/** Sound on/off preference plus the audio unlock/warm-up. */
export function useSoundPref() {
  // optimistic: assume the saved preference; the unlock on mount confirms/corrects
  const [soundOn, setSoundOn] = useState(() => isDesktop && loadSoundPref());
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  const enable = useCallback(async () => {
    try {
      await unlockAudio();
      setSoundOn(true);
      saveSoundPref(true);
    } catch (err) {
      console.error("audio", err);
      setSoundOn(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (soundOnRef.current) {
      setSoundOn(false);
      saveSoundPref(false);
    } else {
      await enable();
    }
  }, [enable]);

  // On open: if the preference is "on", try to unlock audio automatically
  // (in Electron autoplay is unlocked via webPreferences.autoplayPolicy)
  useEffect(() => {
    if (!isDesktop || !loadSoundPref()) return;
    unlockAudio()
      .then(() => setSoundOn(true))
      .catch(() => setSoundOn(false));
  }, []);

  return { soundOn, toggle, enable };
}
