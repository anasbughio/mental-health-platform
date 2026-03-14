import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, Area, AreaChart,
    XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import api from '../config/axios';

const EMOTION_TAGS = ['Happy', 'Anxious', 'Calm', 'Overwhelmed', 'Productive', 'Exhausted', 'Grateful', 'Tired'];

const MOOD_COLORS = {
    1: '#ef4444', 2: '#f97316', 3: '#f97316', 4: '#eab308',
    5: '#eab308', 6: '#84cc16', 7: '#22c55e', 8: '#22c55e',
    9: '#10b981', 10: '#06b6d4'
};

const getMoodLabel = (s) => s <= 2 ? 'Very Low' : s <= 4 ? 'Low' : s <= 6 ? 'Moderate' : s <= 8 ? 'Good' : 'Radiant';
const getMoodEmoji = (s) => s <= 2 ? '😔' : s <= 4 ? '😟' : s <= 6 ? '😐' : s <= 8 ? '🙂' : '😊';

const EMOJI_STEPS = [
    { emoji: '😔', min: 1, max: 2, val: 2 },
    { emoji: '😟', min: 3, max: 4, val: 4 },
    { emoji: '😐', min: 5, max: 6, val: 6 },
    { emoji: '🙂', min: 7, max: 8, val: 7 },
    { emoji: '😊', min: 9, max: 10, val: 9 },
];

const getTodayGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const score = payload[0].value;
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13, fontFamily: 'inherit' }}>
            <p style={{ margin: '0 0 3px', color: '#9ca3af' }}>{label}</p>
            <p style={{ margin: 0, fontWeight: 700, color: MOOD_COLORS[score] || '#6366f1' }}>
                {getMoodEmoji(score)} {score}/10 — {getMoodLabel(score)}
            </p>
        </div>
    );
};

