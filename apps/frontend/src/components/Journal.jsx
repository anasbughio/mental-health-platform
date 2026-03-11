import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';

const getMoodEmoji = (score) => {
    if (!score) return '—';
    if (score <= 2) return '😔';
    if (score <= 4) return '😟';
    if (score <= 6) return '😐';
    if (score <= 8) return '🙂';
    return '😊';
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export default function Journal() {
    const [view, setView] = useState('write');      // 'write' | 'entries'
    const [prompt, setPrompt] = useState('');
    const [entry, setEntry] = useState('');
    const [moodAtTime, setMoodAtTime] = useState('');
    const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedEntry, setSavedEntry] = useState(null);  // shows reflection after save
    const [entries, setEntries] = useState([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPrompt();
    }, []);

    useEffect(() => {
        if (view === 'entries') fetchEntries();
    }, [view]);

    const fetchPrompt = async () => {
        setIsLoadingPrompt(true);
        setError('');
        try {
            const res = await api.get('/journal/prompt');
            setPrompt(res.data.data.prompt);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Could not load prompt. Please try again.');
        } finally {
            setIsLoadingPrompt(false);
        }
    };

    const fetchEntries = async () => {
        setIsLoadingEntries(true);
        try {
            const res = await api.get('/journal');
            setEntries(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoadingEntries(false);
        }
    };

    const handleSave = async () => {
        if (!entry.trim()) return;
        setIsSaving(true);
        setError('');
        try {
            const res = await api.post('/journal', {
                prompt,
                entry,
                moodAtTime: moodAtTime ? Number(moodAtTime) : null,
            });
            setSavedEntry(res.data.data);
            setEntry('');
            setMoodAtTime('');
        } catch (err) {
            setError('Failed to save entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNewEntry = () => {
        setSavedEntry(null);
        fetchPrompt();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await api.delete(`/journal/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
        } catch {
            setError('Failed to delete entry.');
        }
    };

    const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

    return (
        <div style={s.page}>
            {/* ── Header ── */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>📔 Journal</h1>
                    <p style={s.subtitle}>Guided reflections, powered by AI</p>
                </div>
                <div style={s.headerLinks}>
                    <Link to="/dashboard" style={s.link}>← Dashboard</Link>
                    <Link to="/chat" style={s.link}>AI Chat →</Link>
                </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            {/* ── Tabs ── */}
            <div style={s.tabs}>
                <button style={s.tab(view === 'write')} onClick={() => { setView('write'); setSavedEntry(null); }}>
                    ✍️ Write
                </button>
                <button style={s.tab(view === 'entries')} onClick={() => setView('entries')}>
                    📚 Past Entries {entries.length > 0 && `(${entries.length})`}
                </button>
            </div>

            {/* ══════════════════════ WRITE VIEW ══════════════════════ */}
            {view === 'write' && (
                <>
                    {/* After saving — show reflection */}
                    {savedEntry ? (
                        <div style={s.reflectionCard}>
                            <div style={s.reflectionHeader}>
                                <span style={s.reflectionBadge}>✨ Entry Saved</span>
                                <span style={s.reflectionDate}>{formatDate(savedEntry.createdAt)}</span>
                            </div>

                            <div style={s.promptDisplay}>
                                <span style={s.promptLabel}>PROMPT</span>
                                <p style={s.promptText}>{savedEntry.prompt}</p>
                            </div>

                            <div style={s.entryDisplay}>
                                <p style={s.entryText}>{savedEntry.entry}</p>
                            </div>

                            {savedEntry.aiReflection && (
                                <div style={s.aiReflectionBox}>
                                    <div style={s.aiReflectionHeader}>
                                        <span style={s.aiIcon}>🤖</span>
                                        <strong style={s.aiLabel}>AI Reflection</strong>
                                    </div>
                                    <p style={s.aiText}>{savedEntry.aiReflection}</p>
                                </div>
                            )}

                            <button onClick={handleNewEntry} style={s.newEntryBtn}>
                                ✍️ Write Another Entry
                            </button>
                        </div>
                    ) : (
                        /* Writing form */
                        <div style={s.writeCard}>
                            {/* Prompt Section */}
                            <div style={s.promptSection}>
                                <div style={s.promptTopRow}>
                                    <span style={s.promptLabel}>TODAY'S PROMPT</span>
                                    <button
                                        onClick={fetchPrompt}
                                        disabled={isLoadingPrompt}
                                        style={s.refreshBtn}
                                        title="Get a new prompt"
                                    >
                                        {isLoadingPrompt ? '⏳' : '🔄'} New Prompt
                                    </button>
                                </div>

                                {isLoadingPrompt ? (
                                    <div style={s.promptLoading}>
                                        <div style={s.shimmer} />
                                        <div style={{ ...s.shimmer, width: '70%', marginTop: '8px' }} />
                                    </div>
                                ) : (
                                    <p style={s.promptText}>{prompt}</p>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={s.divider} />

                            {/* Mood selector */}
                            <div style={s.moodRow}>
                                <label style={s.moodLabel}>How are you feeling right now?</label>
                                <div style={s.moodOptions}>
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setMoodAtTime(moodAtTime == n ? '' : n)}
                                            style={s.moodBtn(moodAtTime == n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                {moodAtTime && (
                                    <p style={s.moodHint}>{getMoodEmoji(Number(moodAtTime))} Score: {moodAtTime}/10</p>
                                )}
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={entry}
                                onChange={(e) => setEntry(e.target.value)}
                                placeholder="Start writing… there's no right or wrong answer. Just let it flow."
                                style={s.textarea}
                                rows={10}
                            />
                            <div style={s.wordCountRow}>
                                <span style={s.wordCount}>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || !entry.trim() || !prompt || isLoadingPrompt}
                               style={s.saveBtn(isSaving || !entry.trim() || !prompt || isLoadingPrompt)}
                            >
                                {isSaving ? '✨ Saving & Reflecting…' : '💾 Save & Get AI Reflection'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════ ENTRIES VIEW ══════════════════════ */}
            {view === 'entries' && (
                <div>
                    {isLoadingEntries ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                            Loading your entries…
                        </div>
                    ) : entries.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>📭</p>
                            <p style={{ color: '#6b7280', margin: 0 }}>No journal entries yet.</p>
                            <button onClick={() => setView('write')} style={{ ...s.newEntryBtn, marginTop: '16px' }}>
                                Write your first entry
                            </button>
                        </div>
                    ) : (
                        entries.map(e => (
                            <div key={e._id} style={s.entryCard}>
                                <div style={s.entryCardHeader}>
                                    <div>
                                        <p style={s.entryCardDate}>{formatDate(e.createdAt)}</p>
                                        {e.moodAtTime && (
                                            <span style={s.moodPill}>
                                                {getMoodEmoji(e.moodAtTime)} {e.moodAtTime}/10
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => setExpandedId(expandedId === e._id ? null : e._id)}
                                            style={s.expandBtn}
                                        >
                                            {expandedId === e._id ? 'Collapse ↑' : 'Read ↓'}
                                        </button>
                                        <button onClick={() => handleDelete(e._id)} style={s.deleteBtn}>🗑</button>
                                    </div>
                                </div>

                                {/* Prompt preview */}
                                <p style={s.entryPromptPreview}>💬 {e.prompt}</p>

                                {/* Expanded content */}
                                {expandedId === e._id && (
                                    <div style={s.expandedContent}>
                                        <div style={s.divider} />
                                        <p style={{ ...s.entryText, whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                                            {e.entry}
                                        </p>
                                        {e.aiReflection && (
                                            <div style={s.aiReflectionBox}>
                                                <div style={s.aiReflectionHeader}>
                                                    <span style={s.aiIcon}>🤖</span>
                                                    <strong style={s.aiLabel}>AI Reflection</strong>
                                                </div>
                                                <p style={s.aiText}>{e.aiReflection}</p>
                                            </div>
                                        )}
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

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
    page: {
        maxWidth: '680px',
        margin: '40px auto',
        padding: '0 16px',
        fontFamily: "'Georgia', 'Times New Roman', serif",
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
        color: '#1c1917',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        margin: 0,
        fontSize: '14px',
        color: '#78716c',
        fontFamily: "'Segoe UI', sans-serif",
    },
    headerLinks: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-end',
    },
    link: {
        textDecoration: 'none',
        color: '#a16207',
        fontWeight: '600',
        fontSize: '13px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '16px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    tabs: {
        display: 'flex',
        gap: '4px',
        backgroundColor: '#fafaf9',
        borderRadius: '10px',
        padding: '4px',
        marginBottom: '28px',
        border: '1px solid #e7e5e4',
    },
    tab: (active) => ({
        flex: 1,
        padding: '10px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: active ? 'white' : 'transparent',
        color: active ? '#a16207' : '#78716c',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.2s',
    }),
    writeCard: {
        backgroundColor: 'white',
        border: '1px solid #e7e5e4',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    promptSection: {
        marginBottom: '0',
    },
    promptTopRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    promptLabel: {
        fontSize: '10px',
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: '700',
        letterSpacing: '0.1em',
        color: '#a16207',
        backgroundColor: '#fef9c3',
        padding: '3px 8px',
        borderRadius: '4px',
    },
    refreshBtn: {
        background: 'none',
        border: '1px solid #e7e5e4',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#78716c',
        fontSize: '12px',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '5px 10px',
    },
    promptLoading: {
        padding: '8px 0',
    },
    shimmer: {
        height: '18px',
        width: '100%',
        backgroundColor: '#f5f5f4',
        borderRadius: '4px',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    promptText: {
        fontSize: '18px',
        lineHeight: '1.6',
        color: '#1c1917',
        margin: '0',
        fontStyle: 'italic',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f5f5f4',
        margin: '20px 0',
    },
    moodRow: {
        marginBottom: '20px',
    },
    moodLabel: {
        display: 'block',
        fontSize: '13px',
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: '600',
        color: '#57534e',
        marginBottom: '10px',
    },
    moodOptions: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
    },
    moodBtn: (selected) => ({
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: `1px solid ${selected ? '#a16207' : '#e7e5e4'}`,
        backgroundColor: selected ? '#fef9c3' : 'white',
        color: selected ? '#a16207' : '#78716c',
        cursor: 'pointer',
        fontWeight: selected ? '700' : '400',
        fontSize: '13px',
        fontFamily: "'Segoe UI', sans-serif",
        transition: 'all 0.15s',
    }),
    moodHint: {
        margin: '8px 0 0 0',
        fontSize: '13px',
        color: '#a16207',
        fontFamily: "'Segoe UI', sans-serif",
    },
    textarea: {
        width: '100%',
        padding: '16px',
        border: '1px solid #e7e5e4',
        borderRadius: '12px',
        boxSizing: 'border-box',
        fontSize: '16px',
        lineHeight: '1.75',
        fontFamily: "'Georgia', serif",
        color: '#1c1917',
        resize: 'vertical',
        outline: 'none',
        backgroundColor: '#fafaf9',
    },
    wordCountRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '6px',
        marginBottom: '16px',
    },
    wordCount: {
        fontSize: '12px',
        color: '#a8a29e',
        fontFamily: "'Segoe UI', sans-serif",
    },
    saveBtn: (disabled) => ({
        width: '100%',
        padding: '13px',
        backgroundColor: disabled ? '#e7e5e4' : '#a16207',
        color: disabled ? '#a8a29e' : 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '15px',
        fontWeight: '700',
        fontFamily: "'Segoe UI', sans-serif",
        transition: 'background 0.2s',
    }),
    reflectionCard: {
        backgroundColor: 'white',
        border: '1px solid #e7e5e4',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    reflectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    reflectionBadge: {
        backgroundColor: '#dcfce7',
        color: '#16a34a',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
    },
    reflectionDate: {
        fontSize: '12px',
        color: '#a8a29e',
        fontFamily: "'Segoe UI', sans-serif",
    },
    promptDisplay: {
        marginBottom: '16px',
    },
    entryDisplay: {
        backgroundColor: '#fafaf9',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '16px',
        border: '1px solid #f5f5f4',
    },
    entryText: {
        margin: 0,
        fontSize: '15px',
        lineHeight: '1.7',
        color: '#292524',
    },
    aiReflectionBox: {
        backgroundColor: '#fffbeb',
        borderLeft: '3px solid #a16207',
        padding: '16px',
        borderRadius: '0 10px 10px 0',
        marginTop: '8px',
    },
    aiReflectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    aiIcon: {
        fontSize: '16px',
    },
    aiLabel: {
        fontSize: '13px',
        color: '#a16207',
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: '700',
    },
    aiText: {
        margin: 0,
        fontSize: '14px',
        lineHeight: '1.65',
        color: '#292524',
    },
    newEntryBtn: {
        display: 'block',
        width: '100%',
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#fef9c3',
        color: '#a16207',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        fontFamily: "'Segoe UI', sans-serif",
        textAlign: 'center',
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 0',
    },
    entryCard: {
        backgroundColor: 'white',
        border: '1px solid #e7e5e4',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    },
    entryCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
    },
    entryCardDate: {
        margin: '0 0 6px 0',
        fontSize: '13px',
        fontWeight: '600',
        color: '#57534e',
        fontFamily: "'Segoe UI', sans-serif",
    },
    moodPill: {
        display: 'inline-block',
        backgroundColor: '#fef9c3',
        color: '#a16207',
        fontSize: '12px',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '20px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    expandBtn: {
        background: 'none',
        border: '1px solid #e7e5e4',
        borderRadius: '8px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#78716c',
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: '600',
    },
    deleteBtn: {
        background: 'none',
        border: '1px solid #fee2e2',
        borderRadius: '8px',
        padding: '5px 8px',
        cursor: 'pointer',
        fontSize: '13px',
    },
    entryPromptPreview: {
        margin: 0,
        fontSize: '14px',
        color: '#78716c',
        fontStyle: 'italic',
        lineHeight: '1.5',
        fontFamily: "'Georgia', serif",
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    expandedContent: {
        marginTop: '12px',
    },
};