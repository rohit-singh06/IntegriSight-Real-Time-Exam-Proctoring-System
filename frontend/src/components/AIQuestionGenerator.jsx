import React, { useState } from 'react';

export default function AIQuestionGenerator({ onQuestionsGenerated, subject, onClose }) {
  const [topic, setTopic] = useState(subject || "");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(10);
  const [focusAreas, setFocusAreas] = useState([]);
  const [focusInput, setFocusInput] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [includeCode, setIncludeCode] = useState(false);
  const [marksPerQuestion, setMarksPerQuestion] = useState("");

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // To store selected question indices
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = focusInput.trim().replace(/,$/, '');
      if (val && !focusAreas.includes(val)) {
        setFocusAreas([...focusAreas, val]);
      }
      setFocusInput("");
    }
  };

  const removeTag = (tag) => {
    setFocusAreas(focusAreas.filter(t => t !== tag));
  };

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    setResults(null);

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    const systemPrompt = `Generate exactly ${count} multiple choice questions on this topic: "${topic}".
Difficulty level: ${difficulty}.
${focusAreas && focusAreas.length > 0 ? `Focus on these subtopics: ${focusAreas.join(', ')}` : ''}
${includeCode ? 'Include short code snippets in questions where appropriate.' : ''}

Return ONLY a raw JSON array. No markdown. No code fences. No explanation text.
Start directly with [ and end with ].

Each object must follow this exact shape:
{
  "question": "Full question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Brief explanation of why this answer is correct",
  "difficulty": "${difficulty.toLowerCase() === 'mixed' ? 'medium' : difficulty.toLowerCase()}"
}

The "correct" field is the 0-based index (0, 1, 2, or 3).
Make all 4 options plausible. Wrong options should be realistic distractors.`;

  const FREE_MODELS = [
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free",
  "meta-llama/llama-4-scout:free",
  "meta-llama/llama-4-maverick:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-8b:free",
  "qwen/qwen3-14b:free",
  "tngtech/deepseek-r1t-chimera:free",
];

    let lastError = null;

    for (const model of FREE_MODELS) {
      try {
        console.log(`🔄 Trying model: ${model}`);

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
              "HTTP-Referer": "http://localhost:5173",
              "X-Title": "IntegriSight"
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: systemPrompt }]
            })
          }
        );

        if (response.status === 429 || response.status === 503) {
          console.log(`⏭ ${model} is rate limited, trying next...`);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ ${model} failed (${response.status}):`, errorText);
          continue;
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content;

        if (!rawText) {
          console.log(`❌ ${model} returned empty response`);
          continue;
        }

        console.log(`✅ Success with: ${model}`);

        // Clean markdown fences
        const cleaned = rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        // Extract JSON array
        const jsonStart = cleaned.indexOf('[');
        const jsonEnd = cleaned.lastIndexOf(']');
        if (jsonStart === -1 || jsonEnd === -1) {
          console.log(`❌ ${model} did not return valid JSON array`);
          continue;
        }

        const jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonString);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          console.log(`❌ ${model} returned empty array`);
          continue;
        }

        // Validate and assign IDs
        const validated = parsed.map((q, i) => ({
          id: `q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
          question: q.question || "",
          options: Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : ["Option A", "Option B", "Option C", "Option D"],
          correct: typeof q.correct === "number"
            && q.correct >= 0
            && q.correct <= 3
            ? q.correct : 0,
          explanation: q.explanation || "",
          difficulty: ["easy", "medium", "hard"].includes(
            (q.difficulty || "").toLowerCase()
          )
            ? q.difficulty.toLowerCase()
            : difficulty.toLowerCase(),
          marks: marksPerQuestion
            ? parseInt(marksPerQuestion)
            : Math.floor(100 / count) || 5,
          source: "ai"
        }));

        // Set results and select ALL by default
        setResults(validated);
        setSelectedIndices(new Set(validated.map((_, i) => i)));
        setGenerating(false);
        return; // success — stop trying other models

      } catch (err) {
        console.log(`❌ ${model} threw error:`, err.message);
        lastError = err;
        continue;
      }
    }

    // All models failed
    console.error("All models failed:", lastError);
    setError("All AI models are currently busy. Please wait 30 seconds and try again.");
    setGenerating(false);
  };

  const handleAddSelected = () => {
    if (!results) return;
    const selectedqs = results.filter((_, i) => selectedIndices.has(i));
    onQuestionsGenerated(selectedqs);
    onClose();
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 199,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)'
      }} onClick={onClose} />

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px', maxWidth: '100vw',
        background: '#0f0f1e', borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)', zIndex: 200,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s ease forwards'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: '16px', color: 'white', fontWeight: '600' }}>
              ✨ AI Question Generator
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Describe the topic and let AI create your questions
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#888',
              fontSize: '24px', cursor: 'pointer', lineHeight: '20px'
            }}
          >
            &times;
          </button>
        </div>

        {/* BODY */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          {generating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{
                width: '48px', height: '48px',
                border: '3px solid rgba(99,82,221,0.2)',
                borderTopColor: '#6352dd',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ fontSize: '16px', color: '#c0c0d8', marginTop: '16px' }}>
                Generating {count} questions...
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                This may take a few seconds
              </div>
            </div>
          ) : results ? (
            <>
              {/* RESULTS STATE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '15px', color: '#10b981', fontWeight: '600' }}>
                  {results.length} Questions Generated
                </div>
                <button
                  onClick={() => setResults(null)}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#c0c0d8', borderRadius: '6px', padding: '4px 10px',
                    fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  Regenerate
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.map((q, i) => (
                  <div key={q.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', padding: '14px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{
                        background: q.difficulty === 'hard' ? 'rgba(224,92,92,0.15)' :
                          q.difficulty === 'easy' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: q.difficulty === 'hard' ? '#e05c5c' :
                          q.difficulty === 'easy' ? '#10b981' : '#f59e0b',
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        textTransform: 'uppercase', fontWeight: '600'
                      }}>
                        {q.difficulty}
                      </div>
                      <div
                        onClick={() => {
                          const newSet = new Set(selectedIndices);
                          if (newSet.has(i)) newSet.delete(i);
                          else newSet.add(i);
                          setSelectedIndices(newSet);
                        }}
                        style={{
                          width: '20px', height: '20px', borderRadius: '4px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          background: selectedIndices.has(i) ? '#6352dd' : 'transparent',
                          border: selectedIndices.has(i) ? 'none' : '2px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        {selectedIndices.has(i) && (
                          <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '14px', color: 'white', margin: '10px 0 8px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {q.question}
                    </div>

                    <div style={{
                      fontSize: '12px', color: '#888',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      A. {q.options[0]} &middot; B. {q.options[1]} &middot; C. {q.options[2]} &middot; D. {q.options[3]}
                    </div>

                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>
                      &check; Correct: Option {['A', 'B', 'C', 'D'][q.correct]}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {error && (
                <div style={{
                  background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)',
                  borderRadius: '8px', padding: '12px 16px', color: '#e05c5c', fontSize: '14px',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  {error}
                  <button onClick={generateQuestions} style={{
                    alignSelf: 'flex-start', background: 'transparent', border: '1px solid #e05c5c',
                    color: '#e05c5c', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer'
                  }}>
                    Try Again
                  </button>
                </div>
              )}

              {/* FORM */}
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', color: '#888', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
                }}>Topic / Prompt *</label>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Generate questions on React hooks..."
                  style={{
                    width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                    padding: '12px', borderRadius: '8px', fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '12px', color: '#888', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
                }}>Difficulty</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Easy', 'Medium', 'Hard', 'Mixed'].map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      style={{
                        background: difficulty === diff ? '#6352dd' : 'transparent',
                        border: difficulty === diff ? '1px solid #6352dd' : '1px solid rgba(255,255,255,0.1)',
                        color: difficulty === diff ? '#fff' : '#888',
                        padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer'
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '12px', color: '#888', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
                }}>Number of Questions</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[5, 10, 15, 20].map(num => (
                    <button
                      key={num}
                      onClick={() => setCount(num)}
                      style={{
                        background: count === num ? '#6352dd' : 'transparent',
                        border: count === num ? '1px solid #6352dd' : '1px solid rgba(255,255,255,0.1)',
                        color: count === num ? '#fff' : '#888',
                        padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '12px', color: '#888', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
                }}>Focus Areas (optional)</label>
                <input
                  type="text"
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="e.g. hooks, performance, rendering..."
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                    padding: '10px 12px', borderRadius: '8px'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {focusAreas.map(tag => (
                    <div key={tag} style={{
                      background: 'rgba(99,82,221,0.15)', color: '#a78bfa',
                      borderRadius: '20px', padding: '3px 10px', fontSize: '12px',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {tag}
                      <button onClick={() => removeTag(tag)} style={{
                        background: 'transparent', border: 'none', color: '#a78bfa',
                        cursor: 'pointer', padding: '0 2px'
                      }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  style={{ fontSize: '12px', color: '#6352dd', cursor: 'pointer', fontWeight: '600' }}
                >
                  Advanced Options {advancedOpen ? '▾' : '▸'}
                </div>
                {advancedOpen && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0c0d8', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeCode}
                        onChange={(e) => setIncludeCode(e.target.value)}
                        style={{ accentColor: '#6352dd' }}
                      />
                      Include code snippets in questions
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ fontSize: '13px', color: '#888' }}>Marks per question</label>
                      <input
                        type="number"
                        value={marksPerQuestion}
                        onChange={(e) => setMarksPerQuestion(e.target.value)}
                        placeholder="auto"
                        style={{
                          width: '80px', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                          padding: '6px 10px', borderRadius: '8px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={generateQuestions}
                  style={{
                    width: '100%', height: '48px',
                    background: 'linear-gradient(135deg, #6352dd, #8b5cf6)',
                    color: 'white', fontSize: '15px', fontWeight: '600',
                    borderRadius: '10px', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(99,82,221,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,82,221,0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,82,221,0.3)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  ✨ Generate Questions
                </button>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        {results && !generating && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
            background: '#0f0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ fontSize: '13px', color: '#888' }}>
              {selectedIndices.size} of {results.length} selected
            </div>
            <button
              onClick={handleAddSelected}
              style={{
                background: '#6352dd', color: 'white', padding: '10px 18px',
                borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add Selected to Test
            </button>
          </div>
        )}
      </div>
    </>
  );
}
