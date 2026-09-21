import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Heart,
  Activity,
  LogOut,
  ThumbsUp,
  Move,
  Wind,
  Layers,
  ShieldCheck,
  Check
} from 'lucide-react';
import { BreathingTechnique, BreathingPhase, HospitalDepartment, SessionRecord, BreathingTechniqueId, TechniqueCategory } from '../types';
import { BREATHING_TECHNIQUES, HOSPITAL_GROUNDING_PROMPTS, HOSPITAL_DEPARTMENTS } from '../data/techniques';
import { playInhaleSound, playExhaleSound, playHoldSound, playCompletionChime } from '../utils/audio';

interface BreathingSessionProps {
  soundEnabled: boolean;
  department: HospitalDepartment;
  onDepartmentChange: (dept: HospitalDepartment) => void;
  onSessionComplete: (sessionData: Omit<SessionRecord, 'id' | 'date' | 'completedAtHour'>) => void;
  onOpenGuidelines: () => void;
}

type SessionState = 'idle' | 'pre_check' | 'active' | 'paused' | 'post_check' | 'completed';

export const BreathingSession: React.FC<BreathingSessionProps> = ({
  soundEnabled,
  department,
  onDepartmentChange,
  onSessionComplete,
  onOpenGuidelines,
}) => {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<BreathingTechniqueId>('stretch_shoulders');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'hybrid_stretch' | 'breathing'>('all');
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [stressBefore, setStressBefore] = useState<number>(3);
  const [stressAfter, setStressAfter] = useState<number>(2);
  const [postFeeling, setPostFeeling] = useState<string>('Hombros y cuello destensados');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [groundingIndex, setGroundingIndex] = useState<number>(0);

  // Active technique details
  const activeTechnique: BreathingTechnique =
    BREATHING_TECHNIQUES.find((t) => t.id === selectedTechniqueId) || BREATHING_TECHNIQUES[0];

  // Filtered techniques based on category tab
  const filteredTechniques = BREATHING_TECHNIQUES.filter((tech) => {
    if (categoryFilter === 'all') return true;
    return tech.category === categoryFilter;
  });

  // Current phase calculation
  const totalElapsed = 60 - remainingSeconds;
  const cycleTime = activeTechnique.cycleDuration;
  const timeInCurrentCycle = totalElapsed % cycleTime;

  // Determine current phase within cycle
  let accumulated = 0;
  let currentPhase: BreathingPhase = activeTechnique.phases[0];
  for (const phase of activeTechnique.phases) {
    if (timeInCurrentCycle >= accumulated && timeInCurrentCycle < accumulated + phase.duration) {
      currentPhase = phase;
      break;
    }
    accumulated += phase.duration;
  }

  // Ref to track phase change for sound cues
  const lastPhaseActionRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);

  // Fire audio tone on phase transitions
  useEffect(() => {
    if (sessionState !== 'active') return;

    if (currentPhase && currentPhase.action !== lastPhaseActionRef.current) {
      lastPhaseActionRef.current = currentPhase.action;
      if (soundEnabled) {
        if (currentPhase.action === 'inhale') {
          playInhaleSound();
        } else if (currentPhase.action === 'exhale') {
          playExhaleSound();
        } else {
          playHoldSound();
        }
      }
    }
  }, [currentPhase, sessionState, soundEnabled]);

  // Rotate hospital grounding advice periodically
  useEffect(() => {
    if (sessionState === 'active') {
      const interval = setInterval(() => {
        setGroundingIndex((prev) => (prev + 1) % HOSPITAL_GROUNDING_PROMPTS.length);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [sessionState]);

  // Main 60-second countdown timer
  useEffect(() => {
    if (sessionState === 'active') {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Finished 60 seconds!
            clearInterval(timerRef.current!);
            handleFinish60Seconds();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState]);

  const handleFinish60Seconds = useCallback(() => {
    if (soundEnabled) {
      playCompletionChime();
    }
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0d9488', '#0284c7', '#38bdf8', '#34d399'],
      });
    } catch {
      // safe fallback
    }
    setSessionState('post_check');
  }, [soundEnabled]);

  const handleStartFlow = () => {
    setRemainingSeconds(60);
    lastPhaseActionRef.current = '';
    setSessionState('pre_check');
  };

  const handleConfirmStart = () => {
    setRemainingSeconds(60);
    lastPhaseActionRef.current = '';
    setSessionState('active');
  };

  const handlePauseResume = () => {
    if (sessionState === 'active') {
      setSessionState('paused');
    } else if (sessionState === 'paused') {
      setSessionState('active');
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingSeconds(60);
    lastPhaseActionRef.current = '';
    setSessionState('idle');
  };

  const handleEmergencyExit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionState('idle');
    setRemainingSeconds(60);
  };

  const handleSaveSession = () => {
    const elapsed = 60 - remainingSeconds;
    const durationToLog = elapsed > 20 ? 60 : elapsed; // count full session if completed

    onSessionComplete({
      durationSeconds: durationToLog,
      techniqueId: activeTechnique.id,
      techniqueName: activeTechnique.name,
      department,
      stressBefore,
      stressAfter,
      postFeeling,
      notes: sessionNotes.trim() || undefined,
    });

    setSessionState('completed');
  };

  // SVG circular progress calculations
  const progressPercent = ((60 - remainingSeconds) / 60) * 100;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  // Scale factor for the breathing orb
  const getOrbScale = () => {
    if (sessionState !== 'active' && sessionState !== 'paused') return 1;
    switch (currentPhase.action) {
      case 'inhale':
        return 1.42;
      case 'hold':
        return 1.38;
      case 'exhale':
        return 0.88;
      case 'rest':
      default:
        return 0.95;
    }
  };

  const getOrbColor = () => {
    switch (currentPhase.action) {
      case 'inhale':
        return 'from-sky-300 via-sky-400 to-blue-500 text-blue-950';
      case 'hold':
        return 'from-blue-300 via-blue-400 to-indigo-500 text-indigo-950';
      case 'exhale':
        return 'from-sky-200 via-sky-300 to-blue-300 text-sky-950';
      case 'rest':
      default:
        return 'from-sky-100 via-slate-100 to-sky-200 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Shift Context Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-700">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Puesto Clínico</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                id="hospital-department-select"
                value={department}
                aria-label="Seleccionar servicio hospitalario"
                onChange={(e) => onDepartmentChange(e.target.value as HospitalDepartment)}
                disabled={sessionState === 'active' || sessionState === 'paused'}
                className="text-sm font-semibold text-slate-800 bg-transparent hover:bg-slate-100/60 rounded px-1.5 py-0.5 border-b border-dashed border-slate-300 cursor-pointer focus:outline-hidden focus:border-sky-600"
              >
                {HOSPITAL_DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            id="clinical-guidelines-btn"
            type="button"
            onClick={onOpenGuidelines}
            className="text-xs font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/70 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Por qué 60s</span>
          </button>

          {sessionState === 'active' && (
            <button
              id="emergency-exit-active-btn"
              type="button"
              onClick={handleEmergencyExit}
              className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 animate-pulse"
              title="Presiona si te llaman por una urgencia médica inmediata"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Código / Salir Urgente</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary 60s Breathing & Stretching Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Technique Picker Tabs (visible when idle) */}
        {sessionState === 'idle' && (
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Elige tu Pausa Activa de 60 Segundos
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ejercicios clínicos rápidos: puedes alternar respiración pura o combinarla con estiramientos fáciles.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({BREATHING_TECHNIQUES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('hybrid_stretch')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'hybrid_stretch'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Respiración + Estiramiento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('breathing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'breathing'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Solo Respiración</span>
                </button>
              </div>
            </div>

            {/* Techniques Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredTechniques.map((tech) => {
                const isSelected = tech.id === selectedTechniqueId;
                const isHybrid = tech.category === 'hybrid_stretch';
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => setSelectedTechniqueId(tech.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white/80 border-slate-200/80 hover:border-sky-300 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      {/* Category Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isHybrid
                              ? 'bg-sky-50 text-sky-700 border border-sky-200/80'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                          }`}
                        >
                          {isHybrid ? (
                            <>
                              <Activity className="w-2.5 h-2.5 text-sky-600" />
                              <span>Físico + Aire</span>
                            </>
                          ) : (
                            <>
                              <Wind className="w-2.5 h-2.5 text-blue-600" />
                              <span>Respiración</span>
                            </>
                          )}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>

                      <span
                        className={`text-xs font-bold block mb-1 leading-snug ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {tech.name}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                        {tech.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-medium truncate max-w-[150px]">
                        🎯 {tech.targetMuscles?.split(',')[0]}
                      </span>
                      <span className="font-semibold text-slate-400">60s</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Breathing & Movement Core Canvas */}
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[460px] relative">
          <AnimatePresence mode="wait">
            {/* STATE 1: IDLE */}
            {sessionState === 'idle' && (
              <motion.div
                key="idle-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="text-center max-w-lg mx-auto space-y-6"
              >
                <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-sky-100/60 animate-ping opacity-25" />
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-sky-50 to-blue-100/80 border border-sky-200/80 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl font-extrabold text-blue-900 tracking-tight">60s</span>
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mt-0.5">
                      {activeTechnique.category === 'hybrid_stretch' ? 'Aire + Estiramiento' : 'Pausa Activa'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                    {activeTechnique.category === 'hybrid_stretch' ? (
                      <>
                        <Activity className="w-3.5 h-3.5 text-sky-600" />
                        <span>Fórmula Combinada: Respiración Diafragmática + Movilidad Fisioterapéutica</span>
                      </>
                    ) : (
                      <>
                        <Wind className="w-3.5 h-3.5 text-blue-600" />
                        <span>Respiración Rítmica Clínica</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {activeTechnique.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                    {activeTechnique.description}
                  </p>

                  {/* Highlights regarding posture and muscle targeting */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-600">
                    {activeTechnique.targetMuscles && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                        <strong>Zona foco:</strong> {activeTechnique.targetMuscles}
                      </span>
                    )}
                    {activeTechnique.postureRecommendation && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                        <strong>Postura:</strong> {activeTechnique.postureRecommendation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="start-pause-btn"
                    type="button"
                    onClick={handleStartFlow}
                    className="w-full sm:w-auto min-w-[260px] px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Iniciar 60 Segundos</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Solo 1 minuto. Puedes pausar o pulsar salida de guardia en caso de emergencia médica.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STATE 2: PRE-CHECK (Instant 1-tap stress check before start) */}
            {sessionState === 'pre_check' && (
              <motion.div
                key="pre-check-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md w-full mx-auto space-y-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6 text-sky-600" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chequeo de Tensión Fisiológica
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ¿Cómo sientes tu nivel de tensión física o estrés mental antes de comenzar?
                  </p>
                </div>

                {/* 1-5 Stress Selector */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { val: 1, label: 'Bajo', color: 'bg-sky-50 text-sky-700 border-sky-300' },
                    { val: 2, label: 'Leve', color: 'bg-blue-50 text-blue-700 border-blue-300' },
                    { val: 3, label: 'Medio', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
                    { val: 4, label: 'Alto', color: 'bg-amber-50 text-amber-700 border-amber-300' },
                    { val: 5, label: 'Límite', color: 'bg-rose-50 text-rose-700 border-rose-300' },
                  ].map((level) => {
                    const isSelected = stressBefore === level.val;
                    return (
                      <button
                        key={level.val}
                        type="button"
                        onClick={() => setStressBefore(level.val)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? `${level.color} ring-2 ring-blue-500 font-bold shadow-xs scale-105`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base font-extrabold">{level.val}</span>
                        <span className="text-[10px]">{level.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    id="confirm-start-pause-btn"
                    type="button"
                    onClick={handleConfirmStart}
                    className="flex-2 py-3 px-6 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Comenzar Pausa (60s)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 3 & 4: ACTIVE & PAUSED */}
            {(sessionState === 'active' || sessionState === 'paused') && (
              <motion.div
                key="active-breathing-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center w-full max-w-xl space-y-6"
              >
                {/* Visualizer Container */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                  {/* SVG Countdown Ring */}
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="stroke-slate-100"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="stroke-sky-500 transition-all duration-1000 ease-linear"
                      strokeWidth="6"
                      strokeDasharray="440"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>

                  {/* Pulsing Breathing Orb */}
                  <motion.div
                    animate={{
                      scale: getOrbScale(),
                    }}
                    transition={{
                      duration: currentPhase.duration,
                      ease: currentPhase.action === 'hold' || currentPhase.action === 'rest' ? 'linear' : 'easeInOut',
                    }}
                    className={`absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br ${getOrbColor()} opacity-90 shadow-xl flex flex-col items-center justify-center text-center p-3 transition-colors duration-700`}
                  >
                    <span className="text-xs font-bold tracking-widest uppercase opacity-85">
                      {currentPhase.name}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight my-0.5">
                      {remainingSeconds}s
                    </span>
                    <span className="text-[10px] font-medium opacity-80 line-clamp-1 max-w-[120px]">
                      {sessionState === 'paused' ? 'Pausado' : currentPhase.action}
                    </span>
                  </motion.div>
                </div>

                {/* Real-time Instructions & Hybrid Physical Stretch Banner */}
                <div className="w-full text-center space-y-3 max-w-lg px-2 min-h-[90px]">
                  {/* Physical movement card (if technique includes stretch) */}
                  {currentPhase.physicalStretch ? (
                    <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 text-left shadow-xs flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider">
                            Movimiento Físico ({currentPhase.name})
                          </span>
                          {currentPhase.stretchTarget && (
                            <span className="text-[10px] font-semibold text-sky-800 bg-white px-2 py-0.5 rounded-md border border-sky-200/80">
                              🎯 {currentPhase.stretchTarget}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {currentPhase.physicalStretch}
                        </p>
                        <p className="text-[11px] text-sky-900/80 mt-1 font-medium">
                          💡 {currentPhase.tip}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-slate-800 tracking-tight">
                        {currentPhase.instruction}
                      </h4>
                      <p className="text-xs text-sky-800 font-medium bg-sky-50/80 px-3 py-1.5 rounded-lg border border-sky-200 inline-block">
                        💡 {currentPhase.tip}
                      </p>
                    </div>
                  )}

                  {/* Posture Recommendation Pill */}
                  {activeTechnique.postureRecommendation && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                      <span>🧍 Postura sugerida:</span>
                      <span className="text-slate-700">{activeTechnique.postureRecommendation}</span>
                    </div>
                  )}
                </div>

                {/* Grounding Reminder (Hospital Context) */}
                <div className="text-center max-w-md px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs flex items-center justify-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="italic">{HOSPITAL_GROUNDING_PROMPTS[groundingIndex]}</span>
                </div>

                {/* Interactive Controls (Pause, Resume, Emergency Exit) */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    id="pause-resume-btn"
                    type="button"
                    onClick={handlePauseResume}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {sessionState === 'active' ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-blue-600" />
                        <span>Reanudar</span>
                      </>
                    )}
                  </button>

                  <button
                    id="reset-session-btn"
                    type="button"
                    onClick={handleReset}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Reiniciar pausa"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    id="emergency-exit-controls-btn"
                    type="button"
                    onClick={handleEmergencyExit}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Llamada de Guardia / Salir</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 5: POST-CHECK & COMPLETION */}
            {sessionState === 'post_check' && (
              <motion.div
                key="post-check-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full mx-auto space-y-5 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-sky-600" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    ¡60 Segundos Completados!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Tu sistema nervioso agradece este minuto de oxigenación y calma.
                  </p>
                </div>

                {/* Post-session stress level */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    ¿Cómo está tu tensión ahora? (Inicial: {stressBefore}/5)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = stressAfter === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setStressAfter(val)}
                          className={`py-2 rounded-lg border text-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xs">{val}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feeling tags */}
                <div className="text-left space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Sensación predominante:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Hombros y cuello destensados',
                      'Músculos más sueltos',
                      'Más sereno y enfocado',
                      'Pulso desacelerado',
                      'Mente despejada',
                      'Espalda descargada',
                      'Listo para el pase de guardia',
                      'Alivio momentáneo',
                    ].map((tag) => {
                      const isSelected = postFeeling === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setPostFeeling(tag)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-sky-100 border-sky-400 text-sky-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional clinical note */}
                <div className="text-left space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nota breve (opcional):
                  </label>
                  <input
                    type="text"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Ej. Tras intubación en box 2; mente centrada."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="save-session-btn"
                    type="button"
                    onClick={handleSaveSession}
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar en Historial y Retomar Guardia</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 6: COMPLETED CONFIRMATION */}
            {sessionState === 'completed' && (
              <motion.div
                key="completed-summary-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-md w-full mx-auto space-y-5 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto border border-sky-100">
                  <ThumbsUp className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pausa Registrada con Éxito
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Has completado 60 segundos de desconexión consciente. Recuerda hidratarte y mantener tu centro.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs text-sky-950 flex items-center justify-between">
                  <span>Reducción de tensión:</span>
                  <span className="font-bold text-sm text-blue-700">
                    {stressBefore} ➔ {stressAfter} ({stressBefore - stressAfter >= 0 ? `-${stressBefore - stressAfter} pts` : 'Estable'})
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Volver a Inicio
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
