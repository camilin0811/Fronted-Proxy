import { formatDate, formatNumber } from '../utils/format.js';

export default function QuotaCard({ status, onUpgrade }) {
  if (!status) return <section className="card skeleton" style={{ height: 150 }} />;

  const { unlimited, tokensUsed, tokenLimit, tokensRemaining, resetDate } = status;
  const pct = unlimited ? 0 : Math.min(100, (tokensUsed / tokenLimit) * 100);
  const level = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'ok';

  return (
    <section className="card">
      <div className="card-title">
        <h3>Monthly token quota</h3>
        <span className="muted small">Resets {formatDate(resetDate)}</span>
      </div>

      {unlimited ? (
        <>
          <div className="big-number">∞</div>
          <p className="muted small">
            Unlimited tokens. Used this month: <strong>{formatNumber(tokensUsed)}</strong>
          </p>
        </>
      ) : (
        <>
          <div className="quota-numbers">
            <span>
              <strong>{formatNumber(tokensUsed)}</strong> used
            </span>
            <span className="muted">of {formatNumber(tokenLimit)}</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={`progress-fill progress-${level}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="quota-numbers small">
            <span className="muted">{(Math.floor(pct * 10) / 10).toFixed(1)}% used</span>
            <span>
              <strong>{formatNumber(tokensRemaining)}</strong> remaining
            </span>
          </div>
          {pct >= 70 && (
            <button className="btn btn-outline btn-sm full" onClick={onUpgrade}>
              Need more tokens? Upgrade
            </button>
          )}
        </>
      )}
    </section>
  );
}
