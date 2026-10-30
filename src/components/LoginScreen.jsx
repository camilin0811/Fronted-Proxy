import { useState } from 'react';

const VALID = /^[a-zA-Z0-9_.-]{1,64}$/;

export default function LoginScreen({ onLogin }) {
  const [value, setValue] = useState('');
  const trimmed = value.trim().toLowerCase();
  const valid = VALID.test(trimmed);

  const submit = (e) => {
    e.preventDefault();
    if (valid) onLogin(trimmed);
  };

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <img src="/favicon.svg" alt="" width="44" height="44" />
        <h1>AI Proxy Platform</h1>
        <p className="muted">
          Enter a username to start. New users begin on the <strong>FREE</strong> plan
          (10 requests/min, 50k tokens/month).
        </p>
        <input
          className="input"
          autoFocus
          placeholder="e.g. andruw"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={64}
        />
        {value && !valid && (
          <span className="field-error">Use letters, numbers, dots, dashes or underscores.</span>
        )}
        <button className="btn btn-primary" disabled={!valid}>
          Continue
        </button>
      </form>
    </div>
  );
}
