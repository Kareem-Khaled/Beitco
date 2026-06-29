// Notification sound + "play when the unread count rises" hook.
//
// The chime is synthesised with the Web Audio API (a short two-note bell), so
// there's no audio asset to ship and it stays crisp at any volume. A device-level
// mute preference lives in localStorage (notifications can be annoying, so users
// must be able to silence them). Browsers block audio until the user has
// interacted with the page; by the time a notification arrives the user is
// active, so resume() succeeds — and if it's still blocked, it silently no-ops.
import { useEffect, useRef, useState } from "react";

const SOUND_KEY = "beitco:notifSound"; // "on" | "off" (default on)

export function isNotifSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}

export function setNotifSoundOn(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

let sharedCtx: AudioContext | null = null;

export function playNotificationChime(): void {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    sharedCtx ??= new Ctx();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    // Two soft sine notes (G5 → C6): a gentle, recognisable "ding-dong".
    const notes = [
      { f: 783.99, t: 0 },
      { f: 1046.5, t: 0.12 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = n.f;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = now + n.t;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.start(start);
      osc.stop(start + 0.32);
    }
  } catch {
    // Audio blocked/unavailable — non-fatal.
  }
}

// Plays the chime whenever `count` rises above the last observed value for the
// same user. Never fires on first mount or a user switch (re-baselines instead),
// so a page load with existing unread items stays silent.
export function useNotificationSound(
  count: number | undefined,
  userId: string | undefined,
  enabled: boolean,
): void {
  const baseline = useRef<{ userId: string | undefined; count: number } | null>(null);

  useEffect(() => {
    if (count == null || userId == null) return;
    const b = baseline.current;
    if (!b || b.userId !== userId) {
      baseline.current = { userId, count }; // first observation / user switch
      return;
    }
    if (enabled && count > b.count) playNotificationChime();
    baseline.current = { userId, count };
  }, [count, userId, enabled]);
}

// React state wrapper around the localStorage mute flag, for the toggle UI.
export function useNotifSoundPref(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(isNotifSoundOn()), []);
  const update = (next: boolean) => {
    setNotifSoundOn(next);
    setOn(next);
  };
  return [on, update];
}
