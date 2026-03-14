import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
    BarChart, Bar, Cell,
} from 'recharts';
import api from '../config/axios';

// ── Constants ─────────────────────────────────────────────────────────────────
const SENT_COLORS = {
    positive: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e', bar: '#22c55e' },
    negative:  { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', bar: '#ef4444' },
    neutral:   { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', bar: '#9ca3af' },
    mixed:     { bg: '#fefce8', text: '#a16207', dot: '#f59e0b', bar: '#f59e0b' },
};

const EMOTION_EMOJIS = {
    joy: '😊', sadness: '😢', anxiety: '😰', anger: '😠',
    fear: '😨', shame: '😔', loneliness: '😞', hope: '🌟',
    calm: '😌', overwhelm: '😤', numbness: '😶', gratitude: '🙏',
};

const TREND_CONFIG = {
    improving: { label: 'Improving',       color: '#10b981', bg: 'linear-gradient(135deg,#065f46,#047857,#10b981)' },
    declining:  { label: 'Needs Attention', color: '#ef4444', bg: 'linear-gradient(135deg,#7f1d1d,#b91c1c,#ef4444)' },
    stable:     { label: 'Stable',          color: '#6366f1', bg: 'linear-gradient(135deg,#1e1b4b,#3730a3,#6366f1)' },
};

const SOURCE_LABELS = { mood: 'Mood', journal: 'Journal', chat: 'Chat' };

const formatDate  = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const score = payload[0].value;
    const col = score > 0.2 ? '#16a34a' : score < -0.2 ? '#ef4444' : '#6b7280';
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}>
            <p style={{ margin: '0 0 4px', color: '#9ca3af' }}>{label}</p>
            <p style={{ margin: 0, fontWeight: 700, color: col, fontSize: 14 }}>
                Score: {score > 0 ? '+' : ''}{score}
            </p>
        </div>
    );
};

