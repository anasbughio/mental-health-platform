import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';

export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/login', { email, password });
          window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');

            * { box-sizing: border-box; margin: 0; padding: 0; }

            .lg-root {
                width: 100vw; min-height: 100vh;
                background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 30%, #f0fdf4 70%, #d1fae5 100%);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'DM Sans', sans-serif; padding: 20px;
                position: relative; overflow: hidden;
            }

            /* subtle noise texture via radial gradients */
            .lg-root::before {
                content: ''; position: absolute; inset: 0;
                background:
                    radial-gradient(ellipse at 10% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
                    radial-gradient(ellipse at 90% 80%, rgba(16,185,129,0.1) 0%, transparent 50%);
                pointer-events: none;
            }

            /* top-left logo */
            .lg-logo {
                position: fixed; top: 20px; left: 28px;
                display: flex; align-items: center; gap: 8px;
                font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: #374151;
                text-decoration: none; z-index: 10;
            }
            .lg-logo-icon { font-size: 22px; }

            /* card */
            .lg-card {
                background: white; border-radius: 24px;
                padding: 44px 48px 40px;
                width: 100%; max-width: 420px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
                position: relative; z-index: 1;
                animation: cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
            }
            @keyframes cardIn { from { opacity:0; transform:scale(0.95) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }

            .lg-title {
                font-family: 'Bricolage Grotesque', sans-serif;
                font-size: 32px; font-weight: 800; color: #111827;
                margin: 0 0 10px; letter-spacing: -0.7px; line-height: 1.2;
            }
            .lg-sub {
                font-size: 14px; color: #6b7280; line-height: 1.65;
                margin: 0 0 32px; max-width: 300px;
            }

            /* fields */
            .lg-field { margin-bottom: 20px; }
            .lg-field-head {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 8px;
            }
            .lg-label { font-size: 13px; font-weight: 600; color: '#374151'; }
            .lg-forgot { font-size: 13px; font-weight: 600; color: '#6366f1'; text-decoration: none; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
            .lg-forgot:hover { text-decoration: underline; }

            .lg-input {
                width: 100%; padding: 13px 16px;
                background: #f3f4f6; border: 1.5px solid transparent;
                border-radius: 12px; font-size: 14px; color: #111827;
                outline: none; font-family: 'DM Sans', sans-serif;
                transition: border-color 0.2s, background 0.2s;
            }
            .lg-input:focus { border-color: #6366f1; background: white; }
            .lg-input::placeholder { color: #9ca3af; }

            /* error */
            .lg-err {
                background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
                padding: 10px 14px; border-radius: 10px; font-size: 13px;
                margin-bottom: 16px; animation: shake 0.4s ease;
            }
            @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }

            /* submit */
            .lg-btn {
                width: 100%; padding: 14px;
                background: #5046e5;
                color: white; border: none; border-radius: 12px;
                font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif;
                cursor: pointer; transition: all 0.2s;
                box-shadow: 0 4px 16px rgba(80,70,229,0.4);
                margin-bottom: 28px; letter-spacing: 0.01em;
            }
            .lg-btn:hover:not(:disabled) { background: #4338ca; box-shadow: 0 6px 22px rgba(80,70,229,0.5); transform: translateY(-1px); }
            .lg-btn:disabled { background: #c7d2fe; box-shadow: none; cursor: not-allowed; transform: none; }

            /* register link */
            .lg-register { text-align: center; font-size: 14px; color: #6b7280; }
            .lg-register a { color: #5046e5; font-weight: 700; text-decoration: none; }
            .lg-register a:hover { text-decoration: underline; }

            /* privacy banner */
            .lg-privacy {
                position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
                background: rgba(209,250,229,0.92); backdrop-filter: blur(8px);
                border: 1px solid #a7f3d0; border-radius: 20px;
                padding: 12px 20px; display: flex; align-items: center; gap: 12px;
                max-width: 420px; width: calc(100% - 40px);
                box-shadow: 0 4px 20px rgba(0,0,0,0.06); z-index: 10;
                animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
            }
            @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
            .lg-privacy-icon {
                width: 34px; height: 34px; border-radius: 50%;
                background: #10b981; color: white;
                display: flex; align-items: center; justify-content: center;
                font-size: 15px; flex-shrink: 0;
            }
            .lg-privacy-text { font-size: 12px; color: #065f46; line-height: 1.5; }
        `}</style>

        {/* Logo */}
        <Link to="/" className="lg-logo">
            <span className="lg-logo-icon">🌿</span>
            Serenity AI
        </Link>

        <div className="lg-root">
            <div className="lg-card">
                <h1 className="lg-title">Welcome back.</h1>
                <p className="lg-sub">Your space for mind to breathe. Take a moment to reconnect with your serenity.</p>

                {error && <div className="lg-err">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="lg-field">
                        <div className="lg-field-head">
                            <label className="lg-label" style={{fontSize:13,fontWeight:600,color:'#374151'}}>Email Address</label>
                        </div>
                        <input
                            type="email" className="lg-input"
                            placeholder="name@example.com"
                            value={email} onChange={e => setEmail(e.target.value)}
                            required autoFocus />
                    </div>

                    <div className="lg-field">
                        <div className="lg-field-head">
                            <label className="lg-label" style={{fontSize:13,fontWeight:600,color:'#374151'}}>Password</label>
                          
                        </div>
                        <input
                            type="password" className="lg-input"
                            placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)}
                            required />
                    </div>

                    <button type="submit" className="lg-btn" disabled={isLoading}>
                        {isLoading ? 'Signing in…' : 'Log In'}
                    </button>
                </form>

                <p className="lg-register">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>

        {/* Privacy banner */}
        <div className="lg-privacy">
            <div className="lg-privacy-icon">🔒</div>
            <p className="lg-privacy-text">Your privacy is our priority. Your sessions and data are encrypted and only accessible by you.</p>
        </div>
        </>
    );
}