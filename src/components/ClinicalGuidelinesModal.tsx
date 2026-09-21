import React from 'react';
import { X, CheckCircle, HeartPulse, Brain, Zap, Clock, ShieldCheck } from 'lucide-react';

interface ClinicalGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalGuidelinesModal: React.FC<ClinicalGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Fundamento Clínico de la Pausa de 60s</h2>
              <p className="text-xs text-slate-500">Protocolo de Micro-Recuperación para Personal Sanitario</p>
            </div>
          </div>
          <button
            id="close-clinical-guidelines-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-600">
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4">
            <h3 className="font-semibold text-sky-950 flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-sky-600" />
              ¿Por qué solo 60 segundos?
            </h3>
            <p className="text-xs text-sky-900/80 leading-relaxed">
              En entornos de alta demanda (urgencias, UCI, quirófano o planta), las pausas largas suelen ser inviables. 
              La evidencia en medicina ocupacional demuestra que <strong>60 segundos de respiración diafragmática consciente</strong> son suficientes para 
              desactivar la rama simpática ("lucha o huida") y restablecer la perfusión cerebral para el razonamiento diagnóstico.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Efectos Fisiológicos Inmediatos
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs mb-1">
                  <Brain className="w-4 h-4 text-blue-600" />
                  Activación Vagal
                </div>
                <p className="text-xs text-slate-600">
                  La exhalación prolongada (6s) estimula el nervio vago, liberando acetilcolina y reduciendo la frecuencia cardíaca de forma refleja.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs mb-1">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Alivio de Sobrecarga Sensorial
                </div>
                <p className="text-xs text-slate-600">
                  Corta el flujo constante de alarmas acústicas y estímulos de pantalla, evitando la fatiga cognitiva por decisión.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Biomechanical Stretches */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Biomedicina del Estiramiento Rápido en Uniforme (60s)
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80">
                <div className="font-semibold text-sky-950 text-xs mb-1">
                  Descompresión Escapulocervical
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Elevar y rotar hombros en coordinación con la exhalación reoxigena el trapecio superior, reduciendo el acúmulo de ácido láctico por tensión postural.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80">
                <div className="font-semibold text-sky-950 text-xs mb-1">
                  Prevención del Síndrome del Túnel Carpiano
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Movilizar flexores y extensores de muñeca previene tendinitis y parestesias frecuentes en enfermería, laboratorio y registro informático.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Momento Recomendado para la Pausa
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Entre pacientes críticos o altas:</strong> Transición limpia de foco clínico sin arrastrar el estrés del caso anterior.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Pre-procedimiento invasivo:</strong> Estabiliza el temblor fino y mejora la concentración antes de una vía, punción o sutura.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Al inicio y fin de la guardia:</strong> Cierre higiénico de la jornada para desconectar antes de volver al hogar.</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-3 text-xs text-slate-700">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <p>
              <strong>Seguridad del Paciente:</strong> Cuidar de tu propia claridad mental reduce los errores de medicación y mejora la empatía clínica.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            id="close-clinical-guidelines-bottom-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
