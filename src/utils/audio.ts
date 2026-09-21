// Therapeutic chime generator using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a soothing sine wave chime with gentle harmonics
 * @param freq Base frequency (Hz)
 * @param duration Tone decay duration in seconds
 * @param volume Master volume (0.0 - 1.0)
 */
export function playGentleTone(freq: number = 440, duration: number = 2.0, volume: number = 0.25): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Master gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // Fundamental oscillator (soothing sine wave)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + duration);

    // Soft subtle harmonic (octave higher, warmer tone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.12 * volume, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.8);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.5, now);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + duration);
  } catch {
    // Ignore audio autoplay blocks gracefully
  }
}

/**
 * Inhale cue: upward gentle glissando or soothing F-major chord
 */
export function playInhaleSound(): void {
  playGentleTone(349.23, 2.5, 0.22); // F4
}

/**
 * Exhale cue: deeper, grounding lower tone (C4)
 */
export function playExhaleSound(): void {
  playGentleTone(261.63, 3.0, 0.22); // C4
}

/**
 * Hold / Transition chime
 */
export function playHoldSound(): void {
  playGentleTone(440, 1.8, 0.18); // A4
}

/**
 * Completed session celebration: warm singing bowl triple chime
 */
export function playCompletionChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5 harmonic chord
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playGentleTone(freq, 3.5, 0.28);
    }, idx * 250);
  });
}

/**
 * Reminder alarm sound (subtle hospital friendly ping, not loud or alarming)
 */
export function playReminderPing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  playGentleTone(587.33, 1.2, 0.35); // D5
  setTimeout(() => {
    playGentleTone(880, 1.5, 0.35); // A5
  }, 180);
}
