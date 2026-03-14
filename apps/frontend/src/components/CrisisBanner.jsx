import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RESOURCES = [
    { name: 'Lifeline Australia',       desc: '24/7 crisis support and suicide prevention services.',      contact: '13 11 14',          phone: 'tel:131114'              },
    { name: 'Samaritans UK',            desc: "Whatever you're going through, a Samaritan will face it with you.", contact: '116 123', phone: 'tel:116123'              },
    { name: 'Vandrevala Foundation India', desc: 'Free psychological counseling and crisis support 24x7.', contact: '999 9666 555',      phone: 'tel:9999666555'          },
    { name: 'Crisis Text Line',         desc: 'Free, confidential crisis counseling over text.',           contact: 'Text HOME to 741741', phone: 'sms:741741&body=HOME'  },
    { name: 'Suicide Prevention Lifeline', desc: 'Call or text for free and confidential support.',        contact: 'Call or Text 988',   phone: 'tel:988'                 },
    { name: 'iCall',                    desc: 'Psychosocial helpline run by TISS professionals.',          contact: '9152987821',          phone: 'tel:9152987821'          },
];

const WHAT_TO_EXPECT = [
    'Confidential conversation with a trained professional.',
    'No judgment, just active listening and support.',
    'Available 24 hours a day, 7 days a week.',
];

