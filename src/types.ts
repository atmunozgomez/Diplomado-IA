export type TechniqueCategory = 'breathing' | 'hybrid_stretch';

export type BreathingTechniqueId =
  | 'coherence'
  | 'box'
  | 'relax478'
  | 'stretch_shoulders'
  | 'stretch_cervical'
  | 'stretch_chest'
  | 'stretch_wrists'
  | 'stretch_spine';

export interface BreathingPhase {
  name: string; // 'Inhala' | 'Sostén' | 'Exhala' | 'Pausa' | 'Estira'
  duration: number; // in seconds
  instruction: string;
  tip: string;
  action: 'inhale' | 'hold' | 'exhale' | 'rest' | 'stretch';
  physicalStretch?: string; // Easy bodily movement instruction for this phase
  stretchTarget?: string; // Anatomical area being mobilized
}

export interface BreathingTechnique {
  id: BreathingTechniqueId;
  name: string;
  subtitle: string;
  category: TechniqueCategory;
  description: string;
  clinicalBenefit: string;
  targetMuscles?: string;
  postureRecommendation?: string;
  iconName?: string;
  cycleDuration: number; // Total seconds per cycle
  cyclesNeeded: number; // to reach ~60s
  phases: BreathingPhase[];
}

export type HospitalDepartment = 
  | 'Urgencias' 
  | 'UCI / Críticos' 
  | 'Quirófano' 
  | 'Hospitalización' 
  | 'Pediatría' 
  | 'Consulta Externa' 
  | 'Laboratorio' 
  | 'Farmacia' 
  | 'Enfermería General' 
  | 'General';

export type ShiftType = 'manana' | 'tarde' | 'noche' | 'guardia_24h' | 'libre';

export interface SessionRecord {
  id: string;
  date: string; // ISO string
  durationSeconds: number; // usually 60
  techniqueId: BreathingTechniqueId;
  techniqueName: string;
  department: HospitalDepartment;
  stressBefore: number; // 1-5 scale
  stressAfter: number; // 1-5 scale
  postFeeling: string;
  notes?: string;
  completedAtHour: string;
}

export interface ScheduledReminder {
  id: string;
  time: string; // HH:mm format
  label: string;
  enabled: boolean;
  daysOfWeek: number[]; // 0-6
}

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 60, 90, 120
  useInterval: boolean;
  useScheduledTimes: boolean;
  scheduledReminders: ScheduledReminder[];
  soundAlert: boolean;
  browserNotifications: boolean;
  shift: ShiftType;
  department: HospitalDepartment;
  quietInEmergency: boolean; // Do not disturb if hospital code active
  lastCompletedPause?: string;
  nextScheduledPause?: string;
}
