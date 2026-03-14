import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ComposedChart, Area, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    BarChart, Cell,
} from 'recharts';
import api from '../config/axios';

// ── Helpers ───────────────────────────────────────────────────────────────────
const WELLNESS_COLOR = (s) =>
    !s ? '#9ca3af' : s >= 8 ? '#10b981' : s >= 6 ? '#84cc16' : s >= 4 ? '#f59e0b' : '#ef4444';

const WELLNESS_LABEL = (s) =>
    !s ? 'No data' : s >= 8 ? 'Thriving' : s >= 6 ? 'Good' : s >= 4 ? 'Fair' : 'Struggling';

const CORR_LABEL = (r) => {
    if (r === null || r === undefined) return { text: 'Not enough data', color: '#9ca3af', pct: 0 };
    const a = Math.abs(r), dir = r > 0 ? 'positive' : 'negative';
    const color = a >= 0.7 ? (r > 0 ? '#10b981' : '#ef4444') : a >= 0.4 ? (r > 0 ? '#84cc16' : '#f97316') : '#eab308';
    const text  = a >= 0.7 ? `Strong ${dir}` : a >= 0.4 ? `Moderate ${dir}` : a >= 0.1 ? `Weak ${dir}` : 'No correlation';
    return { text, color, pct: Math.round(a * 100) };
};

const TREND_ICONS = { up: '↑', down: '↓', stable: '→' };
const TREND_COLORS = { up: '#10b981', down: '#ef4444', stable: '#9ca3af' };

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#111827' }}>{label}</p>
            {payload.map((p, i) => p.value != null && (
                <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 500 }}>
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
};

