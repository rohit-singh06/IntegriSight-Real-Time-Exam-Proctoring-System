
document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    const userStr = sessionStorage.getItem('integrisight_user');
    if (!userStr) { window.location.href = 'login.html'; return; }
    const user = JSON.parse(userStr);

    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    const isEditMode = !!testId;

    let store = getStore();
    let students = store.students || [];


    let formData = {
        title: '', subject: user.subject || '', desc: '', inst: '',
        date: '', time: '', duration: 60, marks: 100,
        status: 'scheduled'
    };
    
    let selectedStudents = new Set();
    let searchQuery = '';
    let questions = [];

    // DOM Elements
    const elements = {
        title: document.getElementById('inp-title'),
        subject: document.getElementById('inp-subject'),
        desc: document.getElementById('inp-desc'),
        inst: document.getElementById('inp-inst'),
        date: document.getElementById('inp-date'),
        time: document.getElementById('inp-time'),
        duration: document.getElementById('inp-duration'),
        totalmarks: document.getElementById('inp-totalmarks'),
        search: document.getElementById('inp-search-student'),
        studentList: document.getElementById('student-list-wrapper'),
        chkAll: document.getElementById('chk-all'),
        btnSelectAll: document.getElementById('btn-select-all'),
        countTxt: document.getElementById('student-count-txt'),
        
        warnActive: document.getElementById('active-warning'),
        topStats: document.getElementById('top-test-stats'),
        botStats: document.getElementById('bot-status'),
        qcCount: document.getElementById('qc-count'),
        qcMarks: document.getElementById('qc-marks'),
        warnMarks: document.getElementById('warn-marks'),

        emptyState: document.getElementById('q-empty-state'),
        qList: document.getElementById('questions-list-wrapper'),
        
        // Manual Panel
        mqPanel: document.getElementById('manual-q-panel'),
        mqMsg: document.getElementById('mq-msg'),
        mqText: document.getElementById('mq-text'),
        mqExp: document.getElementById('mq-exp'),
        mqMarks: document.getElementById('mq-marks'),
        mqOpts: [0, 1, 2, 3].map(i => document.getElementById(`mq-opt-${i}`)),
        mqRadios: document.querySelectorAll('.opt-circle'),
        mqDiffBtns: document.querySelectorAll('.diff-btn'),
        
        // AI Drawer
        aiOverlay: document.getElementById('ai-overlay'),
        aiDrawer: document.getElementById('ai-drawer'),
        aiTopic: document.getElementById('ai-topic'),
        aiNum: document.getElementById('ai-num'),
        aiDiff: document.getElementById('ai-diff'),
        aiBtn: document.getElementById('btn-generate-ai'),
        aiErr: document.getElementById('ai-err')
    };

    // Initialize Edit Mode
    if (isEditMode) {
        const test = store.tests.find(t => t.id === testId);
        if (test) {
            formData.title = test.title || '';
            formData.subject = test.subject || '';
            formData.desc = test.description || '';
            formData.inst = test.instructions || '';
            formData.duration = test.duration || 60;
            formData.marks = test.totalMarks || 100;
            formData.status = test.status || 'scheduled';

            if (test.scheduledAt) {
                const d = new Date(test.scheduledAt);
                elements.date.value = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
                elements.time.value = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
            }
            
            test.assignedStudents.forEach(id => selectedStudents.add(id));
            questions = test.questions || [];

            if (test.status === 'active') {
                elements.warnActive.classList.remove('hidden');
                ['title', 'subject', 'desc', 'inst', 'date', 'time', 'duration', 'totalmarks'].forEach(key => elements[key].disabled = true);
            }
        }
    } else {
        const d = new Date(); d.setHours(d.getHours() + 1);
        elements.date.min = d.toISOString().split('T')[0];
    }

    // Populate Fields initially
    elements.title.value = formData.title;
    elements.subject.value = formData.subject;
    elements.desc.value = formData.desc;
    elements.inst.value = formData.inst;
    elements.duration.value = formData.duration;
    elements.totalmarks.value = formData.marks;


    // ─────────────────────────────────────────────────────────
    // 2. STUDENT SELECTOR LOGIC
    // ─────────────────────────────────────────────────────────
    const renderStudents = () => {
        const filtered = students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filtered.length === 0) {
            elements.studentList.innerHTML = `<div style="text-align: center; color: #666; font-size: 14px; padding: 20px;">No students found</div>`;
        } else {
            elements.studentList.innerHTML = filtered.map(s => {
                const isSel = selectedStudents.has(s.id);
                const initials = s.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                return `
                <div class="student-row ${formData.status === 'active' ? 'disabled' : ''}" data-id="${s.id}">
                    <div class="custom-checkbox ${isSel ? 'selected' : 'unselected'}">
                        ${isSel ? `<svg width="12" height="12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                    </div>
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6352dd, #8b5cf6); color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;">${initials}</div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 14px; color: #fff; font-weight: 500;">${s.name}</span>
                        <span style="font-size: 12px; color: #666; margin-top: 2px;">${s.enrollmentNo}</span>
                    </div>
                </div>`;
            }).join('');
        }

        // Handle Check All UI
        const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedStudents.has(s.id));
        elements.chkAll.className = `custom-checkbox ${allFilteredSelected && filtered.length > 0 ? 'selected' : 'unselected'}`;
        elements.chkAll.innerHTML = allFilteredSelected && filtered.length > 0 ? `<svg width="12" height="12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : '';
        elements.countTxt.textContent = `${selectedStudents.size} students selected`;

        // Bind clicks
        document.querySelectorAll('.student-row[data-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (formData.status === 'active') return;
                const sid = e.currentTarget.dataset.id;
                selectedStudents.has(sid) ? selectedStudents.delete(sid) : selectedStudents.add(sid);
                renderStudents();
            });
        });
    };

    elements.search.addEventListener('input', (e) => { searchQuery = e.target.value; renderStudents(); });
    elements.btnSelectAll.addEventListener('click', () => {
        if (formData.status === 'active') return;
        const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()));
        const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedStudents.has(s.id));
        
        if (allFilteredSelected) {
            selectedStudents.clear();
        } else {
            filtered.forEach(s => selectedStudents.add(s.id));
        }
        renderStudents();
    });

    renderStudents();


    // ─────────────────────────────────────────────────────────
    // 3. QUESTION BUILDER (MANUAL)
    // ─────────────────────────────────────────────────────────
    let currentMQ = { q: '', opts: ['', '', '', ''], correct: 0, exp: '', diff: 'medium', marks: 5 };

    const resetMQ = () => {
        currentMQ = { q: '', opts: ['', '', '', ''], correct: 0, exp: '', diff: 'medium', marks: Math.floor(elements.totalmarks.value / (questions.length + 1)) || 5 };
        elements.mqText.value = '';
        elements.mqOpts.forEach(inp => inp.value = '');
        elements.mqExp.value = '';
        elements.mqMarks.value = currentMQ.marks;
        elements.mqRadios.forEach((r, i) => r.className = `opt-circle ${i===0 ? 'selected' : 'unselected'}-radio`);
        elements.mqDiffBtns.forEach(b => b.classList.toggle('active', b.dataset.diff === 'medium'));
    };

    const toggleManual = (show) => {
        if (show) { resetMQ(); elements.mqPanel.classList.remove('hidden'); } 
        else elements.mqPanel.classList.add('hidden');
        renderQuestions();
    };

    document.getElementById('btn-add-manual').addEventListener('click', () => toggleManual(true));
    document.getElementById('btn-add-manual-empty').addEventListener('click', () => toggleManual(true));
    document.getElementById('btn-close-manual').addEventListener('click', () => toggleManual(false));
    document.getElementById('btn-mq-cancel').addEventListener('click', () => toggleManual(false));

    elements.mqDiffBtns.forEach(btn => btn.addEventListener('click', (e) => {
        elements.mqDiffBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMQ.diff = e.target.dataset.diff;
    }));

    elements.mqRadios.forEach(radio => radio.addEventListener('click', (e) => {
        elements.mqRadios.forEach(r => {
            r.style.background = 'transparent'; r.style.border = '2px solid rgba(255,255,255,0.2)'; r.innerHTML = '';
        });
        const target = e.currentTarget;
        target.style.background = '#10b981'; target.style.border = 'none';
        target.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        currentMQ.correct = parseInt(target.dataset.opt);
    }));

    document.getElementById('btn-mq-save').addEventListener('click', () => {
        currentMQ.q = elements.mqText.value;
        currentMQ.opts = elements.mqOpts.map(i => i.value);
        currentMQ.exp = elements.mqExp.value;
        currentMQ.marks = parseInt(elements.mqMarks.value) || 5;

        if (!currentMQ.q.trim() || currentMQ.opts.some(o => !o.trim())) {
            showToast('Error: Fill all question text and option fields', true);
            return;
        }

        const newQ = {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
            question: currentMQ.q,
            options: currentMQ.opts,
            correct: currentMQ.correct,
            explanation: currentMQ.exp,
            difficulty: currentMQ.diff,
            marks: currentMQ.marks,
            source: 'manual'
        };

        questions.push(newQ);
        toggleManual(false);
    });

    // ─────────────────────────────────────────────────────────
    // 4. RENDER QUESTIONS LIST
    // ─────────────────────────────────────────────────────────
    const deleteQuestion = (id) => { questions = questions.filter(q => q.id !== id); renderQuestions(); };

    const renderQuestions = () => {
        const cMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
        const tMarks = Number(elements.totalmarks.value) || 100;
        
        elements.qcCount.textContent = questions.length;
        elements.qcMarks.textContent = cMarks;
        elements.topStats.innerHTML = `${questions.length} Questions &middot; ${cMarks} / ${tMarks} marks`;
        
        if (cMarks !== tMarks) {
            elements.warnMarks.classList.remove('hidden');
            elements.warnMarks.textContent = `⚠️ Test total is ${tMarks} but questions sum to ${cMarks}`;
        } else {
            elements.warnMarks.classList.add('hidden');
        }

        if (questions.length === 0 && elements.mqPanel.classList.contains('hidden')) {
            elements.emptyState.classList.remove('hidden');
        } else {
            elements.emptyState.classList.add('hidden');
        }

        elements.qList.innerHTML = questions.map((q, i) => `
            <div class="q-card fade-in">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                        <span style="background: rgba(255,255,255,0.1); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">Q${i+1}</span>
                        <span style="font-size: 13px; color: #888; text-transform: capitalize;">${q.difficulty} &middot; ${q.marks} Marks ${q.source === 'ai' ? '&middot; ✨ AI' : ''}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.editQ('${q.id}')" style="background: transparent; border: none; color: #888; cursor: pointer;" title="Edit Question">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button onclick="window.deleteQ('${q.id}')" style="background: transparent; border: none; color: #888; cursor: pointer;" title="Delete Question">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div style="font-size: 15px; color: #fff; line-height: 1.5; margin-bottom: 16px;">${q.question}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    ${q.options.map((opt, oi) => `
                        <div class="q-row ${q.correct === oi ? 'correct' : ''}" style="border: 1px solid ${q.correct === oi ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${q.correct === oi ? '#10b981' : 'rgba(255,255,255,0.08)'}; color: ${q.correct === oi ? '#fff' : '#888'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${['A','B','C','D'][oi]}</div>
                            <div style="font-size: 14px; color: ${q.correct === oi ? '#fff' : '#c0c0d8'};">${opt}</div>
                        </div>
                    `).join('')}
                </div>
                ${q.explanation ? `<div style="background: rgba(0,212,255,0.05); border-left: 3px solid #00d4ff; padding: 12px 14px; border-radius: 0 8px 8px 0; margin-top: 16px; font-size: 13px; color: #00d4ff; line-height: 1.4;"><strong style="color: #fff;">Explanation:</strong> ${q.explanation}</div>` : ''}
            </div>
        `).join('');
    };

    window.deleteQ = deleteQuestion;
    window.editQ = (id) => {
        const qToEdit = questions.find(q => q.id === id);
        if (!qToEdit) return;
        
        deleteQuestion(id);
        toggleManual(true);
        
        currentMQ = { ...qToEdit };
        elements.mqText.value = currentMQ.question;
        currentMQ.options.forEach((o, i) => elements.mqOpts[i].value = o);
        elements.mqExp.value = currentMQ.explanation || '';
        elements.mqMarks.value = currentMQ.marks;
        
        elements.mqDiffBtns.forEach(b => b.classList.toggle('active', b.dataset.diff === currentMQ.difficulty));
        
        elements.mqRadios.forEach((r, i) => {
            r.className = `opt-circle ${i === currentMQ.correct ? 'selected' : 'unselected'}-radio`;
            if (i === currentMQ.correct) {
                r.style.background = '#10b981'; r.style.border = 'none';
                r.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            } else {
                r.style.background = 'transparent'; r.style.border = '2px solid rgba(255,255,255,0.2)'; r.innerHTML = '';
            }
        });
    };

    elements.totalmarks.addEventListener('input', renderQuestions);


    const toggleAI = (show) => {
        elements.aiOverlay.classList.toggle('active', show);
        elements.aiDrawer.classList.toggle('active', show);
        if(show && !elements.aiTopic.value) elements.aiTopic.value = elements.subject.value;
    };

    document.getElementById('btn-open-ai').addEventListener('click', () => toggleAI(true));
    document.getElementById('btn-open-ai-empty').addEventListener('click', () => toggleAI(true));
    document.getElementById('btn-close-ai').addEventListener('click', () => toggleAI(false));
    elements.aiOverlay.addEventListener('click', () => toggleAI(false));

    elements.aiBtn.addEventListener('click', async () => {
        const topic = elements.aiTopic.value.trim();
        const num = parseInt(elements.aiNum.value) || 5;
        const diff = elements.aiDiff.value;

        if (!topic) { elements.aiErr.textContent = "Specify a topic"; elements.aiErr.classList.remove('hidden'); return; }
        

        elements.aiErr.classList.add('hidden');
        document.getElementById('ai-btn-text').textContent = "Generating...";
        document.getElementById('ai-spinner').classList.remove('hidden');
        elements.aiBtn.disabled = true;

        const prompt = `Generate ${num} high-quality multiple choice questions about "${topic}". 
        Difficulty level: ${diff}. 
        Format strictly as JSON array of objects.
        Object keys MUST be MUST BE: "question" (str), "options" (array of exactly 4 str), "correct" (int 0-3 index), "explanation" (str), "difficulty" ("easy", "medium", "hard").
        Return ONLY valid JSON.`;

        const FREE_MODELS = [
            "google/gemma-3-27b-it:free",
            "google/gemma-3-12b-it:free",
            "google/gemma-3-4b-it:free",
            "meta-llama/llama-3.2-3b-instruct:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-7b-instruct:free"
        ];

        let success = false;
        let lastStatus = null;
        let lastError = null;

        for (const model of FREE_MODELS) {
            try {
                console.log(`Trying model: ${model}`);
                const res = await fetch('/api/questions', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: "user", content: "You are an expert exam creator. Always return ONLY valid raw JSON array format starting with '[' and ending with ']'.\n\nTask: " + prompt }
                        ]
                    })
                });

                lastStatus = res.status;

                if (res.status === 429) {
                    console.log(`Model ${model} is rate limited (429), trying next...`);
                    continue;
                }

                if (!res.ok) {
                    const errBody = await res.text();
                    console.log(`Model ${model} failed (${res.status}):`, errBody);
                    continue;
                }
                
                const data = await res.json();
                let msg = data.choices[0].message.content;
                
                const jsonStart = msg.indexOf('[');
                const jsonEnd = msg.lastIndexOf(']') + 1;
                if (jsonStart === -1 || jsonEnd === 0) {
                    console.log(`Model ${model} returned invalid JSON array.`);
                    continue;
                }

                const cleanJson = msg.slice(jsonStart, jsonEnd);
                const parsed = JSON.parse(cleanJson);

                if (!Array.isArray(parsed) || parsed.length === 0) continue;

                const mks = Math.floor(elements.totalmarks.value / (questions.length + parsed.length)) || 5;
                
                const mapped = parsed.map(p => ({
                    id: `q_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
                    question: p.question || "Generated Question", 
                    options: Array.isArray(p.options) && p.options.length === 4 ? p.options : ["A", "B", "C", "D"], 
                    correct: typeof p.correct === 'number' && p.correct >= 0 && p.correct <= 3 ? p.correct : 0,
                    explanation: p.explanation || "", 
                    difficulty: p.difficulty || diff, 
                    marks: mks, 
                    source: 'ai'
                }));

                questions.push(...mapped);
                renderQuestions();
                toggleAI(false);
                showToast(`✨ Generated ${mapped.length} questions successfully`);
                success = true;
                break;

            } catch(err) {
                console.log(`Model ${model} threw error:`, err.message);
                lastError = err;
            }
        }

        if (!success) {
            const isRateLimit = lastStatus === 429;
            elements.aiErr.textContent = isRateLimit
                ? "⏳ Free AI models are busy right now. Please wait 30 seconds and try again."
                : "AI Generation failed after trying all available models. Please try again.";
            elements.aiErr.classList.remove('hidden');
        } else {
            elements.aiErr.classList.add('hidden');
        }

        document.getElementById('ai-btn-text').textContent = "Generate Questions";
        document.getElementById('ai-spinner').classList.add('hidden');
        elements.aiBtn.disabled = false;
    });

    // ─────────────────────────────────────────────────────────
    // 6. VALIDATE & SAVE LOGIC
    // ─────────────────────────────────────────────────────────
    const showToast = (msg, error = false) => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        if(error) { toast.style.background = '#e05c5c'; toast.style.boxShadow = '0 8px 32px rgba(224,92,92,0.3)'; }
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const validate = () => {
        let valid = true;
        document.querySelectorAll('.err-msg').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.input-base').forEach(el => el.classList.remove('error'));

        if(elements.title.value.trim().length < 3) { elements.title.classList.add('error'); document.getElementById('err-title').textContent = "Title too short"; document.getElementById('err-title').classList.remove('hidden'); valid = false;}
        if(!elements.subject.value.trim()) { elements.subject.classList.add('error'); document.getElementById('err-subject').textContent = "Subject req."; document.getElementById('err-subject').classList.remove('hidden'); valid = false;}
        if(!elements.date.value || !elements.time.value) { document.getElementById('err-datetime').textContent = "Date/Time req."; document.getElementById('err-datetime').classList.remove('hidden'); valid = false;}
        
        if (selectedStudents.size === 0) { document.getElementById('err-students').textContent = "Select at least 1 student"; document.getElementById('err-students').classList.remove('hidden'); valid = false;}
        return valid;
    };

    document.getElementById('btn-save-draft').addEventListener('click', () => {
        saveAction('scheduled');
    });

    document.getElementById('btn-publish').addEventListener('click', (e) => {
        if (!validate()) {
            e.target.classList.add('shake');
            setTimeout(() => e.target.classList.remove('shake'), 400);
            return;
        }
        saveAction(isEditMode ? formData.status : 'scheduled');
    });

    const saveAction = (sts) => {
        const testObj = {
            id: isEditMode ? testId : 'test_' + Date.now(),
            title: elements.title.value.trim(),
            subject: elements.subject.value.trim(),
            description: elements.desc.value.trim(),
            instructions: elements.inst.value.trim(),
            duration: Number(elements.duration.value),
            totalMarks: Number(elements.totalmarks.value),
            scheduledAt: new Date(`${elements.date.value}T${elements.time.value}`).toISOString(),
            status: sts,
            createdBy: user.id,
            assignedStudents: Array.from(selectedStudents),
            allowedAttempts: 1,
            questions: questions
        };

        if (isEditMode) updateTest(testId, testObj);
        else createTest(testObj);
        
        showToast("✅ Test Saved Successfully");
        setTimeout(() => window.location.href = 'proctor-dashboard.html', 1500);
    };

    renderQuestions();
});