export default function CrisisBanner() {
    const [ready, setReady] = useState(false);
    useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

    const fi = (d = 0) => ({
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${d}s, transform 0.45s ease ${d}s`,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            .cr { width:100%; min-height:100vh; background:#f5f4f0; font-family:'DM Sans',sans-serif; box-sizing:border-box; padding-bottom:60px; }

            /* ── Hero ── */
            .cr-hero { background:linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#4f46e5 65%,#818cf8 100%); padding:60px 44px 56px; position:relative; overflow:hidden; }
            .cr-hero-blob1 { position:absolute; top:-100px; right:-100px; width:360px; height:360px; border-radius:50%; background:rgba(255,255,255,0.05); pointer-events:none; }
            .cr-hero-blob2 { position:absolute; bottom:-80px; left:25%; width:260px; height:260px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
            .cr-hero-inner { max-width:880px; margin:0 auto; position:relative; z-index:1; }
            .cr-hero h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:38px; font-weight:800; color:white; margin:0 0 16px; letter-spacing:-0.8px; line-height:1.22; max-width:580px; }
            .cr-hero p  { font-size:15px; color:rgba(255,255,255,0.78); margin:0 0 34px; line-height:1.65; max-width:500px; }
            .cr-hero-btns { display:flex; gap:14px; flex-wrap:wrap; }
            .cr-btn-call { display:inline-flex; align-items:center; gap:9px; padding:14px 28px; background:#10b981; color:white; border:none; border-radius:30px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s; box-shadow:0 4px 16px rgba(16,185,129,0.45); }
            .cr-btn-call:hover { transform:translateY(-2px); box-shadow:0 6px 22px rgba(16,185,129,0.55); }
            .cr-btn-sms { display:inline-flex; align-items:center; gap:9px; padding:14px 28px; background:rgba(255,255,255,0.14); color:white; border:1.5px solid rgba(255,255,255,0.35); border-radius:30px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; text-decoration:none; transition:all 0.2s; backdrop-filter:blur(8px); }
            .cr-btn-sms:hover { background:rgba(255,255,255,0.24); transform:translateY(-2px); }

            /* ── Body layout ── */
            .cr-body { max-width:960px; margin:0 auto; padding:36px 44px 0; display:grid; grid-template-columns:1fr 290px; gap:22px; align-items:start; }

            /* ── Resources card ── */
            .cr-card { background:white; border-radius:22px; padding:26px 28px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .cr-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
            .cr-card-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#111827; margin:0; }
            .cr-lang-pill { font-size:11px; color:#9ca3af; background:#f3f4f6; border:1px solid #e5e7eb; padding:4px 12px; border-radius:20px; font-weight:600; }

            .cr-res-row { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:16px 0; border-bottom:1px solid #f9fafb; transition:padding 0.15s; }
            .cr-res-row:last-of-type { border-bottom:none; }
            .cr-res-row:hover { padding-left:5px; }
            .cr-res-name { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#111827; margin:0 0 3px; }
            .cr-res-desc { font-size:12px; color:#6b7280; margin:0 0 6px; line-height:1.5; }
            .cr-res-num  { font-size:14px; font-weight:700; color:#6366f1; margin:0; }
            .cr-call-circle { width:46px; height:46px; border-radius:50%; background:#10b981; display:flex; align-items:center; justify-content:center; font-size:18px; text-decoration:none; flex-shrink:0; box-shadow:0 3px 10px rgba(16,185,129,0.35); transition:all 0.2s; }
            .cr-call-circle:hover { transform:scale(1.1) rotate(-5deg); box-shadow:0 5px 18px rgba(16,185,129,0.5); }

            .cr-res-footer { margin-top:18px; text-align:center; background:#f9fafb; border-radius:12px; padding:13px; }
            .cr-res-footer p { font-size:13px; color:#6b7280; margin:0; }
            .cr-res-footer a { color:#6366f1; font-weight:700; text-decoration:none; }
            .cr-res-footer a:hover { text-decoration:underline; }

            /* ── Sidebar ── */
            .cr-side { display:flex; flex-direction:column; gap:16px; }
            .cr-sc { background:white; border-radius:18px; padding:20px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }

            /* Reminder */
            .cr-remind-icon { font-size:26px; margin-bottom:10px; display:block; }
            .cr-remind-t { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#111827; margin:0 0 10px; }
            .cr-remind-p { font-size:13px; color:#4b5563; line-height:1.7; margin:0 0 14px; }
            .cr-safe { display:inline-flex; align-items:center; gap:6px; background:#dcfce7; color:#16a34a; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700; }

            /* What to expect */
            .cr-exp-t { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#111827; margin:0 0 14px; }
            .cr-exp-row { display:flex; gap:10px; align-items:flex-start; margin-bottom:11px; }
            .cr-exp-row:last-child { margin-bottom:0; }
            .cr-exp-chk { width:20px; height:20px; border-radius:50%; background:#6366f1; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0; margin-top:1px; }
            .cr-exp-txt { font-size:13px; color:#374151; line-height:1.55; }

            /* Back to safety */
            .cr-safety-card { background:linear-gradient(135deg,#f0f4ff,#ede9fe); border:1px solid #c7d2fe; border-radius:18px; padding:20px 22px; }
            .cr-safety-t { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#4338ca; margin:0 0 12px; }
            .cr-safety-link { display:flex; align-items:center; padding:9px 0; font-size:13px; color:#4338ca; text-decoration:none; border-bottom:1px solid rgba(99,102,241,0.1); font-weight:600; transition:padding 0.15s; }
            .cr-safety-link:last-child { border-bottom:none; }
            .cr-safety-link:hover { padding-left:5px; }

            /* ── Footer bar ── */
            .cr-foot { max-width:960px; margin:28px auto 0; padding:0 44px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; }
            .cr-emerg { background:white; border-radius:14px; padding:14px 20px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.05); }
            .cr-emerg-lbl { font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 2px; }
            .cr-emerg-num { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:900; color:#111827; margin:0; line-height:1; }
            .cr-emerg-sub { font-size:11px; color:#9ca3af; margin:0; }
            .cr-foot-note { font-size:12px; color:#9ca3af; max-width:440px; line-height:1.6; }

            /* Error box just in case */
            .cr-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:12px; font-size:14px; max-width:880px; margin:20px auto; }

            @media(max-width:900px) {
                .cr-body { grid-template-columns:1fr; padding:24px 24px 0; }
                .cr-hero { padding:40px 24px 36px; }
                .cr-hero h1 { font-size:28px; }
                .cr-foot { padding:0 24px; }
            }
            @media(max-width:600px) {
                .cr-hero { padding:32px 16px 28px; }
                .cr-hero h1 { font-size:22px; }
                .cr-body { padding:16px 16px 0; }
                .cr-foot { padding:0 16px; }
                .cr-hero-btns { flex-direction:column; }
                .cr-btn-call,.cr-btn-sms { justify-content:center; }
            }
        `}</style>

        <div className="cr">
            {/* ── Hero ── */}
            <div className="cr-hero" style={fi(0.0)}>
                <div className="cr-hero-blob1" />
                <div className="cr-hero-blob2" />
                <div className="cr-hero-inner">
                    <h1>It sounds like you may be going through something really difficult.</h1>
                    <p>Trained counselors are available right now to help. Your safety and wellbeing are the absolute priority.</p>
                    <div className="cr-hero-btns">
                        <a href="tel:988" className="cr-btn-call">
                            <span>📞</span> Call 988 Now (US)
                        </a>
                        <a href="sms:741741&body=HOME" className="cr-btn-sms">
                            <span>💬</span> Text HOME to 741741
                        </a>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="cr-body">
                {/* Resources */}
                <div className="cr-card" style={fi(0.12)}>
                    <div className="cr-card-head">
                        <p className="cr-card-title">More crisis resources worldwide</p>
                        <span className="cr-lang-pill">language</span>
                    </div>

                    {RESOURCES.map((r, i) => (
                        <div key={i} className="cr-res-row">
                            <div>
                                <p className="cr-res-name">{r.name}</p>
                                <p className="cr-res-desc">{r.desc}</p>
                                <p className="cr-res-num">{r.contact}</p>
                            </div>
                            <a href={r.phone} className="cr-call-circle" title={`Contact ${r.name}`}>📞</a>
                        </div>
                    ))}

                    <div className="cr-res-footer">
                        <p>Find more global support directories at <a href="https://www.befrienders.org" target="_blank" rel="noreferrer">befrienders.org</a></p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="cr-side" style={fi(0.2)}>
                    {/* Gentle reminder */}
                    <div className="cr-sc">
                        <span className="cr-remind-icon">💙</span>
                        <p className="cr-remind-t">A gentle reminder</p>
                        <p className="cr-remind-p">
                            This AI companion cares about your wellbeing. Reaching out to a real person is always a good idea. Humans provide a unique connection that is vital during difficult times.
                        </p>
                        <span className="cr-safe">✅ Safe &amp; Private Space</span>
                    </div>

                    {/* What to expect */}
                    <div className="cr-sc">
                        <p className="cr-exp-t">What to expect</p>
                        {WHAT_TO_EXPECT.map((item, i) => (
                            <div key={i} className="cr-exp-row">
                                <div className="cr-exp-chk">✓</div>
                                <p className="cr-exp-txt">{item}</p>
                            </div>
                        ))}
                    </div>

                    {/* Back to safety */}
                    <div className="cr-safety-card">
                        <p className="cr-safety-t">Back to safety</p>
                        {[
                            { to: '/chat',      l: '💬 Talk to AI Companion' },
                            { to: '/exercises', l: '🧘 Guided Breathing'     },
                            { to: '/dashboard', l: '😊 Log Your Mood'        },
                        ].map(({ to, l }) => (
                            <Link key={to} to={to} className="cr-safety-link">{l}</Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="cr-foot" style={fi(0.28)}>
                <div className="cr-emerg">
                    <p className="cr-emerg-lbl">Emergency Contact</p>
                    <p className="cr-emerg-num">988</p>
                    <p className="cr-emerg-sub">National Helpline (US)</p>
                </div>
                <p className="cr-foot-note">
                    If you are in immediate physical danger, please call your local emergency services (e.g., 911).
                </p>
            </div>
        </div>
        </>
    );
}