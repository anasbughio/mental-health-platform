import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import api from '../config/axios';

const SENTIMENT_COLORS = {
    positive: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
    negative:  { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', dot: '#ef4444' },
    neutral:   { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', dot: '#9ca3af' },
    mixed:     { bg: '#fefce8', text: '#a16207', border: '#fde68a', dot: '#f59e0b' },
};

const EMOTION_EMOJIS = {
    joy: '😊', sadness: '😢', anxiety: '😰', anger: '😠',
    fear: '😨', shame: '😔', loneliness: '😞', hope: '🌟',
    calm: '😌', overwhelm: '😤', numbness: '😶', gratitude: '🙏',
};

const TREND_CONFIG = {
    improving: { icon: '📈', label: 'Improving', color: '#16a34a', bg: '#f0fdf4' },
    declining:  { icon: '📉', label: 'Needs attention', color: '#dc2626', bg: '#fef2f2' },
    stable:     { icon: '➡️', label: 'Stable', color: '#6b7280', bg: '#f9fafb' },
};

const SOURCE_LABELS = { mood: '🌡️ Mood Log', journal: '📔 Journal', chat: '💬 Chat' };

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const score = payload[0].value;
        const col = score > 0.2 ? SENTIMENT_COLORS.positive : score < -0.2 ? SENTIMENT_COLORS.negative : SENTIMENT_COLORS.neutral;
        return (
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>{label}</p>
                <p style={{ margin: 0, fontWeight: '700', color: col.text, fontSize: '15px' }}>
                    Score: {score > 0 ? '+' : ''}{score}
                </p>
            </div>
        );
    }
    return null;
};

