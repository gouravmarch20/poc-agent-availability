import { useState } from 'react';
import { changePassword } from '../services/auth';
import { useApiRequest } from '../hooks/useApiRequest';
import { ErrorMessage } from '../components/Feedback';

export default function Account() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const { execute, error } = useApiRequest();

  async function onSubmit(e) {
    e.preventDefault();
    setMessage('');
    try {
      await execute(() => changePassword(currentPassword, newPassword));
      setMessage('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      return;
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 420 }}>
      <h1>Change password</h1>
      {error && <ErrorMessage message={error} />}
      {message && <p>{message}</p>}
      <div className="field">
        <label>Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="field">
        <label>New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <button type="submit">Update</button>
    </form>
  );
}
