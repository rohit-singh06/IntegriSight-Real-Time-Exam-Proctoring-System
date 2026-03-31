import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getStore, createTest, updateTest } from '../data/mockStore';
import QuestionCard from '../components/QuestionCard';
import AIQuestionGenerator from '../components/AIQuestionGenerator';

export default function CreateTest() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const isEditMode = !!testId;

  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [testTotalMarks, setTestTotalMarks] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [status, setStatus] = useState("scheduled");
  
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  
  const defaultMarksPerQ = Math.floor(testTotalMarks / (questions.length + 1)) || 5;
  const [newQuestion, setNewQuestion] = useState({
    question: "", options: ["","","",""], correct: 0,
    explanation: "", difficulty: "medium", marks: defaultMarksPerQ
  });

  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const uStr = localStorage.getItem('integrisight_user');
    if (!uStr) return navigate('/login');
    const u = JSON.parse(uStr);
    setUser(u);
    if (!isEditMode) setSubject(u.subject || '');

    const store = getStore();
    setStudents(store.students);
    
    if (isEditMode) {
      const test = store.tests.find(t => t.id === testId);
      if (test) {
        setTitle(test.title || "");
        setSubject(test.subject || "");
        setDescription(test.description || "");
        setInstructions(test.instructions || "");
        if (test.scheduledAt) {
          const d = new Date(test.scheduledAt);
          const pad = (n) => n.toString().padStart(2, '0');
          setScheduledDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
          setScheduledTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
        setDuration(test.duration || 60);
        setTestTotalMarks(test.totalMarks || 100);
        setSelectedStudents(test.assignedStudents || []);
        setQuestions(test.questions || []);
        setStatus(test.status || "scheduled");
      }
    }
  }, [navigate, testId, isEditMode]);

  useEffect(() => {
    if (showAddForm) {
      setNewQuestion(prev => ({ ...prev, marks: defaultMarksPerQ }));
    }
  }, [showAddForm, defaultMarksPerQ]);

  if (!user) return null;

  const correctableMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  const toggleStudent = (id) => {
    if (status === "active") return;
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (title.trim().length < 3) newErrors.title = 'Title must be at least 3 characters.';
    if (!subject.trim()) newErrors.subject = 'Subject is required.';
    
    if (!scheduledDate || !scheduledTime) {
      newErrors.datetime = 'Both date and time are required.';
    } else {
      const dt = new Date(`${scheduledDate}T${scheduledTime}`);
      if (!isEditMode && dt <= new Date()) newErrors.datetime = 'Scheduled time must be in the future.';
      if (isEditMode && status !== "active" && dt <= new Date()) newErrors.datetime = 'Scheduled time must be in the future.';
    }

    if (duration < 10 || duration > 300) newErrors.duration = 'Duration must be between 10 and 300 minutes.';
    if (testTotalMarks < 10) newErrors.totalMarks = 'Total marks must be at least 10.';
    if (selectedStudents.length === 0) newErrors.students = 'At least 1 student must be selected.';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return false;
    return true;
  };

  const handleSaveDraft = () => {
    const testObj = {
      id: isEditMode ? testId : 'test_' + Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      duration: Number(duration),
      totalMarks: Number(testTotalMarks),
      scheduledAt: scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : new Date().toISOString(),
      status: 'scheduled',
      createdBy: user.id,
      assignedStudents: selectedStudents,
      allowedAttempts: 1,
      questions: questions
    };

    if (isEditMode) {
      updateTest(testId, testObj);
    } else {
      createTest(testObj);
    }
    
    setToastMessage("Test saved as draft");
    setTimeout(() => {
      navigate('/proctor/dashboard');
    }, 1500);
  };

  const handlePublish = () => {
    if (!validateForm()) {
      const btn = document.getElementById("publish-btn");
      if (btn) {
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
      }
      return;
    }

    const testObj = {
      id: isEditMode ? testId : 'test_' + Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      duration: Number(duration),
      totalMarks: Number(testTotalMarks),
      scheduledAt: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
      status: isEditMode ? status : 'scheduled',
      createdBy: user.id,
      assignedStudents: selectedStudents,
      allowedAttempts: 1,
      questions: questions
    };

    if (isEditMode) {
      updateTest(testId, testObj);
      setToastMessage("✅ Test updated successfully!");
    } else {
      createTest(testObj);
      setToastMessage(`✅ '${testObj.title}' published! ${questions.length} questions ready.`);
    }
    
    setTimeout(() => {
      navigate('/proctor/dashboard');
    }, 2000);
  };

  const addManualQuestion = () => {
    if (!newQuestion.question.trim() || newQuestion.options.some(o => !o.trim())) {
      alert("Please fill question and all options.");
      return;
    }
    const q = { ...newQuestion, id: `q_${Date.now()}_${Math.random().toString(36).substr(2,6)}`, source: "manual" };
    setQuestions(prev => [...prev, q]);
    setNewQuestion({
      question: "", options: ["","","",""], correct: 0,
      explanation: "", difficulty: "medium", marks: defaultMarksPerQ
    });
  };

  const handleAIGenerated = (newQs) => {
    setQuestions(prev => [...prev, ...newQs]);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAllStudents = () => {
    if (status === "active") return;
    if (selectedStudents.length >= filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      const newSelected = new Set([...selectedStudents, ...filteredStudents.map(s => s.id)]);
      setSelectedStudents(Array.from(newSelected));
    }
  };

  return (
    <div style={{ background: '#0a0a14', minHeight: '100vh', paddingBottom: '100px', color: '#c0c0d8' }}>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      <Navbar />

      {/* STICKY PAGE HEADER */}
      <div style={{
        position: 'sticky', top: 0, background: 'rgba(10,10,20,0.95)',
        backdropFilter: 'blur(12px)', zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button onClick={() => navigate('/proctor/dashboard')} style={{
          background: 'transparent', border: 'none', color: '#c0c0d8',
          fontSize: '13px', cursor: 'pointer', padding: '4px 8px'
        }}>
          &larr; {isEditMode ? 'Manage Tests' : 'Back'}
        </button>
        <div style={{ fontSize: '13px', color: '#666' }}>
          Proctor Dashboard &rarr; <span style={{ color: '#c0c0d8' }}>{isEditMode ? 'Edit Test' : 'Create Test'}</span>
        </div>
        <div style={{
          marginLeft: 'auto', background: 'rgba(99,82,221,0.1)', color: '#a78bfa',
          borderRadius: '20px', padding: '4px 14px', fontSize: '13px'
        }}>
          {questions.length} Questions &middot; {correctableMarks} / {testTotalMarks} marks
        </div>
      </div>

      {/* TEST DETAILS FORM */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px 0' }}>
        {status === 'active' && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px', padding: '12px 16px', color: '#f59e0b', fontSize: '14px',
            marginBottom: '24px'
          }}>
            &emsp; This test is currently active. Question changes will apply immediately.
          </div>
        )}
        
        <div style={{
          fontSize: '18px', fontWeight: '600', color: 'white',
          paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          Test Details
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Test Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. JavaScript Fundamentals &ndash; Mid Term"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              {errors.title && <div style={{ color: '#e05c5c', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.2s' }}>{errors.title}</div>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Subject *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Computer Science"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              {errors.subject && <div style={{ color: '#e05c5c', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.2s' }}>{errors.subject}</div>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Description</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description shown to students on their dashboard"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Instructions</label>
              <textarea rows={5} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder={"1. No external resources allowed\n2. Keep your face visible at all times\n3. Do not switch tabs during the exam\n4. Submit before the timer expires"}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Scheduled Date *</label>
                <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} disabled={status === "active"}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Scheduled Time *</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} disabled={status === "active"}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                />
              </div>
            </div>
            {errors.datetime && <div style={{ color: '#e05c5c', fontSize: '12px', marginTop: '-12px', animation: 'fadeIn 0.2s' }}>{errors.datetime}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Duration (minutes) *</label>
                <input type="number" min="10" max="300" value={duration} onChange={e => setDuration(e.target.value)} disabled={status === "active"}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                {errors.duration && <div style={{ color: '#e05c5c', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.2s' }}>{errors.duration}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#c0c0d8', fontWeight: '500', marginBottom: '6px' }}>Total Marks *</label>
                <input type="number" min="10" value={testTotalMarks} onChange={e => setTestTotalMarks(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                {errors.totalMarks && <div style={{ color: '#e05c5c', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.2s' }}>{errors.totalMarks}</div>}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#c0c0d8', marginBottom: '4px' }}>Assign Students *</div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Select which students can take this test</div>
              
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <svg width="16" height="16" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '10px' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or enrollment no..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px 10px 36px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                <div 
                  onClick={toggleAllStudents}
                  style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', cursor: status === "active" ? 'not-allowed' : 'pointer' }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selectedStudents.length >= filteredStudents.length && filteredStudents.length > 0 ? '#6352dd' : 'transparent',
                    border: selectedStudents.length >= filteredStudents.length && filteredStudents.length > 0 ? 'none' : '2px solid rgba(255,255,255,0.2)'
                  }}>
                    {(selectedStudents.length >= filteredStudents.length && filteredStudents.length > 0) && (
                      <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '14px', color: '#fff' }}>Select All Students</span>
                </div>

                {filteredStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', padding: '20px' }}>No students found</div>
                ) : (
                  filteredStudents.map(student => (
                    <div key={student.id} onClick={() => toggleStudent(student.id)}
                      style={{ 
                        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', 
                        cursor: status === "active" ? 'not-allowed' : 'pointer', transition: 'background 0.15s' 
                      }}
                      onMouseOver={e => { if(status !== "active") e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseOut={e => { if(status !== "active") e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: selectedStudents.includes(student.id) ? '#6352dd' : 'transparent',
                        border: selectedStudents.includes(student.id) ? 'none' : '2px solid rgba(255,255,255,0.2)'
                      }}>
                        {selectedStudents.includes(student.id) && (
                          <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6352dd, #8b5cf6)',
                        color: 'white', fontSize: '12px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {student.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{student.name}</span>
                        <span style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{student.enrollmentNo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#a78bfa', marginTop: '8px' }}>
                {selectedStudents.length} students selected
              </div>
              {errors.students && <div style={{ color: '#e05c5c', fontSize: '12px', marginTop: '4px', animation: 'fadeIn 0.2s' }}>{errors.students}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION BUILDER SECTION */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '18px', color: 'white', fontWeight: '600' }}>Question Builder</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Add questions manually or generate them with AI</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowAddForm(true)}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#c0c0d8',
                borderRadius: '8px', padding: '10px 18px', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Add Manually
            </button>
            <button 
              onClick={() => setShowAIDrawer(true)}
              style={{
                background: 'linear-gradient(135deg, #6352dd, #8b5cf6)', color: 'white',
                border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '500',
                boxShadow: '0 2px 12px rgba(99,82,221,0.25)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,82,221,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,82,221,0.25)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              ✨ Generate with AI
            </button>
          </div>
        </div>

        {/* MARKS SUMMARY BAR */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 16px', color: '#fff', fontSize: '14px' }}>
            📋 {questions.length} Questions
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 16px', color: '#fff', fontSize: '14px' }}>
            ✅ {correctableMarks} Total Marks from Questions
          </div>
          {correctableMarks !== Number(testTotalMarks) && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: '8px', padding: '10px 16px', fontSize: '14px' }}>
              ⚠️ Test total is {testTotalMarks} but questions sum to {correctableMarks}
            </div>
          )}
        </div>

        {/* EMPTY STATE OR LIST */}
        {questions.length === 0 && !showAddForm ? (
          <div style={{
            border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '16px',
            padding: '60px 40px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', lineHeight: '1' }}>📝</div>
            <div style={{ fontSize: '18px', color: '#888', marginTop: '16px' }}>No questions yet</div>
            <div style={{ fontSize: '14px', color: '#555', marginTop: '8px' }}>Add questions manually or let AI generate them for you.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
              <button onClick={() => setShowAddForm(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#c0c0d8', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', cursor: 'pointer' }}>
                + Add Manually
              </button>
              <button onClick={() => setShowAIDrawer(true)} style={{ background: 'linear-gradient(135deg, #6352dd, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', cursor: 'pointer' }}>
                ✨ Generate with AI
              </button>
            </div>
          </div>
        ) : (
          <div>
            {showAddForm && (
              <div style={{
                background: 'rgba(99,82,221,0.06)', border: '1px solid rgba(99,82,221,0.25)',
                borderRadius: '12px', padding: '24px', marginBottom: '16px', animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', color: 'white', fontWeight: '600' }}>Add New Question</div>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['easy', 'medium', 'hard'].map(diff => (
                      <button key={diff} onClick={() => setNewQuestion({...newQuestion, difficulty: diff})}
                        style={{
                          background: newQuestion.difficulty === diff ? '#6352dd' : 'transparent',
                          border: newQuestion.difficulty === diff ? '1px solid #6352dd' : '1px solid rgba(255,255,255,0.1)',
                          color: newQuestion.difficulty === diff ? '#fff' : '#888',
                          padding: '6px 14px', borderRadius: '20px', fontSize: '13px', textTransform: 'capitalize', cursor: 'pointer'
                        }}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <label style={{ fontSize: '13px', color: '#888' }}>Marks</label>
                    <input type="number" value={newQuestion.marks} onChange={(e) => setNewQuestion({...newQuestion, marks: Number(e.target.value)})}
                      style={{ width: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }}>Question *</label>
                  <textarea rows={3} value={newQuestion.question} onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {newQuestion.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div onClick={() => setNewQuestion({...newQuestion, correct: i})}
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: newQuestion.correct === i ? '#10b981' : 'transparent',
                            border: newQuestion.correct === i ? 'none' : '2px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
                          }}
                        >
                          {newQuestion.correct === i && (
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </div>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: '#888',
                          fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {['A','B','C','D'][i]}
                        </div>
                        <input type="text" placeholder={`Option ${['A','B','C','D'][i]}`} value={opt} onChange={(e) => {
                          const newOps = [...newQuestion.options];
                          newOps[i] = e.target.value;
                          setNewQuestion({...newQuestion, options: newOps});
                        }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Click the circle to mark the correct answer</div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }}>Explanation (optional)</label>
                  <textarea rows={2} value={newQuestion.explanation} onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#c0c0d8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={addManualQuestion} style={{ background: '#6352dd', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Add Question</button>
                </div>
              </div>
            )}

            {questions.map((q, i) => (
              <QuestionCard 
                key={q.id}
                question={q}
                index={i + 1}
                isEditing={editingId === q.id}
                onEdit={(id) => setEditingId(id)}
                onDelete={(id) => setQuestions(prev => prev.filter(qx => qx.id !== id))}
                onSave={(updated) => {
                  setQuestions(prev => prev.map(qx => qx.id === updated.id ? updated : qx));
                  setEditingId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* STICKY ACTION BAR */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,20,0.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '14px', color: questions.length === 0 ? '#e05c5c' : '#888' }}>
          {questions.length === 0 ? "No questions added yet" : `${questions.length} questions \u00B7 ${correctableMarks} marks`}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSaveDraft}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: '#c0c0d8', borderRadius: '8px', padding: '10px 20px',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer'
            }}
          >
            Save as Draft
          </button>
          <button 
            id="publish-btn"
            onClick={handlePublish}
            disabled={Object.keys(errors).length > 0 || selectedStudents.length === 0}
            style={{
              background: '#6352dd', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              opacity: (Object.keys(errors).length > 0 || selectedStudents.length === 0) ? 0.5 : 1
            }}
          >
            {isEditMode ? 'Save Changes' : 'Publish Test'}
          </button>
        </div>
      </div>

      {showAIDrawer && (
        <AIQuestionGenerator 
          subject={subject} 
          onClose={() => setShowAIDrawer(false)} 
          onQuestionsGenerated={handleAIGenerated} 
        />
      )}
    </div>
  );
}
