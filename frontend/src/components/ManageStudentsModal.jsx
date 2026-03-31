import React, { useState, useEffect } from 'react';
import { getStore } from '../data/mockStore';

// Icons
const SearchIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CloseIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function ManageStudentsModal({ isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [testAssignments, setTestAssignments] = useState({});

  useEffect(() => {
    if (isOpen) {
      const store = getStore();
      setStudents(store.students || []);
      
      // Calculate how many tests each student is assigned to
      const assignments = {};
      store.students.forEach(s => assignments[s.id] = 0);
      
      if (store.tests) {
        store.tests.forEach(test => {
          if (test.assignedStudents) {
            test.assignedStudents.forEach(id => {
              if (assignments[id] !== undefined) {
                assignments[id]++;
              }
            });
          }
        });
      }
      setTestAssignments(assignments);
    } else {
      setSearchTerm(''); // Reset on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .student-row:hover { background: rgba(255,255,255,0.04) !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
      
      <div style={{
        background: '#12121d',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        width: '100%', maxWidth: '750px',
        height: '80vh', maxHeight: '700px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        
        {/* MODAL HEADER */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#fff' }}>Manage Enrolled Students</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>{students.length} students currently registered in the system</p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888',
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888'; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ color: '#888' }}><SearchIcon /></div>
            <input 
              type="text"
              placeholder="Search by student name or enrollment number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#fff',
                fontSize: '14px', width: '100%', outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* STUDENT LIST */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>👥</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '16px' }}>No students found</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', textAlign: 'center' }}>
                We couldn't find any students matching "{searchTerm}".<br/>Try adjusting your search.
              </p>
            </div>
          ) : (
            <div>
              {filteredStudents.map((student, i) => {
                const initials = student.name ? student.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'U';
                const assignedCount = testAssignments[student.id] || 0;
                
                return (
                  <div key={student.id} className="student-row" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.2s', cursor: 'default'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
                        color: '#fff', fontSize: '15px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,212,255,0.2)'
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{student.name}</div>
                        <div style={{ fontSize: '13px', color: '#888', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{student.enrollmentNo || 'N/A'}</span>
                          <span>{student.email || 'No email provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Assigned Tests</div>
                        <div style={{ fontSize: '16px', color: assignedCount > 0 ? '#10b981' : '#888', fontWeight: '700', marginTop: '2px' }}>
                          {assignedCount}
                        </div>
                      </div>
                      <button 
                        style={{
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff', fontSize: '12px', fontWeight: '600', borderRadius: '8px',
                          padding: '8px 16px', cursor: 'not-allowed', opacity: 0.5
                        }}
                        title="Profile viewing is disabled in this demo"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
