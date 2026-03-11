import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import api from '../config/axios';

const SLEEP_FACTORS = [
    { id: 'stress',      label: '😰 Stress',       },
    { id: 'caffeine',    label: '☕ Caffeine',      },
    { id: 'exercise',    label: '🏃 Exercise',      },
    { id: 'screen-time', label: '📱 Screen Time',   },
    { id: 'alcohol',     label: '🍷 Alcohol',       },
    { id: 'late-meal',   label: '🍔 Late Meal',     },
    { id: 'anxiety',     label: '😟 Anxiety',       },
    { id: 'noise',       label: '🔊 Noise',         },
    { id: 'comfortable', label: '🛏️ Comfortable',   },
    { id: 'relaxed',     label: '😌 Relaxed',       },
    { id: 'meditated',   label: '🧘 Meditated',     },
    { id: 'no-caffeine', label: '✅ No Caffeine',   },
];

const QUALITY_LABELS = { 1: 'Terrible', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent' };
const QUALITY_COLORS = { 1: '#dc2626', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e' };

const CORRELATION_TEXT = (r) => {
    if (r === null) return null;
    if (r >= 0.7)  return { text: 'Strong positive link — better sleep clearly boosts your mood! 🌟', color: '#16a34a' };
    if (r >= 0.4)  return { text: 'Moderate link — sleep quality tends to affect your mood.', color: '#84cc16' };
    if (r >= 0.1)  return { text: 'Weak link — some connection between your sleep and mood.', color: '#eab308' };
    if (r >= -0.1) return { text: 'No clear link detected yet — log more entries for better insight.', color: '#9ca3af' };
    return { text: 'Unusual pattern — your mood seems unrelated to sleep quality currently.', color: '#6b7280' };
};

const today = new Date().toISOString().split('T')[0];
const stars = (q) => '★'.repeat(q) + '☆'.repeat(5 - q);

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontFamily: 'sans-serif', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#111827' }}>{d.date}</p>
            {d.duration && <p style={{ margin: '0 0 2px', color: '#6366f1' }}>🌙 {d.duration}h sleep</p>}
            {d.quality  && <p style={{ margin: '0 0 2px', color: QUALITY_COLORS[Math.round(d.quality)] }}>{stars(d.quality)} ({QUALITY_LABELS[Math.round(d.quality)]})</p>}
            {d.mood     && <p style={{ margin: 0, color: '#f59e0b' }}>😊 Mood: {d.mood}/10</p>}
        </div>
    );
};

