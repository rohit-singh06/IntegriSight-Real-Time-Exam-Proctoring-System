import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RiskBar from '../components/RiskBar';
import { getStore, updateSession } from '../data/mockStore';
import QuestionCard from '../components/QuestionCard';

export default function ProctorTestMonitor() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [test, setTest] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const uStr = localStorage.getItem('integrisight_user');
    if (!uStr) return navigate('/login');
    setUser(JSON.parse(uStr));
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      const store = getStore();
      const t = store.tests.find(x => x.id === testId);
      if (!t || t.createdBy !== user.id) {
        navigate('/proctor/dashboard');
        return;
      }
      setTest(t);
      
      const s = store.sessions.filter(x => x.testId === testId);
      setSessions(s);
      
      const v = store.violations.filter(x => x.testId === testId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setViolations(v);
    }
  }, [tick, user, testId, navigate]);

  if (!user || !test) return null;

  const handleFlagStudent = (sessionId) => {
    updateSession(sessionId, { status: 'flagged' });
    setTick(t => t+1);
  };

  const getSeverityColor = (type) => {
    if (type === 'gaze_away') return '#f59e0b';
    if (type === 'face_not_visible') return '#e05c5c';
    if (type === 'multiple_faces') return '#a78bfa';
    return '#888';
  };

  const questions = test.questions || [];

  return (
    <div style={{ background: '#0a0a14', height: '100vh', display: 'flex', flexDirection: 'column', color: '#c0c0d8', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0f0f1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <button onClick={() => navigate('/proctor/dashboard')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', margin: 0 }}>{test.title} (Live Monitor)</h1>
            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginLeft: '32px' }}>{test.assignedStudents.length} Students Assigned · Real-time data sync active</div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>In Progress</div>
            <div style={{ fontSize: '24px', color: '#10b981', fontWeight: '700' }}>{sessions.filter(s => s.status === 'in_progress').length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Submitted</div>
            <div style={{ fontSize: '24px', color: '#6352dd', fontWeight: '700' }}>{sessions.filter(s => s.status === 'submitted').length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Flagged</div>
            <div style={{ fontSize: '24px', color: '#e05c5c', fontWeight: '700' }}>{sessions.filter(s => s.status === 'flagged').length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side - Student Grid (70%) */}
        <div style={{ flex: '0 0 70%', padding: '24px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            
            {test.assignedStudents.map(studentId => {
              const store = getStore();
              const student = store.students.find(s => s.id === studentId);
              const session = sessions.find(s => s.studentId === studentId);
              
              if (!session) {
                return (
                  <div key={studentId} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2a2a3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                        {student.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{student.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{student.enrollmentNo}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px' }}>
                      Haven't Started Connecting
                    </div>
                  </div>
                );
              }

              return (
                <div key={studentId} className="fade-in" style={{ 
                  background: '#0f0f1a', border: session.riskScore > 60 ? '1px solid rgba(224,92,92,0.4)' : '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden',
                  boxShadow: session.riskScore > 60 ? '0 0 15px rgba(224,92,92,0.1)' : 'none'
                }}>
                  {session.status === 'flagged' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#e05c5c' }}></div>}
                  {session.status === 'submitted' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#6352dd' }}></div>}
                  {session.status === 'in_progress' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: session.riskScore > 60 ? '#e05c5c' : '#10b981' }}></div>}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2a2a3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                      {student.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{student.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{student.enrollmentNo}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      {session.status === 'in_progress' && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>LIVE</span>}
                      {session.status === 'submitted' && <span style={{ background: 'rgba(99,82,221,0.1)', color: '#a78bfa', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>DONE</span>}
                      {session.status === 'flagged' && <span style={{ background: 'rgba(224,92,92,0.1)', color: '#e05c5c', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>FLAGGED</span>}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Risk Score</span>
                      <span style={{ fontWeight: 'bold', color: session.riskScore > 60 ? '#e05c5c' : '#fff' }}>{session.riskScore}%</span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, session.riskScore)}%`, height: '100%', background: session.riskScore > 60 ? '#e05c5c' : (session.riskScore > 30 ? '#f59e0b' : '#10b981'), transition: '0.3s' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ color: '#888', fontSize: '10px' }}>Total Vio</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{session.totalViolations}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ color: '#f59e0b', fontSize: '10px' }}>Gaze</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{session.violationCount.gaze_away}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ color: '#e05c5c', fontSize: '10px' }}>Face</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{session.violationCount.face_not_visible}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ color: '#a78bfa', fontSize: '10px' }}>Multi</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{session.violationCount.multiple_faces}</span>
                    </div>
                  </div>

                  {session.status === 'in_progress' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <button 
                        onClick={() => handleFlagStudent(session.id)}
                        style={{ width: '100%', padding: '8px', background: 'transparent', color: '#e05c5c', border: '1px solid rgba(224,92,92,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(224,92,92,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        Flag Session
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Actions & Info (30%) */}
        <div style={{ flex: '0 0 30%', background: '#0a0a14', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Overview', 'Questions', 'Student Detail'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  flex: 1, padding: '16px 0', background: 'transparent', border: 'none', 
                  color: activeTab === tab ? '#fff' : '#888', 
                  borderBottom: activeTab === tab ? '2px solid #6352dd' : '2px solid transparent',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: '0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {activeTab === 'Overview' && (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Violation Timeline
                </h2>
                {violations.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', marginTop: '40px', fontSize: '13px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '12px', opacity: 0.5 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    <br/>
                    No violations recorded yet. Waiting for events...
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '15px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
                    
                    {violations.map((v, i) => {
                      const store = getStore();
                      const student = store.students.find(s => s.id === v.studentId);
                      
                      return (
                        <div key={v.id} className="fade-in" style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '16px', marginBottom: '24px' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', background: '#0f0f1a', border: `2px solid ${getSeverityColor(v.type)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSeverityColor(v.type) }}></div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 16px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>{student?.name}</div>
                              <div style={{ fontSize: '11px', color: '#888' }}>{new Date(v.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div style={{ fontSize: '12px', color: getSeverityColor(v.type), textTransform: 'capitalize', fontWeight: '500' }}>
                              {v.type.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Questions' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Test Questions</div>
                  <div style={{ fontSize: '12px', color: '#a78bfa', background: 'rgba(99,82,221,0.15)', padding: '4px 10px', borderRadius: '12px', fontWeight: '500' }}>
                    {questions.length} Questions · {test.totalMarks} Marks
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {questions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: '13px' }}>
                      No questions in this test.
                    </div>
                  ) : (
                    questions.map((q, idx) => (
                      <QuestionCard key={q.id} index={idx} question={q} />
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'Student Detail' && (
              <div style={{ textAlign: 'center', color: '#888', marginTop: '40px', fontSize: '13px' }}>
                Select a student from the grid to view detailed analytics.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
