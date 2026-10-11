import { useId, type ReactNode } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
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

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
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

export { Select } from './Select';
export type { SelectOption } from './Select';

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

export function Textarea({ className, label, error, hint, id, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <>
      {label != null && <label htmlFor={textareaId}>{label}</label>}
      <textarea
        {...props}
        id={textareaId}
        className={mergeClassNames('ui-input', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        style={{ resize: 'vertical', ...props.style }}
      />
      {hint != null && <p className="meta" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>{hint}</p>}
      {error != null && <p className="field-error" id={errorId}>{error}</p>}
    </>
  );
}

export function DateInput({ className, ...props }: DateInputProps) {
  return <Input {...props} type="date" className={mergeClassNames('ui-date-input', className)} />;
}

export function TimeInput({ className, ...props }: TimeInputProps) {
  return <Input {...props} type="time" className={mergeClassNames('ui-time-input', className)} />;
}