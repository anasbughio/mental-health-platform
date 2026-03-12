import { useState } from 'react';
import {
    deriveKey, savePasswordToSession, hasEncryptionSetup, clearEncryptionSession
} from '../utils/crypto';

// ── EncryptionSetup modal ─────────────────────────────────────────────────────
// Shown when user opens chat without an active encryption key.
// props: { userId, onReady(key), onSkip }
export default function EncryptionSetup({ userId, onReady, onSkip }) {
    const [mode, setMode]         = useState('choice'); // 'choice'|'setup'|'unlock'
    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]       = useState('');
    const [strength, setStrength] = useState(0); // 0-4

    const checkStrength = (pw) => {
        let s = 0;
        if (pw.length >= 8)  s++;
        if (pw.length >= 12) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9!@#$%^&*]/.test(pw)) s++;
        setStrength(s);
    };

    const handleSetup = async () => {
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        setIsLoading(true);
        setError('');
        try {
            const key = await deriveKey(password, userId);
            savePasswordToSession(password);
            onReady(key);
        } catch {
            setError('Failed to set up encryption. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (!password) { setError('Enter your encryption password.'); return; }
        setIsLoading(true);
        setError('');
        try {
            const key = await deriveKey(password, userId);
            savePasswordToSession(password);
            onReady(key);
        } catch {
            setError('Failed to unlock. Check your password.');
        } finally {
            setIsLoading(false);
        }
    };

    const STRENGTH_COLORS = ['#e5e7eb', '#dc2626', '#f59e0b', '#84cc16', '#16a34a'];
    const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
        <div style={s.overlay}>
            <div style={s.modal}>
                {/* Header */}
                <div style={s.modalHeader}>
                    <span style={{ fontSize: 32 }}>🔒</span>
                    <h2 style={s.modalTitle}>End-to-End Encrypted Chat</h2>
                    <p style={s.modalSubtitle}>
                        Your messages are encrypted in your browser before being stored.
                        Even we can't read them.
                    </p>
                </div>

                {/* Choice screen */}
                {mode === 'choice' && (
                    <div style={s.choiceGrid}>
                        <button onClick={() => setMode('setup')} style={s.choiceBtn('#6366f1')}>
                            <span style={{ fontSize: 28 }}>🔑</span>
                            <strong>Set up encryption</strong>
                            <span style={s.choiceSub}>First time — create a password to encrypt your chats</span>
                        </button>
                        <button onClick={() => setMode('unlock')} style={s.choiceBtn('#7c3aed')}>
                            <span style={{ fontSize: 28 }}>🔓</span>
                            <strong>Unlock</strong>
                            <span style={s.choiceSub}>Enter your existing encryption password</span>
                        </button>
                    </div>
                )}

                {/* Setup screen */}
                {mode === 'setup' && (
                    <div>
                        <div style={s.warningBox}>
                            ⚠️ <strong>Important:</strong> This password is never sent to our servers. If you forget it, your chat history cannot be recovered.
                        </div>

                        <label style={s.label}>Encryption Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); checkStrength(e.target.value); }}
                            placeholder="Create a strong password"
                            style={s.input}
                            autoFocus
                        />

                        {/* Strength meter */}
                        {password.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                    {[1,2,3,4].map(i => (
                                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : '#e5e7eb', transition: 'background 0.2s' }} />
                                    ))}
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: STRENGTH_COLORS[strength], fontWeight: 600 }}>
                                    {STRENGTH_LABELS[strength]}
                                </p>
                            </div>
                        )}

                        <label style={s.label}>Confirm Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Repeat your password"
                            style={{ ...s.input, borderColor: confirm && confirm !== password ? '#dc2626' : '#e5e7eb' }}
                            onKeyDown={e => e.key === 'Enter' && handleSetup()}
                        />

                        {error && <p style={s.error}>{error}</p>}

                        <button onClick={handleSetup} disabled={isLoading} style={s.primaryBtn(isLoading)}>
                            {isLoading ? '🔐 Generating key…' : '🔐 Enable Encryption'}
                        </button>
                        <button onClick={() => { setMode('choice'); setError(''); setPassword(''); setConfirm(''); }} style={s.backBtn}>← Back</button>
                    </div>
                )}

                {/* Unlock screen */}
                {mode === 'unlock' && (
                    <div>
                        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>
                            Enter the password you set up when you first enabled encryption.
                        </p>

                        <label style={s.label}>Encryption Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Your encryption password"
                            style={s.input}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                        />

                        {error && <p style={s.error}>{error}</p>}

                        <button onClick={handleUnlock} disabled={isLoading} style={s.primaryBtn(isLoading)}>
                            {isLoading ? '🔓 Unlocking…' : '🔓 Unlock Chat'}
                        </button>
                        <button onClick={() => { setMode('choice'); setError(''); setPassword(''); }} style={s.backBtn}>← Back</button>
                    </div>
                )}

                {/* Skip option */}
                <div style={s.skipRow}>
                    <button onClick={onSkip} style={s.skipBtn}>
                        Skip encryption — use unencrypted chat
                    </button>
                </div>

                {/* How it works */}
                <div style={s.howBox}>
                    <p style={s.howTitle}>🔬 How it works</p>
                    <div style={s.howGrid}>
                        {[
                            ['🔑', 'Your password → AES-256 key (PBKDF2, 310k iterations)'],
                            ['💬', 'Messages encrypted in browser before leaving your device'],
                            ['🗄️', 'Server stores only encrypted ciphertext'],
                            ['🔓', 'Decrypted locally when you open chat'],
                        ].map(([icon, text]) => (
                            <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                                <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const s = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modal: { backgroundColor: 'white', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    modalHeader: { textAlign: 'center', marginBottom: 24 },
    modalTitle: { margin: '12px 0 8px', fontSize: 20, fontWeight: 800, color: '#111827' },
    modalSubtitle: { margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
    choiceGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
    choiceBtn: (color) => ({ display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 20px', backgroundColor: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#111827', transition: 'background 0.15s' }),
    choiceSub: { fontSize: 12, color: '#6b7280', fontWeight: 400 },
    warningBox: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#78350f', lineHeight: 1.6, marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
    input: { width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 10, boxSizing: 'border-box', fontSize: 14, marginBottom: 14, outline: 'none', fontFamily: 'inherit' },
    error: { color: '#dc2626', fontSize: 13, margin: '0 0 12px', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca' },
    primaryBtn: (disabled) => ({ width: '100%', padding: 13, backgroundColor: disabled ? '#e5e7eb' : '#6366f1', color: disabled ? '#9ca3af' : 'white', border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', marginBottom: 10 }),
    backBtn: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 },
    skipRow: { borderTop: '1px solid #f3f4f6', marginTop: 16, paddingTop: 14, textAlign: 'center' },
    skipBtn: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' },
    howBox: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginTop: 16 },
    howTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151' },
    howGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
};