// ── Circular Score ────────────────────────────────────────────────────────────
const CircleScore = ({ score, color }) => {
    const r = 44, circ = 2 * Math.PI * r;
    const pct = score ? Math.min(score / 10, 1) : 0;
    return (
        <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{score ?? '—'}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>/ 10</span>
            </div>
        </div>
    );
};

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, sub, color, trend, onClick, highlight }) => (
    <div onClick={onClick} style={{
        background: highlight ? `${color}10` : 'white',
        border: `1px solid ${highlight ? color + '30' : '#f3f4f6'}`,
        borderRadius: 18, padding: '18px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', flex: '1 1 130px', minWidth: 120,
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {trend && <span style={{ fontSize: 12, fontWeight: 700, color: TREND_COLORS[trend] }}>{TREND_ICONS[trend]}</span>}
        </div>
        <p style={{ margin: '0 0 3px', fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 26, fontWeight: 800, color: color || '#111827', lineHeight: 1 }}>{value ?? '—'}</p>
        <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        {sub && <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
    </div>
);

// ── Activity Heatmap ──────────────────────────────────────────────────────────
const Heatmap = ({ timeline }) => {
    const getColor = (d) => {
        const s = [d.mood ? 1 : 0, d.sleepQuality ? 1 : 0, d.journaled ? 1 : 0, d.exercised ? 1 : 0].reduce((a,b)=>a+b,0);
        return s === 0 ? '#ede9fe' : s === 1 ? '#c4b5fd' : s === 2 ? '#a78bfa' : s === 3 ? '#7c3aed' : '#4c1d95';
    };
    const weeks = [];
    let week = [];
    timeline.forEach((d, i) => {
        week.push(d);
        if (week.length === 7 || i === timeline.length - 1) { weeks.push([...week]); week = []; }
    });
    return (
        <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {weeks.map((w, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {w.map((d, di) => (
                            <div key={di} title={`${d.date} · Mood: ${d.mood ?? '—'} · Sleep: ${d.sleepQuality ?? '—'}★`}
                                style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: getColor(d), transition: 'transform 0.15s', cursor: 'default' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                        ))}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Less</span>
                {['#ede9fe','#c4b5fd','#a78bfa','#7c3aed','#4c1d95'].map(c => (
                    <div key={c} style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: c }} />
                ))}
                <span style={{ fontSize: 11, color: '#9ca3af' }}>More active</span>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Analytics() {
    const [data, setData]           = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [range, setRange]         = useState(30);
    const [error, setError]         = useState('');
    const [ready, setReady]         = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchData(); setTimeout(() => setReady(true), 80); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/analytics/overview');
            setData(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load analytics.');
        } finally { setIsLoading(false); }
    };

    const fetchAi = async () => {
        setAiLoading(true);
        try {
            const res = await api.get('/analytics/ai-summary');
            setAiSummary(res.data.data.summary);
        } catch { setAiSummary('Unable to generate summary right now.'); }
        finally { setAiLoading(false); }
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: '100px 0', fontFamily: "'DM Sans',sans-serif", color: '#9ca3af', fontSize: 15 }}>
            ⏳ Loading your analytics…
        </div>
    );

    if (!data) return null;

    const { summary, correlations, timeline } = data;
    const ranged = timeline.slice(range === 7 ? 23 : range === 14 ? 16 : 0);
    const wColor = WELLNESS_COLOR(summary.wellnessScore);
    const wLabel = WELLNESS_LABEL(summary.wellnessScore);
    const hasData = summary.totalDataPoints > 0;

    const radarData = [
        { subject: 'Mood',     value: summary.avgMood30 ? Math.round(summary.avgMood30 * 10) : 0 },
        { subject: 'Sleep',    value: summary.avgSleepQuality ? Math.round(summary.avgSleepQuality * 20) : 0 },
        { subject: 'Journal',  value: Math.min(100, Math.round(((summary.journalCount30 || 0) / 20) * 100)) },
        { subject: 'Exercise', value: Math.min(100, Math.round(((summary.exerciseCount30 || 0) / 12) * 100)) },
        { subject: 'Goals',    value: summary.activeGoals ? Math.min(100, Math.round(((summary.goalsOnStreak || 0) / summary.activeGoals) * 100)) : 0 },
    ];

    const emotionData = (summary.topEmotions || []).map(e => ({ name: e.emotion, count: e.count }));
    const maxEmo = emotionData[0]?.count || 1;

    const QUICK = [
        { to: '/dashboard',    icon: '😊', label: 'Log Mood'    },
        { to: '/sleep',        icon: '🌙', label: 'Sleep Log'   },
        { to: '/journal',      icon: '📝', label: 'Journal'     },
        { to: '/exercises',    icon: '🧘', label: 'Exercises'   },
        { to: '/goals',        icon: '🎯', label: 'Set Goal'    },
    ];

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .an { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:36px 44px 100px; box-sizing:border-box; }

            /* hero */
            .an-hero { background:white; border-radius:22px; padding:28px 32px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; }
            .an-hero-badge { font-size:10px; font-weight:700; color:#6366f1; background:#ede9fe; padding:3px 10px; border-radius:20px; letter-spacing:0.08em; text-transform:uppercase; display:inline-block; margin-bottom:10px; }
            .an-hero-title { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; color:#111827; margin:0 0 8px; letter-spacing:-0.5px; }
            .an-hero-sub { font-size:13px; color:#6b7280; margin:0 0 18px; line-height:1.6; max-width:400px; }
            .an-hero-btns { display:flex; gap:10px; flex-wrap:wrap; }
            .an-btn-primary { padding:10px 20px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
            .an-btn-primary:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }
            .an-btn-primary:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }
            .an-btn-secondary { padding:10px 18px; background:#f9fafb; color:#374151; border:1px solid #e5e7eb; border-radius:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:default; display:flex; align-items:center; gap:7px; }

            /* metrics row */
            .an-metrics { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:18px; }

            /* range */
            .an-range { display:inline-flex; background:white; border-radius:12px; padding:4px; gap:3px; border:1px solid #f3f4f6; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-bottom:18px; }
            .an-range-btn { padding:7px 18px; border:none; border-radius:9px; cursor:pointer; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
            .an-range-btn.on  { background:#111827; color:white; box-shadow:0 2px 8px rgba(0,0,0,0.18); }
            .an-range-btn.off { background:transparent; color:#6b7280; }

            /* cards */
            .an-card { background:white; border-radius:20px; padding:24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); margin-bottom:18px; }
            .an-card-sm { background:white; border-radius:20px; padding:22px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .an-ct { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 6px; }
            .an-cs { font-size:12px; color:#9ca3af; margin:0 0 18px; }

            /* 2-col */
            .an-2col { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px; }
            .an-3col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; margin-bottom:18px; }

            /* emotion bar */
            .an-emo-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
            .an-emo-row:last-child { margin-bottom:0; }
            .an-emo-name { font-size:13px; color:#374151; font-weight:500; width:90px; flex-shrink:0; text-transform:capitalize; }
            .an-emo-bar-bg { flex:1; height:8px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
            .an-emo-bar-fill { height:100%; border-radius:4px; transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
            .an-emo-count { font-size:12px; color:#9ca3af; width:30px; text-align:right; flex-shrink:0; }

            /* corr */
            .an-corr-item { margin-bottom:16px; }
            .an-corr-item:last-child { margin-bottom:0; }
            .an-corr-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
            .an-corr-lbl { font-size:12px; font-weight:600; color:#374151; }
            .an-corr-val { font-size:12px; font-weight:800; }
            .an-corr-bg  { height:7px; background:#f3f4f6; border-radius:4px; overflow:hidden; margin-bottom:4px; }
            .an-corr-fill { height:100%; border-radius:4px; transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
            .an-corr-text { font-size:11px; font-weight:600; }

            /* quick actions */
            .an-quick { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
            .an-quick-item { display:flex; flex-direction:column; align-items:center; gap:8px; background:white; border:1px solid #f3f4f6; border-radius:18px; padding:18px 10px; text-decoration:none; color:#374151; font-size:12px; font-weight:600; transition:all 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
            .an-quick-icon { width:44px; height:44px; border-radius:50%; background:#f5f4f0; display:flex; align-items:center; justify-content:center; font-size:22px; transition:all 0.2s; }
            .an-quick-item:hover { box-shadow:0 4px 14px rgba(0,0,0,0.1); transform:translateY(-2px); }
            .an-quick-item:hover .an-quick-icon { background:#ede9fe; }

            /* ai insight */
            .an-ai-box { background:linear-gradient(135deg,#fef9ec,#fef3c7); border:1px solid #fde68a; border-radius:14px; padding:14px 16px; margin-top:16px; animation:fadeUp 0.4s ease; }
            @keyframes fadeUp { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
            .an-ai-t { font-size:12px; font-weight:700; color:#a16207; margin:0 0 4px; }
            .an-ai-b { font-size:13px; color:#78350f; margin:0; line-height:1.6; font-style:italic; }

            /* empty */
            .an-empty { text-align:center; padding:100px 0; color:#9ca3af; }

            /* error */
            .an-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; }

            @media(max-width:960px) {
                .an-2col,.an-3col { grid-template-columns:1fr; }
                .an-quick { grid-template-columns:repeat(3,1fr); }
                .an { padding:24px 20px 100px; }
                .an-metrics { gap:8px; }
            }
            @media(max-width:600px) {
                .an { padding:20px 14px 100px; }
                .an-hero { padding:20px; }
                .an-hero-title { font-size:20px; }
                .an-quick { grid-template-columns:repeat(3,1fr); }
            }
        `}</style>

        <div className="an">
            {error && <div className="an-err">{error}</div>}

            {!hasData ? (
                /* Empty state */
                <div className="an-empty" style={fi(0.05)}>
                    <p style={{ fontSize: 52, margin: '0 0 16px' }}>📊</p>
                    <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: '#374151', margin: '0 0 8px' }}>No data yet</p>
                    <p style={{ fontSize: 14, margin: '0 0 28px', maxWidth: 320, marginInline: 'auto', lineHeight: 1.6 }}>Start logging your mood, sleep, and journals to see your wellness analytics.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[['Log Mood', '/dashboard', '#6366f1'], ['Log Sleep', '/sleep', '#7c3aed'], ['Write Journal', '/journal', '#0284c7']].map(([l, to, bg]) => (
                            <Link key={to} to={to} style={{ padding: '11px 22px', background: bg, color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>{l}</Link>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Hero / Wellness Score ── */}
                    <div className="an-hero" style={fi(0.05)}>
                        <div>
                            <span className="an-hero-badge">Monthly Summary</span>
                            <h1 className="an-hero-title">
                                Wellness Score is <em style={{ color: wColor, fontStyle: 'italic' }}>{wLabel}.</em>
                            </h1>
                            <p className="an-hero-sub">
                                Based on your activity, sleep quality, and mood tracking, your mental wellness has seen a 14% improvement over the last month.
                            </p>
                            <div className="an-hero-btns">
                                {!aiSummary ? (
                                    <button className="an-btn-primary" onClick={fetchAi} disabled={aiLoading}>
                                        {aiLoading ? '✨ Thinking…' : '✨ Get AI Insight'}
                                    </button>
                                ) : null}
                                <div className="an-btn-secondary">
                                    🔥 {summary.currentStreak || 0}-Day Streak
                                </div>
                            </div>
                            {aiSummary && (
                                <div className="an-ai-box">
                                    <p className="an-ai-t">✨ AI Insight</p>
                                    <p className="an-ai-b">{aiSummary}</p>
                                </div>
                            )}
                        </div>
                        <CircleScore score={summary.wellnessScore} color={wColor} />
                    </div>

                    {/* ── Metric Cards ── */}
                    <div className="an-metrics" style={fi(0.1)}>
                        <MetricCard icon="😊" label="Avg Mood (30d)"  value={summary.avgMood30}    color="#f59e0b" trend={summary.moodTrend} sub={`This week: ${summary.avgMoodThis7 ?? '—'}`} onClick={() => navigate('/dashboard')} />
                        <MetricCard icon="🌙" label="Avg Sleep"        value={summary.avgSleepQuality ? `${summary.avgSleepQuality}★` : null} color="#7c3aed" sub={summary.avgSleepDuration ? `${summary.avgSleepDuration}h avg` : null} onClick={() => navigate('/sleep')} />
                        <MetricCard icon="📝" label="Journal Entries"  value={summary.journalCount30}  color="#0284c7" sub={`${summary.journalCount7 || 0} this week`} onClick={() => navigate('/journal')} highlight />
                        <MetricCard icon="🧘" label="Exercises"         value={summary.exerciseCount30}  color="#10b981" sub={summary.avgMoodLift ? `+${summary.avgMoodLift} mood lift` : '30 days'} onClick={() => navigate('/exercises')} />
                        <MetricCard icon="🎯" label="Active Goals"      value={summary.activeGoals}      color="#ef4444" sub={`${summary.goalsOnStreak || 0} on streak`} onClick={() => navigate('/goals')} />
                    </div>

                    {/* ── Range selector ── */}
                    <div style={fi(0.13)}>
                        <div className="an-range">
                            {[7, 14, 30].map(r => (
                                <button key={r} className={`an-range-btn ${range === r ? 'on' : 'off'}`} onClick={() => setRange(r)}>{r}d</button>
                            ))}
                        </div>
                    </div>

                    {/* ── Wellness Trends ── */}
                    <div className="an-card" style={fi(0.15)}>
                        <p className="an-ct">Wellness Trends</p>
                        <p className="an-cs">Correlations between mood, sleep, and sentiment</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <ComposedChart data={ranged} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis yAxisId="m" domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="s" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                                <Bar yAxisId="m" dataKey="mood" name="Mood" fill="#fef3c7" radius={[4,4,0,0]} maxBarSize={18} />
                                <Line yAxisId="m" type="monotone" dataKey="sentiment" name="Sentiment" stroke="#6366f1" strokeWidth={2.5} dot={false} connectNulls strokeDasharray="0" />
                                <Line yAxisId="s" type="monotone" dataKey="sleepQuality" name="Sleep ★" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Sleep + Radar/Correlations ── */}
                    <div className="an-3col" style={fi(0.18)}>
                        {/* Sleep duration */}
                        <div className="an-card-sm">
                            <p className="an-ct">Sleep Duration</p>
                            <p className="an-cs" style={{ marginBottom: 14 }}>Hours slept per day (last 7 days)</p>
                            <ResponsiveContainer width="100%" height={130}>
                                <BarChart data={ranged.slice(-7)} margin={{ top: 0, right: 0, left: -32, bottom: 0 }} barSize={16}>
                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 12]} hide />
                                    <Tooltip content={<ChartTip />} />
                                    <Bar dataKey="sleepHours" name="Hours" radius={[5,5,0,0]}>
                                        {ranged.slice(-7).map((d, i) => (
                                            <Cell key={i} fill={!d.sleepHours ? '#f3f4f6' : d.sleepHours >= 8 ? '#10b981' : d.sleepHours >= 7 ? '#84cc16' : d.sleepHours >= 6 ? '#eab308' : '#f97316'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Wellness Radar */}
                        <div className="an-card-sm">
                            <p className="an-ct">Wellness Radar</p>
                            <ResponsiveContainer width="100%" height={160}>
                                <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                    <Radar name="You" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Correlations */}
                        <div className="an-card-sm">
                            <p className="an-ct">Top Correlations</p>
                            <p className="an-cs" style={{ marginBottom: 14 }}>How habits connect</p>
                            {[
                                { label: '🌙 Sleep → 😊 Mood', r: correlations?.moodSleep },
                                { label: '💬 Sentiment → 😊 Mood', r: correlations?.moodSentiment },
                            ].map(({ label, r }) => {
                                const info = CORR_LABEL(r);
                                return (
                                    <div key={label} className="an-corr-item">
                                        <div className="an-corr-head">
                                            <span className="an-corr-lbl">{label}</span>
                                            <span className="an-corr-val" style={{ color: info.color }}>
                                                {r !== null && r !== undefined ? (r > 0 ? '+' : '') + r : '—'}
                                            </span>
                                        </div>
                                        <div className="an-corr-bg">
                                            <div className="an-corr-fill" style={{ width: `${info.pct}%`, backgroundColor: info.color }} />
                                        </div>
                                        <p className="an-corr-text" style={{ color: info.color }}>{info.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Emotions + Heatmap ── */}
                    <div className="an-2col" style={fi(0.22)}>
                        {/* Top Emotions */}
                        <div className="an-card-sm">
                            <p className="an-ct">Top Emotions</p>
                            <p className="an-cs" style={{ marginBottom: 16 }}>Most logged this month</p>
                            {emotionData.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#9ca3af' }}>No emotion data yet.</p>
                            ) : emotionData.map((e, i) => {
                                const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe'];
                                return (
                                    <div key={e.name} className="an-emo-row">
                                        <span className="an-emo-name">{e.name}</span>
                                        <div className="an-emo-bar-bg">
                                            <div className="an-emo-bar-fill" style={{ width: `${(e.count / maxEmo) * 100}%`, backgroundColor: COLORS[i] || '#6366f1' }} />
                                        </div>
                                        <span className="an-emo-count">{Math.round((e.count / maxEmo) * 100)}%</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Consistency Heatmap */}
                        <div className="an-card-sm">
                            <p className="an-ct">Consistency Heatmap</p>
                            <p className="an-cs" style={{ marginBottom: 14 }}>Activity density — last 30 days</p>
                            <Heatmap timeline={timeline} />
                        </div>
                    </div>

                    {/* ── Quick Actions ── */}
                    <div style={fi(0.26)}>
                        <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Quick Actions</p>
                        <div className="an-quick">
                            {QUICK.map(({ to, icon, label }) => (
                                <Link key={to} to={to} className="an-quick-item">
                                    <div className="an-quick-icon">{icon}</div>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
        </>
    );
}