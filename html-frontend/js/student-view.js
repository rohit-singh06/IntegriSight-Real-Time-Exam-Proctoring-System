// js/student-view.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // 1. Core State & Setup
    const userStr = sessionStorage.getItem('integrisight_user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);

    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    if (!testId) {
        window.location.href = 'student-dashboard.html';
        return;
    }

    const store = getStore();
    const test = store.tests.find(x => x.id === testId);
    if (!test) {
        window.location.href = 'student-dashboard.html';
        return;
    }

    let session = store.sessions.find(s => s.testId === testId && s.studentId === user.id);
    if (!session) {
        session = {
            id: 'sess_' + Date.now(),
            testId: testId,
            studentId: user.id,
            proctorId: test.createdBy,
            startedAt: null,
            endedAt: null,
            status: 'not_started',
            violationCount: { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 },
            totalViolations: 0,
            riskScore: 0,
            answers: {}
        };
        createSession(session);
    }

    // 2. Mutable State vars
    let phase = 'loading'; // gate | active | result
    let cameraReady = false;
    let cameraError = false;
    let agreed = false;
    let apiError = false;

    let timeLeft = 0;
    let currentIndex = 0;
    let answers = session.answers || {};
    let recentViolations = [];

    const questions = test.questions || [];

    // DOM Elements
    const phases = {
        gate: document.getElementById('gate-phase'),
        active: document.getElementById('active-phase'),
        result: document.getElementById('result-phase')
    };

    const setPhase = (newPhase) => {
        phase = newPhase;
        Object.keys(phases).forEach(k => {
            if (phases[k]) phases[k].classList.add('hidden');
        });
        if (phases[newPhase]) phases[newPhase].classList.remove('hidden');

        if (newPhase === 'gate' || newPhase === 'active') {
            startCamera();
        } else {
            stopCamera();
        }
    };

    // Camera Management
    const gateVideo = document.getElementById('gate-video');
    const activeVideo = document.getElementById('active-video');
    const gateErrOverlay = document.getElementById('gate-camera-err-overlay');
    const gateStatus = document.getElementById('gate-camera-status');
    const monitorBadgeText = document.getElementById('monitor-badge-text');
    let mediaStream = null;

    const startCamera = () => {
        if (mediaStream) return;
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                mediaStream = stream;
                if (gateVideo) gateVideo.srcObject = stream;
                if (activeVideo) activeVideo.srcObject = stream;
                cameraReady = true;
                cameraError = false;
                updateGateUI();
            })
            .catch(err => {
                console.error('Webcam error:', err);
                cameraError = true;
                cameraReady = false;
                updateGateUI();
            });
    };

    const stopCamera = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (gateVideo) gateVideo.srcObject = null;
        if (activeVideo) activeVideo.srcObject = null;
    };

    // ─────────────────────────────────────────────────────────
    // GATE LOGIC
    // ─────────────────────────────────────────────────────────
    const btnBegin = document.getElementById('gate-begin-btn');
    const chkAgree = document.getElementById('gate-agree-check');

    const updateGateUI = () => {
        document.getElementById('gate-test-title').textContent = test.title;
        document.getElementById('gate-subject').textContent = test.subject;
        document.getElementById('gate-duration').textContent = `${test.duration} mins`;
        document.getElementById('gate-marks').textContent = test.totalMarks;
        document.getElementById('gate-questions').textContent = questions.length;
        document.getElementById('gate-instructions-text').textContent = test.instructions || "1. Read all questions carefully.\n2. Submit before time expires.";

        if (cameraError) {
            gateErrOverlay.classList.remove('hidden');
            gateStatus.textContent = 'Camera not accessible';
            gateStatus.style.color = '#e05c5c';
        } else if (cameraReady) {
            gateErrOverlay.classList.add('hidden');
            gateStatus.textContent = 'Camera ready';
            gateStatus.style.color = '#10b981';
        }

        if (agreed && cameraReady) {
            btnBegin.classList.remove('disabled');
            btnBegin.classList.add('ready');
            btnBegin.disabled = false;
        } else {
            btnBegin.classList.add('disabled');
            btnBegin.classList.remove('ready');
            btnBegin.disabled = true;
        }
    };

    if (chkAgree) {
        chkAgree.addEventListener('change', (e) => {
            agreed = e.target.checked;
            updateGateUI();
        });
    }

    if (btnBegin) {
        btnBegin.addEventListener('click', () => {
            const updates = { status: 'in_progress', startedAt: new Date().toISOString() };
            updateSession(session.id, updates);
            session = { ...session, ...updates };

            timeLeft = test.duration * 60;
            setPhase('active');
            startActivePhase();
        });
    }

    // ─────────────────────────────────────────────────────────
    // ACTIVE PHASE LOGIC
    // ─────────────────────────────────────────────────────────
    let timerInterval = null;
    let apiInterval = null;
    let vioCleanupInterval = null;

    const startActivePhase = () => {
        document.getElementById('active-test-title').textContent = test.title;
        updateActiveRiskUI(); // Initial stats text push
        renderQuestionsNav();
        renderCurrentQuestion();

        // Timer setup
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                timeLeft = 0;
                clearInterval(timerInterval);
                handleFinalSubmit();
            }
            updateTimerUI();
        }, 1000);

        // API Polling Loop (3s intervals)
        const canvas = document.getElementById('active-canvas');
        apiInterval = setInterval(async () => {
            if (cameraReady && activeVideo && activeVideo.readyState >= 2 && canvas) {
                canvas.width = activeVideo.videoWidth;
                canvas.height = activeVideo.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
                const base64Image = canvas.toDataURL('image/jpeg', 0.8);

                try {
                    const response = await fetch('/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ frame: base64Image })
                    });
                    if (response.ok) {
                        apiError = false;
                        const result = await response.json();
                        handleApiResult(result);
                    } else {
                        apiError = true;
                    }
                } catch (error) {
                    apiError = true;
                }
                updateMonitorBadge();
            }
        }, 3000);

        // Vault for expiring violation pills
        vioCleanupInterval = setInterval(() => {
            if (recentViolations.length > 0) {
                const now = Date.now();
                recentViolations = recentViolations.filter(v => now - v.time < 5000);
                renderRecentViolations();
            }
        }, 1000);
    };

    const handleApiResult = (result) => {
        if (result.violations && result.violations.length > 0) {
            const nowIso = new Date().toISOString();

            const newPills = [];
            result.violations.forEach(v => {
                let severity = 'low';
                if (v === 'face_not_visible') severity = 'medium';
                if (v === 'multiple_faces') severity = 'high';

                const id = 'v_' + Date.now() + Math.random().toString(36).substr(2, 5);
                addViolation({
                    id,
                    sessionId: session.id,
                    testId: session.testId,
                    studentId: session.studentId,
                    type: v,
                    timestamp: nowIso,
                    severity
                });

                session.violationCount[v] += 1;
                session.totalViolations += 1;
                newPills.push({ id, type: v, time: Date.now() });
            });

            session.riskScore = Math.min(100, session.totalViolations * 5);

            updateSession(session.id, {
                violationCount: session.violationCount,
                totalViolations: session.totalViolations,
                riskScore: session.riskScore
            });

            recentViolations = [...recentViolations, ...newPills].slice(-3);
            renderRecentViolations();
            updateActiveRiskUI();
        }
    };

    const updateMonitorBadge = () => {
        const bdg = document.getElementById('monitor-badge');
        const txt = document.getElementById('monitor-badge-text');
        const dot = bdg.querySelector('.dot');
        if (apiError) {
            txt.textContent = '⚠ API Offline';
            txt.style.color = '#e05c5c';
            dot.style.background = '#e05c5c';
        } else {
            txt.textContent = 'Monitoring';
            txt.style.color = '#10b981';
            dot.style.background = '#10b981';
        }
    };

    const updateActiveRiskUI = () => {
        document.getElementById('stat-gaze-away').textContent = session.violationCount.gaze_away || 0;
        document.getElementById('stat-face-hidden').textContent = session.violationCount.face_not_visible || 0;
        document.getElementById('stat-multi-face').textContent = session.violationCount.multiple_faces || 0;

        const score = session.riskScore || 0;
        let color = '#10b981';
        if (score > 30) color = '#f59e0b';
        if (score > 60) color = '#e05c5c';

        document.getElementById('active-risk-text').textContent = score;
        document.getElementById('active-risk-text').style.color = color;

        document.getElementById('active-risk-fill').style.width = `${score}%`;
        document.getElementById('active-risk-fill').style.background = color;
        document.getElementById('active-risk-sm').textContent = score;
        document.getElementById('active-risk-sm').style.color = color;
    };

    const renderRecentViolations = () => {
        const stack = document.getElementById('recent-violations-stack');
        stack.innerHTML = '';
        recentViolations.forEach(v => {
            const el = document.createElement('div');
            el.className = 'recent-violation-pill fade-in';
            const vTypeMap = { 'gaze_away': '👁 Gaze Away', 'face_not_visible': '🚫 Face Hidden', 'multiple_faces': '👥 Multiple Faces' };
            const vColorMap = { 'gaze_away': '#f59e0b', 'face_not_visible': '#e05c5c', 'multiple_faces': '#e05c5c' };

            el.style.color = vColorMap[v.type] || '#fff';
            el.innerHTML = `
                <span style="flex: 1;">${vTypeMap[v.type] || v.type}</span>
                <span style="font-size: 10px; color: #666;">now</span>
            `;
            stack.appendChild(el);
        });
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600).toString().padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
    };

    const updateTimerUI = () => {
        const mainTimer = document.getElementById('main-timer');
        mainTimer.textContent = formatTime(timeLeft);

        mainTimer.className = 'timer-badge';
        if (timeLeft < 60) mainTimer.classList.add('timer-danger');
        else if (timeLeft < 300) mainTimer.classList.add('timer-warning');
        else mainTimer.classList.add('timer-normal');
    };

    // ----- Question Navigation Rendering -----
    const qNavGrid = document.getElementById('q-nav-grid');
    const renderQuestionsNav = () => {
        qNavGrid.innerHTML = '';
        questions.forEach((q, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = answers[q.id] !== undefined;
            const btn = document.createElement('button');
            btn.className = 'q-nav-btn';

            if (isCurrent) btn.classList.add('q-btn-current');
            else if (isAnswered) btn.classList.add('q-btn-answered');
            else btn.classList.add('q-btn-unanswered');

            btn.textContent = i + 1;
            btn.onclick = () => {
                currentIndex = i;
                renderQuestionsNav();
                renderCurrentQuestion();
            };
            qNavGrid.appendChild(btn);
        });
    };

    const renderCurrentQuestion = () => {
        const qCard = document.getElementById('q-card');
        const currentQ = questions[currentIndex];
        if (!currentQ) return;

        let diffClass = 'rgba(16,185,129,0.15)'; let diffColor = '#10b981';
        if (currentQ.difficulty === 'hard') { diffClass = 'rgba(224,92,92,0.15)'; diffColor = '#e05c5c'; }
        else if (currentQ.difficulty === 'medium') { diffClass = 'rgba(245,158,11,0.15)'; diffColor = '#f59e0b'; }

        // Redraw card inner HTML
        let optionsHTML = currentQ.options.map((opt, oIdx) => {
            const isSelected = answers[currentQ.id] === oIdx;
            const letter = ['A', 'B', 'C', 'D'][oIdx] || oIdx;
            return `
                <div class="opt-row ${isSelected ? 'selected' : 'unselected'}" onclick="selectOption('${currentQ.id}', ${oIdx})">
                    <div class="opt-radio ${isSelected ? 'selected' : 'unselected'}">
                        ${isSelected ? '<div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>' : ''}
                    </div>
                    <div class="opt-letter ${isSelected ? 'selected' : 'unselected'}">${letter}</div>
                    <div style="flex: 1; font-size: 15px; color: ${isSelected ? 'white' : '#c0c0d8'}; font-weight: ${isSelected ? '500' : 'normal'}">
                        ${opt}
                    </div>
                </div>
            `;
        }).join('');

        qCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 13px; color: #666;">Question ${currentIndex + 1} of ${questions.length}</div>
                <div style="display: flex; gap: 8px;">
                    <div style="background: ${diffClass}; color: ${diffColor}; font-size: 11px; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; font-weight: 600;">
                        ${currentQ.difficulty}
                    </div>
                    <div style="background: rgba(255,255,255,0.06); color: #c0c0d8; font-size: 11px; padding: 2px 8px; border-radius: 4px;">
                        ${currentQ.marks} pt
                    </div>
                </div>
            </div>
            <div style="font-size: 18px; font-weight: 500; color: white; line-height: 1.7; margin: 16px 0 24px;">
                ${currentQ.question}
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${optionsHTML}
            </div>
        `;

        // Update Prev/Next buttons
        document.getElementById('btn-prev-q').disabled = (currentIndex === 0);
        document.getElementById('btn-prev-q').style.color = (currentIndex === 0) ? '#555' : 'white';
        document.getElementById('btn-prev-q').style.cursor = (currentIndex === 0) ? 'default' : 'pointer';

        const btnNext = document.getElementById('btn-next-q');
        if (currentIndex < questions.length - 1) {
            btnNext.innerHTML = 'Next &rarr;';
            btnNext.style.background = '#6352dd';
        } else {
            btnNext.innerHTML = 'Review & Submit';
            btnNext.style.background = '#10b981';
        }

        const badge = document.getElementById('q-status-badge');
        if (answers[currentQ.id] !== undefined) {
            badge.innerHTML = '<div style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); padding: 6px 12px; border-radius: 20px; font-size: 13px;">&check; Answered</div>';
        } else {
            badge.innerHTML = '<div style="background: rgba(255,255,255,0.04); color: #666; padding: 6px 12px; border-radius: 20px; font-size: 13px;">Not answered</div>';
        }

        // small fade animation restart
        qCard.classList.remove('fade-in');
        void qCard.offsetWidth; // trigger reflow
        qCard.classList.add('fade-in');
    };

    // Make global for inline onClick wrapper
    window.selectOption = (qId, idx) => {
        saveStudentAnswer(session.id, qId, idx);
        answers[qId] = idx;
        renderQuestionsNav();
        renderCurrentQuestion();
    };

    document.getElementById('btn-prev-q').addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestionsNav();
            renderCurrentQuestion();
        }
    });

    document.getElementById('btn-next-q').addEventListener('click', () => {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderQuestionsNav();
            renderCurrentQuestion();
        } else {
            openReviewModal();
        }
    });

    // Option sidebar submission
    document.getElementById('sidebar-submit-btn').addEventListener('click', () => openReviewModal());

    // ─────────────────────────────────────────────────────────
    // REVIEW MODAL LOGIC
    // ─────────────────────────────────────────────────────────
    const reviewModal = document.getElementById('review-modal');
    const openReviewModal = () => {
        const answeredCount = Object.keys(answers).length;
        const unCount = questions.length - answeredCount;

        document.getElementById('modal-total').textContent = questions.length;
        document.getElementById('modal-answered').textContent = answeredCount;
        document.getElementById('modal-answered').style.color = (answeredCount === questions.length) ? '#10b981' : 'white';
        document.getElementById('modal-unanswered').textContent = unCount;
        document.getElementById('modal-unanswered').style.color = (unCount > 0) ? '#e05c5c' : '#10b981';
        document.getElementById('modal-time').textContent = formatTime(timeLeft);

        const unListContainer = document.getElementById('modal-unanswered-list-container');
        const unPills = document.getElementById('modal-unanswered-pills');
        if (unCount > 0) {
            unListContainer.classList.remove('hidden');
            unPills.innerHTML = '';
            questions.forEach((q, i) => {
                if (answers[q.id] === undefined) {
                    const pill = document.createElement('div');
                    pill.style = "width: 30px; height: 30px; background: rgba(255,255,255,0.06); color: #888; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer;";
                    pill.textContent = i + 1;
                    pill.onclick = () => {
                        reviewModal.classList.add('hidden');
                        currentIndex = i;
                        renderQuestionsNav();
                        renderCurrentQuestion();
                    };
                    unPills.appendChild(pill);
                }
            });
        } else {
            unListContainer.classList.add('hidden');
        }

        reviewModal.classList.remove('hidden');
    };

    document.getElementById('modal-back-btn').addEventListener('click', () => {
        reviewModal.classList.add('hidden');
    });

    document.getElementById('modal-submit-final-btn').addEventListener('click', () => {
        reviewModal.classList.add('hidden');
        handleFinalSubmit();
    });

    // ─────────────────────────────────────────────────────────
    // RESULT PHASE LOGIC
    // ─────────────────────────────────────────────────────────
    const handleFinalSubmit = () => {
        clearInterval(timerInterval);
        clearInterval(apiInterval);
        clearInterval(vioCleanupInterval);
        stopCamera();

        const score = computeAndSaveScore(session.id);
        const updates = { endedAt: new Date().toISOString(), status: 'submitted', score };
        updateSession(session.id, updates);

        session = getStore().sessions.find(s => s.id === session.id);
        renderResultData();
        setPhase('result');
    };

    const renderResultData = () => {
        const totalMarks = session.totalMarks || test.totalMarks;
        const score = session.score || 0;
        const percent = Math.round((score / totalMarks) * 100) || 0;

        let grade = 'F';
        if (percent >= 90) grade = 'A+';
        else if (percent >= 80) grade = 'A';
        else if (percent >= 70) grade = 'B+';
        else if (percent >= 60) grade = 'B';
        else if (percent >= 50) grade = 'C';

        let correctCount = 0, wrongCount = 0, unattemptedCount = 0;
        questions.forEach(q => {
            const ans = session.answers?.[q.id];
            if (ans === undefined) unattemptedCount++;
            else if (ans === q.correct) correctCount++;
            else wrongCount++;
        });

        const color = percent >= 75 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#e05c5c';

        document.getElementById('result-time').textContent = `Submitted at ${new Date(session.endedAt).toLocaleTimeString()}`;

        const scoreBig = document.getElementById('result-score-big');
        scoreBig.style.color = color;
        scoreBig.innerHTML = `${score} <span style="font-size: 24px; color: #666;">/ ${totalMarks}</span>`;

        const percEl = document.getElementById('result-percent');
        percEl.textContent = `${percent}%`;
        percEl.style.color = color;

        document.getElementById('result-grade').textContent = grade;
        document.getElementById('res-correct').textContent = correctCount;
        document.getElementById('res-wrong').textContent = wrongCount;
        document.getElementById('res-unattempt').textContent = unattemptedCount;

        // Proctoring UI
        document.getElementById('res-flags-gaze').textContent = session.violationCount?.gaze_away || 0;
        document.getElementById('res-flags-face').textContent = session.violationCount?.face_not_visible || 0;
        document.getElementById('res-flags-multi').textContent = session.violationCount?.multiple_faces || 0;

        const rScore = session.riskScore || 0;
        let rColor = '#10b981';
        if (rScore > 30) rColor = '#f59e0b';
        if (rScore > 60) rColor = '#e05c5c';

        document.getElementById('res-risk-val').textContent = rScore;
        document.getElementById('res-risk-val').style.color = rColor;
        document.getElementById('res-risk-fill').style.width = `${rScore}%`;
        document.getElementById('res-risk-fill').style.background = rColor;
        document.getElementById('res-risk-sm').textContent = rScore;
        document.getElementById('res-risk-sm').style.color = rColor;
    };


    // INIT ROUTING
    if (session.status === 'submitted') {
        renderResultData();
        setPhase('result');
    } else if (session.status === 'in_progress' && session.startedAt) {
        setPhase('active');
        const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        const remaining = (test.duration * 60) - elapsed;
        timeLeft = remaining > 0 ? remaining : 0;
        startActivePhase();
    } else {
        updateGateUI();
        setPhase('gate');
    }

});
