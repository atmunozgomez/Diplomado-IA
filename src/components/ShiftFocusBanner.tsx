import React from 'react';
import { Clock, Play, Bell, ShieldCheck } from 'lucide-react';
import { ShiftType } from '../types';

interface ShiftFocusBannerProps {
  shift: ShiftType;
  department: string;
  nextPauseMinutes: number | null;
  todayCount: number;
  onStartPause: () => void;
  onOpenReminders: () => void;
}

export const ShiftFocusBanner: React.FC<ShiftFocusBannerProps> = ({
  department,
  nextPauseMinutes,
  todayCount,
  onStartPause,
  onOpenReminders,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-700 via-sky-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
      {/* Decorative subtle medical pulse line */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-4">
        <svg className="w-64 h-32 text-white stroke-current" viewBox="0 0 300 100" fill="none">
          <path
            d="M0,50 L80,50 L95,15 L115,85 L130,35 L145,65 L160,50 L300,50"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/30 border border-sky-300/40 text-sky-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              <span>{department}</span>
            </span>
            <span className="text-xs text-sky-200">
              Pausas hoy: <strong className="text-white font-bold">{todayCount}</strong> / 3 recomendadas
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
            60 Segundos para Reiniciar tu Enfoque Clínico
          </h2>
          <p className="text-xs text-sky-100/90 leading-relaxed">
            Un minuto de respiración consciente estimula el nervio vago, desacelera la taquicardia por estrés y previene la fatiga cognitiva durante la jornada hospitalaria.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {nextPauseMinutes !== null && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white transition-colors"
              title="Configurar recordatorios"
            >
              <Clock className="w-3.5 h-3.5 text-sky-300" />
              <span>En {nextPauseMinutes}m</span>
              <Bell className="w-3 h-3 text-sky-300 ml-0.5" />
            </button>
          )}

          <button
            id="banner-start-pause-btn"
            type="button"
            onClick={onStartPause}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-sky-300 hover:bg-sky-200 active:bg-sky-400 text-blue-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Pausar 60s Ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
