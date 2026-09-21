import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ShiftFocusBanner } from './components/ShiftFocusBanner';
import { BreathingSession } from './components/BreathingSession';
import { NotificationSettings } from './components/NotificationSettings';
import { HistoryView } from './components/HistoryView';
import { ClinicalGuidelinesModal } from './components/ClinicalGuidelinesModal';
import { ReminderToast } from './components/ReminderToast';
import { HospitalDepartment, SessionRecord, ReminderSettings } from './types';
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessionRecord,
  deleteSessionRecord,
  clearAllSessions,
  calculateStats,
} from './utils/storage';
import { sendPauseNotification } from './utils/notifications';
import { playReminderPing } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pause' | 'history' | 'reminders'>('pause');
  const [settings, setSettings] = useState<ReminderSettings>(loadSettings);
  const [sessions, setSessions] = useState<SessionRecord[]>(loadSessions);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState<boolean>(false);
  const [isReminderToastOpen, setIsReminderToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const mountTimeRef = useRef<number>(Date.now());
  const lastAlertTimeRef = useRef<number>(0);

  // Derived statistics
  const stats = useMemo(() => calculateStats(sessions), [sessions]);

  // Handle department updates
  const handleDepartmentChange = (dept: HospitalDepartment) => {
    const updated = { ...settings, department: dept };
    setSettings(updated);
    saveSettings(updated);
  };

  // Handle settings updates
  const handleSaveSettings = (newSettings: ReminderSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Handle new completed session
  const handleSessionComplete = (sessionData: Omit<SessionRecord, 'id' | 'date' | 'completedAtHour'>) => {
    const saved = saveSessionRecord(sessionData);
    setSessions((prev) => [saved, ...prev]);

    // Update lastCompletedPause in settings
    const nowIso = new Date().toISOString();
    const updatedSettings: ReminderSettings = {
      ...settings,
      lastCompletedPause: nowIso,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);

    // Reset alert suppression timer
    lastAlertTimeRef.current = Date.now();
  };

  const handleDeleteSession = (id: string) => {
    const updated = deleteSessionRecord(id);
    setSessions(updated);
  };

  const handleClearAllSessions = () => {
    clearAllSessions();
    setSessions([]);
  };

  // Calculate next scheduled pause in minutes and formatted time
  const [nextPauseMinutes, setNextPauseMinutes] = useState<number | null>(null);
  const [nextScheduledTimeStr, setNextScheduledTimeStr] = useState<string | null>(null);

  const calculateNextReminders = useCallback(() => {
    if (!settings.enabled) {
      setNextPauseMinutes(null);
      setNextScheduledTimeStr(null);
      return;
    }

    const now = new Date();
    let minMinutesToNext: number | null = null;
    let nextTimeString: string | null = null;

    // 1. Interval Check
    if (settings.useInterval) {
      const baseTime = settings.lastCompletedPause
        ? new Date(settings.lastCompletedPause).getTime()
        : mountTimeRef.current;
      const elapsedMinutes = Math.floor((now.getTime() - baseTime) / (1000 * 60));
      const remainingForInterval = Math.max(0, settings.intervalMinutes - elapsedMinutes);
      
      minMinutesToNext = remainingForInterval;
      const nextDate = new Date(now.getTime() + remainingForInterval * 60 * 1000);
      nextTimeString = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // 2. Fixed Scheduled Times Check
    if (settings.useScheduledTimes && settings.scheduledReminders.length > 0) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      for (const r of settings.scheduledReminders) {
        if (!r.enabled) continue;
        const [hStr, mStr] = r.time.split(':');
        const rMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
        let diff = rMinutes - currentTotalMinutes;
        if (diff < 0) {
          diff += 24 * 60; // Next day
        }

        if (minMinutesToNext === null || diff < minMinutesToNext) {
          minMinutesToNext = diff;
          nextTimeString = r.time;
        }
      }
    }

    setNextPauseMinutes(minMinutesToNext);
    setNextScheduledTimeStr(nextTimeString);

    // Trigger alert if time is up and hasn't alerted in the last 3 minutes
    if (minMinutesToNext !== null && minMinutesToNext <= 0) {
      const timeSinceLastAlert = (now.getTime() - lastAlertTimeRef.current) / 1000;
      if (timeSinceLastAlert > 180) { // 3 minutes cooldown
        lastAlertTimeRef.current = now.getTime();
        triggerScheduledAlert();
      }
    }
  }, [settings]);

  const triggerScheduledAlert = () => {
    // Audio chime if enabled
    if (settings.soundAlert && soundEnabled) {
      playReminderPing();
    }

    // Browser Notification
    if (settings.browserNotifications) {
      sendPauseNotification(
        '🏥 Pausa Activa Hospitalaria (60s)',
        `Es momento de tomarte tu pausa de 60 segundos en ${settings.department}. Restablece tu concentración y bienestar.`
      );
    }

    // In-app alert toast
    setToastMessage(`Es momento de tu pausa activa de 60 segundos programada para el área de ${settings.department}.`);
    setIsReminderToastOpen(true);
  };

  // Background reminder evaluation ticker (every 10 seconds)
  useEffect(() => {
    calculateNextReminders();
    const interval = setInterval(calculateNextReminders, 10000);
    return () => clearInterval(interval);
  }, [calculateNextReminders]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-slate-50 to-blue-50/30 flex flex-col text-slate-800">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        department={settings.department}
        shift={settings.shift}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        nextPauseMinutes={nextPauseMinutes}
        isInSession={false}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Shift Focus Banner (Visible on 'pause' tab) */}
        {activeTab === 'pause' && (
          <ShiftFocusBanner
            shift={settings.shift}
            department={settings.department}
            nextPauseMinutes={nextPauseMinutes}
            todayCount={stats.todayCount}
            onStartPause={() => {
              // Focus breathing session
              const el = document.getElementById('start-pause-btn');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenReminders={() => setActiveTab('reminders')}
          />
        )}

        {/* Tab 1: 60-Second Breathing Session */}
        {activeTab === 'pause' && (
          <BreathingSession
            soundEnabled={soundEnabled}
            department={settings.department}
            onDepartmentChange={handleDepartmentChange}
            onSessionComplete={handleSessionComplete}
            onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          />
        )}

        {/* Tab 2: Programmable Reminders & Shift Settings */}
        {activeTab === 'reminders' && (
          <NotificationSettings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            nextScheduledTime={nextScheduledTimeStr}
          />
        )}

        {/* Tab 3: History & Shift Log */}
        {activeTab === 'history' && (
          <HistoryView
            sessions={sessions}
            stats={stats}
            onDeleteSession={handleDeleteSession}
            onClearAll={handleClearAllSessions}
            onStartNewPause={() => setActiveTab('pause')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xs py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            Pausa Activa 60s • Salud Laboral y Bienestar para Equipos Sanitarios y Hospitalarios
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsGuidelinesOpen(true)}
              className="hover:text-blue-700 underline underline-offset-2 cursor-pointer"
            >
              Fundamentos de Neurofisiología
            </button>
            <span>•</span>
            <span>Protocolo de Micro-Recuperación</span>
          </div>
        </div>
      </footer>

      {/* Clinical Guidelines Modal */}
      <ClinicalGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* Scheduled Reminder Pop-up Toast */}
      <ReminderToast
        isOpen={isReminderToastOpen}
        onClose={() => setIsReminderToastOpen(false)}
        onStartPause={() => {
          setActiveTab('pause');
          setIsReminderToastOpen(false);
          // auto trigger start flow
          setTimeout(() => {
            const startBtn = document.getElementById('start-pause-btn');
            if (startBtn) startBtn.click();
          }, 200);
        }}
        message={toastMessage}
      />
    </div>
  );
}