export default function SentimentInsights() {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [sumRes, histRes] = await Promise.all([
                api.get('/sentiment/summary'),
                api.get('/sentiment'),
            ]);
            setSummary(sumRes.data.data);
            setHistory(histRes.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    // Chart data — last 20 records oldest first
    const chartData = [...history]
        .slice(0, 20)
        .reverse()
        .map(r => ({
            date: formatDate(r.createdAt),
            score: parseFloat(r.sentimentScore.toFixed(2)),
            sentiment: r.sentiment,
            source: r.source,
        }));

    const noData = !isLoading && (!summary || !summary.hasData);

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🧬 Sentiment Analysis</h1>
                    <p style={s.subtitle}>AI-powered emotional pattern tracking</p>
                </div>
                <div style={s.headerLinks}>
                    <Link to="/dashboard" style={s.link}>← Dashboard</Link>
                    <Link to="/crisis" style={s.crisisLink}>🆘 Crisis Help</Link>
                </div>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
                {['overview', 'timeline', 'entries'].map(tab => (
                    <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                        {{ overview: '📊 Overview', timeline: '📈 Timeline', entries: '📋 All Entries' }[tab]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div style={s.emptyState}>
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>⏳</p>
                    <p>Loading your sentiment data…</p>
                </div>
            ) : noData ? (
                <div style={s.emptyState}>
                    <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🌱</p>
                    <p style={{ color: '#6b7280', marginBottom: '8px' }}>No sentiment data yet.</p>
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Save a mood log or journal entry to start tracking.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                        <Link to="/dashboard" style={s.actionBtn('#6366f1')}>Log Mood</Link>
                        <Link to="/journal" style={s.actionBtn('#a16207')}>Write Journal</Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && summary && (
                        <>
                            {/* Crisis alert if any flagged entries */}
                            {summary.crisisCount > 0 && (
                                <div style={s.crisisAlert}>
                                    <p style={s.crisisAlertTitle}>⚠️ Crisis signals detected in recent entries</p>
                                    <p style={s.crisisAlertText}>
                                        Our AI detected {summary.crisisCount} entry with potential distress signals.
                                        Please consider reaching out to a professional or crisis line.
                                    </p>
                                    <Link to="/crisis" style={s.crisisAlertLink}>View Crisis Resources →</Link>
                                </div>
                            )}

                            {/* Trend banner */}
                            {(() => {
                                const t = TREND_CONFIG[summary.trend] || TREND_CONFIG.stable;
                                return (
                                    <div style={s.trendBanner(t.bg, t.color)}>
                                        <span style={{ fontSize: '24px' }}>{t.icon}</span>
                                        <div>
                                            <p style={{ margin: '0 0 2px', fontWeight: '700', color: t.color, fontSize: '15px' }}>
                                                Your mood is {t.label}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                                                {summary.last7Avg !== null && summary.prev7Avg !== null
                                                    ? `Last 7 days avg: ${summary.last7Avg > 0 ? '+' : ''}${summary.last7Avg} vs previous week: ${summary.prev7Avg > 0 ? '+' : ''}${summary.prev7Avg}`
                                                    : 'Based on your recent entries'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Stats grid */}
                            <div style={s.statsGrid}>
                                <div style={s.statCard}>
                                    <p style={s.statNum(summary.avgScore > 0 ? '#16a34a' : summary.avgScore < 0 ? '#dc2626' : '#6b7280')}>
                                        {summary.avgScore > 0 ? '+' : ''}{summary.avgScore}
                                    </p>
                                    <p style={s.statLabel}>Avg Sentiment</p>
                                </div>
                                <div style={s.statCard}>
                                    <p style={s.statNum('#6366f1')}>{summary.totalEntries}</p>
                                    <p style={s.statLabel}>Entries Analyzed</p>
                                </div>
                                <div style={s.statCard}>
                                    <p style={s.statNum(summary.crisisCount > 0 ? '#dc2626' : '#16a34a')}>
                                        {summary.crisisCount > 0 ? `⚠️ ${summary.crisisCount}` : '✅ 0'}
                                    </p>
                                    <p style={s.statLabel}>Crisis Flags</p>
                                </div>
                            </div>

                            {/* Sentiment breakdown */}
                            <div style={s.card}>
                                <p style={s.cardTitle}>Sentiment Breakdown (Last 30 days)</p>
                                <div style={s.breakdownGrid}>
                                    {Object.entries(summary.sentimentCounts).map(([key, count]) => {
                                        const col = SENTIMENT_COLORS[key];
                                        const pct = Math.round((count / summary.totalEntries) * 100);
                                        return (
                                            <div key={key} style={s.breakdownItem(col.bg, col.border)}>
                                                <p style={s.breakdownLabel(col.text)}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                                                <p style={s.breakdownCount(col.text)}>{count}</p>
                                                <p style={s.breakdownPct}>{pct}%</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Top emotions */}
                            {summary.topEmotions?.length > 0 && (
                                <div style={s.card}>
                                    <p style={s.cardTitle}>Most Frequent Emotions</p>
                                    <div style={s.emotionList}>
                                        {summary.topEmotions.map((e, i) => (
                                            <div key={i} style={s.emotionItem}>
                                                <span style={s.emotionEmoji}>
                                                    {EMOTION_EMOJIS[e.emotion] || '💭'}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={s.emotionLabelRow}>
                                                        <span style={s.emotionName}>{e.emotion}</span>
                                                        <span style={s.emotionCount}>{e.count}x</span>
                                                    </div>
                                                    <div style={s.emotionBarBg}>
                                                        <div style={s.emotionBarFill(
                                                            (e.count / summary.topEmotions[0].count) * 100
                                                        )} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Weekly Summary */}
                            {summary.aiSummary && (
                                <div style={s.aiSummaryCard}>
                                    <div style={s.aiSummaryHeader}>
                                        <span style={{ fontSize: '18px' }}>🤖</span>
                                        <strong style={s.aiSummaryTitle}>Your AI Mental Health Summary</strong>
                                    </div>
                                    <p style={s.aiSummaryText}>{summary.aiSummary}</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── TIMELINE TAB ── */}
                    {activeTab === 'timeline' && (
                        <div style={s.card}>
                            <p style={s.cardTitle}>Sentiment Score Over Time</p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 16px 0' }}>
                                +1.0 = very positive · 0 = neutral · -1.0 = very negative
                            </p>
                            {chartData.length < 2 ? (
                                <div style={s.emptyState}>
                                    <p>Need at least 2 entries to show the chart.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                        <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: 'Neutral', position: 'right', fontSize: 10, fill: '#d1d5db' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#6366f1"
                                            strokeWidth={2.5}
                                            fill="url(#sentGradient)"
                                            dot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    )}

                    {/* ── ENTRIES TAB ── */}
                    {activeTab === 'entries' && (
                        <div>
                            {history.length === 0 ? (
                                <div style={s.emptyState}><p>No analyzed entries yet.</p></div>
                            ) : (
                                history.map(record => {
                                    const col = SENTIMENT_COLORS[record.sentiment] || SENTIMENT_COLORS.neutral;
                                    return (
                                        <div key={record._id} style={s.entryCard(col.border)}>
                                            <div style={s.entryHeader}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={s.sentimentBadge(col)}>
                                                        {record.sentiment}
                                                    </span>
                                                    {record.crisisFlag && (
                                                        <span style={s.crisisBadge}>⚠️ Crisis flag</span>
                                                    )}
                                                    <span style={s.sourceBadge}>
                                                        {SOURCE_LABELS[record.source] || record.source}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={s.scoreDisplay(col.text)}>
                                                        {record.sentimentScore > 0 ? '+' : ''}{record.sentimentScore.toFixed(2)}
                                                    </p>
                                                    <p style={s.entryDate}>{formatDate(record.createdAt)}</p>
                                                </div>
                                            </div>

                                            {/* Emotions */}
                                            {record.emotions?.primary && (
                                                <div style={s.emotionTags}>
                                                    <span style={s.emotionTag}>
                                                        {EMOTION_EMOJIS[record.emotions.primary] || '💭'} {record.emotions.primary}
                                                    </span>
                                                    {record.emotions.secondary && (
                                                        <span style={s.emotionTag}>
                                                            {EMOTION_EMOJIS[record.emotions.secondary] || '💭'} {record.emotions.secondary}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Text snippet */}
                                            <p style={s.textSnippet}>"{record.text.substring(0, 120)}{record.text.length > 120 ? '…' : ''}"</p>

                                            {/* AI insight */}
                                            {record.insight && (
                                                <div style={s.insightBox}>
                                                    <p style={s.insightText}>💡 {record.insight}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const s = {
    page: { maxWidth: '680px', margin: '40px auto', padding: '0 16px 40px', fontFamily: "'Segoe UI', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { margin: '0 0 4px 0', fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' },
    subtitle: { margin: 0, fontSize: '14px', color: '#6b7280' },
    headerLinks: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
    link: { textDecoration: 'none', color: '#6366f1', fontWeight: '600', fontSize: '13px' },
    crisisLink: { textDecoration: 'none', color: '#dc2626', fontWeight: '600', fontSize: '13px' },
    tabs: { display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '24px' },
    tab: (active) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', backgroundColor: active ? 'white' : 'transparent', color: active ? '#6366f1' : '#6b7280', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }),
    emptyState: { textAlign: 'center', padding: '60px 0', color: '#9ca3af' },
    actionBtn: (color) => ({ display: 'inline-block', padding: '10px 20px', backgroundColor: color, color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }),
    crisisAlert: { backgroundColor: '#fef2f2', border: '2px solid #dc2626', borderRadius: '12px', padding: '16px', marginBottom: '20px' },
    crisisAlertTitle: { margin: '0 0 6px', fontWeight: '700', color: '#dc2626', fontSize: '15px' },
    crisisAlertText: { margin: '0 0 10px', fontSize: '14px', color: '#374151', lineHeight: '1.5' },
    crisisAlertLink: { color: '#dc2626', fontWeight: '700', fontSize: '13px' },
    trendBanner: (bg, color) => ({ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: bg, border: `1px solid ${color}30`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }),
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
    statCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', textAlign: 'center' },
    statNum: (color) => ({ fontSize: '26px', fontWeight: '800', color, margin: '0 0 4px' }),
    statLabel: { fontSize: '11px', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
    card: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    cardTitle: { margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#111827' },
    breakdownGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
    breakdownItem: (bg, border) => ({ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '14px', textAlign: 'center' }),
    breakdownLabel: (color) => ({ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color, textTransform: 'capitalize' }),
    breakdownCount: (color) => ({ margin: '0 0 2px', fontSize: '22px', fontWeight: '800', color }),
    breakdownPct: { margin: 0, fontSize: '12px', color: '#9ca3af' },
    emotionList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    emotionItem: { display: 'flex', gap: '12px', alignItems: 'center' },
    emotionEmoji: { fontSize: '22px', flexShrink: 0 },
    emotionLabelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
    emotionName: { fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
    emotionCount: { fontSize: '13px', color: '#9ca3af' },
    emotionBarBg: { height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' },
    emotionBarFill: (pct) => ({ height: '100%', width: `${pct}%`, backgroundColor: '#6366f1', borderRadius: '4px', transition: 'width 0.6s ease' }),
    aiSummaryCard: { backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
    aiSummaryHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
    aiSummaryTitle: { fontSize: '14px', color: '#4f46e5', fontWeight: '700' },
    aiSummaryText: { margin: 0, fontSize: '15px', color: '#1e1b4b', lineHeight: '1.65' },
    entryCard: (border) => ({ backgroundColor: 'white', border: `1px solid ${border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }),
    entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
    sentimentBadge: (col) => ({ backgroundColor: col.bg, color: col.text, border: `1px solid ${col.border}`, fontSize: '12px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' }),
    crisisBadge: { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px' },
    sourceBadge: { backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '12px', padding: '3px 8px', borderRadius: '20px' },
    scoreDisplay: (color) => ({ margin: '0 0 2px', fontSize: '16px', fontWeight: '800', color }),
    entryDate: { margin: 0, fontSize: '11px', color: '#9ca3af' },
    emotionTags: { display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' },
    emotionTag: { backgroundColor: '#f3f4f6', color: '#374151', fontSize: '12px', padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' },
    textSnippet: { margin: '0 0 8px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic', lineHeight: '1.5' },
    insightBox: { backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px' },
    insightText: { margin: 0, fontSize: '13px', color: '#78716c', lineHeight: '1.5' },
};