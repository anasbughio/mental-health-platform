import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

const getMoodEmoji = (s) => !s ? '—' : s <= 2 ? '😔' : s <= 4 ? '😟' : s <= 6 ? '😐' : s <= 8 ? '🙂' : '😊';
const getMoodColor = (s) => !s ? '#9ca3af' : s <= 3 ? '#ef4444' : s <= 5 ? '#f59e0b' : s <= 7 ? '#84cc16' : '#10b981';

const formatDate  = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const formatShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Simple keyword tag extractor from AI reflection
const extractTags = (text = '') => {
    const keywords = ['Focus','Structure','Growth','Calm','Clarity','Mindfulness','Anxiety','Progress','Gratitude','Balance','Energy','Rest','Stress','Joy','Confidence'];
    return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).slice(0, 4);
};

// Streak calculator
const calcStreak = (entries = []) => {
    if (!entries.length) return 0;
    const dates = [...new Set(entries.map(e => new Date(e.createdAt).toDateString()))];
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const diff = (new Date(dates[i]) - new Date(dates[i + 1])) / 86400000;
        if (diff <= 1) streak++;
        else break;
    }
    return streak;
};

// Inspirational quotes
const QUOTES = [
    'Finding balance in the chaos.',
    'Every word is a step forward.',
    'Your story matters.',
    'Clarity begins with reflection.',
    'Growth lives in the quiet moments.',
];

