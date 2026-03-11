import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

// Convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
    return { value: `${h}:00`, label };
});

export default function Notifications() {
    const [settings, setSettings]         = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading]       = useState(true);
    const [isSaving, setIsSaving]         = useState(false);
    const [isTesting, setIsTesting]       = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00');
    const [enabled, setEnabled]           = useState(true);
    const [permissionState, setPermissionState] = useState('default'); // 'default'|'granted'|'denied'
    const [successMsg, setSuccessMsg]     = useState('');
    const [error, setError]               = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        checkPermission();
        fetchSettings();
    }, []);

    const checkPermission = async () => {
        if (!('Notification' in window)) return;
        setPermissionState(Notification.permission);

        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                const sub = await reg.pushManager.getSubscription();
                setIsSubscribed(!!sub);
            }
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
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnable = async () => {
        setError('');
        try {
            // 1. Request notification permission
            const permission = await Notification.requestPermission();
            setPermissionState(permission);
            if (permission !== 'granted') {
                setError('Permission denied. Please enable notifications in your browser settings.');
                return;
            }

            // 2. Register service worker
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // 3. Get VAPID public key
            const keyRes = await api.get('/notifications/vapid-public-key');
            const vapidKey = urlBase64ToUint8Array(keyRes.data.data.publicKey);

            // 4. Subscribe to push
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey,
            });

            // 5. Send subscription to backend
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await api.post('/notifications/subscribe', {
                subscription: subscription.toJSON(),
                reminderTime,
                timezone,
            });

            setIsSubscribed(true);
            showSuccess('✅ Notifications enabled! You\'ll receive a daily check-in reminder.');
            fetchSettings();

        } catch (err) {
            console.error('Subscribe error:', err);
            setError('Failed to enable notifications. Make sure you\'re using HTTPS.');
        }
    };

    const handleDisable = async () => {
        setError('');
        try {
            // Unsubscribe from push manager
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                    const sub = await reg.pushManager.getSubscription();
                    if (sub) await sub.unsubscribe();
                }
            }
            await api.delete('/notifications/unsubscribe');
            setIsSubscribed(false);
            setSettings(null);
            showSuccess('Notifications disabled.');
        } catch (err) {
            setError('Failed to disable notifications.');
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setError('');
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await api.patch('/notifications/settings', {
                reminderTime,
                reminderEnabled: enabled,
                timezone,
            });
            showSuccess('✅ Settings saved!');
            fetchSettings();
        } catch {
            setError('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setError('');
        try {
            await api.post('/notifications/send-test');
            showSuccess('📬 Test notification sent! Check your notifications.');
        } catch {
            setError('Failed to send test. Make sure notifications are enabled.');
        } finally {
            setIsTesting(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const notSupported = !('Notification' in window) || !('serviceWorker' in navigator);

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🔔 Reminders</h1>
                    <p style={s.subtitle}>Daily check-in push notifications</p>
                </div>
                <Link to="/dashboard" style={s.link}>← Dashboard</Link>
            </div>

            {successMsg && <div style={s.successBox}>{successMsg}</div>}
            {error      && <div style={s.errorBox}>{error}</div>}

            {/* Not supported */}
            {notSupported && (
                <div style={s.warningCard}>
                    <p style={s.warningTitle}>⚠️ Push Notifications Not Supported</p>
                    <p style={s.warningText}>
                        Your browser doesn't support push notifications. Try Chrome, Edge, or Firefox on desktop or Android.
                        Safari on iOS 16.4+ also supports this.
                    </p>
                </div>
            )}

            {/* Permission denied */}
            {!notSupported && permissionState === 'denied' && (
                <div style={s.warningCard}>
                    <p style={s.warningTitle}>🚫 Notifications Blocked</p>
                    <p style={s.warningText}>
                        You've blocked notifications for this site. To re-enable:
                    </p>
                    <ol style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>
                        <li>Click the lock icon in your browser's address bar</li>
                        <li>Find "Notifications" and set it to "Allow"</li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
            )}

            {!notSupported && permissionState !== 'denied' && (
                <>
                    {/* Status Card */}
                    <div style={s.statusCard(isSubscribed)}>
                        <div style={s.statusLeft}>
                            <span style={{ fontSize: '32px' }}>{isSubscribed ? '🔔' : '🔕'}</span>
                            <div>
                                <p style={s.statusTitle}>
                                    {isSubscribed ? 'Notifications Active' : 'Notifications Off'}
                                </p>
                                <p style={s.statusSubtitle}>
                                    {isSubscribed
                                        ? `Daily reminder at ${settings?.reminderTime || reminderTime}`
                                        : 'Enable to get daily mood check-in reminders'}
                                </p>
                            </div>
                        </div>
                        <div style={s.statusDot(isSubscribed)} />
                    </div>

                    {/* How it works — shown before subscribing */}
                    {!isSubscribed && (
                        <div style={s.howItWorksCard}>
                            <p style={s.howTitle}>How it works</p>
                            <div style={s.howSteps}>
                                {[
                                    { icon: '⏰', text: 'Set your preferred daily reminder time' },
                                    { icon: '📲', text: 'Get a push notification on your device' },
                                    { icon: '📝', text: 'Tap to open the app and log your mood' },
                                    { icon: '📈', text: 'Build a streak and track your progress' },
                                ].map((step, i) => (
                                    <div key={i} style={s.howStep}>
                                        <span style={{ fontSize: '20px' }}>{step.icon}</span>
                                        <p style={s.howStepText}>{step.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Settings Form */}
                    <div style={s.settingsCard}>
                        <p style={s.settingsTitle}>⚙️ Reminder Settings</p>

                        {/* Time picker */}
                        <label style={s.label}>Reminder Time</label>
                        <select
                            value={reminderTime}
                            onChange={e => setReminderTime(e.target.value)}
                            style={s.select}
                        >
                            {HOURS.map(h => (
                                <option key={h.value} value={h.value}>{h.label}</option>
                            ))}
                        </select>

                        {/* Enable toggle */}
                        {isSubscribed && (
                            <div style={s.toggleRow}>
                                <div>
                                    <p style={s.toggleLabel}>Reminders Enabled</p>
                                    <p style={s.toggleSubLabel}>Temporarily pause without unsubscribing</p>
                                </div>
                                <button
                                    onClick={() => setEnabled(!enabled)}
                                    style={s.toggle(enabled)}
                                >
                                    <div style={s.toggleThumb(enabled)} />
                                </button>
                            </div>
                        )}

                        {/* Timezone info */}
                        <p style={s.timezoneNote}>
                            🌍 Detected timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </p>

                        {/* Action buttons */}
                        {!isSubscribed ? (
                            <button onClick={handleEnable} style={s.primaryBtn(false)}>
                                🔔 Enable Daily Reminders
                            </button>
                        ) : (
                            <div style={s.btnRow}>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    style={s.primaryBtn(isSaving)}
                                >
                                    {isSaving ? 'Saving…' : '💾 Save Settings'}
                                </button>
                                <button
                                    onClick={handleTest}
                                    disabled={isTesting}
                                    style={s.secondaryBtn}
                                >
                                    {isTesting ? 'Sending…' : '📬 Send Test'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Disable section */}
                    {isSubscribed && (
                        <div style={s.dangerCard}>
                            <p style={s.dangerTitle}>Disable Notifications</p>
                            <p style={s.dangerText}>This will remove your subscription. You can re-enable anytime.</p>
                            <button onClick={handleDisable} style={s.dangerBtn}>
                                🔕 Disable Notifications
                            </button>
                        </div>
                    )}

                    {/* Last sent info */}
                    {settings?.lastSentAt && (
                        <p style={s.lastSent}>
                            Last reminder sent: {new Date(settings.lastSentAt).toLocaleString()}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

const s = {
    page: { maxWidth: '560px', margin: '40px auto', padding: '0 16px 40px', fontFamily: "'Segoe UI', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' },
    subtitle: { margin: 0, fontSize: '14px', color: '#6b7280' },
    link: { textDecoration: 'none', color: '#6366f1', fontWeight: '600', fontSize: '13px' },
    successBox: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '16px' },
    errorBox:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
    warningCard: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
    warningTitle: { margin: '0 0 8px', fontWeight: '700', color: '#a16207', fontSize: '15px' },
    warningText: { margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' },
    statusCard: (active) => ({ backgroundColor: active ? '#f0fdf4' : '#f9fafb', border: `1px solid ${active ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '14px', padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
    statusLeft: { display: 'flex', gap: '14px', alignItems: 'center' },
    statusTitle: { margin: '0 0 2px', fontWeight: '700', fontSize: '16px', color: '#111827' },
    statusSubtitle: { margin: 0, fontSize: '13px', color: '#6b7280' },
    statusDot: (active) => ({ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: active ? '#22c55e' : '#d1d5db', flexShrink: 0 }),
    howItWorksCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
    howTitle: { margin: '0 0 14px', fontWeight: '700', fontSize: '14px', color: '#374151' },
    howSteps: { display: 'flex', flexDirection: 'column', gap: '10px' },
    howStep: { display: 'flex', gap: '12px', alignItems: 'center' },
    howStepText: { margin: 0, fontSize: '14px', color: '#374151' },
    settingsCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    settingsTitle: { margin: '0 0 18px', fontWeight: '700', fontSize: '15px', color: '#111827' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    select: { width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', marginBottom: '16px', outline: 'none', backgroundColor: 'white', fontFamily: 'inherit' },
    toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid #f3f4f6', marginBottom: '12px' },
    toggleLabel: { margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#374151' },
    toggleSubLabel: { margin: 0, fontSize: '12px', color: '#9ca3af' },
    toggle: (on) => ({ width: '48px', height: '26px', borderRadius: '13px', backgroundColor: on ? '#6366f1' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }),
    toggleThumb: (on) => ({ position: 'absolute', top: '3px', left: on ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }),
    timezoneNote: { fontSize: '12px', color: '#9ca3af', margin: '0 0 16px' },
    primaryBtn: (disabled) => ({ width: '100%', padding: '12px', backgroundColor: disabled ? '#e5e7eb' : '#6366f1', color: disabled ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' }),
    btnRow: { display: 'flex', gap: '10px' },
    secondaryBtn: { flex: 1, padding: '12px', backgroundColor: 'white', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' },
    dangerCard: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
    dangerTitle: { margin: '0 0 6px', fontWeight: '700', fontSize: '14px', color: '#dc2626' },
    dangerText: { margin: '0 0 14px', fontSize: '13px', color: '#374151' },
    dangerBtn: { padding: '10px 20px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' },
    lastSent: { fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0 },
};