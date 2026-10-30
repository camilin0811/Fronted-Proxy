import PlanBadge from './PlanBadge.jsx';

export default function Header({ userId, plan, onLogout, onUpgrade }) {
  return (
    <header className="header">
      <div className="brand">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        <div>
          <strong>AI Proxy Platform</strong>
          <span className="brand-sub">Rate limiting &amp; quotas with the Proxy pattern</span>
        </div>
      </div>

      <div className="header-right">
        <PlanBadge plan={plan} />
        {plan && plan !== 'ENTERPRISE' && (
          <button className="btn btn-ghost btn-sm" onClick={onUpgrade}>
            Upgrade
          </button>
        )}
        <span className="user-chip" title="X-User-Id">
          <span className="avatar">{userId.charAt(0).toUpperCase()}</span>
          {userId}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>
          Switch user
        </button>
      </div>
    </header>
  );
}
