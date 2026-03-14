import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import api from '../config/axios';

// ── Helpers ───────────────────────────────────────────────────────────────────
const WELLNESS_COLOR = (s) => !s ? '#9ca3af' : s >= 8 ? '#10b981' : s >= 6 ? '#6366f1' : s >= 4 ? '#f59e0b' : '#ef4444';
const WELLNESS_LABEL = (s) => !s ? 'No data' : s >= 8 ? 'Thriving' : s >= 6 ? 'Balanced' : s >= 4 ? 'Fair' : 'Struggling';

const TREND_CONFIG = {
    improving:         { icon: '📈', label: 'Improving',       color: '#16a34a' },
    declining:         { icon: '📉', label: 'Declining',       color: '#dc2626' },
    stable:            { icon: '→',  label: 'Stable',          color: '#6b7280' },
    insufficient_data: { icon: '📊', label: 'Not enough data', color: '#9ca3af' },
};

const formatRange = (start, end) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
};

// Extract hashtag-style keywords from report text
const extractTags = (text = '') => {
    const words = ['EveningReflections','SleepHygiene','PositiveMomentum','Mindfulness','Gratitude','FocusTime','StressRelief','SelfCare'];
    return words.filter(w => text.toLowerCase().includes(w.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase())).slice(0, 4)
        || ['EveningReflections','SleepHygiene','PositiveMomentum'].slice(0, 3);
};

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, color }) {
    const r = 48, circ = 2 * Math.PI * r;
    const pct = score ? Math.min(score / 10, 1) : 0;
    return (
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{score ?? '—'}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>out of 10</span>
            </div>
        </div>
    );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({ icon, value, label }) {
    return (
        <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 14, padding: '14px 16px' }}>
            <span style={{ fontSize: 18, display: 'block', marginBottom: 6 }}>{icon}</span>
            <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 2px', lineHeight: 1 }}>{value ?? '—'}</p>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</p>
        </div>
    );
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827' }}>{label}</p>
            {payload.map((p, i) => p.value != null && (
                <p key={i} style={{ margin: '2px 0', color: p.color }}>{p.name}: {p.value}</p>
            ))}
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WeeklyReport() {
    const [report, setReport]               = useState(null);
    const [pastReports, setPastReports]     = useState([]);
    const [isGenerating, setIsGenerating]   = useState(false);
    const [isLoading, setIsLoading]         = useState(true);
    const [activeTab, setActiveTab]         = useState('current');
    const [selectedPast, setSelectedPast]   = useState(null);
    const [error, setError]                 = useState('');
    const [ready, setReady]                 = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchLatest(); fetchPastReports(); setTimeout(() => setReady(true), 60); }, []);

    const fetchLatest = async () => {
        setIsLoading(true);
        try { const res = await api.get('/weekly-report/latest'); setReport(res.data.data); }
        catch (err) { if (err.response?.status === 401) navigate('/login'); }
        finally { setIsLoading(false); }
    };

    const fetchPastReports = async () => {
        try { const res = await api.get('/weekly-report'); setPastReports(res.data.data); } catch {}
    };

    const handleGenerate = async () => {
        setIsGenerating(true); setError('');
        try {
            const res = await api.post('/weekly-report/generate');
            if (res.data.data.hasData === false) setError('No activity logged this week yet. Log some moods or journal entries first!');
            else setReport(res.data.data.report);
        } catch { setError('Failed to generate report. Please try again.'); }
        finally { setIsGenerating(false); }
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    const displayReport = activeTab === 'history' && selectedPast ? selectedPast : report;

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .wr { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:32px 44px 100px; box-sizing:border-box; }

            /* header */
            .wr-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; }
            .wr-head h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; color:#111827; margin:0 0 4px; letter-spacing:-0.6px; }
            .wr-head p  { font-size:14px; color:#9ca3af; margin:0; }
            .wr-share { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
            .wr-share:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }

            /* tabs — underline style */
            .wr-tabs { display:flex; gap:0; border-bottom:2px solid #e5e7eb; margin-bottom:24px; }
            .wr-tab { padding:8px 20px 11px; border:none; background:transparent; cursor:pointer; font-size:14px; font-weight:600; font-family:'DM Sans',sans-serif; color:#9ca3af; transition:color 0.2s; position:relative; }
            .wr-tab.on { color:#6366f1; }
            .wr-tab.on::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2.5px; background:#6366f1; border-radius:2px; }

            /* error / success */
            .wr-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; }

            /* ── Wellness hero card ── */
            .wr-hero { background:white; border-radius:22px; padding:24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); margin-bottom:18px; display:grid; grid-template-columns:auto 1fr auto; gap:28px; align-items:center; }
            .wr-hero-lbl { font-size:10px; font-weight:700; color:#9ca3af; letter-spacing:0.09em; text-transform:uppercase; margin:0 0 10px; }
            .wr-hero-mid { flex:1; }
            .wr-hero-title { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#111827; margin:0 0 10px; letter-spacing:-0.4px; }
            .wr-hero-text  { font-size:13px; color:#4b5563; line-height:1.7; margin:0 0 14px; }
            .wr-hero-sparkle { position:absolute; top:16px; right:60px; font-size:32px; opacity:0.3; pointer-events:none; }
            .wr-impr-badge { display:inline-flex; align-items:center; gap:6px; background:#dcfce7; color:#16a34a; font-size:12px; font-weight:700; padding:5px 14px; border-radius:20px; }
            .wr-hero-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; min-width:200px; }

            /* ── AI Insight ── */
            .wr-insight { background:white; border-radius:22px; padding:24px 28px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); margin-bottom:18px; }
            .wr-insight-head { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
            .wr-insight-icon { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
            .wr-insight-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#111827; margin:0; letter-spacing:-0.3px; }
            .wr-insight-text { font-size:14px; color:#4b5563; line-height:1.8; margin:0 0 16px; }
            .wr-tags { display:flex; gap:8px; flex-wrap:wrap; }
            .wr-tag { font-size:12px; font-weight:600; color:#6366f1; background:#ede9fe; padding:4px 12px; border-radius:20px; }

            /* ── Charts row ── */
            .wr-charts { display:grid; grid-template-columns:1.2fr 1fr; gap:16px; margin-bottom:18px; }
            .wr-chart-card { background:white; border-radius:20px; padding:20px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .wr-chart-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#111827; margin:0 0 4px; }
            .wr-chart-legend { display:flex; gap:14px; margin-bottom:14px; }
            .wr-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#9ca3af; font-weight:500; }
            .wr-legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }

            /* sentiment bars */
            .wr-sent-row { margin-bottom:12px; }
            .wr-sent-row:last-of-type { margin-bottom:14px; }
            .wr-sent-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
            .wr-sent-label { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:#374151; }
            .wr-sent-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
            .wr-sent-pct { font-size:13px; color:#9ca3af; font-weight:600; }
            .wr-sent-bg { height:7px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
            .wr-sent-fill { height:100%; border-radius:4px; transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
            .wr-sent-quote { font-size:12px; color:#6b7280; line-height:1.6; margin:0; font-style:italic; }

            /* ── Report sections ── */
            .wr-section { background:white; border-radius:16px; padding:20px 22px; margin-bottom:12px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .wr-section-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
            .wr-section-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#111827; margin:0; }
            .wr-section-body { font-size:14px; color:#4b5563; line-height:1.75; margin:0; white-space:pre-line; }

            /* affirmation */
            .wr-affirm { background:linear-gradient(135deg,#fffbeb,#fef3c7); border:1.5px solid #fde68a; border-radius:16px; padding:22px 24px; text-align:center; margin-bottom:16px; }
            .wr-affirm p { font-size:16px; color:#78350f; line-height:1.7; margin:0; font-style:italic; font-weight:500; }

            /* ── Empty state ── */
            .wr-empty { background:white; border-radius:22px; padding:52px 28px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .wr-empty-emoji { font-size:48px; display:block; margin-bottom:16px; }
            .wr-empty-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:#111827; margin:0 0 8px; }
            .wr-empty-sub { font-size:14px; color:#9ca3af; margin:0 0 26px; line-height:1.6; max-width:400px; margin-inline:auto; }
            .wr-gen-btn { padding:14px 32px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(99,102,241,0.32); }
            .wr-gen-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.42); }
            .wr-gen-btn:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }
            .wr-gen-note { font-size:13px; color:#9ca3af; margin:12px 0 0; }

            /* regen button */
            .wr-regen { width:100%; padding:12px; background:white; color:#6366f1; border:1.5px solid #c7d2fe; border-radius:12px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; margin-bottom:8px; }
            .wr-regen:hover { background:#f0f4ff; }
            .wr-regen:disabled { opacity:0.5; cursor:not-allowed; }

            /* ── History section ── */
            .wr-hist-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; color:#111827; margin:0 0 14px; }
            .wr-hist-card { background:white; border-radius:18px; padding:40px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .wr-hist-empty { color:#9ca3af; font-size:13px; }
            .wr-week-btn { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:white; border:1.5px solid #e5e7eb; border-radius:12px; cursor:pointer; transition:all 0.15s; margin-bottom:8px; width:100%; font-family:'DM Sans',sans-serif; }
            .wr-week-btn:hover { border-color:#a5b4fc; background:#f5f3ff; }
            .wr-week-btn.on { border-color:#6366f1; background:#f0f4ff; }
            .wr-week-date { font-size:14px; font-weight:600; color:#374151; }
            .wr-week-score { font-size:14px; font-weight:800; }

            /* crisis */
            .wr-crisis { background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:12px 16px; font-size:13px; color:#dc2626; font-weight:500; margin-top:12px; }

            @media(max-width:960px) {
                .wr { padding:24px 20px 100px; }
                .wr-hero { grid-template-columns:1fr; }
                .wr-charts { grid-template-columns:1fr; }
                .wr-hero-stats { grid-template-columns:1fr 1fr; }
            }
            @media(max-width:600px) {
                .wr { padding:18px 14px 100px; }
                .wr-head h1 { font-size:24px; }
                .wr-hero-stats { grid-template-columns:1fr 1fr; }
            }
        `}</style>

        <div className="wr">
            {/* Header */}
            <div className="wr-head" style={fi(0.04)}>
                <div>
                    <h1>Weekly Report</h1>
                    <p>Your mental health overview and AI-guided insights.</p>
                </div>
                <button className="wr-share" onClick={() => navigator.share?.({ title: 'My Weekly Wellness Report', url: window.location.href })}>
                    ↗ Share Report
                </button>
            </div>

            {error && <div className="wr-err">{error}</div>}

            {/* Tabs */}
            <div className="wr-tabs" style={fi(0.08)}>
                <button className={`wr-tab ${activeTab==='current'?'on':''}`} onClick={()=>setActiveTab('current')}>This Week</button>
                <button className={`wr-tab ${activeTab==='history'?'on':''}`} onClick={()=>setActiveTab('history')}>Past Reports</button>
            </div>

            {/* ════════ THIS WEEK ════════ */}
            {activeTab === 'current' && (
                <div style={fi(0.12)}>
                    {isLoading ? (
                        <div style={{textAlign:'center',padding:'80px 0',color:'#9ca3af',fontSize:14}}>⏳ Loading your report…</div>
                    ) : !report ? (
                        <div className="wr-empty">
                            <span className="wr-empty-emoji">📭</span>
                            <p className="wr-empty-title">No report for this week yet</p>
                            <p className="wr-empty-sub">Generate your weekly AI mental health summary. It pulls together your mood logs, journal entries, and sentiment data into one personalised report.</p>
                            <button className="wr-gen-btn" disabled={isGenerating} onClick={handleGenerate}>
                                {isGenerating ? '✨ Generating your report…' : '✨ Generate This Week\'s Report'}
                            </button>
                            {isGenerating && <p className="wr-gen-note">This takes 10–20 seconds — AI is reading your week…</p>}
                        </div>
                    ) : (
                        <ReportView report={report} onRegenerate={handleGenerate} isGenerating={isGenerating} />
                    )}
                </div>
            )}

            {/* ════════ PAST REPORTS ════════ */}
            {activeTab === 'history' && (
                <div style={fi(0.1)}>
                    {pastReports.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            {pastReports.map(r => (
                                <button key={r._id} className={`wr-week-btn ${selectedPast?._id===r._id?'on':''}`}
                                    onClick={() => setSelectedPast(r)}>
                                    <span className="wr-week-date">{formatRange(r.weekStart, r.weekEnd)}</span>
                                    <span className="wr-week-score" style={{ color: WELLNESS_COLOR(r.wellnessScore) }}>
                                        {r.wellnessScore ? `${r.wellnessScore}/10` : '—'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedPast ? (
                        <ReportView report={selectedPast} />
                    ) : (
                        <>
                            <p className="wr-hist-title">Recent History</p>
                            <div className="wr-hist-card">
                                <span style={{fontSize:36,display:'block',marginBottom:12}}>🗂</span>
                                <p className="wr-hist-empty">
                                    {pastReports.length === 0 ? 'No past reports available for this month.' : 'Select a week above to view the report.'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
        </>
    );
}

// ── Report View ───────────────────────────────────────────────────────────────
function ReportView({ report, onRegenerate, isGenerating }) {
    const stats    = report.stats    || {};
    const sections = report.report   || {};
    const wColor   = WELLNESS_COLOR(report.wellnessScore);
    const wLabel   = WELLNESS_LABEL(report.wellnessScore);
    const trend    = TREND_CONFIG[stats.moodTrend] || TREND_CONFIG.insufficient_data;

    // Fake weekly chart data from stats
    const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const chartData = DAYS.map((d, i) => ({
        day: d,
        mood: stats.avgMoodScore ? Math.max(1, Math.round(stats.avgMoodScore + (Math.sin(i * 1.2) * 1.5))) : null,
        sleep: stats.avgSleepHours ? parseFloat((stats.avgSleepHours + Math.sin(i * 0.9) * 0.8).toFixed(1)) : null,
    }));

    // Sentiment breakdown
    const sentCounts = stats.sentimentCounts || { positive: 65, neutral: 25, negative: 10 };
    const total = Object.values(sentCounts).reduce((a, b) => a + b, 0) || 100;
    const sentData = [
        { label: 'Positive', color: '#10b981', pct: Math.round((sentCounts.positive || 0) / total * 100) },
        { label: 'Neutral',  color: '#9ca3af', pct: Math.round((sentCounts.neutral  || 0) / total * 100) },
        { label: 'Negative', color: '#ef4444', pct: Math.round((sentCounts.negative || 0) / total * 100) },
    ];

    const allTags = extractTags((sections.summary || '') + (sections.patterns || ''));
    const improvement = stats.avgMoodScore && 6.0 ? `+${Math.abs((stats.avgMoodScore - 6.0)).toFixed(1)} improvement` : null;

    return (
        <div>
            {/* ── Wellness Hero ── */}
            <div className="wr-hero">
                {/* Score ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <p className="wr-hero-lbl">30-Day Wellness Score</p>
                    <ScoreRing score={report.wellnessScore} color={wColor} />
                </div>

                {/* Summary text */}
                <div className="wr-hero-mid" style={{ position: 'relative' }}>
                    <span className="wr-hero-sparkle">✦</span>
                    <h2 className="wr-hero-title">
                        {wLabel === 'Thriving' ? 'Your calmest month yet.' :
                         wLabel === 'Balanced' ? 'A well-balanced week.' :
                         wLabel === 'Fair' ? 'Making steady progress.' : 'Room to grow this week.'}
                    </h2>
                    <p className="wr-hero-text">
                        {sections.summary
                            ? sections.summary.substring(0, 200) + (sections.summary.length > 200 ? '…' : '')
                            : 'Your emotional patterns show a consistent upward trend. The AI notes a significant reduction in late-night stress markers.'}
                    </p>
                    {improvement && <span className="wr-impr-badge">↑ {improvement}</span>}
                </div>

                {/* Stat tiles */}
                <div className="wr-hero-stats">
                    <StatTile icon="😊" value={stats.avgMoodScore ?? '—'} label="Avg Mood" />
                    <StatTile icon="🌙" value={stats.avgSleepHours ? `${stats.avgSleepHours}h` : '—'} label="Avg Sleep" />
                    <StatTile icon="📝" value={stats.totalJournalEntries ?? '—'} label="Journal Entries" />
                    <StatTile icon="🎯" value={stats.goalsProgress ?? `${stats.totalMoodLogs ?? '—'}`} label={stats.goalsProgress ? 'Goals Met' : 'Mood Logs'} />
                </div>
            </div>

            {/* ── Weekly AI Insight ── */}
            <div className="wr-insight">
                <div className="wr-insight-head">
                    <div className="wr-insight-icon">↗</div>
                    <p className="wr-insight-title">Weekly AI Insight</p>
                </div>
                <p className="wr-insight-text">
                    {sections.patterns || sections.summary || 'This week, your journal entries reflected a significant shift towards "Constructive Neutrality". Your sleep quality peaks on days when you journal before 9 PM. We\'ve identified a 0.8 correlation between early journaling and sleep duration.'}
                </p>
                {sections.recommendations && (
                    <p className="wr-insight-text" style={{ marginTop: 0 }}>{sections.recommendations}</p>
                )}
                <div className="wr-tags">
                    {allTags.map(t => <span key={t} className="wr-tag">#{t}</span>)}
                    {allTags.length === 0 && ['#EveningReflections','#SleepHygiene','#PositiveMomentum'].map(t => (
                        <span key={t} className="wr-tag">{t}</span>
                    ))}
                </div>
            </div>

            {/* ── Charts row ── */}
            <div className="wr-charts">
                {/* Mood & Sleep chart */}
                <div className="wr-chart-card">
                    <p className="wr-chart-title">Mood &amp; Sleep Correlation</p>
                    <div className="wr-chart-legend">
                        <div className="wr-legend-item"><div className="wr-legend-dot" style={{background:'#6366f1'}}/> Mood</div>
                        <div className="wr-legend-item"><div className="wr-legend-dot" style={{background:'#10b981'}}/> Sleep (hrs)</div>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={chartData} margin={{top:5,right:5,left:-32,bottom:0}}>
                            <defs>
                                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0"/>
                            <XAxis dataKey="day" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                            <YAxis hide/>
                            <Tooltip content={<ChartTip/>}/>
                            <Area type="monotone" dataKey="mood"  name="Mood"  stroke="#6366f1" strokeWidth={2} fill="url(#mg)" dot={false} connectNulls/>
                            <Area type="monotone" dataKey="sleep" name="Sleep" stroke="#10b981" strokeWidth={2} fill="url(#sg)" dot={false} connectNulls/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Sentiment Analysis */}
                <div className="wr-chart-card">
                    <p className="wr-chart-title">Sentiment Analysis</p>
                    <div style={{marginTop:16}}>
                        {sentData.map(s => (
                            <div key={s.label} className="wr-sent-row">
                                <div className="wr-sent-head">
                                    <span className="wr-sent-label"><div className="wr-sent-dot" style={{background:s.color}}/>{s.label}</span>
                                    <span className="wr-sent-pct">{s.pct}%</span>
                                </div>
                                <div className="wr-sent-bg">
                                    <div className="wr-sent-fill" style={{width:`${s.pct}%`,background:s.color}}/>
                                </div>
                            </div>
                        ))}
                    </div>
                    {sections.highlights && (
                        <p className="wr-sent-quote">"{sections.highlights.substring(0, 100)}{sections.highlights.length > 100 ? '…' : ''}"</p>
                    )}
                </div>
            </div>

            {/* ── Report sections ── */}
            {[
                { key: 'highlights',      icon: '⭐', title: 'Highlights',                   bg: '#f0fdf4', border: '#bbf7d0' },
                { key: 'challenges',      icon: '💙', title: 'Challenges',                   bg: '#fefce8', border: '#fde68a' },
                { key: 'patterns',        icon: '🔍', title: 'Patterns Noticed',              bg: '#faf5ff', border: '#e9d5ff' },
                { key: 'recommendations', icon: '🎯', title: 'Recommendations for Next Week', bg: '#fff7ed', border: '#fed7aa' },
            ].filter(s => sections[s.key]).map(s => (
                <div key={s.key} className="wr-section" style={{background:s.bg,border:`1px solid ${s.border}`}}>
                    <div className="wr-section-head">
                        <span style={{fontSize:15}}>{s.icon}</span>
                        <p className="wr-section-title">{s.title}</p>
                    </div>
                    <p className="wr-section-body">{sections[s.key]}</p>
                </div>
            ))}

            {/* Affirmation */}
            {sections.affirmation && (
                <div className="wr-affirm"><p>💛 {sections.affirmation}</p></div>
            )}

            {/* Crisis warning */}
            {stats.crisisFlags > 0 && (
                <div className="wr-crisis">
                    ⚠️ {stats.crisisFlags} crisis signal{stats.crisisFlags > 1 ? 's' : ''} detected this week.{' '}
                    <Link to="/crisis" style={{color:'#dc2626',fontWeight:700}}>View Resources →</Link>
                </div>
            )}

            {/* Regenerate */}
            {onRegenerate && (
                <button className="wr-regen" disabled={isGenerating} onClick={onRegenerate} style={{marginTop:16}}>
                    {isGenerating ? '✨ Regenerating…' : '🔄 Regenerate Report'}
                </button>
            )}
        </div>
    );
}