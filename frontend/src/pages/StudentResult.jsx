import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getStore, getSessionsForTest, getViolationsForSession } from '../data/mockStore';

export default function StudentResult() {
  const { testId, studentId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [student, setStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const store = getStore();
    const currentTest = store.tests.find(t => t.id === testId);
    const currentStudent = store.students.find(s => s.id === studentId);
    if (!currentTest || !currentStudent) {
      navigate('/proctor/dashboard');
      return;
    }
    setTest(currentTest);
    setStudent(currentStudent);

    const testSessions = getSessionsForTest(testId);
    const studSession = testSessions.find(s => s.studentId === studentId);
    if (studSession) {
      setSession(studSession);
      const sessViolations = getViolationsForSession(studSession.id);
      setViolations(sessViolations);
    }
  }, [testId, studentId, navigate]);

  if (!test || !student || !session) return <div style={{color:'white', padding:'40px'}}>Loading... (Or Student has not taken this test)</div>;

  const totalQuestions = test.questions ? test.questions.length : 0;
  const attemptedQuestions = session.answers ? Object.keys(session.answers).length : 0;
  
  let correctCount = 0;
  let incorrectCount = 0;
  if (test.questions && session.answers) {
    test.questions.forEach(q => {
      const ans = session.answers[q.id];
      if (ans !== undefined) {
        if (ans === q.correct) correctCount++;
        else incorrectCount++;
      }
    });
  }

  const vCount = session.violationCount || { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 };
  const totalViolations = vCount.gaze_away + vCount.face_not_visible + vCount.multiple_faces;

  return (
    <div style={{ background: '#0a0a14', minHeight: '100vh', color: '#e4e1f0', fontFamily: '"Inter", sans-serif' }}>
      <Navbar />
      
      <div style={{ padding: '40px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(`/proctor/test/${testId}/results`)}
          style={{ background: 'transparent', color: '#00daf3', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ← Back to Test Results
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontFamily: '"Manrope", sans-serif', fontSize: '32px', color: '#fff', margin: '0 0 8px 0' }}>
              {student.name}'s Report
            </h1>
            <div style={{ fontSize: '15px', color: '#c8c5cc' }}>
              Test: <span style={{color: '#fff', fontWeight: '500'}}>{test.title}</span> • Enrollment: {student.enrollmentNo}
            </div>
          </div>
          <div style={{ background: '#12121d', padding: '16px 24px', borderRadius: '12px', border: '1px solid #1b1b25', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#c8c5cc', textTransform: 'uppercase', marginBottom: '4px' }}>Final Score</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#00daf3' }}>{session.score} <span style={{fontSize:'16px', color:'#c8c5cc', fontWeight:'500'}}>/ {session.totalMarks || test.totalMarks}</span></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px' }}>
          
          {/* Left Column: Questions Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: '#12121d', border: '1px solid #1b1b25', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', color: '#fff', margin: '0 0 20px 0', fontFamily: '"Manrope", sans-serif' }}>Performance Metrics</h2>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#c8c5cc', marginBottom: '8px' }}>Attempted</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#fff' }}>{attemptedQuestions} <span style={{fontSize:'14px', color:'#c8c5cc'}}>/ {totalQuestions}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#c8c5cc', marginBottom: '8px' }}>Correct</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#00daf3' }}>{correctCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#c8c5cc', marginBottom: '8px' }}>Incorrect</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffb4ab' }}>{incorrectCount}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#12121d', border: '1px solid #1b1b25', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #1b1b25' }}>
                <h2 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>Question Breakdown</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1b1b25', color: '#c8c5cc', fontSize: '12px', textAlign: 'left' }}>
                    <th style={{ padding: '12px 24px', fontWeight: '500', width: '60px' }}>Q #</th>
                    <th style={{ padding: '12px 24px', fontWeight: '500' }}>Question Content</th>
                    <th style={{ padding: '12px 24px', fontWeight: '500', width: '120px' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {test.questions && test.questions.map((q, idx) => {
                    const ans = session.answers ? session.answers[q.id] : undefined;
                    const isAttempted = ans !== undefined;
                    const isCorrect = isAttempted && ans === q.correct;
                    
                    return (
                      <tr key={q.id} style={{ borderBottom: '1px solid #1b1b25' }}>
                        <td style={{ padding: '16px 24px', color: '#c8c5cc' }}>{idx + 1}</td>
                        <td style={{ padding: '16px 24px', color: '#e4e1f0', fontSize: '14px' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                            {q.text}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {!isAttempted ? (
                            <span style={{ color: '#c8c5cc', fontSize: '12px' }}>Skipped</span>
                          ) : isCorrect ? (
                            <span style={{ color: '#00daf3', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Correct</span>
                          ) : (
                            <span style={{ color: '#ffb4ab', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>✕ Incorrect</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
          </div>

          {/* Right Column: AI Proctoring Log */}
          <div>
            <div style={{ background: '#12121d', border: '1px solid #1b1b25', borderRadius: '12px', padding: '24px', position: 'sticky', top: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', color: '#fff', margin: 0, fontFamily: '"Manrope", sans-serif' }}>AI Integrity Log</h2>
                <div style={{ background: session.riskScore > 60 ? 'rgba(255, 180, 171, 0.15)' : 'rgba(0, 218, 243, 0.15)', color: session.riskScore > 60 ? '#ffb4ab' : '#00daf3', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  Risk: {session.riskScore}%
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <div style={{ flex: 1, background: '#1b1b25', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffd270' }}>{vCount.gaze_away}</div>
                  <div style={{ fontSize: '10px', color: '#c8c5cc', marginTop: '4px' }}>Gaze Away</div>
                </div>
                <div style={{ flex: 1, background: '#1b1b25', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffb4ab' }}>{vCount.face_not_visible}</div>
                  <div style={{ fontSize: '10px', color: '#c8c5cc', marginTop: '4px' }}>No Face</div>
                </div>
                <div style={{ flex: 1, background: '#1b1b25', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#d8b9ff' }}>{vCount.multiple_faces}</div>
                  <div style={{ fontSize: '10px', color: '#c8c5cc', marginTop: '4px' }}>Multiple</div>
                </div>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#c8c5cc', marginBottom: '12px', fontWeight: '500' }}>Timeline ({totalViolations} events)</div>
                {violations.length === 0 ? (
                  <div style={{ color: '#00daf3', fontSize: '13px', textAlign: 'center', padding: '20px', background: '#001f24', borderRadius: '8px' }}>
                    No violations detected. Session was clean.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {violations.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((v, i) => (
                      <div key={v.id || i} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '2px', background: '#34343f', flexShrink: 0, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '0', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: v.type === 'gaze_away' ? '#ffd270' : '#ffb4ab' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', marginBottom: '2px' }}>
                            {v.type === 'gaze_away' ? 'Looked Away' : 
                             v.type === 'face_not_visible' ? 'Face Not Visible' : 
                             v.type === 'multiple_faces' ? 'Multiple Faces Detected' : v.type}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888' }}>
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
