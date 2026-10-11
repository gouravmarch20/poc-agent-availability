import { toast } from 'sonner';

const ERROR_DURATION_MS = 6000;

interface NotifyOptions {
  description?: string;
  // Toasts with the same id replace each other, so a repeated failure never stacks duplicates.
  id?: string;
}

export function notifyError(message: string, { description, id }: NotifyOptions = {}): void {
  toast.error(message, { id: id ?? message, description, duration: ERROR_DURATION_MS });
}

export function notifySuccess(message: string, { description, id }: NotifyOptions = {}): void {
  toast.success(message, { id: id ?? message, description });
}
