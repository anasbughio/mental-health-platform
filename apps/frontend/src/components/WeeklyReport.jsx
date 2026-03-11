import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

const TREND_CONFIG = {
    improving:         { icon: '📈', label: 'Improving',         color: '#16a34a', bg: '#f0fdf4' },
    declining:         { icon: '📉', label: 'Declining',         color: '#dc2626', bg: '#fef2f2' },
    stable:            { icon: '➡️', label: 'Stable',            color: '#6b7280', bg: '#f9fafb' },
    insufficient_data: { icon: '📊', label: 'Not enough data',   color: '#9ca3af', bg: '#f9fafb' },
};

const WELLNESS_COLORS = (score) => {
    if (!score) return '#9ca3af';
    if (score >= 8) return '#16a34a';
    if (score >= 6) return '#84cc16';
    if (score >= 4) return '#f59e0b';
    return '#dc2626';
};

const formatWeekRange = (start, end) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
};

const Section = ({ icon, title, content, bgColor = '#f9fafb', borderColor = '#e5e7eb' }) => (
    <div style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '18px', marginBottom: '14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {icon} {title}
        </p>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: '#1f2937', whiteSpace: 'pre-line' }}>
            {content}
        </p>
    </div>
);

export default function WeeklyReport() {
    const [report, setReport]           = useState(null);
    const [pastReports, setPastReports] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading]     = useState(true);
    const [activeTab, setActiveTab]     = useState('current');  // 'current' | 'history'
    const [selectedPast, setSelectedPast] = useState(null);
    const [error, setError]             = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchLatest(); }, []);
    useEffect(() => { if (activeTab === 'history') fetchPastReports(); }, [activeTab]);

    const fetchLatest = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/weekly-report/latest');
            setReport(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPastReports = async () => {
        try {
            const res = await api.get('/weekly-report');
            setPastReports(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const res = await api.post('/weekly-report/generate');
            if (res.data.data.hasData === false) {
                setError('No activity logged this week yet. Log some moods or journal entries first!');
            } else {
                setReport(res.data.data.report);
            }
        } catch (err) {
            setError('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const displayReport = activeTab === 'history' && selectedPast ? selectedPast : report;

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>📊 Weekly Report</h1>
                    <p style={s.subtitle}>Your AI-generated mental health summary</p>
                </div>
                <div style={s.headerLinks}>
                    <Link to="/dashboard" style={s.link}>← Dashboard</Link>
                    <Link to="/sentiment" style={s.link}>🧬 Insights</Link>
                </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            {/* Tabs */}
            <div style={s.tabs}>
                <button style={s.tab(activeTab === 'current')} onClick={() => setActiveTab('current')}>
                    📋 This Week
                </button>
                <button style={s.tab(activeTab === 'history')} onClick={() => setActiveTab('history')}>
                    🗂 Past Reports
                </button>
            </div>

            {/* ══ CURRENT WEEK TAB ══ */}
            {activeTab === 'current' && (
                <>
                    {isLoading ? (
                        <div style={s.emptyState}>⏳ Loading…</div>
                    ) : !report ? (
                        /* No report yet */
                        <div style={s.emptyCard}>
                            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📭</p>
                            <p style={s.emptyTitle}>No report for this week yet</p>
                            <p style={s.emptySubtitle}>
                                Generate your weekly AI mental health summary. It pulls together your mood logs,
                                journal entries, and sentiment data into one personalized report.
                            </p>
                            <button onClick={handleGenerate} disabled={isGenerating} style={s.generateBtn(isGenerating)}>
                                {isGenerating ? '✨ Generating your report…' : '✨ Generate This Week\'s Report'}
                            </button>
                            {isGenerating && (
                                <p style={s.generatingNote}>
                                    This takes 10–20 seconds — AI is reading your week…
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Report exists */
                        <ReportView
                            report={report}
                            onRegenerate={handleGenerate}
                            isGenerating={isGenerating}
                        />
                    )}
                </>
            )}

            {/* ══ HISTORY TAB ══ */}
            {activeTab === 'history' && (
                <div>
                    {pastReports.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ fontSize: '36px', margin: '0 0 10px' }}>📭</p>
                            <p>No past reports yet. Generate your first one!</p>
                        </div>
                    ) : (
                        <>
                            {/* Week selector */}
                            <div style={s.weekList}>
                                {pastReports.map((r, i) => (
                                    <button
                                        key={r._id}
                                        onClick={() => setSelectedPast(r)}
                                        style={s.weekBtn(selectedPast?._id === r._id)}
                                    >
                                        <span style={s.weekBtnDate}>{formatWeekRange(r.weekStart, r.weekEnd)}</span>
                                        <span style={{ ...s.weekBtnScore, color: WELLNESS_COLORS(r.wellnessScore) }}>
                                            {r.wellnessScore ? `${r.wellnessScore}/10` : '—'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {selectedPast && <ReportView report={selectedPast} />}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Reusable Report View Component ────────────────────────────────────────────
function ReportView({ report, onRegenerate, isGenerating }) {
    const stats = report.stats || {};
    const sections = report.report || {};
    const trend = TREND_CONFIG[stats.moodTrend] || TREND_CONFIG.insufficient_data;

    return (
        <div>
            {/* Report header card */}
            <div style={s.reportHeaderCard}>
                <div style={s.reportHeaderTop}>
                    <div>
                        <p style={s.reportWeekLabel}>WEEK OF</p>
                        <p style={s.reportWeekRange}>{formatWeekRange(report.weekStart, report.weekEnd)}</p>
                    </div>
                    {/* Wellness score circle */}
                    {report.wellnessScore && (
                        <div style={s.scoreCircle(WELLNESS_COLORS(report.wellnessScore))}>
                            <span style={s.scoreNum}>{report.wellnessScore}</span>
                            <span style={s.scoreDen}>/10</span>
                        </div>
                    )}
                </div>

                {/* Stats row */}
                <div style={s.statsRow}>
                    <div style={s.statBox}>
                        <span style={s.statNum}>{stats.totalMoodLogs ?? 0}</span>
                        <span style={s.statLbl}>Mood Logs</span>
                    </div>
                    <div style={s.statBox}>
                        <span style={s.statNum}>{stats.totalJournalEntries ?? 0}</span>
                        <span style={s.statLbl}>Journal Entries</span>
                    </div>
                    <div style={s.statBox}>
                        <span style={s.statNum}>{stats.avgMoodScore ?? '—'}</span>
                        <span style={s.statLbl}>Avg Mood</span>
                    </div>
                    <div style={s.statBox}>
                        <span style={{ ...s.statNum, color: trend.color }}>{trend.icon}</span>
                        <span style={s.statLbl}>{trend.label}</span>
                    </div>
                </div>

                {/* Emotions */}
                {stats.topEmotions?.length > 0 && (
                    <div style={s.emotionsRow}>
                        <span style={s.emotionsLabel}>Top emotions: </span>
                        {stats.topEmotions.map(e => (
                            <span key={e} style={s.emotionChip}>{e}</span>
                        ))}
                    </div>
                )}

                {/* Best/worst day */}
                {stats.bestDay && (
                    <div style={s.daysRow}>
                        <span style={s.bestDay}>✅ Best: {stats.bestDay}</span>
                        {stats.worstDay && stats.worstDay !== stats.bestDay && (
                            <span style={s.worstDay}>⚠️ Hardest: {stats.worstDay}</span>
                        )}
                    </div>
                )}

                {/* Crisis flag warning */}
                {stats.crisisFlags > 0 && (
                    <div style={s.crisisWarn}>
                        ⚠️ {stats.crisisFlags} crisis signal{stats.crisisFlags > 1 ? 's' : ''} detected this week.{' '}
                        <Link to="/crisis" style={{ color: '#dc2626', fontWeight: '700' }}>View Resources →</Link>
                    </div>
                )}
            </div>

            {/* AI Report Sections */}
            {sections.summary && (
                <Section icon="📝" title="Weekly Summary" content={sections.summary} bgColor="#f0f4ff" borderColor="#c7d2fe" />
            )}
            {sections.highlights && (
                <Section icon="⭐" title="Highlights" content={sections.highlights} bgColor="#f0fdf4" borderColor="#bbf7d0" />
            )}
            {sections.challenges && (
                <Section icon="💙" title="Challenges" content={sections.challenges} bgColor="#fefce8" borderColor="#fde68a" />
            )}
            {sections.patterns && (
                <Section icon="🔍" title="Patterns Noticed" content={sections.patterns} bgColor="#faf5ff" borderColor="#e9d5ff" />
            )}
            {sections.recommendations && (
                <Section icon="🎯" title="Recommendations for Next Week" content={sections.recommendations} bgColor="#fff7ed" borderColor="#fed7aa" />
            )}
            {sections.affirmation && (
                <div style={s.affirmationCard}>
                    <p style={s.affirmationText}>💛 {sections.affirmation}</p>
                </div>
            )}

            {/* Regenerate button */}
            {onRegenerate && (
                <button onClick={onRegenerate} disabled={isGenerating} style={s.regenBtn(isGenerating)}>
                    {isGenerating ? '✨ Regenerating…' : '🔄 Regenerate Report'}
                </button>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    page: { maxWidth: '680px', margin: '40px auto', padding: '0 16px 40px', fontFamily: "'Segoe UI', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' },
    subtitle: { margin: 0, fontSize: '14px', color: '#6b7280' },
    headerLinks: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
    link: { textDecoration: 'none', color: '#6366f1', fontWeight: '600', fontSize: '13px' },
    errorBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
    tabs: { display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '24px' },
    tab: (active) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', backgroundColor: active ? 'white' : 'transparent', color: active ? '#6366f1' : '#6b7280', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }),
    emptyState: { textAlign: 'center', padding: '60px 0', color: '#9ca3af' },
    emptyCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px 28px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 10px' },
    emptySubtitle: { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 24px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' },
    generateBtn: (disabled) => ({ padding: '13px 28px', backgroundColor: disabled ? '#e5e7eb' : '#6366f1', color: disabled ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '700', transition: 'background 0.2s' }),
    generatingNote: { color: '#9ca3af', fontSize: '13px', marginTop: '12px' },
    reportHeaderCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '22px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    reportHeaderTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    reportWeekLabel: { margin: '0 0 2px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase' },
    reportWeekRange: { margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827' },
    scoreCircle: (color) => ({ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${color}15`, border: `3px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
    scoreNum: { fontSize: '20px', fontWeight: '800', color: '#111827', lineHeight: 1 },
    scoreDen: { fontSize: '11px', color: '#9ca3af', lineHeight: 1 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' },
    statBox: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', border: '1px solid #f3f4f6' },
    statNum: { display: 'block', fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '2px' },
    statLbl: { fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' },
    emotionsRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
    emotionsLabel: { fontSize: '12px', color: '#6b7280', fontWeight: '600' },
    emotionChip: { fontSize: '12px', backgroundColor: '#ede9fe', color: '#7c3aed', padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' },
    daysRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    bestDay: { fontSize: '13px', color: '#16a34a', fontWeight: '500' },
    worstDay: { fontSize: '13px', color: '#d97706', fontWeight: '500' },
    crisisWarn: { marginTop: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', fontWeight: '500' },
    affirmationCard: { backgroundColor: '#fffbeb', border: '2px solid #fde68a', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '14px' },
    affirmationText: { margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#78350f', fontStyle: 'italic', fontWeight: '500' },
    regenBtn: (disabled) => ({ width: '100%', padding: '12px', backgroundColor: disabled ? '#f3f4f6' : 'white', color: disabled ? '#9ca3af' : '#6366f1', border: `1px solid ${disabled ? '#e5e7eb' : '#c7d2fe'}`, borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px', marginTop: '4px' }),
    weekList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
    weekBtn: (active) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: active ? '#f0f4ff' : 'white', border: `1px solid ${active ? '#c7d2fe' : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }),
    weekBtnDate: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    weekBtnScore: { fontSize: '14px', fontWeight: '700' },
};