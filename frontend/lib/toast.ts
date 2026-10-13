export type ToastType = 'success' | 'error' | 'info';

export interface ToastEvent {
  message: string;
  type: ToastType;
}

export type ToastListener = (event: ToastEvent) => void;

const listeners: Set<ToastListener> = new Set();

export const showToast = (message: any, type: ToastType = 'success') => {
  let text = '';
  if (typeof message === 'string') {
    text = message;
  } else if (message?.message && typeof message.message === 'string') {
    text = message.message;
  } else if (message?.detail && typeof message.detail === 'string') {
    text = message.detail;
  } else if (message) {
    try {
      text = JSON.stringify(message);
    } catch {
      text = String(message);
    }
  } else {
    text = 'Notification';
  }

  listeners.forEach((listener) => {
    try {
      listener({ message: text, type });
    } catch (err) {
      console.error('Error delivering toast notification:', err);
    }
  });
};

export const subscribeToast = (listener: ToastListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
