import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ManageStudentsModal from '../components/ManageStudentsModal';
import { getStore, getTestsForProctor, updateTest } from '../data/mockStore';
import { BarChart, Bar, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DocumentIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const LightningIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const UsersIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const RadioIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>;
const FlagIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
const ClockIcon = () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CheckIcon = () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const PlusIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const WarningIcon = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

function AnimatedNumber({ value, color }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 1000;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * (end - start) + start));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [value]);
  return <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', color }}>{displayValue}</div>;
}

export default function ProctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [filter, setFilter] = useState('All');
  const [tick, setTick] = useState(0);
  
  const [toast, setToast] = useState(null);
  const [confirmContent, setConfirmContent] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = (proctorId) => {
    const store = getStore();
    const pTests = getTestsForProctor(proctorId);
    setTests(pTests);
    const testIds = pTests.map(t => t.id);
    const pSessions = store.sessions.filter(s => testIds.includes(s.testId));
    setSessions(pSessions);
    const pViolations = store.violations.filter(v => testIds.includes(v.testId));
    setViolations(pViolations);
  };

  useEffect(() => {
    const uStr = localStorage.getItem('integrisight_user');
    if (!uStr) return navigate('/login');
    const u = JSON.parse(uStr);
    setUser(u);
    refreshData(u.id);

    const handleStorage = () => refreshData(u.id);
    window.addEventListener('integrisight_store_update', handleStorage);
    return () => window.removeEventListener('integrisight_store_update', handleStorage);
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) refreshData(user.id);
  }, [tick, user]);

  if (!user) return null;

  const totalTests = tests.length;
  const activeTests = tests.filter(t => t.status === 'active').length;
  const scheduledCount = tests.filter(t => t.status === 'scheduled').length;
  const completedCount = tests.filter(t => t.status === 'completed').length;
  
  const uniqueStudents = new Set();
  tests.forEach(t => t.assignedStudents.forEach(sid => uniqueStudents.add(sid)));
  const enrolledStudents = uniqueStudents.size;

  const liveSessionsList = sessions.filter(s => s.status === 'in_progress');
  const liveSessions = liveSessionsList.length;
  const flaggedSessions = sessions.filter(s => s.status === 'flagged').length;

  const filteredTests = tests.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter.toLowerCase();
  });

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const vTypeData = [
    { name: 'Gaze Away', count: violations.filter(v => v.type === 'gaze_away').length, fill: '#f59e0b' },
    { name: 'No Face', count: violations.filter(v => v.type === 'face_not_visible').length, fill: '#e05c5c' },
    { name: 'Multiple', count: violations.filter(v => v.type === 'multiple_faces').length, fill: '#6352dd' },
    { name: 'Tab Switch', count: violations.filter(v => v.type === 'tab_switch').length, fill: '#00d4ff' },
    { name: 'Phone', count: violations.filter(v => v.type === 'phone_detected').length, fill: '#10b981' }
  ];

  const pieData = [
    { name: 'In Progress', value: sessions.filter(s => s.status === 'in_progress').length || 1, fill: '#f59e0b' },
    { name: 'Submitted', value: sessions.filter(s => s.status === 'submitted').length || 1, fill: '#10b981' },
    { name: 'Flagged', value: sessions.filter(s => s.status === 'flagged').length || 1, fill: '#e05c5c' }
  ];

  const hourDataMap = {};
  const currentMs = Date.now();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentMs - i * 3600000);
    const hStr = d.toLocaleTimeString([], { hour: 'numeric' });
    hourDataMap[hStr] = 0;
  }
  violations.forEach(v => {
    const vd = new Date(v.timestamp);
    if ((currentMs - vd.getTime()) < 12 * 3600000) {
      const hStr = vd.toLocaleTimeString([], { hour: 'numeric' });
      if (hourDataMap[hStr] !== undefined) hourDataMap[hStr]++;
    }
  });
  const lineData = Object.keys(hourDataMap).map(k => ({ time: k, count: hourDataMap[k] }));

  const toggleStatus = (id, newStatus, title) => {
    if (newStatus === 'completed') {
      setConfirmContent({ id, newStatus, title });
    } else {
      updateTest(id, { status: newStatus });
      showToast(`Test activated successfully`);
    }
  };

  const confirmAction = () => {
    if (confirmContent) {
      updateTest(confirmContent.id, { status: confirmContent.newStatus });
      showToast(`Test ended successfully`);
      setConfirmContent(null);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ 
      backgroundColor: '#0a0a14', 
      backgroundImage: 'radial-gradient(circle, rgba(99,82,221,0.06) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      minHeight: '100vh', 
      color: '#ffffff',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <style>{`
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes flaggedPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(224,92,92,0); } 50% { box-shadow: 0 0 0 8px rgba(224,92,92,0.08); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .stat-card:hover { background: rgba(255,255,255,0.06) !important; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
        .action-card:hover { background: rgba(99,82,221,0.06) !important; border-color: rgba(99,82,221,0.2) !important; transform: translateY(-2px); }
        .table-row:hover { background: rgba(255,255,255,0.03) !important; }
        .ghost-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>
      
      <div style={{ position: 'fixed', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,82,221,0.07) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* HEADER ROW */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'auto', minHeight: '80px', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                {greeting}, {user.name}
              </div>
              {activeTests > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '4px 12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulseDot 1.5s infinite' }}></div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '0.08em' }}>LIVE SESSION</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#888899' }}>{user.subject} · IntegriSight Proctor Portal</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', color: '#888899' }}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'})}</div>
              <div style={{ fontSize: '18px', color: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }}>{now.toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={() => navigate('/proctor/create-test')}
              style={{ background: 'linear-gradient(135deg, #6352dd, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 22px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99,82,221,0.3)', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,82,221,0.45)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,82,221,0.3)'; }}
            >
              <PlusIcon /> Create New Test
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { title: 'Total Tests', val: totalTests, color: '#6352dd', icon: <DocumentIcon/>, trend: `${scheduledCount} scheduled · ${completedCount} completed`, bgIcon: '📋' },
            { title: 'Active Now', val: activeTests, color: '#10b981', icon: <LightningIcon/>, trend: activeTests ? 'Tests in progress' : 'No active tests', bgIcon: '⚡', highlightVal: true },
            { title: 'Students', val: enrolledStudents, color: '#00d4ff', icon: <UsersIcon/>, trend: `Across ${totalTests} tests`, bgIcon: '👥' },
            { title: 'Live Sessions', val: liveSessions, color: '#f59e0b', icon: <RadioIcon/>, trend: `${liveSessions} in progress`, bgIcon: '🔴', highlightVal: true },
            { title: 'Flagged', val: flaggedSessions, color: '#e05c5c', icon: <FlagIcon/>, trend: `Risk score > 50`, bgIcon: '🚩', isAlert: flaggedSessions > 0 }
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '22px 24px', position: 'relative', overflow: 'hidden', transition: 'all 0.25s', ...(stat.isAlert ? { borderColor: 'rgba(224,92,92,0.3)', animation: 'flaggedPulse 2s ease-in-out infinite' } : {}) }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '16px 16px 0 0', background: stat.color }}></div>
              <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', fontSize: '64px', opacity: 0.04, pointerEvents: 'none' }}>{stat.bgIcon}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.title}</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${stat.color}26`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <AnimatedNumber value={stat.val} color={(stat.highlightVal || stat.isAlert) ? (stat.val > 0 ? stat.color : '#ffffff') : (i === 2 ? '#00d4ff' : '#ffffff')} />
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>{stat.trend}</div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS BAR */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '22px' }}>
          {[
            { name: 'Create Test', desc: 'Add new assessment', icon: '+', color: '#6352dd', action: () => navigate('/proctor/create-test') },
            { name: 'Monitor Live', desc: 'View active sessions', icon: '👁', color: '#10b981', action: () => { const act = tests.find(t=>t.status==='active'); if(act) navigate(`/proctor/test/${act.id}`); else showToast('No active tests to monitor'); } },
            { name: 'View Reports', desc: 'Session analytics', icon: '📊', color: '#00d4ff', action: () => window.scrollBy({top: 800, behavior: 'smooth'}) },
            { name: 'Manage Students', desc: 'View enrolled students', icon: '👥', color: '#f59e0b', action: () => setIsStudentModalOpen(true) }
          ].map((act, i) => (
            <div key={i} onClick={act.action} className="action-card" style={{ minWidth: '200px', height: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff' }}>{act.icon}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{act.name}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{act.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* LIVE SESSIONS PANEL (Conditional) */}
        {activeTests > 0 && liveSessionsList.length > 0 && (
          <div style={{ marginBottom: '40px', animation: 'slideDown 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>Live Student Sessions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e05c5c', animation: 'pulseDot 1.5s infinite' }}></div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#e05c5c' }}>{liveSessionsList.length} Active</div>
              </div>
              <div style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> Updates every 2s
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {liveSessionsList.map(sess => {
                const store = getStore();
                const student = store.students.find(s => s.id === sess.studentId);
                const test = tests.find(t => t.id === sess.testId);
                const initials = student ? student.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'U';
                const isFlagged = sess.status === 'flagged';
                const v = sess.violationCount || { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 };
                
                const currentMs = Date.now();
                const sessionStart = new Date(sess.startedAt).getTime() || currentMs;
                const elapsedSecs = Math.floor((currentMs - sessionStart)/1000);
                const hs = Math.floor(elapsedSecs / 3600).toString().padStart(2, '0');
                const ms = Math.floor((elapsedSecs % 3600) / 60).toString().padStart(2, '0');
                const ss = (elapsedSecs % 60).toString().padStart(2, '0');

                const riskColor = sess.riskScore > 60 ? '#e05c5c' : (sess.riskScore > 30 ? '#f59e0b' : '#10b981');
                const riskGradient = sess.riskScore > 60 ? 'linear-gradient(90deg, #e05c5c, #f87171)' : (sess.riskScore > 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10b981, #34d399)');

                return (
                  <div key={sess.id} style={{ background: isFlagged ? 'rgba(224,92,92,0.04)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isFlagged ? 'rgba(224,92,92,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '20px', transition: 'all 0.2s' }} className="table-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6352dd, #8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{student?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{student?.enrollmentNo || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {isFlagged ? (
                          <div style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.25)', color: '#e05c5c', borderRadius: '20px', padding: '4px 10px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <WarningIcon/> FLAGGED
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', borderRadius: '20px', padding: '4px 10px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', animation: 'pulseDot 1.5s infinite'}}></div> IN PROGRESS
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace', marginTop: '6px' }}>{hs}:{ms}:{ss}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '14px', fontSize: '12px', color: '#555' }}>
                      {test?.subject} · {test?.title}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: v.gaze_away > 0 ? '#f59e0b' : '#888' }}>
                        👁 {v.gaze_away || 0}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: v.face_not_visible > 0 ? '#e05c5c' : '#888' }}>
                        🚫 {v.face_not_visible || 0}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: v.multiple_faces > 0 ? '#e05c5c' : '#888' }}>
                        👥 {v.multiple_faces || 0}
                      </div>
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600' }}>
                        <span style={{ color: '#555' }}>Risk Score</span>
                        <span style={{ color: riskColor }}>{sess.riskScore || 0}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, sess.riskScore || 0)}%`, background: riskGradient, transition: 'width 0.5s ease' }}></div>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
                      <button 
                        style={{ flex: 1, background: isFlagged ? 'rgba(224,92,92,0.2)' : 'transparent', border: `1px solid rgba(224,92,92,${isFlagged ? '0.5' : '0.3'})`, color: '#e05c5c', borderRadius: '6px', padding: '6px 0', fontSize: '12px', cursor: isFlagged ? 'default' : 'pointer', fontWeight: '500', transition: 'all 0.2s', opacity: isFlagged ? 0.7 : 1 }}
                        onMouseOver={(e) => { if(!isFlagged) e.currentTarget.style.background = 'rgba(224,92,92,0.1)'; }}
                        onMouseOut={(e) => { if(!isFlagged) e.currentTarget.style.background = 'transparent'; }}
                      >
                        ⚑ {isFlagged ? 'Flagged' : 'Flag'}
                      </button>
                      <button 
                        onClick={() => navigate(`/proctor/test/${test.id}/student/${student.id}`)}
                        className="ghost-btn"
                        style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#c0c0d8', borderRadius: '6px', padding: '6px 0', fontSize: '12px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
                      >
                        → Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MANAGE TESTS TABLE */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>Manage Tests</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{tests.length} tests · {activeTests} active</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '4px', display: 'flex', gap: '4px' }}>
              {['All', 'Scheduled', 'Active', 'Completed'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ background: filter === f ? '#6352dd' : 'transparent', color: filter === f ? '#fff' : '#666', border: 'none', borderRadius: '7px', padding: '6px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: filter === f ? '0 2px 8px rgba(99,82,221,0.3)' : 'none' }}
                  onMouseOver={(e) => { if(filter !== f){ e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#c0c0d8'; } }}
                  onMouseOut={(e) => { if(filter !== f){ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; } }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0 24px', height: '44px', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr 1fr 1fr 1.5fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Test Title', 'Subject', 'Scheduled', 'Duration', 'Students', 'Status', 'Actions'].map((h, i) => (
                <div key={i} style={{ fontSize: '11px', fontWeight: '700', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: i === 6 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {filteredTests.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '16px', color: '#555', fontWeight: '600', marginBottom: '4px' }}>No {filter.toLowerCase()} tests found</div>
                <div style={{ fontSize: '13px', color: '#444', marginBottom: '20px' }}>Create a new test to get started</div>
                <button onClick={() => navigate('/proctor/create-test')} className="ghost-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}>+ Create Test</button>
              </div>
            ) : (
              <div>
                {filteredTests.map((t, idx) => (
                  <div key={t.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx === filteredTests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="table-row" onClick={() => toggleRow(t.id)} style={{ padding: '0 24px', height: '68px', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr 1fr 1fr 1.5fr', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: t.status === 'scheduled' ? '#6352dd' : (t.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.15)') }}></div>
                        <div>
                          <div style={{ fontSize: '15px', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t.title}
                            {t.questions?.length > 0 && <span style={{ background: 'rgba(99,82,221,0.12)', border: '1px solid rgba(99,82,221,0.2)', color: '#a78bfa', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>{t.questions.length} Qs</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{t.questions?.length || 0} Questions · {t.totalMarks || 0} marks</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', color: '#888' }}>{t.subject}</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '13px', color: '#c0c0d8', fontWeight: '500' }}>{new Date(t.scheduledAt).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                        <div style={{ fontSize: '12px', color: '#555' }}>{new Date(t.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                      </div>

                      <div style={{ fontSize: '14px', color: '#c0c0d8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#555' }}><ClockIcon/></span> {t.duration}m
                      </div>

                      <div>
                        <span style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#00d4ff', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>
                          {t.assignedStudents.length} students
                        </span>
                      </div>

                      <div>
                        {t.status === 'scheduled' && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', width: 'fit-content', background: 'rgba(99,82,221,0.1)', border: '1px solid rgba(99,82,221,0.25)', color: '#a78bfa' }}><ClockIcon/> SCHEDULED</div>}
                        {t.status === 'active' && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', width: 'fit-content', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}><div style={{ width: '4px', height: '4px', background: '#10b981', borderRadius: '50%', animation: 'pulseDot 1.5s infinite'}}></div> LIVE</div>}
                        {t.status === 'completed' && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', width: 'fit-content', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#555' }}><CheckIcon/> COMPLETED</div>}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                        {t.status === 'active' && (
                          <>
                            <button onClick={() => navigate(`/proctor/test/${t.id}`)} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', borderRadius: '6px', height: '30px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='rgba(16,185,129,0.2)'} onMouseOut={(e)=>e.currentTarget.style.background='rgba(16,185,129,0.1)'}>Monitor</button>
                            <button onClick={() => toggleStatus(t.id, 'completed', t.title)} style={{ background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', color: '#e05c5c', borderRadius: '6px', height: '30px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='rgba(224,92,92,0.15)'} onMouseOut={(e)=>e.currentTarget.style.background='rgba(224,92,92,0.08)'}>End Test</button>
                          </>
                        )}
                        {t.status === 'scheduled' && (
                          <>
                            <button onClick={() => navigate(`/proctor/edit-test/${t.id}`)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#666', borderRadius: '6px', height: '30px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='#c0c0d8'} onMouseOut={(e)=>e.currentTarget.style.color='#666'}>Edit</button>
                            <button onClick={() => toggleStatus(t.id, 'active')} style={{ background: 'rgba(99,82,221,0.1)', border: '1px solid rgba(99,82,221,0.25)', color: '#a78bfa', borderRadius: '6px', height: '30px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='rgba(99,82,221,0.2)'} onMouseOut={(e)=>e.currentTarget.style.background='rgba(99,82,221,0.1)'}>Activate</button>
                          </>
                        )}
                        {t.status === 'completed' && (
                          <button onClick={() => navigate(`/proctor/test/${t.id}/results`)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', borderRadius: '6px', height: '30px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='#fff'} onMouseOut={(e)=>e.currentTarget.style.color='#888'}>View Results</button>
                        )}
                      </div>
                    </div>

                    <div style={{ maxHeight: expandedRows[t.id] ? '200px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease', background: 'rgba(0,0,0,0.2)', borderTop: expandedRows[t.id] ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                      <div style={{ padding: '16px 24px', fontSize: '13px', color: '#c0c0d8', display: 'flex', gap: '40px' }}>
                        <div><strong>Description:</strong> {t.instructions || 'No special instructions provided.'}</div>
                        <div><strong>Enrolled:</strong> {t.assignedStudents.map(s => getStore().students.find(x => x.id === s)?.name).join(', ') || 'None'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ANALYTICS CENTER */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>Analytics Center</div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '2px' }}>Based on all sessions for your tests</div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', color: '#fff', fontWeight: '600' }}>Violations by Type</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Breakdown across all sessions</div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vTypeData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{fill:'#555', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill:'#555', fontSize: 11}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'8px 12px', color:'#fff'}} itemStyle={{color:'#c0c0d8', fontSize:'12px'}} labelStyle={{color:'#555', fontSize:'11px', marginBottom:'4px'}} />
                    <Bar dataKey="count" radius={[4,4,0,0]} barSize={30}>
                      {vTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', color: '#fff', fontWeight: '600' }}>Violations Over Time</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Last 12 hours</div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6352dd" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6352dd" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{fill:'#555', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill:'#555', fontSize: 11}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'8px 12px', color:'#fff'}} itemStyle={{color:'#6352dd', fontSize:'12px'}} labelStyle={{color:'#555', fontSize:'11px', marginBottom:'4px'}} />
                    <Area type="monotone" dataKey="count" stroke="#6352dd" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#6352dd', stroke: '#0a0a14', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', color: '#fff', fontWeight: '600' }}>Session Status</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Distribution of outcomes</div>
              </div>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: 1, height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'8px 12px'}} itemStyle={{color:'#fff', fontSize:'12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#c0c0d8'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b', flexShrink:0}}></div>
                    <span style={{flex:1}}>In Progress</span>
                    <span style={{fontWeight:'700', color:'#fff'}}>{pieData[0].value}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#c0c0d8'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', flexShrink:0}}></div>
                    <span style={{flex:1}}>Submitted</span>
                    <span style={{fontWeight:'700', color:'#fff'}}>{pieData[1].value}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#c0c0d8'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#e05c5c', flexShrink:0}}></div>
                    <span style={{flex:1}}>Flagged</span>
                    <span style={{fontWeight:'700', color:'#fff'}}>{pieData[2].value}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', boxShadow: '0 8px 32px rgba(16,185,129,0.3)', zIndex: 1000, animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          {toast}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12121d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', animation: 'slideDown 0.3s ease' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#fff' }}>End '{confirmContent.title}'?</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#888', lineHeight: '1.5' }}>
              This will mark the test as completed and submit all in-progress sessions. Students will no longer be able to access this test.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setConfirmContent(null)}
                className="ghost-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#c0c0d8', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: '0.2s' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                style={{ background: '#e05c5c', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: '0.2s', boxShadow: '0 4px 12px rgba(224,92,92,0.3)' }}
                onMouseOver={(e)=>e.currentTarget.style.background='#f87171'}
                onMouseOut={(e)=>e.currentTarget.style.background='#e05c5c'}
              >
                End Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE STUDENTS MODAL */}
      <ManageStudentsModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
      />
    </div>
  );
}
