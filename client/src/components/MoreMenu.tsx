import { useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Controls';
import styles from './MoreMenu.module.css';

interface MoreMenuProps {
  label: string;
  subject: string;
  confirmation: ReactNode;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  buttonText?: string;
  buttonClassName?: string;
  // Popup heading and confirm button; "safe" swaps the red delete look for a calm green one (e.g. Restore).
  title?: string;
  confirmText?: string;
  tone?: 'danger' | 'safe';
}

export default function MoreMenu({
  label,
  subject,
  confirmation,
  onConfirm,
  disabled = false,
  buttonText = 'Delete',
  buttonClassName,
  title = 'Delete',
  confirmText = 'Delete',
  tone = 'danger',
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <div className={styles.root}>
      <Button
        type="button"
        className={`${styles.trigger} ${tone === 'safe' ? styles.safeTrigger : styles.deleteTrigger} ${buttonClassName ?? ''}`}
        aria-label={label}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {buttonText}
      </Button>

      {open && createPortal(
        <div className={styles.backdrop} role="presentation" onClick={() => setOpen(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
            <h3 id={titleId}>{title}</h3>
            <div className={styles.copy}>
              <p className={`${styles.subject}${tone === 'safe' ? ` ${styles.subjectSafe}` : ''}`}>{subject}</p>
              <p>{confirmation}</p>
            </div>
            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className={tone === 'safe' ? styles.confirmSafe : 'danger'}
                onClick={() => {
                  setOpen(false);
                  void onConfirm();
                }}
                variant={tone === 'safe' ? 'primary' : 'danger'}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}