export default function SleepTracker() {
    const [view, setView]       = useState('log');    // 'log' | 'trends' | 'history'
    const [logs, setLogs]       = useState([]);
    const [stats, setStats]     = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving]   = useState(false);
    const [savedEntry, setSavedEntry] = useState(null);
    const [error, setError]     = useState('');

    // Form state
    const [form, setForm] = useState({
        date: today,
        bedtime: '23:00',
        wakeTime: '07:00',
        quality: 3,
        factors: [],
        notes: '',
    });

    const navigate = useNavigate();

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                api.get('/sleep'),
                api.get('/sleep/stats'),
            ]);
            setLogs(logsRes.data.data);
            setStats(statsRes.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load sleep data.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFactor = (id) => {
        setForm(f => ({
            ...f,
            factors: f.factors.includes(id)
                ? f.factors.filter(x => x !== id)
                : [...f.factors, id],
        }));
    };

    const calcPreviewDuration = () => {
        const [bH, bM] = form.bedtime.split(':').map(Number);
        const [wH, wM] = form.wakeTime.split(':').map(Number);
        let mins = (wH * 60 + wM) - (bH * 60 + bM);
        if (mins < 0) mins += 1440;
        return (mins / 60).toFixed(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            const res = await api.post('/sleep', form);
            setSavedEntry(res.data.data);
            fetchAll();
        } catch (err) {
            if (err.response?.status === 409) setError('You already logged sleep for this date.');
            else setError('Failed to save sleep log.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this sleep log?')) return;
        try {
            await api.delete(`/sleep/${id}`);
            setLogs(prev => prev.filter(l => l._id !== id));
        } catch { setError('Failed to delete.'); }
    };

    // Chart data
    const chartData = [...logs].reverse().slice(-14).map(l => ({
        date:     l.date.slice(5),       // MM-DD
        duration: l.durationHours,
        quality:  l.quality,
        mood:     l.correlatedMoodScore,
    }));

    const scatterData = logs
        .filter(l => l.correlatedMoodScore && l.quality)
        .map(l => ({ x: l.quality, y: l.correlatedMoodScore, z: l.durationHours || 7 }));

    const corrInfo = CORRELATION_TEXT(stats?.correlation ?? null);
    const duration = calcPreviewDuration();

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🌙 Sleep Tracker</h1>
                    <p style={s.subtitle}>Log sleep quality and see how it shapes your mood</p>
                </div>
                <div style={s.headerLinks}>
                    <Link to="/dashboard" style={s.link}>← Dashboard</Link>
                    <Link to="/exercises" style={s.link}>🧘 Exercises</Link>
                </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            {/* Tabs */}
            <div style={s.tabs}>
                {['log', 'trends', 'history'].map(t => (
                    <button key={t} style={s.tab(view === t)} onClick={() => setView(t)}>
                        {{ log: '🛌 Log Sleep', trends: '📈 Trends', history: '🗂 History' }[t]}
                    </button>
                ))}
            </div>

            {/* ══ LOG TAB ══ */}
            {view === 'log' && (
                <>
                    {savedEntry ? (
                        <div style={s.savedCard}>
                            <div style={s.savedHeader}>
                                <span style={s.savedBadge}>✅ Sleep Logged</span>
                                <span style={s.savedDate}>{savedEntry.date}</span>
                            </div>

                            {/* Summary */}
                            <div style={s.savedGrid}>
                                <div style={s.savedStat}>
                                    <span style={s.savedStatNum}>{savedEntry.durationHours ?? '—'}h</span>
                                    <span style={s.savedStatLabel}>Duration</span>
                                </div>
                                <div style={s.savedStat}>
                                    <span style={{ ...s.savedStatNum, color: QUALITY_COLORS[savedEntry.quality] }}>
                                        {stars(savedEntry.quality)}
                                    </span>
                                    <span style={s.savedStatLabel}>{QUALITY_LABELS[savedEntry.quality]}</span>
                                </div>
                                <div style={s.savedStat}>
                                    <span style={s.savedStatNum}>
                                        {savedEntry.correlatedMoodScore ? `${savedEntry.correlatedMoodScore}/10` : '—'}
                                    </span>
                                    <span style={s.savedStatLabel}>Mood Today</span>
                                </div>
                            </div>

                            {savedEntry.aiInsight && (
                                <div style={s.aiBox}>
                                    <strong style={s.aiLabel}>🤖 Sleep Insight</strong>
                                    <p style={s.aiText}>{savedEntry.aiInsight}</p>
                                </div>
                            )}

                            <button onClick={() => { setSavedEntry(null); setForm({ date: today, bedtime: '23:00', wakeTime: '07:00', quality: 3, factors: [], notes: '' }); }} style={s.newBtn}>
                                + Log Another Night
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={s.formCard}>
                            <h3 style={s.formTitle}>How did you sleep?</h3>

                            {/* Date */}
                            <label style={s.label}>Date</label>
                            <input type="date" value={form.date} max={today}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                style={s.input} />

                            {/* Bedtime / Wake time */}
                            <div style={s.twoCol}>
                                <div>
                                    <label style={s.label}>Bedtime</label>
                                    <input type="time" value={form.bedtime}
                                        onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))}
                                        style={s.input} />
                                </div>
                                <div>
                                    <label style={s.label}>Wake Time</label>
                                    <input type="time" value={form.wakeTime}
                                        onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))}
                                        style={s.input} />
                                </div>
                            </div>

                            {/* Duration preview */}
                            <div style={s.durationPreview(Number(duration))}>
                                <span style={s.durationNum}>{duration}h</span>
                                <span style={s.durationLabel}>
                                    {Number(duration) >= 8 ? '✅ Great amount!' : Number(duration) >= 7 ? '👍 Good' : Number(duration) >= 6 ? '⚠️ A bit short' : '😴 Sleep debt risk'}
                                </span>
                            </div>

                            {/* Quality stars */}
                            <label style={s.label}>Sleep Quality</label>
                            <div style={s.starRow}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} type="button"
                                        onClick={() => setForm(f => ({ ...f, quality: n }))}
                                        style={s.starBtn(n <= form.quality, QUALITY_COLORS[n])}>
                                        ★
                                    </button>
                                ))}
                                <span style={{ fontSize: '14px', color: QUALITY_COLORS[form.quality], fontWeight: '700', marginLeft: '8px' }}>
                                    {QUALITY_LABELS[form.quality]}
                                </span>
                            </div>

                            {/* Factors */}
                            <label style={s.label}>What affected your sleep?</label>
                            <div style={s.factorGrid}>
                                {SLEEP_FACTORS.map(f => (
                                    <button key={f.id} type="button"
                                        onClick={() => toggleFactor(f.id)}
                                        style={s.factorBtn(form.factors.includes(f.id))}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Notes */}
                            <label style={s.label}>Notes (optional)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Anything else that affected your sleep..."
                                style={s.textarea}
                                rows={3}
                            />

                            <button type="submit" disabled={isSaving} style={s.submitBtn(isSaving)}>
                                {isSaving ? '✨ Saving & Analyzing…' : '💾 Save Sleep Log'}
                            </button>
                        </form>
                    )}
                </>
            )}

            {/* ══ TRENDS TAB ══ */}
            {view === 'trends' && (
                <>
                    {isLoading ? (
                        <div style={s.emptyState}>⏳ Loading…</div>
                    ) : !stats?.hasData ? (
                        <div style={s.emptyState}>
                            <p style={{ fontSize: '40px', margin: '0 0 10px' }}>🌙</p>
                            <p>No sleep data yet. Log your first night above!</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats row */}
                            <div style={s.statsGrid}>
                                <div style={s.statCard}>
                                    <p style={s.statNum('#6366f1')}>{stats.avgDuration ?? '—'}h</p>
                                    <p style={s.statLabel}>Avg Duration</p>
                                </div>
                                <div style={s.statCard}>
                                    <p style={s.statNum(QUALITY_COLORS[Math.round(stats.avgQuality)])}>
                                        {stats.avgQuality}★
                                    </p>
                                    <p style={s.statLabel}>Avg Quality</p>
                                </div>
                                <div style={s.statCard}>
                                    <p style={s.statNum(stats.shortNights > 3 ? '#dc2626' : '#16a34a')}>
                                        {stats.shortNights}
                                    </p>
                                    <p style={s.statLabel}>Short Nights</p>
                                </div>
                                <div style={s.statCard}>
                                    <p style={s.statNum('#111827')}>{stats.totalLogs}</p>
                                    <p style={s.statLabel}>Nights Logged</p>
                                </div>
                            </div>

                            {/* Correlation insight */}
                            {corrInfo && (
                                <div style={s.corrCard(corrInfo.color)}>
                                    <p style={s.corrTitle}>💡 Sleep–Mood Correlation: {stats.correlation > 0 ? '+' : ''}{stats.correlation}</p>
                                    <p style={s.corrText}>{corrInfo.text}</p>
                                </div>
                            )}

                            {/* Sleep + Mood chart */}
                            {chartData.length >= 2 && (
                                <div style={s.chartCard}>
                                    <p style={s.chartTitle}>🌙 Sleep Duration & 😊 Mood (Last 14 nights)</p>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis yAxisId="left"  domain={[0, 12]} tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'Mood', angle: 90, position: 'insideRight', offset: 10, fontSize: 10, fill: '#9ca3af' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar yAxisId="left" dataKey="duration" name="Sleep (hrs)" fill="#818cf8" radius={[4, 4, 0, 0]} opacity={0.8} />
                                            <Line yAxisId="right" type="monotone" dataKey="mood" name="Mood /10" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', stroke: 'white', strokeWidth: 2 }} connectNulls />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Sleep quality chart */}
                            {chartData.length >= 2 && (
                                <div style={s.chartCard}>
                                    <p style={s.chartTitle}>⭐ Sleep Quality Trend</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="quality" name="Quality (1-5)" fill="#34d399" radius={[4, 4, 0, 0]} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Scatter: quality vs mood */}
                            {scatterData.length >= 3 && (
                                <div style={s.chartCard}>
                                    <p style={s.chartTitle}>🔬 Sleep Quality vs Mood (scatter)</p>
                                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 12px' }}>Each dot = one night. Bigger dot = more hours slept.</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="x" name="Sleep Quality" domain={[0, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10 }} label={{ value: 'Sleep Quality', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                                            <YAxis dataKey="y" name="Mood Score" domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: 'Mood', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                                            <ZAxis dataKey="z" range={[40, 200]} />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0].payload;
                                                return (
                                                    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}>
                                                        <p style={{ margin: '0 0 2px' }}>Sleep: {d.x}★</p>
                                                        <p style={{ margin: '0 0 2px' }}>Mood: {d.y}/10</p>
                                                        {d.z && <p style={{ margin: 0 }}>Duration: {d.z}h</p>}
                                                    </div>
                                                );
                                            }} />
                                            <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.7} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Top factors */}
                            {stats.topFactors?.length > 0 && (
                                <div style={s.chartCard}>
                                    <p style={s.chartTitle}>🔍 Most Common Sleep Factors</p>
                                    {stats.topFactors.map(({ factor, count }) => (
                                        <div key={factor} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>{factor.replace('-', ' ')}</span>
                                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>{count}x</span>
                                            </div>
                                            <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${(count / stats.topFactors[0].count) * 100}%`, backgroundColor: '#818cf8', borderRadius: '4px', transition: 'width 0.5s' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ══ HISTORY TAB ══ */}
            {view === 'history' && (
                <div>
                    {logs.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ fontSize: '36px', margin: '0 0 10px' }}>🌙</p>
                            <p>No sleep logs yet.</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log._id} style={s.historyCard}>
                                <div style={s.historyHeader}>
                                    <div>
                                        <p style={s.historyDate}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                        <div style={s.historyMeta}>
                                            <span style={{ ...s.qualityBadge, color: QUALITY_COLORS[log.quality], backgroundColor: `${QUALITY_COLORS[log.quality]}15` }}>
                                                {stars(log.quality)}
                                            </span>
                                            {log.durationHours && <span style={s.durationBadge}>{log.durationHours}h</span>}
                                            {log.correlatedMoodScore && <span style={s.moodBadge}>😊 {log.correlatedMoodScore}/10</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(log._id)} style={s.deleteBtn}>🗑</button>
                                </div>

                                {log.factors?.length > 0 && (
                                    <div style={s.factorTags}>
                                        {log.factors.map(f => (
                                            <span key={f} style={s.factorTag}>{f.replace('-', ' ')}</span>
                                        ))}
                                    </div>
                                )}

                                {log.aiInsight && (
                                    <div style={s.aiBox}>
                                        <strong style={s.aiLabel}>🤖 Insight</strong>
                                        <p style={s.aiText}>{log.aiInsight}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
    page: { maxWidth: '680px', margin: '40px auto', padding: '0 16px 40px', fontFamily: "'Segoe UI', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' },
    subtitle: { margin: 0, fontSize: '14px', color: '#6b7280' },
    headerLinks: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
    link: { textDecoration: 'none', color: '#6366f1', fontWeight: '600', fontSize: '13px' },
    errorBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
    tabs: { display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '24px' },
    tab: (active) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', backgroundColor: active ? 'white' : 'transparent', color: active ? '#6366f1' : '#6b7280', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }),
    emptyState: { textAlign: 'center', padding: '60px 0', color: '#9ca3af' },
    formCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    formTitle: { margin: '0 0 20px', fontSize: '17px', fontWeight: '700', color: '#111827' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', marginTop: '16px' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', boxSizing: 'border-box', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    durationPreview: (hrs) => ({ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: hrs >= 7 ? '#f0fdf4' : hrs >= 6 ? '#fefce8' : '#fef2f2', border: `1px solid ${hrs >= 7 ? '#bbf7d0' : hrs >= 6 ? '#fde68a' : '#fecaca'}`, borderRadius: '10px', padding: '10px 14px', marginTop: '10px' }),
    durationNum: { fontSize: '22px', fontWeight: '800', color: '#111827' },
    durationLabel: { fontSize: '13px', color: '#6b7280' },
    starRow: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' },
    starBtn: (active, color) => ({ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', color: active ? color : '#e5e7eb', transition: 'color 0.15s', lineHeight: 1 }),
    factorGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' },
    factorBtn: (active) => ({ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${active ? '#6366f1' : '#e5e7eb'}`, backgroundColor: active ? '#ede9fe' : 'white', color: active ? '#6366f1' : '#6b7280', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400', transition: 'all 0.15s' }),
    textarea: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', marginBottom: '4px' },
    submitBtn: (disabled) => ({ width: '100%', padding: '13px', marginTop: '16px', backgroundColor: disabled ? '#e5e7eb' : '#6366f1', color: disabled ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '700', fontFamily: 'inherit' }),
    savedCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    savedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    savedBadge: { backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
    savedDate: { fontSize: '13px', color: '#9ca3af' },
    savedGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' },
    savedStat: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #f3f4f6' },
    savedStatNum: { display: 'block', fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '2px' },
    savedStatLabel: { fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' },
    aiBox: { backgroundColor: '#fffbeb', borderLeft: '3px solid #a16207', padding: '14px', borderRadius: '0 10px 10px 0', marginBottom: '16px' },
    aiLabel: { display: 'block', fontSize: '12px', color: '#a16207', fontWeight: '700', marginBottom: '6px' },
    aiText: { margin: 0, fontSize: '14px', color: '#292524', lineHeight: '1.6' },
    newBtn: { width: '100%', padding: '12px', backgroundColor: '#f0f4ff', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' },
    statCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', textAlign: 'center' },
    statNum: (color) => ({ fontSize: '22px', fontWeight: '800', color, margin: '0 0 4px', display: 'block' }),
    statLabel: { fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 },
    corrCard: (color) => ({ backgroundColor: `${color}10`, border: `1px solid ${color}30`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }),
    corrTitle: { margin: '0 0 6px', fontWeight: '700', fontSize: '14px', color: '#111827' },
    corrText: { margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5' },
    chartCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    chartTitle: { margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#111827' },
    historyCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
    historyDate: { margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: '#111827' },
    historyMeta: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
    qualityBadge: { fontSize: '14px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' },
    durationBadge: { fontSize: '12px', backgroundColor: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' },
    moodBadge: { fontSize: '12px', backgroundColor: '#fefce8', color: '#a16207', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' },
    deleteBtn: { background: 'none', border: '1px solid #fee2e2', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px' },
    factorTags: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' },
    factorTag: { fontSize: '12px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' },
};