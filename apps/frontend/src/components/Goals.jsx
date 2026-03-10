import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';

const CATEGORIES = [
    { value: 'mindfulness', label: '🧘 Mindfulness' },
    { value: 'exercise',    label: '🏃 Exercise' },
    { value: 'sleep',       label: '😴 Sleep' },
    { value: 'social',      label: '👥 Social' },
    { value: 'nutrition',   label: '🥗 Nutrition' },
    { value: 'self-care',   label: '💆 Self-care' },
    { value: 'other',       label: '⭐ Other' },
];

const CATEGORY_COLORS = {
    mindfulness: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
    exercise:    { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
    sleep:       { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    social:      { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
    nutrition:   { bg: '#dcfce7', text: '#15803d', border: '#6ee7b7' },
    'self-care': { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    other:       { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
};

const today = new Date().toISOString().split('T')[0];

const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
};

const getStreakEmoji = (streak) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '💎';
    if (streak >= 7)  return '🔥';
    if (streak >= 3)  return '⚡';
    return '✨';
};

export default function Goals() {
    const [view, setView] = useState('goals');   // 'goals' | 'add'
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(null);  // goal id being checked in
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [expandedGoal, setExpandedGoal] = useState(null);

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', category: 'mindfulness',
        frequency: 'daily', targetDays: 30
    });
    const [isCreating, setIsCreating] = useState(false);

    const navigate = useNavigate();

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/goals');
            setGoals(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load goals.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setIsCreating(true);
        setError('');
        try {
            await api.post('/goals', form);
            setForm({ title: '', description: '', category: 'mindfulness', frequency: 'daily', targetDays: 30 });
            setView('goals');
            fetchGoals();
            showSuccess('🎯 Goal created with AI tip!');
        } catch {
            setError('Failed to create goal.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCheckIn = async (goalId) => {
        setCheckingIn(goalId);
        setError('');
        try {
            const res = await api.post(`/goals/${goalId}/checkin`, {});
            showSuccess(res.data.message || '✅ Checked in!');
            fetchGoals();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to check in.';
            setError(msg);
        } finally {
            setCheckingIn(null);
        }
    };

    const handleDelete = async (goalId) => {
        if (!window.confirm('Remove this goal?')) return;
        try {
            await api.delete(`/goals/${goalId}`);
            setGoals(prev => prev.filter(g => g._id !== goalId));
            showSuccess('Goal removed.');
        } catch {
            setError('Failed to remove goal.');
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const isCheckedInToday = (goal) => goal.checkIns?.some(c => c.date === today);

    const getProgress = (goal) => {
        const total = goal.checkIns?.length || 0;
        return Math.min(Math.round((total / goal.targetDays) * 100), 100);
    };

    const last30 = getLast30Days();

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🎯 Goals & Habits</h1>
                    <p style={s.subtitle}>Build streaks. Track progress. Stay consistent.</p>
                </div>
                <div style={s.headerLinks}>
                    <Link to="/dashboard" style={s.link}>← Dashboard</Link>
                    <Link to="/journal" style={s.link}>📔 Journal</Link>
                </div>
            </div>

            {/* Notifications */}
            {error && <div style={s.errorBox}>{error}</div>}
            {successMsg && <div style={s.successBox}>{successMsg}</div>}

            {/* Tabs */}
            <div style={s.tabs}>
                <button style={s.tab(view === 'goals')} onClick={() => setView('goals')}>
                    📋 My Goals {goals.length > 0 && `(${goals.length})`}
                </button>
                <button style={s.tab(view === 'add')} onClick={() => setView('add')}>
                    ＋ New Goal
                </button>
            </div>

            {/* ══ GOALS VIEW ══ */}
            {view === 'goals' && (
                <>
                    {isLoading ? (
                        <div style={s.emptyState}>Loading your goals…</div>
                    ) : goals.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>🌱</p>
                            <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>No goals yet. Set your first one!</p>
                            <button onClick={() => setView('add')} style={s.primaryBtn(false)}>
                                + Create a Goal
                            </button>
                        </div>
                    ) : (
                        goals.map(goal => {
                            const checkedToday = isCheckedInToday(goal);
                            const progress = getProgress(goal);
                            const col = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.other;
                            const catLabel = CATEGORIES.find(c => c.value === goal.category)?.label || goal.category;
                            const isExpanded = expandedGoal === goal._id;

                            return (
                                <div key={goal._id} style={s.goalCard(checkedToday)}>
                                    {/* Card top row */}
                                    <div style={s.cardTopRow}>
                                        <div style={{ flex: 1 }}>
                                            <div style={s.cardTitleRow}>
                                                <span style={s.catBadge(col)}>{catLabel}</span>
                                                {checkedToday && <span style={s.doneBadge}>✅ Done today</span>}
                                            </div>
                                            <h3 style={s.goalTitle}>{goal.title}</h3>
                                            {goal.description && (
                                                <p style={s.goalDesc}>{goal.description}</p>
                                            )}
                                        </div>
                                        <button onClick={() => handleDelete(goal._id)} style={s.deleteBtn}>🗑</button>
                                    </div>

                                    {/* Streak stats */}
                                    <div style={s.statsRow}>
                                        <div style={s.statBox}>
                                            <span style={s.statNum}>
                                                {getStreakEmoji(goal.currentStreak)} {goal.currentStreak}
                                            </span>
                                            <span style={s.statLbl}>Current Streak</span>
                                        </div>
                                        <div style={s.statBox}>
                                            <span style={s.statNum}>🏅 {goal.longestStreak}</span>
                                            <span style={s.statLbl}>Best Streak</span>
                                        </div>
                                        <div style={s.statBox}>
                                            <span style={s.statNum}>📅 {goal.checkIns?.length || 0}</span>
                                            <span style={s.statLbl}>Total Days</span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={s.progressRow}>
                                        <div style={s.progressBarBg}>
                                            <div style={s.progressBarFill(progress, col.text)} />
                                        </div>
                                        <span style={s.progressLabel}>{progress}% of {goal.targetDays}-day goal</span>
                                    </div>

                                    {/* 30-day habit calendar */}
                                    <div style={s.calendarWrap}>
                                        {last30.map(day => {
                                            const done = goal.checkIns?.some(c => c.date === day);
                                            const isToday = day === today;
                                            return (
                                                <div
                                                    key={day}
                                                    title={day}
                                                    style={s.calDay(done, isToday, col.text)}
                                                />
                                            );
                                        })}
                                    </div>
                                    <p style={s.calLabel}>Last 30 days</p>

                                    {/* AI Tip (expandable) */}
                                    {goal.aiTip && (
                                        <div style={s.aiTipBox}>
                                            <button
                                                style={s.aiTipToggle}
                                                onClick={() => setExpandedGoal(isExpanded ? null : goal._id)}
                                            >
                                                💡 AI Tip {isExpanded ? '▲' : '▼'}
                                            </button>
                                            {isExpanded && <p style={s.aiTipText}>{goal.aiTip}</p>}
                                        </div>
                                    )}

                                    {/* Check-in button */}
                                    <button
                                        onClick={() => handleCheckIn(goal._id)}
                                        disabled={checkedToday || checkingIn === goal._id}
                                        style={s.checkinBtn(checkedToday)}
                                    >
                                        {checkingIn === goal._id
                                            ? 'Saving…'
                                            : checkedToday
                                            ? '✅ Completed Today'
                                            : '＋ Check In Today'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </>
            )}

            {/* ══ ADD GOAL VIEW ══ */}
            {view === 'add' && (
                <form onSubmit={handleCreate} style={s.formCard}>
                    <h3 style={s.formTitle}>Create a New Goal</h3>

                    <label style={s.label}>Goal Title *</label>
                    <input
                        type="text"
                        placeholder="e.g. Meditate for 10 minutes"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                        style={s.input}
                    />

                    <label style={s.label}>Description (optional)</label>
                    <input
                        type="text"
                        placeholder="Why is this goal important to you?"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        style={s.input}
                    />

                    <label style={s.label}>Category</label>
                    <div style={s.catGrid}>
                        {CATEGORIES.map(c => {
                            const col = CATEGORY_COLORS[c.value];
                            const selected = form.category === c.value;
                            return (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, category: c.value })}
                                    style={s.catOption(selected, col)}
                                >
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>

                    <div style={s.twoCol}>
                        <div>
                            <label style={s.label}>Frequency</label>
                            <select
                                value={form.frequency}
                                onChange={e => setForm({ ...form, frequency: e.target.value })}
                                style={s.select}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                        <div>
                            <label style={s.label}>Target Days: {form.targetDays}</label>
                            <input
                                type="range" min="7" max="90" step="1"
                                value={form.targetDays}
                                onChange={e => setForm({ ...form, targetDays: Number(e.target.value) })}
                                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    <div style={s.formNote}>
                        ✨ AI will generate a personalized tip for this goal
                    </div>

                    <button
                        type="submit"
                        disabled={isCreating || !form.title.trim()}
                        style={s.primaryBtn(isCreating || !form.title.trim())}
                    >
                        {isCreating ? '✨ Creating with AI…' : '🎯 Create Goal'}
                    </button>
                </form>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    page: {
        maxWidth: '680px',
        margin: '40px auto',
        padding: '0 16px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
    },
    title: {
        margin: '0 0 4px 0',
        fontSize: '26px',
        fontWeight: '700',
        color: '#111827',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        margin: 0,
        fontSize: '14px',
        color: '#6b7280',
    },
    headerLinks: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-end',
    },
    link: {
        textDecoration: 'none',
        color: '#6366f1',
        fontWeight: '600',
        fontSize: '13px',
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '16px',
    },
    successBox: {
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#16a34a',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '16px',
        fontWeight: '600',
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
    emptyState: {
        textAlign: 'center',
        padding: '60px 0',
        color: '#9ca3af',
    },
    goalCard: (done) => ({
        backgroundColor: done ? '#f0fdf4' : 'white',
        border: `1px solid ${done ? '#bbf7d0' : '#e5e7eb'}`,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
    }),
    cardTopRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        gap: '12px',
    },
    cardTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '6px',
    },
    catBadge: (col) => ({
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: col.bg,
        color: col.text,
        border: `1px solid ${col.border}`,
        padding: '3px 8px',
        borderRadius: '20px',
    }),
    doneBadge: {
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: '#dcfce7',
        color: '#16a34a',
        padding: '3px 8px',
        borderRadius: '20px',
    },
    goalTitle: {
        margin: '0 0 4px 0',
        fontSize: '17px',
        fontWeight: '700',
        color: '#111827',
    },
    goalDesc: {
        margin: 0,
        fontSize: '13px',
        color: '#6b7280',
        lineHeight: '1.4',
    },
    deleteBtn: {
        background: 'none',
        border: '1px solid #fee2e2',
        borderRadius: '8px',
        padding: '5px 8px',
        cursor: 'pointer',
        fontSize: '14px',
        flexShrink: 0,
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '14px',
    },
    statBox: {
        backgroundColor: '#f9fafb',
        borderRadius: '10px',
        padding: '10px',
        textAlign: 'center',
        border: '1px solid #f3f4f6',
    },
    statNum: {
        display: 'block',
        fontSize: '16px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '2px',
    },
    statLbl: {
        fontSize: '11px',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
    progressRow: {
        marginBottom: '14px',
    },
    progressBarBg: {
        height: '8px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '4px',
    },
    progressBarFill: (pct, color) => ({
        height: '100%',
        width: `${pct}%`,
        backgroundColor: color,
        borderRadius: '4px',
        transition: 'width 0.6s ease',
    }),
    progressLabel: {
        fontSize: '12px',
        color: '#9ca3af',
        margin: 0,
    },
    calendarWrap: {
        display: 'flex',
        gap: '3px',
        flexWrap: 'wrap',
        marginBottom: '4px',
    },
    calDay: (done, isToday, color) => ({
        width: '14px',
        height: '14px',
        borderRadius: '3px',
        backgroundColor: done ? color : '#f3f4f6',
        border: isToday ? `2px solid ${color}` : '1px solid #e5e7eb',
        opacity: done ? 1 : 0.5,
        transition: 'background 0.2s',
    }),
    calLabel: {
        fontSize: '11px',
        color: '#d1d5db',
        margin: '0 0 12px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    aiTipBox: {
        backgroundColor: '#fefce8',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '14px',
    },
    aiTipToggle: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '700',
        color: '#a16207',
        fontSize: '13px',
        padding: 0,
    },
    aiTipText: {
        margin: '8px 0 0 0',
        fontSize: '13px',
        color: '#78716c',
        lineHeight: '1.6',
    },
    checkinBtn: (done) => ({
        width: '100%',
        padding: '11px',
        backgroundColor: done ? '#f0fdf4' : '#6366f1',
        color: done ? '#16a34a' : 'white',
        border: done ? '1px solid #bbf7d0' : 'none',
        borderRadius: '10px',
        cursor: done ? 'default' : 'pointer',
        fontWeight: '700',
        fontSize: '14px',
        transition: 'all 0.2s',
    }),
    formCard: {
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    },
    formTitle: {
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px',
        marginTop: '14px',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        boxSizing: 'border-box',
        fontSize: '14px',
        outline: 'none',
        fontFamily: "'Segoe UI', sans-serif",
    },
    catGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '4px',
    },
    catOption: (selected, col) => ({
        padding: '7px 12px',
        borderRadius: '20px',
        border: `1px solid ${selected ? col.border : '#e5e7eb'}`,
        backgroundColor: selected ? col.bg : 'white',
        color: selected ? col.text : '#6b7280',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: selected ? '700' : '400',
        transition: 'all 0.15s',
    }),
    twoCol: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginTop: '8px',
    },
    select: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'white',
        fontFamily: "'Segoe UI', sans-serif",
    },
    formNote: {
        backgroundColor: '#f0f4ff',
        border: '1px solid #c7d2fe',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#4f46e5',
        fontWeight: '500',
        marginTop: '16px',
        marginBottom: '16px',
    },
    primaryBtn: (disabled) => ({
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
};