import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Shield,
  CalendarCheck
} from 'lucide-react';
import { ReminderSettings, ShiftType, ScheduledReminder } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendPauseNotification,
} from '../utils/notifications';
import { playReminderPing } from '../utils/audio';

interface NotificationSettingsProps {
  settings: ReminderSettings;
  onSaveSettings: (settings: ReminderSettings) => void;
  nextScheduledTime: string | null;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSaveSettings,
  nextScheduledTime,
}) => {
  const [localSettings, setLocalSettings] = useState<ReminderSettings>(settings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(getNotificationPermission());
  const [testSent, setTestSent] = useState<boolean>(false);
  const [newReminderTime, setNewReminderTime] = useState<string>('12:00');
  const [newReminderLabel, setNewReminderLabel] = useState<string>('Pausa Almuerzo / Pase');

  const supported = isNotificationSupported();

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      const updated = { ...localSettings, browserNotifications: true };
      setLocalSettings(updated);
      onSaveSettings(updated);
    }
  };

  const handleTestNotification = () => {
    if (localSettings.soundAlert) {
      playReminderPing();
    }
    const success = sendPauseNotification(
      '🏥 Pausa Activa Hospitalaria de Prueba',
      '¡Tu recordatorio funciona correctamente! Tómate 60 segundos de respiración en tu turno.'
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
    if (!success && permissionStatus !== 'granted') {
      // Prompt permission
      handleRequestPermission();
    }
  };

  const updateSetting = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleToggleScheduled = (id: string) => {
    const updatedList = localSettings.scheduledReminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    updateSetting('scheduledReminders', updatedList);
  };

  const handleDeleteScheduled = (id: string) => {
    const updatedList = localSettings.scheduledReminders.filter((r) => r.id !== id);
    updateSetting('scheduledReminders', updatedList);
  };

  const handleAddScheduled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTime) return;

    const newReminder: ScheduledReminder = {
      id: 'rem-' + Date.now(),
      time: newReminderTime,
      label: newReminderLabel || 'Pausa Programada',
      enabled: true,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    };

    const updatedList = [...localSettings.scheduledReminders, newReminder].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
    updateSetting('scheduledReminders', updatedList);
    setNewReminderLabel('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Quick Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Recordatorios Programables de Guardia</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Programa alertas automáticas durante tu turno para garantizar que no olvides tomar tu minuto de descompresión física y mental.
          </p>
        </div>

        {/* Master Active Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <label className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            {localSettings.enabled ? 'Sistema Activo' : 'Pausado'}
          </label>
          <button
            id="toggle-master-reminders-btn"
            type="button"
            onClick={() => updateSetting('enabled', !localSettings.enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              localSettings.enabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                localSettings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Browser Notification Permission Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              permissionStatus === 'granted' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {permissionStatus === 'granted' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notificaciones del Navegador
              </h3>
              <p className="text-xs text-slate-500">
                {permissionStatus === 'granted'
                  ? 'Permisos concedidos. Recibirás avisos incluso si minimizas la pestaña o revisas la historia clínica electrónica.'
                  : !supported
                  ? 'Tu navegador actual no soporta notificaciones de escritorio, pero sonará la alerta acústica.'
                  : 'Requiere permiso para notificarte en segundo plano durante tu turno.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permissionStatus !== 'granted' && supported && (
              <button
                id="request-notification-permission-btn"
                type="button"
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Permitir Notificaciones
              </button>
            )}

            <button
              id="test-notification-btn"
              type="button"
              onClick={handleTestNotification}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>{testSent ? '¡Aviso Enviado!' : 'Probar Notificación'}</span>
            </button>
          </div>
        </div>

        {nextScheduledTime && localSettings.enabled && (
          <div className="p-3 bg-sky-50/80 border border-sky-200/80 rounded-xl flex items-center justify-between text-xs text-sky-950">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Próxima pausa programada:</span>
            </span>
            <span className="font-bold text-sky-900 bg-white px-2.5 py-1 rounded-md border border-sky-200">
              {nextScheduledTime}
            </span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Interval Reminders Setting */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Pausa por Intervalo Fijo</h3>
            </div>
            <input
              type="checkbox"
              id="checkbox-use-interval"
              checked={localSettings.useInterval}
              onChange={(e) => updateSetting('useInterval', e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <p className="text-xs text-slate-500">
            Recibe un recordatorio automático cada determinado número de minutos de trabajo continuo.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Frecuencia:</label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map((mins) => {
                const isSelected = localSettings.intervalMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => updateSetting('intervalMinutes', mins)}
                    disabled={!localSettings.useInterval}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected && localSettings.useInterval
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-xs font-semibold text-slate-700">Turno de Trabajo Asignado:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'manana', label: 'Mañana (07:00 - 15:00)' },
                { id: 'tarde', label: 'Tarde (15:00 - 23:00)' },
                { id: 'noche', label: 'Noche (23:00 - 07:00)' },
                { id: 'guardia_24h', label: 'Guardia Médica 24h' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => updateSetting('shift', s.id as ShiftType)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    localSettings.shift === s.id
                      ? 'border-blue-500 bg-sky-50/80 text-blue-950 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduled Fixed Times */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Horarios Fijos Programados</h3>
            </div>
            <input
              type="checkbox"
              id="checkbox-use-scheduled"
              checked={localSettings.useScheduledTimes}
              onChange={(e) => updateSetting('useScheduledTimes', e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <p className="text-xs text-slate-500">
            Fija momentos clave de tu jornada (antes del pase de guardia, tras cirugías programadas, etc.).
          </p>

          {/* Add custom alarm time form */}
          <form onSubmit={handleAddScheduled} className="flex gap-2 items-center">
            <input
              type="time"
              value={newReminderTime}
              aria-label="Hora del recordatorio"
              onChange={(e) => setNewReminderTime(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono"
              required
            />
            <input
              type="text"
              value={newReminderLabel}
              onChange={(e) => setNewReminderLabel(e.target.value)}
              placeholder="Motivo (ej. Cambio turno)"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 flex-1"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Añadir horario"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Reminders List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {localSettings.scheduledReminders.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                No hay horarios programados aún.
              </p>
            ) : (
              localSettings.scheduledReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleScheduled(reminder.id)}
                      className={`w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center cursor-pointer ${
                        reminder.enabled ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {reminder.enabled && <CheckCircle className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div>
                      <span className="font-mono font-bold text-slate-800 mr-2">{reminder.time}</span>
                      <span className="text-slate-600">{reminder.label}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteScheduled(reminder.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                    title="Eliminar horario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Safety and Sound Preferences */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Preferencias de Seguridad y Audio Clínico
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={localSettings.soundAlert}
              onChange={(e) => updateSetting('soundAlert', e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded mt-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                {localSettings.soundAlert ? <Volume2 className="w-3.5 h-3.5 text-sky-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>Campana Sonora Suave</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Emite un tono armónico discreto al vencer la hora de la pausa.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={localSettings.quietInEmergency}
              onChange={(e) => updateSetting('quietInEmergency', e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded mt-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Modo Silencio en Códigos y Paradas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permite silenciar con un solo toque si se activa una emergencia vital en tu servicio.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
