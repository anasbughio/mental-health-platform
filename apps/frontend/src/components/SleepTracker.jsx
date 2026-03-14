import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell,
} from 'recharts';
import api from '../config/axios';

const SLEEP_FACTORS = [
    { id: 'caffeine',    label: 'Caffeine',    icon: '☕' },
    { id: 'stress',      label: 'Stress',      icon: '😰' },
    { id: 'screen-time', label: 'Screen Time', icon: '📱' },
    { id: 'exercise',    label: 'Exercise',    icon: '🏃' },
    { id: 'alcohol',     label: 'Alcohol',     icon: '🍷' },
    { id: 'late-meal',   label: 'Late Meal',   icon: '🍔' },
    { id: 'anxiety',     label: 'Anxiety',     icon: '😟' },
    { id: 'noise',       label: 'Noise',       icon: '🔊' },
    { id: 'comfortable', label: 'Comfortable', icon: '🛏️' },
    { id: 'relaxed',     label: 'Relaxed',     icon: '😌' },
    { id: 'meditated',   label: 'Meditated',   icon: '🧘' },
    { id: 'no-caffeine', label: 'No Caffeine', icon: '✅' },
];

const Q_LABELS = { 1:'Terrible', 2:'Poor', 3:'Fair', 4:'Restful', 5:'Excellent' };
const Q_COLORS = { 1:'#ef4444', 2:'#f97316', 3:'#eab308', 4:'#f59e0b', 5:'#22c55e' };
const TIPS = [
    { icon: '💡', text: 'Keep bedroom temp at 68°F' },
    { icon: '🌙', text: 'Screen-free 30m before bed' },
    { icon: '☕', text: 'No caffeine after 2 PM' },
    { icon: '🧘', text: 'Try a 5-min breathing exercise before sleep' },
];
const QUOTES = [
    '"A good laugh and a long sleep are the two best cures for anything."',
    '"Sleep is the best meditation." — Dalai Lama',
    '"Each night, a small life." — Schopenhauer',
];

const today = new Date().toISOString().split('T')[0];
const stars  = (q) => '★'.repeat(q) + '☆'.repeat(5 - q);

const ChartTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827' }}>{d.date}</p>
            {d.duration && <p style={{ margin: '0 0 2px', color: '#6366f1' }}>🌙 {d.duration}h</p>}
            {d.quality  && <p style={{ margin: '0 0 2px', color: Q_COLORS[Math.round(d.quality)] }}>★ {d.quality}/5</p>}
            {d.mood     && <p style={{ margin: 0, color: '#f59e0b' }}>😊 Mood {d.mood}/10</p>}
        </div>
    );
};

const MiniBar = ({ data }) => (
    <ResponsiveContainer width="100%" height={80}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -36, bottom: 0 }} barSize={16}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 12]} hide />
            <Bar dataKey="duration" radius={[5, 5, 0, 0]}>
                {data.map((d, i) => (
                    <Cell key={i} fill={!d.duration ? '#f3f4f6' : d.quality >= 4 ? '#6366f1' : d.quality >= 3 ? '#818cf8' : '#c4b5fd'} />
                ))}
            </Bar>
        </ComposedChart>
    </ResponsiveContainer>
);

