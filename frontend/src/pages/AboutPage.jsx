import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Custom hook for scroll-triggered animations
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || "0px 0px -50px 0px"
      }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
};

// Stats animated counter
const AnimatedCounter = ({ target, duration = 2000, isVisible }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCount(0);
      return;
    }
    let animationFrameId;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, isVisible]);

  return <>{count}</>;
};

export default function AboutPage() {
  const navigate = useNavigate();

  // Scroll reveal refs
  const [heroTagRef, heroTagVisible] = useScrollReveal();
  const [heroHeadingRef, heroHeadingVisible] = useScrollReveal();
  const [heroSubRef, heroSubVisible] = useScrollReveal();
  const [heroScrollRef, heroScrollVisible] = useScrollReveal();

  const [projLabelRef, projLabelVisible] = useScrollReveal();
  const [projHeadingRef, projHeadingVisible] = useScrollReveal();
  const [projLeftRef, projLeftVisible] = useScrollReveal();
  const [projRightRef, projRightVisible] = useScrollReveal();

  const [stackLabelRef, stackLabelVisible] = useScrollReveal();
  const [stackHeadingRef, stackHeadingVisible] = useScrollReveal();
  const [stackGridRef, stackGridVisible] = useScrollReveal({ threshold: 0.1 });

  const [teamLabelRef, teamLabelVisible] = useScrollReveal();
  const [teamHeadingRef, teamHeadingVisible] = useScrollReveal();
  const [teamGridRef, teamGridVisible] = useScrollReveal({ threshold: 0.1 });

  const [archLabelRef, archLabelVisible] = useScrollReveal();
  const [archHeadingRef, archHeadingVisible] = useScrollReveal();

  const [archStep1Ref, archStep1Visible] = useScrollReveal({ threshold: 0.4 });
  const [archStep2Ref, archStep2Visible] = useScrollReveal({ threshold: 0.4 });
  const [archStep3Ref, archStep3Visible] = useScrollReveal({ threshold: 0.4 });
  const [archStep4Ref, archStep4Visible] = useScrollReveal({ threshold: 0.4 });
  const [archStep5Ref, archStep5Visible] = useScrollReveal({ threshold: 0.4 });

  const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.3 });

  const [ctaHeadingRef, ctaHeadingVisible] = useScrollReveal();
  const [ctaSubRef, ctaSubVisible] = useScrollReveal();
  const [ctaBtnsRef, ctaBtnsVisible] = useScrollReveal();
  const [ctaFootRef, ctaFootVisible] = useScrollReveal();

  // Detect touch devices for disabling 3D tilt
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  // 3D Tilt handlers
  const handleMouseMove = (e) => {
    if (isTouchDevice) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate tilt (max 10 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
  };

  const handleMouseLeave = (e) => {
    if (isTouchDevice) return;
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
  };

  return (
    <div style={{ background: '#0a0a14', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <Navbar />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 20px rgba(99,82,221,0.3); }
          50%      { box-shadow: 0 0 50px rgba(99,82,221,0.7); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes scrollDot {
          0%   { top: 6px; opacity: 1; }
          100% { top: 24px; opacity: 0; }
        }
        
        /* Layout media queries handled with flex/grid natively where possible, but here are specific overwrites */
        @media (max-width: 768px) {
          .hero-rings { display: none !important; }
          .project-stack { flex-direction: column !important; }
          .tech-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .team-grid { grid-template-columns: 1fr !important; }
          .arch-item { display: flex !important; flex-direction: row !important; }
          .arch-left-content { text-align: left !important; padding-right: 0 !important; padding-left: 24px !important; }
          .arch-right-content { padding-left: 24px !important; }
          .arch-line { left: 24px !important; transform: none !important; }
          .stats-container { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .tech-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* 1. HERO SECTION */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Background Layers */}
        <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,82,221,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 6s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite reverse', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', zIndex: 0 }} />

        <div className="hero-rings" style={{ position: 'absolute', top: '50%', right: '8%', transform: 'translateY(-50%)', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(99,82,221,0.15)', animation: 'rotateSlow 20s linear infinite', zIndex: 0 }}>
          <div style={{ position: 'absolute', inset: '40px', border: '1px solid rgba(99,82,221,0.1)', borderRadius: '50%', animation: 'rotateSlow 15s linear infinite reverse' }} />
          <div style={{ position: 'absolute', inset: '80px', border: '1px solid rgba(99,82,221,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'glowPulse 3s ease-in-out infinite' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(99,82,221,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
        </div>

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>

          <div ref={heroTagRef} style={{ opacity: heroTagVisible ? 1 : 0, animation: heroTagVisible ? 'fadeSlideUp 0.6s ease forwards' : 'none', animationDelay: '0.1s' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,82,221,0.15)', border: '1px solid rgba(99,82,221,0.3)', color: '#a78bfa', padding: '6px 18px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '28px' }}>
              <span>🛡️</span> AI-Powered Exam Proctoring
            </div>
          </div>

          <h1 ref={heroHeadingRef} style={{ opacity: heroHeadingVisible ? 1 : 0, animation: heroHeadingVisible ? 'fadeSlideUp 0.7s ease forwards' : 'none', animationDelay: '0.2s', margin: 0 }}>
            <span style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'white', display: 'block' }}>Meet the minds behind</span>
            <span style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, background: 'linear-gradient(135deg, #6352dd, #a78bfa, #c4b5fd)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite', display: 'block', marginTop: '4px' }}>IntegriSight</span>
          </h1>

          <p ref={heroSubRef} style={{ opacity: heroSubVisible ? 1 : 0, animation: heroSubVisible ? 'fadeSlideUp 0.7s ease forwards' : 'none', animationDelay: '0.35s', fontSize: '18px', color: '#888', lineHeight: 1.8, maxWidth: '560px', margin: '20px auto 0' }}>
            Built to make online assessments trustworthy, transparent, and fair — powered by real-time AI.
          </p>

          <div ref={heroScrollRef} style={{ opacity: heroScrollVisible ? 1 : 0, animation: heroScrollVisible ? 'fadeSlideUp 0.7s ease forwards' : 'none', animationDelay: '0.5s', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
            <div style={{ width: '24px', height: '40px', border: '2px solid rgba(99,82,221,0.3)', borderRadius: '12px', position: 'relative', marginTop: '12px' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#6352dd', borderRadius: '50%', position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', animation: 'scrollDot 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROJECT OVERVIEW */}
      <section style={{ background: 'rgba(255,255,255,0.015)', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div ref={projLabelRef} style={{
            opacity: projLabelVisible ? 1 : 0, transform: projLabelVisible ? 'translateY(0)' : 'translateY(40px)', transition: projLabelVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in',
            display: 'inline-block', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '6px 18px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '16px'
          }}>
            THE PROJECT
          </div>
          <h2 ref={projHeadingRef} style={{
            opacity: projHeadingVisible ? 1 : 0, transform: projHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: projHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' : 'opacity 0.3s ease-in, transform 0.3s ease-in',
            fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: 0
          }}>
            What is IntegriSight?
          </h2>
        </div>

        <div className="project-stack" style={{ display: 'flex', maxWidth: '1100px', margin: '60px auto 0', gap: '64px' }}>

          <div ref={projLeftRef} style={{
            flex: 1, opacity: projLeftVisible ? 1 : 0, transform: projLeftVisible ? 'translateX(0)' : 'translateX(-40px)', transition: projLeftVisible ? 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.4s ease-in, transform 0.4s ease-in'
          }}>
            <div style={{ fontSize: '16px', color: '#888', lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ margin: 0 }}>
                IntegriSight is an AI-powered, real-time exam proctoring system built to uphold academic integrity in online assessments. As digital education grows, so does the need for reliable, automated exam supervision.
              </p>
              <p style={{ margin: 0 }}>
                Using React, Flask, MediaPipe, and OpenCV, IntegriSight monitors students through their webcam — detecting suspicious behaviors like gaze deviation, multiple faces, and face absence — all automatically, without requiring a human proctor to watch every screen.
              </p>
              <p style={{ margin: 0 }}>
                Proctors can create AI-generated MCQ tests, assign them to specific students, and monitor live sessions with real-time risk scoring — all from a single, beautifully designed dashboard.
              </p>
            </div>

            <div style={{ marginTop: '32px' }}>
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, title: 'Real-Time AI Monitoring', desc: 'Webcam-based face and gaze detection running every 2 seconds' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>, title: 'AI Question Generation', desc: 'Advanced open-source LLMs create tailored MCQs from a simple topic prompt' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>, title: 'Live Risk Scoring', desc: 'Dynamic 0–100 risk scores updated as violations are detected' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px',
                  opacity: projLeftVisible ? 1 : 0, transform: projLeftVisible ? 'translateY(0)' : 'translateY(32px)', transition: projLeftVisible ? `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${(i + 1) * 0.15}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${(i + 1) * 0.15}s` : 'opacity 0.3s ease-in 0s, transform 0.3s ease-in 0s'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: 'rgba(99,82,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={projRightRef} style={{
            flex: 1, opacity: projRightVisible ? 1 : 0, transform: projRightVisible ? 'translateX(0)' : 'translateX(40px)', transition: projRightVisible ? 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.4s ease-in, transform 0.4s ease-in'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(99,82,221,0.08), rgba(139,92,246,0.04))', border: '1px solid rgba(99,82,221,0.2)', borderRadius: '24px', padding: '36px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '120px', opacity: 0.04, position: 'absolute', top: '-10px', right: '-10px', pointerEvents: 'none' }}>🛡️</div>

              <div style={{ fontSize: '11px', color: '#6352dd', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '20px' }}>Built For</div>

              {[
                { num: '01', title: 'Students', desc: 'Take proctored exams with live monitoring' },
                { num: '02', title: 'Proctors', desc: 'Create tests and monitor sessions live' },
                { num: '03', title: 'Institutions', desc: 'Ensure integrity at scale automatically' }
              ].map((row, i) => (
                <div key={i} style={{ padding: '20px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontWeight: 900, background: 'linear-gradient(135deg, #6352dd, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '36px', width: '48px', textAlign: 'center' }}>
                    {row.num}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', color: 'white', fontWeight: 600 }}>{row.title}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 3. TECHNOLOGY STACK */}
      <section style={{ padding: '100px 24px', background: '#0a0a14' }}>
        <div style={{ textAlign: 'center' }}>
          <div ref={stackLabelRef} style={{ opacity: stackLabelVisible ? 1 : 0, transform: stackLabelVisible ? 'translateY(0)' : 'translateY(40px)', transition: stackLabelVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in', display: 'inline-block', background: 'rgba(99,82,221,0.1)', border: '1px solid rgba(99,82,221,0.3)', color: '#a78bfa', padding: '6px 18px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '16px' }}>
            THE STACK
          </div>
          <h2 ref={stackHeadingRef} style={{ opacity: stackHeadingVisible ? 1 : 0, transform: stackHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: stackHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: 0 }}>
            Technologies We Used
          </h2>
        </div>

        <div className="tech-grid" ref={stackGridRef} style={{ maxWidth: '900px', margin: '60px auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { icon: '⚛️', color: '#61dafb', bg: 'rgba(97,218,251,0.1)', name: 'React + Vite', cat: 'Frontend', desc: 'Component-based UI with blazing fast HMR via Vite' },
            { icon: '🔀', color: '#ca50f0', bg: 'rgba(202,80,240,0.1)', name: 'React Router', cat: 'Frontend', desc: 'Client-side routing with protected role-based routes' },
            { icon: '📊', color: '#10b981', bg: 'rgba(16,185,129,0.1)', name: 'Recharts', cat: 'Frontend', desc: 'Data visualization for violation analytics and charts' },
            { icon: '🐍', color: '#c0c0d8', bg: 'rgba(255,255,255,0.06)', name: 'Flask', cat: 'Backend', desc: 'Lightweight Python REST API serving the AI engine' },
            { icon: '👁️', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', name: 'MediaPipe', cat: 'AI / ML', desc: "Google's face mesh for real-time landmark detection" },
            { icon: '📷', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', name: 'OpenCV', cat: 'AI / ML', desc: 'Image processing for frame decoding and analysis' },
            { icon: '✨', color: '#a78bfa', bg: 'rgba(99,82,221,0.15)', name: 'Claude AI', cat: 'AI / ML', desc: 'Powers the AI MCQ generation from topic descriptions' },
            { icon: '💾', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', name: 'LocalStorage', cat: 'Data Layer', desc: 'Persistent mock data store for prototype demonstration' },
            { icon: '🐍', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', name: 'Python', cat: 'Backend', desc: 'Core language for ML pipeline and API development' }
          ].map((tech, i) => (
            <div
              key={i}
              style={{
                opacity: stackGridVisible ? 1 : 0, transform: stackGridVisible ? 'scale(1)' : 'scale(0.85)', transition: stackGridVisible ? `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease` : 'opacity 0.3s ease-in 0s, transform 0.3s ease-in 0s',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'default'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(99,82,221,0.4)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,82,221,0.15)'; e.currentTarget.style.background = 'rgba(99,82,221,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: tech.color, opacity: 0.04 }} />
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tech.bg, fontSize: '24px' }}>
                {tech.icon}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{tech.name}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tech.cat}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '10px', lineHeight: 1.6 }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TEAM SECTION */}
      <section style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center' }}>
          <div ref={teamLabelRef} style={{ opacity: teamLabelVisible ? 1 : 0, transform: teamLabelVisible ? 'translateY(0)' : 'translateY(40px)', transition: teamLabelVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in', display: 'inline-block', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '6px 18px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '16px' }}>
            THE TEAM
          </div>
          <h2 ref={teamHeadingRef} style={{ opacity: teamHeadingVisible ? 1 : 0, transform: teamHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: teamHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: 0 }}>
            The People Behind IntegriSight
          </h2>
          <div style={{ opacity: teamHeadingVisible ? 1 : 0, transform: teamHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: teamHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: '16px', color: '#666', marginTop: '12px' }}>
            Three students, one vision — to make online exams fair for everyone.
          </div>
        </div>

        <div className="team-grid" ref={teamGridRef} style={{ maxWidth: '1100px', margin: '70px auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
          {[
            {
              name: 'Rohit', role: 'AI & ML Engineer', icon: '🤖', color: '#a78bfa', colorPrimary: '#6352dd',
              gradient: 'linear-gradient(90deg, #6352dd, #a78bfa)',
              desc: 'Led the AI and Machine Learning development, implementing the real-time face detection, gaze analysis, and head pose estimation using MediaPipe and OpenCV. Also integrated the AI API for automated MCQ generation.',
              tags: ['Python', 'MediaPipe', 'OpenCV', 'Flask', 'Open-Source LLMs', 'Computer Vision', 'Machine Learning'],
              image: "/team/rohit.jpeg",
              github: "https://github.com/rohit-singh06", linkedin: "https://www.linkedin.com/in/rohit-singh-69592a293/", email: "https://mail.google.com/mail/?view=cm&fs=1&to=rohitmahargain@gmail.com"
            },
            {
              name: 'Anushka', role: 'Frontend & UI/UX Designer', icon: '🎨', color: '#f472b6', colorPrimary: '#ec4899',
              gradient: 'linear-gradient(90deg, #ec4899, #f472b6)',
              desc: 'Designed the entire visual identity of IntegriSight — from the dark-themed design system to every pixel of the UI. Also handled key frontend development, building React components, routing, and state management to bring the design to life.',
              tags: ['UI/UX Design', 'React', 'JavaScript', 'CSS', 'Design Systems', 'Frontend Integration'],
              image: "/team/anushka.jpg",
              github: "https://github.com/AnushkaDandriyal", linkedin: "https://www.linkedin.com/in/anushka-dandriyal-bb0241354/", email: "https://mail.google.com/mail/?view=cm&fs=1&to=anushkadandriyalnush43@gmail.com"
            },
            {
              name: 'Kartik', role: 'Frontend Developer', icon: '⚙️', color: '#67e8f9', colorPrimary: '#06b6d4',
              gradient: 'linear-gradient(90deg, #06b6d4, #67e8f9)',
              desc: 'Handled the frontend development and full-stack integration, building all React components, routing, state management, and connecting the Flask AI engine to the React frontend. Ensured the proctoring pipeline worked end-to-end.',
              tags: ['React', 'JavaScript', 'Vite', 'REST APIs', 'React Router', 'Frontend Integration'],

              image: "/team/kartik.jpg",

              github: "https://github.com/kartik2005-sketch", linkedin: "https://www.linkedin.com/in/kartik-mahargaine-02aa09323/", email: "https://mail.google.com/mail/?view=cm&fs=1&to=kartikmahargaine@gmail.com"
            }
          ].map((member, i) => (
            <div
              key={i}
              style={{ opacity: teamGridVisible ? 1 : 0, transform: teamGridVisible ? 'translateY(0)' : 'translateY(40px)', transition: teamGridVisible ? `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s` : 'opacity 0.3s ease-in 0s, transform 0.3s ease-in 0s', borderRadius: '24px', position: 'relative', cursor: 'default' }}
            >
              <div
                style={{ transition: 'transform 0.4s ease', height: '100%', display: 'flex', flexDirection: 'column' }}
                onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
              >
                <div style={{ height: '6px', width: '100%', background: member.gradient, borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }} />

                <div
                  className="team-card-body"
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', padding: '32px 28px 28px', flex: 1, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = member.colorPrimary + '4d'; e.currentTarget.style.boxShadow = `0 20px 60px ${member.colorPrimary}26`; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 20px', position: 'relative' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${member.colorPrimary}`, boxShadow: `0 0 0 6px ${member.colorPrimary}1a` }}>
                      <img src={member.image} alt={member.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: member.colorPrimary, border: '2px solid #0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 0, right: 0, fontSize: '14px' }}>
                      {member.icon}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>{member.name}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: member.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px' }}>{member.role}</div>
                    <div style={{ textAlign: 'left', fontSize: '14px', color: '#888', lineHeight: 1.7, marginTop: '16px' }}>{member.desc}</div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                    {member.tags.map((tag, t) => (
                      <span key={t} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: member.colorPrimary + '1a', border: `1px solid ${member.colorPrimary}40`, color: member.color, transition: 'all 0.2s', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.background = member.colorPrimary + '33'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = member.colorPrimary + '1a'; e.currentTarget.style.transform = 'none'; }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <a href={member.github} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#888' }} onMouseEnter={(e) => { e.currentTarget.style.background = member.colorPrimary + '26'; e.currentTarget.style.borderColor = member.colorPrimary + '66'; e.currentTarget.style.color = member.color; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    </a>
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#888' }} onMouseEnter={(e) => { e.currentTarget.style.background = member.colorPrimary + '26'; e.currentTarget.style.borderColor = member.colorPrimary + '66'; e.currentTarget.style.color = member.color; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </a>
                    <a href={member.email} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#888' }} onMouseEnter={(e) => { e.currentTarget.style.background = member.colorPrimary + '26'; e.currentTarget.style.borderColor = member.colorPrimary + '66'; e.currentTarget.style.color = member.color; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ARCHITECTURE / HOW IT WORKS */}
      <section style={{ padding: '100px 24px', background: '#0a0a14', position: 'relative' }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div ref={archLabelRef} style={{ opacity: archLabelVisible ? 1 : 0, transform: archLabelVisible ? 'translateY(0)' : 'translateY(40px)', transition: archLabelVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in', display: 'inline-block', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '6px 18px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '16px' }}>
            HOW IT WORKS
          </div>
          <h2 ref={archHeadingRef} style={{ opacity: archHeadingVisible ? 1 : 0, transform: archHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: archHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: 0 }}>
            The System Architecture
          </h2>
          <div style={{ opacity: archHeadingVisible ? 1 : 0, transform: archHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: archHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: '16px', color: '#666', marginTop: '12px' }}>
            From webcam frame to risk score in under 2 seconds.
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '70px auto 0', position: 'relative' }}>
          {/* Vertical Line */}
          <div className="arch-line" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #6352dd, transparent)', transform: 'translateX(-50%)', zIndex: 0 }} />

          {[
            { ref: archStep1Ref, vis: archStep1Visible, icon: '📹', title: 'Webcam Capture', desc: 'The student\'s browser captures a video frame every 2 seconds using the MediaDevices API and converts it to base64.' },
            { ref: archStep2Ref, vis: archStep2Visible, icon: '🔄', title: 'Frame Transmission', desc: 'The base64 frame is POST\'d to the Flask AI engine running locally on port 5001 via a REST API call.' },
            { ref: archStep3Ref, vis: archStep3Visible, icon: '🧠', title: 'AI Analysis', desc: 'MediaPipe\'s Face Mesh processes the frame, detecting 468 facial landmarks. Yaw and pitch ratios determine gaze direction.' },
            { ref: archStep4Ref, vis: archStep4Visible, icon: '⚠️', title: 'Violation Detection', desc: 'The engine checks for: face not visible, multiple faces, and gaze away from screen. Violations are returned as a JSON array.' },
            { ref: archStep5Ref, vis: archStep5Visible, icon: '📊', title: 'Risk Scoring & Sync', desc: 'Violations are stored in mockStore, the session\'s risk score updates (0–100), and the proctor dashboard syncs within 2 seconds.' }
          ].map((step, i) => {
            const isEven = i % 2 !== 0;
            return (
              <div key={i} className="arch-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>

                {/* Left Side Container */}
                <div className="arch-left-content" style={{ flex: 1, textAlign: 'right', paddingRight: '40px' }}>
                  {!isEven && (
                    <div ref={step.ref} style={{ display: 'inline-block', maxWidth: '320px', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', opacity: step.vis ? 1 : 0, transform: step.vis ? 'translateX(0)' : 'translateX(-40px)', transition: step.vis ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in' }}>
                      <div style={{ fontSize: '32px' }}>{step.icon}</div>
                      <div style={{ fontSize: '16px', color: 'white', fontWeight: 700, marginTop: '10px' }}>{step.title}</div>
                      <div style={{ fontSize: '14px', color: '#888', lineHeight: 1.7, marginTop: '8px' }}>{step.desc}</div>
                    </div>
                  )}
                </div>

                {/* Center Dot */}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0a0a14', border: '2px solid', borderColor: step.vis ? '#6352dd' : 'rgba(99,82,221,0.3)', boxShadow: step.vis ? '0 0 0 8px rgba(99,82,221,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.5s ease', zIndex: 2 }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#6352dd' }}>{i + 1}</span>
                </div>

                {/* Right Side Container */}
                <div className="arch-right-content" style={{ flex: 1, paddingLeft: '40px' }}>
                  {isEven && (
                    <div ref={step.ref} style={{ display: 'inline-block', maxWidth: '320px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', opacity: step.vis ? 1 : 0, transform: step.vis ? 'translateX(0)' : 'translateX(40px)', transition: step.vis ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in' }}>
                      <div style={{ fontSize: '32px' }}>{step.icon}</div>
                      <div style={{ fontSize: '16px', color: 'white', fontWeight: 700, marginTop: '10px' }}>{step.title}</div>
                      <div style={{ fontSize: '14px', color: '#888', lineHeight: 1.7, marginTop: '8px' }}>{step.desc}</div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* 6. STATS COUNTER */}
      <section ref={statsRef} style={{ padding: '80px 24px', background: 'linear-gradient(135deg, rgba(99,82,221,0.08) 0%, rgba(139,92,246,0.04) 100%)', borderTop: '1px solid rgba(99,82,221,0.15)', borderBottom: '1px solid rgba(99,82,221,0.15)' }}>
        <div className="stats-container" style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? 'scale(1)' : 'scale(0.85)', transition: statsVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in', maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
          {[
            { val: 468, suff: '+', label: 'Facial Landmarks' },
            { val: 2, suff: 's', label: 'Detection Speed' },
            { val: 3, suff: '', label: 'Team Members' },
            { val: 100, suff: '%', label: 'Open Source' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, background: 'linear-gradient(135deg, #6352dd, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                <AnimatedCounter target={stat.val} isVisible={statsVisible} />
                <span style={{ fontSize: '0.7em' }}>{stat.suff}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER CTA */}
      <section style={{ padding: '100px 24px', background: '#0a0a14', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,82,221,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '64px', display: 'block', margin: '0 auto 24px' }}>🎓</span>

          <h2 ref={ctaHeadingRef} style={{ opacity: ctaHeadingVisible ? 1 : 0, transform: ctaHeadingVisible ? 'translateY(0)' : 'translateY(40px)', transition: ctaHeadingVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: 'white', margin: 0 }}>
            Built for Integrity in Every Exam
          </h2>

          <p ref={ctaSubRef} style={{ opacity: ctaSubVisible ? 1 : 0, transform: ctaSubVisible ? 'translateY(0)' : 'translateY(40px)', transition: ctaSubVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', fontSize: '16px', color: '#666', margin: '16px auto 40px', lineHeight: 1.8 }}>
            IntegriSight demonstrates how AI can make online assessments fair, transparent, and trustworthy for everyone — students and institutions alike.
          </p>

          <div ref={ctaBtnsRef} style={{ opacity: ctaBtnsVisible ? 1 : 0, transform: ctaBtnsVisible ? 'translateY(0)' : 'translateY(40px)', transition: ctaBtnsVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #6352dd, #8b5cf6)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(99,82,221,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(99,82,221,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,82,221,0.35)'; }}
            >
              Try the Demo
            </button>
            <a
              href="https://github.com/rohit-singh06/IntegriSight"
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '12px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            >
              View on GitHub
            </a>
          </div>

          <div ref={ctaFootRef} style={{ opacity: ctaFootVisible ? 1 : 0, transform: ctaFootVisible ? 'translateY(0)' : 'translateY(40px)', transition: ctaFootVisible ? 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' : 'opacity 0.3s ease-in, transform 0.3s ease-in', marginTop: '60px' }}>
    
            <div style={{ fontSize: '12px', color: '#333', marginTop: '8px' }}>&copy; {new Date().getFullYear()} IntegriSight. Academic project. All rights reserved.</div>
          </div>
        </div>
      </section>

    </div>
  );
}
