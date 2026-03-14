import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../config/axios';

const NAV_ITEMS = [
    { to: '/dashboard',     icon: '😊', label: 'Dashboard'  },
    { to: '/journal',       icon: '📝', label: 'Journal'    },
    { to: '/sleep',         icon: '🌙', label: 'Sleep'      },
    { to: '/exercises',     icon: '🧘', label: 'Exercises'  },
    { to: '/goals',         icon: '🎯', label: 'Goals'      },
    { to: '/chat',          icon: '💬', label: 'Chat'       },
    { to: '/analytics',     icon: '📈', label: 'Analytics'  },
    { to: '/weekly-report', icon: '📊', label: 'Report'     },
    { to: '/sentiment',     icon: '🧬', label: 'Insights'   },
    { to: '/notifications', icon: '🔔', label: 'Reminders'  },
    { to: '/crisis',        icon: '🆘', label: 'Help'       },
];

const MOBILE_TABS = [
    { to: '/dashboard',  icon: '😊', label: 'Home'     },
    { to: '/journal',    icon: '📝', label: 'Journal'  },
    { to: '/chat',       icon: '💬', label: 'Chat'     },
    { to: '/analytics',  icon: '📈', label: 'Stats'    },
    { to: '/crisis',     icon: '🆘', label: 'Help'     },
];

