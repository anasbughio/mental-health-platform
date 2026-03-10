import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import api from '../config/axios';

const EMOTION_TAGS = ['Happy', 'Anxious', 'Calm', 'Overwhelmed', 'Productive', 'Exhausted'];

const MOOD_COLORS = {
    1: '#ef4444', 2: '#f97316', 3: '#f97316', 4: '#eab308',
    5: '#eab308', 6: '#84cc16', 7: '#22c55e', 8: '#22c55e',
    9: '#10b981', 10: '#06b6d4'
};

const getMoodLabel = (score) => {
    if (score <= 2) return 'Very Low';
    if (score <= 4) return 'Low';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Good';
    return 'Excellent';
};

const getMoodEmoji = (score) => {
    if (score <= 2) return '😔';
    if (score <= 4) return '😟';
    if (score <= 6) return '😐';
    if (score <= 8) return '🙂';
    return '😊';
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const score = payload[0].value;
        return (
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontFamily: 'sans-serif'
            }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>{label}</p>
                <p style={{ margin: 0, fontWeight: 'bold', color: MOOD_COLORS[score] || '#6366f1', fontSize: '16px' }}>
                    {getMoodEmoji(score)} {score}/10 — {getMoodLabel(score)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [score, setScore] = useState(7);
    const [notes, setNotes] = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('log'); // 'log' | 'trends'
    const navigate = useNavigate();

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/moods');
            setLogs(response.data.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch logs. Your session may have expired.');
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const toggleEmotion = (emotion) => {
        setSelectedEmotions(prev =>
            prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/moods', { moodScore: score, notes, emotions: selectedEmotions });
            setScore(7);
            setNotes('');
            setSelectedEmotions([]);
            fetchLogs();
            setActiveTab('trends'); // switch to trends after logging
        } catch (err) {
            console.error(err);
            setError('Failed to save mood log.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Prepare chart data — last 14 logs, oldest first
    const chartData = [...logs]
        .slice(0, 14)
        .reverse()
        .map(log => ({
            date: new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: log.moodScore,
            emotions: log.emotions?.join(', ') || '',
        }));

    // Stats
    const avgScore = logs.length
        ? (logs.reduce((sum, l) => sum + l.moodScore, 0) / logs.length).toFixed(1)
        : null;
    const latestScore = logs[0]?.moodScore;
    const bestScore = logs.length ? Math.max(...logs.map(l => l.moodScore)) : null;
    const streak = (() => {
        if (!logs.length) return 0;
        let count = 1;
        for (let i = 1; i < logs.length; i++) {
            const prev = new Date(logs[i - 1].createdAt).toDateString();
            const curr = new Date(logs[i].createdAt).toDateString();
            const diffDays = (new Date(prev) - new Date(curr)) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1) count++;
            else break;
        }
        return count;
    })();

    const styles = {
        container: {
            maxWidth: '680px',
            margin: '40px auto',
            fontFamily: "'Segoe UI', sans-serif",
            padding: '0 16px',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        title: {
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            color: '#111827',
        },
        headerRight: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
        },
        chatLink: {
            textDecoration: 'none',
            color: '#6366f1',
            fontWeight: '600',
            fontSize: '14px',
        },
        logoutBtn: {
            padding: '7px 14px',
            cursor: 'pointer',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
        },
        tabs: {
            display: 'flex',
            gap: '4px',
            backgroundColor: '#f3f4f6',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
        },
        tab: (active) => ({
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            backgroundColor: active ? 'white' : 'transparent',
            color: active ? '#6366f1' : '#6b7280',
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
        }),
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
        },
        statCard: (color) => ({
            backgroundColor: 'white',
            border: `1px solid ${color}30`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }),
        statValue: (color) => ({
            fontSize: '28px',
            fontWeight: '800',
            color: color,
            margin: '0 0 4px 0',
        }),
        statLabel: {
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        chartCard: {
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        },
        chartTitle: {
            margin: '0 0 20px 0',
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
        },
        formCard: {
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginBottom: '24px',
            borderRadius: '16px',
            backgroundColor: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        },
        scoreDisplay: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
        },
        scoreValue: {
            fontSize: '32px',
            fontWeight: '800',
            color: MOOD_COLORS[score] || '#6366f1',
        },
        scoreLabel: {
            fontSize: '14px',
            color: '#6b7280',
        },
        slider: {
            width: '100%',
            cursor: 'pointer',
            accentColor: MOOD_COLORS[score] || '#6366f1',
            height: '6px',
            marginBottom: '20px',
        },
        emotionGrid: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
        },
        emotionTag: (selected) => ({
            padding: '6px 14px',
            borderRadius: '20px',
            border: `1px solid ${selected ? '#6366f1' : '#d1d5db'}`,
            backgroundColor: selected ? '#6366f1' : 'white',
            color: selected ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.15s',
        }),
        textarea: {
            width: '100%',
            height: '80px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            boxSizing: 'border-box',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            marginBottom: '16px',
        },
        submitBtn: (disabled) => ({
            width: '100%',
            padding: '12px',
            backgroundColor: disabled ? '#e5e7eb' : '#6366f1',
            color: disabled ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            transition: 'background 0.2s',
        }),
        logItem: {
            border: '1px solid #f3f4f6',
            padding: '16px',
            marginBottom: '12px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
        logHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
        },
        scoreBadge: (s) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: `${MOOD_COLORS[s]}15`,
            color: MOOD_COLORS[s],
            padding: '4px 10px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '14px',
        }),
        aiBox: {
            backgroundColor: '#f0f4ff',
            borderLeft: '3px solid #6366f1',
            padding: '12px',
            borderRadius: '0 8px 8px 0',
            marginTop: '10px',
        },
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>🧠 Mood Dashboard</h2>
                <div style={styles.headerRight}>
                    <Link to="/chat" style={styles.chatLink}>Talk to AI →</Link>
                    <Link to="/journal" style={styles.journalLink}>📔 Journal →</Link>
                    <Link to="/goals">🎯 Goals →</Link>
                    <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                </div>
            </div>

            {error && (
                <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
                <button style={styles.tab(activeTab === 'log')} onClick={() => setActiveTab('log')}>
                    📝 Log Mood
                </button>
                <button style={styles.tab(activeTab === 'trends')} onClick={() => setActiveTab('trends')}>
                    📈 Trends
                </button>
                <button style={styles.tab(activeTab === 'history')} onClick={() => setActiveTab('history')}>
                    🗂 History
                </button>
            </div>

            {/* ── LOG TAB ── */}
            {activeTab === 'log' && (
                <form onSubmit={handleSubmit} style={styles.formCard}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', color: '#111827' }}>
                        How are you feeling today?
                    </h3>

                    <div style={styles.scoreDisplay}>
                        <div>
                            <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Mood Score</label>
                            <p style={styles.scoreLabel}>{getMoodLabel(score)}</p>
                        </div>
                        <span style={styles.scoreValue}>{getMoodEmoji(score)} {score}/10</span>
                    </div>
                    <input
                        type="range" min="1" max="10"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        style={styles.slider}
                    />

                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#374151', marginBottom: '10px' }}>
                        Emotions
                    </label>
                    <div style={styles.emotionGrid}>
                        {EMOTION_TAGS.map(emotion => (
                            <button type="button" key={emotion}
                                onClick={() => toggleEmotion(emotion)}
                                style={styles.emotionTag(selectedEmotions.includes(emotion))}>
                                {emotion}
                            </button>
                        ))}
                    </div>

                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                        Journal Entry
                    </label>
                    <textarea
                        placeholder="What's on your mind? (AI will respond with personalized advice)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={styles.textarea}
                    />

                    <button disabled={isSubmitting} type="submit" style={styles.submitBtn(isSubmitting)}>
                        {isSubmitting ? '✨ Analyzing...' : '💾 Save & Get AI Advice'}
                    </button>
                </form>
            )}

            {/* ── TRENDS TAB ── */}
            {activeTab === 'trends' && (
                <>
                    {/* Stats Row */}
                    {logs.length > 0 && (
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard('#6366f1')}>
                                <p style={styles.statValue('#6366f1')}>{avgScore}</p>
                                <p style={styles.statLabel}>Avg Score</p>
                            </div>
                            <div style={styles.statCard('#10b981')}>
                                <p style={styles.statValue('#10b981')}>{bestScore}/10</p>
                                <p style={styles.statLabel}>Best Score</p>
                            </div>
                            <div style={styles.statCard('#f59e0b')}>
                                <p style={styles.statValue('#f59e0b')}>{streak}</p>
                                <p style={styles.statLabel}>Day Streak 🔥</p>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div style={styles.chartCard}>
                        <p style={styles.chartTitle}>Mood Over Time (Last 14 entries)</p>
                        {chartData.length < 2 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📊</p>
                                <p style={{ margin: 0 }}>Log at least 2 moods to see your trend chart</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={5} stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: 'Mid', position: 'right', fontSize: 10, fill: '#d1d5db' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        fill="url(#moodGradient)"
                                        dot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Emotion Frequency */}
                    {logs.length > 0 && (() => {
                        const freq = {};
                        logs.forEach(l => l.emotions?.forEach(e => { freq[e] = (freq[e] || 0) + 1; }));
                        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                        if (!sorted.length) return null;
                        const max = sorted[0][1];
                        return (
                            <div style={styles.chartCard}>
                                <p style={styles.chartTitle}>Most Common Emotions</p>
                                {sorted.map(([emotion, count]) => (
                                    <div key={emotion} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{emotion}</span>
                                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{count}x</span>
                                        </div>
                                        <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${(count / max) * 100}%`,
                                                backgroundColor: '#6366f1',
                                                borderRadius: '4px',
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
                <div>
                    {logs.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
                            No logs yet. Go to Log Mood to create your first entry!
                        </p>
                    ) : (
                        logs.map(log => (
                            <div key={log._id} style={styles.logItem}>
                                <div style={styles.logHeader}>
                                    <span style={styles.scoreBadge(log.moodScore)}>
                                        {getMoodEmoji(log.moodScore)} {log.moodScore}/10
                                    </span>
                                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                        {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>

                                {log.emotions?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {log.emotions.map(e => (
                                            <span key={e} style={{ fontSize: '12px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '3px 8px', borderRadius: '20px' }}>
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {log.notes && <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>{log.notes}</p>}

                                {log.aiAdvice && (
                                    <div style={styles.aiBox}>
                                        <strong style={{ color: '#6366f1', display: 'block', marginBottom: '4px', fontSize: '13px' }}>✨ AI Companion</strong>
                                        <p style={{ margin: 0, color: '#374151', lineHeight: '1.5', fontSize: '13px' }}>{log.aiAdvice}</p>
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