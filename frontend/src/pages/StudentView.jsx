// StudentView.jsx
// main exam interface for students — handles the timer, webcam, and questions
// (a bit messy but it works)

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RiskBar from '../components/RiskBar';
import { getStore, createSession, updateSession, addViolation, saveStudentAnswer, computeAndSaveScore } from '../data/mockStore';

export default function StudentView() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const webcamIntervalRef = useRef(null);

  const [user, setUser] = useState(null);
  const [test, setTest] = useState(null);
  const [session, setSession] = useState(null);
  
  // ─── state ─────────────────────────────────────────────
  const [phase, setPhase] = useState('loading'); // gate, active, result, loading
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const [recentViolations, setRecentViolations] = useState([]);
  const [scoreData, setScoreData] = useState(null);

  // Load Data
  useEffect(() => {
    const uStr = localStorage.getItem('integrisight_user');
    if (!uStr) return navigate('/login');
    const u = JSON.parse(uStr);
    setUser(u);

    const store = getStore();
    const t = store.tests.find(x => x.id === testId);
    if (!t) return navigate('/student/dashboard');
    setTest(t);

    let sess = store.sessions.find(s => s.testId === testId && s.studentId === u.id);
    if (!sess) {
      sess = {
        id: 'sess_' + Date.now(),
        testId: testId,
        studentId: u.id,
        proctorId: t.createdBy,
        startedAt: null,
        endedAt: null,
        status: 'not_started',
        violationCount: { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 },
        totalViolations: 0,
        riskScore: 0,
        answers: {}
      };
      createSession(sess);
    }
    setSession(sess);
    setAnswers(sess.answers || {});
    
    if (sess.status === 'submitted') {
      loadResultData(sess, t);
      setPhase('result');
    } else if (sess.status === 'in_progress' && sess.startedAt) {
      setPhase('active');
      const elapsed = Math.floor((Date.now() - new Date(sess.startedAt).getTime()) / 1000);
      const remaining = (t.duration * 60) - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    } else {
      setPhase('gate');
      setTimeLeft(t.duration * 60);
    }
  }, [testId, navigate]);

  // Webcam Setup
  useEffect(() => {
    if (phase !== 'gate' && phase !== 'active') return;
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraReady(true);
        setCameraError(false);
      })
      .catch(err => {
        console.error('Webcam error:', err);
        setCameraError(true);
        setCameraReady(false);
      });

    return () => stopWebcam();
  }, [phase]);

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // ─── timers & loops ────────────────────────────────────

  // TODO: the timer logic is duplicated from somewhere else
  //   should probably extract this into a useTimer hook
  // Timer Setup (Phase 2)
  useEffect(() => {
    if (phase === 'active' && session?.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [phase, session]);

  // API Analysis Loop (Phase 2)
  useEffect(() => {
    if (phase !== 'active' || session?.status !== 'in_progress') return;

    webcamIntervalRef.current = setInterval(async () => {
      // this runs every 3s not 1s because flask can't handle faster 
      if (cameraReady && videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          console.log('frame captured, sending to api...')
          const response = await fetch('http://localhost:5001/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frame: base64Image })
          });
          if (response.ok) {
            setApiError(false);
            const result = await response.json();
            handleApiResult(result);
          } else {
            setApiError(true);
          }
        } catch (error) {
          setApiError(true);
        }
      }
    }, 3000);
    return () => clearInterval(webcamIntervalRef.current);
  }, [phase, session, cameraReady]);

  const handleApiResult = (result) => {
    if (result.violations && result.violations.length > 0) {
      // FIXME: this calculation is slightly off for edge cases
      //   but close enough for a prototype
      const nowIso = new Date().toISOString();
      const updatedSess = { ...session };
      
      const newPills = [];
      result.violations.forEach(v => {
        let severity = 'low';
        if (v === 'face_not_visible') severity = 'medium';
        if (v === 'multiple_faces') severity = 'high';

        const id = 'v_' + Date.now() + Math.random().toString(36).substr(2, 5);
        addViolation({
          id,
          sessionId: session.id,
          testId: session.testId,
          studentId: session.studentId,
          type: v,
          timestamp: nowIso,
          severity
        });

        updatedSess.violationCount[v] += 1;
        updatedSess.totalViolations += 1;
        newPills.push({ id, type: v, time: Date.now() });
      });

      updatedSess.riskScore = Math.min(100, updatedSess.totalViolations * 5);
      
      updateSession(session.id, {
        violationCount: updatedSess.violationCount,
        totalViolations: updatedSess.totalViolations,
        riskScore: updatedSess.riskScore
      });
      setSession(updatedSess);

      setRecentViolations(prev => [...prev, ...newPills].slice(-3));
    }
  };

  // Remove old violation pills
  useEffect(() => {
    if (recentViolations.length > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        setRecentViolations(prev => prev.filter(v => now - v.time < 5000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [recentViolations]);

  const handleBeginExam = () => {
    const updates = { status: 'in_progress', startedAt: new Date().toISOString() };
    updateSession(session.id, updates);
    setSession({ ...session, ...updates });
    setPhase('active');
  };

  const handleOptionSelect = (qId, idx) => {
    saveStudentAnswer(session.id, qId, idx);
    setAnswers(prev => ({...prev, [qId]: idx}));
  };

  const loadResultData = (sess, t) => {
    const totalMarks = sess.totalMarks || t.totalMarks;
    const score = sess.score || 0;
    const percent = Math.round((score / totalMarks) * 100) || 0;
    
    let grade = 'F';
    if(percent >= 90) grade = 'A+';
    else if(percent >= 80) grade = 'A';
    else if(percent >= 70) grade = 'B+';
    else if(percent >= 60) grade = 'B';
    else if(percent >= 50) grade = 'C';

    const questions = t.questions || [];
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    
    questions.forEach(q => {
      const ans = sess.answers?.[q.id];
      if (ans === undefined) unattemptedCount++;
      else if (ans === q.correct) correctCount++;
      else wrongCount++;
    });

    setScoreData({
      score,
      totalMarks,
      percentage: percent,
      grade,
      correctCount,
      wrongCount,
      unattemptedCount,
      color: percent >= 75 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#e05c5c'
    });
  };

  const handleFinalSubmit = () => {
    clearInterval(timerRef.current);
    clearInterval(webcamIntervalRef.current);
    stopWebcam();

    const score = computeAndSaveScore(session.id);
    const updates = { endedAt: new Date().toISOString(), status: 'submitted', score };
    updateSession(session.id, updates);
    
    const store = getStore();
    const finalSess = store.sessions.find(s => s.id === session.id);
    
    setSession(finalSess);
    loadResultData(finalSess, test);
    
    setShowReviewModal(false);
    setPhase('result');
  };

  if (!test || !session) return null;

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  const getTimerStyles = (secs) => {
    if (secs < 60) return { bg: 'rgba(224,92,92,0.15)', color: '#e05c5c', border: '1px solid rgba(224,92,92,0.3)', anim: 'pulse 0.5s infinite' };
    if (secs < 300) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', anim: 'pulse 1s infinite' };
    return { bg: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid transparent', anim: 'none' };
  };

  const questions = test.questions || [];
  const currentQ = questions[currentIndex];
  const timerStyles = getTimerStyles(timeLeft);
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  // Render Phases
  if (phase === 'gate') {
    return (
      <div style={{ background: '#0a0a14', minHeight: '100vh', color: '#c0c0d8', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="fade-in" style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '32px',
            width: '100%', maxWidth: '560px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', marginTop: '80px', marginBottom: '80px'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: '0 0 24px 0', textAlign: 'center' }}>{test.title}</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Subject</div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{test.subject}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Duration</div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{test.duration} mins</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Total Marks</div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{test.totalMarks}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Questions</div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{questions.length}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #6352dd', padding: '16px', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '24px', color: '#c0c0d8' }}>
              <div style={{ fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Instructions:</div>
              {test.instructions || '1. Read all questions carefully.\n2. Submit before time expires.'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '80px', height: '60px', background: '#000', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {cameraError && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(224,92,92,0.2)' }}><span style={{ color: '#e05c5c', fontSize: '20px' }}>&times;</span></div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: cameraError ? '#e05c5c' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {cameraError ? 'Camera not accessible' : 'Camera ready'}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>Required for identity verification and AI proctoring.</div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#6352dd' }} />
              <span style={{ fontSize: '13px', color: '#c0c0d8' }}>I have read and agree to the exam instructions and proctoring rules.</span>
            </label>

            <button 
              disabled={!agreed || !cameraReady}
              onClick={handleBeginExam}
              style={{
                width: '100%', padding: '14px', background: (!agreed || !cameraReady) ? 'rgba(255,255,255,0.1)' : '#6352dd',
                color: (!agreed || !cameraReady) ? 'rgba(255,255,255,0.4)' : '#fff', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '600', cursor: (!agreed || !cameraReady) ? 'not-allowed' : 'pointer', transition: '0.2s'
              }}
            >
              Begin Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div style={{ height: '100vh', background: '#0a0a14', color: '#c0c0d8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showReviewModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}>
              <div style={{ fontSize: '20px', color: 'white', fontWeight: '600' }}>Review Your Answers</div>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px', marginTop: '4px' }}>Make sure you've answered all questions before submitting.</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Total Questions</div>
                  <div style={{ fontSize: '20px', color: 'white', fontWeight: '600' }}>{questions.length}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Answered</div>
                  <div style={{ fontSize: '20px', color: answeredCount === questions.length ? '#10b981' : 'white', fontWeight: '600' }}>{answeredCount}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Unanswered</div>
                  <div style={{ fontSize: '20px', color: unansweredCount > 0 ? '#e05c5c' : '#10b981', fontWeight: '600' }}>{unansweredCount}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Time Remaining</div>
                  <div style={{ fontSize: '20px', color: 'white', fontWeight: '600' }}>{formatTime(timeLeft)}</div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Unanswered Questions:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {questions.map((q, i) => {
                      if (answers[q.id] === undefined) {
                        return (
                          <div key={q.id} onClick={() => { setShowReviewModal(false); setCurrentIndex(i); }} style={{
                            width: '30px', height: '30px', background: 'rgba(255,255,255,0.06)', color: '#888',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                          }}>
                            {i + 1}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setShowReviewModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Go Back & Review</button>
                <button onClick={handleFinalSubmit} style={{ background: '#e05c5c', border: 'none', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Submit Exam</button>
              </div>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <div style={{ height: '56px', position: 'sticky', top: 0, background: 'rgba(10,10,20,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6352dd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>IntegriSight</span>
          </div>
          <div style={{ fontSize: '15px', color: 'white', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%', textAlign: 'center' }}>
            {test.title}
          </div>
          <div style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', fontFamily: 'monospace', background: timerStyles.bg, color: timerStyles.color, border: timerStyles.border, animation: timerStyles.anim }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT SIDEBAR */}
          <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '20px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: apiError ? '#e05c5c' : '#10b981' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: apiError ? '#e05c5c' : '#10b981' }} />
                {apiError ? '⚠ API Offline' : 'Monitoring'}
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentViolations.map(v => (
                <div key={v.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s', color: v.type === 'multiple_faces' ? '#e05c5c' : '#f59e0b' }}>
                  <span>{v.type === 'gaze_away' ? '👁' : v.type === 'face_not_visible' ? '🚫' : '👥'}</span>
                  <span style={{ flex: 1 }}>{v.type.split('_').join(' ')}</span>
                  <span style={{ fontSize: '10px', color: '#666' }}>now</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* MONITORING STATS */}
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#c0c0d8' }}>👁 Gaze Away</span>
                <span style={{ fontSize: '18px', color: 'white', fontWeight: '700' }}>{session.violationCount.gaze_away}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#c0c0d8' }}>🚫 Face Hidden</span>
                <span style={{ fontSize: '18px', color: 'white', fontWeight: '700' }}>{session.violationCount.face_not_visible}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#c0c0d8' }}>👥 Multiple Faces</span>
                <span style={{ fontSize: '18px', color: 'white', fontWeight: '700' }}>{session.violationCount.multiple_faces}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Risk Score</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: session.riskScore < 31 ? '#10b981' : session.riskScore < 61 ? '#f59e0b' : '#e05c5c' }}>
                {session.riskScore}
              </div>
              <RiskBar score={session.riskScore} />
            </div>

            <button onClick={() => setShowReviewModal(true)} style={{ marginTop: 'auto', background: 'transparent', border: '1px solid rgba(224,92,92,0.4)', color: '#e05c5c', borderRadius: '8px', fontSize: '14px', height: '44px', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(224,92,92,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              Submit Exam
            </button>
          </div>

          {/* CENTER PANEL */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{ position: 'sticky', top: 0, background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(8px)', padding: '12px 0', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 5 }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Questions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {questions.map((q, i) => {
                  const isCurrent = i === currentIndex;
                  const isAnswered = answers[q.id] !== undefined;
                  let bg = 'rgba(255,255,255,0.06)';
                  let color = '#888';
                  let border = '1px solid rgba(255,255,255,0.1)';
                  if (isCurrent) {
                    bg = '#6352dd'; color = 'white'; border = 'none';
                  } else if (isAnswered) {
                    bg = 'rgba(16,185,129,0.15)'; color = '#10b981'; border = '1px solid rgba(16,185,129,0.3)';
                  }
                  return (
                    <button key={q.id} onClick={() => setCurrentIndex(i)} style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: bg, color: color, border: border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '10px', color: '#888' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#6352dd', borderRadius: '2px' }}/> Current</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}/> Answered</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#555', borderRadius: '2px' }}/> Not Answered</div>
              </div>
            </div>

            {currentQ && (
              <div key={currentQ.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#666' }}>Question {currentIndex + 1} of {questions.length}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ background: currentQ.difficulty === 'easy' ? 'rgba(16,185,129,0.15)' : currentQ.difficulty === 'hard' ? 'rgba(224,92,92,0.15)' : 'rgba(245,158,11,0.15)', color: currentQ.difficulty === 'easy' ? '#10b981' : currentQ.difficulty === 'hard' ? '#e05c5c' : '#f59e0b', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '600' }}>
                      {currentQ.difficulty}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', color: '#c0c0d8', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                      {currentQ.marks} pt
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '18px', fontWeight: '500', color: 'white', lineHeight: '1.7', margin: '16px 0 24px' }}>
                  {currentQ.question}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = answers[currentQ.id] === oIdx;
                    return (
                      <div key={oIdx} onClick={() => handleOptionSelect(currentQ.id, oIdx)} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                        background: isSelected ? 'rgba(99,82,221,0.12)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(99,82,221,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(99,82,221,0.08)' : 'none'
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? '#6352dd' : 'transparent',
                          border: isSelected ? '2px solid #6352dd' : '2px solid rgba(255,255,255,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%' }} />}
                        </div>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                          background: isSelected ? 'rgba(99,82,221,0.2)' : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#a78bfa' : '#888', fontSize: '13px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {['A','B','C','D'][oIdx]}
                        </div>
                        <div style={{ flex: 1, fontSize: '15px', color: isSelected ? 'white' : '#c0c0d8', fontWeight: isSelected ? '500' : 'normal' }}>
                          {opt}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: currentIndex === 0 ? '#555' : 'white', padding: '10px 16px', borderRadius: '8px', cursor: currentIndex === 0 ? 'default' : 'pointer' }}
              >
                &larr; Previous
              </button>
              
              <div>
                {answers[currentQ?.id] !== undefined ? (
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>&check; Answered</div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.04)', color: '#666', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>Not answered</div>
                )}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  style={{ background: '#6352dd', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Next &rarr;
                </button>
              ) : (
                <button 
                  onClick={() => setShowReviewModal(true)}
                  style={{ background: '#10b981', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Review &amp; Submit
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Phase 3: Result Screen
  if (phase === 'result' && scoreData) {
    return (
      <div style={{ background: '#0a0a14', minHeight: '100vh', color: '#c0c0d8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
        <div style={{ animation: 'bounceIn 0.5s ease forwards', width: '80px', height: '80px', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <svg width="40" height="40" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style={{ fontSize: '28px', color: 'white', fontWeight: '700' }}>Exam Submitted!</div>
        <div style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>Submitted at {new Date(session.endedAt).toLocaleTimeString()}</div>

        <div style={{ width: '100%', maxWidth: '480px', margin: '32px auto 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '800', color: scoreData.color }}>
            {scoreData.score} <span style={{ fontSize: '24px', color: '#666' }}>/ {scoreData.totalMarks}</span>
          </div>
          <div style={{ fontSize: '20px', color: scoreData.color, marginTop: '8px' }}>{scoreData.percentage}%</div>
          <div style={{ marginTop: '16px', display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '8px 24px', borderRadius: '24px', fontSize: '20px', fontWeight: '800', color: 'white' }}>
            Grade {scoreData.grade}
          </div>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '24px', color: 'white', fontWeight: '600' }}>{scoreData.correctCount}</div>
              <div style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', color: 'white', fontWeight: '600' }}>{scoreData.wrongCount}</div>
              <div style={{ fontSize: '12px', color: '#e05c5c', textTransform: 'uppercase' }}>Wrong</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', color: 'white', fontWeight: '600' }}>{scoreData.unattemptedCount}</div>
              <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Unattempted</div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '480px', margin: '24px auto', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '15px', color: '#888', marginBottom: '16px' }}>Proctoring Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#c0c0d8' }}>Gaze Away Flags</span>
              <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>{session.violationCount?.gaze_away || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#c0c0d8' }}>Face Hidden Flags</span>
              <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>{session.violationCount?.face_not_visible || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#c0c0d8' }}>Multiple Faces Flags</span>
              <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>{session.violationCount?.multiple_faces || 0}</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Final Risk Score</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: session.riskScore < 31 ? '#10b981' : session.riskScore < 61 ? '#f59e0b' : '#e05c5c' }}>
            {session.riskScore || 0}
          </div>
          <RiskBar score={session.riskScore || 0} />
        </div>

        <button onClick={() => navigate('/student/dashboard')} style={{ marginTop: '8px', background: '#6352dd', border: 'none', color: 'white', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return null;
}
