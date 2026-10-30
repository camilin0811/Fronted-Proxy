import { useEffect, useRef, useState } from 'react';
import { estimateTokens, formatNumber } from '../utils/format.js';

const SUGGESTIONS = [
  'Explain the Proxy design pattern in simple words',
  'Give me 3 tips to write better prompts',
  'What is the difference between rate limiting and quotas?',
];

function Message({ message }) {
  if (message.pending) {
    return (
      <div className="msg msg-assistant">
        <div className="bubble typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
  return (
    <div className={`msg msg-${message.role}`}>
      <div className="bubble">
        {message.code && <span className="msg-code">{message.code}</span>}
        {message.text}
        {message.meta && (
          <div className="msg-meta">
            {message.meta.model} · {formatNumber(message.meta.totalTokens)} tokens
            ({message.meta.promptTokens} in / {message.meta.completionTokens} out) ·{' '}
            {(message.meta.latencyMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  sending,
  rateLimited,
  countdown,
  quotaExhausted,
  status,
  onSend,
  onUpgrade,
}) {
  const [prompt, setPrompt] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const estimate = estimateTokens(prompt);
  const remaining = status && !status.unlimited ? status.tokensRemaining : null;
  const exceedsQuota = remaining !== null && estimate > remaining;
  const disabled = sending || rateLimited || !prompt.trim() || !status;

  const submit = (e) => {
    e?.preventDefault();
    if (disabled) return;
    onSend(prompt.trim());
    setPrompt('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  let buttonLabel = 'Send';
  if (sending) buttonLabel = 'Generating…';
  else if (rateLimited) buttonLabel = `Wait ${countdown}s`;

  return (
    <section className="card chat">
      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <h2>What do you want to ask?</h2>
            <p className="muted">
              Every message passes through <strong>RateLimitProxy</strong> → <strong>QuotaProxy</strong> →
              the AI service.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion" onClick={() => setPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
      </div>

      {rateLimited && (
        <div className="banner banner-warning">
          ⏳ Rate limit reached ({status?.requestsPerMinuteLimit} requests/min). Sending is disabled for{' '}
          <strong>{countdown}s</strong>.
        </div>
      )}
      {quotaExhausted && (
        <div className="banner banner-error">
          Monthly quota exhausted.{' '}
          <button className="link" onClick={onUpgrade}>
            Upgrade your plan
          </button>
        </div>
      )}

      <form className="composer" onSubmit={submit}>
        <textarea
          className="input composer-input"
          rows={2}
          placeholder="Type a prompt… (Enter to send, Shift+Enter for a new line)"
          value={prompt}
          maxLength={4000}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="composer-footer">
          <span className={`estimator ${exceedsQuota ? 'estimator-warn' : ''}`}>
            ≈ <strong>{formatNumber(estimate)}</strong> prompt tokens
            {estimate > 0 && ' + response (~50–60)'}
            {remaining !== null && estimate > 0 && (
              <> · {formatNumber(Math.max(0, remaining - estimate))} left after sending</>
            )}
            {exceedsQuota && ' · exceeds your remaining quota'}
          </span>
          <button className="btn btn-primary" disabled={disabled}>
            {buttonLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
