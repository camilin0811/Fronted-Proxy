import { formatCompact, formatDate, formatNumber } from '../utils/format.js';

/** Bar chart of tokens consumed per day for the last 7 days (pure CSS, no chart library). */
export default function UsageChart({ history }) {
  if (!history.length) return <section className="card skeleton" style={{ height: 220 }} />;

  const max = Math.max(...history.map((d) => d.tokens), 1);
  const total = history.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = history.reduce((sum, d) => sum + d.requests, 0);

  return (
    <section className="card">
      <div className="card-title">
        <h3>Usage · last 7 days</h3>
        <span className="muted small">
          {formatNumber(total)} tokens · {totalRequests} req
        </span>
      </div>

      <div className="chart">
        {history.map((day, i) => {
          const isToday = i === history.length - 1;
          const height = day.tokens === 0 ? 0 : Math.max(4, (day.tokens / max) * 100);
          return (
            <div
              key={day.date}
              className="chart-col"
              title={`${formatDate(day.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${formatNumber(day.tokens)} tokens, ${day.requests} requests`}
            >
              <span className="chart-value">{day.tokens > 0 ? formatCompact(day.tokens) : ''}</span>
              <div className="chart-track">
                <div className={`chart-bar ${isToday ? 'chart-bar-today' : ''}`} style={{ height: `${height}%` }} />
              </div>
              <span className={`chart-label ${isToday ? 'chart-label-today' : ''}`}>
                {isToday ? 'Today' : formatDate(day.date, { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
