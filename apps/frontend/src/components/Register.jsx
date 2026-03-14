import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

export default function Register() {
    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [error, setError]       = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/register', { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');

            * { box-sizing: border-box; margin: 0; padding: 0; }

            .rg-root {
                width: 100vw; min-height: 100vh;
                background: linear-gradient(135deg, #e8f5f0 0%, #f0fdf4 40%, #f5f3ff 80%, #eef2ff 100%);
                display: flex; align-items: center; justify-content: center;
                font-family: 'DM Sans', sans-serif; padding: 24px;
                position: relative; overflow: hidden;
            }
            .rg-root::before {
                content: ''; position: absolute; inset: 0; pointer-events: none;
                background:
                    radial-gradient(ellipse at 15% 30%, rgba(16,185,129,0.12) 0%, transparent 55%),
                    radial-gradient(ellipse at 85% 70%, rgba(99,102,241,0.1) 0%, transparent 55%);
            }

            /* ── Card container ── */
            .rg-card {
                display: grid; grid-template-columns: 1fr 1fr;
                background: white; border-radius: 28px; overflow: hidden;
                width: 100%; max-width: 900px;
                box-shadow: 0 20px 80px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05);
                position: relative; z-index: 1;
                animation: cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
            }
            @keyframes cardIn { from { opacity:0; transform:scale(0.96) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }

            /* ── Left panel ── */
            .rg-left {
                background: linear-gradient(160deg, #f0fdf4 0%, #e0f7ef 50%, #e8effe 100%);
                padding: 44px 40px;
                display: flex; flex-direction: column; justify-content: space-between;
                position: relative; overflow: hidden; min-height: 560px;
            }

            /* decorative blobs */
            .rg-blob {
                position: absolute; border-radius: 50%;
                pointer-events: none;
            }
            .rg-blob-1 {
                width: 280px; height: 280px;
                background: rgba(167,139,250,0.2);
                bottom: 60px; left: 50%; transform: translateX(-50%);
            }
            .rg-blob-2 {
                width: 100px; height: 200px;
                background: linear-gradient(160deg, #6ee7b7, #10b981);
                bottom: 60px; left: 50%; transform: translateX(-30%);
                border-radius: 50% 50% 40% 40%;
                opacity: 0.85;
            }

            .rg-left-logo { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 32px; }
            .rg-left-logo-icon { font-size: 20px; }

            .rg-left-title {
                font-family: 'Bricolage Grotesque', sans-serif;
                font-size: 38px; font-weight: 800; color: #111827;
                line-height: 1.2; letter-spacing: -0.9px; margin-bottom: 20px;
            }
            .rg-left-title em { font-style: normal; color: #5046e5; }

            .rg-left-desc { font-size: 14px; color: '#6b7280'; line-height: 1.7; margin: 0; max-width: 280px; }

            /* Privacy card */
            .rg-privacy {
                background: white; border-radius: 16px; padding: 14px 16px;
                display: flex; align-items: center; gap: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #f3f4f6;
                position: relative; z-index: 1;
            }
            .rg-privacy-icon { width: 36px; height: 36px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; color: white; }
            .rg-privacy-title { font-size: 13px; font-weight: 700; color: '#111827'; margin: 0 0 2px; }
            .rg-privacy-sub   { font-size: 12px; color: '#6b7280'; margin: 0; line-height: 1.5; }

            /* ── Right panel — form ── */
            .rg-right {
                padding: 44px 44px 36px;
                display: flex; flex-direction: column; justify-content: center;
            }

            .rg-form-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800; color: '#111827'; margin: 0 0 6px; letter-spacing: -0.5px; }
            .rg-form-sub   { font-size: 14px; color: '#6b7280'; margin: 0 0 28px; line-height: 1.6; }

            .rg-field { margin-bottom: 18px; }
            .rg-label { display: block; font-size: 13px; font-weight: 600; color: '#374151'; margin-bottom: 8px; }

            .rg-input {
                width: 100%; padding: 13px 16px;
                background: #f3f4f6; border: 1.5px solid transparent;
                border-radius: 14px; font-size: 14px; color: '#111827';
                outline: none; font-family: 'DM Sans', sans-serif;
                transition: border-color 0.2s, background 0.2s;
            }
            .rg-input:focus { border-color: #6366f1; background: white; }
            .rg-input::placeholder { color: '#9ca3af'; }

            .rg-pw-wrap { position: relative; }
            .rg-pw-toggle {
                position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                background: none; border: none; cursor: pointer; font-size: 18px;
                color: '#9ca3af'; padding: 0; line-height: 1;
            }

            .rg-err {
                background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
                padding: 10px 14px; border-radius: 10px; font-size: 13px;
                margin-bottom: 16px; animation: shake 0.4s ease;
            }
            @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }

            .rg-btn {
                width: 100%; padding: 14px;
                background: #5046e5; color: white;
                border: none; border-radius: 14px;
                font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif;
                cursor: pointer; transition: all 0.2s;
                box-shadow: 0 4px 16px rgba(80,70,229,0.38);
                margin-bottom: 20px; letter-spacing: 0.01em;
            }
            .rg-btn:hover:not(:disabled) { background: #4338ca; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(80,70,229,0.48); }
            .rg-btn:disabled { background: #c7d2fe; box-shadow: none; cursor: not-allowed; transform: none; }

            .rg-login-row { text-align: center; font-size: 14px; color: '#6b7280'; margin-bottom: 24px; }
            .rg-login-row a { color: #5046e5; font-weight: 700; text-decoration: none; }
            .rg-login-row a:hover { text-decoration: underline; }

            /* Trust indicators */
            .rg-trust { border-top: 1px solid #f3f4f6; padding-top: 18px; text-align: center; }
            .rg-trust-lbl { font-size: 10px; font-weight: 700; color: '#9ca3af'; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px; }
            .rg-trust-icons { display: flex; justify-content: center; gap: 24px; }
            .rg-trust-icon { font-size: 20px; opacity: 0.45; }

            @media (max-width: 700px) {
                .rg-card { grid-template-columns: 1fr; }
                .rg-left { display: none; }
                .rg-right { padding: 36px 28px; }
            }
        `}</style>

        <div className="rg-root">
            <div className="rg-card">
                {/* ── Left Panel ── */}
                <div className="rg-left">
                    <div>
                        <div className="rg-left-logo">
                            <span className="rg-left-logo-icon">🌿</span>
                            Serenity AI
                        </div>

                        <h1 className="rg-left-title">
                            A space for<br/>
                            <em>your mind</em> to<br/>
                            breathe.
                        </h1>

                        <p className="rg-left-desc" style={{fontSize:14,color:'#6b7280',lineHeight:1.7,maxWidth:280}}>
                            Experience a clinical-grade AI companion designed to provide the emotional support you deserve, whenever you need it.
                        </p>
                    </div>

                    {/* Decorative art */}
                    <div className="rg-blob rg-blob-1" />
                    <div className="rg-blob rg-blob-2" />

                    {/* Privacy card */}
                    <div className="rg-privacy">
                        <div className="rg-privacy-icon">🛡️</div>
                        <div>
                            <p className="rg-privacy-title" style={{fontSize:13,fontWeight:700,color:'#111827',margin:'0 0 2px'}}>Privacy First</p>
                            <p className="rg-privacy-sub" style={{fontSize:12,color:'#6b7280',margin:0,lineHeight:1.5}}>Your data is encrypted and never shared with third parties.</p>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="rg-right">
                    <h2 className="rg-form-title" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:'#111827',margin:'0 0 6px',letterSpacing:'-0.5px'}}>
                        Join Your Digital Sanctuary
                    </h2>
                    <p className="rg-form-sub" style={{fontSize:14,color:'#6b7280',margin:'0 0 28px',lineHeight:1.6}}>
                        Begin your journey towards mental clarity and emotional wellbeing.
                    </p>

                    {error && <div className="rg-err">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="rg-field">
                            <label className="rg-label" style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>Full Name</label>
                            <input type="text" className="rg-input" placeholder="write you name"
                                value={name} onChange={e => setName(e.target.value)} required autoFocus />
                        </div>

                        <div className="rg-field">
                            <label className="rg-label" style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>Email Address</label>
                            <input type="email" className="rg-input" placeholder="hello@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>

                        <div className="rg-field">
                            <label className="rg-label" style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>Password</label>
                            <div className="rg-pw-wrap">
                                <input type={showPw ? 'text' : 'password'} className="rg-input"
                                    placeholder="••••••••" style={{paddingRight:44}}
                                    value={password} onChange={e => setPassword(e.target.value)} required />
                                <button type="button" className="rg-pw-toggle" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="rg-btn" disabled={isLoading}>
                            {isLoading ? 'Creating your account…' : 'Create Account'}
                        </button>
                    </form>

                    <p className="rg-login-row">
                        Already have an account? <Link to="/login">Log in</Link>
                    </p>

                    {/* Trust indicators */}
                    <div className="rg-trust">
                        <p className="rg-trust-lbl" style={{fontSize:10,fontWeight:700,color:'#9ca3af',letterSpacing:'0.1em',textTransform:'uppercase',margin:'0 0 12px',textAlign:'center'}}>
                            Trust Indicators
                        </p>
                        <div className="rg-trust-icons">
                            <span className="rg-trust-icon" title="Secure">🛡️</span>
                            <span className="rg-trust-icon" title="Encrypted">🔒</span>
                            <span className="rg-trust-icon" title="Private">🔐</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}