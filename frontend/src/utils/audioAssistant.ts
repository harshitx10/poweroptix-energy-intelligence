// PowerOptix - Smart Audio Alert & Voice Feedback System

export type AudioPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const STORAGE_KEY = 'poweroptix_audio_enabled';
const EVENT_COOLDOWN_MS = 2500;

let lastSpokenEventId: string | null = null;
let lastSpokenTimestamp = 0;

/**
 * Checks if Audio Assistant is enabled in localStorage
 */
export const isAudioAssistantEnabled = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

/**
 * Enable or disable Audio Assistant. Returns actual state.
 */
export const setAudioAssistantEnabled = (enabled: boolean): boolean => {
  if (enabled) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Audio assistance is not supported in this browser.');
      localStorage.setItem(STORAGE_KEY, 'false');
      return false;
    }
    localStorage.setItem(STORAGE_KEY, 'true');
    speakPowerOptix('Audio assistant enabled.', 'LOW', 'audio_toggle_on', 'success');
    return true;
  } else {
    localStorage.setItem(STORAGE_KEY, 'false');
    stopPowerOptixSpeech();
    return false;
  }
};

/**
 * Synthesizes subtle UI chime tones using Web Audio API (zero external audio file dependencies)
 */
export const playUiSound = (type: 'success' | 'warning' | 'critical') => {
  if (!isAudioAssistantEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      // Pleasant 2-tone chime: C5 (523Hz) -> E5 (659Hz)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } else if (type === 'warning') {
      // Soft warning 2-tone: A4 (440Hz) -> F4 (349Hz)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'critical') {
      // Triple alert pulse
      const now = ctx.currentTime;
      [0, 0.14, 0.28].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(783.99, now + delay);
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      });
    }
  } catch (err) {
    // Fail silently
  }
};

/**
 * Stops any current speech utterance immediately
 */
export const stopPowerOptixSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Main speech synthesis engine for PowerOptix with priority queuing and anti-spam protection
 */
export const speakPowerOptix = (
  message: string,
  priority: AudioPriority = 'MEDIUM',
  eventId?: string,
  soundType?: 'success' | 'warning' | 'critical'
) => {
  if (!isAudioAssistantEnabled()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const now = Date.now();

  // 1. Anti-spam check by eventId (prevent identical events within 15 seconds)
  if (eventId) {
    if (lastSpokenEventId === eventId && now - lastSpokenTimestamp < 15000) {
      return;
    }
  }

  // 2. Cooldown check for LOW and MEDIUM priority messages
  if (priority === 'LOW' || priority === 'MEDIUM') {
    if (now - lastSpokenTimestamp < EVENT_COOLDOWN_MS) {
      return;
    }
  }

  // 3. Play sound chime effect
  if (soundType) {
    playUiSound(soundType);
  } else if (priority === 'HIGH' || priority === 'CRITICAL') {
    playUiSound(priority === 'CRITICAL' ? 'critical' : 'warning');
  } else if (priority === 'MEDIUM') {
    playUiSound('success');
  }

  // 4. Perform Speech Synthesis
  try {
    if (priority === 'HIGH' || priority === 'CRITICAL') {
      window.speechSynthesis.cancel(); // Interrupt lower-priority speech
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Select preferred clear English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Default'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    lastSpokenEventId = eventId || message;
    lastSpokenTimestamp = now;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    // Fail silently
  }
};

/**
 * 3-Level Smart Audio Intelligence Evaluator
 * 🟢 GREEN (SUCCESS) | 🟡 YELLOW (WARNING) | 🔴 RED (CRITICAL)
 */
export interface AudioEventContext {
  todayVsAvgPct?: number;
  isOverBudget?: boolean;
  anomalyCount?: number;
  peakRiskStatus?: string;
  coincidentPeakKw?: number;
  monthlySaving?: number;
  efficiencyScore?: number;
}

export const evaluateEnergyAudioEvents = (ctx: AudioEventContext) => {
  if (!isAudioAssistantEnabled()) return;

  // 1. RED — CRITICAL (Highest Priority)
  if (ctx.anomalyCount && ctx.anomalyCount > 0) {
    speakPowerOptix(
      'Attention. An unusual energy consumption pattern has been detected.',
      'CRITICAL',
      `evt_critical_anomaly_${ctx.anomalyCount}`,
      'critical'
    );
    return;
  }

  if (ctx.peakRiskStatus && (ctx.peakRiskStatus.toLowerCase().includes('high') || (ctx.coincidentPeakKw && ctx.coincidentPeakKw > 3.5))) {
    speakPowerOptix(
      'Attention. A high energy demand peak has been detected.',
      'CRITICAL',
      `evt_critical_peak_${ctx.peakRiskStatus}`,
      'critical'
    );
    return;
  }

  // 2. YELLOW — WARNING (Medium-High Priority)
  if (ctx.todayVsAvgPct !== undefined && ctx.todayVsAvgPct >= 10.0) {
    const pct = Math.round(ctx.todayVsAvgPct);
    speakPowerOptix(
      `Warning. Today's energy consumption is approximately ${pct} percent above your daily average.`,
      'HIGH',
      `evt_warning_high_usage_${pct}`,
      'warning'
    );
    return;
  }

  // 3. GREEN — GOOD / SUCCESS (Medium Priority)
  if (ctx.monthlySaving && ctx.monthlySaving > 0) {
    const saved = Math.round(ctx.monthlySaving);
    speakPowerOptix(
      `Good news. Your optimized energy plan can save approximately ${saved} rupees.`,
      'MEDIUM',
      `evt_success_savings_${saved}`,
      'success'
    );
    return;
  }

  if (ctx.efficiencyScore && ctx.efficiencyScore >= 85) {
    speakPowerOptix(
      'Congratulations. Your energy-saving goal has been achieved.',
      'MEDIUM',
      `evt_success_goal_${Math.round(ctx.efficiencyScore)}`,
      'success'
    );
    return;
  }
};
