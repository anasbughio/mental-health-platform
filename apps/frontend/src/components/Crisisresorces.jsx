import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

// ── Data ──────────────────────────────────────────────────────────────────────
const QUICK_DIAL = [
    { label: '988',            sub: 'Suicide & Crisis Lifeline (USA)', phone: 'tel:988',                icon: '📞' },
    { label: 'HOME to 741741', sub: 'Crisis Text Line',               phone: 'sms:741741&body=HOME',   icon: '💬' },
    { label: '116 123',        sub: 'Samaritans UK & ROI',             phone: 'tel:116123',             icon: '🎧' },
];

const HOTLINES = [
    { name: 'Lifeline Australia', contact: '13 11 14',        desc: '24/7 crisis support and suicide prevention services for all Australians.' },
    { name: 'Kids Help Phone',    contact: '1-800-668-6868',  desc: "Canada's only 24/7 e-mental health service for young people." },
    { name: 'International Hub',  contact: 'befrienders.org', desc: 'Global directory of support centers in over 30 countries.', web: true },
    { name: 'Vandrevala Foundation', contact: '1860-2662-345', desc: 'Free psychological counseling and crisis support 24x7 (India).' },
    { name: 'iCall',              contact: '9152987821',       desc: 'Psychosocial helpline run by TISS professionals.' },
    { name: 'IASP Crisis Centres',contact: 'iasp.info',       desc: 'Global crisis center directory.', web: true },
];

const COPING = [
    { icon: '🌬️', title: '5-4-3-2-1 Grounding',          desc: 'Name 5 things you see, 4 you can touch, 3 you can hear, 2 you smell, 1 you taste.' },
    { icon: '🧊', title: 'Cold Water Splash',             desc: 'Splash cold water on your face or hold an ice cube. The temperature shock helps reset your nervous system.' },
    { icon: '🚶', title: 'Progressive Muscle Relaxation', desc: 'Tense each muscle group for 5 seconds and then release suddenly. Start from your toes and move up.', featured: true, color: '#dcfce7', accent: '#16a34a' },
    { icon: '📞', title: 'Call Someone You Trust',        desc: "Reach out to a friend or family member. You don't have to explain everything — just say you need to talk." },
];

const BOX_STEPS = ['Inhale 4s', 'Hold 4s', 'Exhale 4s', 'Hold 4s'];

