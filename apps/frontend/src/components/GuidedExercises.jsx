import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'all',        label: 'All'         },
    { id: 'breathing',  label: 'Breathing'   },
    { id: 'meditation', label: 'Meditation'  },
    { id: 'cbt',        label: 'CBT'         },
    { id: 'grounding',  label: 'Quick Relief'},
    { id: 'movement',   label: 'Movement'    },
];

const CAT_COLORS = {
    breathing:  { bg: '#eff6ff', text: '#0284c7', dot: '#0284c7' },
    meditation: { bg: '#faf5ff', text: '#7c3aed', dot: '#7c3aed' },
    cbt:        { bg: '#fffbeb', text: '#d97706', dot: '#d97706' },
    grounding:  { bg: '#f0fdf4', text: '#16a34a', dot: '#16a34a' },
    movement:   { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626' },
};

const CAT_GRADIENTS = {
    breathing:  'linear-gradient(135deg,#dbeafe,#bfdbfe)',
    meditation: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
    cbt:        'linear-gradient(135deg,#fef3c7,#fde68a)',
    grounding:  'linear-gradient(135deg,#dcfce7,#bbf7d0)',
    movement:   'linear-gradient(135deg,#fee2e2,#fecaca)',
};

const CAT_EMOJIS = {
    breathing: '🌬️', meditation: '🧘', cbt: '📝', grounding: '🖐️', movement: '💪',
};

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer(seconds, onComplete) {
    const [timeLeft, setTimeLeft]   = useState(seconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { clearInterval(intervalRef.current); setIsRunning(false); onComplete?.(); return 0; }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const start = () => setIsRunning(true);
    const pause = () => { clearInterval(intervalRef.current); setIsRunning(false); };
    const reset = () => { clearInterval(intervalRef.current); setIsRunning(false); setTimeLeft(seconds); };
    return { timeLeft, isRunning, start, pause, reset };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GuidedExercises() {
    const [view, setView]                   = useState('browse');
    const [exercises, setExercises]         = useState([]);
    const [recommended, setRecommended]     = useState([]);
    const [aiReason, setAiReason]           = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentExercise, setCurrentExercise] = useState(null);
    const [history, setHistory]             = useState([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [error, setError]                 = useState('');
    const [ready, setReady]                 = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchAll(); setTimeout(() => setReady(true), 60); }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [exRes, recRes] = await Promise.all([api.get('/exercises'), api.get('/exercises/recommend')]);
            setExercises(exRes.data.data);
            setRecommended(recRes.data.data.recommended);
            setAiReason(recRes.data.data.aiReason);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load exercises.');
        } finally { setIsLoading(false); }
    };

    const fetchHistory = async () => {
        try { const res = await api.get('/exercises/history'); setHistory(res.data.data); } catch {}
    };

    const handleStart  = (ex) => { setCurrentExercise(ex); setView('player'); };
    const handleFinish = async (exId, mBefore, mAfter) => {
        try { await api.post('/exercises/log', { exerciseId: exId, moodBefore: mBefore, moodAfter: mAfter }); } catch {}
        setView('browse'); setCurrentExercise(null); fetchHistory();
    };

    const filtered = activeCategory === 'all' ? exercises : exercises.filter(e => e.category === activeCategory);

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .ge { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:32px 44px 100px; box-sizing:border-box; }

            /* header */
            .ge-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; }
            .ge-head h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:#111827; margin:0 0 4px; letter-spacing:-0.5px; }
            .ge-head p  { font-size:14px; color:#9ca3af; margin:0; }
            .ge-crisis-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#dc2626; border:1px solid #fecaca; border-radius:20px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s; }
            .ge-crisis-btn:hover { background:#fef2f2; box-shadow:0 3px 10px rgba(220,38,38,0.2); }

            /* breadcrumb */
            .ge-bread { font-size:12px; color:#9ca3af; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
            .ge-bread a { color:#9ca3af; text-decoration:none; }
            .ge-bread a:hover { color:#6366f1; }

            /* tabs */
            .ge-tabs { display:flex; gap:0; border-bottom:2px solid #f3f4f6; margin-bottom:24px; }
            .ge-tab { padding:8px 20px 10px; border:none; background:transparent; cursor:pointer; font-size:14px; font-weight:600; font-family:'DM Sans',sans-serif; color:#9ca3af; transition:all 0.2s; position:relative; }
            .ge-tab.on { color:#111827; }
            .ge-tab.on::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:#6366f1; border-radius:2px; }

            /* ── Recommended ── */
            .ge-rec { background:linear-gradient(135deg,#f0fdf4,#dcfce7,#d1fae5); border:1px solid #bbf7d0; border-radius:20px; padding:22px 24px; margin-bottom:28px; }
            .ge-rec-head { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
            .ge-rec-badge { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:#065f46; background:rgba(16,185,129,0.15); padding:3px 10px; border-radius:20px; }
            .ge-rec-reason { font-size:13px; color:#047857; font-style:italic; margin:0 0 18px; line-height:1.65; max-width:600px; }
            .ge-rec-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
            .ge-rec-card { background:white; border-radius:16px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.08); display:flex; flex-direction:column; gap:8px; transition:all 0.2s; }
            .ge-rec-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.12); }
            .ge-rec-icon { font-size:26px; }
            .ge-rec-cat-pill { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; }
            .ge-rec-name { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0; }
            .ge-rec-meta { font-size:12px; color:#9ca3af; margin:0; }
            .ge-rec-start { width:100%; padding:10px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:10px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 8px rgba(99,102,241,0.3); display:flex; align-items:center; justify-content:center; gap:6px; margin-top:4px; }
            .ge-rec-start:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(99,102,241,0.4); }

            /* ── Library ── */
            .ge-lib-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
            .ge-lib-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#111827; margin:0; }
            .ge-cats { display:flex; gap:6px; flex-wrap:wrap; }
            .ge-cat { padding:6px 16px; border-radius:20px; border:1px solid #e5e7eb; background:white; color:#6b7280; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
            .ge-cat:hover { border-color:#a5b4fc; color:#6366f1; }
            .ge-cat.on { background:#6366f1; color:white; border-color:#6366f1; box-shadow:0 2px 8px rgba(99,102,241,0.3); }

            /* exercise card grid */
            .ge-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:32px; }
            .ge-card { background:white; border-radius:16px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); transition:all 0.2s; cursor:pointer; }
            .ge-card:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(0,0,0,0.12); }
            .ge-card-img { height:110px; display:flex; align-items:center; justify-content:center; position:relative; font-size:44px; }
            .ge-card-dur { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.5); color:white; font-size:10px; font-weight:700; padding:2px 7px; border-radius:8px; }
            .ge-card-body { padding:12px; }
            .ge-card-name { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#111827; margin:0 0 4px; }
            .ge-card-desc { font-size:11px; color:#6b7280; margin:0 0 8px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
            .ge-card-foot { display:flex; align-items:center; gap:5px; }
            .ge-card-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
            .ge-card-cat { font-size:10px; color:#9ca3af; font-weight:600; text-transform:capitalize; }

            /* ── Recent Activity ── */
            .ge-act-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#111827; margin:0 0 14px; }
            .ge-act-item { background:white; border-radius:14px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); transition:box-shadow 0.2s; }
            .ge-act-item:hover { box-shadow:0 3px 12px rgba(0,0,0,0.1); }
            .ge-act-left { display:flex; align-items:center; gap:12px; }
            .ge-act-circle { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
            .ge-act-name { font-size:14px; font-weight:700; color:#111827; margin:0 0 2px; }
            .ge-act-date { font-size:11px; color:#9ca3af; margin:0; }
            .ge-mood-lift { font-size:12px; font-weight:700; padding:4px 12px; border-radius:20px; background:#dcfce7; color:#16a34a; white-space:nowrap; }
            .ge-mood-lift.neg { background:#fef2f2; color:#dc2626; }

            /* ── PLAYER ── */
            .ge-player { background:white; border-radius:22px; box-shadow:0 2px 8px rgba(0,0,0,0.08); border:1px solid rgba(0,0,0,0.05); overflow:hidden; max-width:680px; margin:0 auto; }
            .ge-player-head { padding:16px 22px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; background:#fafafa; }
            .ge-player-back { background:none; border:1px solid #e5e7eb; border-radius:8px; padding:6px 12px; cursor:pointer; color:#6b7280; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
            .ge-player-back:hover { background:#f3f4f6; }
            .ge-player-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; }
            .ge-player-body { padding:28px; }

            /* intro */
            .ge-intro-desc { font-size:15px; color:#374151; line-height:1.7; margin:0 0 20px; }
            .ge-intro-meta { font-size:13px; color:#9ca3af; margin:0 0 20px; }
            .ge-mood-lbl { font-size:14px; font-weight:600; color:#374151; margin:0 0 10px; }
            .ge-mood-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:18px; }
            .ge-mood-n { width:36px; height:36px; border-radius:9px; border:1.5px solid #e5e7eb; background:white; color:#6b7280; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
            .ge-mood-n.on { background:#6366f1; color:white; border-color:#6366f1; transform:scale(1.1); }
            .ge-tip { background:linear-gradient(135deg,#fffbeb,#fef3c7); border:1px solid #fde68a; border-radius:12px; padding:14px 16px; margin-bottom:22px; }
            .ge-tip p { margin:0; font-size:13px; color:#78350f; line-height:1.6; }
            .ge-begin { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
            .ge-begin:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.4); }

            /* active */
            .ge-prog-bg { height:6px; background:#f3f4f6; border-radius:3px; margin-bottom:8px; overflow:hidden; }
            .ge-prog-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }
            .ge-prog-lbl { font-size:12px; color:#9ca3af; margin:0 0 20px; }
            .ge-step-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; padding:4px 14px; border-radius:20px; letter-spacing:0.07em; text-transform:uppercase; margin-bottom:18px; }
            .ge-step-instr { font-size:17px; color:#111827; line-height:1.7; margin:0 0 28px; text-align:center; white-space:pre-line; }
            .ge-timer-wrap { display:flex; justify-content:center; margin-bottom:28px; }
            .ge-timer { width:110px; height:110px; border-radius:50%; border:5px solid; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
            .ge-timer-n { font-family:'Bricolage Grotesque',sans-serif; font-size:34px; font-weight:900; color:#111827; line-height:1; }
            .ge-timer-s { font-size:12px; color:#9ca3af; }
            .ge-controls { display:flex; gap:10px; justify-content:center; }
            .ge-ctrl { padding:12px 28px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:14px; font-family:'DM Sans',sans-serif; box-shadow:0 2px 8px rgba(99,102,241,0.3); transition:all 0.2s; }
            .ge-ctrl:hover { transform:translateY(-1px); }
            .ge-skip { padding:12px 20px; background:white; color:#9ca3af; border:1px solid #e5e7eb; border-radius:12px; cursor:pointer; font-weight:600; font-size:14px; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
            .ge-skip:hover { background:#f3f4f6; color:#374151; }

            /* complete */
            .ge-done { text-align:center; }
            .ge-done-emoji { font-size:58px; display:block; margin-bottom:14px; }
            .ge-done-title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#111827; margin:0 0 8px; }
            .ge-done-sub { font-size:14px; color:#6b7280; margin:0 0 28px; }
            .ge-mood-diff { border-radius:14px; padding:16px 18px; margin:14px 0 22px; }
            .ge-save-btn { padding:13px 36px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:15px; font-family:'DM Sans',sans-serif; box-shadow:0 4px 14px rgba(99,102,241,0.3); transition:all 0.2s; }
            .ge-save-btn:hover { transform:translateY(-1px); }

            /* error / empty */
            .ge-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; }
            .ge-empty { text-align:center; padding:80px 0; color:#9ca3af; }

            @media(max-width:960px) {
                .ge { padding:24px 20px 100px; }
                .ge-grid { grid-template-columns:1fr 1fr; }
                .ge-rec-grid { grid-template-columns:1fr; }
            }
            @media(max-width:600px) {
                .ge { padding:18px 14px 100px; }
                .ge-grid { grid-template-columns:1fr 1fr; }
                .ge-head h1 { font-size:22px; }
            }
        `}</style>

        <div className="ge">
            {/* ════════ PLAYER ════════ */}
            {view === 'player' && currentExercise && (
                <ExercisePlayer exercise={currentExercise} onFinish={handleFinish}
                    onBack={() => { setView('browse'); setCurrentExercise(null); }} />
            )}

            {/* ════════ BROWSE ════════ */}
            {view !== 'player' && (
                <>
                    {/* Header */}
                    <div className="ge-head" style={fi(0.04)}>
                        <div>
                            <p className="ge-bread">
                                <Link to="/dashboard">Dashboard</Link> › <span>Guided Exercises</span>
                            </p>
                            <h1>Guided Exercises</h1>
                            <p>Breathing, meditation & CBT tools — matched to your mood</p>
                        </div>
                        <Link to="/crisis" className="ge-crisis-btn">⭐ Crisis Support</Link>
                    </div>

                    {error && <div className="ge-err">{error}</div>}

                    {/* Tabs */}
                    <div className="ge-tabs" style={fi(0.08)}>
                        <button className={`ge-tab ${view==='browse'?'on':''}`} onClick={()=>setView('browse')}>Exercises</button>
                        <button className={`ge-tab ${view==='history'?'on':''}`} onClick={()=>{setView('history');fetchHistory();}}>History</button>
                    </div>

                    {/* ── Exercises tab ── */}
                    {view === 'browse' && (
                        <>
                            {isLoading ? <div className="ge-empty">⏳ Loading exercises…</div> : (
                                <>
                                    {/* Recommended */}
                                    {recommended.length > 0 && (
                                        <div className="ge-rec" style={fi(0.12)}>
                                            <div className="ge-rec-head">
                                                <span className="ge-rec-badge">✨ Recommended For You</span>
                                            </div>
                                            {aiReason && <p className="ge-rec-reason">"{aiReason}"</p>}
                                            <div className="ge-rec-grid">
                                                {recommended.slice(0,3).map(ex => {
                                                    const col = CAT_COLORS[ex.category] || CAT_COLORS.breathing;
                                                    return (
                                                        <div key={ex.id} className="ge-rec-card">
                                                            <span className="ge-rec-icon">{ex.emoji || CAT_EMOJIS[ex.category] || '🧘'}</span>
                                                            <span className="ge-rec-cat-pill" style={{background:col.bg, color:col.text}}>{ex.category}</span>
                                                            <p className="ge-rec-name">{ex.name}</p>
                                                            <p className="ge-rec-meta">{ex.duration} minutes · {ex.bestFor?.[0] || 'Relaxation'}</p>
                                                            <button className="ge-rec-start" onClick={() => handleStart(ex)}>
                                                                Start Session ▶
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Library */}
                                    <div style={fi(0.16)}>
                                        <div className="ge-lib-head">
                                            <p className="ge-lib-title">Exercise Library</p>
                                            <div className="ge-cats">
                                                {CATEGORIES.map(c => (
                                                    <button key={c.id} className={`ge-cat ${activeCategory===c.id?'on':''}`}
                                                        onClick={()=>setActiveCategory(c.id)}>{c.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="ge-grid">
                                            {filtered.map(ex => {
                                                const col  = CAT_COLORS[ex.category] || CAT_COLORS.breathing;
                                                const grad = CAT_GRADIENTS[ex.category] || CAT_GRADIENTS.breathing;
                                                return (
                                                    <div key={ex.id} className="ge-card" onClick={() => handleStart(ex)}>
                                                        <div className="ge-card-img" style={{background:grad}}>
                                                            {ex.emoji || CAT_EMOJIS[ex.category] || '🧘'}
                                                            <span className="ge-card-dur">{ex.duration}m</span>
                                                        </div>
                                                        <div className="ge-card-body">
                                                            <p className="ge-card-name">{ex.name}</p>
                                                            <p className="ge-card-desc">{ex.description}</p>
                                                            <div className="ge-card-foot">
                                                                <div className="ge-card-dot" style={{background:col.dot}}/>
                                                                <span className="ge-card-cat">{ex.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Recent Activity (from history) */}
                                    {history.length > 0 && (
                                        <div style={fi(0.2)}>
                                            <p className="ge-act-title">Recent Activity</p>
                                            {history.slice(0, 4).map(log => {
                                                const col  = CAT_COLORS[log.category] || CAT_COLORS.breathing;
                                                const grad = CAT_GRADIENTS[log.category] || CAT_GRADIENTS.breathing;
                                                const diff = log.moodAfter && log.moodBefore ? log.moodAfter - log.moodBefore : null;
                                                return (
                                                    <div key={log._id} className="ge-act-item">
                                                        <div className="ge-act-left">
                                                            <div className="ge-act-circle" style={{background:grad}}>
                                                                {CAT_EMOJIS[log.category] || '🧘'}
                                                            </div>
                                                            <div>
                                                                <p className="ge-act-name">{log.exerciseName}</p>
                                                                <p className="ge-act-date">
                                                                    {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {diff !== null && (
                                                            <span className={`ge-mood-lift ${diff < 0 ? 'neg' : ''}`}>
                                                                {diff >= 0 ? `✓ +${diff}` : `✓ ${diff}`} mood lift
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ── History tab ── */}
                    {view === 'history' && (
                        <div style={fi(0.1)}>
                            {history.length === 0 ? (
                                <div className="ge-empty">
                                    <p style={{fontSize:40,margin:'0 0 12px'}}>📭</p>
                                    <p style={{fontSize:15,fontWeight:600,color:'#374151',margin:'0 0 6px'}}>No exercises yet</p>
                                    <p>Complete your first exercise to see history.</p>
                                </div>
                            ) : history.map(log => {
                                const col  = CAT_COLORS[log.category] || CAT_COLORS.breathing;
                                const grad = CAT_GRADIENTS[log.category] || CAT_GRADIENTS.breathing;
                                const diff = log.moodAfter && log.moodBefore ? log.moodAfter - log.moodBefore : null;
                                return (
                                    <div key={log._id} className="ge-act-item">
                                        <div className="ge-act-left">
                                            <div className="ge-act-circle" style={{background:grad}}>
                                                {CAT_EMOJIS[log.category] || '🧘'}
                                            </div>
                                            <div>
                                                <p className="ge-act-name">{log.exerciseName}</p>
                                                <p className="ge-act-date">
                                                    {new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    {log.moodBefore && log.moodAfter && ` · Mood: ${log.moodBefore} → ${log.moodAfter}`}
                                                </p>
                                            </div>
                                        </div>
                                        {diff !== null && (
                                            <span className={`ge-mood-lift ${diff < 0 ? 'neg' : ''}`}>
                                                ✓ {diff >= 0 ? `+${diff}` : diff} mood lift
                                            </span>
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

// ── Exercise Player ───────────────────────────────────────────────────────────
function ExercisePlayer({ exercise: ex, onFinish, onBack }) {
    const [phase, setPhase]       = useState('intro');
    const [stepIndex, setStepIndex] = useState(0);
    const [cycle, setCycle]       = useState(1);
    const [moodBefore, setMoodBefore] = useState(null);
    const [moodAfter, setMoodAfter]   = useState(null);

    const steps      = ex.steps || [];
    const totalSteps = steps.length;
    const currentStep = steps[stepIndex];
    const progress    = totalSteps > 0
        ? ((stepIndex + (cycle - 1) * totalSteps) / (totalSteps * (ex.cycles || 1))) * 100
        : 0;

    const { timeLeft, isRunning, start, pause, reset } = useTimer(
        currentStep?.duration || 30,
        () => handleNext()
    );

    const handleNext = () => {
        if (stepIndex < totalSteps - 1) { setStepIndex(i => i + 1); }
        else if (cycle < (ex.cycles || 1)) { setCycle(c => c + 1); setStepIndex(0); }
        else { setPhase('complete'); }
    };

    useEffect(() => { reset(); }, [stepIndex, cycle]);

    const col = CAT_COLORS[ex.category] || CAT_COLORS.breathing;

    const STEP_COLORS = {
        inhale:'#0284c7', exhale:'#16a34a', hold:'#9ca3af', focus:'#7c3aed',
        prepare:'#6366f1', finish:'#16a34a', write:'#d97706', think:'#7c3aed',
        sense:'#0284c7', tense:'#dc2626', reflect:'#6b7280', visualize:'#7c3aed',
    };
    const stepColor = currentStep ? (STEP_COLORS[currentStep.type] || col.text) : col.text;

    return (
        <div className="ge-player">
            <div className="ge-player-head">
                <button className="ge-player-back" onClick={onBack}>← Back</button>
                <span style={{fontSize:20}}>{ex.emoji || CAT_EMOJIS[ex.category] || '🧘'}</span>
                <span className="ge-player-title">{ex.name}</span>
            </div>

            <div className="ge-player-body">
                {/* ── INTRO ── */}
                {phase === 'intro' && (
                    <div>
                        <p className="ge-intro-desc">{ex.description}</p>
                        <div style={{height:1,background:'#f3f4f6',margin:'0 0 16px'}}/>
                        <p className="ge-intro-meta">⏱ {ex.duration} minutes · {totalSteps} steps{(ex.cycles||1) > 1 ? ` · ${ex.cycles} rounds` : ''}</p>
                        <p className="ge-mood-lbl">How's your mood right now? (optional)</p>
                        <div className="ge-mood-btns">
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                <button key={n} className={`ge-mood-n ${moodBefore===n?'on':''}`} onClick={()=>setMoodBefore(n)}>{n}</button>
                            ))}
                        </div>
                        <div className="ge-tip"><p>💡 {ex.tip || 'Find a comfortable position and breathe naturally before starting.'}</p></div>
                        <button className="ge-begin" onClick={() => setPhase('active')}>▶ Begin Exercise</button>
                    </div>
                )}

                {/* ── ACTIVE ── */}
                {phase === 'active' && currentStep && (
                    <div style={{textAlign:'center'}}>
                        <div className="ge-prog-bg"><div className="ge-prog-fill" style={{width:`${progress}%`,background:stepColor}}/></div>
                        <p className="ge-prog-lbl">Step {stepIndex+1} of {totalSteps}{(ex.cycles||1)>1?` · Round ${cycle} of ${ex.cycles}`:''}</p>
                        <span className="ge-step-badge" style={{background:`${stepColor}18`,color:stepColor}}>{currentStep.type?.toUpperCase()}</span>
                        <p className="ge-step-instr">{currentStep.instruction}</p>
                        <div className="ge-timer-wrap">
                            <div className="ge-timer" style={{borderColor:stepColor,background:`${stepColor}10`}}>
                                <span className="ge-timer-n">{timeLeft}</span>
                                <span className="ge-timer-s">sec</span>
                            </div>
                        </div>
                        <div className="ge-controls">
                            <button className="ge-ctrl" onClick={isRunning?pause:start}>{isRunning?'⏸ Pause':'▶ Start Timer'}</button>
                            <button className="ge-skip" onClick={handleNext}>Skip →</button>
                        </div>
                    </div>
                )}

                {/* ── COMPLETE ── */}
                {phase === 'complete' && (
                    <div className="ge-done">
                        <span className="ge-done-emoji">🎉</span>
                        <p className="ge-done-title">Exercise Complete!</p>
                        <p className="ge-done-sub">Well done for taking time for your mental health.</p>
                        <p className="ge-mood-lbl">How's your mood now?</p>
                        <div className="ge-mood-btns" style={{justifyContent:'center'}}>
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                <button key={n} className={`ge-mood-n ${moodAfter===n?'on':''}`} onClick={()=>setMoodAfter(n)}>{n}</button>
                            ))}
                        </div>
                        {moodBefore && moodAfter && (() => {
                            const diff = moodAfter - moodBefore;
                            return (
                                <div className="ge-mood-diff" style={{background:diff>=0?'#f0fdf4':'#eff6ff',border:`1px solid ${diff>=0?'#bbf7d0':'#bfdbfe'}`}}>
                                    <p style={{margin:0,fontWeight:700,fontSize:15,color:diff>=0?'#16a34a':'#1d4ed8'}}>
                                        {diff>0?`✅ Mood improved by ${diff} point${diff>1?'s':''}!`:diff===0?'💙 Mood stayed stable.':'💙 That\'s okay — some sessions need time to settle.'}
                                    </p>
                                </div>
                            );
                        })()}
                        <button className="ge-save-btn" onClick={()=>onFinish(ex.id,moodBefore,moodAfter)}>✓ Save & Return</button>
                    </div>
                )}
            </div>
        </div>
    );
}