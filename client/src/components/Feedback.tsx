interface LoadingStateProps {
  label?: string;
  compact?: boolean;
}

interface MessageProps {
  message: string;
}

export function LoadingState({ label = 'Loading...', compact = false }: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm text-muted ${compact ? 'py-4' : 'min-h-40 py-12'}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-r-transparent"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message }: MessageProps) {
  return (
    <div className="error rounded-sm border-l-2 border-current px-3 py-2" role="alert">
      {message}
    </div>
  );
}

export function EmptyState({ message }: MessageProps) {
  return <p className="py-8 text-center text-sm text-muted">{message}</p>;
}