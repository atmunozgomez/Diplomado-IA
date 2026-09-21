import React from 'react';
import { Bell, Play, X } from 'lucide-react';

interface ReminderToastProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPause: () => void;
  message?: string;
}

export const ReminderToast: React.FC<ReminderToastProps> = ({
  isOpen,
  onClose,
  onStartPause,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] bg-white rounded-2xl p-4 shadow-2xl border-2 border-blue-500 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm animate-bounce">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Pausa Activa Sugerida (60s)
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {message || 'Has alcanzado el intervalo de trabajo recomendado. Tómate 60 segundos de respiración diafragmática para reiniciar tu claridad clínica.'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartPause();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Hacer Pausa Ahora</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Posponer 5 min
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
