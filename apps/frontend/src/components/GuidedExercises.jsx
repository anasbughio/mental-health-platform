import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

const CATEGORIES = [
    { id: 'all',        label: '✨ All',        color: '#6366f1' },
    { id: 'breathing',  label: '🌬️ Breathing',  color: '#0284c7' },
    { id: 'meditation', label: '🧘 Meditation',  color: '#7c3aed' },
    { id: 'cbt',        label: '📝 CBT',         color: '#d97706' },
    { id: 'grounding',  label: '🖐️ Grounding',   color: '#16a34a' },
    { id: 'movement',   label: '💪 Movement',    color: '#dc2626' },
];

const CAT_COLORS = {
    breathing:  { bg: '#eff6ff', text: '#0284c7', border: '#bfdbfe' },
    meditation: { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' },
    cbt:        { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    grounding:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    movement:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

const DIFF_COLORS = {
    beginner:     { bg: '#f0fdf4', text: '#16a34a' },
    intermediate: { bg: '#fefce8', text: '#a16207' },
    advanced:     { bg: '#fef2f2', text: '#dc2626' },
};

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer(seconds, onComplete) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        onComplete?.();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const start  = () => setIsRunning(true);
    const pause  = () => { clearInterval(intervalRef.current); setIsRunning(false); };
    const reset  = () => { clearInterval(intervalRef.current); setIsRunning(false); setTimeLeft(seconds); };

    return { timeLeft, isRunning, start, pause, reset };
}

export default function GuidedExercises() {
    const [view, setView] = useState('browse');         // 'browse' | 'player' | 'history'
    const [exercises, setExercises] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [aiReason, setAiReason] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentExercise, setCurrentExercise] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [exRes, recRes] = await Promise.all([
                api.get('/exercises'),
                api.get('/exercises/recommend'),
            ]);
            setExercises(exRes.data.data);
            setRecommended(recRes.data.data.recommended);
            setAiReason(recRes.data.data.aiReason);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load exercises.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/exercises/history');
            setHistory(res.data.data);
        } catch { }
    };

    const handleStartExercise = (exercise) => {
        setCurrentExercise(exercise);
        setView('player');
    };

    const handleFinish = async (exerciseId, moodBefore, moodAfter) => {
        try {
            await api.post('/exercises/log', { exerciseId, moodBefore, moodAfter });
        } catch { }
        setView('browse');
        setCurrentExercise(null);
    };

    const filtered = activeCategory === 'all'
        ? exercises
        : exercises.filter(e => e.category === activeCategory);

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🧘 Guided Exercises</h1>
                    <p style={s.subtitle}>Breathing, meditation & CBT tools — matched to your mood</p>
                </div>
                <div style={s.headerLinks}>
                    <Link to="/dashboard" style={s.link}>← Dashboard</Link>
                    <Link to="/crisis" style={s.crisisLink}>🆘 Help</Link>
                </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            {/* ── PLAYER VIEW ── */}
            {view === 'player' && currentExercise && (
                <ExercisePlayer
                    exercise={currentExercise}
                    onFinish={handleFinish}
                    onBack={() => { setView('browse'); setCurrentExercise(null); }}
                />
            )}

            {/* ── BROWSE VIEW ── */}
            {view === 'browse' && (
                <>
                    {/* Tabs */}
                    <div style={s.tabs}>
                        <button style={s.tab(true)} onClick={() => setView('browse')}>🏠 Exercises</button>
                        <button style={s.tab(false)} onClick={() => { setView('history'); fetchHistory(); }}>📜 History</button>
                    </div>

                    {isLoading ? (
                        <div style={s.emptyState}>⏳ Loading exercises…</div>
                    ) : (
                        <>
                            {/* AI Recommendations */}
                            {recommended.length > 0 && (
                                <div style={s.recSection}>
                                    <div style={s.recHeader}>
                                        <p style={s.recTitle}>✨ Recommended For You</p>
                                        {aiReason && <p style={s.recReason}>{aiReason}</p>}
                                    </div>
                                    <div style={s.cardGrid}>
                                        {recommended.slice(0, 3).map(ex => (
                                            <ExerciseCard key={ex.id} exercise={ex} onStart={handleStartExercise} highlighted />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category Filter */}
                            <div style={s.catFilter}>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        style={s.catBtn(activeCategory === cat.id, cat.color)}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* All Exercises */}
                            <div style={s.cardGrid}>
                                {filtered.map(ex => (
                                    <ExerciseCard key={ex.id} exercise={ex} onStart={handleStartExercise} />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── HISTORY VIEW ── */}
            {view === 'history' && (
                <>
                    <div style={s.tabs}>
                        <button style={s.tab(false)} onClick={() => setView('browse')}>🏠 Exercises</button>
                        <button style={s.tab(true)}>📜 History</button>
                    </div>
                    {history.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ fontSize: '36px', margin: '0 0 10px' }}>📭</p>
                            <p>No exercises completed yet. Start one above!</p>
                        </div>
                    ) : (
                        history.map(log => {
                            const col = CAT_COLORS[log.category] || CAT_COLORS.breathing;
                            const moodDiff = log.moodAfter && log.moodBefore ? log.moodAfter - log.moodBefore : null;
                            return (
                                <div key={log._id} style={s.historyItem(col.border)}>
                                    <div style={s.historyTop}>
                                        <div>
                                            <span style={s.histCatBadge(col)}>{log.category}</span>
                                            <p style={s.histName}>{log.exerciseName}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={s.histDate}>{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                            {moodDiff !== null && (
                                                <p style={{ ...s.histDate, color: moodDiff >= 0 ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                                                    {moodDiff >= 0 ? `+${moodDiff}` : moodDiff} mood
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {log.moodBefore && log.moodAfter && (
                                        <p style={s.histMood}>
                                            Mood: {log.moodBefore}/10 → {log.moodAfter}/10
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </>
            )}
        </div>
    );
}

// ── Exercise Card Component ───────────────────────────────────────────────────
function ExerciseCard({ exercise: ex, onStart, highlighted }) {
    const col  = CAT_COLORS[ex.category]  || CAT_COLORS.breathing;
    const diff = DIFF_COLORS[ex.difficulty] || DIFF_COLORS.beginner;
    return (
        <div style={s.card(highlighted, col.border)}>
            <div style={s.cardTop}>
                <span style={{ fontSize: '28px' }}>{ex.emoji}</span>
                <span style={s.catPill(col)}>{ex.category}</span>
            </div>
            <p style={s.cardName}>{ex.name}</p>
            <p style={s.cardDesc}>{ex.description}</p>
            <div style={s.cardMeta}>
                <span style={s.diffPill(diff)}>{ex.difficulty}</span>
                <span style={s.duration}>⏱ {ex.duration} min</span>
            </div>
            <div style={s.bestForRow}>
                {ex.bestFor.slice(0, 3).map(b => (
                    <span key={b} style={s.bestForChip}>{b}</span>
                ))}
            </div>
            <button onClick={() => onStart(ex)} style={s.startBtn(col.text)}>
                ▶ Start Exercise
            </button>
        </div>
    );
}

// ── Exercise Player Component ─────────────────────────────────────────────────
function ExercisePlayer({ exercise: ex, onFinish, onBack }) {
    const [phase, setPhase] = useState('intro');  // 'intro' | 'active' | 'complete'
    const [stepIndex, setStepIndex] = useState(0);
    const [cycle, setCycle] = useState(1);
    const [moodBefore, setMoodBefore] = useState(null);
    const [moodAfter, setMoodAfter]   = useState(null);

    const currentStep = ex.steps[stepIndex];
    const totalSteps  = ex.steps.length;
    const progress    = ((stepIndex + (cycle - 1) * totalSteps) / (totalSteps * ex.cycles)) * 100;

    const { timeLeft, isRunning, start, pause, reset } = useTimer(
        currentStep?.duration || 30,
        () => handleNextStep()
    );

    const handleNextStep = () => {
        if (stepIndex < totalSteps - 1) {
            setStepIndex(i => i + 1);
        } else if (cycle < ex.cycles) {
            setCycle(c => c + 1);
            setStepIndex(0);
        } else {
            setPhase('complete');
        }
    };

    // Reset timer when step changes
    useEffect(() => { reset(); }, [stepIndex, cycle]);

    const col = CAT_COLORS[ex.category] || CAT_COLORS.breathing;

    const STEP_TYPE_COLORS = {
        inhale:    '#0284c7',
        exhale:    '#16a34a',
        hold:      '#9ca3af',
        focus:     '#7c3aed',
        prepare:   '#6366f1',
        finish:    '#16a34a',
        write:     '#d97706',
        think:     '#7c3aed',
        sense:     '#0284c7',
        tense:     '#dc2626',
        reflect:   '#6b7280',
        visualize: '#7c3aed',
        decide:    '#d97706',
        plan:      '#6366f1',
        identify:  '#dc2626',
        categorize:'#d97706',
        reframe:   '#16a34a',
    };

    return (
        <div style={s.player}>
            {/* Player header */}
            <div style={s.playerHeader}>
                <button onClick={onBack} style={s.backBtn}>← Back</button>
                <span style={{ fontSize: '20px' }}>{ex.emoji}</span>
                <span style={s.playerTitle}>{ex.name}</span>
            </div>

            {/* ── INTRO PHASE ── */}
            {phase === 'intro' && (
                <div style={s.introCard}>
                    <p style={s.introDesc}>{ex.description}</p>
                    <div style={s.introDivider} />
                    <p style={s.introMeta}>⏱ {ex.duration} minutes · {totalSteps} steps{ex.cycles > 1 ? ` · ${ex.cycles} rounds` : ''}</p>

                    {/* Mood before */}
                    <p style={s.moodAskLabel}>How's your mood right now? (optional)</p>
                    <div style={s.moodBtns}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <button key={n} onClick={() => setMoodBefore(n)} style={s.moodNumBtn(moodBefore === n)}>
                                {n}
                            </button>
                        ))}
                    </div>

                    <div style={s.tipBox}>
                        <p style={s.tipText}>💡 {ex.tip}</p>
                    </div>

                    <button onClick={() => setPhase('active')} style={s.beginBtn(col.text)}>
                        ▶ Begin Exercise
                    </button>
                </div>
            )}

            {/* ── ACTIVE PHASE ── */}
            {phase === 'active' && currentStep && (
                <div style={s.activeCard}>
                    {/* Progress bar */}
                    <div style={s.progressBg}>
                        <div style={s.progressFill(progress, col.text)} />
                    </div>
                    <p style={s.progressLabel}>
                        Step {stepIndex + 1} of {totalSteps}
                        {ex.cycles > 1 && ` · Round ${cycle} of ${ex.cycles}`}
                    </p>

                    {/* Step type badge */}
                    <div style={s.stepTypeBadge(STEP_TYPE_COLORS[currentStep.type] || '#6366f1')}>
                        {currentStep.type.toUpperCase()}
                    </div>

                    {/* Instruction */}
                    <p style={s.stepInstruction}>{currentStep.instruction}</p>

                    {/* Timer circle */}
                    <div style={s.timerCircle(col.text)}>
                        <span style={s.timerNum}>{timeLeft}</span>
                        <span style={s.timerSec}>sec</span>
                    </div>

                    {/* Controls */}
                    <div style={s.controls}>
                        <button onClick={isRunning ? pause : start} style={s.controlBtn(col.text)}>
                            {isRunning ? '⏸ Pause' : '▶ Start Timer'}
                        </button>
                        <button onClick={handleNextStep} style={s.skipBtn}>
                            Skip →
                        </button>
                    </div>
                </div>
            )}

            {/* ── COMPLETE PHASE ── */}
            {phase === 'complete' && (
                <div style={s.completeCard}>
                    <p style={{ fontSize: '56px', margin: '0 0 12px' }}>🎉</p>
                    <p style={s.completeTitle}>Exercise Complete!</p>
                    <p style={s.completeSubtitle}>Well done for taking time for your mental health.</p>

                    {/* Mood after */}
                    <p style={s.moodAskLabel}>How's your mood now?</p>
                    <div style={s.moodBtns}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <button key={n} onClick={() => setMoodAfter(n)} style={s.moodNumBtn(moodAfter === n)}>
                                {n}
                            </button>
                        ))}
                    </div>

                    {moodBefore && moodAfter && (
                        <div style={s.moodDiffBox(moodAfter >= moodBefore)}>
                            <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>
                                {moodAfter > moodBefore
                                    ? `✅ Your mood improved by ${moodAfter - moodBefore} point${moodAfter - moodBefore > 1 ? 's' : ''}!`
                                    : moodAfter === moodBefore
                                    ? '💙 Your mood stayed stable.'
                                    : '💙 That\'s okay. Some sessions need time to settle.'}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => onFinish(ex.id, moodBefore, moodAfter)}
                        style={s.doneBtn}
                    >
                        ✓ Save & Return
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    page: { maxWidth: '680px', margin: '40px auto', padding: '0 16px 40px', fontFamily: "'Segoe UI', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' },
    subtitle: { margin: 0, fontSize: '14px', color: '#6b7280' },
    headerLinks: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
    link: { textDecoration: 'none', color: '#6366f1', fontWeight: '600', fontSize: '13px' },
    crisisLink: { textDecoration: 'none', color: '#dc2626', fontWeight: '600', fontSize: '13px' },
    errorBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
    tabs: { display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '24px' },
    tab: (active) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', backgroundColor: active ? 'white' : 'transparent', color: active ? '#6366f1' : '#6b7280', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }),
    emptyState: { textAlign: 'center', padding: '60px 0', color: '#9ca3af' },
    recSection: { backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '18px', marginBottom: '24px' },
    recHeader: { marginBottom: '14px' },
    recTitle: { margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#4f46e5' },
    recReason: { margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' },
    catFilter: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' },
    catBtn: (active, color) => ({ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${active ? color : '#e5e7eb'}`, backgroundColor: active ? `${color}15` : 'white', color: active ? color : '#6b7280', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '700' : '400', transition: 'all 0.15s' }),
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px', marginBottom: '8px' },
    card: (highlighted, border) => ({ backgroundColor: 'white', border: `1px solid ${highlighted ? '#c7d2fe' : border}`, borderRadius: '14px', padding: '18px', boxShadow: highlighted ? '0 4px 12px rgba(99,102,241,0.12)' : '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }),
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    catPill: (col) => ({ fontSize: '11px', fontWeight: '700', backgroundColor: col.bg, color: col.text, border: `1px solid ${col.border}`, padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' }),
    cardName: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' },
    cardDesc: { margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5', flex: 1 },
    cardMeta: { display: 'flex', gap: '8px', alignItems: 'center' },
    diffPill: (diff) => ({ fontSize: '11px', fontWeight: '600', backgroundColor: diff.bg, color: diff.text, padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' }),
    duration: { fontSize: '12px', color: '#9ca3af' },
    bestForRow: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
    bestForChip: { fontSize: '11px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '2px 6px', borderRadius: '10px' },
    startBtn: (color) => ({ width: '100%', padding: '10px', backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30`, borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginTop: '4px', transition: 'all 0.15s' }),
    player: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
    playerHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' },
    backBtn: { background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#6b7280', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' },
    playerTitle: { fontSize: '15px', fontWeight: '700', color: '#111827' },
    introCard: { padding: '28px' },
    introDesc: { fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 16px' },
    introDivider: { height: '1px', backgroundColor: '#f3f4f6', margin: '16px 0' },
    introMeta: { fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' },
    moodAskLabel: { fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 10px' },
    moodBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' },
    moodNumBtn: (sel) => ({ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${sel ? '#6366f1' : '#e5e7eb'}`, backgroundColor: sel ? '#6366f1' : 'white', color: sel ? 'white' : '#6b7280', cursor: 'pointer', fontWeight: sel ? '700' : '400', fontSize: '13px', fontFamily: 'inherit' }),
    tipBox: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' },
    tipText: { margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.6' },
    beginBtn: (color) => ({ width: '100%', padding: '13px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', fontFamily: 'inherit' }),
    activeCard: { padding: '24px', textAlign: 'center' },
    progressBg: { height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' },
    progressFill: (pct, color) => ({ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 0.5s ease' }),
    progressLabel: { fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' },
    stepTypeBadge: (color) => ({ display: 'inline-block', backgroundColor: `${color}20`, color: color, fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.08em', marginBottom: '16px' }),
    stepInstruction: { fontSize: '16px', color: '#111827', lineHeight: '1.7', margin: '0 0 28px', whiteSpace: 'pre-line' },
    timerCircle: (color) => ({ width: '100px', height: '100px', borderRadius: '50%', border: `4px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', backgroundColor: `${color}10` }),
    timerNum: { fontSize: '32px', fontWeight: '800', color: '#111827', lineHeight: 1 },
    timerSec: { fontSize: '12px', color: '#9ca3af' },
    controls: { display: 'flex', gap: '10px', justifyContent: 'center' },
    controlBtn: (color) => ({ padding: '12px 28px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' }),
    skipBtn: { padding: '12px 20px', backgroundColor: 'white', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' },
    completeCard: { padding: '40px 28px', textAlign: 'center' },
    completeTitle: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 8px' },
    completeSubtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 28px' },
    moodDiffBox: (pos) => ({ backgroundColor: pos ? '#f0fdf4' : '#eff6ff', border: `1px solid ${pos ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '10px', padding: '14px', margin: '12px 0 20px', color: pos ? '#16a34a' : '#1d4ed8' }),
    doneBtn: { padding: '13px 32px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', fontFamily: 'inherit' },
    historyItem: (border) => ({ backgroundColor: 'white', border: `1px solid ${border}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }),
    historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    histCatBadge: (col) => ({ fontSize: '11px', fontWeight: '700', backgroundColor: col.bg, color: col.text, padding: '2px 8px', borderRadius: '20px', textTransform: 'capitalize', display: 'inline-block', marginBottom: '4px' }),
    histName: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' },
    histDate: { margin: '0 0 2px', fontSize: '12px', color: '#9ca3af' },
    histMood: { margin: '8px 0 0', fontSize: '13px', color: '#6b7280' },
};