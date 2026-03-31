import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessionsForTest } from '../data/mockStore';

export default function TestCard({ test, studentId }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');

  const scheduledDate = new Date(test.scheduledAt);
  const testEndTime = new Date(scheduledDate.getTime() + (test.duration || 60) * 60000);

  const sessions = getSessionsForTest(test.id);
  const existingSession = sessions.find(s => s.studentId === studentId);
  const userSubmitted = existingSession && (existingSession.status === 'submitted' || existingSession.status === 'flagged');

  const isMissed = !userSubmitted && test.status === 'scheduled' && Date.now() > testEndTime;
  const isCompleted = test.status === 'completed' || userSubmitted;
  
  const timeHasPassed = Date.now() >= scheduledDate.getTime();
  const isActive = (test.status === 'active' || (test.status === 'scheduled' && timeHasPassed)) && !isCompleted && !isMissed;
  const isScheduled = test.status === 'scheduled' && !timeHasPassed && !isMissed && !isCompleted;


  useEffect(() => {
    let interval;
    if (isScheduled) {
      interval = setInterval(() => {
        const diff = scheduledDate.getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('Starts soon');
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`Starts in ${h} hr ${m} min`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isScheduled, scheduledDate]);

  let statusBadge;
  if (userSubmitted || test.status === 'completed') {
    statusBadge = <div style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>COMPLETED</div>;
  } else if (isMissed) {
    statusBadge = <div style={{ background: 'rgba(224,92,92,0.15)', color: '#e05c5c', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>MISSED</div>;
  } else if (isActive) {
    statusBadge = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
        <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
        LIVE
      </div>
    );
  } else {
    statusBadge = <div style={{ background: 'rgba(99,82,221,0.15)', color: '#a78bfa', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>SCHEDULED</div>;
  }

  const handleEnterExam = () => {
    // Check if session exists
    const sessions = getSessionsForTest(test.id);
    const existing = sessions.find(s => s.studentId === studentId);
    if (!existing) {
      createSession({
        id: 'sess_' + Date.now(),
        testId: test.id,
        studentId: studentId,
        proctorId: test.createdBy,
        startedAt: null,
        endedAt: null,
        status: 'not_started',
        violationCount: { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 },
        totalViolations: 0,
        riskScore: 0
      });
    }
    navigate(`/student/test/${test.id}`);
  };

  const formattedDate = scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="fade-in" style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column'
    }}>
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {statusBadge}
        <div style={{ background: 'rgba(255,255,255,0.06)', color: '#c0c0d8', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
          {test.subject}
        </div>
      </div>

      {/* Middle Map */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fff', fontWeight: '600' }}>{test.title}</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#888', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {test.description}
        </p>
        <div style={{ fontSize: '12px', color: '#666' }}>Proctored by {test.createdBy}</div>
      </div>

      {/* Details Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#c0c0d8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          {formattedDate} · {formattedTime}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#c0c0d8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          {test.duration} minutes
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#c0c0d8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          {test.totalMarks} marks
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto' }}>
        {isScheduled && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '500' }}>{timeLeft || 'Starting soon'}</div>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#888', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'not-allowed' }}>Starts Soon</button>
          </div>
        )}
        {isActive && (
          <button onClick={handleEnterExam} style={{ width: '100%', background: '#6352dd', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: '500', cursor: 'pointer', transition: '0.2s' }}
            onMouseOver={e => e.target.style.background = '#7c6ee0'}
            onMouseOut={e => e.target.style.background = '#6352dd'}
          >
            Enter Exam →
          </button>
        )}
        {isMissed && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#e05c5c' }}>Deadline passed</div>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#888', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'not-allowed' }}>Missed</button>
          </div>
        )}
        {isCompleted && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>{userSubmitted ? 'Evaluation ready' : 'Exam closed'}</div>
            <button onClick={() => { if(userSubmitted) navigate(`/student/test/${test.id}`) }} style={{ background: userSubmitted ? 'rgba(99,82,221,0.15)' : 'transparent', border: userSubmitted ? '1px solid rgba(99,82,221,0.5)' : '1px solid rgba(255,255,255,0.15)', color: userSubmitted ? '#a78bfa' : '#888', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: userSubmitted ? 'pointer' : 'not-allowed', transition: '0.2s' }}
             onMouseOver={e => { if(userSubmitted){ e.currentTarget.style.background = 'rgba(99,82,221,0.3)'; e.currentTarget.style.color = '#fff'; } }}
             onMouseOut={e => { if(userSubmitted){ e.currentTarget.style.background = 'rgba(99,82,221,0.15)'; e.currentTarget.style.color = '#a78bfa'; } }}
            >
              {userSubmitted ? 'View Report →' : 'No Submission'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
