import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Page not found</h1>
        <p className="meta">That link does not exist in this portal.</p>
        <Link className="button" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
