import React from 'react';
import { HeartPulse, Bell, History, Volume2, VolumeX, ShieldAlert, Sparkles } from 'lucide-react';
import { HospitalDepartment, ShiftType } from '../types';

interface HeaderProps {
  activeTab: 'pause' | 'history' | 'reminders';
  setActiveTab: (tab: 'pause' | 'history' | 'reminders') => void;
  department: HospitalDepartment;
  shift: ShiftType;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  nextPauseMinutes: number | null;
  isInSession: boolean;
}

const SHIFT_LABELS: Record<ShiftType, string> = {
  manana: 'Turno Mañana',
  tarde: 'Turno Tarde',
  noche: 'Turno Noche',
  guardia_24h: 'Guardia 24h',
  libre: 'Descanso',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  department,
  shift,
  soundEnabled,
  setSoundEnabled,
  nextPauseMinutes,
  isInSession,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Brand & Hospital Context */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/25 shrink-0">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Regálate un minuto.
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                  <ShieldAlert className="w-3 h-3 text-sky-600" />
                  Salud Laboral
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{department}</span>
                <span>•</span>
                <span className="font-medium text-slate-600">{SHIFT_LABELS[shift]}</span>
                {nextPauseMinutes !== null && nextPauseMinutes > 0 && !isInSession && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                      Próxima en {nextPauseMinutes}m
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Controls & Audio Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Audio Toggle */}
            <button
              id="header-sound-toggle-btn"
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Sonido clínico activado' : 'Modo silencioso para área con pacientes'}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                soundEnabled
                  ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span className="hidden md:inline">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-amber-600" />
                  <span className="hidden md:inline">Silencioso</span>
                </>
              )}
            </button>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="nav-tab-pause"
                type="button"
                onClick={() => setActiveTab('pause')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'pause'
                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Pausa 60s</span>
              </button>

              <button
                id="nav-tab-reminders"
                type="button"
                onClick={() => setActiveTab('reminders')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'reminders'
                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>Recordatorios</span>
              </button>

              <button
                id="nav-tab-history"
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-sky-700" />
                <span>Historial</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