export default function Journal() {
    const [view, setView]                   = useState('write');
    const [prompt, setPrompt]               = useState('');
    const [entry, setEntry]                 = useState('');
    const [moodAtTime, setMoodAtTime]       = useState('');
    const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
    const [isSaving, setIsSaving]           = useState(false);
    const [savedEntry, setSavedEntry]       = useState(null);
    const [entries, setEntries]             = useState([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [expandedId, setExpandedId]       = useState(null);
    const [error, setError]                 = useState('');
    const [ready, setReady]                 = useState(false);
    const navigate = useNavigate();

    const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;
    const streak    = calcStreak(entries);
    const quote     = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    useEffect(() => {
        fetchPrompt();
        fetchEntries();
        setTimeout(() => setReady(true), 60);
    }, []);

    const fetchPrompt = async () => {
        setIsLoadingPrompt(true);
        setError('');
        try {
            const res = await api.get('/journal/prompt');
            setPrompt(res.data.data.prompt);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Could not load prompt.');
        } finally { setIsLoadingPrompt(false); }
    };

    const fetchEntries = async () => {
        setIsLoadingEntries(true);
        try {
            const res = await api.get('/journal');
            setEntries(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally { setIsLoadingEntries(false); }
    };

    const handleSave = async () => {
        if (!entry.trim() || !prompt || isLoadingPrompt) return;
        setIsSaving(true);
        setError('');
        try {
            const res = await api.post('/journal', {
                prompt, entry,
                moodAtTime: moodAtTime ? Number(moodAtTime) : null,
            });
            setSavedEntry(res.data.data);
            setEntry('');
            setMoodAtTime('');
            fetchEntries();
        } catch { setError('Failed to save entry.'); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await api.delete(`/journal/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch { setError('Failed to delete.'); }
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

            .jn { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:36px 44px 100px; box-sizing:border-box; }

            /* hero */
            .jn-hero { text-align:center; margin-bottom:28px; }
            .jn-hero h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:34px; font-weight:800; color:#111827; margin:0 0 6px; letter-spacing:-0.7px; }
            .jn-hero p  { font-size:14px; color:#9ca3af; margin:0; }

            /* tabs */
            .jn-tabs { display:flex; justify-content:flex-end; gap:4px; background:white; border-radius:12px; padding:4px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid #f3f4f6; width:fit-content; margin:0 0 24px auto; }
            .jn-tab  { padding:8px 22px; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
            .jn-tab.on  { background:#111827; color:white; box-shadow:0 2px 8px rgba(0,0,0,0.18); }
            .jn-tab.off { background:transparent; color:#6b7280; }
            .jn-tab.off:hover { color:#374151; }

            /* ── WRITE LAYOUT ── */
            .jn-layout { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }

            /* main writing card */
            .jn-write-card { background:white; border-radius:22px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .jn-write-head { padding:18px 24px 14px; border-bottom:1px solid #f9fafb; display:flex; justify-content:space-between; align-items:center; }
            .jn-write-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0; display:flex; align-items:center; gap:7px; }
            .jn-write-date  { font-size:11px; color:#9ca3af; font-weight:500; text-transform:uppercase; letter-spacing:0.07em; }
            .jn-write-body  { padding:22px 24px 0; }

            /* prompt box */
            .jn-prompt-box { background:linear-gradient(135deg,#fefce8,#fef9c3); border:1px solid #fde68a; border-radius:14px; padding:16px 18px; margin-bottom:18px; }
            .jn-prompt-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
            .jn-prompt-lbl { font-size:11px; font-weight:700; color:#a16207; background:#fef08a; padding:3px 9px; border-radius:20px; letter-spacing:0.07em; }
            .jn-prompt-refresh { background:none; border:1px solid #fde68a; border-radius:8px; cursor:pointer; color:#a16207; font-size:11px; font-family:'DM Sans',sans-serif; font-weight:600; padding:4px 10px; transition:all 0.15s; }
            .jn-prompt-refresh:hover { background:#fef08a; }
            .jn-prompt-text { font-family:'Lora',serif; font-size:16px; color:#1c1917; line-height:1.65; margin:0; font-style:italic; }
            .jn-prompt-shimmer { height:18px; background:#fef08a; border-radius:6px; animation:shimmer 1.5s infinite; margin-bottom:8px; }
            .jn-prompt-shimmer2 { height:18px; background:#fef08a; border-radius:6px; animation:shimmer 1.5s 0.2s infinite; width:65%; }
            @keyframes shimmer { 0%,100%{opacity:0.5;} 50%{opacity:1;} }

            /* mood row */
            .jn-mood-lbl { font-size:12px; font-weight:600; color:#6b7280; margin:0 0 8px; display:flex; align-items:center; gap:6px; }
            .jn-mood-btns { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:18px; }
            .jn-mood-btn { width:36px; height:36px; border-radius:10px; border:1.5px solid #e5e7eb; background:white; color:#6b7280; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
            .jn-mood-btn:hover { border-color:#a5b4fc; color:#6366f1; }
            .jn-mood-btn.on { background:#6366f1; color:white; border-color:#6366f1; transform:scale(1.1); }

            /* textarea */
            .jn-ta { width:100%; border:none; outline:none; font-family:'Lora',serif; font-size:15px; color:#1c1917; line-height:1.8; resize:none; background:transparent; padding:0; min-height:220px; box-sizing:border-box; }
            .jn-ta::placeholder { color:#c4b5fd; font-style:italic; }

            /* footer */
            .jn-write-foot { padding:14px 24px 18px; border-top:1px solid #f9fafb; display:flex; justify-content:space-between; align-items:center; margin-top:12px; }
            .jn-wc { font-size:12px; color:#9ca3af; display:flex; align-items:center; gap:5px; }
            .jn-save { padding:10px 24px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; border:none; border-radius:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 3px 10px rgba(99,102,241,0.3); display:flex; align-items:center; gap:7px; }
            .jn-save:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }
            .jn-save:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }

            /* ── Sidebar ── */
            .jn-side { display:flex; flex-direction:column; gap:14px; }
            .jn-sc { background:white; border-radius:18px; padding:18px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .jn-sc-t { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#111827; margin:0 0 14px; display:flex; align-items:center; gap:7px; }

            /* streak */
            .jn-streak-row { display:flex; align-items:center; gap:12px; }
            .jn-streak-icon { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#fef9c3,#fde68a); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
            .jn-streak-num { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:#111827; line-height:1; margin:0 0 2px; }
            .jn-streak-sub { font-size:11px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.07em; margin:0; }

            /* recent entries */
            .jn-recent-item { padding:10px 0; border-bottom:1px solid #f9fafb; cursor:pointer; transition:padding 0.15s; }
            .jn-recent-item:last-child { border-bottom:none; }
            .jn-recent-item:hover { padding-left:4px; }
            .jn-recent-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
            .jn-recent-date { font-size:11px; color:#9ca3af; font-weight:500; }
            .jn-mood-dot { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; }
            .jn-recent-text { font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.4; font-family:'Lora',serif; font-style:italic; }
            .jn-view-all { width:100%; padding:8px; background:#f9fafb; border:1px solid #f3f4f6; border-radius:10px; font-size:12px; font-weight:600; color:#6b7280; cursor:pointer; font-family:'DM Sans',sans-serif; margin-top:10px; transition:all 0.15s; }
            .jn-view-all:hover { background:#f0f4ff; color:#6366f1; border-color:#c7d2fe; }

            /* inspirational image card */
            .jn-inspire { border-radius:18px; overflow:hidden; position:relative; height:140px; background:linear-gradient(135deg,#1e1b4b,#312e81,#4338ca); cursor:default; }
            .jn-inspire-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%); }
            .jn-inspire-circle { position:absolute; top:16px; left:50%; transform:translateX(-50%); width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.15); border:2px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; font-size:28px; }
            .jn-inspire-text { position:absolute; bottom:0; left:0; right:0; padding:14px; }
            .jn-inspire-tag { font-size:9px; font-weight:700; color:rgba(255,255,255,0.6); letter-spacing:0.1em; text-transform:uppercase; margin:0 0 3px; }
            .jn-inspire-quote { font-family:'Lora',serif; font-size:13px; color:white; margin:0; font-style:italic; font-weight:600; }

            /* ── SAVED ENTRY (after save) ── */
            .jn-saved { background:white; border-radius:22px; padding:28px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); animation:cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes cardIn { from{opacity:0;transform:scale(0.97) translateY(10px);} to{opacity:1;transform:scale(1) translateY(0);} }
            .jn-saved-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
            .jn-saved-badge { background:#dcfce7; color:#16a34a; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
            .jn-saved-date  { font-size:12px; color:#9ca3af; }
            .jn-saved-prompt-lbl { font-size:10px; font-weight:700; color:#a16207; letter-spacing:0.08em; background:#fef9c3; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:8px; }
            .jn-saved-prompt { font-family:'Lora',serif; font-size:16px; color:#111827; font-style:italic; margin:0 0 16px; line-height:1.6; }
            .jn-saved-entry { background:#fafafa; border-radius:12px; padding:16px; border:1px solid #f3f4f6; margin-bottom:16px; }
            .jn-saved-entry p { font-family:'Lora',serif; font-size:15px; color:#292524; margin:0; line-height:1.75; white-space:pre-wrap; }
            .jn-ai-card { background:linear-gradient(135deg,#f0f4ff,#ede9fe); border:1px solid #c7d2fe; border-radius:14px; padding:18px; margin-bottom:18px; animation:fadeUp 0.5s ease 0.3s both; }
            @keyframes fadeUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
            .jn-ai-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
            .jn-ai-icon { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:14px; }
            .jn-ai-title { font-size:14px; font-weight:700; color:#4338ca; font-family:'Bricolage Grotesque',sans-serif; }
            .jn-ai-body { font-size:14px; color:#3730a3; line-height:1.7; margin:0 0 12px; }
            .jn-ai-tags { display:flex; gap:6px; flex-wrap:wrap; }
            .jn-ai-tag { font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; background:rgba(99,102,241,0.12); color:#4338ca; }
            .jn-new-btn { width:100%; padding:12px; background:#fef9c3; color:#a16207; border:1px solid #fde68a; border-radius:12px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; }
            .jn-new-btn:hover { background:#fef08a; }

            /* ── ENTRIES VIEW ── */
            .jn-entries-grid { display:flex; flex-direction:column; gap:16px; }
            .jn-entry-card { background:white; border-radius:18px; padding:24px 26px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); transition:box-shadow 0.2s; animation:cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1); }
            .jn-entry-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); }
            .jn-entry-archived { font-size:9px; font-weight:700; color:#9ca3af; letter-spacing:0.1em; text-transform:uppercase; border:1px solid #e5e7eb; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:10px; }
            .jn-entry-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
            .jn-entry-date { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:#111827; margin:0; letter-spacing:-0.3px; }
            .jn-entry-mood-box { text-align:right; }
            .jn-entry-mood-lbl { font-size:10px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 2px; }
            .jn-entry-mood-val { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; }
            .jn-entry-mood-emoji { width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px; }
            .jn-entry-text { font-family:'Lora',serif; font-size:15px; color:#4b5563; line-height:1.75; margin:0 0 14px; font-style:italic; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
            .jn-entry-text.expanded { display:block; -webkit-line-clamp:unset; }
            .jn-entry-actions { display:flex; gap:8px; align-items:center; }
            .jn-expand-btn { padding:6px 14px; background:#f9fafb; border:1px solid #f3f4f6; border-radius:9px; font-size:12px; font-weight:600; color:#6b7280; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
            .jn-expand-btn:hover { background:#f0f4ff; color:#6366f1; border-color:#c7d2fe; }
            .jn-del-btn { padding:6px 10px; background:none; border:1px solid #fee2e2; border-radius:9px; font-size:13px; cursor:pointer; transition:all 0.15s; color:#9ca3af; }
            .jn-del-btn:hover { background:#fef2f2; color:#dc2626; border-color:#fca5a5; }
            .jn-entry-expanded { margin-top:14px; animation:fadeUp 0.3s ease; }
            .jn-entry-ai { background:linear-gradient(135deg,#f0f4ff,#ede9fe); border:1px solid #c7d2fe; border-radius:14px; padding:16px 18px; margin-top:12px; }

            /* error */
            .jn-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; margin-bottom:16px; }

            /* empty */
            .jn-empty { text-align:center; padding:80px 0; color:#9ca3af; }
            .jn-empty-btn { padding:11px 28px; background:#6366f1; color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; margin-top:16px; transition:all 0.2s; }
            .jn-empty-btn:hover { background:#4f46e5; }

            @media(max-width:960px) {
                .jn-layout { grid-template-columns:1fr; }
                .jn { padding:24px 20px 100px; }
                .jn-hero h1 { font-size:26px; }
            }
            @media(max-width:600px) {
                .jn { padding:20px 14px 100px; }
                .jn-hero h1 { font-size:22px; }
                .jn-mood-btns { gap:4px; }
                .jn-mood-btn { width:30px; height:30px; font-size:12px; }
            }
        `}</style>

        <div className="jn">
            {/* Hero */}
            <div className="jn-hero" style={fi(0.05)}>
                <h1>Journal</h1>
                <p>Guided reflections, powered by AI</p>
            </div>

            {/* Tabs */}
            <div style={fi(0.1)}>
                <div className="jn-tabs">
                    <button className={`jn-tab ${view === 'write' ? 'on' : 'off'}`}
                        onClick={() => { setView('write'); setSavedEntry(null); }}>Write</button>
                    <button className={`jn-tab ${view === 'entries' ? 'on' : 'off'}`}
                        onClick={() => { setView('entries'); fetchEntries(); }}>
                        Past Entries {entries.length > 0 && `(${entries.length})`}
                    </button>
                </div>
            </div>

            {error && <div className="jn-err">{error}</div>}

            {/* ════════ WRITE VIEW ════════ */}
            {view === 'write' && (
                <div style={fi(0.14)}>
                    {savedEntry ? (
                        /* ── Saved state ── */
                        <div className="jn-layout">
                            <div className="jn-saved">
                                <div className="jn-saved-head">
                                    <span className="jn-saved-badge">✨ Entry Saved</span>
                                    <span className="jn-saved-date">{formatShort(savedEntry.createdAt)}</span>
                                </div>

                                <span className="jn-saved-prompt-lbl">PROMPT</span>
                                <p className="jn-saved-prompt">"{savedEntry.prompt}"</p>

                                <div className="jn-saved-entry">
                                    <p>{savedEntry.entry}</p>
                                </div>

                                {savedEntry.aiReflection && (
                                    <div className="jn-ai-card">
                                        <div className="jn-ai-head">
                                            <div className="jn-ai-icon">🤖</div>
                                            <span className="jn-ai-title">AI Reflection</span>
                                        </div>
                                        <p className="jn-ai-body">{savedEntry.aiReflection}</p>
                                        <div className="jn-ai-tags">
                                            {extractTags(savedEntry.aiReflection).map(t => (
                                                <span key={t} className="jn-ai-tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button className="jn-new-btn" onClick={() => { setSavedEntry(null); fetchPrompt(); }}>
                                    ✍️ Write Another Entry
                                </button>
                            </div>

                            {/* Sidebar */}
                            <SideBar streak={streak} entries={entries} quote={quote}
                                onViewEntry={(id) => { setView('entries'); setTimeout(() => setExpandedId(id), 100); }} />
                        </div>
                    ) : (
                        /* ── Writing state ── */
                        <div className="jn-layout">
                            <div className="jn-write-card">
                                <div className="jn-write-head">
                                    <p className="jn-write-title">
                                        <span>📔</span> Daily Reflection
                                    </p>
                                    <span className="jn-write-date">
                                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                    </span>
                                </div>

                                <div className="jn-write-body">
                                    {/* Prompt */}
                                    <div className="jn-prompt-box">
                                        <div className="jn-prompt-top">
                                            <span className="jn-prompt-lbl">TODAY'S AI PROMPT</span>
                                            <button className="jn-prompt-refresh" onClick={fetchPrompt} disabled={isLoadingPrompt}>
                                                {isLoadingPrompt ? '⏳' : '↻'} New Prompt
                                            </button>
                                        </div>
                                        {isLoadingPrompt ? (
                                            <>
                                                <div className="jn-prompt-shimmer" />
                                                <div className="jn-prompt-shimmer2" />
                                            </>
                                        ) : (
                                            <p className="jn-prompt-text">"{prompt}"</p>
                                        )}
                                    </div>

                                    {/* Mood */}
                                    <p className="jn-mood-lbl">🙂 How are you feeling right now?</p>
                                    <div className="jn-mood-btns">
                                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                            <button key={n} type="button"
                                                className={`jn-mood-btn ${moodAtTime == n ? 'on' : ''}`}
                                                onClick={() => setMoodAtTime(moodAtTime == n ? '' : n)}>
                                                {n}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Textarea */}
                                    <textarea className="jn-ta"
                                        value={entry}
                                        onChange={e => setEntry(e.target.value)}
                                        placeholder="Start writing…"
                                    />
                                </div>

                                <div className="jn-write-foot">
                                    <span className="jn-wc">✏️ {wordCount} word{wordCount !== 1 ? 's' : ''}</span>
                                    <button className="jn-save"
                                        disabled={isSaving || !entry.trim() || !prompt || isLoadingPrompt}
                                        onClick={handleSave}>
                                        {isSaving ? '✨ Saving…' : <>✨ <span>Save & Get AI Reflection</span></>}
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <SideBar streak={streak} entries={entries} quote={quote}
                                onViewEntry={(id) => { setView('entries'); setTimeout(() => setExpandedId(id), 100); }} />
                        </div>
                    )}
                </div>
            )}

            {/* ════════ ENTRIES VIEW ════════ */}
            {view === 'entries' && (
                <div style={fi(0.1)}>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
                            Your Reflections
                        </h2>
                        <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{entries.length} entries — keep writing, keep growing.</p>
                    </div>

                    {isLoadingEntries ? (
                        <div className="jn-empty"><p style={{ fontSize: 14 }}>Loading your entries…</p></div>
                    ) : entries.length === 0 ? (
                        <div className="jn-empty">
                            <p style={{ fontSize: 40, margin: '0 0 12px' }}>📭</p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No entries yet</p>
                            <p style={{ fontSize: 14, margin: '0 0 20px' }}>Start writing your first reflection today.</p>
                            <button className="jn-empty-btn" onClick={() => setView('write')}>✍️ Write First Entry</button>
                        </div>
                    ) : (
                        <div className="jn-entries-grid">
                            {entries.map(e => {
                                const mc  = getMoodColor(e.moodAtTime);
                                const isX = expandedId === e._id;
                                const tags = extractTags(e.aiReflection || '');
                                return (
                                    <div key={e._id} className="jn-entry-card">
                                        <span className="jn-entry-archived">ARCHIVED ENTRY</span>
                                        <div className="jn-entry-header">
                                            <h3 className="jn-entry-date">{formatDate(e.createdAt)}</h3>
                                            {e.moodAtTime && (
                                                <div className="jn-entry-mood-box">
                                                    <p className="jn-entry-mood-lbl">Mood Score</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                                        <span className="jn-entry-mood-val" style={{ color: mc }}>{e.moodAtTime}/10</span>
                                                        <span className="jn-entry-mood-emoji" style={{ background: `${mc}20` }}>
                                                            {getMoodEmoji(e.moodAtTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className={`jn-entry-text ${isX ? 'expanded' : ''}`}>{e.entry}</p>

                                        <div className="jn-entry-actions">
                                            <button className="jn-expand-btn" onClick={() => setExpandedId(isX ? null : e._id)}>
                                                {isX ? '↑ Collapse' : '↓ Read More'}
                                            </button>
                                            <button className="jn-del-btn" onClick={() => handleDelete(e._id)}>🗑</button>
                                        </div>

                                        {isX && e.aiReflection && (
                                            <div className="jn-entry-expanded">
                                                <div className="jn-entry-ai">
                                                    <div className="jn-ai-head">
                                                        <div className="jn-ai-icon">🤖</div>
                                                        <span className="jn-ai-title">AI Reflection</span>
                                                    </div>
                                                    <p className="jn-ai-body">{e.aiReflection}</p>
                                                    {tags.length > 0 && (
                                                        <div className="jn-ai-tags">
                                                            {tags.map(t => <span key={t} className="jn-ai-tag">{t}</span>)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
}

// ── Sidebar component ─────────────────────────────────────────────────────────
function SideBar({ streak, entries, quote, onViewEntry }) {
    const getMoodColor = (s) => !s ? '#9ca3af' : s <= 3 ? '#ef4444' : s <= 5 ? '#f59e0b' : s <= 7 ? '#84cc16' : '#10b981';
    return (
        <div className="jn-side">
            {/* Streak */}
            <div className="jn-sc">
                <p className="jn-sc-t">🔥 Streak</p>
                <div className="jn-streak-row">
                    <div className="jn-streak-icon">{streak >= 7 ? '🏆' : streak >= 3 ? '🔥' : '✨'}</div>
                    <div>
                        <p className="jn-streak-num">{streak} Days</p>
                        <p className="jn-streak-sub">Consistency is growth</p>
                    </div>
                </div>
            </div>

            {/* Recent Entries */}
            <div className="jn-sc">
                <p className="jn-sc-t">📚 Recent Entries</p>
                {entries.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No entries yet.</p>
                ) : (
                    entries.slice(0, 3).map(e => {
                        const mc = getMoodColor(e.moodAtTime);
                        return (
                            <div key={e._id} className="jn-recent-item" onClick={() => onViewEntry(e._id)}>
                                <div className="jn-recent-top">
                                    <span className="jn-recent-date">
                                        {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    {e.moodAtTime && (
                                        <span className="jn-mood-dot" style={{ background: `${mc}18`, color: mc }}>
                                            {e.moodAtTime}/10
                                        </span>
                                    )}
                                </div>
                                <p className="jn-recent-text">{e.entry}</p>
                            </div>
                        );
                    })
                )}
                {entries.length > 0 && (
                    <button className="jn-view-all" onClick={() => onViewEntry(null)}>View All Entries →</button>
                )}
            </div>

            {/* Inspirational card */}
            <div className="jn-inspire">
                <div className="jn-inspire-circle">🧘</div>
                <div className="jn-inspire-overlay" />
                <div className="jn-inspire-text">
                    <p className="jn-inspire-tag">New Reflection</p>
                    <p className="jn-inspire-quote">{quote}</p>
                </div>
            </div>
        </div>
    );
}