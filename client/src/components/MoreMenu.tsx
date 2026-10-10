import { useState, type ReactNode } from 'react';
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
}

export default function MoreMenu({
  label,
  subject,
  confirmation,
  onConfirm,
  disabled = false,
  buttonText = 'Delete',
  buttonClassName,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <Button
        type="button"
        className={`${styles.trigger} ${styles.deleteTrigger} ${buttonClassName ?? ''}`}
        aria-label={label}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {buttonText}
      </Button>

      {open && (
        <div className={styles.backdrop} role="presentation" onClick={() => setOpen(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="delete-confirm-title">Delete</h3>
            <div className={styles.copy}>
              <p className={styles.subject}>{subject}</p>
              <p>{confirmation}</p>
            </div>
            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="danger"
                onClick={() => {
                  setOpen(false);
                  void onConfirm();
                }}
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}