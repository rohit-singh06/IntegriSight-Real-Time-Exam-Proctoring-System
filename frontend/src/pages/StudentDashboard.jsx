import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import TestCard from '../components/TestCard';
import { getStore, getTestsForStudent, getSessionsForTest, getViolationsForSession } from '../data/mockStore';

export default function StudentDashboard() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState(location.pathname === '/student' ? 'Past' : 'All');

  useEffect(() => {
    if (location.pathname === '/student') setFilter('Past');
    else if (location.pathname === '/student/dashboard') setFilter('All');
  }, [location.pathname]);

  useEffect(() => {
    const userStr = localStorage.getItem('integrisight_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      
      const stTests = getTestsForStudent(u.id);
      setTests(stTests);
      
      const store = getStore();
      const stSessions = store.sessions.filter(s => s.studentId === u.id);
      setSessions(stSessions);
      
      const stViolations = store.violations.filter(v => v.studentId === u.id);
      setViolations(stViolations.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  // Derive stats
  const assignedTests = tests.length;
  const upcomingTests = tests.filter(t => t.status === 'scheduled').length;
  
  // A test is "completed" for the student if the test itself is completed OR their session is submitted/flagged
  const completedCount = sessions.filter(s => s.status === 'submitted' || s.status === 'flagged').length;
  const totalViolations = violations.length;

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredTests = tests.filter(t => {
    const isCompleted = t.status === 'completed' || sessions.find(s => s.testId === t.id && (s.status === 'submitted' || s.status === 'flagged'));
    const testEndTime = new Date(new Date(t.scheduledAt).getTime() + (t.duration || 60) * 60000);
    const isMissed = t.status === 'scheduled' && new Date() > testEndTime;

    if (filter === 'All') return true;
    if (filter === 'Scheduled') return t.status === 'scheduled' && !isMissed;
    if (filter === 'Active') return t.status === 'active';
    if (filter === 'Completed') return isCompleted;
    if (filter === 'Missed') return isMissed;
    if (filter === 'Past') return isCompleted || isMissed;
    return true;
  });

  const getSeverityColor = (type) => {
    if (type === 'gaze_away') return '#f59e0b';
    if (type === 'face_not_visible') return '#e05c5c';
    if (type === 'multiple_faces') return '#a78bfa';
    return '#888';
  };

  const getSeverityLabel = (type) => {
    if (type === 'gaze_away') return 'Low';
    if (type === 'face_not_visible') return 'Medium';
    if (type === 'multiple_faces') return 'High';
    return 'Unknown';
  };

  return (
    <div style={{ background: '#0a0a14', minHeight: '100vh', color: '#c0c0d8' }}>
      <Navbar />
      
      <div style={{ padding: '32px 48px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', margin: '0 0 8px 0' }}>
              {getGreeting()}, {user.name} 👋
            </h1>
            <div style={{ fontSize: '14px', color: '#888' }}>Here are your upcoming and active exams.</div>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500', marginBottom: '4px' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ fontSize: '18px', color: '#6352dd', fontWeight: '600', fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <StatCard title="Assigned Tests" value={assignedTests} />
          <StatCard title="Upcoming" value={upcomingTests} />
          <StatCard title="Completed" value={completedCount} />
          <StatCard title="Violations" value={totalViolations} accentColor="#e05c5c" />
        </div>

        {/* Tests Section */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>Your Tests</h2>
            
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {['All', 'Scheduled', 'Active', 'Completed', 'Missed', 'Past'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: filter === f ? '#6352dd' : 'transparent',
                    color: filter === f ? '#fff' : '#888',
                    border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '500',
                    cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '15px', color: '#888' }}>No tests match the current filter.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
              {filteredTests.map(test => (
                <TestCard key={test.id} test={test} studentId={user.id} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Violations Panel */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 20px 0' }}>Recent Violation Log</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            {violations.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', marginBottom: '16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>No violations recorded. Keep it up! ✅</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.06)', color: '#888', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '14px 20px', fontWeight: '600' }}>Time</th>
                    <th style={{ padding: '14px 20px', fontWeight: '600' }}>Test</th>
                    <th style={{ padding: '14px 20px', fontWeight: '600' }}>Violation Type</th>
                    <th style={{ padding: '14px 20px', fontWeight: '600' }}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.slice(0, 10).map((v, i) => {
                    const test = tests.find(t => t.id === v.testId);
                    const testName = test ? test.title : 'Unknown Test';
                    
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#c0c0d8' }}>
                          {new Date(v.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>
                          {testName}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#c0c0d8', textTransform: 'capitalize' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSeverityColor(v.type) }}></span>
                            {v.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ 
                            background: `${getSeverityColor(v.type)}20`, color: getSeverityColor(v.type), 
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                            border: `0.5px solid ${getSeverityColor(v.type)}40`
                          }}>
                            {getSeverityLabel(v.type)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