// ── Stability Score Circle ────────────────────────────────────────────────────
const StabilityRing = ({ score }) => {
    const pct = score ? Math.min(score / 100, 1) : 0;
    const r = 28, circ = 2 * Math.PI * r;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                    <circle cx="36" cy="36" r={r} fill="none" stroke="white" strokeWidth="6"
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 900, color: 'white' }}>
                        {score ?? '—'}%
                    </span>
                </div>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stability Score</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>consistent & moving up</p>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Sentimentinsights() {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [ready, setReady]         = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAll();
        setTimeout(() => setReady(true), 80);
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [s, h] = await Promise.all([api.get('/sentiment/summary'), api.get('/sentiment')]);
            setSummary(s.data.data);
            setHistory(h.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally { setIsLoading(false); }
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    const chartData = [...history].slice(0, 20).reverse().map(r => ({
        date: formatDate(r.createdAt),
        score: parseFloat(r.sentimentScore?.toFixed(2) || 0),
        sentiment: r.sentiment,
    }));

    const trend  = summary?.trend || 'stable';
    const tConf  = TREND_CONFIG[trend] || TREND_CONFIG.stable;
    const noData = !isLoading && (!summary || !summary.hasData);

    const FOCUS_TAGS = ['Deep Breathing', 'Evening Walk', 'Social Connection', 'Gratitude Journal'];

    // Breakdown bar data
    const breakdownData = summary?.sentimentCounts
        ? Object.entries(summary.sentimentCounts).map(([k, v]) => ({
            name: k.charAt(0).toUpperCase() + k.slice(1),
            count: v,
            pct: Math.round((v / (summary.totalEntries || 1)) * 100),
            color: SENT_COLORS[k]?.bar || '#9ca3af',
        }))
        : [];

    // Top emotion bar data
    const emotionBarData = (summary?.topEmotions || []).map(e => ({
        name: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
        count: e.count,
    }));
    const EMO_COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'];

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .si { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:36px 44px 100px; box-sizing:border-box; }

            /* hero */
            .si-hero { border-radius:22px; padding:28px 32px; margin-bottom:18px; position:relative; overflow:hidden; color:white; }
            .si-hero-badge { font-size:10px; font-weight:700; background:rgba(255,255,255,0.2); padding:3px 10px; border-radius:20px; letter-spacing:0.08em; text-transform:uppercase; display:inline-block; margin-bottom:12px; }
            .si-hero h2 { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; margin:0 0 10px; letter-spacing:-0.5px; }
            .si-hero p  { font-size:13px; color:rgba(255,255,255,0.75); margin:0; line-height:1.65; max-width:460px; }
            .si-hero-glow { position:absolute; top:-60px; right:-60px; width:240px; height:240px; border-radius:50%; background:rgba(255,255,255,0.07); pointer-events:none; }
            .si-hero-glow2 { position:absolute; bottom:-40px; left:30%; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,0.05); pointer-events:none; }

            /* tabs */
            .si-tabs { display:inline-flex; background:white; border-radius:12px; padding:4px; gap:4px; border:1px solid #f3f4f6; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-bottom:22px; }
            .si-tab { padding:8px 22px; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
            .si-tab.on  { background:#111827; color:white; box-shadow:0 2px 8px rgba(0,0,0,0.18); }
            .si-tab.off { background:transparent; color:#6b7280; }
            .si-tab.off:hover { color:#374151; }

            /* cards */
            .si-card { background:white; border-radius:20px; padding:22px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .si-ct { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 4px; }
            .si-cs { font-size:12px; color:#9ca3af; margin:0 0 16px; }

            /* stat row */
            .si-stats { display:grid; grid-template-columns:1fr 1fr 1fr 1.5fr; gap:14px; margin-bottom:18px; }
            .si-stat { background:white; border-radius:18px; padding:18px 16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .si-stat-lbl { font-size:10px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.07em; margin:0 0 6px; }
            .si-stat-num { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:900; margin:0 0 2px; line-height:1; }
            .si-stat-sub { font-size:11px; color:#9ca3af; margin:0; }

            /* AI summary card */
            .si-ai-card { background:white; border-radius:18px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .si-ai-head { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
            .si-ai-icon { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
            .si-ai-title { font-size:14px; font-weight:700; color:#111827; font-family:'Bricolage Grotesque',sans-serif; }
            .si-ai-text { font-size:13px; color:#4b5563; line-height:1.7; margin:0 0 14px; font-style:italic; }
            .si-focus-lbl { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px; }
            .si-focus-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
            .si-focus-tag { font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; background:#f0f4ff; color:#4338ca; border:1px solid #c7d2fe; transition:all 0.15s; cursor:default; }
            .si-schedule-btn { width:100%; padding:11px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
            .si-schedule-btn:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }

            /* 2-col */
            .si-2col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }

            /* breakdown bars */
            .si-bk-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
            .si-bk-row:last-child { margin-bottom:0; }
            .si-bk-name { font-size:12px; color:#374151; font-weight:600; width:62px; flex-shrink:0; }
            .si-bk-bar-bg { flex:1; height:8px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
            .si-bk-bar-fill { height:100%; border-radius:4px; transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
            .si-bk-pct { font-size:12px; color:#9ca3af; width:34px; text-align:right; flex-shrink:0; font-weight:600; }

            /* timeline */
            .si-timeline { margin-bottom:18px; }
            .si-timeline-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }

            /* crisis alert */
            .si-crisis { background:#fef2f2; border:2px solid #dc2626; border-radius:16px; padding:18px 20px; margin-bottom:18px; animation:fadeIn 0.4s ease; }
            @keyframes fadeIn { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }

            /* entries */
            .si-entry { background:white; border-radius:18px; padding:20px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); margin-bottom:14px; transition:box-shadow 0.2s; animation:cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes cardIn { from{opacity:0;transform:scale(0.97) translateY(8px);} to{opacity:1;transform:scale(1) translateY(0);} }
            .si-entry:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); }
            .si-entry-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
            .si-entry-badges { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
            .si-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:capitalize; }
            .si-entry-score { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; }
            .si-entry-date { font-size:11px; color:#9ca3af; margin:2px 0 0; }
            .si-entry-meta { display:flex; gap:6px; margin-bottom:10px; }
            .si-meta-tag { font-size:11px; color:#9ca3af; background:#f9fafb; padding:2px 8px; border-radius:6px; }
            .si-entry-text { font-size:14px; color:#4b5563; line-height:1.7; margin:0 0 12px; font-style:italic; }
            .si-insight { background:linear-gradient(135deg,#f0fdf4,#dcfce7); border:1px solid #bbf7d0; border-radius:12px; padding:12px 14px; }
            .si-insight-head { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
            .si-insight-dot { width:10px; height:10px; background:#22c55e; border-radius:50%; flex-shrink:0; }
            .si-insight-lbl { font-size:11px; font-weight:700; color:#16a34a; letter-spacing:0.06em; text-transform:uppercase; }
            .si-insight-text { font-size:13px; color:#166534; line-height:1.6; margin:0; }

            /* empty */
            .si-empty { text-align:center; padding:90px 0; color:#9ca3af; }
            .si-empty-btn { display:inline-block; padding:10px 22px; border-radius:12px; text-decoration:none; color:white; font-size:13px; font-weight:700; margin:4px; }

            @media(max-width:960px) {
                .si-stats { grid-template-columns:1fr 1fr; }
                .si-2col { grid-template-columns:1fr; }
                .si { padding:24px 20px 100px; }
            }
            @media(max-width:600px) {
                .si { padding:20px 14px 100px; }
                .si-stats { grid-template-columns:1fr 1fr; }
                .si-hero h2 { font-size:22px; }
            }
        `}</style>

        <div className="si">
            {/* Hero */}
            <div className="si-hero" style={{ ...fi(0.05), background: tConf.bg }}>
                <div className="si-hero-glow" />
                <div className="si-hero-glow2" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div style={{ flex: 1 }}>
                        <span className="si-hero-badge">Current Status</span>
                        <h2>Your mood is {tConf.label.toLowerCase()}.</h2>
                        <p>
                            {summary?.aiSummary
                                ? summary.aiSummary.substring(0, 160) + (summary.aiSummary.length > 160 ? '…' : '')
                                : 'Your emotional patterns are being analyzed. Keep logging to see insights.'}
                        </p>
                    </div>
                    {summary?.stabilityScore != null && (
                        <StabilityRing score={summary.stabilityScore} />
                    )}
                </div>
            </div>

            {/* Page title + tabs */}
            <div style={fi(0.08)}>
                <div style={{ marginBottom: 18 }}>
                    <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                        Sentiment Analysis
                    </h1>
                    <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                        AI-powered emotional pattern tracking to understand your mental wellbeing journey.
                    </p>
                </div>
                <div className="si-tabs">
                    {[
                        { k: 'overview',  l: 'Overview' },
                        { k: 'timeline',  l: 'Timeline'  },
                        { k: 'entries',   l: 'Entries'   },
                    ].map(t => (
                        <button key={t.k} className={`si-tab ${activeTab === t.k ? 'on' : 'off'}`}
                            onClick={() => setActiveTab(t.k)}>{t.l}</button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="si-empty"><p style={{ fontSize: 32, margin: '0 0 12px' }}>⏳</p><p>Loading sentiment data…</p></div>
            ) : noData ? (
                <div className="si-empty">
                    <p style={{ fontSize: 44, margin: '0 0 14px' }}>🌱</p>
                    <p style={{ fontSize: 17, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No data yet</p>
                    <p style={{ fontSize: 14, margin: '0 0 22px' }}>Save a mood log or journal entry to start tracking.</p>
                    <Link to="/dashboard" className="si-empty-btn" style={{ background: '#6366f1' }}>Log Mood</Link>
                    <Link to="/journal" className="si-empty-btn" style={{ background: '#7c3aed' }}>Write Journal</Link>
                </div>
            ) : (
                <>
                    {/* ════════ OVERVIEW ════════ */}
                    {activeTab === 'overview' && summary && (
                        <div style={fi(0.13)}>
                            {/* Crisis alert */}
                            {summary.crisisCount > 0 && (
                                <div className="si-crisis">
                                    <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#dc2626', fontSize: 15 }}>⚠️ Crisis signals detected</p>
                                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                                        Our AI detected {summary.crisisCount} entr{summary.crisisCount === 1 ? 'y' : 'ies'} with potential distress signals.
                                    </p>
                                    <Link to="/crisis" style={{ color: '#dc2626', fontWeight: 700, fontSize: 13 }}>View Crisis Resources →</Link>
                                </div>
                            )}

                            {/* Stat cards + AI summary */}
                            <div className="si-stats" style={{ marginBottom: 18 }}>
                                {/* Avg sentiment */}
                                <div className="si-stat">
                                    <p className="si-stat-lbl">Avg Sentiment</p>
                                    <p className="si-stat-num" style={{ color: summary.avgScore > 0 ? '#10b981' : summary.avgScore < 0 ? '#ef4444' : '#6b7280' }}>
                                        {summary.avgScore > 0 ? '+' : ''}{summary.avgScore}
                                    </p>
                                    <p className="si-stat-sub">
                                        {Math.abs(summary.avgScore) < 0.2 ? 'Neutral range' : summary.avgScore > 0 ? 'Slightly positive' : 'Below neutral'}
                                    </p>
                                </div>

                                {/* Entries */}
                                <div className="si-stat">
                                    <p className="si-stat-lbl">Entries Analyzed</p>
                                    <p className="si-stat-num" style={{ color: '#6366f1' }}>{summary.totalEntries}</p>
                                    <p className="si-stat-sub">This month</p>
                                </div>

                                {/* Crisis */}
                                <div className="si-stat">
                                    <p className="si-stat-lbl">Crisis Flags</p>
                                    <p className="si-stat-num" style={{ color: summary.crisisCount > 0 ? '#ef4444' : '#10b981' }}>
                                        {summary.crisisCount}
                                    </p>
                                    <p className="si-stat-sub">{summary.crisisCount > 0 ? 'Needs attention' : 'Clear of alerts'}</p>
                                </div>

                                {/* AI summary */}
                                <div className="si-ai-card">
                                    <div className="si-ai-head">
                                        <div className="si-ai-icon">✨</div>
                                        <span className="si-ai-title">Your AI Summary</span>
                                    </div>
                                    <p className="si-ai-text">
                                        {summary.aiSummary
                                            ? `"${summary.aiSummary.substring(0, 180)}${summary.aiSummary.length > 180 ? '…' : ''}" `
                                            : '"Keep logging to build a richer emotional picture."'}
                                    </p>
                                    <p className="si-focus-lbl">Suggested Focus</p>
                                    <div className="si-focus-tags">
                                        {FOCUS_TAGS.slice(0, 3).map(t => (
                                            <span key={t} className="si-focus-tag">{t}</span>
                                        ))}
                                    </div>
                                    <Link to="/exercises">
                                        <button className="si-schedule-btn">Explore Exercises →</button>
                                    </Link>
                                </div>
                            </div>

                            {/* Sentiment Breakdown + Top Emotions */}
                            <div className="si-2col">
                                <div className="si-card">
                                    <p className="si-ct">Sentiment Breakdown</p>
                                    <p className="si-cs">Distribution across all entries</p>
                                    {breakdownData.map(item => (
                                        <div key={item.name} className="si-bk-row">
                                            <span className="si-bk-name">{item.name}</span>
                                            <div className="si-bk-bar-bg">
                                                <div className="si-bk-bar-fill" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                                            </div>
                                            <span className="si-bk-pct">{item.pct}%</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="si-card">
                                    <p className="si-ct">Top Emotions</p>
                                    <p className="si-cs">Most frequent this month</p>
                                    {emotionBarData.length === 0 ? (
                                        <p style={{ fontSize: 13, color: '#9ca3af' }}>No emotion data yet.</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={160}>
                                            <BarChart data={emotionBarData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }} barSize={24}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                                <YAxis hide />
                                                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
                                                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                                                    {emotionBarData.map((_, i) => (
                                                        <Cell key={i} fill={EMO_COLORS[i % EMO_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════ TIMELINE ════════ */}
                    {activeTab === 'timeline' && (
                        <div style={fi(0.1)}>
                            <div className="si-card">
                                <div className="si-timeline-head">
                                    <div>
                                        <p className="si-ct">Sentiment Timeline</p>
                                        <p className="si-cs">Last 30 days emotional trajectory</p>
                                    </div>
                                </div>
                                {chartData.length < 2 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                        <p style={{ fontSize: 32, margin: '0 0 8px' }}>📊</p>
                                        <p style={{ fontSize: 14, margin: 0 }}>Need at least 2 entries to show the timeline.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="sg2" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%"  stopColor="#c4b5fd" stopOpacity={0.15} />
                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<ChartTip />} />
                                            <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: 'Neutral', position: 'right', fontSize: 10, fill: '#d1d5db' }} />
                                            <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
                                                fill="url(#sg)"
                                                dot={{ r: 5, fill: '#7c3aed', stroke: 'white', strokeWidth: 2 }}
                                                activeDot={{ r: 7 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════ ENTRIES ════════ */}
                    {activeTab === 'entries' && (
                        <div style={fi(0.1)}>
                            <div style={{ marginBottom: 20 }}>
                                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Recent Entries</h2>
                                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{history.length} analyzed entries</p>
                            </div>

                            {history.length === 0 ? (
                                <div className="si-empty"><p>No analyzed entries yet.</p></div>
                            ) : history.map(record => {
                                const col = SENT_COLORS[record.sentiment] || SENT_COLORS.neutral;
                                return (
                                    <div key={record._id} className="si-entry">
                                        <div className="si-entry-top">
                                            <div>
                                                <div className="si-entry-badges">
                                                    <span className="si-badge" style={{ background: col.bg, color: col.text }}>
                                                        {record.sentiment}
                                                    </span>
                                                    <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 15, fontWeight: 800, color: col.text }}>
                                                        {record.sentimentScore > 0 ? '+' : ''}{record.sentimentScore?.toFixed(2)}
                                                    </span>
                                                    {record.crisisFlag && (
                                                        <span className="si-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠️ Crisis</span>
                                                    )}
                                                </div>
                                                <p className="si-entry-date">{formatShort(record.createdAt)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 5 }}>
                                                {record.source && (
                                                    <span className="si-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                                        {SOURCE_LABELS[record.source] || record.source}
                                                    </span>
                                                )}
                                                {record.emotions?.primary && (
                                                    <span className="si-badge" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                                                        {EMOTION_EMOJIS[record.emotions.primary] || '💭'} {record.emotions.primary}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="si-entry-text">
                                            "{record.text?.substring(0, 160)}{record.text?.length > 160 ? '…' : ''}"
                                        </p>

                                        {record.insight && (
                                            <div className="si-insight">
                                                <div className="si-insight-head">
                                                    <div className="si-insight-dot" />
                                                    <span className="si-insight-lbl">AI Insight</span>
                                                </div>
                                                <p className="si-insight-text">{record.insight}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
        </>
    );
}
