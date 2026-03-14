import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

const CATEGORIES = [
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'exercise',    label: 'Physical'    },
    { value: 'sleep',       label: 'Sleep'       },
    { value: 'social',      label: 'Social'      },
    { value: 'nutrition',   label: 'Nutrition'   },
    { value: 'self-care',   label: 'Self-care'   },
    { value: 'learning',    label: 'Learning'    },
    { value: 'other',       label: 'Other'       },
];

const CAT_COLORS = {
    mindfulness: { bg: '#ede9fe', text: '#7c3aed', dot: '#8b5cf6' },
    exercise:    { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
    sleep:       { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    social:      { bg: '#fce7f3', text: '#be185d', dot: '#ec4899' },
    nutrition:   { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
    'self-care': { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
    learning:    { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
    other:       { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' },
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

const last30 = getLast30Days();

const streakEmoji = (s) => s >= 30 ? '🏆' : s >= 14 ? '💎' : s >= 7 ? '🔥' : s >= 3 ? '⚡' : '✨';

export default function Goals() {
    const [view, setView]               = useState('goals');
    const [goals, setGoals]             = useState([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [checkingIn, setCheckingIn]   = useState(null);
    const [error, setError]             = useState('');
    const [successMsg, setSuccessMsg]   = useState('');
    const [expandedGoal, setExpandedGoal] = useState(null);
    const [ready, setReady]             = useState(false);

    const [form, setForm] = useState({
        title: '', description: '', category: 'mindfulness',
        frequency: 'daily', targetDays: 30,
    });
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGoals();
        setTimeout(() => setReady(true), 60);
    }, []);

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/goals');
            setGoals(res.data.data);
            if (res.data.data.length > 0) setExpandedGoal(res.data.data[0]._id);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load goals.');
        } finally { setIsLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setIsCreating(true);
        try {
            await api.post('/goals', form);
            setForm({ title: '', description: '', category: 'mindfulness', frequency: 'daily', targetDays: 30 });
            setView('goals');
            fetchGoals();
            flash('🎯 Goal created!', 'success');
        } catch { setError('Failed to create goal.'); }
        finally { setIsCreating(false); }
    };

    const handleCheckIn = async (goalId) => {
        setCheckingIn(goalId);
        try {
            await api.post(`/goals/${goalId}/checkin`, {});
            flash('✅ Checked in!', 'success');
            fetchGoals();
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to check in.', 'error');
        } finally { setCheckingIn(null); }
    };

    const handleDelete = async (goalId) => {
        if (!window.confirm('Remove this goal?')) return;
        try {
            await api.delete(`/goals/${goalId}`);
            setGoals(prev => prev.filter(g => g._id !== goalId));
            flash('Goal removed.', 'success');
        } catch { flash('Failed to remove.', 'error'); }
    };

    const flash = (msg, type) => {
        if (type === 'error') { setError(msg); setTimeout(() => setError(''), 3500); }
        else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
    };

    const isCheckedToday = (goal) => goal.checkIns?.some(c => c.date === today);
    const getProgress    = (goal) => Math.min(Math.round(((goal.checkIns?.length || 0) / goal.targetDays) * 100), 100);

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .go { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:36px 44px 100px; box-sizing:border-box; }

            /* header */
            .go-hero { margin-bottom:32px; }
            .go-hero h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:800; color:#111827; margin:0 0 6px; letter-spacing:-0.7px; }
            .go-hero p  { font-size:14px; color:#9ca3af; margin:0; line-height:1.6; max-width:380px; }

            /* tabs */
            .go-tabs { display:inline-flex; background:white; border-radius:12px; padding:4px; gap:4px; margin-bottom:28px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid #f3f4f6; }
            .go-tab { padding:8px 22px; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
            .go-tab.on { background:#111827; color:white; box-shadow:0 2px 8px rgba(0,0,0,0.18); }
            .go-tab.off { background:transparent; color:#6b7280; }
            .go-tab.off:hover { color:#374151; }

            /* flash */
            .go-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; animation:fadeIn 0.3s ease; }
            .go-ok  { background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; font-weight:600; animation:fadeIn 0.3s ease; }
            @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

            /* ── GOALS VIEW ── */
            /* main 2-col: big detail left, cards right */
            .go-layout { display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }

            /* detail card */
            .go-detail { background:white; border-radius:22px; padding:28px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); animation:cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes cardIn { from { opacity:0; transform:scale(0.97) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

            .go-detail-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
            .go-cat-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.07em; }
            .go-done-badge { font-size:11px; font-weight:700; background:#dcfce7; color:#16a34a; padding:4px 10px; border-radius:20px; }
            .go-detail-menu { display:flex; gap:6px; }
            .go-del-btn { background:none; border:1px solid #f3f4f6; border-radius:8px; padding:5px 8px; cursor:pointer; font-size:13px; color:#9ca3af; transition:all 0.15s; }
            .go-del-btn:hover { border-color:#fecaca; color:#dc2626; background:#fef2f2; }

            .go-detail-title { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#111827; margin:0 0 4px; letter-spacing:-0.4px; }
            .go-detail-desc  { font-size:13px; color:#9ca3af; margin:0 0 20px; }

            /* stats row */
            .go-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
            .go-stat { background:#f9fafb; border-radius:14px; padding:14px 12px; border:1px solid #f3f4f6; }
            .go-stat-lbl { font-size:10px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 4px; }
            .go-stat-val { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#111827; margin:0; line-height:1; }

            /* progress */
            .go-prog-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
            .go-prog-lbl { font-size:12px; color:#374151; font-weight:600; }
            .go-prog-pct { font-size:12px; color:#6366f1; font-weight:700; }
            .go-prog-bg { height:8px; background:#f3f4f6; border-radius:4px; overflow:hidden; margin-bottom:4px; }
            .go-prog-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#6366f1,#8b5cf6); transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
            .go-prog-sub { font-size:11px; color:#9ca3af; margin:0 0 18px; }

            /* calendar */
            .go-cal-lbl { font-size:11px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px; }
            .go-cal { display:flex; gap:3px; flex-wrap:wrap; margin-bottom:4px; }
            .go-cal-day { width:16px; height:16px; border-radius:3px; transition:transform 0.15s; cursor:default; }
            .go-cal-day:hover { transform:scale(1.3); }
            .go-cal-sub { font-size:11px; color:#d1d5db; margin:0 0 18px; text-transform:uppercase; letter-spacing:0.05em; }

            /* ai tip */
            .go-ai { background:linear-gradient(135deg,#fefce8,#fef3c7); border:1px solid #fde68a; border-radius:14px; padding:14px 16px; margin-bottom:18px; }
            .go-ai-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; cursor:pointer; }
            .go-ai-icon { font-size:15px; }
            .go-ai-title { font-size:13px; font-weight:700; color:#a16207; flex:1; }
            .go-ai-chev { font-size:11px; color:#a16207; }
            .go-ai-body { font-size:13px; color:#78716c; line-height:1.65; margin:0; animation:fadeIn 0.25s ease; }

            /* checkin btn */
            .go-checkin { width:100%; padding:13px; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
            .go-checkin.active { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; box-shadow:0 4px 14px rgba(99,102,241,0.32); }
            .go-checkin.active:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.42); }
            .go-checkin.done { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; cursor:default; }

            /* right column — small cards */
            .go-cards { display:flex; flex-direction:column; gap:12px; }
            .go-card { background:white; border-radius:18px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); cursor:pointer; transition:all 0.2s; }
            .go-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-2px); }
            .go-card.selected { border-color:#c7d2fe; box-shadow:0 0 0 2px rgba(99,102,241,0.15); }
            .go-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
            .go-card-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 3px; }
            .go-card-sub { font-size:12px; color:#9ca3af; margin:0; }
            .go-card-circle { width:36px; height:36px; border-radius:50%; border:3px solid #e5e7eb; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#6b7280; flex-shrink:0; }
            .go-card-prog { height:5px; background:#f3f4f6; border-radius:3px; overflow:hidden; margin-bottom:12px; }
            .go-card-prog-fill { height:100%; border-radius:3px; transition:width 0.6s ease; }
            .go-card-btn { width:100%; padding:9px; border:none; border-radius:10px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; }
            .go-add-card { background:white; border:2px dashed #e5e7eb; border-radius:18px; padding:20px; text-align:center; cursor:pointer; transition:all 0.2s; }
            .go-add-card:hover { border-color:#a5b4fc; background:#f5f3ff; }
            .go-add-card p { margin:0; font-size:13px; color:#9ca3af; font-weight:600; }

            /* ── ADD FORM ── */
            .go-form-wrap { display:grid; grid-template-columns:1fr 1fr; gap:28px; align-items:start; }
            .go-form-card { background:white; border-radius:22px; padding:28px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .go-form-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:#111827; margin:0 0 22px; }
            .go-lbl { font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:7px; }
            .go-input { width:100%; padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:11px; font-size:14px; outline:none; font-family:'DM Sans',sans-serif; color:#111827; background:#fafafa; transition:border-color 0.2s,background 0.2s; box-sizing:border-box; }
            .go-input:focus { border-color:#6366f1; background:white; }
            .go-ta { width:100%; padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:11px; font-size:14px; outline:none; font-family:'DM Sans',sans-serif; color:#111827; background:#fafafa; resize:none; height:90px; line-height:1.6; transition:border-color 0.2s,background 0.2s; box-sizing:border-box; }
            .go-ta:focus { border-color:#6366f1; background:white; }
            .go-freq { display:flex; gap:10px; }
            .go-freq-opt { flex:1; padding:10px; border-radius:11px; border:1.5px solid #e5e7eb; background:white; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.15s; }
            .go-freq-opt.on { border-color:#6366f1; background:#f0f4ff; color:#4f46e5; }
            .go-freq-radio { width:16px; height:16px; border-radius:50%; border:2px solid #d1d5db; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
            .go-freq-radio.on { border-color:#6366f1; background:#6366f1; }
            .go-freq-radio.on::after { content:''; width:6px; height:6px; background:white; border-radius:50%; }
            .go-slider-row { display:flex; justify-content:space-between; font-size:12px; color:#9ca3af; margin-bottom:6px; }
            .go-slider-val { color:#6366f1; font-weight:700; }
            .go-range { width:100%; accentColor:#6366f1; cursor:pointer; }
            .go-cats { display:flex; gap:7px; flex-wrap:wrap; }
            .go-cat-pill { padding:6px 14px; border-radius:20px; border:1.5px solid #e5e7eb; background:white; color:#6b7280; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
            .go-cat-pill:hover { border-color:#a5b4fc; color:#6366f1; }
            .go-cat-pill.on { font-weight:700; }
            .go-ai-note { background:linear-gradient(135deg,#eff6ff,#e0f2fe); border:1px solid #bfdbfe; border-radius:14px; padding:16px; }
            .go-ai-note-t { font-size:13px; font-weight:700; color:#1d4ed8; margin:0 0 4px; display:flex; align-items:center; gap:6px; }
            .go-ai-note-b { font-size:13px; color:#3b82f6; margin:0; line-height:1.6; }
            .go-launch { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(99,102,241,0.32); margin-top:20px; }
            .go-launch:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.42); }
            .go-launch:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }

            /* empty */
            .go-empty { text-align:center; padding:80px 0; color:#9ca3af; }
            .go-empty-btn { padding:11px 28px; background:#6366f1; color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; margin-top:16px; transition:all 0.2s; }
            .go-empty-btn:hover { background:#4f46e5; }

            @media(max-width:960px) {
                .go-layout { grid-template-columns:1fr; }
                .go-form-wrap { grid-template-columns:1fr; }
                .go { padding:24px 20px 100px; }
            }
            @media(max-width:600px) {
                .go { padding:20px 14px 100px; }
                .go-stats { grid-template-columns:repeat(3,1fr); }
                .go-hero h1 { font-size:26px; }
            }
        `}</style>

        <div className="go">
            {/* Hero */}
            <div className="go-hero" style={fi(0.05)}>
                <h1>Build Your Sanctuary</h1>
                <p>Small habits lead to significant changes. Track your progress and nurture your mind with intention.</p>
            </div>

            {/* Tabs */}
            <div style={fi(0.1)}>
                <div className="go-tabs">
                    <button className={`go-tab ${view === 'goals' ? 'on' : 'off'}`} onClick={() => setView('goals')}>
                        My Goals {goals.length > 0 && `(${goals.length})`}
                    </button>
                    <button className={`go-tab ${view === 'add' ? 'on' : 'off'}`} onClick={() => setView('add')}>
                        Add New Goal
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error      && <div className="go-err">{error}</div>}
            {successMsg && <div className="go-ok">{successMsg}</div>}

            {/* ════════ GOALS VIEW ════════ */}
            {view === 'goals' && (
                <div style={fi(0.14)}>
                    {isLoading ? (
                        <div className="go-empty"><p style={{ fontSize: 14 }}>Loading your goals…</p></div>
                    ) : goals.length === 0 ? (
                        <div className="go-empty">
                            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🌱</p>
                            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#374151' }}>No goals yet</p>
                            <p style={{ margin: '0 0 20px', fontSize: 14 }}>Set your first habit and start building your sanctuary.</p>
                            <button className="go-empty-btn" onClick={() => setView('add')}>+ Create a Goal</button>
                        </div>
                    ) : (
                        <div className="go-layout">
                            {/* Left — detail of selected goal */}
                            {(() => {
                                const goal = goals.find(g => g._id === expandedGoal) || goals[0];
                                if (!goal) return null;
                                const col = CAT_COLORS[goal.category] || CAT_COLORS.other;
                                const done = isCheckedToday(goal);
                                const prog = getProgress(goal);
                                return (
                                    <div className="go-detail">
                                        <div className="go-detail-top">
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span className="go-cat-badge" style={{ background: col.bg, color: col.text }}>
                                                    {goal.category?.toUpperCase()}
                                                </span>
                                                {done && <span className="go-done-badge">✅ Done Today</span>}
                                            </div>
                                            <div className="go-detail-menu">
                                                <button className="go-del-btn" onClick={() => handleDelete(goal._id)}>🗑</button>
                                            </div>
                                        </div>

                                        <h2 className="go-detail-title">{goal.title}</h2>
                                        {goal.description && <p className="go-detail-desc">{goal.description}</p>}

                                        {/* Stats */}
                                        <div className="go-stats">
                                            <div className="go-stat">
                                                <p className="go-stat-lbl">Current Streak</p>
                                                <p className="go-stat-val">{streakEmoji(goal.currentStreak)} {goal.currentStreak}</p>
                                            </div>
                                            <div className="go-stat">
                                                <p className="go-stat-lbl">Best Streak</p>
                                                <p className="go-stat-val">🏅 {goal.longestStreak}</p>
                                            </div>
                                            <div className="go-stat">
                                                <p className="go-stat-lbl">Total Days</p>
                                                <p className="go-stat-val">📅 {goal.checkIns?.length || 0}</p>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="go-prog-head">
                                            <span className="go-prog-lbl">Progress</span>
                                            <span className="go-prog-pct">{prog}%</span>
                                        </div>
                                        <div className="go-prog-bg">
                                            <div className="go-prog-fill" style={{ width: `${prog}%` }} />
                                        </div>
                                        <p className="go-prog-sub">{goal.checkIns?.length || 0}/{goal.targetDays} day goal</p>

                                        {/* Calendar */}
                                        <p className="go-cal-lbl">Last 30 Days Activity</p>
                                        <div className="go-cal">
                                            {last30.map(day => {
                                                const filled = goal.checkIns?.some(c => c.date === day);
                                                const isToday = day === today;
                                                return (
                                                    <div key={day} className="go-cal-day" title={day}
                                                        style={{
                                                            backgroundColor: filled ? col.dot : '#f3f4f6',
                                                            border: isToday ? `2px solid ${col.dot}` : 'none',
                                                            opacity: filled ? 1 : 0.45,
                                                        }} />
                                                );
                                            })}
                                        </div>
                                        <p className="go-cal-sub">● completed &nbsp; ○ missed</p>

                                        {/* AI Tip */}
                                        {goal.aiTip && (
                                            <div className="go-ai">
                                                <div className="go-ai-head"
                                                    onClick={() => setExpandedGoal(expandedGoal === goal._id + 'tip' ? goal._id : goal._id + 'tip')}>
                                                    <span className="go-ai-icon">✨</span>
                                                    <span className="go-ai-title">AI Tip</span>
                                                    <span className="go-ai-chev">▼</span>
                                                </div>
                                                <p className="go-ai-body">{goal.aiTip}</p>
                                            </div>
                                        )}

                                        {/* Check-in */}
                                        <button
                                            className={`go-checkin ${done ? 'done' : 'active'}`}
                                            onClick={() => !done && handleCheckIn(goal._id)}
                                            disabled={done || checkingIn === goal._id}>
                                            {checkingIn === goal._id ? '⏳ Saving…' : done ? '✅ Completed Today' : '＋ Check In Today'}
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* Right — goal cards list */}
                            <div className="go-cards">
                                {goals.map(goal => {
                                    const col = CAT_COLORS[goal.category] || CAT_COLORS.other;
                                    const done = isCheckedToday(goal);
                                    const prog = getProgress(goal);
                                    const isSelected = expandedGoal === goal._id || (!expandedGoal && goals[0]._id === goal._id);
                                    return (
                                        <div key={goal._id}
                                            className={`go-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setExpandedGoal(goal._id)}>
                                            <div className="go-card-top">
                                                <div>
                                                    <span style={{ fontSize: 11, fontWeight: 700, background: col.bg, color: col.text, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                        {goal.category}
                                                    </span>
                                                    <p className="go-card-title" style={{ marginTop: 8 }}>{goal.title}</p>
                                                    <p className="go-card-sub">
                                                        {goal.currentStreak > 0
                                                            ? `${streakEmoji(goal.currentStreak)} ${goal.currentStreak} day streak`
                                                            : `${goal.targetDays - (goal.checkIns?.length || 0)} days remaining`}
                                                    </p>
                                                </div>
                                                <div className="go-card-circle"
                                                    style={{ borderColor: prog > 0 ? col.dot : '#e5e7eb', color: col.text }}>
                                                    {prog}%
                                                </div>
                                            </div>
                                            <div className="go-card-prog">
                                                <div className="go-card-prog-fill"
                                                    style={{ width: `${prog}%`, backgroundColor: col.dot }} />
                                            </div>
                                            <button
                                                className="go-card-btn"
                                                style={{
                                                    backgroundColor: done ? '#f0fdf4' : col.bg,
                                                    color: done ? '#16a34a' : col.text,
                                                    border: `1px solid ${done ? '#bbf7d0' : col.dot}30`,
                                                }}
                                                onClick={e => { e.stopPropagation(); !done && handleCheckIn(goal._id); }}>
                                                {done ? '✅ Done today' : 'Check In Today'}
                                            </button>
                                        </div>
                                    );
                                })}
                                <div className="go-add-card" onClick={() => setView('add')}>
                                    <p style={{ fontSize: 24, margin: '0 0 6px' }}>＋</p>
                                    <p>Add a new goal</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════ ADD VIEW ════════ */}
            {view === 'add' && (
                <div style={fi(0.1)}>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
                            Nurture Something New
                        </h2>
                        <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Define your intention and let AI guide you forward.</p>
                    </div>

                    <div className="go-form-wrap">
                        {/* Left — inputs */}
                        <div className="go-form-card">
                            <label className="go-lbl">Goal Title</label>
                            <input className="go-input" placeholder="e.g., Drink more water"
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

                            <label className="go-lbl" style={{ marginTop: 16 }}>Description</label>
                            <textarea className="go-ta" placeholder="Why is this important to you?"
                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

                            <label className="go-lbl" style={{ marginTop: 16 }}>Category</label>
                            <div className="go-cats">
                                {CATEGORIES.map(c => {
                                    const col = CAT_COLORS[c.value];
                                    const on = form.category === c.value;
                                    return (
                                        <button key={c.value} type="button"
                                            className={`go-cat-pill ${on ? 'on' : ''}`}
                                            style={on ? { background: col.bg, color: col.text, borderColor: col.dot } : {}}
                                            onClick={() => setForm({ ...form, category: c.value })}>
                                            {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right — options + launch */}
                        <div>
                            <div className="go-form-card" style={{ marginBottom: 14 }}>
                                <label className="go-lbl">Frequency</label>
                                <div className="go-freq">
                                    {['daily', 'weekly'].map(f => (
                                        <button key={f} type="button"
                                            className={`go-freq-opt ${form.frequency === f ? 'on' : ''}`}
                                            onClick={() => setForm({ ...form, frequency: f })}>
                                            <div className={`go-freq-radio ${form.frequency === f ? 'on' : ''}`} />
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                <label className="go-lbl" style={{ marginTop: 18 }}>Target Days</label>
                                <div className="go-slider-row">
                                    <span>7 days</span>
                                    <span className="go-slider-val">{form.targetDays} Days</span>
                                    <span>90 days</span>
                                </div>
                                <input type="range" min="7" max="90" className="go-range"
                                    value={form.targetDays}
                                    onChange={e => setForm({ ...form, targetDays: Number(e.target.value) })}
                                    style={{ accentColor: '#6366f1', width: '100%', cursor: 'pointer' }} />
                            </div>

                            {/* AI Note */}
                            <div className="go-ai-note" style={{ marginBottom: 14 }}>
                                <p className="go-ai-note-t">✨ AI Personalization</p>
                                <p className="go-ai-note-b">
                                    Once you start, Serenity AI will analyze your patterns to provide specific timing and habit stacking tips.
                                </p>
                            </div>

                            {/* Launch */}
                            <button className="go-launch"
                                disabled={isCreating || !form.title.trim()}
                                onClick={handleCreate}>
                                {isCreating ? '✨ Creating with AI…' : '🚀 Launch Goal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}