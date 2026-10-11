import { toast } from 'sonner';

const ERROR_DURATION_MS = 6000;
const SUCCESS_DURATION_MS = 5000;
// Short confirmations for create / update / delete in the admin screens.
export const ACTION_TOAST_MS = 3000;

interface NotifyOptions {
  description?: string;
  // Milliseconds before the toast dismisses itself; defaults suit login-style messages.
  duration?: number;
  // Toasts with the same id replace each other, so a repeated failure never stacks duplicates.
  id?: string;
}

export function notifyError(message: string, { description, id, duration }: NotifyOptions = {}): void {
  toast.error(message, { id: id ?? message, description, duration: duration ?? ERROR_DURATION_MS });
}

export function notifySuccess(message: string, { description, id, duration }: NotifyOptions = {}): void {
  toast.success(message, { id: id ?? message, description, duration: duration ?? SUCCESS_DURATION_MS });
}
