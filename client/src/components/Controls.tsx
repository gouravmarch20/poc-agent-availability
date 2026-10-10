import { useId, type ReactNode } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'linkish';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: ReactNode;
  labelClassName?: string;
  errorClassName?: string;
}

type DateInputProps = Omit<InputProps, 'type'>;
type TimeInputProps = Omit<InputProps, 'type'>;

function mergeClassNames(base: string, className?: string) {
  return [base, className].filter(Boolean).join(' ');
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const variantClass = variant === 'primary' ? undefined : variant;
  return <button {...props} className={mergeClassNames('ui-button', [variantClass, className].filter(Boolean).join(' '))} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={mergeClassNames('ui-select', className)} />;
}

export function Input({
  className,
  label,
  error,
  labelClassName,
  errorClassName = 'field-error',
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <>
      {label != null && <label className={labelClassName} htmlFor={inputId}>{label}</label>}
      <input
        {...props}
        id={inputId}
        className={mergeClassNames('ui-input', className)}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
      />
      {error != null && <p className={errorClassName} id={errorId}>{error}</p>}
    </>
  );
}

export function DateInput({ className, ...props }: DateInputProps) {
  return <Input {...props} type="date" className={mergeClassNames('ui-date-input', className)} />;
}

export function TimeInput({ className, ...props }: TimeInputProps) {
  return <Input {...props} type="time" className={mergeClassNames('ui-time-input', className)} />;
}