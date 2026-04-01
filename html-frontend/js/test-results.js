// js/test-results.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // Auth Check
    const userStr = localStorage.getItem('integrisight_user');
    if (!userStr) { window.location.href = 'login.html'; return; }
    const user = JSON.parse(userStr);

    // URL Param Check
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    if (!testId) { window.location.href = 'proctor-dashboard.html'; return; }

    const store = getStore();
    const test = store.tests.find(t => t.id === testId);
    
    if (!test || test.createdBy !== user.id) {
        window.location.href = 'proctor-dashboard.html';
        return;
    }

    document.getElementById('page-title').textContent = `Test Results: ${test.title}`;

    const sessions = store.sessions.filter(s => s.testId === testId);
    const assignedStudents = store.students.filter(s => test.assignedStudents.includes(s.id));

    const tbody = document.getElementById('table-body');
    
    if (assignedStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 32px; color: #888;">No students assigned to this test.</td></tr>`;
        return;
    }

    tbody.innerHTML = assignedStudents.map(student => {
        const session = sessions.find(s => s.studentId === student.id);
        const hasTaken = !!session;
        const score = session?.score ?? '-';
        const totalMarks = session?.totalMarks ?? (test.totalMarks || '-');
        const riskScore = session?.riskScore ?? 0;
        const status = session ? session.status : 'pending';

        let rColor = '#00daf3';
        if (riskScore > 60) rColor = '#e05c5c';
        else if (riskScore > 30) rColor = '#f59e0b';

        let statBadge = `<span class="badge badge-pend">PENDING</span>`;
        if (status === 'submitted') statBadge = `<span class="badge badge-sub">SUBMITTED</span>`;
        else if (status === 'in_progress') statBadge = `<span class="badge badge-prog">IN PROGRESS</span>`;
        else if (status === 'flagged') statBadge = `<span class="badge badge-flag">FLAGGED</span>`;

        return `
        <tr class="fade-in">
            <td style="font-size: 14px; font-weight: 600; color: #fff;">${student.name}</td>
            <td style="font-size: 13px;">${student.email}</td>
            <td style="font-size: 14px; font-weight: 700; color: #fff;">${hasTaken ? `${score} / ${totalMarks}` : '-'}</td>
            <td>
                ${hasTaken ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="risk-bar-bg"><div class="risk-bar-fill" style="width: ${Math.min(100, riskScore)}%; background: ${rColor}"></div></div>
                    <span style="font-size: 13px; font-weight: 600; color: ${rColor}">${riskScore}</span>
                </div>` : '-'}
            </td>
            <td>${statBadge}</td>
            <td style="text-align: right;">
                ${hasTaken ? `
                <button class="btn-view" onclick="window.location.href='student-result.html?testid=${testId}&studentid=${student.id}'">
                    View Details
                </button>` : ''}
            </td>
        </tr>
        `;
    }).join('');
});
