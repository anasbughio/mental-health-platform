import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, BarChart,
} from 'recharts';
import api from '../config/axios';

// ── Constants ─────────────────────────────────────────────────────────────────
const WELLNESS_COLOR = (s) => s >= 8 ? '#16a34a' : s >= 6 ? '#84cc16' : s >= 4 ? '#f59e0b' : '#dc2626';
const TREND_ICON  = { up: '📈', down: '📉', stable: '➡️' };
const TREND_COLOR = { up: '#16a34a', down: '#dc2626', stable: '#6b7280' };

const CORR_LABEL = (r) => {
    if (r === null || r === undefined) return { text: 'Not enough data', color: '#9ca3af' };
    const a = Math.abs(r);
    const dir = r > 0 ? 'positive' : 'negative';
    if (a >= 0.7) return { text: `Strong ${dir}`, color: r > 0 ? '#16a34a' : '#dc2626' };
    if (a >= 0.4) return { text: `Moderate ${dir}`, color: r > 0 ? '#84cc16' : '#f97316' };
    if (a >= 0.1) return { text: `Weak ${dir}`, color: '#eab308' };
    return { text: 'No correlation', color: '#9ca3af' };
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#111827' }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ margin: '2px 0', color: p.color }}>
                    {p.name}: {p.value !== null && p.value !== undefined ? p.value : '—'}
                </p>
            ))}
        </div>
    );
};

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, sub, color = '#6366f1', trend, onClick }) => (
    <div onClick={onClick} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s', flex: '1 1 140px', minWidth: 130 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            {trend && <span style={{ fontSize: 13, color: TREND_COLOR[trend] }}>{TREND_ICON[trend]}</span>}
        </div>
        <p style={{ margin: '10px 0 2px', fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</p>
        <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {sub && <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
    </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children, action }) => (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</p>
            {action}
        </div>
        {children}
    </div>
);

// ── Activity heatmap (30-day) ─────────────────────────────────────────────────
const ActivityHeatmap = ({ timeline }) => {
    const weeks = [];
    let week = [];
    timeline.forEach((day, i) => {
        week.push(day);
        if (week.length === 7 || i === timeline.length - 1) { weeks.push(week); week = []; }
    });

    const getColor = (day) => {
        const score = [day.mood ? 1 : 0, day.sleepQuality ? 1 : 0, day.journaled ? 1 : 0, day.exercised ? 1 : 0].reduce((a,b)=>a+b,0);
        if (score === 0) return '#f3f4f6';
        if (score === 1) return '#c7d2fe';
        if (score === 2) return '#818cf8';
        if (score === 3) return '#6366f1';
        return '#4338ca';
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {weeks.map((w, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {w.map((day, di) => (
                            <div key={di} title={`${day.date}\nMood: ${day.mood ?? '—'}\nSleep: ${day.sleepQuality ?? '—'}★\nJournal: ${day.journaled ? '✓' : '—'}\nExercise: ${day.exercised ? '✓' : '—'}`}
                                style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: getColor(day), cursor: 'default' }} />
                        ))}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Less</span>
                {['#f3f4f6','#c7d2fe','#818cf8','#6366f1','#4338ca'].map(c => (
                    <div key={c} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c }} />
                ))}
                <span style={{ fontSize: 11, color: '#9ca3af' }}>More active</span>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Analytics() {
    const [data, setData]         = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeRange, setActiveRange] = useState(30); // 7 | 14 | 30
    const [error, setError]       = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/analytics/overview');
            setData(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load analytics.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAiSummary = async () => {
        setAiLoading(true);
        try {
            const res = await api.get('/analytics/ai-summary');
            setAiSummary(res.data.data.summary);
        } catch { setAiSummary('Unable to generate summary right now.'); }
        finally { setAiLoading(false); }
    };

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'sans-serif', color: '#9ca3af' }}>
            ⏳ Loading your analytics…
        </div>
    );

    if (!data) return null;

    const { summary, correlations, timeline } = data;
    const rangedTimeline = timeline.slice(activeRange === 7 ? 23 : activeRange === 14 ? 16 : 0);

    // Radar chart data
    const radarData = [
        { subject: 'Mood',    value: summary.avgMood30 ? Math.round(summary.avgMood30 * 10) : 0,      max: 100 },
        { subject: 'Sleep',   value: summary.avgSleepQuality ? Math.round(summary.avgSleepQuality * 20) : 0, max: 100 },
        { subject: 'Journal', value: Math.min(100, Math.round((summary.journalCount30 / 20) * 100)),  max: 100 },
        { subject: 'Exercise',value: Math.min(100, Math.round((summary.exerciseCount30 / 12) * 100)), max: 100 },
        { subject: 'Goals',   value: summary.activeGoals ? Math.min(100, Math.round((summary.goalsOnStreak / summary.activeGoals) * 100)) : 0, max: 100 },
    ];

    // Emotion bar data
    const emotionData = (summary.topEmotions || []).map(e => ({ name: e.emotion, count: e.count }));

    const hasData = summary.totalDataPoints > 0;

    return (
        <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px 60px', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>📈 Analytics</h1>
                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Your mental health data, all in one place</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <Link to="/dashboard" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 600, fontSize: 13 }}>← Dashboard</Link>
                    <Link to="/weekly-report" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 600, fontSize: 13 }}>📊 Weekly Report</Link>
                </div>
            </div>

            {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{error}</div>}

            {!hasData ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                    <p style={{ fontSize: 48, margin: '0 0 14px' }}>📊</p>
                    <p style={{ fontSize: 17, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>No data yet</p>
                    <p style={{ fontSize: 14, margin: '0 0 24px' }}>Start logging your mood, sleep, and journals to see your analytics.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <Link to="/dashboard" style={btnStyle('#6366f1')}>Log Mood</Link>
                        <Link to="/sleep" style={btnStyle('#7c3aed')}>Log Sleep</Link>
                        <Link to="/journal" style={btnStyle('#0284c7')}>Write Journal</Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Wellness Score ── */}
                    <div style={{ background: `linear-gradient(135deg, ${WELLNESS_COLOR(summary.wellnessScore)}15 0%, white 100%)`, border: `1px solid ${WELLNESS_COLOR(summary.wellnessScore)}30`, borderRadius: 16, padding: '24px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>30-Day Wellness Score</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ fontSize: 56, fontWeight: 900, color: WELLNESS_COLOR(summary.wellnessScore), lineHeight: 1 }}>{summary.wellnessScore ?? '—'}</span>
                                <span style={{ fontSize: 20, color: '#9ca3af' }}>/10</span>
                            </div>
                            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
                                Based on {summary.totalDataPoints} data points across mood, sleep & sentiment
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, color: '#6b7280' }}>🔥 Activity streak</span>
                                <span style={{ fontSize: 20, fontWeight: 800, color: '#f97316' }}>{summary.currentStreak}d</span>
                            </div>
                            {!aiSummary ? (
                                <button onClick={fetchAiSummary} disabled={aiLoading} style={{ padding: '8px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                                    {aiLoading ? '✨ Thinking…' : '✨ Get AI Insight'}
                                </button>
                            ) : (
                                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6, maxWidth: 280, textAlign: 'right', fontStyle: 'italic' }}>💛 {aiSummary}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Metric Cards Row ── */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        <MetricCard icon="😊" label="Avg Mood (30d)"  value={summary.avgMood30} sub={`This week: ${summary.avgMoodThis7 ?? '—'}`} color="#f59e0b" trend={summary.moodTrend} onClick={() => navigate('/dashboard')} />
                        <MetricCard icon="🌙" label="Avg Sleep"       value={summary.avgSleepQuality ? `${summary.avgSleepQuality}★` : null} sub={summary.avgSleepDuration ? `${summary.avgSleepDuration}h avg` : null} color="#7c3aed" onClick={() => navigate('/sleep')} />
                        <MetricCard icon="📝" label="Journal Entries" value={summary.journalCount30} sub={`${summary.journalCount7} this week`} color="#0284c7" onClick={() => navigate('/journal')} />
                        <MetricCard icon="🧘" label="Exercises"       value={summary.exerciseCount30} sub={summary.avgMoodLift ? `+${summary.avgMoodLift} avg mood lift` : '30 days'} color="#16a34a" onClick={() => navigate('/exercises')} />
                        <MetricCard icon="🎯" label="Active Goals"    value={summary.activeGoals} sub={`${summary.goalsOnStreak} on streak`} color="#dc2626" onClick={() => navigate('/goals')} />
                    </div>

                    {/* ── Range selector ── */}
                    <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 14, width: 'fit-content' }}>
                        {[7, 14, 30].map(r => (
                            <button key={r} onClick={() => setActiveRange(r)}
                                style={{ padding: '7px 16px', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: activeRange === r ? 'white' : 'transparent', color: activeRange === r ? '#6366f1' : '#6b7280', boxShadow: activeRange === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: 'inherit' }}>
                                {r}d
                            </button>
                        ))}
                    </div>

                    {/* ── Main timeline chart ── */}
                    <Section title="😊 Mood · 🌙 Sleep · 💬 Sentiment">
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={rangedTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
                                <YAxis yAxisId="mood" domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis yAxisId="sleep" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Area yAxisId="mood" type="monotone" dataKey="mood" name="Mood /10" stroke="#f59e0b" fill="#fef9c3" strokeWidth={2.5} dot={false} connectNulls />
                                <Line yAxisId="sleep" type="monotone" dataKey="sleepQuality" name="Sleep ★" stroke="#7c3aed" strokeWidth={2} dot={false} connectNulls />
                                <Line yAxisId="mood" type="monotone" dataKey="sentiment" name="Sentiment" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Section>

                    {/* ── Sleep hours bar ── */}
                    {rangedTimeline.some(d => d.sleepHours) && (
                        <Section title="🌙 Sleep Duration (hours)">
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={rangedTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
                                    <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="sleepHours" name="Hours slept" radius={[4,4,0,0]}>
                                        {rangedTimeline.map((d, i) => (
                                            <Cell key={i} fill={!d.sleepHours ? '#f3f4f6' : d.sleepHours >= 8 ? '#22c55e' : d.sleepHours >= 7 ? '#84cc16' : d.sleepHours >= 6 ? '#eab308' : '#f97316'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                                {[['#22c55e','8h+ ideal'],['#84cc16','7-8h good'],['#eab308','6-7h fair'],['#f97316','<6h short']].map(([c,l]) => (
                                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{l}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* ── 2-col: Radar + Correlations ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        {/* Radar */}
                        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#111827' }}>🕸 Wellness Radar</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#f3f4f6" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <Radar name="You" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Correlations */}
                        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>🔗 Correlations</p>

                            {[
                                { label: '🌙 Sleep → 😊 Mood', r: correlations.moodSleep, tip: 'How much sleep quality predicts your mood' },
                                { label: '💬 Sentiment → 😊 Mood', r: correlations.moodSentiment, tip: 'How writing tone links to mood scores' },
                            ].map(({ label, r, tip }) => {
                                const info = CORR_LABEL(r);
                                const pct  = r !== null ? Math.round(Math.abs(r) * 100) : 0;
                                return (
                                    <div key={label} style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: info.color }}>{r !== null ? (r > 0 ? '+' : '') + r : '—'}</span>
                                        </div>
                                        <div style={{ height: 7, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: info.color, borderRadius: 4, transition: 'width 0.6s' }} />
                                        </div>
                                        <p style={{ margin: 0, fontSize: 11, color: info.color, fontWeight: 600 }}>{info.text}</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{tip}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Emotions bar ── */}
                    {emotionData.length > 0 && (
                        <Section title="💜 Top Emotions (30 days)">
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151', textTransform: 'capitalize' }} width={80} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="count" name="Times logged" radius={[0,4,4,0]}>
                                        {emotionData.map((_, i) => (
                                            <Cell key={i} fill={['#818cf8','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe'][i] || '#818cf8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
                    )}

                    {/* ── Activity heatmap ── */}
                    <Section title="📅 Activity Heatmap (30 days)"
                        action={<span style={{ fontSize: 12, color: '#9ca3af' }}>Hover a tile for details</span>}>
                        <ActivityHeatmap timeline={timeline} />
                        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                            {[['😊','Mood logged'],['🌙','Sleep logged'],['📝','Journal entry'],['🧘','Exercise done']].map(([icon, label]) => (
                                <span key={label} style={{ fontSize: 12, color: '#6b7280' }}>{icon} {label}</span>
                            ))}
                        </div>
                    </Section>

                    {/* ── Quick links ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {[
                            { to: '/dashboard',     icon: '😊', label: 'Log Mood'     },
                            { to: '/sleep',         icon: '🌙', label: 'Sleep'        },
                            { to: '/journal',       icon: '📝', label: 'Journal'      },
                            { to: '/exercises',     icon: '🧘', label: 'Exercises'    },
                            { to: '/goals',         icon: '🎯', label: 'Goals'        },
                            { to: '/sentiment',     icon: '🧬', label: 'Sentiment'    },
                            { to: '/weekly-report', icon: '📊', label: 'Weekly Report'},
                        ].map(({ to, icon, label }) => (
                            <Link key={to} to={to} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 10px', textDecoration: 'none', color: '#374151', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}>
                                <span style={{ fontSize: 22 }}>{icon}</span>
                                {label}
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const btnStyle = (bg) => ({
    display: 'inline-block', padding: '10px 18px', background: bg,
    color: 'white', borderRadius: 8, textDecoration: 'none',
    fontSize: 13, fontWeight: 600,
});