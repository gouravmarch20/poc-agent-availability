import { FormEvent, useState } from 'react';
import { changePassword } from '../services/auth';
import { useApiRequest } from '../hooks/useApiRequest';
import { Button, Input } from '../components/Controls';
import { ErrorMessage } from '../components/Feedback';
import styles from './Account.module.css';

const MIN_PASSWORD_LENGTH = 8;

export default function Account() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const { execute, error } = useApiRequest();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setFormError('');
    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await execute(() => changePassword(currentPassword, newPassword));
      setMessage('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // The request hook displays the API error.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <p className={styles.eyebrow}>Account settings</p>
        <h1>Change password</h1>
      </header>
      <div className={styles.securityLayout}>
        <section className={styles.securityIntro} aria-labelledby="account-security-title">
          <p className={styles.sectionLabel}>Security</p>
          <h2 id="account-security-title">Update your sign-in details</h2>
          <p>Choose a new password with at least {MIN_PASSWORD_LENGTH} characters.</p>
        </section>

        <form className={`card ${styles.form}`} onSubmit={onSubmit} autoComplete="on">
          {error && <ErrorMessage message={error} />}
          {formError && <p className={`${styles.message} ${styles.messageError}`} role="alert">{formError}</p>}
          {message && <p className={`${styles.message} ${styles.messageSuccess}`} role="status">{message}</p>}

          <div className="field">
            <Input
              id="current-password"
              label="Current password"
              name="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          </div>
          <div className="field">
            <Input
              id="new-password"
              label="New password"
              name="newPassword"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          </div>
          <div className="field">
            <Input
              id="confirm-password"
              label="Confirm new password"
              name="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          </div>
          <div className={styles.formActions}>
            <label className={styles.showPassword}>
              <Input
                type="checkbox"
                checked={showPasswords}
                onChange={(event) => setShowPasswords(event.target.checked)}
              />
              Show passwords
            </label>
            <Button className={styles.submit} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
