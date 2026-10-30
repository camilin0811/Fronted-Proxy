import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api/client.js';
import Header from './components/Header.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import QuotaCard from './components/QuotaCard.jsx';
import RateLimitCard from './components/RateLimitCard.jsx';
import UsageChart from './components/UsageChart.jsx';
import UpgradeModal from './components/UpgradeModal.jsx';

const USER_KEY = 'aiproxy.userId';

function readStoredUser() {
  try {
    return localStorage.getItem(USER_KEY) || '';
  } catch {
    return '';
  }
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

let messageSeq = 0;
const newMessage = (role, text, extra = {}) => ({ id: ++messageSeq, role, text, ...extra });

export default function App() {
  const [userId, setUserId] = useState(readStoredUser);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [rateResetAt, setRateResetAt] = useState(null);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [quotaRejected, setQuotaRejected] = useState(false); // last request got 402
  const [connectionError, setConnectionError] = useState('');
  const now = useNow();
  const refreshing = useRef(false);

  // ---------- Data loading ----------
  const refreshStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getStatus(userId);
      setStatus(data);
      setRateResetAt(Date.now() + data.rateLimitResetInSeconds * 1000);
      setConnectionError('');
    } catch (e) {
      setConnectionError(e.message);
    }
  }, [userId]);

  const refreshHistory = useCallback(async () => {
    if (!userId) return;
    try {
      setHistory(await api.getHistory(userId));
    } catch {
      /* status call already reports connection problems */
    }
  }, [userId]);

  useEffect(() => {
    setStatus(null);
    setHistory([]);
    setMessages([]);
    setBlockedUntil(null);
    setQuotaRejected(false);
    refreshStatus();
    refreshHistory();
  }, [refreshStatus, refreshHistory]);

  // When the minute window ends, the backend scheduler resets the counter: fetch the new status.
  useEffect(() => {
    if (rateResetAt && now >= rateResetAt && !refreshing.current) {
      refreshing.current = true;
      setRateResetAt(null);
      setTimeout(async () => {
        await refreshStatus();
        refreshing.current = false;
      }, 600);
    }
    if (blockedUntil && now >= blockedUntil) setBlockedUntil(null);
  }, [now, rateResetAt, blockedUntil, refreshStatus]);

  // ---------- Derived state ----------
  const secondsToReset = rateResetAt ? Math.max(0, Math.ceil((rateResetAt - now) / 1000)) : 0;
  const blockedSeconds = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;
  const rpmLimit = status?.requestsPerMinuteLimit ?? -1;
  const limitReached = rpmLimit > 0 && (status?.requestsThisMinute ?? 0) >= rpmLimit;
  const rateLimited = blockedSeconds > 0 || (limitReached && secondsToReset > 0);
  const countdown = blockedSeconds > 0 ? blockedSeconds : secondsToReset;
  const quotaExhausted = status ? !status.unlimited && (status.tokensRemaining <= 0 || quotaRejected) : false;

  // ---------- Actions ----------
  const sendPrompt = async (prompt) => {
    const pending = newMessage('assistant', '', { pending: true });
    setMessages((prev) => [...prev, newMessage('user', prompt), pending]);
    setSending(true);

    const replacePending = (msg) =>
      setMessages((prev) => prev.map((m) => (m.id === pending.id ? { ...msg, id: pending.id } : m)));

    try {
      const res = await api.generate(userId, prompt);
      replacePending(newMessage('assistant', res.text, { meta: res }));
    } catch (e) {
      if (e.status === 429) {
        const wait = e.retryAfterSeconds ?? 60;
        setBlockedUntil(Date.now() + wait * 1000);
        replacePending(newMessage('error', `Rate limit reached. You can send again in ${wait}s.`, { code: 429 }));
      } else if (e.status === 402) {
        setQuotaRejected(true);
        replacePending(newMessage('error', 'Your monthly token quota is exhausted. Upgrade your plan to keep chatting.', { code: 402 }));
        setShowUpgrade(true);
      } else {
        replacePending(newMessage('error', e.message, { code: e.status }));
      }
    } finally {
      setSending(false);
      refreshStatus();
      refreshHistory();
    }
  };

  const handleUpgraded = (newStatus) => {
    setStatus(newStatus);
    setQuotaRejected(false);
    setMessages((prev) => [...prev, newMessage('system', `Plan upgraded to ${newStatus.plan}. Enjoy your new limits!`)]);
    refreshHistory();
  };

  const login = (id) => {
    try {
      localStorage.setItem(USER_KEY, id);
    } catch {
      /* storage unavailable: keep the session in memory */
    }
    setUserId(id);
  };

  const logout = () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    setUserId('');
  };

  if (!userId) return <LoginScreen onLogin={login} />;

  return (
    <div className="app">
      <Header userId={userId} plan={status?.plan} onLogout={logout} onUpgrade={() => setShowUpgrade(true)} />

      {connectionError && <div className="banner banner-error">{connectionError}</div>}

      <main className="layout">
        <ChatPanel
          messages={messages}
          sending={sending}
          rateLimited={rateLimited}
          countdown={countdown}
          quotaExhausted={quotaExhausted}
          status={status}
          onSend={sendPrompt}
          onUpgrade={() => setShowUpgrade(true)}
        />

        <aside className="sidebar">
          <QuotaCard status={status} onUpgrade={() => setShowUpgrade(true)} />
          <RateLimitCard status={status} rateLimited={rateLimited} countdown={countdown} secondsToReset={secondsToReset} />
          <UsageChart history={history} />
        </aside>
      </main>

      {showUpgrade && status && (
        <UpgradeModal
          userId={userId}
          status={status}
          quotaExhausted={quotaExhausted}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={handleUpgraded}
        />
      )}
    </div>
  );
}
