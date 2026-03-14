import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

// ── Helpers ───────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const h     = i.toString().padStart(2, '0');
    const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
    const tag   = i < 6 ? '— Night Owl' : i < 9 ? '— Early Start' : i < 11 ? '— Focus Start' : i < 14 ? '— Midday' : i < 17 ? '— Afternoon' : i < 20 ? '— Evening Wind-down' : '— Night Reflect';
    return { value: `${h}:00`, label: `${label} ${tag}` };
});

const PATH_STEPS = [
    { icon: '⏰', title: 'Set time',          desc: 'Choose a moment of quiet in your daily routine.' },
    { icon: '📲', title: 'Get notification',  desc: 'A gentle, non-intrusive nudge arrives on your device.' },
    { icon: '📝', title: 'Log mood',           desc: 'Spend 30 seconds reflecting on your current state.' },
    { icon: '📈', title: 'Build streak',        desc: 'Watch your wellness journey unfold slowly over time.' },
];

const RECENT_ACTIVITY_MOCK = [
    { icon: '😊', label: 'Mood Logged',   sub: 'Response to 09:30 AM nudge',   time: 'Today, 09:34 AM',   ok: true  },
    { icon: '📬', label: 'Test Push Sent', sub: 'System check performed',        time: 'Yesterday, 11:20 PM', ok: true  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Notifications() {
    const [settings, setSettings]               = useState(null);
    const [isSubscribed, setIsSubscribed]       = useState(false);
    const [isLoading, setIsLoading]             = useState(true);
    const [isSaving, setIsSaving]               = useState(false);
    const [isTesting, setIsTesting]             = useState(false);
    const [reminderTime, setReminderTime]       = useState('09:00');
    const [enabled, setEnabled]                 = useState(true);
    const [permissionState, setPermissionState] = useState('default');
    const [successMsg, setSuccessMsg]           = useState('');
    const [error, setError]                     = useState('');
    const [ready, setReady]                     = useState(false);
    const navigate = useNavigate();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const notSupported = !('Notification' in window) || !('serviceWorker' in navigator);

    useEffect(() => {
        checkPermission();
        fetchSettings();
        setTimeout(() => setReady(true), 60);
    }, []);

    const checkPermission = async () => {
        if (!('Notification' in window)) return;
        setPermissionState(Notification.permission);
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) { const sub = await reg.pushManager.getSubscription(); setIsSubscribed(!!sub); }
        }
    };

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/notifications/settings');
            if (res.data.data) {
                setSettings(res.data.data);
                setReminderTime(res.data.data.reminderTime || '09:00');
                setEnabled(res.data.data.reminderEnabled ?? true);
            }
        } catch (err) { if (err.response?.status === 401) navigate('/login'); }
        finally { setIsLoading(false); }
    };

    const handleEnable = async () => {
        setError('');
        try {
            const permission = await Notification.requestPermission();
            setPermissionState(permission);
            if (permission !== 'granted') { setError('Permission denied. Please enable notifications in your browser settings.'); return; }
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            const keyRes  = await api.get('/notifications/vapid-public-key');
            const vapidKey = urlBase64ToUint8Array(keyRes.data.data.publicKey);
            const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
            await api.post('/notifications/subscribe', { subscription: subscription.toJSON(), reminderTime, timezone: tz });
            setIsSubscribed(true);
            flash('✅ Notifications enabled! Daily reminders are now active.', 'ok');
            fetchSettings();
        } catch { setError('Failed to enable notifications. Make sure you\'re using HTTPS.'); }
    };

    const handleDisable = async () => {
        setError('');
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); }
            }
            await api.delete('/notifications/unsubscribe');
            setIsSubscribed(false); setSettings(null);
            flash('Notifications disabled.', 'ok');
        } catch { setError('Failed to disable notifications.'); }
    };

    const handleSave = async () => {
        setIsSaving(true); setError('');
        try {
            await api.patch('/notifications/settings', { reminderTime, reminderEnabled: enabled, timezone: tz });
            flash('✅ Settings saved!', 'ok'); fetchSettings();
        } catch { setError('Failed to save settings.'); }
        finally { setIsSaving(false); }
    };

    const handleTest = async () => {
        setIsTesting(true); setError('');
        try { await api.post('/notifications/send-test'); flash('📬 Test notification sent!', 'ok'); }
        catch { setError('Failed to send test. Make sure notifications are enabled.'); }
        finally { setIsTesting(false); }
    };

    const flash = (msg, type) => {
        if (type === 'ok') setSuccessMsg(msg); else setError(msg);
        setTimeout(() => { setSuccessMsg(''); setError(''); }, 4000);
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    const selectedHour = HOURS.find(h => h.value === reminderTime) || HOURS[9];

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .nt { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:32px 44px 80px; box-sizing:border-box; }

            /* header */
            .nt-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
            .nt-head h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:#111827; margin:0 0 4px; letter-spacing:-0.5px; }
            .nt-head p  { font-size:14px; color:#9ca3af; margin:0; }
            .nt-system { display:inline-flex; align-items:center; gap:7px; background:#dcfce7; color:#16a34a; font-size:12px; font-weight:700; padding:6px 14px; border-radius:20px; border:1px solid #bbf7d0; }
            .nt-system-dot { width:8px; height:8px; border-radius:50%; background:#16a34a; animation:pulse 2s infinite; }
            @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.6;transform:scale(1.2);} }

            /* flash */
            .nt-ok  { background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:12px 16px; border-radius:12px; font-size:14px; font-weight:600; margin-bottom:16px; animation:fadeIn 0.3s ease; }
            .nt-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; animation:fadeIn 0.3s ease; }
            @keyframes fadeIn { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }

            /* ── main layout ── */
            .nt-layout { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; margin-bottom:24px; }

            /* left column */
            .nt-card { background:white; border-radius:20px; padding:24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }

            /* current status */
            .nt-status-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
            .nt-status-badge { font-size:10px; font-weight:700; color:#9ca3af; letter-spacing:0.09em; text-transform:uppercase; margin:0 0 8px; }
            .nt-status-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:#111827; margin:0 0 6px; letter-spacing:-0.3px; }
            .nt-status-sub { font-size:13px; color:#6b7280; margin:0; line-height:1.6; max-width:340px; }
            .nt-on-badge { font-size:11px; font-weight:700; background:#dcfce7; color:#16a34a; padding:4px 12px; border-radius:20px; white-space:nowrap; }
            .nt-off-badge { font-size:11px; font-weight:700; background:#f3f4f6; color:#9ca3af; padding:4px 12px; border-radius:20px; white-space:nowrap; }

            /* toggle */
            .nt-toggle { width:50px; height:28px; border-radius:14px; border:none; cursor:pointer; position:relative; transition:background 0.2s; flex-shrink:0; }
            .nt-toggle-thumb { position:absolute; top:4px; width:20px; height:20px; border-radius:50%; background:white; transition:left 0.2s; box-shadow:0 1px 4px rgba(0,0,0,0.2); }

            /* path steps */
            .nt-path-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; color:#111827; margin:0 0 16px; }
            .nt-path-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
            .nt-step { background:#f9fafb; border-radius:14px; padding:14px; border:1px solid #f3f4f6; }
            .nt-step-icon { font-size:22px; margin-bottom:8px; display:block; }
            .nt-step-title { font-size:13px; font-weight:700; color:#111827; margin:0 0 4px; }
            .nt-step-desc  { font-size:11px; color:#9ca3af; margin:0; line-height:1.5; }

            /* schedule preference */
            .nt-sched-head { display:flex; align-items:center; gap:8px; margin-bottom:18px; }
            .nt-sched-icon { font-size:15px; }
            .nt-sched-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0; }
            .nt-lbl { font-size:12px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.07em; display:block; margin-bottom:8px; }
            .nt-select-wrap { position:relative; margin-bottom:14px; }
            .nt-select { width:100%; padding:11px 40px 11px 14px; border:1.5px solid #e5e7eb; border-radius:12px; font-size:14px; outline:none; background:white; font-family:'DM Sans',sans-serif; color:#111827; appearance:none; cursor:pointer; transition:border-color 0.2s; }
            .nt-select:focus { border-color:#6366f1; }
            .nt-select-arr { position:absolute; right:14px; top:50%; transform:translateY(-50%); font-size:12px; color:#9ca3af; pointer-events:none; }
            .nt-tz-row { display:flex; align-items:center; gap:6px; background:#f9fafb; border:1px solid #f3f4f6; border-radius:10px; padding:9px 14px; margin-bottom:18px; justify-content:space-between; }
            .nt-tz-left { display:flex; align-items:center; gap:6px; }
            .nt-tz-text { font-size:12px; color:#6b7280; }
            .nt-tz-update { font-size:11px; font-weight:700; color:#6366f1; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; }
            .nt-btns { display:flex; gap:10px; }
            .nt-btn-save { flex:1; padding:12px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
            .nt-btn-save:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }
            .nt-btn-save:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }
            .nt-btn-test { flex:1; padding:12px; background:white; color:#374151; border:1.5px solid #e5e7eb; border-radius:12px; font-size:14px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:7px; }
            .nt-btn-test:hover { border-color:#a5b4fc; color:#6366f1; }
            .nt-btn-test:disabled { opacity:0.5; cursor:not-allowed; }
            .nt-enable-btn { width:100%; padding:13px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
            .nt-enable-btn:hover { transform:translateY(-1px); }

            /* ── right sidebar ── */
            .nt-side { display:flex; flex-direction:column; gap:14px; }

            /* action required */
            .nt-action { background:white; border-radius:18px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .nt-action-top { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
            .nt-action-icon { width:36px; height:36px; border-radius:10px; background:#fef2f2; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
            .nt-action-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:800; color:#dc2626; margin:0; }
            .nt-action-text { font-size:12px; color:#6b7280; line-height:1.6; margin:0 0 12px; }
            .nt-action-link { font-size:12px; font-weight:700; color:#6366f1; text-decoration:none; display:flex; align-items:center; gap:4px; }

            /* AI smart scheduling */
            .nt-ai { background:linear-gradient(135deg,#1e1b4b,#312e81,#4f46e5); border-radius:18px; padding:20px; position:relative; overflow:hidden; }
            .nt-ai::before { content:''; position:absolute; top:-30px; right:-30px; width:100px; height:100px; border-radius:50%; background:rgba(255,255,255,0.06); pointer-events:none; }
            .nt-ai-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:800; color:white; margin:0 0 8px; }
            .nt-ai-text  { font-size:12px; color:rgba(255,255,255,0.72); line-height:1.65; margin:0 0 14px; }
            .nt-ai-btn { width:100%; padding:10px; background:rgba(255,255,255,0.15); color:white; border:1px solid rgba(255,255,255,0.25); border-radius:10px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; }
            .nt-ai-btn:hover { background:rgba(255,255,255,0.25); }

            /* danger zone */
            .nt-danger { background:white; border-radius:18px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .nt-danger-lbl { font-size:10px; font-weight:700; color:#dc2626; letter-spacing:0.09em; text-transform:uppercase; margin:0 0 6px; }
            .nt-danger-text { font-size:12px; color:#6b7280; line-height:1.55; margin:0 0 12px; }
            .nt-danger-btn { width:100%; padding:10px; background:white; color:#dc2626; border:1.5px solid #fecaca; border-radius:10px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; }
            .nt-danger-btn:hover { background:#fef2f2; }

            /* recent activity */
            .nt-act { max-width:640px; margin:0 auto; }
            .nt-act-title { font-size:11px; font-weight:700; color:#9ca3af; letter-spacing:0.09em; text-transform:uppercase; text-align:center; margin-bottom:14px; }
            .nt-act-row { background:white; border-radius:14px; padding:13px 18px; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); transition:box-shadow 0.15s; }
            .nt-act-row:hover { box-shadow:0 3px 12px rgba(0,0,0,0.1); }
            .nt-act-left { display:flex; align-items:center; gap:12px; }
            .nt-act-circle { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#ede9fe,#c4b5fd); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
            .nt-act-name { font-size:13px; font-weight:700; color:#111827; margin:0 0 2px; }
            .nt-act-sub  { font-size:11px; color:#9ca3af; margin:0; }
            .nt-act-time { font-size:11px; color:#9ca3af; white-space:nowrap; }

            /* how-it-works (pre-subscribe) */
            .nt-how { background:white; border-radius:20px; padding:22px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); margin-bottom:16px; }
            .nt-how-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 16px; }

            /* not supported / blocked */
            .nt-warn { background:#fffbeb; border:1px solid #fde68a; border-radius:16px; padding:20px; margin-bottom:16px; }
            .nt-warn-t { font-size:15px; font-weight:700; color:#a16207; margin:0 0 8px; }
            .nt-warn-p { font-size:13px; color:#374151; line-height:1.6; margin:0; }

            /* toggle row inside settings */
            .nt-trow { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-top:1px solid #f3f4f6; margin-bottom:12px; }
            .nt-trow-l { font-size:14px; font-weight:600; color:#374151; margin:0 0 2px; }
            .nt-trow-s { font-size:11px; color:#9ca3af; margin:0; }

            @media(max-width:900px) {
                .nt-layout { grid-template-columns:1fr; }
                .nt { padding:24px 20px 80px; }
            }
            @media(max-width:600px) {
                .nt { padding:18px 14px 80px; }
                .nt-path-grid { grid-template-columns:1fr 1fr; }
                .nt-head h1 { font-size:22px; }
            }
        `}</style>

        <div className="nt">
            {/* Header */}
            <div className="nt-head" style={fi(0.04)}>
                <div>
                    <h1>Notifications &amp; Reminders</h1>
                    <p>Daily check-in push notifications</p>
                </div>
                <div className="nt-system">
                    <div className="nt-system-dot" />
                    System Online
                </div>
            </div>

            {successMsg && <div className="nt-ok">{successMsg}</div>}
            {error      && <div className="nt-err">{error}</div>}

            {/* Not supported */}
            {notSupported && (
                <div className="nt-warn" style={fi(0.08)}>
                    <p className="nt-warn-t">⚠️ Push Notifications Not Supported</p>
                    <p className="nt-warn-p">Your browser doesn't support push notifications. Try Chrome, Edge, or Firefox on desktop or Android.</p>
                </div>
            )}

            {!notSupported && (
                <div style={fi(0.08)}>
                    <div className="nt-layout">
                        {/* ── Left column ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Current Status card */}
                            <div className="nt-card">
                                <p className="nt-status-badge">Current Status</p>
                                <div className="nt-status-top">
                                    <div>
                                        <p className="nt-status-title">
                                            {isSubscribed ? 'Reminders are Active' : 'Reminders are Off'}
                                        </p>
                                        <p className="nt-status-sub">
                                            {isSubscribed
                                                ? "You'll receive a gentle nudge every day at your preferred time to check in with your emotional well-being."
                                                : 'Enable reminders to get a daily mood check-in nudge on your device.'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <button className="nt-toggle"
                                            style={{ backgroundColor: isSubscribed && enabled ? '#6366f1' : '#d1d5db' }}
                                            onClick={() => isSubscribed ? handleDisable() : handleEnable()}>
                                            <div className="nt-toggle-thumb" style={{ left: isSubscribed && enabled ? '26px' : '4px' }} />
                                        </button>
                                        <span className={isSubscribed ? 'nt-on-badge' : 'nt-off-badge'}>
                                            {isSubscribed ? 'Reminders Enabled' : 'Not Enabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Path to Consistency */}
                            <div className="nt-card">
                                <p className="nt-path-title">The Path to Consistency</p>
                                <div className="nt-path-grid">
                                    {PATH_STEPS.map((s, i) => (
                                        <div key={i} className="nt-step">
                                            <span className="nt-step-icon">{s.icon}</span>
                                            <p className="nt-step-title">{s.title}</p>
                                            <p className="nt-step-desc">{s.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule Preference */}
                            <div className="nt-card">
                                <div className="nt-sched-head">
                                    <span className="nt-sched-icon">⚙️</span>
                                    <p className="nt-sched-title">Schedule Preference</p>
                                </div>

                                <span className="nt-lbl">Reminder Time</span>
                                <div className="nt-select-wrap">
                                    <select className="nt-select" value={reminderTime} onChange={e => setReminderTime(e.target.value)}>
                                        {HOURS.map(h => (
                                            <option key={h.value} value={h.value}>{h.label}</option>
                                        ))}
                                    </select>
                                    <span className="nt-select-arr">▼</span>
                                </div>

                                {isSubscribed && (
                                    <div className="nt-trow">
                                        <div>
                                            <p className="nt-trow-l">Reminders Enabled</p>
                                            <p className="nt-trow-s">Temporarily pause without unsubscribing</p>
                                        </div>
                                        <button className="nt-toggle"
                                            style={{ backgroundColor: enabled ? '#6366f1' : '#d1d5db' }}
                                            onClick={() => setEnabled(!enabled)}>
                                            <div className="nt-toggle-thumb" style={{ left: enabled ? '26px' : '4px' }} />
                                        </button>
                                    </div>
                                )}

                                <div className="nt-tz-row">
                                    <div className="nt-tz-left">
                                        <span>🌍</span>
                                        <span className="nt-tz-text">Timezone: {tz}</span>
                                    </div>
                                    <button className="nt-tz-update">UPDATE</button>
                                </div>

                                {isSubscribed ? (
                                    <div className="nt-btns">
                                        <button className="nt-btn-save" disabled={isSaving} onClick={handleSave}>
                                            {isSaving ? 'Saving…' : '💾 Save Settings'}
                                        </button>
                                        <button className="nt-btn-test" disabled={isTesting} onClick={handleTest}>
                                            <span>📬</span>{isTesting ? 'Sending…' : 'Send Test'}
                                        </button>
                                    </div>
                                ) : (
                                    <button className="nt-enable-btn" onClick={handleEnable}>
                                        🔔 Enable Daily Reminders
                                    </button>
                                )}

                                {settings?.lastSentAt && (
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' }}>
                                        Last reminder: {new Date(settings.lastSentAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Right sidebar ── */}
                        <div className="nt-side">
                            {/* Action Required (blocked) */}
                            {permissionState === 'denied' && (
                                <div className="nt-action">
                                    <div className="nt-action-top">
                                        <div className="nt-action-icon">⚠️</div>
                                        <p className="nt-action-title">Action Required</p>
                                    </div>
                                    <p className="nt-action-text">
                                        Notifications are currently blocked by your browser settings. To receive daily check-ins, please update your site permissions.
                                    </p>
                                    <a href="#" className="nt-action-link">How to unblock →</a>
                                </div>
                            )}

                            {/* AI Smart Scheduling */}
                            <div className="nt-ai">
                                <p className="nt-ai-title">AI Smart Scheduling</p>
                                <p className="nt-ai-text">
                                    Let Serenity AI analyze your app usage and biometric data to suggest the optimal time for mindfulness prompts.
                                </p>
                                <button className="nt-ai-btn">✨ Activate AI Assist</button>
                            </div>

                            {/* Danger Zone (only if subscribed) */}
                            {isSubscribed && (
                                <div className="nt-danger">
                                    <p className="nt-danger-lbl">Danger Zone</p>
                                    <p className="nt-danger-text">If you disable notifications, you'll lose your current 12-day streak progress.</p>
                                    <button className="nt-danger-btn" onClick={handleDisable}>Disable All Notifications</button>
                                </div>
                            )}

                            {/* Info card if not subscribed */}
                            {!isSubscribed && (
                                <div className="nt-action">
                                    <div className="nt-action-top">
                                        <div className="nt-action-icon" style={{ background: '#f0fdf4', fontSize: 16 }}>💚</div>
                                        <p className="nt-action-title" style={{ color: '#16a34a' }}>Privacy First</p>
                                    </div>
                                    <p className="nt-action-text">Notifications are delivered directly to your device. We never share your data with third parties.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="nt-act" style={fi(0.2)}>
                        <p className="nt-act-title">Recent Activity</p>
                        {RECENT_ACTIVITY_MOCK.map((act, i) => (
                            <div key={i} className="nt-act-row">
                                <div className="nt-act-left">
                                    <div className="nt-act-circle">{act.icon}</div>
                                    <div>
                                        <p className="nt-act-name">{act.label}</p>
                                        <p className="nt-act-sub">{act.sub}</p>
                                    </div>
                                </div>
                                <span className="nt-act-time">{act.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        </>
    );
}