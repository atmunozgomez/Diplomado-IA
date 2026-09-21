import { ReminderSettings, SessionRecord } from '../types';

const SETTINGS_KEY = 'hospital_active_pause_settings_v1';
const SESSIONS_KEY = 'hospital_active_pause_sessions_v1';

export const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  intervalMinutes: 60,
  useInterval: true,
  useScheduledTimes: false,
  scheduledReminders: [
    { id: '1', time: '10:00', label: 'Pausa Media Mañana', enabled: true, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    { id: '2', time: '14:30', label: 'Cambio de Turno / Tarde', enabled: true, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    { id: '3', time: '18:00', label: 'Pausa Pre-Entrega', enabled: true, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    { id: '4', time: '22:30', label: 'Pausa Guardia Nocturna', enabled: false, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  ],
  soundAlert: true,
  browserNotifications: true,
  shift: 'manana',
  department: 'Urgencias',
  quietInEmergency: true,
};

// Seed records to showcase clinical shift tracking if empty
const SAMPLE_SESSIONS: SessionRecord[] = [
  {
    id: 'seed-1',
    date: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 60,
    techniqueId: 'coherence',
    techniqueName: 'Coherencia Vagal (4 - 6)',
    department: 'Urgencias',
    stressBefore: 4,
    stressAfter: 2,
    postFeeling: 'Desaceleré el pulso tras ingreso complicado',
    notes: 'Pausa tomada en sala de descanso médico tras reanimación.',
    completedAtHour: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'seed-2',
    date: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 60,
    techniqueId: 'box',
    techniqueName: 'Respiración Cuadrada (Box 4-4-4)',
    department: 'Urgencias',
    stressBefore: 5,
    stressAfter: 2,
    postFeeling: 'Claridad para pase de guardia',
    notes: 'Excelente para retomar la concentración.',
    completedAtHour: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      // Seed sample data initially
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(SAMPLE_SESSIONS));
      return SAMPLE_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return SAMPLE_SESSIONS;
  }
}

export function saveSessionRecord(session: Omit<SessionRecord, 'id' | 'date' | 'completedAtHour'>): SessionRecord {
  const now = new Date();
  const newRecord: SessionRecord = {
    ...session,
    id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    date: now.toISOString(),
    completedAtHour: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const current = loadSessions();
  const updated = [newRecord, ...current];
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving session record', e);
  }
  return newRecord;
}

export function deleteSessionRecord(id: string): SessionRecord[] {
  const current = loadSessions();
  const filtered = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting session', e);
  }
  return filtered;
}

export function clearAllSessions(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY);
  } catch (e) {
    console.error('Error clearing sessions', e);
  }
}

export interface SessionStats {
  totalSessions: number;
  totalSeconds: number;
  totalMinutes: number;
  todayCount: number;
  averageStressReduction: number;
  currentStreakDays: number;
}

export function calculateStats(sessions: SessionRecord[]): SessionStats {
  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 60), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.date.slice(0, 10) === todayStr);
  const todayCount = todaySessions.length;

  let totalReduction = 0;
  let validDeltas = 0;
  sessions.forEach((s) => {
    if (typeof s.stressBefore === 'number' && typeof s.stressAfter === 'number') {
      const delta = s.stressBefore - s.stressAfter;
      totalReduction += delta;
      validDeltas++;
    }
  });

  const averageStressReduction = validDeltas > 0 ? parseFloat((totalReduction / validDeltas).toFixed(1)) : 1.5;

  // Streak calculation by consecutive days
  const daySet = new Set(sessions.map((s) => s.date.slice(0, 10)));
  let streak = 0;
  const checkDate = new Date();
  while (true) {
    const dStr = checkDate.toISOString().slice(0, 10);
    if (daySet.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today has no sessions yet, check if yesterday had one to maintain streak
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yStr = checkDate.toISOString().slice(0, 10);
        if (daySet.has(yStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  return {
    totalSessions,
    totalSeconds,
    totalMinutes,
    todayCount,
    averageStressReduction,
    currentStreakDays: streak,
  };
}
