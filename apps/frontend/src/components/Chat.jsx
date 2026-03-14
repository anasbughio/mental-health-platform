import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';

const INITIAL_MSG = {
    text: "Hi there. I'm your AI companion. How are you feeling right now?",
    isUser: false, id: 0, time: new Date(),
};

const FOCUS_TOOLS = [
    { icon: '⏱️', label: '3-min Focus Anchor',  to: '/exercises' },
    { icon: '🔄', label: 'Stress Reframing',      to: '/exercises' },
    { icon: '🧘', label: 'Box Breathing Guide',   to: '/exercises' },
];

export default function Chat() {
    const [messages, setMessages]     = useState([INITIAL_MSG]);
    const [input, setInput]           = useState('');
    const [isLoading, setIsLoading]   = useState(false);
    const [crisisData, setCrisisData] = useState(null);
    const [moodLogs, setMoodLogs]     = useState([]);
    const [userName, setUserName]     = useState('');
    const [insight, setInsight]       = useState({ state: '', theme: '' });
    const [ready, setReady]           = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);
    const navigate       = useNavigate();

    useEffect(() => {
        loadHistory();
        api.get('/auth/me').then(r => setUserName((r.data.data?.name || '').split(' ')[0])).catch(() => {});
        api.get('/moods').then(r => setMoodLogs(r.data.data?.slice(0, 7).reverse() || [])).catch(() => {});
        setTimeout(() => setReady(true), 80);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async () => {
        try {
            const res = await api.get('/chat/history');
            const db  = res.data.data || [];
            if (db.length > 0) {
                setMessages([INITIAL_MSG, ...db.map((m, i) => ({
                    text: m.text || m.content,
                    isUser: m.role === 'user',
                    id: i + 1,
                    time: new Date(m.createdAt || Date.now()),
                }))]);
            }
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const checkDistress = async (text) => {
        try {
            const res = await api.post('/crisis/detect', { text });
            const d = res.data.data;
            if (d.isDistressed && d.severity !== 'none') setCrisisData({ severity: d.severity });
        } catch {}
    };

    const extractInsight = (text) => {
        const emotions = ['anxious','calm','stressed','happy','sad','overwhelmed','grateful','tired','productive','lonely','hopeful','frustrated'];
        const themes   = ['productivity','self-worth','relationships','sleep','work','mindfulness','breathing','focus','grief','anxiety','motivation','boundaries'];
        const lower = text.toLowerCase();
        const state = emotions.find(e => lower.includes(e));
        const theme = themes.find(t => lower.includes(t));
        setInsight(prev => ({
            state: state ? state.charAt(0).toUpperCase() + state.slice(1) : prev.state,
            theme: theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : prev.theme,
        }));
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        const text = input.trim();
        setInput('');
        setMessages(prev => [...prev, { text, isUser: true, id: Date.now(), time: new Date() }]);
        setIsLoading(true);
        checkDistress(text);
        try {
            const res = await api.post('/chat', { message: text });
            const reply = res.data.reply || res.data.data?.message || "I'm here for you.";
            setMessages(prev => [...prev, { text: reply, isUser: false, id: Date.now() + 1, time: new Date() }]);
            extractInsight(reply);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            else setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isUser: false, id: Date.now(), time: new Date() }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    const BAR_COLORS = ['#6366f1','#7c3aed','#8b5cf6','#a78bfa','#22c55e','#10b981','#06b6d4'];
    const PLACEHOLDER_BARS = [40, 65, 50, 80, 55, 75, 90];

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .ch { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; }

            /* ── Crisis Banner ── */
            .ch-crisis { background:#fef2f2; border-bottom:1px solid #fecaca; padding:13px 32px; display:flex; align-items:center; gap:14px; animation:slideDown 0.35s ease; flex-shrink:0; }
            @keyframes slideDown { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
            .ch-crisis-ico { width:36px; height:36px; background:#fee2e2; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
            .ch-crisis-txt strong { font-size:14px; color:#dc2626; font-weight:700; display:block; }
            .ch-crisis-txt span { font-size:13px; color:#f87171; }
            .ch-crisis-btn { margin-left:auto; padding:8px 20px; background:#dc2626; color:white; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; flex-shrink:0; }
            .ch-crisis-btn:hover { background:#b91c1c; }
            .ch-crisis-x { background:none; border:none; color:#fca5a5; cursor:pointer; font-size:18px; padding:0 4px; margin-left:8px; flex-shrink:0; }

            /* ── Layout ── */
            .ch-body { flex:1; display:grid; grid-template-columns:1fr 290px; gap:18px; padding:22px 28px 24px 32px; box-sizing:border-box; min-height:0; }

            /* ── Chat Panel ── */
            .ch-panel { background:white; border-radius:22px; display:flex; flex-direction:column; box-shadow:0 2px 8px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); overflow:hidden; height:calc(100vh - 130px); }

            /* header */
            .ch-head { padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; flex-shrink:0; }
            .ch-av { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; position:relative; box-shadow:0 2px 8px rgba(99,102,241,0.35); }
            .ch-online { position:absolute; bottom:1px; right:1px; width:11px; height:11px; background:#22c55e; border-radius:50%; border:2px solid white; }
            .ch-head-name { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 1px; }
            .ch-head-status { font-size:11px; color:#22c55e; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin:0; }
            .ch-head-r { display:flex; gap:8px; margin-left:auto; }
            .ch-icon-btn { width:34px; height:34px; border-radius:10px; background:#f9fafb; border:1px solid #f3f4f6; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; transition:all 0.15s; text-decoration:none; }
            .ch-icon-btn:hover { background:#f0f0ff; }

            /* messages */
            .ch-msgs { flex:1; overflow-y:auto; padding:20px 20px 8px; display:flex; flex-direction:column; gap:14px; }
            .ch-msgs::-webkit-scrollbar { width:4px; }
            .ch-msgs::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }

            .ch-row { display:flex; align-items:flex-end; gap:9px; animation:msgPop 0.38s cubic-bezier(0.34,1.56,0.64,1); }
            .ch-row.usr { flex-direction:row-reverse; }
            @keyframes msgPop { from { opacity:0; transform:translateY(14px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }

            .ch-msg-av { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; box-shadow:0 2px 6px rgba(99,102,241,0.2); }

            .ch-bubble { max-width:76%; padding:12px 16px; font-size:14px; line-height:1.65; }
            .ch-bubble.ai  { background:#f1f5f9; color:#1e293b; border-radius:18px 18px 18px 4px; border-left:3px solid #6366f1; }
            .ch-bubble.usr { background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border-radius:18px 18px 4px 18px; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
            .ch-t { font-size:10px; color:#c4c9d4; margin:3px 0 0; }
            .ch-t.ai { text-align:left; }
            .ch-t.usr-t { text-align:right; }

            /* typing */
            .ch-typing { display:flex; align-items:flex-end; gap:9px; animation:msgPop 0.3s ease; }
            .ch-typing-bub { background:#f1f5f9; border-radius:18px 18px 18px 4px; border-left:3px solid #6366f1; padding:13px 16px; display:flex; gap:5px; align-items:center; }
            .dot { width:7px; height:7px; background:#6366f1; border-radius:50%; animation:boing 1.4s infinite; opacity:0.65; }
            .dot:nth-child(2) { animation-delay:0.22s; }
            .dot:nth-child(3) { animation-delay:0.44s; }
            @keyframes boing { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-8px); } }
            .ch-typing-lbl { font-size:11px; color:#9ca3af; font-style:italic; margin:3px 0 0; }

            /* input */
            .ch-bar { padding:13px 16px; border-top:1px solid #f3f4f6; display:flex; align-items:center; gap:8px; flex-shrink:0; background:white; }
            .ch-bar-emoji { background:none; border:none; font-size:20px; cursor:pointer; opacity:0.55; transition:opacity 0.15s,transform 0.15s; flex-shrink:0; }
            .ch-bar-emoji:hover { opacity:1; transform:scale(1.15); }
            .ch-bar-input { flex:1; padding:10px 16px; border:1.5px solid #e5e7eb; border-radius:24px; font-size:14px; outline:none; font-family:'DM Sans',sans-serif; background:#fafafa; transition:border-color 0.2s,background 0.2s; color:#111827; }
            .ch-bar-input:focus { border-color:#6366f1; background:white; }
            .ch-bar-input::placeholder { color:#9ca3af; }
            .ch-bar-attach { background:none; border:none; font-size:17px; cursor:pointer; opacity:0.45; padding:0 2px; transition:opacity 0.15s; flex-shrink:0; }
            .ch-bar-attach:hover { opacity:0.9; }
            .ch-send { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#7c3aed); border:none; color:white; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; box-shadow:0 3px 10px rgba(99,102,241,0.32); }
            .ch-send:hover:not(:disabled) { transform:scale(1.1) translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.44); }
            .ch-send:disabled { background:#e5e7eb; box-shadow:none; cursor:not-allowed; }

            /* ── Sidebar ── */
            .ch-side { display:flex; flex-direction:column; gap:14px; height:calc(100vh - 130px); overflow-y:auto; }
            .ch-side::-webkit-scrollbar { width:0; }
            .ch-sc { background:white; border-radius:18px; padding:18px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); }
            .ch-sc-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#111827; margin:0 0 14px; display:flex; align-items:center; justify-content:space-between; }
            .ch-rt { font-size:10px; font-weight:700; background:#dcfce7; color:#16a34a; padding:3px 8px; border-radius:20px; letter-spacing:0.06em; animation:glow 2s infinite; }
            @keyframes glow { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

            .ch-ins { padding-left:10px; border-left:3px solid #6366f1; margin-bottom:12px; }
            .ch-ins:last-child { margin-bottom:0; }
            .ch-ins-lbl { font-size:11px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin:0 0 2px; }
            .ch-ins-val { font-size:13px; color:#374151; font-weight:500; margin:0; }

            .ch-tool { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:11px; background:#f9fafb; border:1px solid #f3f4f6; cursor:pointer; text-decoration:none; transition:all 0.18s; margin-bottom:7px; }
            .ch-tool:last-child { margin-bottom:0; }
            .ch-tool:hover { background:#eef2ff; border-color:#c7d2fe; transform:translateX(3px); }
            .ch-tool-ic { width:28px; height:28px; background:white; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 1px 3px rgba(0,0,0,0.08); flex-shrink:0; }
            .ch-tool-lbl { font-size:12px; color:#374151; font-weight:500; }

            .ch-snap { display:flex; align-items:flex-end; gap:4px; height:56px; margin-top:6px; }
            .ch-bar-seg { flex:1; border-radius:4px 4px 0 0; min-height:4px; transition:height 0.7s cubic-bezier(0.34,1.56,0.64,1); }

            .ch-qlink { display:flex; align-items:center; padding:8px 0; font-size:13px; color:#374151; text-decoration:none; border-bottom:1px solid #f9fafb; font-weight:500; transition:color 0.15s,padding 0.15s; }
            .ch-qlink:hover { color:#6366f1; padding-left:4px; }
            .ch-qlink:last-child { border-bottom:none; }

            @media(max-width:960px) {
                .ch-body { grid-template-columns:1fr; padding:14px; }
                .ch-panel { height:70vh; }
                .ch-side { height:auto; }
            }
            @media(max-width:600px) {
                .ch-body { padding:10px; }
                .ch-crisis { padding:12px 14px; }
            }
        `}</style>

        <div className="ch">
            {/* Crisis Banner */}
            {crisisData && (
                <div className="ch-crisis">
                    <div className="ch-crisis-ico">🔴</div>
                    <div className="ch-crisis-txt">
                        <strong>Need urgent help?</strong>
                        <span>If you are in crisis, please reach out to a professional immediately.</span>
                    </div>
                    <Link to="/crisis" className="ch-crisis-btn">Get Help</Link>
                    <button className="ch-crisis-x" onClick={() => setCrisisData(null)}>✕</button>
                </div>
            )}

            <div className="ch-body">
                {/* ── Chat Panel ── */}
                <div className="ch-panel" style={fi(0.07)}>

                    {/* Header */}
                    <div className="ch-head">
                        <div className="ch-av">
                            🧠
                            <div className="ch-online" />
                        </div>
                        <div>
                            <p className="ch-head-name">AI Companion</p>
                            <p className="ch-head-status">● Active Sanctuary</p>
                        </div>
                        <div className="ch-head-r">
                            <Link to="/crisis" className="ch-icon-btn" title="Crisis Help">🆘</Link>
                            <Link to="/dashboard" className="ch-icon-btn" title="Dashboard">🏠</Link>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="ch-msgs">
                        {messages.map(msg => (
                            <div key={msg.id} className={`ch-row ${msg.isUser ? 'usr' : ''}`}>
                                {!msg.isUser && <div className="ch-msg-av">🧠</div>}
                                <div>
                                    <div className={`ch-bubble ${msg.isUser ? 'usr' : 'ai'}`}>
                                        {msg.text}
                                    </div>
                                    <p className={`ch-t ${msg.isUser ? 'usr-t' : 'ai'}`}>
                                        {msg.time ? new Date(msg.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ch-typing">
                                <div className="ch-msg-av">🧠</div>
                                <div>
                                    <div className="ch-typing-bub">
                                        <div className="dot" />
                                        <div className="dot" />
                                        <div className="dot" />
                                    </div>
                                    <p className="ch-typing-lbl">Companion is reflecting…</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input bar */}
                    <div className="ch-bar">
                        <button className="ch-bar-emoji" type="button">😊</button>
                        <input ref={inputRef} className="ch-bar-input"
                            type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                            placeholder="Share your thoughts…"
                            disabled={isLoading} />
                        <button className="ch-bar-attach" type="button">📎</button>
                        <button className="ch-send" disabled={!input.trim() || isLoading} onClick={handleSend}>
                            ➤
                        </button>
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <div className="ch-side" style={fi(0.18)}>

                    {/* Session Insights */}
                    <div className="ch-sc">
                        <p className="ch-sc-title">
                            Session Insights
                            <span className="ch-rt">REAL-TIME</span>
                        </p>
                        <div className="ch-ins">
                            <p className="ch-ins-lbl">Emotional State</p>
                            <p className="ch-ins-val">{insight.state || 'Listening…'}</p>
                        </div>
                        <div className="ch-ins">
                            <p className="ch-ins-lbl">Key Theme</p>
                            <p className="ch-ins-val">{insight.theme || 'Processing…'}</p>
                        </div>
                    </div>

                    {/* Focus Tools */}
                    <div className="ch-sc">
                        <p className="ch-sc-title">Focus Tools</p>
                        {FOCUS_TOOLS.map(t => (
                            <Link key={t.label} to={t.to} className="ch-tool">
                                <div className="ch-tool-ic">{t.icon}</div>
                                <span className="ch-tool-lbl">{t.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Daily Mood Snapshot */}
                    <div className="ch-sc">
                        <p className="ch-sc-title">Daily Mood Snapshot</p>
                        <div className="ch-snap">
                            {(moodLogs.length > 0 ? moodLogs : PLACEHOLDER_BARS.map((h, i) => ({ moodScore: h / 10 }))).map((log, i) => (
                                <div key={i} className="ch-bar-seg"
                                    title={moodLogs.length > 0 ? `${log.moodScore}/10` : ''}
                                    style={{
                                        height: `${moodLogs.length > 0 ? (log.moodScore / 10) * 100 : PLACEHOLDER_BARS[i]}%`,
                                        backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                                    }} />
                            ))}
                        </div>
                        {moodLogs.length === 0 && (
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0', textAlign: 'center' }}>Log moods to see your snapshot</p>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="ch-sc">
                        <p className="ch-sc-title" style={{ marginBottom: 8 }}>Quick Links</p>
                        {[
                            { to: '/dashboard',     label: '😊 Mood Tracker'     },
                            { to: '/journal',        label: '📝 Journal'           },
                            { to: '/weekly-report',  label: '📊 Weekly Report'     },
                            { to: '/crisis',         label: '🆘 Crisis Resources'  },
                        ].map(l => (
                            <Link key={l.to} to={l.to} className="ch-qlink">{l.label}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}