export default function SleepTracker() {
    const [view, setView]             = useState('log');
    const [logs, setLogs]             = useState([]);
    const [stats, setStats]           = useState(null);
    const [isLoading, setIsLoading]   = useState(true);
    const [isSaving, setIsSaving]     = useState(false);
    const [savedEntry, setSavedEntry] = useState(null);
    const [error, setError]           = useState('');
    const [ready, setReady]           = useState(false);

    const [form, setForm] = useState({
        date: today, bedtime: '23:00', wakeTime: '07:00',
        quality: 3, factors: [], notes: '',
    });

    const navigate = useNavigate();
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const tip1  = TIPS[0], tip2 = TIPS[1];

    useEffect(() => { fetchAll(); setTimeout(() => setReady(true), 60); }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [lr, sr] = await Promise.all([api.get('/sleep'), api.get('/sleep/stats')]);
            setLogs(lr.data.data);
            setStats(sr.data.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to load sleep data.');
        } finally { setIsLoading(false); }
    };

    const toggleFactor = (id) =>
        setForm(f => ({ ...f, factors: f.factors.includes(id) ? f.factors.filter(x => x !== id) : [...f.factors, id] }));

    const calcDuration = () => {
        const [bH, bM] = form.bedtime.split(':').map(Number);
        const [wH, wM] = form.wakeTime.split(':').map(Number);
        let mins = (wH * 60 + wM) - (bH * 60 + bM);
        if (mins < 0) mins += 1440;
        return (mins / 60).toFixed(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true); setError('');
        try {
            const res = await api.post('/sleep', form);
            setSavedEntry(res.data.data); fetchAll();
        } catch (err) {
            setError(err.response?.status === 409 ? 'Already logged for this date.' : 'Failed to save sleep log.');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this sleep log?')) return;
        try { await api.delete(`/sleep/${id}`); setLogs(prev => prev.filter(l => l._id !== id)); }
        catch { setError('Failed to delete.'); }
    };

    const dur      = calcDuration();
    const durNum   = Number(dur);
    const durColor = durNum >= 8 ? '#10b981' : durNum >= 7 ? '#84cc16' : durNum >= 6 ? '#f59e0b' : '#ef4444';
    const durLabel = durNum >= 8 ? 'Optimal duration reached' : durNum >= 7 ? 'Good amount' : durNum >= 6 ? 'A bit short' : 'Sleep debt risk';
    const durBadge = durNum >= 8 ? 'Great amount!' : durNum >= 7 ? 'Good' : 'Short';

    const chartData = [...logs].reverse().slice(-14).map(l => ({
        date: l.date?.slice(5) || '', duration: l.durationHours, quality: l.quality, mood: l.correlatedMoodScore,
    }));
    const last7 = [...logs].reverse().slice(-7).map(l => ({
        date: new Date(l.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' }),
        duration: l.durationHours, quality: l.quality,
    }));
    const scatterData = logs.filter(l => l.correlatedMoodScore && l.quality)
        .map(l => ({ x: l.quality, y: l.correlatedMoodScore, z: l.durationHours || 7 }));

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
            .st{width:100%;min-height:100vh;background:#f5f4f0;font-family:'DM Sans',sans-serif;padding:32px 44px 100px;box-sizing:border-box;}
            .st-h1{font-family:'Bricolage Grotesque',sans-serif;font-size:28px;font-weight:800;color:#111827;margin:0 0 20px;letter-spacing:-0.6px;}
            .st-tabs{display:inline-flex;background:white;border-radius:30px;padding:4px;gap:2px;border:1px solid #f3f4f6;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:24px;}
            .st-tab{padding:8px 22px;border-radius:24px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
            .st-tab.on{background:#6366f1;color:white;box-shadow:0 2px 8px rgba(99,102,241,0.35);}
            .st-tab.off{background:transparent;color:#6b7280;}
            .st-layout{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;}
            .st-card{background:white;border-radius:22px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.05);}
            .st-card-h{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:800;color:#111827;margin:0 0 22px;letter-spacing:-0.3px;}
            .st-lbl{font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;display:block;margin-bottom:8px;}
            .st-irow{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px;margin-bottom:16px;}
            .st-ibox{background:#f9fafb;border:1.5px solid #f3f4f6;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;transition:border-color 0.2s;}
            .st-ibox:focus-within{border-color:#6366f1;background:white;}
            .st-inp{background:transparent;border:none;outline:none;font-size:14px;font-family:'DM Sans',sans-serif;color:#111827;width:100%;}
            .st-dur{display:flex;align-items:center;gap:14px;background:#f0f4ff;border:1.5px solid #c7d2fe;border-radius:14px;padding:14px 18px;margin-bottom:20px;}
            .st-dur-circ{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
            .st-dur-n{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:900;margin:0 0 2px;line-height:1;}
            .st-dur-s{font-size:12px;color:#6b7280;margin:0;}
            .st-dur-badge{margin-left:auto;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;flex-shrink:0;}
            .st-stars{display:flex;align-items:center;gap:6px;background:#f9fafb;border:1.5px solid #f3f4f6;border-radius:12px;padding:12px 16px;margin-bottom:20px;}
            .st-star{font-size:26px;background:none;border:none;cursor:pointer;transition:all 0.15s;line-height:1;padding:0;}
            .st-star:hover{transform:scale(1.2);}
            .st-qlbl{margin-left:auto;font-size:14px;font-weight:700;}
            .st-factors{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;}
            .st-factor{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 12px;border-radius:14px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;font-size:11px;font-weight:600;color:#6b7280;font-family:'DM Sans',sans-serif;transition:all 0.15s;min-width:64px;}
            .st-factor-i{font-size:20px;}
            .st-factor:hover{border-color:#a5b4fc;color:#6366f1;background:#f5f3ff;}
            .st-factor.on{border-color:#6366f1;background:#ede9fe;color:#6366f1;}
            .st-ta{width:100%;padding:12px 14px;border:1.5px solid #f3f4f6;border-radius:12px;box-sizing:border-box;font-size:14px;font-family:'DM Sans',sans-serif;resize:none;outline:none;background:#f9fafb;color:#111827;line-height:1.6;transition:all 0.2s;margin-bottom:20px;}
            .st-ta:focus{border-color:#6366f1;background:white;}
            .st-ta::placeholder{color:#c4b5fd;font-style:italic;}
            .st-save{width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:white;border:none;border-radius:14px;font-size:15px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 14px rgba(99,102,241,0.32);display:flex;align-items:center;justify-content:center;gap:8px;}
            .st-save:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,0.42);}
            .st-save:disabled{background:#e5e7eb;color:#9ca3af;box-shadow:none;transform:none;cursor:not-allowed;}
            .st-side{display:flex;flex-direction:column;gap:14px;}
            .st-sc{background:white;border-radius:18px;padding:20px 22px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.05);}
            .st-sc-t{font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 12px;display:flex;align-items:center;gap:7px;}
            .st-ai-i{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
            .st-ai-txt{font-size:13px;color:#4b5563;line-height:1.7;margin:0 0 14px;font-style:italic;}
            .st-tip{display:flex;align-items:center;gap:10px;background:#f9fafb;border-radius:10px;padding:9px 12px;margin-bottom:8px;border:1px solid #f3f4f6;}
            .st-tip:last-child{margin-bottom:0;}
            .st-tip-p{font-size:12px;color:#374151;font-weight:500;margin:0;}
            .st-mini-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
            .st-quote{background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;padding:18px;text-align:center;border:1px solid #ddd6fe;}
            .st-quote p{font-size:13px;color:#4338ca;line-height:1.65;margin:0;font-style:italic;}
            .st-bottom{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px;}
            .st-stat{background:white;border-radius:16px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.05);text-align:center;}
            .st-stat-l{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;}
            .st-stat-n{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:900;margin:0;line-height:1;}
            .st-saved{background:white;border-radius:22px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.05);animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);}
            @keyframes popIn{from{opacity:0;transform:scale(0.96) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}
            .st-saved-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
            .st-saved-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
            .st-ss{background:#f9fafb;border-radius:12px;padding:14px;text-align:center;border:1px solid #f3f4f6;}
            .st-ss-n{display:block;font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;color:#111827;margin-bottom:3px;}
            .st-ss-l{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em;}
            .st-aibox{background:linear-gradient(135deg,#fefce8,#fef3c7);border:1px solid #fde68a;border-radius:14px;padding:16px;margin-bottom:18px;}
            .st-aibox-t{font-size:12px;font-weight:700;color:#a16207;margin:0 0 6px;}
            .st-aibox-p{font-size:14px;color:#78350f;line-height:1.65;margin:0;}
            .st-newbtn{width:100%;padding:12px;background:#f0f4ff;color:#6366f1;border:1px solid #c7d2fe;border-radius:12px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.15s;}
            .st-newbtn:hover{background:#e0e7ff;}
            .st-chart{background:white;border-radius:20px;padding:22px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.05);margin-bottom:16px;}
            .st-chart-t{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;color:#111827;margin:0 0 6px;}
            .st-chart-s{font-size:12px;color:#9ca3af;margin:0 0 14px;}
            .st-hi{background:white;border-radius:16px;padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.05);margin-bottom:12px;transition:box-shadow 0.2s;}
            .st-hi:hover{box-shadow:0 4px 14px rgba(0,0,0,0.09);}
            .st-hi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
            .st-hi-date{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;color:#111827;margin:0;}
            .st-hi-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;}
            .st-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;}
            .st-del{background:none;border:1px solid #fee2e2;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:13px;color:#9ca3af;transition:all 0.15s;}
            .st-del:hover{background:#fef2f2;color:#dc2626;border-color:#fca5a5;}
            .st-ftags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;}
            .st-ftag{font-size:11px;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:20px;text-transform:capitalize;}
            .st-err{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:12px 16px;border-radius:12px;font-size:14px;margin-bottom:16px;}
            .st-empty{text-align:center;padding:80px 0;color:#9ca3af;}
            @media(max-width:960px){.st-layout{grid-template-columns:1fr;}.st-bottom{grid-template-columns:1fr 1fr;}.st{padding:24px 20px 100px;}}
            @media(max-width:600px){.st{padding:18px 14px 100px;}.st-irow{grid-template-columns:1fr;}.st-bottom{grid-template-columns:1fr 1fr;}.st-h1{font-size:22px;}}
        `}</style>

        <div className="st">
            <h1 className="st-h1" style={fi(0.04)}>Sleep Tracker</h1>

            {error && <div className="st-err">{error}</div>}

            <div style={fi(0.08)}>
                <div className="st-tabs">
                    {[{k:'log',l:'Log Sleep'},{k:'trends',l:'Trends'},{k:'history',l:'History'}].map(t => (
                        <button key={t.k} className={`st-tab ${view===t.k?'on':'off'}`} onClick={()=>setView(t.k)}>{t.l}</button>
                    ))}
                </div>
            </div>

            {/* ════ LOG ════ */}
            {view==='log' && (
                <div style={fi(0.12)}>
                    <div className="st-layout">
                        <div>
                            {savedEntry ? (
                                <div className="st-saved">
                                    <div className="st-saved-head">
                                        <span style={{background:'#dcfce7',color:'#16a34a',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700}}>✅ Sleep Logged</span>
                                        <span style={{fontSize:12,color:'#9ca3af'}}>{savedEntry.date}</span>
                                    </div>
                                    <div className="st-saved-grid">
                                        <div className="st-ss"><span className="st-ss-n">{savedEntry.durationHours??'—'}h</span><span className="st-ss-l">Duration</span></div>
                                        <div className="st-ss"><span className="st-ss-n" style={{color:Q_COLORS[savedEntry.quality]}}>{stars(savedEntry.quality)}</span><span className="st-ss-l">{Q_LABELS[savedEntry.quality]}</span></div>
                                        <div className="st-ss"><span className="st-ss-n">{savedEntry.correlatedMoodScore?`${savedEntry.correlatedMoodScore}/10`:'—'}</span><span className="st-ss-l">Mood Today</span></div>
                                    </div>
                                    {savedEntry.aiInsight&&<div className="st-aibox"><p className="st-aibox-t">✨ AI Sleep Insight</p><p className="st-aibox-p">{savedEntry.aiInsight}</p></div>}
                                    <button className="st-newbtn" onClick={()=>{setSavedEntry(null);setForm({date:today,bedtime:'23:00',wakeTime:'07:00',quality:3,factors:[],notes:''});}}>+ Log Another Night</button>
                                </div>
                            ) : (
                                <div className="st-card">
                                    <h2 className="st-card-h">How did you sleep last night?</h2>
                                    <span className="st-lbl">Date &amp; Times</span>
                                    <div className="st-irow">
                                        <div className="st-ibox"><span style={{fontSize:15}}>📅</span><input type="date" value={form.date} max={today} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="st-inp"/></div>
                                        <div className="st-ibox"><span style={{fontSize:15}}>🌙</span><input type="time" value={form.bedtime} onChange={e=>setForm(f=>({...f,bedtime:e.target.value}))} className="st-inp"/></div>
                                        <div className="st-ibox"><span style={{fontSize:15}}>☀️</span><input type="time" value={form.wakeTime} onChange={e=>setForm(f=>({...f,wakeTime:e.target.value}))} className="st-inp"/></div>
                                    </div>

                                    <div className="st-dur">
                                        <div className="st-dur-circ" style={{background:`${durColor}20`}}><span style={{fontSize:20}}>⏱</span></div>
                                        <div>
                                            <p className="st-dur-n" style={{color:durColor}}>{dur}h 00m</p>
                                            <p className="st-dur-s">{durLabel}</p>
                                        </div>
                                        <span className="st-dur-badge" style={{background:`${durColor}18`,color:durColor}}>{durBadge}</span>
                                    </div>

                                    <span className="st-lbl">Sleep Quality</span>
                                    <div className="st-stars">
                                        {[1,2,3,4,5].map(n=>(
                                            <button key={n} type="button" className="st-star" style={{color:n<=form.quality?Q_COLORS[form.quality]:'#e5e7eb'}} onClick={()=>setForm(f=>({...f,quality:n}))}>★</button>
                                        ))}
                                        <span className="st-qlbl" style={{color:Q_COLORS[form.quality]}}>{Q_LABELS[form.quality]}</span>
                                    </div>

                                    <span className="st-lbl">Influencing Factors</span>
                                    <div className="st-factors">
                                        {SLEEP_FACTORS.map(f=>(
                                            <button key={f.id} type="button" className={`st-factor ${form.factors.includes(f.id)?'on':''}`} onClick={()=>toggleFactor(f.id)}>
                                                <span className="st-factor-i">{f.icon}</span>{f.label}
                                            </button>
                                        ))}
                                    </div>

                                    <span className="st-lbl">Notes (Optional)</span>
                                    <textarea className="st-ta" rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="How are you feeling this morning?"/>

                                    <button className="st-save" disabled={isSaving} onClick={handleSubmit}>
                                        {isSaving?'✨ Saving & Analyzing…':<><span>✨</span>Save &amp; AI Analyze</>}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="st-side">
                            <div className="st-sc">
                                <p className="st-sc-t"><div className="st-ai-i">✨</div>AI Sleep Insight</p>
                                <p className="st-ai-txt">{logs[0]?.aiInsight?`"${logs[0].aiInsight.substring(0,150)}${logs[0].aiInsight.length>150?'…':''}"`:'"Log your sleep to receive personalised AI analysis and improvement tips."'}</p>
                                {[tip1,tip2].map((tip,i)=>(
                                    <div key={i} className="st-tip"><span style={{fontSize:16}}>{tip.icon}</span><p className="st-tip-p">{tip.text}</p></div>
                                ))}
                            </div>

                            <div className="st-sc">
                                <div className="st-mini-head">
                                    <p className="st-sc-t" style={{margin:0}}>Last 7 Days</p>
                                    <button style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#6366f1',fontWeight:700,fontFamily:'inherit'}} onClick={()=>setView('trends')}>View Trends →</button>
                                </div>
                                {last7.length>0?<MiniBar data={last7}/>:<p style={{fontSize:12,color:'#9ca3af',margin:0,textAlign:'center',padding:'20px 0'}}>Log sleep to see chart</p>}
                            </div>

                            <div className="st-quote"><p>{quote}</p></div>
                        </div>
                    </div>

                    {stats?.hasData && (
                        <div className="st-bottom">
                            {[
                                {l:'Avg Duration',  v:`${stats.avgDuration}h`,                          c:'#6366f1'},
                                {l:'Quality Score', v:stats.avgQuality?`${Math.round(stats.avgQuality*20)}%`:'—', c:'#10b981'},
                                {l:'Short Nights',  v:stats.shortNights??'—',                          c:stats.shortNights>3?'#ef4444':'#f59e0b'},
                                {l:'Streak',        v:stats.totalLogs?`${stats.totalLogs}d`:'—',       c:'#8b5cf6'},
                            ].map(({l,v,c})=>(
                                <div key={l} className="st-stat"><p className="st-stat-l">{l}</p><p className="st-stat-n" style={{color:c}}>{v}</p></div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════ TRENDS ════ */}
            {view==='trends' && (
                <div style={fi(0.1)}>
                    {isLoading?<div className="st-empty">⏳ Loading…</div>:!stats?.hasData?(
                        <div className="st-empty"><p style={{fontSize:40,margin:'0 0 12px'}}>🌙</p><p>No data yet. Log your first night!</p></div>
                    ):(
                        <>
                            <div className="st-bottom" style={{marginBottom:20,marginTop:0}}>
                                {[
                                    {l:'Avg Duration',  v:`${stats.avgDuration}h`,                          c:'#6366f1'},
                                    {l:'Avg Quality',   v:`${stats.avgQuality}★`,                           c:Q_COLORS[Math.round(stats.avgQuality)]},
                                    {l:'Short Nights',  v:stats.shortNights,                                c:stats.shortNights>3?'#ef4444':'#16a34a'},
                                    {l:'Nights Logged', v:stats.totalLogs,                                  c:'#111827'},
                                ].map(({l,v,c})=>(
                                    <div key={l} className="st-stat"><p className="st-stat-l">{l}</p><p className="st-stat-n" style={{color:c}}>{v}</p></div>
                                ))}
                            </div>
                            {chartData.length>=2&&(
                                <>
                                    <div className="st-chart">
                                        <p className="st-chart-t">Sleep Duration &amp; Mood (Last 14 nights)</p>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <ComposedChart data={chartData} margin={{top:10,right:10,left:-28,bottom:0}}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0"/>
                                                <XAxis dataKey="date" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                                <YAxis yAxisId="l" domain={[0,12]} tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                                <YAxis yAxisId="r" orientation="right" domain={[0,10]} tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                                <Tooltip content={<ChartTip/>}/>
                                                <Bar yAxisId="l" dataKey="duration" radius={[5,5,0,0]} maxBarSize={20}>{chartData.map((d,i)=><Cell key={i} fill={d.quality>=4?'#6366f1':d.quality>=3?'#818cf8':'#c4b5fd'}/>)}</Bar>
                                                <Line yAxisId="r" type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2.5} dot={{r:4,fill:'#f59e0b',stroke:'white',strokeWidth:2}} connectNulls/>
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="st-chart">
                                        <p className="st-chart-t">Sleep Quality Trend</p>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <ComposedChart data={chartData} margin={{top:5,right:5,left:-28,bottom:0}} barSize={16}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0"/>
                                                <XAxis dataKey="date" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                                <YAxis domain={[0,5]} ticks={[1,2,3,4,5]} tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                                <Tooltip content={<ChartTip/>}/>
                                                <Bar dataKey="quality" radius={[5,5,0,0]}>{chartData.map((d,i)=><Cell key={i} fill={Q_COLORS[d.quality]||'#6366f1'}/>)}</Bar>
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                            {scatterData.length>=3&&(
                                <div className="st-chart">
                                    <p className="st-chart-t">Sleep Quality vs Mood</p>
                                    <p className="st-chart-s">Each dot = one night. Bigger dot = more hours slept.</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <ScatterChart margin={{top:10,right:10,left:-20,bottom:0}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0"/>
                                            <XAxis dataKey="x" domain={[0,5]} ticks={[1,2,3,4,5]} tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                            <YAxis dataKey="y" domain={[0,10]} tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                                            <ZAxis dataKey="z" range={[40,200]}/>
                                            <Tooltip cursor={{strokeDasharray:'3 3'}} content={({active,payload})=>{
                                                if(!active||!payload?.length)return null;const d=payload[0].payload;
                                                return <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:'8px 12px',fontSize:12}}><p style={{margin:'0 0 2px'}}>Sleep: {d.x}★</p><p style={{margin:'0 0 2px'}}>Mood: {d.y}/10</p>{d.z&&<p style={{margin:0}}>Duration: {d.z}h</p>}</div>;
                                            }}/>
                                            <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.65}/>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ════ HISTORY ════ */}
            {view==='history' && (
                <div style={fi(0.1)}>
                    {logs.length===0?(
                        <div className="st-empty"><p style={{fontSize:40,margin:'0 0 12px'}}>🌙</p><p>No sleep logs yet.</p></div>
                    ):logs.map(log=>(
                        <div key={log._id} className="st-hi">
                            <div className="st-hi-top">
                                <p className="st-hi-date">{new Date(log.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</p>
                                <button className="st-del" onClick={()=>handleDelete(log._id)}>🗑</button>
                            </div>
                            <div className="st-hi-badges">
                                <span className="st-badge" style={{background:`${Q_COLORS[log.quality]}15`,color:Q_COLORS[log.quality]}}>{stars(log.quality)} {Q_LABELS[log.quality]}</span>
                                {log.durationHours&&<span className="st-badge" style={{background:'#ede9fe',color:'#7c3aed'}}>{log.durationHours}h</span>}
                                {log.correlatedMoodScore&&<span className="st-badge" style={{background:'#fefce8',color:'#a16207'}}>😊 {log.correlatedMoodScore}/10</span>}
                            </div>
                            {log.factors?.length>0&&<div className="st-ftags">{log.factors.map(f=><span key={f} className="st-ftag">{f.replace('-',' ')}</span>)}</div>}
                            {log.aiInsight&&<div style={{background:'#fefce8',borderLeft:'3px solid #f59e0b',padding:'10px 14px',borderRadius:'0 10px 10px 0',marginTop:8}}><p style={{margin:0,fontSize:13,color:'#78350f',lineHeight:1.6}}>✨ {log.aiInsight}</p></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
        </>
    );
}