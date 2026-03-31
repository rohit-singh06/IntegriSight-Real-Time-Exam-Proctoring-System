// Navbar.jsx
// main navigation across the app
// adapts based on whether user is student or proctor

import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  // using useLocation instead of window.location so active states 
  // actually re-render when the route changes
  const location = useLocation();
  const userStr = localStorage.getItem('integrisight_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // TODO: add a hamburger menu for mobile devices eventually
  //   navbar gets cramped on tiny screens

  const handleSignOut = () => {
    localStorage.removeItem('integrisight_user');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const activeLink = {
    color: '#fff',
    borderBottom: '2px solid #6352dd',
    fontWeight: '500'
  };

  const inactivePathStyle = {
    color: '#888899',
    borderBottom: '2px solid transparent',
    fontWeight: '500',
    transition: 'color 0.2s',
  };

  const navItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    padding: '0 16px',
    textDecoration: 'none',
    ...(location.pathname.startsWith(path) && path !== '/proctor/dashboard' && path !== '/student/dashboard' && path !== '/about' ? activeLink : 
       (location.pathname === path ? activeLink : inactivePathStyle))
  });

  if (!user) {
    return (
      <div style={{
        height: '60px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6352dd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
            IntegriSight
          </span>
        </div>

        {/* Center: Nav Links */}
        <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
          <Link to="/about" style={navItemStyle('/about')}
                onMouseOver={(e) => { if(location.pathname !== '/about') e.target.style.color = '#c0c0d8'; }}
                onMouseOut={(e) => { if(location.pathname !== '/about') e.target.style.color = '#888899'; }}>
            About
          </Link>
        </div>

        {/* Right: Sign In */}
        <button 
          onClick={() => navigate('/login')}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer', padding: '6px 16px', borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '60px',
      background: 'rgba(255,255,255,0.03)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      {/* ─── left side ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6352dd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
          IntegriSight
        </span>
      </div>

      {/* ─── center links ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <Link to="/about" style={navItemStyle('/about')}
              onMouseOver={(e) => { if(location.pathname !== '/about') e.target.style.color = '#c0c0d8'; }}
              onMouseOut={(e) => { if(location.pathname !== '/about') e.target.style.color = '#888899'; }}>
          About
        </Link>
        {user.role === 'student' ? (
          <>
            <Link to="/student/dashboard" style={navItemStyle('/student/dashboard')}
                  onMouseOver={(e) => { if(location.pathname !== '/student/dashboard') e.target.style.color = '#c0c0d8'; }}
                  onMouseOut={(e) => { if(location.pathname !== '/student/dashboard') e.target.style.color = '#888899'; }}>
              Dashboard
            </Link>
            <Link to="/student" style={navItemStyle('/student')} 
                  onMouseOver={(e) => { if(!location.pathname.startsWith('/student') || location.pathname === '/student/dashboard') e.target.style.color = '#c0c0d8'; }}
                  onMouseOut={(e) => { if(!location.pathname.startsWith('/student') || location.pathname === '/student/dashboard') e.target.style.color = '#888899'; }}>
              My Tests
            </Link>
          </>
        ) : (
          <>
            <Link to="/proctor/dashboard" style={navItemStyle('/proctor/dashboard')}
                  onMouseOver={(e) => { if(location.pathname !== '/proctor/dashboard') e.target.style.color = '#c0c0d8'; }}
                  onMouseOut={(e) => { if(location.pathname !== '/proctor/dashboard') e.target.style.color = '#888899'; }}>
              Dashboard
            </Link>
            <Link to="/proctor/create-test" style={navItemStyle('/proctor/create-test')}
                  onMouseOver={(e) => { if(location.pathname !== '/proctor/create-test') e.target.style.color = '#c0c0d8'; }}
                  onMouseOut={(e) => { if(location.pathname !== '/proctor/create-test') e.target.style.color = '#888899'; }}>
              Create Test
            </Link>
          </>
        )}
      </div>

      {/* ─── user profile right ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', background: '#6352dd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#fff'
          }}>
            {getInitials(user.name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{user.name}</span>
            <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '600', letterSpacing: '0.05em' }}>
              {user.role.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>

        <button 
          onClick={handleSignOut}
          style={{
            background: 'transparent', border: 'none', color: '#888899', fontSize: '13px',
            fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#e05c5c'}
          onMouseOut={(e) => e.currentTarget.style.color = '#888899'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          Sign Out
        </button>
      </div>

    </div>
  );
}
