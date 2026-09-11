let audioCtx: AudioContext | null = null;
let alertInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a bright, high-urgency dual-chime for an incoming pickup alert.
 */
export function playAlertChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First Tone: High crisp chime
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now); // A5
  osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.28);

  // Second Tone: Harmonic resolve chime
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1318.51, now + 0.15); // E6
  osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.32); // A6
  gain2.gain.setValueAtTime(0.4, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.55);

  // Vibration for mobile devices
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([250, 80, 250, 80, 350]);
    } catch {}
  }
}

/**
 * Start repeating the alert chime every 1.6 seconds until accepted or dismissed.
 */
export function startAlertLoop() {
  stopAlert();
  playAlertChime();
  alertInterval = setInterval(() => {
    playAlertChime();
  }, 1600);
}

/**
 * Stop any active alert audio loop.
 */
export function stopAlert() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}
