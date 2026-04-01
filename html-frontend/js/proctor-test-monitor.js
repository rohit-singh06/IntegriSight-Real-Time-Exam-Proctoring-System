// js/proctor-test-monitor.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // 1. Core State
    const userStr = localStorage.getItem('integrisight_user');
    if (!userStr) { window.location.href = 'login.html'; return; }
    const user = JSON.parse(userStr);

    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    if (!testId) { window.location.href = 'proctor-dashboard.html'; return; }

    let test = null;
    let questions = [];
    
    // Tabs state
    let activeTab = 'overview';
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeTab = e.target.dataset.tab;
            
            document.getElementById('tab-overview').classList.add('hidden');
            document.getElementById('tab-questions').classList.add('hidden');
            document.getElementById(`tab-${activeTab}`).classList.remove('hidden');
        });
    });

    const getSeverityColor = (type) => {
        if (type === 'gaze_away') return '#f59e0b';
        if (type === 'face_not_visible') return '#e05c5c';
        if (type === 'multiple_faces') return '#a78bfa';
        return '#888';
    };

    const renderQuestionsOnce = () => {
        const qList = document.getElementById('q-list');
        if (questions.length === 0) {
            qList.innerHTML = `<div style="text-align: center; color: #888; padding: 40px 0; font-size: 13px;">No questions in this test.</div>`;
            return;
        }

        qList.innerHTML = questions.map((q, i) => `
            <div class="q-card-read fade-in">
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                    <span style="background: rgba(255,255,255,0.1); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">Q${i+1}</span>
                    <span style="font-size: 13px; color: #888; text-transform: capitalize;">${q.difficulty} &middot; ${q.marks} Marks</span>
                </div>
                <div style="font-size: 14px; color: #fff; line-height: 1.5;">${q.question}</div>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 12px;">
                    ${q.options.map((opt, oi) => `
                        <div class="q-row-read ${q.correct === oi ? 'correct' : ''}">
                            <div style="width: 20px; height: 20px; border-radius: 50%; background: ${q.correct === oi ? '#10b981' : 'rgba(255,255,255,0.08)'}; color: ${q.correct === oi ? '#fff' : '#888'}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink:0;">${['A','B','C','D'][oi]}</div>
                            <div style="font-size: 13px; color: ${q.correct === oi ? '#fff' : '#c0c0d8'};">${opt}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    };

    // 2. Main Render Loop
    const tick = () => {
        const store = getStore();
        if (!test) {
            test = store.tests.find(x => x.id === testId);
            if (!test || test.createdBy !== user.id) {
                window.location.href = 'proctor-dashboard.html';
                return;
            }
            document.getElementById('test-title').textContent = `${test.title} (Live Monitor)`;
            if (test.status === 'active') {
                const b = document.getElementById('test-badge');
                b.style.display = 'flex';
            }
            document.getElementById('test-meta').textContent = `${test.assignedStudents.length} Students Assigned · Real-time data sync active`;
            questions = test.questions || [];
            document.getElementById('q-meta').textContent = `${questions.length} Questions · ${test.totalMarks} Marks`;
            renderQuestionsOnce();
        }

        const sessions = store.sessions.filter(x => x.testId === testId);
        const violations = store.violations.filter(x => x.testId === testId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Update Top Stats
        document.getElementById('stat-prog').textContent = sessions.filter(s => s.status === 'in_progress').length;
        document.getElementById('stat-sub').textContent = sessions.filter(s => s.status === 'submitted').length;
        document.getElementById('stat-flag').textContent = sessions.filter(s => s.status === 'flagged').length;

        // Render Student Grid
        const grid = document.getElementById('student-grid');
        grid.innerHTML = test.assignedStudents.map(studentId => {
            const student = store.students.find(s => s.id === studentId);
            const session = sessions.find(s => s.studentId === studentId);
            
            if (!session) {
                return `
                <div class="student-card offline fade-in">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #2a2a3e; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #fff;">
                            ${student.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #fff; font-size: 14px;">${student.name}</div>
                            <div style="font-size: 12px; color: #888;">${student.enrollmentNo}</div>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #888; background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px;">
                        Haven't Started Connecting
                    </div>
                </div>`;
            }

            const riskScore = session.riskScore || 0;
            const isHighRisk = riskScore > 60;
            const isFlagged = session.status === 'flagged';
            const isDone = session.status === 'submitted';
            
            let statusColor = "bg-success";
            if (isFlagged) { statusColor = "bg-danger"; } 
            else if (isDone) { statusColor = "bg-purple"; }
            else if (isHighRisk) { statusColor = "bg-danger"; }

            let badge = '';
            if (session.status === 'in_progress') badge = `<span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">LIVE</span>`;
            if (session.status === 'submitted') badge = `<span style="background: rgba(99,82,221,0.1); color: #a78bfa; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">DONE</span>`;
            if (session.status === 'flagged') badge = `<span style="background: rgba(224,92,92,0.1); color: #e05c5c; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">FLAGGED</span>`;

            let vio = session.violationCount || { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 };

            return `
            <div class="student-card fade-in ${isHighRisk && !isDone && !isFlagged ? 'high-risk' : ''}">
                <div class="status-bar ${statusColor}"></div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #2a2a3e; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #fff;">
                       ${student.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                         <div style="font-weight: 600; color: #fff; font-size: 14px;">${student.name}</div>
                         <div style="font-size: 12px; color: #888;">${student.enrollmentNo}</div>
                    </div>
                    <div style="margin-left: auto;">${badge}</div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>Risk Score</span>
                        <span style="font-weight: bold; color: ${isHighRisk ? '#e05c5c' : '#fff'}">${riskScore}%</span>
                    </div>
                    <div style="width: 100%; background: rgba(255,255,255,0.06); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${Math.min(100, riskScore)}%; height: 100%; background: ${isHighRisk ? '#e05c5c' : (riskScore > 30 ? '#f59e0b' : '#10b981')}; transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                       <span style="color: #888; font-size: 10px;">Total</span>
                       <span style="color: #fff; font-weight: 600;">${session.totalViolations || 0}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                       <span style="color: #f59e0b; font-size: 10px;">Gaze</span>
                       <span style="color: #fff; font-weight: 600;">${vio.gaze_away}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                       <span style="color: #e05c5c; font-size: 10px;">Face</span>
                       <span style="color: #fff; font-weight: 600;">${vio.face_not_visible}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                       <span style="color: #a78bfa; font-size: 10px;">Multi</span>
                       <span style="color: #fff; font-weight: 600;">${vio.multiple_faces}</span>
                    </div>
                </div>

                ${session.status === 'in_progress' ? `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);">
                       <button class="btn-flag" onclick="window.triggerFlag('${session.id}')">Flag Session</button>
                    </div>
                ` : ''}
            </div>`;
        }).join('');

        // Render Timeline
        if (violations.length === 0) {
            document.getElementById('timeline-empty').classList.remove('hidden');
            document.getElementById('timeline-wrap').classList.add('hidden');
        } else {
            document.getElementById('timeline-empty').classList.add('hidden');
            document.getElementById('timeline-wrap').classList.remove('hidden');
            
            document.getElementById('timeline-list').innerHTML = violations.map(v => {
                 const student = store.students.find(s => s.id === v.studentId);
                 const c = getSeverityColor(v.type);
                 return `
                 <div class="timeline-item fade-in">
                     <div class="timeline-dot" style="border-color: ${c};">
                        <div class="timeline-inner-dot" style="background: ${c};"></div>
                     </div>
                     <div class="timeline-card">
                         <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div style="font-weight: 600; color: #fff; font-size: 13px;">${student?.name || 'Unknown'}</div>
                            <div style="font-size: 11px; color: #888;">${new Date(v.timestamp).toLocaleTimeString()}</div>
                         </div>
                         <div style="font-size: 12px; color: ${c}; text-transform: capitalize; font-weight: 500;">
                            ${v.type.replace(/_/g, ' ')}
                         </div>
                     </div>
                 </div>`;
            }).join('');
        }
    };

    window.triggerFlag = (sessionId) => {
        updateSession(sessionId, { status: 'flagged' });
        tick(); // immediate update
    };

    tick();
    setInterval(tick, 2000); // 2-second data refresh polling interval
});
