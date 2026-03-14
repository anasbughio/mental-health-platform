import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../config/axios';

const NAV_ITEMS = [
    { to: '/dashboard',     icon: '😊', label: 'Mood'       },
    { to: '/journal',       icon: '📝', label: 'Journal'    },
    { to: '/sleep',         icon: '🌙', label: 'Sleep'      },
    { to: '/exercises',     icon: '🧘', label: 'Exercises'  },
    { to: '/goals',         icon: '🎯', label: 'Goals'      },
    { to: '/chat',          icon: '💬', label: 'Chat'       },
    { to: '/analytics',     icon: '📈', label: 'Analytics'  },
    { to: '/weekly-report', icon: '📊', label: 'Report'     },
    { to: '/sentiment',     icon: '🧬', label: 'Insights'   },
    { to: '/crisis',        icon: '🆘', label: 'Help'       },
];

export default function Navbar() {
    const [isOpen, setIsOpen]     = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser]         = useState(null);
    const location  = useLocation();
    const navigate  = useNavigate();

    // Hide navbar on auth pages
    const hideOn = ['/login', '/register'];
    if (hideOn.includes(location.pathname)) return null;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        api.get('/auth/me')
            .then(res => setUser(res.data.data))
            .catch(() => {});
    }, []);

    // Close menu on route change
    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <>
            {/* ── Top Bar ── */}
            <nav style={s.nav(scrolled)}>
                <div style={s.inner}>

                    {/* Logo */}
                    <Link to="/dashboard" style={s.logo}>
                        <span style={s.logoIcon}>🧠</span>
                        <span style={s.logoText}>MindSpace</span>
                    </Link>

                    {/* Desktop links */}
                    <div style={s.desktopLinks}>
                        {NAV_ITEMS.filter(i => i.to !== '/crisis').map(item => (
                            <Link
                                key={item.to}
                                to={item.to}
                                style={s.navLink(location.pathname === item.to)}
                            >
                                <span style={{ fontSize: 14 }}>{item.icon}</span>
                                {item.label}
                                {location.pathname === item.to && <span style={s.activeDot} />}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div style={s.rightSide}>
                        {/* Crisis button — always visible */}
                        <Link to="/crisis" style={s.crisisBtn}>
                            🆘 <span style={{ display: 'none' }}>Help</span>
                        </Link>

                        {/* Notifications */}
                        <Link to="/notifications" style={s.iconBtn} title="Reminders">
                            🔔
                        </Link>

                        {/* Avatar / user menu */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsOpen(o => !o)}
                                style={s.avatar}
                                title={user?.name || 'Menu'}
                            >
                                {initials}
                            </button>

                            {/* Dropdown */}
                            {isOpen && (
                                <div style={s.dropdown}>
                                    {user && (
                                        <div style={s.dropdownHeader}>
                                            <p style={s.dropdownName}>{user.name}</p>
                                            <p style={s.dropdownEmail}>{user.email}</p>
                                        </div>
                                    )}
                                    <div style={s.dropdownDivider} />
                                    {NAV_ITEMS.map(item => (
                                        <Link key={item.to} to={item.to} style={s.dropdownItem(location.pathname === item.to)}>
                                            <span>{item.icon}</span>
                                            {item.label}
                                        </Link>
                                    ))}
                                    <div style={s.dropdownDivider} />
                                    <Link to="/notifications" style={s.dropdownItem(false)}>
                                        <span>🔔</span> Reminders
                                    </Link>
                                    <button onClick={handleLogout} style={s.logoutBtn}>
                                        <span>👋</span> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Bottom Tab Bar ── */}
            <div style={s.mobileBar}>
                {[
                    { to: '/dashboard',  icon: '😊', label: 'Mood'      },
                    { to: '/journal',    icon: '📝', label: 'Journal'   },
                    { to: '/chat',       icon: '💬', label: 'Chat'      },
                    { to: '/analytics',  icon: '📈', label: 'Stats'     },
                    { to: '/crisis',     icon: '🆘', label: 'Help'      },
                ].map(item => {
                    const active = location.pathname === item.to;
                    return (
                        <Link key={item.to} to={item.to} style={s.mobileTab(active)}>
                            <span style={{ fontSize: 20 }}>{item.icon}</span>
                            <span style={s.mobileTabLabel(active)}>{item.label}</span>
                            {active && <span style={s.mobileActiveDot} />}
                        </Link>
                    );
                })}
            </div>

            {/* Overlay to close dropdown */}
            {isOpen && (
                <div onClick={() => setIsOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
            )}

            {/* Spacer so content doesn't hide under navbar */}
            <div style={{ height: 64 }} />
        </>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    nav: (scrolled) => ({
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'white',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid #f3f4f6',
        boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'all 0.2s',
        height: 64,
    }),
    inner: {
        maxWidth: 1200, margin: '0 auto', padding: '0 20px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    logo: {
        display: 'flex', alignItems: 'center', gap: 8,
        textDecoration: 'none', flexShrink: 0,
    },
    logoIcon: { fontSize: 24 },
    logoText: {
        fontSize: 18, fontWeight: 800, color: '#111827',
        fontFamily: "'Segoe UI', sans-serif", letterSpacing: '-0.5px',
    },
    desktopLinks: {
        display: 'flex', alignItems: 'center', gap: 2,
        // Hide on mobile — show only on md+
        '@media (max-width: 768px)': { display: 'none' },
        overflow: 'hidden',
        // Use inline media query workaround via className in real use,
        // but for portability we hide via the mobileBar showing instead
    },
    navLink: (active) => ({
        display: 'flex', alignItems: 'center', gap: 5, position: 'relative',
        padding: '6px 10px', borderRadius: 8, textDecoration: 'none',
        fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? '#6366f1' : '#6b7280',
        backgroundColor: active ? '#f0f4ff' : 'transparent',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        fontFamily: "'Segoe UI', sans-serif",
    }),
    activeDot: {
        position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
        width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366f1',
    },
    rightSide: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
    crisisBtn: {
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 8,
        backgroundColor: '#fef2f2', color: '#dc2626',
        textDecoration: 'none', fontSize: 13, fontWeight: 700,
        border: '1px solid #fecaca', transition: 'all 0.15s',
        fontFamily: "'Segoe UI', sans-serif",
    },
    iconBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: '#f9fafb', border: '1px solid #f3f4f6',
        textDecoration: 'none', fontSize: 16, transition: 'all 0.15s',
    },
    avatar: {
        width: 36, height: 36, borderRadius: '50%',
        backgroundColor: '#6366f1', color: 'white',
        border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 800, fontFamily: "'Segoe UI', sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(99,102,241,0.35)',
    },
    dropdown: {
        position: 'absolute', top: 44, right: 0, zIndex: 200,
        backgroundColor: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, padding: '8px 0', minWidth: 220,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        fontFamily: "'Segoe UI', sans-serif",
    },
    dropdownHeader: { padding: '10px 16px 6px' },
    dropdownName: { margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111827' },
    dropdownEmail: { margin: 0, fontSize: 12, color: '#9ca3af' },
    dropdownDivider: { height: 1, backgroundColor: '#f3f4f6', margin: '6px 0' },
    dropdownItem: (active) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', textDecoration: 'none',
        fontSize: 13, fontWeight: active ? 700 : 400,
        color: active ? '#6366f1' : '#374151',
        backgroundColor: active ? '#f0f4ff' : 'transparent',
        transition: 'background 0.1s',
    }),
    logoutBtn: {
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 16px', background: 'none', border: 'none',
        fontSize: 13, color: '#dc2626', cursor: 'pointer',
        fontFamily: "'Segoe UI', sans-serif", textAlign: 'left',
    },

    // ── Mobile bottom bar ──
    mobileBar: {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: 'white', borderTop: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
    },
    mobileTab: (active) => ({
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2, padding: '8px 4px 6px',
        textDecoration: 'none', position: 'relative',
        color: active ? '#6366f1' : '#9ca3af', transition: 'color 0.15s',
    }),
    mobileTabLabel: (active) => ({
        fontSize: 10, fontWeight: active ? 700 : 400,
        fontFamily: "'Segoe UI', sans-serif",
    }),
    mobileActiveDot: {
        position: 'absolute', top: 4,
        width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366f1',
    },
};