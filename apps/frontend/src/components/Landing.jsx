import { Link } from 'react-router-dom';

const FEATURES = [
    { icon: '😊', title: 'Mood Tracking',    bg: 'white',   preview: 'bars', desc: 'Visualize your emotional journey over time with intuitive tracking.' },
    { icon: '🤖', title: 'AI Companion',     bg: '#5046e5', preview: 'chat', desc: 'A supportive, non-judgmental AI available 24/7 to listen and guide.', dark: true },
    { icon: '🌟', title: 'Guided Exercises', bg: 'white',   preview: 'sun',  desc: 'Evidence-based mindfulness and CBT exercises tailored to your needs.' },
];

const STEPS = [
    { num: 1, color: '#5046e5', title: 'Check-in',             desc: 'Share your thoughts and feelings in a safe space.'    },
    { num: 2, color: '#10b981', title: 'Personalized Guidance', desc: 'Receive tailored insights and coping strategies.'     },
    { num: 3, color: '#f59e0b', title: 'Growth',                desc: 'Build resilience and track your long-term progress.'  },
];

const COLORS_ART = [
    '#ef4444','#f97316','#eab308','#22c55e','#10b981','#06b6d4',
    '#6366f1','#8b5cf6','#ec4899','#f43f5e','#84cc16','#0ea5e9',
];

