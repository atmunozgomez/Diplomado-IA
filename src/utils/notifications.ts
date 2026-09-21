/**
 * Notification helper for Hospital Staff Active Pauses
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function sendPauseNotification(title?: string, body?: string): boolean {
  if (!isNotificationSupported()) return false;

  const defaultTitle = '🏥 Pausa Activa Hospitalaria (60 seg)';
  const defaultBody = 'Es momento de tomarte 60 segundos de respiración consciente para restablecer tu enfoque y cuidar de ti.';

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title || defaultTitle, {
        body: body || defaultBody,
        icon: '/favicon.ico',
        tag: 'hospital-active-pause',
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch {
      return false;
    }
  }
  return false;
}
