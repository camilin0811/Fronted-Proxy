export default function RateLimitCard({ status, rateLimited, countdown, secondsToReset }) {
  if (!status) return <section className="card skeleton" style={{ height: 130 }} />;

  const limit = status.requestsPerMinuteLimit;
  const unlimited = limit < 0;
  const used = status.requestsThisMinute;
  const ringPct = (secondsToReset / 60) * 100;

  return (
    <section className={`card ${rateLimited ? 'card-alert' : ''}`}>
      <div className="card-title">
        <h3>Requests this minute</h3>
        {rateLimited && <span className="pill pill-danger">Limited</span>}
      </div>

      <div className="rate-row">
        <div className="rate-count">
          <span className="big-number">{used}</span>
          <span className="muted">/ {unlimited ? '∞' : limit}</span>
        </div>

        <div className="countdown" style={{ '--pct': `${ringPct}%` }} title="Time until the counter resets">
          <div className="countdown-inner">
            <strong>{rateLimited ? countdown : secondsToReset}s</strong>
            <span>reset</span>
          </div>
        </div>
      </div>

      {!unlimited && limit <= 20 && (
        <div className="dots" aria-hidden="true">
          {Array.from({ length: limit }).map((_, i) => (
            <span key={i} className={`dot ${i < used ? 'dot-used' : ''}`} />
          ))}
        </div>
      )}
    </section>
  );
}
