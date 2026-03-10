import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';

const STATIC_RESOURCES = [
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741', region: 'US / UK / Canada / Ireland', available: '24/7', type: 'text', color: '#7c3aed' },
    { name: 'Suicide Prevention Lifeline', contact: 'Call or Text 988', region: 'United States', available: '24/7', type: 'call', color: '#dc2626' },
    { name: 'Samaritans', contact: '116 123', region: 'UK & Ireland', available: '24/7', type: 'call', color: '#059669' },
    { name: 'Lifeline Australia', contact: '13 11 14', region: 'Australia', available: '24/7', type: 'call', color: '#d97706' },
    { name: 'iCall', contact: '9152987821', region: 'India', available: 'Mon–Sat 8am–10pm', type: 'call', color: '#0284c7' },
    { name: 'Vandrevala Foundation', contact: '1860-2662-345', region: 'India', available: '24/7', type: 'call', color: '#0284c7' },
    { name: 'Befrienders Worldwide', contact: 'befrienders.org', region: 'Global directory', available: 'Varies', type: 'web', color: '#6366f1' },
    { name: 'IASP Crisis Centres', contact: 'iasp.info/resources', region: 'Global directory', available: 'Varies', type: 'web', color: '#6366f1' },
];

const SELF_HELP = [
    { icon: '🌬️', title: 'Box Breathing', desc: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 times.' },
    { icon: '🖐️', title: '5-4-3-2-1 Grounding', desc: 'Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.' },
    { icon: '🧊', title: 'Temperature Technique', desc: 'Hold an ice cube or splash cold water on your face to interrupt intense emotions.' },
    { icon: '🚶', title: 'Move Your Body', desc: 'Walk outside for 5 minutes. Physical movement can shift your mental state quickly.' },
    { icon: '📞', title: 'Call Someone', desc: 'Reach out to a friend, family member, or any of the hotlines above. You don\'t have to explain everything.' },
];

const TYPE_ICONS = { call: '📞', text: '💬', web: '🌐' };

export default function CrisisResources() {
    const [checkText, setCheckText] = useState('');
    const [checkResult, setCheckResult] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    // Self-check: user can type how they feel and get a response
    const handleSelfCheck = async (e) => {
        e.preventDefault();
        if (!checkText.trim()) return;
        setIsChecking(true);
        setCheckResult(null);
        try {
            const res = await api.post('/crisis/detect', { text: checkText });
            setCheckResult(res.data.data);
        } catch {
            setCheckResult({ isDistressed: false, error: true });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🆘 Crisis Resources</h1>
                    <p style={s.subtitle}>Help is always available. You don't have to face this alone.</p>
                </div>
                <Link to="/dashboard" style={s.backLink}>← Dashboard</Link>
            </div>

            {/* Emergency Banner */}
            <div style={s.emergencyBanner}>
                <p style={s.emergencyTitle}>⚠️ If you are in immediate danger</p>
                <p style={s.emergencyText}>Call your local emergency number immediately — <strong>911 (US)</strong>, <strong>999 (UK)</strong>, <strong>000 (AU)</strong>, <strong>112 (EU/India)</strong></p>
            </div>

            {/* Quick dial buttons */}
            <div style={s.quickDial}>
                <a href="tel:988" style={s.dialBtn('#dc2626')}>📞 988 (US Lifeline)</a>
                <a href="sms:741741&body=HOME" style={s.dialBtn('#7c3aed')}>💬 Text 741741</a>
                <a href="tel:116123" style={s.dialBtn('#059669')}>📞 116 123 (UK)</a>
            </div>

            {/* Hotlines Grid */}
            <h2 style={s.sectionTitle}>📋 Global Hotlines</h2>
            <div style={s.resourceGrid}>
                {STATIC_RESOURCES.map((r, i) => (
                    <div key={i} style={s.resourceCard(r.color)}>
                        <div style={s.resourceTop}>
                            <span style={s.typeIcon}>{TYPE_ICONS[r.type]}</span>
                            <span style={s.availBadge}>{r.available}</span>
                        </div>
                        <p style={s.resourceName}>{r.name}</p>
                        <p style={s.resourceRegion}>{r.region}</p>
                        <p style={s.resourceContact(r.color)}>{r.contact}</p>
                    </div>
                ))}
            </div>

            {/* Self-help techniques */}
            <h2 style={s.sectionTitle}>🧘 Immediate Coping Techniques</h2>
            <div style={s.selfHelpList}>
                {SELF_HELP.map((item, i) => (
                    <div key={i} style={s.selfHelpItem}>
                        <span style={s.selfHelpIcon}>{item.icon}</span>
                        <div>
                            <p style={s.selfHelpTitle}>{item.title}</p>
                            <p style={s.selfHelpDesc}>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Self-check tool */}
            <h2 style={s.sectionTitle}>💬 How Are You Feeling Right Now?</h2>
            <div style={s.checkCard}>
                <p style={s.checkDesc}>
                    Type how you're feeling and our AI will respond with support and let you know if crisis resources may help.
                </p>
                <form onSubmit={handleSelfCheck}>
                    <textarea
                        value={checkText}
                        onChange={e => setCheckText(e.target.value)}
                        placeholder="I've been feeling..."
                        style={s.textarea}
                        rows={3}
                    />
                    <button
                        type="submit"
                        disabled={isChecking || !checkText.trim()}
                        style={s.checkBtn(isChecking || !checkText.trim())}
                    >
                        {isChecking ? 'Analyzing…' : 'Check In'}
                    </button>
                </form>

                {checkResult && (
                    <div style={s.checkResult(checkResult.isDistressed)}>
                        {checkResult.error ? (
                            <p style={{ margin: 0 }}>Could not analyze right now. If you need help, please call one of the hotlines above.</p>
                        ) : checkResult.isDistressed ? (
                            <>
                                <p style={s.checkResultTitle}>💙 We hear you</p>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    It sounds like you may be going through something very difficult.
                                    Please consider reaching out to one of the hotlines above — trained counselors are ready to listen right now.
                                </p>
                                <a href="tel:988" style={s.checkCallBtn}>📞 Call 988 Now</a>
                            </>
                        ) : (
                            <>
                                <p style={s.checkResultTitle}>✅ Thanks for sharing</p>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    No immediate crisis signals detected. Remember, it's always okay to reach out to a hotline or your AI companion anytime you need support.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer note */}
            <div style={s.footer}>
                <p>💙 This platform is not a substitute for professional mental health care. If you're struggling, please reach out to a qualified professional or crisis line.</p>
            </div>
        </div>
    );
}

const s = {
    page: {
        maxWidth: '680px',
        margin: '40px auto',
        padding: '0 16px 40px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
    },
    title: {
        margin: '0 0 4px 0',
        fontSize: '26px',
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        margin: 0,
        fontSize: '14px',
        color: '#6b7280',
    },
    backLink: {
        textDecoration: 'none',
        color: '#6366f1',
        fontWeight: '600',
        fontSize: '13px',
    },
    emergencyBanner: {
        backgroundColor: '#fef2f2',
        border: '2px solid #dc2626',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
    },
    emergencyTitle: {
        margin: '0 0 4px 0',
        fontWeight: '700',
        color: '#dc2626',
        fontSize: '15px',
    },
    emergencyText: {
        margin: 0,
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.5',
    },
    quickDial: {
        display: 'flex',
        gap: '10px',
        marginBottom: '28px',
        flexWrap: 'wrap',
    },
    dialBtn: (color) => ({
        flex: 1,
        display: 'block',
        textAlign: 'center',
        padding: '12px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '14px',
        minWidth: '130px',
    }),
    sectionTitle: {
        fontSize: '17px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 14px 0',
    },
    resourceGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '32px',
    },
    resourceCard: (color) => ({
        backgroundColor: 'white',
        border: `1px solid #e5e7eb`,
        borderLeft: `4px solid ${color}`,
        borderRadius: '10px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }),
    resourceTop: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
    },
    typeIcon: { fontSize: '16px' },
    availBadge: {
        fontSize: '11px',
        backgroundColor: '#f0fdf4',
        color: '#16a34a',
        padding: '2px 8px',
        borderRadius: '20px',
        fontWeight: '600',
    },
    resourceName: {
        margin: '0 0 2px 0',
        fontWeight: '700',
        fontSize: '14px',
        color: '#111827',
    },
    resourceRegion: {
        margin: '0 0 6px 0',
        fontSize: '12px',
        color: '#9ca3af',
    },
    resourceContact: (color) => ({
        margin: 0,
        fontWeight: '700',
        fontSize: '14px',
        color: color,
    }),
    selfHelpList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '32px',
    },
    selfHelpItem: {
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '14px',
    },
    selfHelpIcon: { fontSize: '24px', flexShrink: 0 },
    selfHelpTitle: {
        margin: '0 0 4px 0',
        fontWeight: '700',
        fontSize: '14px',
        color: '#111827',
    },
    selfHelpDesc: {
        margin: 0,
        fontSize: '13px',
        color: '#6b7280',
        lineHeight: '1.5',
    },
    checkCard: {
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    },
    checkDesc: {
        margin: '0 0 14px 0',
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        boxSizing: 'border-box',
        fontSize: '14px',
        fontFamily: "'Segoe UI', sans-serif",
        resize: 'none',
        outline: 'none',
        marginBottom: '12px',
    },
    checkBtn: (disabled) => ({
        width: '100%',
        padding: '11px',
        backgroundColor: disabled ? '#e5e7eb' : '#6366f1',
        color: disabled ? '#9ca3af' : 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '700',
        fontSize: '14px',
    }),
    checkResult: (distressed) => ({
        marginTop: '16px',
        padding: '16px',
        backgroundColor: distressed ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${distressed ? '#fecaca' : '#bbf7d0'}`,
        borderRadius: '10px',
        color: '#111827',
    }),
    checkResultTitle: {
        margin: '0 0 8px 0',
        fontWeight: '700',
        fontSize: '15px',
    },
    checkCallBtn: {
        display: 'inline-block',
        marginTop: '8px',
        padding: '10px 20px',
        backgroundColor: '#dc2626',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '14px',
    },
    footer: {
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '10px',
        padding: '14px',
        fontSize: '13px',
        color: '#1e40af',
        lineHeight: '1.6',
        textAlign: 'center',
    },
};