export default function Dashboard() {
    const [logs, setLogs]                         = useState([]);
    const [score, setScore]                       = useState(7);
    const [notes, setNotes]                       = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState([]);
    const [error, setError]                       = useState('');
    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [activeTab, setActiveTab]               = useState('log');
    const [userName, setUserName]                 = useState('');
    const [ready, setReady]                       = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
        api.get('/auth/me').then(r => setUserName((r.data.data?.name || '').split(' ')[0])).catch(() => {});
        setTimeout(() => setReady(true), 60);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/moods');
            setLogs(res.data.data);
        } catch (err) {
            setError('Failed to fetch logs.');
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const toggleEmotion = (e) =>
        setSelectedEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/moods', { moodScore: score, notes, emotions: selectedEmotions });
            setScore(7); setNotes(''); setSelectedEmotions([]);
            await fetchLogs();
            setActiveTab('trends');
        } catch { setError('Failed to save mood log.'); }
        finally { setIsSubmitting(false); }
    };

    const chartData = [...logs].slice(0, 14).reverse().map(log => ({
        date: new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
        score: log.moodScore,
    }));

    const avgScore  = logs.length ? (logs.reduce((s, l) => s + l.moodScore, 0) / logs.length).toFixed(1) : '—';
    const bestScore = logs.length ? Math.max(...logs.map(l => l.moodScore)) : '—';
    const streak = (() => {
        if (!logs.length) return 0;
        let c = 1;
        for (let i = 1; i < logs.length; i++) {
            const d = (new Date(new Date(logs[i-1].createdAt).toDateString()) - new Date(new Date(logs[i].createdAt).toDateString())) / 86400000;
            if (d <= 1) c++; else break;
        }
        return c;
    })();

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const mc = MOOD_COLORS[score] || '#6366f1';

    const fi = (delay) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .dp { width:100%; min-height:100vh; background:#f5f4f0; padding:36px 44px 100px; box-sizing:border-box; font-family:'DM Sans',sans-serif; }
            .dp h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; color:#111827; margin:0 0 4px; letter-spacing:-0.6px; }
            .dp-sub { font-size:14px; color:#9ca3af; margin:0 0 28px; }
            .dp-tabs { display:flex; gap:6px; margin-bottom:28px; }
            .dp-tab { padding:9px 22px; border-radius:30px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
            .dp-tab.on { background:#111827; color:white; box-shadow:0 2px 10px rgba(0,0,0,0.22); }
            .dp-tab.off { background:white; color:#6b7280; border:1px solid #e5e7eb; }
            .dp-tab.off:hover { color:#374151; background:#f9fafb; }

            /* layout */
            .dp-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }
            .dp-col2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }

            /* cards */
            .dp-card { background:white; border-radius:22px; padding:28px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .dp-card-sm { background:white; border-radius:18px; padding:20px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .dp-ct { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 16px; }

            /* emoji row */
            .dp-emojis { display:flex; justify-content:space-between; margin-bottom:18px; }
            .dp-ej { width:54px; height:54px; border-radius:50%; border:2.5px solid transparent; background:#f5f4f0; cursor:pointer; font-size:24px; display:flex; align-items:center; justify-content:center; transition:all 0.18s; flex-shrink:0; }
            .dp-ej:hover { transform:scale(1.15); background:#ede9fe; }
            .dp-ej.sel { border-color:#6366f1; background:#ede9fe; transform:scale(1.12); box-shadow:0 0 0 4px rgba(99,102,241,0.18); }

            /* slider */
            .dp-slider-labels { display:flex; justify-content:space-between; font-size:11px; color:#9ca3af; margin-bottom:7px; text-transform:uppercase; letter-spacing:0.05em; }
            .dp-slider { width:100%; height:6px; border-radius:3px; cursor:pointer; margin-bottom:22px; }

            /* tags */
            .dp-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
            .dp-tag { padding:6px 15px; border-radius:20px; border:1.5px solid #e5e7eb; background:white; color:#6b7280; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
            .dp-tag:hover { border-color:#a5b4fc; color:#6366f1; background:#f5f3ff; }
            .dp-tag.on { background:#6366f1; color:white; border-color:#6366f1; }

            /* textarea */
            .dp-ta { width:100%; height:100px; padding:14px; border:1.5px solid #e5e7eb; border-radius:12px; box-sizing:border-box; font-size:14px; resize:none; outline:none; font-family:'DM Sans',sans-serif; margin-bottom:18px; line-height:1.6; transition:border-color 0.2s; color:#374151; background:#fafafa; }
            .dp-ta:focus { border-color:#6366f1; background:white; }

            /* save button */
            .dp-btn { width:100%; padding:14px; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; box-shadow:0 4px 14px rgba(99,102,241,0.32); }
            .dp-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.42); }
            .dp-btn:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }

            /* stats */
            .dp-stat { background:white; border-radius:18px; padding:20px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .dp-stat-n { font-family:'Bricolage Grotesque',sans-serif; font-size:34px; font-weight:800; margin:0 0 2px; line-height:1; }
            .dp-stat-l { font-size:11px; color:#9ca3af; margin:0; text-transform:uppercase; letter-spacing:0.06em; font-weight:500; }
            .dp-stat-s { font-size:12px; margin:4px 0 0; font-weight:600; }

            /* insight */
            .dp-insight { background:linear-gradient(135deg,#fef9ec,#fef3c7); border:1px solid #fde68a; border-radius:18px; padding:18px 20px; margin-top:14px; }
            .dp-insight-t { font-size:13px; font-weight:700; color:#92400e; margin:0 0 6px; }
            .dp-insight-b { font-size:13px; color:#78350f; margin:0; line-height:1.6; }

            /* consistency */
            .dp-streak { background:linear-gradient(135deg,#f0fdf4,#dcfce7); border:1px solid #bbf7d0; border-radius:18px; padding:16px 18px; margin-top:14px; }
            .dp-streak-t { font-size:13px; font-weight:700; color:#166534; margin:0 0 5px; }
            .dp-streak-b { font-size:13px; color:#166534; margin:0; line-height:1.6; }

            /* past reflections */
            .dp-sec { font-family:'Bricolage Grotesque',sans-serif; font-size:19px; font-weight:800; color:#111827; margin:36px 0 16px; letter-spacing:-0.3px; display:flex; justify-content:space-between; align-items:center; }
            .dp-viewall { font-size:13px; color:#6366f1; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; background:none; border:none; }
            .dp-ref-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
            .dp-ref { background:white; border-radius:18px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); transition:transform 0.2s,box-shadow 0.2s; }
            .dp-ref:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(0,0,0,0.1); }
            .dp-ref-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
            .dp-ref-date { font-size:11px; color:#9ca3af; }
            .dp-ref-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
            .dp-ref-note { font-size:13px; color:#4b5563; line-height:1.65; margin:0 0 10px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; font-style:italic; }
            .dp-ref-tags { display:flex; gap:5px; flex-wrap:wrap; }
            .dp-ref-tag { font-size:11px; background:#f3f4f6; color:#6b7280; padding:2px 8px; border-radius:20px; }

            /* ai box */
            .dp-ai { background:#f0f4ff; border-left:3px solid #6366f1; padding:12px 14px; border-radius:0 10px 10px 0; margin-top:10px; }

            /* error */
            .dp-err { color:#dc2626; margin-bottom:16px; padding:12px 16px; background:#fee2e2; border-radius:12px; font-size:14px; }

            /* history items */
            .dp-hi { background:white; border-radius:18px; padding:22px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); transition:box-shadow 0.2s; }
            .dp-hi:hover { box-shadow:0 4px 16px rgba(0,0,0,0.09); }

            @media(max-width:960px) {
                .dp-grid { grid-template-columns:1fr; }
                .dp-ref-grid { grid-template-columns:1fr 1fr; }
                .dp { padding:24px 24px 100px; }
                .dp h1 { font-size:24px; }
            }
            @media(max-width:600px) {
                .dp-col2 { grid-template-columns:1fr; }
                .dp-ref-grid { grid-template-columns:1fr; }
                .dp { padding:20px 16px 100px; }
                .dp-tabs { flex-wrap:wrap; }
                .dp h1 { font-size:21px; }
            }
        `}</style>

        <div className="dp">
            {/* Header */}
            <div style={fi(0.05)}>
                <h1>{getTodayGreeting()}{userName ? `, ${userName}` : ''}! 👋</h1>
                <p className="dp-sub">Today is {today} — how are you feeling?</p>
            </div>

            {error && <div className="dp-err">{error}</div>}

            {/* Tabs */}
            <div className="dp-tabs" style={fi(0.1)}>
                {[{ k:'log', l:'📝 Log Mood' },{ k:'trends', l:'📊 Trends' },{ k:'history', l:'🗂 History' }].map(t => (
                    <button key={t.k} className={`dp-tab ${activeTab === t.k ? 'on' : 'off'}`} onClick={() => setActiveTab(t.k)}>{t.l}</button>
                ))}
            </div>

            {/* ════════════ LOG TAB ════════════ */}
            {activeTab === 'log' && (
                <div style={fi(0.15)}>
                    <div className="dp-grid">

                        {/* Form card */}
                        <div className="dp-card">
                            <p className="dp-ct">Quick Mood Check</p>

                            {/* Emoji picker */}
                            <div className="dp-emojis">
                                {EMOJI_STEPS.map(({ emoji, min, max, val }) => (
                                    <button key={emoji} type="button"
                                        className={`dp-ej ${score >= min && score <= max ? 'sel' : ''}`}
                                        onClick={() => setScore(val)}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>

                            {/* Slider */}
                            <div className="dp-slider-labels">
                                <span>Very Low</span>
                                <span style={{ color: mc, fontWeight: 700 }}>{getMoodLabel(score)} — {score}/10</span>
                                <span>Radiant</span>
                            </div>
                            <input type="range" min="1" max="10" value={score}
                                onChange={e => setScore(Number(e.target.value))}
                                className="dp-slider"
                                style={{ accentColor: mc }} />

                            {/* Tags */}
                            <p className="dp-ct" style={{ marginBottom: 12 }}>Identify your emotions</p>
                            <div className="dp-tags">
                                {EMOTION_TAGS.map(e => (
                                    <button key={e} type="button"
                                        className={`dp-tag ${selectedEmotions.includes(e) ? 'on' : ''}`}
                                        onClick={() => toggleEmotion(e)}>
                                        {e}
                                    </button>
                                ))}
                            </div>

                            {/* Notes */}
                            <p className="dp-ct" style={{ marginBottom: 10 }}>What's on your mind?</p>
                            <textarea className="dp-ta"
                                placeholder="Start typing your thoughts. Our AI will help you identify patterns later…"
                                value={notes} onChange={e => setNotes(e.target.value)} />

                            <button className="dp-btn" disabled={isSubmitting} onClick={handleSubmit}>
                                {isSubmitting ? '✨ Saving reflection…' : '💾 Save Reflection'}
                            </button>
                        </div>

                        {/* Right column */}
                        <div>
                            {/* Stat pills */}
                            <div className="dp-col2">
                                <div className="dp-stat">
                                    <p className="dp-stat-l">Avg Score</p>
                                    <p className="dp-stat-n" style={{ color: '#6366f1' }}>{avgScore}</p>
                                    <p className="dp-stat-s" style={{ color: '#10b981' }}>↑ tracking</p>
                                </div>
                                <div className="dp-stat">
                                    <p className="dp-stat-l">Streak</p>
                                    <p className="dp-stat-n" style={{ color: '#f59e0b' }}>{streak}</p>
                                    <p className="dp-stat-s" style={{ color: '#f59e0b' }}>🔥 days</p>
                                </div>
                            </div>

                            {/* Bar chart */}
                            <div className="dp-card-sm" style={{ marginBottom: 0 }}>
                                <p className="dp-ct">Weekly Mood Trend</p>
                                {chartData.length < 2 ? (
                                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>Log 2+ moods to see your trend</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={140}>
                                        <BarChart data={chartData.slice(-7)} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={20}>
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 10]} hide />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
                                            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                                {chartData.slice(-7).map((entry, i) => (
                                                    <Cell key={i} fill={MOOD_COLORS[entry.score] || '#6366f1'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* AI Insight */}
                            {logs[0]?.aiAdvice && (
                                <div className="dp-insight">
                                    <p className="dp-insight-t">🌟 AI Insight</p>
                                    <p className="dp-insight-b">{logs[0].aiAdvice}</p>
                                </div>
                            )}

                            {/* Streak badge */}
                            {streak >= 3 && (
                                <div className="dp-streak">
                                    <p className="dp-streak-t">🏆 Consistency Note</p>
                                    <p className="dp-streak-b">You've logged your mood for {streak} consecutive days. AI is personalizing your wellness plan.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Past Reflections */}
                    {logs.length > 0 && (
                        <div>
                            <div className="dp-sec">
                                Past Reflections
                                <button className="dp-viewall" onClick={() => setActiveTab('history')}>View All →</button>
                            </div>
                            <div className="dp-ref-grid">
                                {logs.slice(0, 3).map(log => {
                                    const col = MOOD_COLORS[log.moodScore] || '#6366f1';
                                    return (
                                        <div key={log._id} className="dp-ref">
                                            <div className="dp-ref-top">
                                                <span className="dp-ref-date">{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="dp-ref-badge" style={{ background: `${col}18`, color: col }}>{getMoodLabel(log.moodScore)}</span>
                                            </div>
                                            <p className="dp-ref-note">
                                                {log.notes ? `"${log.notes}"` : <span style={{ color: '#9ca3af', fontStyle: 'normal' }}>No note for this entry.</span>}
                                            </p>
                                            {log.emotions?.length > 0 && (
                                                <div className="dp-ref-tags">
                                                    {log.emotions.map(e => <span key={e} className="dp-ref-tag">{e}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════ TRENDS TAB ════════════ */}
            {activeTab === 'trends' && (
                <div style={fi(0.1)}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                        {[
                            { l: 'Avg Score',  v: avgScore,                          c: '#6366f1', s: `${logs.length} entries` },
                            { l: 'Best Score', v: bestScore !== '—' ? `${bestScore}/10` : '—', c: '#10b981', s: 'all time' },
                            { l: 'Day Streak', v: streak,                             c: '#f59e0b', s: '🔥 keep going' },
                        ].map(({ l, v, c, s }) => (
                            <div key={l} className="dp-stat">
                                <p className="dp-stat-l">{l}</p>
                                <p className="dp-stat-n" style={{ color: c }}>{v}</p>
                                <p className="dp-stat-s" style={{ color: '#9ca3af' }}>{s}</p>
                            </div>
                        ))}
                    </div>

                    <div className="dp-card" style={{ marginBottom: 16 }}>
                        <p className="dp-ct">Mood Over Time — Last 14 entries</p>
                        {chartData.length < 2 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                <p style={{ fontSize: 32, margin: '0 0 8px' }}>📊</p>
                                <p style={{ fontSize: 14, margin: 0 }}>Log at least 2 moods to see your chart</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.16} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[1,10]} ticks={[1,3,5,7,10]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={5} stroke="#e5e7eb" strokeDasharray="4 4" />
                                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                                        fill="url(#mg2)"
                                        dot={{ r: 5, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                                        activeDot={{ r: 7 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Emotion bars */}
                    {(() => {
                        const freq = {};
                        logs.forEach(l => l.emotions?.forEach(e => { freq[e] = (freq[e] || 0) + 1; }));
                        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                        if (!sorted.length) return null;
                        const max = sorted[0][1];
                        return (
                            <div className="dp-card">
                                <p className="dp-ct">Most Common Emotions</p>
                                {sorted.map(([emotion, count]) => (
                                    <div key={emotion} style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{emotion}</span>
                                            <span style={{ fontSize: 13, color: '#9ca3af' }}>{count}×</span>
                                        </div>
                                        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(count/max)*100}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ════════════ HISTORY TAB ════════════ */}
            {activeTab === 'history' && (
                <div style={{ ...fi(0.1), display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                            <p style={{ fontSize: 40, margin: '0 0 12px' }}>📭</p>
                            <p style={{ margin: 0, fontSize: 15 }}>No logs yet — go to Log Mood!</p>
                        </div>
                    ) : logs.map(log => {
                        const col = MOOD_COLORS[log.moodScore] || '#6366f1';
                        return (
                            <div key={log._id} className="dp-hi">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 26 }}>{getMoodEmoji(log.moodScore)}</span>
                                        <span style={{ background: `${col}18`, color: col, padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                                            {getMoodLabel(log.moodScore)} — {log.moodScore}/10
                                        </span>
                                    </div>
                                    <span style={{ color: '#9ca3af', fontSize: 12 }}>
                                        {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {log.emotions?.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                        {log.emotions.map(e => <span key={e} style={{ fontSize: 12, background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: 20 }}>{e}</span>)}
                                    </div>
                                )}
                                {log.notes && <p style={{ margin: '0', color: '#4b5563', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>"{log.notes}"</p>}
                                {log.aiAdvice && (
                                    <div className="dp-ai">
                                        <strong style={{ color: '#6366f1', display: 'block', marginBottom: 4, fontSize: 12 }}>✨ AI Companion</strong>
                                        <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: 13 }}>{log.aiAdvice}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        </>
    );
}