export default function Navbar() {
    const [isOpen, setIsOpen]     = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser]         = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

  const hideOn = ['/', '/login', '/register'];
    if (hideOn.includes(location.pathname)) return null;

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    useEffect(() => {
        api.get('/auth/me').then(r => setUser(r.data.data)).catch(() => {});
    }, []);

    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        window.location.href = '/';
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const act = (to) => location.pathname === to;

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');

            .nb { position:fixed; top:0; left:0; right:0; z-index:100; height:60px; font-family:'DM Sans',sans-serif; transition:all 0.25s; }
            .nb-inner { max-width:1280px; margin:0 auto; padding:0 24px; height:100%; display:flex; align-items:center; justify-content:space-between; }

            /* logo */
            .nb-logo { display:flex; align-items:center; gap:9px; text-decoration:none; flex-shrink:0; }
            .nb-logo-box { width:32px; height:32px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#7c3aed); display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 2px 8px rgba(99,102,241,0.3); }
            .nb-logo-text { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#111827; letter-spacing:-0.4px; }

            /* desktop links */
            .nb-links { display:flex; align-items:center; gap:1px; flex:1; justify-content:center; padding:0 16px; overflow:hidden; }
            .nb-link { display:flex; align-items:center; gap:5px; padding:6px 10px; border-radius:9px; text-decoration:none; font-size:13px; font-weight:500; color:#6b7280; white-space:nowrap; transition:all 0.15s; }
            .nb-link:hover { background:#f5f5f5; color:#374151; }
            .nb-link.on { background:#ede9fe; color:#6366f1; font-weight:700; }
            .nb-link-i { font-size:13px; }

            /* right */
            .nb-r { display:flex; align-items:center; gap:7px; flex-shrink:0; }
            .nb-crisis { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:20px; text-decoration:none; font-size:12px; font-weight:700; transition:all 0.15s; }
            .nb-crisis:hover { background:#fee2e2; box-shadow:0 2px 8px rgba(220,38,38,0.15); }
            .nb-ib { width:35px; height:35px; border-radius:10px; background:#f9fafb; border:1px solid #f3f4f6; display:flex; align-items:center; justify-content:center; text-decoration:none; font-size:16px; transition:all 0.15s; cursor:pointer; color:inherit; }
            .nb-ib:hover { background:#f3f4f6; }
            .nb-av { width:35px; height:35px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#7c3aed); color:white; border:none; cursor:pointer; font-size:12px; font-weight:800; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(99,102,241,0.35); transition:all 0.15s; }
            .nb-av:hover { transform:scale(1.06); box-shadow:0 4px 12px rgba(99,102,241,0.45); }

            /* dropdown */
            .nb-dd { position:absolute; top:46px; right:0; z-index:200; background:white; border:1px solid #e5e7eb; border-radius:18px; padding:6px 0; min-width:230px; box-shadow:0 12px 40px rgba(0,0,0,0.12); animation:ddIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes ddIn { from{opacity:0;transform:scale(0.95) translateY(-8px);} to{opacity:1;transform:scale(1) translateY(0);} }
            .nb-dd-head { padding:12px 16px 10px; }
            .nb-dd-name  { font-size:14px; font-weight:700; color:#111827; margin:0 0 2px; }
            .nb-dd-email { font-size:12px; color:#9ca3af; margin:0; }
            .nb-dd-sep   { height:1px; background:#f3f4f6; margin:4px 0; }
            .nb-dd-sec   { padding:4px 8px; }
            .nb-dd-lbl   { font-size:10px; font-weight:700; color:#9ca3af; letter-spacing:0.08em; text-transform:uppercase; padding:4px 8px 2px; display:block; }
            .nb-dd-item  { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:400; color:#374151; transition:all 0.12s; cursor:pointer; width:100%; background:none; border:none; font-family:'DM Sans',sans-serif; text-align:left; }
            .nb-dd-item:hover { background:#f5f5f5; }
            .nb-dd-item.on { background:#ede9fe; color:#6366f1; font-weight:600; }
            .nb-dd-item.red { color:#dc2626; }
            .nb-dd-item.red:hover { background:#fef2f2; }
            .nb-dd-ii { font-size:15px; width:20px; text-align:center; flex-shrink:0; }

            /* mobile bar */
            .nb-mob { position:fixed; bottom:0; left:0; right:0; z-index:100; background:rgba(255,255,255,0.96); backdrop-filter:blur(14px); border-top:1px solid #f3f4f6; display:flex; align-items:center; box-shadow:0 -4px 20px rgba(0,0,0,0.07); padding-bottom:env(safe-area-inset-bottom); }
            .nb-mt { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:8px 4px 6px; text-decoration:none; position:relative; color:#9ca3af; transition:color 0.15s; }
            .nb-mt.on { color:#6366f1; }
            .nb-mt-bar { position:absolute; top:0; left:20%; right:20%; height:2.5px; border-radius:0 0 3px 3px; background:#6366f1; animation:barIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes barIn { from{transform:scaleX(0);} to{transform:scaleX(1);} }
            .nb-mt-i { font-size:20px; line-height:1; }
            .nb-mt-l { font-size:9px; font-weight:600; font-family:'DM Sans',sans-serif; letter-spacing:0.03em; }

            @media(max-width:960px) { .nb-links { display:none; } }
            @media(min-width:961px) { .nb-mob { display:none; } }
        `}</style>

        {/* ── Top bar ── */}
        <nav className="nb" style={{
            background: scrolled ? 'rgba(255,255,255,0.92)' : 'white',
            backdropFilter: scrolled ? 'blur(14px)' : 'none',
            borderBottom: '1px solid #f3f4f6',
            boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.06)' : 'none',
        }}>
            <div className="nb-inner">
                {/* Logo */}
                <Link to="/dashboard" className="nb-logo">
                    <div className="nb-logo-box">🌿</div>
                    <span className="nb-logo-text">Serenity AI</span>
                </Link>

                {/* Desktop links */}
                <div className="nb-links">
                    {NAV_ITEMS.filter(i => i.to !== '/crisis' && i.to !== '/notifications').map(item => (
                        <Link key={item.to} to={item.to} className={`nb-link ${act(item.to) ? 'on' : ''}`}>
                            <span className="nb-link-i">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Right */}
                <div className="nb-r">
                    <Link to="/crisis" className="nb-crisis">🆘 Help</Link>
                    <Link to="/notifications" className="nb-ib" title="Reminders">🔔</Link>

                    <div style={{ position: 'relative' }}>
                        <button className="nb-av" onClick={() => setIsOpen(o => !o)} title={user?.name || 'Menu'}>
                            {initials}
                        </button>

                        {isOpen && (
                            <div className="nb-dd">
                                {user && (
                                    <div className="nb-dd-head">
                                        <p className="nb-dd-name">{user.name}</p>
                                        <p className="nb-dd-email">{user.email}</p>
                                    </div>
                                )}
                                <div className="nb-dd-sep" />

                                <div className="nb-dd-sec">
                                    <span className="nb-dd-lbl">Pages</span>
                                    {NAV_ITEMS.slice(0, 6).map(item => (
                                        <Link key={item.to} to={item.to} className={`nb-dd-item ${act(item.to) ? 'on' : ''}`}>
                                            <span className="nb-dd-ii">{item.icon}</span>{item.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="nb-dd-sep" />
                                <div className="nb-dd-sec">
                                    <span className="nb-dd-lbl">More</span>
                                    {NAV_ITEMS.slice(6).map(item => (
                                        <Link key={item.to} to={item.to} className={`nb-dd-item ${act(item.to) ? 'on' : ''}`}>
                                            <span className="nb-dd-ii">{item.icon}</span>{item.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="nb-dd-sep" />
                                <div className="nb-dd-sec">
                                    <button onClick={handleLogout} className="nb-dd-item red">
                                        <span className="nb-dd-ii">👋</span> Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>

        {/* ── Mobile bottom bar ── */}
        <div className="nb-mob">
            {MOBILE_TABS.map(item => {
                const active = act(item.to);
                return (
                    <Link key={item.to} to={item.to} className={`nb-mt ${active ? 'on' : ''}`}>
                        {active && <div className="nb-mt-bar" />}
                        <span className="nb-mt-i">{item.icon}</span>
                        <span className="nb-mt-l">{item.label}</span>
                    </Link>
                );
            })}
        </div>

        {isOpen && <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />}
        <div style={{ height: 60 }} />
        </>
    );
}