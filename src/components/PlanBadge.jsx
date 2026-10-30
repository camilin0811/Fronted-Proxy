export default function PlanBadge({ plan }) {
  if (!plan) return <span className="plan-badge plan-loading">…</span>;
  return <span className={`plan-badge plan-${plan.toLowerCase()}`}>{plan}</span>;
}