export default function CrisisResources() {
    const [checkText, setCheckText] = useState('');
    const [checkResult, setCheckResult] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [breathStep, setBreathStep] = useState(null); // null | 0-3
    const [breathTimer, setBreathTimer] = useState(4);
    const [ready, setReady] = useState(false);

    useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

    // Box breathing timer
    useEffect(() => {
        if (breathStep === null) return;
        if (breathTimer === 0) {
            const next = (breathStep + 1) % 4;
            setBreathStep(next);
            setBreathTimer(4);
            return;
        }
        const t = setTimeout(() => setBreathTimer(p => p - 1), 1000);
        return () => clearTimeout(t);
    }, [breathStep, breathTimer]);

    const handleSelfCheck = async (e) => {
        e.preventDefault();
        if (!checkText.trim()) return;
        setIsChecking(true);
        setCheckResult(null);
        try {
            const res = await api.post('/crisis/detect', { text: checkText });
            setCheckResult(res.data.data);
        } catch { setCheckResult({ error: true }); }
        finally { setIsChecking(false); }
    };

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    const BREATH_COLORS = ['#6366f1','#8b5cf6','#6366f1','#4f46e5'];
    const BREATH_LABELS = ['Breathe in…', 'Hold…', 'Breathe out…', 'Hold…'];

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .cc {  width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; padding:36px 44px 80px; box-sizing:border-box; margin:0 auto; }

            /* page title */
            .cc-hero { margin-bottom:28px; }
            .cc-hero h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; color:#111827; margin:0 0 5px; letter-spacing:-0.6px; }
            .cc-hero p  { font-size:14px; color:#9ca3af; margin:0; }

            /* ── Emergency top grid ── */
            .cc-top { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:28px; }
            .cc-danger { background:linear-gradient(135deg,#fff5f5,#fef2f2); border:1.5px solid #fca5a5; border-radius:18px; padding:20px; grid-row:span 2; }
            .cc-danger-badge { display:inline-flex; align-items:center; gap:6px; background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:0.06em; margin-bottom:12px; }
            .cc-danger-star { color:#dc2626; font-size:14px; }
            .cc-danger h2 { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#dc2626; margin:0 0 8px; }
            .cc-danger p  { font-size:13px; color:#7f1d1d; line-height:1.6; margin:0 0 16px; }
            .cc-emerg-nums { display:flex; gap:10px; }
            .cc-enum { flex:1; background:white; border-radius:12px; padding:12px; text-align:center; border:1px solid #fecaca; }
            .cc-enum-n { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:900; color:#dc2626; margin:0 0 2px; }
            .cc-enum-l { font-size:10px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin:0; }

            /* Quick dial cards */
            .cc-dial { background:white; border-radius:18px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:14px; cursor:pointer; text-decoration:none; transition:all 0.2s; }
            .cc-dial:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-2px); }
            .cc-dial-icon { font-size:24px; width:46px; height:46px; border-radius:50%; background:#f0f4ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .cc-dial-num { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:900; color:#111827; margin:0 0 2px; line-height:1; }
            .cc-dial-sub { font-size:11px; color:#9ca3af; margin:0; font-weight:500; }

            /* section heading */
            .cc-sh { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#111827; margin:0 0 14px; letter-spacing:-0.3px; }

            /* ── Hotlines ── */
            .cc-hotlines { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:32px; }
            .cc-hcard { background:white; border-radius:16px; padding:18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); transition:all 0.2s; }
            .cc-hcard:hover { box-shadow:0 4px 14px rgba(0,0,0,0.1); transform:translateY(-2px); }
            .cc-hcard-name { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#111827; margin:0 0 5px; }
            .cc-hcard-num  { font-size:16px; font-weight:800; color:#6366f1; margin:0 0 6px; font-family:'Bricolage Grotesque',sans-serif; }
            .cc-hcard-desc { font-size:12px; color:#6b7280; margin:0; line-height:1.5; }

            /* ── Coping ── */
            .cc-coping { display:grid; grid-template-columns:260px 1fr; gap:14px; margin-bottom:32px; align-items:start; }
            .cc-breath-card { background:linear-gradient(135deg,#1e1b4b,#312e81,#4f46e5); border-radius:20px; padding:24px; color:white; grid-row:span 2; position:relative; overflow:hidden; min-height:280px; display:flex; flex-direction:column; }
            .cc-breath-blob { position:absolute; top:-40px; right:-40px; width:140px; height:140px; border-radius:50%; background:rgba(255,255,255,0.08); pointer-events:none; }
            .cc-breath-blob2 { position:absolute; bottom:-30px; left:-20px; width:100px; height:100px; border-radius:50%; background:rgba(255,255,255,0.05); pointer-events:none; }
            .cc-breath-badge { display:inline-block; font-size:10px; font-weight:700; background:rgba(255,255,255,0.2); color:white; padding:3px 10px; border-radius:20px; letter-spacing:0.07em; text-transform:uppercase; margin-bottom:14px; }
            .cc-breath-title { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:white; margin:0 0 10px; }
            .cc-breath-desc { font-size:13px; color:rgba(255,255,255,0.75); line-height:1.6; margin:0 0 20px; flex:1; }
            .cc-breath-btn { padding:10px 20px; background:white; color:#4338ca; border:none; border-radius:24px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:7px; width:fit-content; }
            .cc-breath-btn:hover { background:#f0f4ff; transform:scale(1.03); }
            .cc-breath-btn.active { background:#10b981; color:white; }
            .cc-breath-anim { margin-bottom:14px; display:flex; flex-direction:column; align-items:center; gap:10px; animation:fadeIn 0.3s ease; }
            @keyframes fadeIn { from{opacity:0;transform:scale(0.9);} to{opacity:1;transform:scale(1);} }
            .cc-breath-ring { width:80px; height:80px; border-radius:50%; border:3px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900; color:white; transition:all 0.5s; }
            .cc-breath-step { font-size:13px; color:rgba(255,255,255,0.8); font-weight:600; }

            .cc-coping-right { display:flex; flex-direction:column; gap:12px; }
            .cc-cope-card { background:white; border-radius:16px; padding:18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); display:flex; gap:12px; align-items:flex-start; transition:all 0.2s; }
            .cc-cope-card:hover { box-shadow:0 4px 14px rgba(0,0,0,0.1); }
            .cc-cope-icon { width:36px; height:36px; border-radius:10px; background:#f0f4ff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
            .cc-cope-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#111827; margin:0 0 4px; }
            .cc-cope-desc  { font-size:12px; color:#6b7280; line-height:1.55; margin:0; }
            .cc-cope-card.green { background:linear-gradient(135deg,#f0fdf4,#dcfce7); border-color:#bbf7d0; }
            .cc-cope-card.green .cc-cope-icon { background:white; }
            .cc-cope-card.green .cc-cope-title { color:#166534; }
            .cc-cope-card.green .cc-cope-desc  { color:#166534; }

            /* ── AI Check-in ── */
            .cc-checkin { background:white; border-radius:20px; padding:26px 28px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); margin-bottom:28px; }
            .cc-checkin-head { display:flex; align-items:center; gap:12px; margin-bottom:5px; }
            .cc-checkin-icon { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
            .cc-checkin-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#111827; margin:0; }
            .cc-checkin-sub   { font-size:13px; color:#9ca3af; margin:0 0 18px; }
            .cc-ci-lbl { font-size:13px; font-weight:600; color:#374151; margin:0 0 8px; display:block; }
            .cc-ci-ta  { width:100%; padding:14px; border:1.5px solid #e5e7eb; border-radius:12px; box-sizing:border-box; font-size:14px; font-family:'DM Sans',sans-serif; resize:none; outline:none; min-height:100px; line-height:1.6; color:#111827; background:#fafafa; transition:border-color 0.2s,background 0.2s; }
            .cc-ci-ta:focus { border-color:#6366f1; background:white; }
            .cc-ci-ta::placeholder { color:#c4b5fd; font-style:italic; }
            .cc-ci-row { display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:10px; }
            .cc-ci-hint { font-size:12px; color:#9ca3af; max-width:340px; line-height:1.5; }
            .cc-ci-btn { padding:11px 28px; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
            .cc-ci-btn:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }
            .cc-ci-btn:disabled { background:#e5e7eb; color:#9ca3af; box-shadow:none; transform:none; cursor:not-allowed; }
            .cc-result { margin-top:16px; padding:16px 18px; border-radius:14px; animation:fadeIn 0.3s ease; }
            .cc-result.ok  { background:#f0fdf4; border:1px solid #bbf7d0; }
            .cc-result.bad { background:#fef2f2; border:1px solid #fecaca; }
            .cc-result-t { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; margin:0 0 6px; }
            .cc-result-p { font-size:13px; line-height:1.65; margin:0 0 12px; }
            .cc-result-call { display:inline-flex; align-items:center; gap:8px; padding:10px 22px; background:#dc2626; color:white; border-radius:10px; text-decoration:none; font-size:13px; font-weight:700; transition:all 0.2s; box-shadow:0 3px 8px rgba(220,38,38,0.3); }
            .cc-result-call:hover { transform:translateY(-1px); }

            /* ── Footer ── */
            .cc-foot { background:white; border-radius:18px; padding:20px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.05); text-align:center; }
            .cc-foot-badge { display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:#6366f1; margin-bottom:8px; }
            .cc-foot p { font-size:13px; color:#6b7280; margin:0; line-height:1.65; max-width:600px; margin-inline:auto; }

            @media(max-width:900px) {
                .cc { padding:24px 20px 80px; }
                .cc-top { grid-template-columns:1fr; }
                .cc-danger { grid-row:span 1; }
                .cc-hotlines { grid-template-columns:1fr 1fr; }
                .cc-coping { grid-template-columns:1fr; }
                .cc-breath-card { min-height:auto; }
            }
            @media(max-width:600px) {
                .cc { padding:18px 14px 80px; }
                .cc-hotlines { grid-template-columns:1fr; }
                .cc-hero h1 { font-size:24px; }
            }
        `}</style>

        <div className="cc">
            {/* ── Page title ── */}
            <div className="cc-hero" style={fi(0.04)}>
                <h1>Crisis Resources</h1>
                <p>Help is always available. You don't have to face this alone.</p>
            </div>

            {/* ── Emergency top section ── */}
            <div className="cc-top" style={fi(0.1)}>
                {/* Immediate danger */}
                <div className="cc-danger">
                    <div className="cc-danger-badge">
                        <span className="cc-danger-star">✳</span> Immediate Danger
                    </div>
                    <h2>If you or someone else is in immediate danger, please call emergency services right away.</h2>
                    <p>Do not wait — your life matters more than anything.</p>
                    <div className="cc-emerg-nums">
                        <div className="cc-enum">
                            <p className="cc-enum-n">911</p>
                            <p className="cc-enum-l">USA / Canada</p>
                        </div>
                        <div className="cc-enum">
                            <p className="cc-enum-n">999</p>
                            <p className="cc-enum-l">UK / Ireland</p>
                        </div>
                    </div>
                </div>

                {/* Quick dial cards */}
                {QUICK_DIAL.map((d, i) => (
                    <a key={i} href={d.phone} className="cc-dial">
                        <div className="cc-dial-icon">{d.icon}</div>
                        <div>
                            <p className="cc-dial-num">{d.label}</p>
                            <p className="cc-dial-sub">{d.sub}</p>
                        </div>
                    </a>
                ))}
            </div>

            {/* ── Global Hotlines ── */}
            <p className="cc-sh" style={fi(0.14)}>Global Hotlines</p>
            <div className="cc-hotlines" style={fi(0.16)}>
                {HOTLINES.map((h, i) => (
                    <div key={i} className="cc-hcard">
                        <p className="cc-hcard-name">{h.name}</p>
                        <p className="cc-hcard-num" style={{ color: h.web ? '#6366f1' : '#6366f1' }}>{h.contact}</p>
                        <p className="cc-hcard-desc">{h.desc}</p>
                    </div>
                ))}
            </div>

            {/* ── Coping Techniques ── */}
            <p className="cc-sh" style={fi(0.18)}>Immediate Coping Techniques</p>
            <div className="cc-coping" style={fi(0.2)}>
                {/* Box breathing featured card */}
                <div className="cc-breath-card">
                    <div className="cc-breath-blob" />
                    <div className="cc-breath-blob2" />
                    <span className="cc-breath-badge">Most Effective</span>
                    <p className="cc-breath-title">Box Breathing</p>
                    <p className="cc-breath-desc">
                        Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat until you feel grounded.
                    </p>

                    {breathStep !== null && (
                        <div className="cc-breath-anim">
                            <div className="cc-breath-ring" style={{ backgroundColor: `${BREATH_COLORS[breathStep]}30`, borderColor: BREATH_COLORS[breathStep] }}>
                                {breathTimer}
                            </div>
                            <span className="cc-breath-step">{BREATH_LABELS[breathStep]}</span>
                        </div>
                    )}

                    <button className={`cc-breath-btn ${breathStep !== null ? 'active' : ''}`}
                        onClick={() => { if (breathStep !== null) { setBreathStep(null); setBreathTimer(4); } else { setBreathStep(0); setBreathTimer(4); } }}>
                        {breathStep !== null ? '⏹ Stop Session' : '▶ Start Session ⏱'}
                    </button>
                </div>

                {/* Other techniques */}
                <div className="cc-coping-right">
                    {COPING.map((c, i) => (
                        <div key={i} className={`cc-cope-card ${c.featured ? 'green' : ''}`}>
                            <div className="cc-cope-icon">{c.icon}</div>
                            <div>
                                <p className="cc-cope-title">{c.title}</p>
                                <p className="cc-cope-desc">{c.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── AI Support Check-in ── */}
            <div className="cc-checkin" style={fi(0.24)}>
                <div className="cc-checkin-head">
                    <div className="cc-checkin-icon">✨</div>
                    <p className="cc-checkin-title">AI Support Check-in</p>
                </div>
                <p className="cc-checkin-sub">Tell us how you're feeling for immediate guidance.</p>

                <label className="cc-ci-lbl">How Are You Feeling Right Now?</label>
                <textarea className="cc-ci-ta"
                    value={checkText}
                    onChange={e => setCheckText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSelfCheck(e)}
                    placeholder="I'm feeling overwhelmed and don't know who to talk to…"
                    rows={4}
                />

                <div className="cc-ci-row">
                    <p className="cc-ci-hint">Serenity AI will analyze your response to provide supportive techniques or direct you to human assistance.</p>
                    <button className="cc-ci-btn" disabled={isChecking || !checkText.trim()} onClick={handleSelfCheck}>
                        {isChecking ? '✨ Analyzing…' : 'Get Support →'}
                    </button>
                </div>

                {checkResult && (
                    <div className={`cc-result ${checkResult.isDistressed ? 'bad' : 'ok'}`}>
                        {checkResult.error ? (
                            <p className="cc-result-p" style={{ margin: 0 }}>Could not analyze right now. If you need help, please call one of the hotlines above.</p>
                        ) : checkResult.isDistressed ? (
                            <>
                                <p className="cc-result-t" style={{ color: '#dc2626' }}>💙 We hear you</p>
                                <p className="cc-result-p" style={{ color: '#7f1d1d' }}>
                                    It sounds like you may be going through something very difficult. Trained counselors are ready to listen right now — you don't have to go through this alone.
                                </p>
                                <a href="tel:988" className="cc-result-call">📞 Call 988 Now</a>
                            </>
                        ) : (
                            <>
                                <p className="cc-result-t" style={{ color: '#16a34a' }}>✅ Thanks for sharing</p>
                                <p className="cc-result-p" style={{ color: '#166534', margin: 0 }}>
                                    No immediate crisis signals detected. Remember, it's always okay to reach out to a hotline or your AI companion anytime you need support.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="cc-foot" style={fi(0.28)}>
                <div className="cc-foot-badge">🛡️ Serenity AI Protection</div>
                <p>
                    Serenity AI is a wellness platform and is not a substitute for professional clinical care, therapy, or emergency medical treatment. In the event of a medical or mental health emergency, please contact your local emergency services or visit the nearest emergency room immediately.
                </p>
            </div>
        </div>
        </>
    );
}