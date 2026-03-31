import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getStore, getSessionsForTest } from '../data/mockStore';

export default function TestResults() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const store = getStore();
    const currentTest = store.tests.find(t => t.id === testId);
    if (!currentTest) {
      navigate('/proctor/dashboard');
      return;
    }
    setTest(currentTest);

    const testSessions = getSessionsForTest(testId);
    setSessions(testSessions);

    // Get assigned students
    const assigned = store.students.filter(s => currentTest.assignedStudents.includes(s.id));
    setStudents(assigned);
  }, [testId, navigate]);

  if (!test) return null;

  return (
    <div style={{ background: '#0a0a14', minHeight: '100vh', color: '#e4e1f0', fontFamily: '"Inter", sans-serif' }}>
      <Navbar />
      
      <div style={{ padding: '40px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate('/proctor/dashboard')}
          style={{ background: 'transparent', color: '#00daf3', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={{ fontFamily: '"Manrope", sans-serif', fontSize: '28px', color: '#fff', margin: '0 0 8px 0' }}>
          Test Results: {test.title}
        </h1>
        <div style={{ fontSize: '14px', color: '#c8c5cc', marginBottom: '32px' }}>
          Overview of student performance and proctoring status
        </div>

        <div style={{ background: '#12121d', border: '1px solid #1b1b25', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1b1b25', color: '#c8c5cc', fontSize: '12px', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Student Name</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Email</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Score</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Risk Score</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const session = sessions.find(s => s.studentId === student.id);
                const hasTaken = !!session;
                const score = session?.score ?? '-';
                const totalMarks = session?.totalMarks ?? (test.totalMarks || '-');
                const riskScore = session?.riskScore ?? 0;
                const statusStr = session ? session.status : 'pending';

                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #1b1b25', transition: 'background 0.2s' }} 
                      onMouseEnter={e => e.currentTarget.style.background = '#1f1f29'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#fff' }}>
                      {student.name}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#c8c5cc' }}>
                      {student.email}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>
                      {hasTaken ? `${score} / ${totalMarks}` : '-'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {hasTaken ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#34343f', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, riskScore)}%`, height: '100%', 
                              background: riskScore > 60 ? '#ffb4ab' : (riskScore > 30 ? '#ffd270' : '#00daf3') 
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', color: riskScore > 60 ? '#ffb4ab' : '#c8c5cc', fontWeight: '500' }}>{riskScore}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {statusStr === 'submitted' && <span style={{ background: '#006875', color: '#9cf0ff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>SUBMITTED</span>}
                      {statusStr === 'in_progress' && <span style={{ background: '#450086', color: '#d8b9ff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>IN PROGRESS</span>}
                      {statusStr === 'flagged' && <span style={{ background: '#93000a', color: '#ffdad6', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>FLAGGED</span>}
                      {statusStr === 'pending' && <span style={{ background: '#34343f', color: '#c8c5cc', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>PENDING</span>}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {hasTaken && (
                        <button 
                          onClick={() => navigate(`/proctor/test/${testId}/student/${student.id}`)}
                          style={{ background: 'transparent', color: '#00daf3', border: '1px solid #006875', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#c8c5cc' }}>
                    No students assigned to this test.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
