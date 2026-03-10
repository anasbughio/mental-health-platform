import { useState } from 'react';

const RESOURCES = [
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741', region: 'US/UK/Canada', available: '24/7' },
    { name: 'Suicide Prevention Lifeline', contact: 'Call/Text 988', region: 'United States', available: '24/7' },
    { name: 'Samaritans', contact: '116 123', region: 'UK & Ireland', available: '24/7' },
    { name: 'Lifeline Australia', contact: '13 11 14', region: 'Australia', available: '24/7' },
    { name: 'iCall', contact: '9152987821', region: 'India', available: 'Mon–Sat 8am–10pm' },
    { name: 'Befrienders Worldwide', contact: 'befrienders.org', region: 'Global', available: 'Varies' },
];

export default function CrisisBanner({ severity = 'moderate', onDismiss }) {
    const [expanded, setExpanded] = useState(false);

    const isSerious = severity === 'severe';

    return (
        <div style={s.overlay}>
            <div style={s.banner(isSerious)}>
                {/* Header */}
                <div style={s.bannerHeader}>
                    <div style={s.headerLeft}>
                        <span style={s.icon}>🆘</span>
                        <div>
                            <p style={s.bannerTitle}>You're not alone</p>
                            <p style={s.bannerSubtitle}>
                                It sounds like you may be going through something really difficult.
                                Trained counselors are available right now to help.
                            </p>
                        </div>
                    </div>
                    {!isSerious && (
                        <button onClick={onDismiss} style={s.dismissBtn} title="Dismiss">✕</button>
                    )}
                </div>

                {/* Quick action */}
                <div style={s.quickAction}>
                    <a href="tel:988" style={s.callBtn}>📞 Call 988 Now (US)</a>
                    <a href="sms:741741&body=HOME" style={s.textBtn}>💬 Text HOME to 741741</a>
                </div>

                {/* Expand more resources */}
                <button style={s.expandBtn} onClick={() => setExpanded(!expanded)}>
                    {expanded ? '▲ Hide resources' : '▼ More crisis resources worldwide'}
                </button>

                {expanded && (
                    <div style={s.resourceList}>
                        {RESOURCES.map((r, i) => (
                            <div key={i} style={s.resourceItem}>
                                <div style={s.resourceLeft}>
                                    <p style={s.resourceName}>{r.name}</p>
                                    <p style={s.resourceRegion}>{r.region} · {r.available}</p>
                                </div>
                                <span style={s.resourceContact}>{r.contact}</span>
                            </div>
                        ))}
                        <p style={s.resourceNote}>
                            🌍 Find a local helpline at{' '}
                            <a href="https://www.befrienders.org" target="_blank" rel="noreferrer" style={{ color: '#dc2626' }}>
                                befrienders.org
                            </a>
                        </p>
                    </div>
                )}

                {/* Reassurance */}
                <p style={s.reassurance}>
                    💙 This AI companion cares about your wellbeing. Reaching out to a real person is always a good idea.
                </p>
            </div>
        </div>
    );
}

const s = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
    },
    banner: (serious) => ({
        backgroundColor: 'white',
        borderTop: `4px solid ${serious ? '#dc2626' : '#f97316'}`,
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: "'Segoe UI', sans-serif",
    }),
    bannerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        gap: '12px',
    },
    headerLeft: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        flex: 1,
    },
    icon: {
        fontSize: '28px',
        flexShrink: 0,
    },
    bannerTitle: {
        margin: '0 0 4px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
    },
    bannerSubtitle: {
        margin: 0,
        fontSize: '14px',
        color: '#4b5563',
        lineHeight: '1.5',
    },
    dismissBtn: {
        background: 'none',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#9ca3af',
        fontSize: '14px',
        padding: '4px 8px',
        flexShrink: 0,
    },
    quickAction: {
        display: 'flex',
        gap: '10px',
        marginBottom: '16px',
        flexWrap: 'wrap',
    },
    callBtn: {
        flex: 1,
        display: 'block',
        textAlign: 'center',
        padding: '12px',
        backgroundColor: '#dc2626',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '14px',
        minWidth: '140px',
    },
    textBtn: {
        flex: 1,
        display: 'block',
        textAlign: 'center',
        padding: '12px',
        backgroundColor: '#f97316',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '14px',
        minWidth: '140px',
    },
    expandBtn: {
        background: 'none',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#6b7280',
        fontSize: '13px',
        padding: '8px 12px',
        width: '100%',
        marginBottom: '12px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    resourceList: {
        backgroundColor: '#fafafa',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '12px',
        border: '1px solid #f3f4f6',
    },
    resourceItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #f3f4f6',
        gap: '12px',
    },
    resourceLeft: { flex: 1 },
    resourceName: {
        margin: '0 0 2px 0',
        fontSize: '13px',
        fontWeight: '600',
        color: '#111827',
    },
    resourceRegion: {
        margin: 0,
        fontSize: '12px',
        color: '#9ca3af',
    },
    resourceContact: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#dc2626',
        flexShrink: 0,
    },
    resourceNote: {
        margin: '10px 0 0 0',
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center',
    },
    reassurance: {
        margin: '12px 0 0 0',
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: '1.5',
        padding: '12px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
    },
};