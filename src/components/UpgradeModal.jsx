import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { PLANS, formatNumber } from '../utils/format.js';
import PlanBadge from './PlanBadge.jsx';

const ORDER = ['FREE', 'PRO', 'ENTERPRISE'];

/**
 * Upgrade dialog with a SIMULATED payment step. Card fields are only for the demo:
 * they are never sent to the backend, which only receives the chosen plan and a fake reference.
 */
export default function UpgradeModal({ userId, status, quotaExhausted, onClose, onUpgraded }) {
  const options = ORDER.filter((p) => ORDER.indexOf(p) > ORDER.indexOf(status.plan));
  const [selected, setSelected] = useState(options[0]);
  const [step, setStep] = useState('choose'); // choose | pay | processing | done
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && step !== 'processing' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const cardValid =
    card.name.trim().length > 1 &&
    card.number.replace(/\s/g, '').length >= 12 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    /^\d{3,4}$/.test(card.cvc);

  const pay = async (e) => {
    e.preventDefault();
    setStep('processing');
    setError('');
    await new Promise((r) => setTimeout(r, 1500)); // simulate payment gateway latency
    try {
      const reference = `SIM-${Date.now().toString(36).toUpperCase()}`;
      const newStatus = await api.upgrade(userId, selected, reference);
      setStep('done');
      onUpgraded(newStatus);
    } catch (err) {
      setError(err.message);
      setStep('pay');
    }
  };

  const formatCardNumber = (v) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}>
      <div className="modal card" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <button className="modal-close" onClick={onClose} disabled={step === 'processing'} aria-label="Close">
          ×
        </button>

        {step === 'done' ? (
          <div className="modal-done">
            <div className="success-icon">✓</div>
            <h2 id="upgrade-title">Payment successful</h2>
            <p className="muted">
              You are now on <PlanBadge plan={selected} />. Your new limits are active.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              Back to chat
            </button>
          </div>
        ) : options.length === 0 ? (
          <div className="modal-done">
            <h2 id="upgrade-title">You already have the best plan</h2>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 id="upgrade-title">{quotaExhausted ? 'You ran out of tokens' : 'Upgrade your plan'}</h2>
            <p className="muted">
              Current plan: <PlanBadge plan={status.plan} />
              {quotaExhausted && ' — upgrade to continue using the AI service this month.'}
            </p>

            {step === 'choose' && (
              <>
                <div className="plan-options">
                  {options.map((p) => {
                    const info = PLANS[p];
                    return (
                      <label key={p} className={`plan-option ${selected === p ? 'plan-option-selected' : ''}`}>
                        <input type="radio" name="plan" checked={selected === p} onChange={() => setSelected(p)} />
                        <div className="plan-option-head">
                          <PlanBadge plan={p} />
                          <span className="price">
                            ${info.price}
                            <small>/month</small>
                          </span>
                        </div>
                        <ul>
                          <li>{info.rpm ? `${info.rpm} requests / minute` : 'Unlimited requests'}</li>
                          <li>{info.tokens ? `${formatNumber(info.tokens)} tokens / month` : 'Unlimited tokens'}</li>
                        </ul>
                      </label>
                    );
                  })}
                </div>
                <button className="btn btn-primary full" onClick={() => setStep('pay')}>
                  Continue to payment
                </button>
              </>
            )}

            {(step === 'pay' || step === 'processing') && (
              <form className="pay-form" onSubmit={pay}>
                <div className="sim-note">Simulated payment — no real charge is made and card data is not sent anywhere.</div>
                <label>
                  Cardholder name
                  <input className="input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Jane Doe" />
                </label>
                <label>
                  Card number
                  <input
                    className="input"
                    inputMode="numeric"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                    placeholder="4242 4242 4242 4242"
                  />
                </label>
                <div className="pay-row">
                  <label>
                    Expiry
                    <input
                      className="input"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY"
                    />
                  </label>
                  <label>
                    CVC
                    <input
                      className="input"
                      inputMode="numeric"
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="123"
                    />
                  </label>
                </div>
                {error && <span className="field-error">{error}</span>}
                <div className="pay-actions">
                  <button type="button" className="btn btn-ghost" disabled={step === 'processing'} onClick={() => setStep('choose')}>
                    Back
                  </button>
                  <button className="btn btn-primary" disabled={!cardValid || step === 'processing'}>
                    {step === 'processing' ? 'Processing payment…' : `Pay $${PLANS[selected].price}`}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
