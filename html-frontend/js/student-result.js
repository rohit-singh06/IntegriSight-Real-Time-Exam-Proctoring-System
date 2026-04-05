// js/student-result.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // Auth
    const userStr = sessionStorage.getItem('integrisight_user');
    if (!userStr) { window.location.href = 'login.html'; return; }

    // Params
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testid');
    const studentId = urlParams.get('studentid');

    if (!testId || !studentId) {
        window.location.href = 'proctor-dashboard.html';
        return;
    }

    document.getElementById('btn-back').addEventListener('click', () => {
        window.location.href = `test-results.html?id=${testId}`;
    });

    const store = getStore();
    const test = store.tests.find(t => t.id === testId);
    const student = store.students.find(s => s.id === studentId);

    if (!test || !student) {
        window.location.href = 'proctor-dashboard.html';
        return;
    }

    const sessions = store.sessions.filter(s => s.testId === testId);
    const session = sessions.find(s => s.studentId === studentId);

    if (!session) {
        document.querySelector('.container').innerHTML = `<div style="color: white; font-size: 20px;">Student has not taken this test yet.</div>`;
        return;
    }

    const violations = store.violations.filter(v => v.sessionId === session.id);

    // Compute UI Strings
    document.getElementById('student-name').textContent = `${student.name}'s Report`;
    document.getElementById('meta-info').innerHTML = `Test: <span style="color: #fff; font-weight: 500;">${test.title}</span> &bull; Enrollment: ${student.enrollmentNo}`;
    
    document.getElementById('final-score').innerHTML = `${session.score || 0} <span>/ ${session.totalMarks || test.totalMarks}</span>`;

    // Metrics
    const totalQuestions = test.questions ? test.questions.length : 0;
    const attemptedQuestions = session.answers ? Object.keys(session.answers).length : 0;
    
    let correctCount = 0;
    let incorrectCount = 0;

    const tbody = document.getElementById('q-table-body');
    let qRows = '';

    if (test.questions) {
        test.questions.forEach((q, idx) => {
            const ans = session.answers ? session.answers[q.id] : undefined;
            const isAttempted = ans !== undefined;
            const isCorrect = isAttempted && ans === q.correct;
            
            if (isCorrect) correctCount++;
            else if (isAttempted) incorrectCount++;

            let resHTML = `<span style="color: #c8c5cc; font-size: 12px;">Skipped</span>`;
            if (isCorrect) {
                resHTML = `<span style="color: #00daf3; font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 4px;">✓ Correct</span>`;
            } else if (isAttempted) {
                resHTML = `<span style="color: #ffb4ab; font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 4px;">✕ Incorrect</span>`;
            }

            qRows += `
            <tr class="fade-in">
                <td style="color: #c8c5cc;">${idx + 1}</td>
                <td style="color: #e4e1f0; font-size: 14px;">
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">
                        ${q.question || q.text || "Missing question content"}
                    </div>
                </td>
                <td>${resHTML}</td>
            </tr>`;
        });
    }

    if (qRows === '') {
        qRows = `<tr><td colspan="3" style="text-align:center; color:#888;">No question data available.</td></tr>`;
    }
    tbody.innerHTML = qRows;

    document.getElementById('stat-attempt').innerHTML = `${attemptedQuestions} <span>/ ${totalQuestions}</span>`;
    document.getElementById('stat-correct').textContent = correctCount;
    document.getElementById('stat-incorrect').textContent = incorrectCount;

    // AI Integrity Log
    const riskScore = session.riskScore || 0;
    const riskBadge = document.getElementById('risk-badge');
    riskBadge.textContent = `Risk: ${riskScore}%`;
    if (riskScore > 60) {
        riskBadge.style.background = 'rgba(255, 180, 171, 0.15)';
        riskBadge.style.color = '#ffb4ab';
    } else {
        riskBadge.style.background = 'rgba(0, 218, 243, 0.15)';
        riskBadge.style.color = '#00daf3';
    }

    const vCount = session.violationCount || { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 };
    document.getElementById('vio-gaze').textContent = vCount.gaze_away;
    document.getElementById('vio-face').textContent = vCount.face_not_visible;
    document.getElementById('vio-multi').textContent = vCount.multiple_faces;
    
    const totalViolations = vCount.gaze_away + vCount.face_not_visible + vCount.multiple_faces;
    document.getElementById('vio-total').textContent = totalViolations;

    const timelineList = document.getElementById('timeline-list');
    if (violations.length === 0) {
        timelineList.innerHTML = `<div style="color: #00daf3; font-size: 13px; text-align: center; padding: 20px; background: #001f24; border-radius: 8px;">No violations detected. Session was clean.</div>`;
    } else {
        const sorted = violations.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        timelineList.innerHTML = sorted.map((v, i) => {
            const labelMap = { 'gaze_away': 'Looked Away', 'face_not_visible': 'Face Not Visible', 'multiple_faces': 'Multiple Faces Detected' };
            const labelStr = labelMap[v.type] || v.type;
            const dotColor = v.type === 'gaze_away' ? '#ffd270' : '#ffb4ab';

            return `
            <div class="timeline-item fade-in">
                <div class="timeline-line">
                    <div class="timeline-dot" style="background: ${dotColor}"></div>
                </div>
                <div>
                   <div style="font-size: 13px; color: #fff; font-weight: 500; margin-bottom: 2px;">${labelStr}</div>
                   <div style="font-size: 11px; color: #888;">${new Date(v.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>`;
        }).join('');
    }
});
