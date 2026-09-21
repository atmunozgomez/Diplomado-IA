import React, { useState } from 'react';
import {
  History,
  TrendingDown,
  Calendar,
  Flame,
  Download,
  Trash2,
  Filter,
  CheckCircle,
  Activity,
  Heart,
  Plus
} from 'lucide-react';
import { SessionRecord, HospitalDepartment } from '../types';
import { SessionStats } from '../utils/storage';
import { HOSPITAL_DEPARTMENTS } from '../data/techniques';

interface HistoryViewProps {
  sessions: SessionRecord[];
  stats: SessionStats;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onStartNewPause: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  stats,
  onDeleteSession,
  onClearAll,
  onStartNewPause,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (selectedDeptFilter === 'all') return true;
    return s.department === selectedDeptFilter;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (sessions.length === 0) return;

    const headers = ['ID', 'Fecha', 'Hora', 'Servicio', 'Tecnica', 'DuracionSeg', 'EstresAntes', 'EstresDespues', 'DeltaEstres', 'Sensacion', 'Notas'];
    const rows = sessions.map((s) => [
      s.id,
      s.date.slice(0, 10),
      s.completedAtHour,
      `"${s.department}"`,
      `"${s.techniqueName}"`,
      s.durationSeconds,
      s.stressBefore,
      s.stressAfter,
      s.stressBefore - s.stressAfter,
      `"${s.postFeeling.replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_pausas_hospital_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Metrics & Clinical Shift Progress Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Pauses Today */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hoy</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.todayCount}</span>
            <span className="text-xs text-slate-500">/ 3 meta turno</span>
          </div>
          {/* Progress bar towards daily shift goal of 3 pauses */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min((stats.todayCount / 3) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Total Minutes Mindful */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Minutos</span>
            <Heart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalMinutes}</span>
            <span className="text-xs text-slate-500">min totales</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {stats.totalSessions} pausas registradas
          </p>
        </div>

        {/* Average Stress Reduction */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alivio Tensión</span>
            <TrendingDown className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              -{stats.averageStressReduction}
            </span>
            <span className="text-xs text-slate-500">pts de estrés</span>
          </div>
          <p className="text-[11px] text-sky-700/90 mt-2 font-medium">
            Desescalada neurofisiológica
          </p>
        </div>

        {/* Consecutive Days Streak */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Constancia</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.currentStreakDays}
            </span>
            <span className="text-xs text-slate-500">{stats.currentStreakDays === 1 ? 'día' : 'días'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Hábito saludable en guardia
          </p>
        </div>
      </div>

      {/* Sessions List Header with Filter and Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">Registro de Sesiones Completadas</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historial de pausas de 60 segundos con impacto en nivel de tensión pre y post intervención.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Department */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedDeptFilter}
                aria-label="Filtrar por área o servicio hospitalario"
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">Todos los servicios ({sessions.length})</option>
                {HOSPITAL_DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV Button */}
            {sessions.length > 0 && (
              <button
                id="export-csv-btn"
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                title="Descargar informe para salud ocupacional o auditoría de bienestar"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}

            {/* Clear All */}
            {sessions.length > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Vaciar historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No hay pausas registradas con este filtro</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tómate tu primer minuto de respiración para registrar el alivio de tensión y reiniciar tu enfoque.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartNewPause}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Hacer Pausa de 60s Ahora</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const delta = session.stressBefore - session.stressAfter;
              const dateFormatted = new Date(session.date).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Technique and Service badge */}
                  <div className="space-y-1 sm:max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{session.techniqueName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        {session.department}
                      </span>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <span>•</span>
                        <span>{dateFormatted}, {session.completedAtHour}</span>
                      </span>
                    </div>

                    <p className="text-slate-600 italic">
                      "{session.postFeeling}"
                    </p>

                    {session.notes && (
                      <p className="text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200/60 text-[11px]">
                        <strong>Nota:</strong> {session.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: Stress Delta Badge & Action */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 line-through">{session.stressBefore}/5</span>
                        <span className="font-bold text-slate-800 text-sm">➔ {session.stressAfter}/5</span>
                        {delta > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            -{delta} pts
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-700">
                            Estable
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        60 segundos completados
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