function PixelGrid() {
    const SIZE = 20;
    const pixels = Array.from({ length: SIZE * SIZE }, () => {
        const r = Math.random();
        if (r < 0.38) return '#f0f0f2';
        if (r < 0.55) return '#e2e2e8';
        return COLORS_ART[Math.floor(Math.random() * COLORS_ART.length)];
    });
    return (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${SIZE},1fr)`, gap:3, padding:14, background:'white', borderRadius:22, boxShadow:'0 12px 50px rgba(0,0,0,0.12)', aspectRatio:'1', overflow:'hidden', animation:'artIn 0.8s ease 0.3s both' }}>
            {pixels.map((color, i) => (
                <div key={i} style={{ background:color, borderRadius:3, aspectRatio:'1' }} />
            ))}
        </div>
    );
}

export default function Landing() {
    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');
            *{box-sizing:border-box;margin:0;padding:0;}
            .lp{width:100%;min-height:100vh;background:#f5f5f7;font-family:'DM Sans',sans-serif;color:#111827;}
            @keyframes artIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
            @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}

            /* ── Nav ── */
            .lp-nav{position:sticky;top:0;z-index:50;background:rgba(245,245,247,0.94);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,0.07);}
            .lp-nav-in{width:100%;padding:0 60px;height:54px;display:flex;align-items:center;justify-content:space-between;}
            .lp-logo{display:flex;align-items:center;gap:9px;text-decoration:none;}
            .lp-logo-box{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#6366f1,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:15px;}
            .lp-logo-txt{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:800;color:#111827;letter-spacing:-0.3px;}
            .lp-nav-r{display:flex;align-items:center;gap:6px;}
            .lp-nav-link{padding:6px 16px;font-size:13px;font-weight:500;color:#6b7280;text-decoration:none;border-radius:8px;transition:all 0.15s;}
            .lp-nav-link:hover{background:rgba(0,0,0,0.05);color:#374151;}
            .lp-nav-login{padding:7px 18px;font-size:13px;font-weight:600;color:#374151;text-decoration:none;}
            .lp-nav-cta{padding:8px 20px;background:#5046e5;color:white;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none;transition:all 0.2s;box-shadow:0 2px 10px rgba(80,70,229,0.32);}
            .lp-nav-cta:hover{background:#4338ca;transform:translateY(-1px);box-shadow:0 4px 16px rgba(80,70,229,0.44);}

            /* ── Hero ── */
            .lp-hero{width:100%;padding:90px 80px 76px;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;}
            .lp-hero-l{animation:fadeUp 0.6s ease 0.1s both;}
            .lp-h1{font-family:'Bricolage Grotesque',sans-serif;font-size:56px;font-weight:800;color:#111827;line-height:1.1;letter-spacing:-1.2px;margin-bottom:22px;}
            .lp-hero-sub{font-size:18px;color:#6b7280;line-height:1.7;margin-bottom:36px;max-width:440px;}
            .lp-hero-btn{display:inline-flex;align-items:center;gap:9px;padding:16px 32px;background:#5046e5;color:white;border-radius:30px;font-size:16px;font-weight:700;text-decoration:none;transition:all 0.2s;box-shadow:0 4px 18px rgba(80,70,229,0.4);font-family:'DM Sans',sans-serif;}
            .lp-hero-btn:hover{background:#4338ca;transform:translateY(-2px);box-shadow:0 7px 24px rgba(80,70,229,0.52);}
            .lp-hero-art{animation:fadeUp 0.7s ease 0.25s both;}

            /* ── Section wrapper ── */
            .lp-sec{width:100%;padding:72px 80px;}
            .lp-badge{font-size:11px;font-weight:700;color:#6366f1;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;display:block;}
            .lp-stitle{font-family:'Bricolage Grotesque',sans-serif;font-size:34px;font-weight:800;color:#111827;letter-spacing:-0.6px;margin-bottom:10px;}
            .lp-ssub{font-size:15px;color:#6b7280;line-height:1.7;margin-bottom:44px;max-width:560px;}

            /* ── Feature grid ── */
            .lp-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
            .lp-fc{border-radius:20px;padding:26px;display:flex;flex-direction:column;gap:12px;min-height:210px;transition:all 0.2s;border:1px solid rgba(0,0,0,0.06);box-shadow:0 1px 4px rgba(0,0,0,0.05);}
            .lp-fc.dark{border:none;box-shadow:0 10px 36px rgba(80,70,229,0.32);}
            .lp-fc:hover{transform:translateY(-4px);box-shadow:0 10px 32px rgba(0,0,0,0.13);}
            .lp-fc.dark:hover{box-shadow:0 12px 40px rgba(80,70,229,0.42);}
            .lp-fi{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;}
            .lp-ft{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:700;margin:0;}
            .lp-fd{font-size:14px;line-height:1.65;margin:0;flex:1;}
            .lp-bars{display:flex;gap:4px;align-items:flex-end;height:44px;margin-top:auto;}
            .lp-bar{border-radius:4px 4px 0 0;flex:1;}
            .lp-cb{background:rgba(255,255,255,0.18);border-radius:12px;padding:8px 12px;font-size:12px;color:white;max-width:90%;margin-bottom:7px;}
            .lp-ci{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:7px 14px;font-size:12px;color:rgba(255,255,255,0.6);width:100%;}

            /* ── How ── */
            .lp-how{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
            .lp-steps{display:flex;flex-direction:column;}
            .lp-step{display:flex;gap:18px;align-items:flex-start;padding:22px 0;border-bottom:1px solid #ebebed;}
            .lp-step:last-child{border-bottom:none;}
            .lp-snum{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:white;flex-shrink:0;margin-top:2px;}
            .lp-st{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:700;color:#111827;margin:0 0 4px;}
            .lp-sd{font-size:14px;color:#6b7280;margin:0;line-height:1.6;}

            /* ── CTA ── */
            .lp-cta-wrap{width:100%;padding:0 80px 90px;}
            .lp-cta{background:linear-gradient(135deg,#5046e5 0%,#7c3aed 100%);border-radius:26px;padding:72px 60px;text-align:center;position:relative;overflow:hidden;}
            .lp-cta::before{content:'';position:absolute;top:-70px;right:-70px;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none;}
            .lp-cta::after{content:'';position:absolute;bottom:-50px;left:8%;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05);pointer-events:none;}
            .lp-cta-t{font-family:'Bricolage Grotesque',sans-serif;font-size:36px;font-weight:800;color:white;margin-bottom:12px;letter-spacing:-0.6px;position:relative;z-index:1;}
            .lp-cta-s{font-size:16px;color:rgba(255,255,255,0.75);margin-bottom:32px;position:relative;z-index:1;}
            .lp-cta-btn{display:inline-block;padding:14px 38px;background:white;color:#5046e5;border-radius:30px;font-size:15px;font-weight:700;text-decoration:none;transition:all 0.2s;box-shadow:0 4px 18px rgba(0,0,0,0.2);position:relative;z-index:1;}
            .lp-cta-btn:hover{transform:translateY(-2px);box-shadow:0 7px 26px rgba(0,0,0,0.27);}

            /* ── Footer ── */
            .lp-foot{width:100%;border-top:1px solid #e5e7eb;padding:26px 80px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
            .lp-foot-copy{font-size:13px;color:#9ca3af;}
            .lp-foot-links{display:flex;gap:20px;}
            .lp-foot-links a{font-size:13px;color:#6b7280;text-decoration:none;transition:color 0.15s;}
            .lp-foot-links a:hover{color:#6366f1;}

            /* ── Responsive ── */
            @media(max-width:1024px){
                .lp-nav-in{padding:0 36px;}
                .lp-hero{padding:72px 40px 60px;gap:48px;}
                .lp-h1{font-size:44px;}
                .lp-sec{padding:60px 40px;}
                .lp-cta-wrap{padding:0 40px 72px;}
                .lp-cta{padding:56px 40px;}
                .lp-foot{padding:22px 40px;}
            }
            @media(max-width:768px){
                .lp-nav-in{padding:0 24px;}
                .lp-nav-link,.lp-nav-login{display:none;}
                .lp-hero{grid-template-columns:1fr;padding:56px 24px 44px;gap:36px;}
                .lp-hero-art{display:none;}
                .lp-h1{font-size:36px;}
                .lp-hero-sub{font-size:16px;}
                .lp-sec{padding:52px 24px;}
                .lp-fg{grid-template-columns:1fr;}
                .lp-how{grid-template-columns:1fr;gap:36px;}
                .lp-cta-wrap{padding:0 24px 64px;}
                .lp-cta{padding:48px 28px;}
                .lp-cta-t{font-size:26px;}
                .lp-foot{padding:20px 24px;flex-direction:column;text-align:center;}
            }
        `}</style>

        <div className="lp">
            {/* ── Nav ── */}
            <nav className="lp-nav">
                <div className="lp-nav-in">
                    <Link to="/" className="lp-logo">
                        <div className="lp-logo-box">🌿</div>
                        <span className="lp-logo-txt">Serenity AI</span>
                    </Link>
                    <div className="lp-nav-r">
                        <a href="#features" className="lp-nav-link">Features</a>
                        <a href="#how"       className="lp-nav-link">How It Works</a>
                        <a href="#cta"       className="lp-nav-link">Resources</a>
                        <Link to="/login"    className="lp-nav-login">Login</Link>
                        <Link to="/register" className="lp-nav-cta">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <div className="lp-hero">
                <div className="lp-hero-l">
                    <h1 className="lp-h1">Your Digital<br/>Sanctuary for<br/>Mental Well-being</h1>
                    <p className="lp-hero-sub">Experience personalized AI-driven support designed to bring calm and clarity to your daily life.</p>
                    <Link to="/register" className="lp-hero-btn">Start Your Journey →</Link>
                </div>
                <div className="lp-hero-art">
                  <img
        src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
        alt="Mental wellness"
        style={{
            width: '100%',
            height: '800px',
            objectFit: 'cover',
            borderRadius: 22,
            boxShadow: '0 12px 50px rgba(0,0,0,0.12)',
            display: 'block',
            aspectRatio: '1',
            animation: 'artIn 0.8s ease 0.3s both',
        }}
    />
                </div>
            </div>

            {/* ── Features ── */}
            <div id="features" className="lp-sec" style={{ paddingTop: 0 }}>
                <span className="lp-badge">Features</span>
                <h2 className="lp-stitle">Features Designed for Peace of Mind</h2>
                <p className="lp-ssub">Our tools are built to support your emotional health with privacy and compassion at the core.</p>
                <div className="lp-fg">
                    {FEATURES.map((f, i) => (
                        <div key={i} className={`lp-fc ${f.dark ? 'dark' : ''}`} style={{ background: f.bg }}>
                            <div className="lp-fi" style={{ background: f.dark ? 'rgba(255,255,255,0.18)' : '#f3f4f6' }}>{f.icon}</div>
                            <p className="lp-ft" style={{ color: f.dark ? 'white' : '#111827' }}>{f.title}</p>
                            <p className="lp-fd" style={{ color: f.dark ? 'rgba(255,255,255,0.75)' : '#6b7280' }}>{f.desc}</p>
                            {f.preview === 'bars' && (
                                <div className="lp-bars">
                                    {[35,55,42,72,50,78,62].map((h, j) => (
                                        <div key={j} className="lp-bar" style={{ height:`${h}%`, background:'#10b981', opacity: 0.6 + j * 0.06 }} />
                                    ))}
                                </div>
                            )}
                            {f.preview === 'chat' && (
                                <div style={{ marginTop: 'auto' }}>
                                    <div className="lp-cb">I noticed you've been focusing on mindfulness…</div>
                                    <div className="lp-ci">I'm feeling overwhelmed today…</div>
                                </div>
                            )}
                            {f.preview === 'sun' && (
                                <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 36, opacity: 0.7 }}>☀️</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── How It Works ── */}
            <div id="how" className="lp-sec" style={{ paddingTop: 0 }}>
                <div className="lp-how">
                    <div>
                        <span className="lp-badge">Process</span>
                        <h2 className="lp-stitle">How Serenity AI<br/>Supports You</h2>
                        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 340, marginTop: 12 }}>
                            We provide a structured yet gentle path toward emotional balance through three core stages.
                        </p>
                    </div>
                    <div className="lp-steps">
                        {STEPS.map((step, i) => (
                            <div key={i} className="lp-step">
                                <div className="lp-snum" style={{ background: step.color }}>{step.num}</div>
                                <div>
                                    <p className="lp-st">{step.title}</p>
                                    <p className="lp-sd">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CTA ── */}
            <div id="cta" className="lp-cta-wrap">
                <div className="lp-cta">
                    <p className="lp-cta-t">Ready to find your calm?</p>
                    <p className="lp-cta-s">Join thousands of others in the Serenity AI community today.</p>
                    <Link to="/register" className="lp-cta-btn">Create Free Account</Link>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="lp-foot">
                <span className="lp-foot-copy">© 2025 Serenity AI. All rights reserved.</span>
                <div className="lp-foot-links">
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/crisis">Crisis Help</Link>
                    <Link to="/dashboard">Dashboard</Link>
                </div>
            </div>
        </div>
        </>
    );
}