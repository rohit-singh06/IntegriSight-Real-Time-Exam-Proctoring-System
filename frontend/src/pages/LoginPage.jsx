import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStore } from '../data/mockStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  const [cursorRaw, setCursorRaw] = useState({ x: 0, y: 0 });
  const rightPanelRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      setCursor({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
      setCursorRaw({ x: e.clientX, y: e.clientY });
    };
    
    const handleTouch = (e) => {
      if (e.touches[0]) {
        setCursor({
          x: e.touches[0].clientX / window.innerWidth,
          y: e.touches[0].clientY / window.innerHeight
        });
        setCursorRaw({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouch);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [role]);

  const handleDemoClick = (demoRole) => {
    setRole(demoRole);
    if (demoRole === 'student') {
      setEmail('aanya@demo.com');
      setPassword('student123');
    } else {
      setEmail('proctor@demo.com');
      setPassword('proctor123');
    }
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    setTimeout(() => {
      const store = getStore();
      
      let foundUser = null;
      if (role === 'student') {
        foundUser = store.students.find(s => s.email === email && s.password === password);
      } else {
        foundUser = store.proctors.find(p => p.email === email && p.password === password);
      }

      if (foundUser) {
        const sessionUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          ...(foundUser.role === 'student' ? { enrollmentNo: foundUser.enrollmentNo } : { subject: foundUser.subject })
        };
        
        localStorage.setItem('integrisight_user', JSON.stringify(sessionUser));
        
        if (foundUser.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/proctor/dashboard');
        }
      } else {
        setError('Invalid email or password. Please try again.');
        setIsSubmitting(false);
      }
    }, 500);
  };

  const validEmail = email.includes('@') && email.includes('.');
  const rightPanelOffset = rightPanelRef.current?.getBoundingClientRect().left || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#0a0a14', color: '#ffffff', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes shimmerText {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 20px) scale(0.97); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, -20px) scale(1.08); }
        }
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        @keyframes formEntrance {
          from { opacity: 0; transform: perspective(1200px) translateY(32px) scale(0.97); }
          to { opacity: 1; transform: perspective(1200px) translateY(0) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,82,221,0); }
          50% { box-shadow: 0 0 0 8px rgba(99,82,221,0.12); }
        }
        
        .role-btn:hover { color: #fff !important; }
        .input-wrapper:focus-within .input-icon { color: #6352dd !important; }
      `}</style>
      
      {/* LEFT PANEL */}
      {!isMobile && (
        <div style={{
          width: '45%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0d0d1f 0%, #0a0a14 60%, #0f0818 100%)'
        }}>
          {/* Layer 1 - Cursor-reactive radial glow */}
          <div style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,82,221,0.18) 0%, rgba(99,82,221,0.06) 40%, transparent 70%)',
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`,
            transition: 'left 0.8s ease, top 0.8s ease',
            pointerEvents: 'none',
            zIndex: 0
          }}></div>

          {/* Layer 2 - Static ambient blobs */}
          <div style={{
            position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,82,221,0.12), transparent 70%)', filter: 'blur(60px)',
            animation: 'float1 8s ease-in-out infinite', pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute', bottom: '-80px', right: '-80px', width: '350px', height: '350px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)', filter: 'blur(50px)',
            animation: 'float2 10s ease-in-out infinite reverse', pointerEvents: 'none'
          }}></div>

          {/* Layer 3 - Animated dot grid */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            transform: `translate(${(cursor.x - 0.5) * -8}px, ${(cursor.y - 0.5) * -8}px)`,
            transition: 'transform 0.4s ease'
          }}></div>

          {/* Layer 4 - Floating geometric shapes */}
          {/* Shape 1 */}
          <div style={{
            position: 'absolute', top: '15%', right: '10%', width: '180px', height: '180px', borderRadius: '50%',
            border: '1px solid rgba(99,82,221,0.2)', animation: 'rotateRing 25s linear infinite', zIndex: 1, pointerEvents: 'none',
            transform: `translate(${(cursor.x - 0.5) * 15}px, ${(cursor.y - 0.5) * 15}px)`, transition: 'transform 0.6s ease'
          }}>
            <div style={{ position: 'absolute', inset: '24px', border: '1px solid rgba(99,82,221,0.12)', borderRadius: '50%', animation: 'rotateRing 18s linear infinite reverse' }}></div>
          </div>
          {/* Shape 2 */}
          <div style={{
            position: 'absolute', top: '60%', left: '15%', width: '8px', height: '8px', borderRadius: '50%',
            background: '#6352dd', boxShadow: '0 0 20px rgba(99,82,221,0.8), 0 0 40px rgba(99,82,221,0.4)',
            animation: 'orbPulse 3s ease-in-out infinite', zIndex: 1, pointerEvents: 'none'
          }}></div>
          {/* Shape 3 */}
          <div style={{
            position: 'absolute', bottom: '20%', left: '8%', width: '100px', height: '100px', borderRadius: '50%',
            border: '1px solid rgba(167,139,250,0.15)', animation: 'rotateRing 20s linear infinite', zIndex: 1, pointerEvents: 'none'
          }}></div>
          {/* Shape 4 */}
          <div style={{
            position: 'absolute', top: '25%', right: '25%', width: '5px', height: '5px', borderRadius: '50%',
            background: '#a78bfa', boxShadow: '0 0 12px rgba(167,139,250,0.9)',
            animation: 'orbPulse 4s ease-in-out infinite 1s', zIndex: 1, pointerEvents: 'none'
          }}></div>
          {/* Shape 5 */}
          <div style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '260px', height: '260px',
            opacity: 0.04, animation: 'rotateRing 40s linear infinite', zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', stroke: '#6352dd', strokeWidth: 1, fill: 'none' }}>
              <polygon points="50 1 93 25 93 75 50 99 7 75 7 25" />
            </svg>
          </div>

          {/* Layer 5 - Panel content */}
          <div style={{
            position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', height: '100%', padding: '48px 52px', boxSizing: 'border-box'
          }}>
            {/* Top section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #6352dd, #8b5cf6)',
                boxShadow: '0 8px 32px rgba(99,82,221,0.4), 0 0 0 1px rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', color: 'white' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', letterSpacing: '-0.02em' }}>IntegriSight</div>
            </div>

            {/* Middle section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ marginBottom: '24px', fontSize: 'clamp(36px, 3.5vw, 52px)', fontWeight: '900', lineHeight: 1.1, color: 'white', letterSpacing: '-0.03em' }}>
                <div style={{ animation: 'fadeSlideUp 0.6s ease 0.1s both' }}>Secure.</div>
                <div style={{ animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>Intelligent.</div>
                <div style={{
                  animation: 'fadeSlideUp 0.6s ease 0.3s both, shimmerText 4s linear infinite',
                  background: 'linear-gradient(135deg, #6352dd, #a78bfa, #c4b5fd)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto'
                }}>Assessments.</div>
              </div>
              
              <div style={{
                animation: 'fadeSlideUp 0.6s ease 0.4s both',
                fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '340px', marginTop: '20px'
              }}>
                AI-powered online proctoring ensuring academic integrity in real-time with comprehensive violation analytics.
              </div>

              <div style={{
                animation: 'fadeSlideUp 0.6s ease 0.5s both',
                marginTop: '36px', display: 'flex', gap: '10px', flexWrap: 'wrap'
              }}>
                {[
                  { color: '#10b981', label: 'Real-time Detection' },
                  { color: '#6352dd', label: 'AI Proctoring' },
                  { color: '#f59e0b', label: 'Risk Analytics' }
                ].map((pill, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '24px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', transition: 'all 0.2s', cursor: 'default'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(99,82,221,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(99,82,221,0.3)';
                    e.currentTarget.style.color = '#a78bfa';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pill.color, boxShadow: `0 0 8px ${pill.color}99` }}></div>
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RIGHT PANEL - LOGIN FORM */}
      <div ref={rightPanelRef} style={{
        width: isMobile ? '100%' : '55%',
        position: 'relative', overflow: 'hidden', background: '#0a0a14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '32px 24px' : '48px 32px', boxSizing: 'border-box'
      }}>
        
        {/* Cursor Spotlight */}
        {!isMobile && (
          <div style={{
            position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,82,221,0.08) 0%, rgba(99,82,221,0.03) 40%, transparent 70%)',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0,
            left: cursorRaw.x - rightPanelOffset, top: cursorRaw.y, transition: 'left 0.1s ease, top 0.1s ease'
          }}></div>
        )}

        {/* 3D TILT FORM CARD */}
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: isMobile ? '100%' : '440px',
          animation: 'formEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
          transform: !isMobile ? `perspective(1200px) rotateX(${(cursor.y - 0.5) * -4}deg) rotateY(${(cursor.x - 0.5) * 4}deg) translateZ(0)` : 'none',
          transition: 'transform 0.4s ease'
        }}>
          
          {/* Header */}
          <div style={{ marginBottom: '36px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', animation: 'fadeSlideUp 0.5s ease 0.1s both' }}>Welcome back</div>
                <div style={{ fontSize: '14px', color: '#888', marginTop: '6px', animation: 'fadeSlideUp 0.5s ease 0.2s both' }}>Enter your credentials to access your portal</div>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,82,221,0.12)', border: '1px solid rgba(99,82,221,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'glowPulse 3s ease-in-out infinite'
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#6352dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Role Toggle */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '4px', gap: '4px', position: 'relative', marginBottom: '28px',
            animation: 'fadeSlideUp 0.5s ease 0.25s both'
          }}>
            <div style={{
              position: 'absolute', height: 'calc(100% - 8px)', width: 'calc(50% - 4px)',
              background: 'linear-gradient(135deg, #6352dd, #8b5cf6)', borderRadius: '9px', top: '4px',
              boxShadow: '0 4px 16px rgba(99,82,221,0.3)', transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              left: role === 'student' ? '4px' : 'calc(50%)', pointerEvents: 'none'
            }}></div>
            
            <button
              type="button"
              className="role-btn"
              onClick={() => setRole('student')}
              style={{
                flex: 1, height: '40px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', position: 'relative', zIndex: 1, transition: 'color 0.25s ease',
                color: role === 'student' ? 'white' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '14px', marginRight: '6px' }}>🎓</span> Student
            </button>
            <button
              type="button"
              className="role-btn"
              onClick={() => setRole('proctor')}
              style={{
                flex: 1, height: '40px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', position: 'relative', zIndex: 1, transition: 'color 0.25s ease',
                color: role === 'proctor' ? 'white' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '14px', marginRight: '6px' }}>🔍</span> Proctor
            </button>
          </div>

          <form onSubmit={handleLogin} autoComplete="off">
            
            {/* Email Field */}
            <div className="input-wrapper" style={{ marginBottom: '20px', animation: 'fadeSlideUp 0.5s ease 0.3s both' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', letterSpacing: '0.01em' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', color: '#555', transition: 'color 0.2s ease' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="off"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${validEmail ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: validEmail ? '0 0 0 4px rgba(16,185,129,0.1)' : 'none',
                    borderRadius: '12px', color: 'white', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none'
                  }}
                  onFocus={(e) => { 
                    if (!validEmail) {
                      e.target.style.borderColor = '#6352dd'; 
                      e.target.style.background = 'rgba(99,82,221,0.06)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99,82,221,0.12)';
                    }
                  }}
                  onBlur={(e) => { 
                    if (!validEmail) {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)'; 
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {/* Right animated checkmark */}
                <div style={{
                  position: 'absolute', right: '14px', top: '50%', transform: `translateY(-50%) ${validEmail ? 'scale(1)' : 'scale(0.5)'}`,
                  width: '18px', height: '18px', opacity: validEmail ? 1 : 0, transition: 'all 0.2s'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="input-wrapper" style={{ marginBottom: '20px', animation: 'fadeSlideUp 0.5s ease 0.35s both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', display: 'block', letterSpacing: '0.01em' }}>
                  Password
                </label>
                <div style={{ fontSize: '13px', color: '#6352dd', cursor: 'pointer', transition: 'color 0.2s ease' }} 
                     onMouseOver={(e) => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.textDecoration = 'underline'; }}
                     onMouseOut={(e) => { e.currentTarget.style.color = '#6352dd'; e.currentTarget.style.textDecoration = 'none'; }}>
                  Forgot password?
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', color: '#555', transition: 'color 0.2s ease' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                {/* Notice I added a simple state toggle logic placeholder for type="password" to keep code concise, if they click the eye icon later.
                    But I will use hardcoded type='password' for now with a button that toggles a state */}
                {(() => {
                  const [showPassword, setShowPassword] = useState(false);
                  return (
                    <>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '14px 44px', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none'
                        }}
                        onFocus={(e) => { 
                          e.target.style.borderColor = '#6352dd'; 
                          e.target.style.background = 'rgba(99,82,221,0.06)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(99,82,221,0.12)';
                        }}
                        onBlur={(e) => { 
                          e.target.style.borderColor = 'rgba(255,255,255,0.1)'; 
                          e.target.style.background = 'rgba(255,255,255,0.05)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#a78bfa'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#555'}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', color: '#555' }}>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', color: '#555' }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                marginTop: '-12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 14px', background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.25)',
                borderRadius: '10px', color: '#e05c5c', fontSize: '13px', animation: 'shakeError 0.4s ease, fadeSlideUp 0.3s ease'
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', height: '52px', borderRadius: '12px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '15px', fontWeight: '700', letterSpacing: '0.01em', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #6352dd 0%, #8b5cf6 100%)', color: 'white',
                boxShadow: isSubmitting ? '0 2px 12px rgba(99,82,221,0.3)' : '0 4px 24px rgba(99,82,221,0.35), 0 1px 0 rgba(255,255,255,0.1) inset',
                transition: 'all 0.2s', animation: 'fadeSlideUp 0.5s ease 0.4s both',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
              onMouseOver={(e) => {
                if(!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,82,221,0.5), 0 1px 0 rgba(255,255,255,0.1) inset';
                }
              }}
              onMouseOut={(e) => {
                if(!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,82,221,0.35), 0 1px 0 rgba(255,255,255,0.1) inset';
                }
              }}
              onMouseDown={(e) => {
                if(!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,82,221,0.3)';
                }
              }}
              onMouseUp={(e) => {
                if(!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,82,221,0.5), 0 1px 0 rgba(255,255,255,0.1) inset';
                }
              }}
            >
              {/* Shimmer Effect Pseudo using an absolute div wrapper */}
              <div style={{
                position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                transform: 'translateX(-100%)', transition: 'transform 0.4s ease', pointerEvents: 'none'
              }}
              className="btn-shimmer"
              />
              <style>{`.btn-shimmer { display: none; } button:hover .btn-shimmer { display: block; animation: shimmerRun 0.6s ease forwards; } @keyframes shimmerRun { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>

              {isSubmitting ? (
                <>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }}></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in to {role === 'student' ? 'Student' : 'Proctor'} Portal</span>
              )}
            </button>
          </form>



        </div>
      </div>
    </div>
  );
}
