import React, { useState, useEffect } from 'react';

export default function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  isEditing,
  onSave,
  onCancelEdit
}) {
  const [editData, setEditData] = useState({
    question: "",
    options: ["", "", "", ""],
    correct: 0,
    explanation: "",
    difficulty: "medium",
    marks: 5
  });

  useEffect(() => {
    if (isEditing && question) {
      setEditData({ ...question });
    }
  }, [isEditing, question]);

  const labels = ['A', 'B', 'C', 'D'];

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
      case 'medium': return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
      case 'hard': return { bg: 'rgba(224,92,92,0.15)', color: '#e05c5c' };
      default: return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    }
  };

  const PencilIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );

  const TrashIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(99,82,221,0.4)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '12px',
        position: 'relative',
        boxShadow: '0 0 0 3px rgba(99,82,221,0.1)',
        animation: 'fadeIn 0.3s ease forwards'
      }}>
        {/* ROW 1: Difficulty + Marks */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['easy', 'medium', 'hard'].map(diff => (
              <button
                key={diff}
                onClick={() => setEditData({...editData, difficulty: diff})}
                style={{
                  background: editData.difficulty === diff ? '#6352dd' : 'transparent',
                  border: editData.difficulty === diff ? '1px solid #6352dd' : '1px solid rgba(255,255,255,0.1)',
                  color: editData.difficulty === diff ? '#fff' : '#888',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', color: '#888' }}>Marks</label>
            <input 
              type="number"
              value={editData.marks}
              onChange={(e) => setEditData({...editData, marks: Number(e.target.value)})}
              style={{
                width: '80px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>

        {/* ROW 2: Question Text */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }}>Question *</label>
          <textarea
            rows={3}
            value={editData.question}
            onChange={(e) => setEditData({...editData, question: e.target.value})}
            style={{
              width: '100%',
              resize: 'vertical',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* ROW 3: Options (2x2 grid) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {editData.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  onClick={() => setEditData({...editData, correct: i})}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: editData.correct === i ? '#10b981' : 'transparent',
                    border: editData.correct === i ? 'none' : '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {editData.correct === i && <CheckIcon />}
                </div>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', color: '#888',
                  fontSize: '12px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {labels[i]}
                </div>
                <input
                  type="text"
                  placeholder={`Option ${labels[i]}`}
                  value={opt}
                  onChange={(e) => {
                    const newOps = [...editData.options];
                    newOps[i] = e.target.value;
                    setEditData({...editData, options: newOps});
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            Click the circle to mark the correct answer
          </div>
        </div>

        {/* ROW 4: Explanation */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }}>Explanation (optional)</label>
          <textarea
            rows={2}
            value={editData.explanation}
            onChange={(e) => setEditData({...editData, explanation: e.target.value})}
            style={{
              width: '100%',
              resize: 'vertical',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* ACTION ROW */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button 
            onClick={onCancelEdit}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#c0c0d8',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (!editData.question.trim() || editData.options.some(o => !o.trim())) {
                alert("Please fill question and all options.");
                return;
              }
              if (onSave) onSave(editData);
            }}
            style={{
              background: '#6352dd',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Save Question
          </button>
        </div>
      </div>
    );
  }

  // VIEW MODE
  const diffColor = getDifficultyColor(question?.difficulty);

  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '12px',
      position: 'relative',
      transition: 'background 0.2s',
      animation: 'fadeIn 0.3s ease forwards'
    }}>
      {/* TOP ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{
            fontSize: '12px', fontWeight: '700', color: '#6352dd',
            background: 'rgba(99,82,221,0.12)', padding: '2px 8px',
            borderRadius: '4px', marginRight: '2px'
          }}>
            Q{index}
          </div>
          
          <div style={{
            background: diffColor.bg, color: diffColor.color,
            fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
            textTransform: 'uppercase', fontWeight: '600'
          }}>
            {question?.difficulty || 'medium'}
          </div>

          {question?.source === 'ai' && (
            <div style={{
              background: 'rgba(99,82,221,0.1)', color: '#a78bfa',
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px'
            }}>
              ✨ AI
            </div>
          )}
          {question?.source === 'manual' && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', color: '#888',
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px'
            }}>
              ✍️ Manual
            </div>
          )}

          <div style={{
            background: 'rgba(255,255,255,0.06)', color: '#c0c0d8',
            fontSize: '11px', padding: '2px 8px', borderRadius: '4px'
          }}>
            {question?.marks || 0} pt
          </div>
        </div>

        {/* View Mode Actions */}
        {onEdit && onDelete && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onEdit(question.id)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#c0c0d8',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(99,82,221,0.15)';
                e.currentTarget.style.color = '#a78bfa';
                e.currentTarget.style.borderColor = 'rgba(99,82,221,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#c0c0d8';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <PencilIcon />
            </button>
            <button 
              onClick={() => onDelete(question.id)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#888',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(224,92,92,0.1)';
                e.currentTarget.style.color = '#e05c5c';
                e.currentTarget.style.borderColor = 'rgba(224,92,92,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#888';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {/* QUESTION TEXT */}
      <div style={{
        margin: '14px 0 16px',
        fontSize: '15px',
        fontWeight: '500',
        color: '#ffffff',
        lineHeight: '1.6'
      }}>
        {question?.question}
      </div>

      {/* OPTIONS LIST */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {question?.options?.map((opt, i) => {
          const isCorrect = i === question?.correct;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
              border: isCorrect ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', padding: '10px 14px'
            }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                fontSize: '12px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)',
                color: isCorrect ? '#fff' : '#888',
                flexShrink: 0
              }}>
                {labels[i]}
              </div>
              <div style={{
                 fontSize: '14px',
                 color: isCorrect ? '#10b981' : '#c0c0d8',
                 fontWeight: isCorrect ? '500' : 'normal'
              }}>
                {opt}
              </div>
            </div>
          )
        })}
      </div>

      {/* EXPLANATION */}
      {question?.explanation && (
        <div style={{
          marginTop: '14px',
          padding: '12px 16px',
          background: 'rgba(99,82,221,0.06)',
          borderLeft: '3px solid #6352dd',
          borderRadius: '0 8px 8px 0'
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '700', color: '#6352dd',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: '6px'
          }}>
            💡 Explanation
          </div>
          <div style={{
            fontSize: '13px', color: '#a78bfa', lineHeight: '1.5'
          }}>
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
