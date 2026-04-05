// js/student-dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // Auth Check
    const userStr = sessionStorage.getItem('integrisight_user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    // Fetch Data
    const store = getStore();
    const tests = getTestsForStudent(user.id);
    const sessions = store.sessions.filter(s => s.studentId === user.id);
    let violations = store.violations.filter(v => v.studentId === user.id);
    violations = violations.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    // State
    let filter = 'All'; // Default filter
    
    // DOM Elements
    const navName = document.getElementById('nav-name');
    const navAvatar = document.getElementById('nav-avatar');
    const signOutBtn = document.getElementById('sign-out-btn');
    const greetingTitle = document.getElementById('greeting-title');
    const dateText = document.getElementById('date-text');
    const timeText = document.getElementById('time-text');
    
    // Stats elements
    const statAssigned = document.getElementById('stat-assigned');
    const statUpcoming = document.getElementById('stat-upcoming');
    const statCompleted = document.getElementById('stat-completed');
    const statViolations = document.getElementById('stat-violations');

    // Init Navbar
    navName.textContent = user.name;
    const getInitials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().substring(0, 2) : 'U';
    navAvatar.textContent = getInitials(user.name);

    signOutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('integrisight_user');
        window.location.href = 'login.html';
    });

    // Time & Greeting Logic
    const updateTime = () => {
        const now = new Date();
        dateText.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeText.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const hour = now.getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        
        greetingTitle.textContent = `${greeting}, ${user.name} 👋`;
    };
    updateTime();
    setInterval(updateTime, 1000);

    // Compute Stats
    statAssigned.textContent = tests.length;
    statUpcoming.textContent = tests.filter(t => t.status === 'scheduled').length;
    statCompleted.textContent = sessions.filter(s => s.status === 'submitted' || s.status === 'flagged').length;
    statViolations.textContent = violations.length;

    // Filters UI
    const filters = ['All', 'Scheduled', 'Active', 'Completed', 'Missed', 'Past'];
    const filterGroup = document.getElementById('filter-group');
    
    const renderFilters = () => {
        filterGroup.innerHTML = '';
        filters.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${filter === f ? 'active' : ''}`;
            btn.textContent = f;
            btn.onclick = () => {
                filter = f;
                renderFilters();
                renderTests();
            };
            filterGroup.appendChild(btn);
        });
    };
    renderFilters();

    // Render Tests
    const testsGrid = document.getElementById('tests-grid');
    
    const renderTests = () => {
        const filteredTests = tests.filter(t => {
            const isCompleted = t.status === 'completed' || sessions.find(s => s.testId === t.id && (s.status === 'submitted' || s.status === 'flagged'));
            const testEndTime = new Date(new Date(t.scheduledAt).getTime() + (t.duration || 60) * 60000);
            const isMissed = t.status === 'scheduled' && new Date() > testEndTime;

            if (filter === 'All') return true;
            if (filter === 'Scheduled') return t.status === 'scheduled' && !isMissed;
            if (filter === 'Active') return t.status === 'active';
            if (filter === 'Completed') return isCompleted;
            if (filter === 'Missed') return isMissed;
            if (filter === 'Past') return isCompleted || isMissed;
            return true;
        });

        if (filteredTests.length === 0) {
            testsGrid.style.display = 'block';
            testsGrid.innerHTML = `
                <div class="empty-state">
                    No tests match the current filter.
                </div>
            `;
            return;
        }

        testsGrid.style.display = 'grid';
        testsGrid.innerHTML = '';

        filteredTests.forEach(test => {
            const scheduledDate = new Date(test.scheduledAt);
            const testEndTime = new Date(scheduledDate.getTime() + (test.duration || 60) * 60000);
            
            const existingSession = sessions.find(s => s.testId === test.id);
            const userSubmitted = existingSession && (existingSession.status === 'submitted' || existingSession.status === 'flagged');

            const isMissed = !userSubmitted && test.status === 'scheduled' && Date.now() > testEndTime;
            const isCompleted = test.status === 'completed' || userSubmitted;
            const timeHasPassed = Date.now() >= scheduledDate.getTime();
            const isActive = (test.status === 'active' || (test.status === 'scheduled' && timeHasPassed)) && !isCompleted && !isMissed;
            const isScheduled = test.status === 'scheduled' && !timeHasPassed && !isMissed && !isCompleted;

            let statusBadgeHTML = '';
            if (isCompleted) statusBadgeHTML = '<div class="badge-completed">COMPLETED</div>';
            else if (isMissed) statusBadgeHTML = '<div class="badge-missed">MISSED</div>';
            else if (isActive) statusBadgeHTML = '<div class="badge-live"><div class="live-pulse"></div>LIVE</div>';
            else statusBadgeHTML = '<div class="badge-scheduled">SCHEDULED</div>';

            const formattedDate = scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

            const card = document.createElement('div');
            card.className = 'test-card';
            
            // Generate Footer based on state
            let footerHTML = '';
            if (isScheduled) {
                // Calculate time diff once for initial render, rely on interval if we wanted live updates (skipped here for simplicity, will just show "Starts soon" or static)
                footerHTML = `
                    <div class="footer-row">
                        <div class="footer-text text-purple" id="timer-${test.id}">Starts soon</div>
                        <button class="btn-disabled" disabled>Starts Soon</button>
                    </div>
                `;
            } else if (isActive) {
                footerHTML = `<button class="btn-primary" onclick="enterExam('${test.id}', '${test.createdBy}')">Enter Exam →</button>`;
            } else if (isMissed) {
                footerHTML = `
                    <div class="footer-row">
                        <div class="footer-text text-red">Deadline passed</div>
                        <button class="btn-disabled" disabled>Missed</button>
                    </div>
                `;
            } else if (isCompleted) {
                footerHTML = `
                    <div class="footer-row">
                        <div class="footer-text text-green">${userSubmitted ? 'Evaluation ready' : 'Exam closed'}</div>
                        <button class="${userSubmitted ? 'btn-outline-purple' : 'btn-disabled'}" 
                            ${!userSubmitted ? 'disabled' : `onclick="window.location.href='student-view.html?id=${test.id}'"`}>
                            ${userSubmitted ? 'View Report →' : 'No Submission'}
                        </button>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-top">
                    ${statusBadgeHTML}
                    <div class="subject-tag">${test.subject}</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <h3 class="card-title">${test.title}</h3>
                    <p class="card-desc">${test.description || 'No description provided.'}</p>
                    <div class="card-proctor">Proctored by ${test.createdBy}</div>
                </div>
                <div class="card-details">
                    <div class="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${formattedDate} &middot; ${formattedTime}
                    </div>
                    <div class="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${test.duration} minutes
                    </div>
                    <div class="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${test.totalMarks} marks
                    </div>
                </div>
                <div class="card-footer">
                    ${footerHTML}
                </div>
            `;
            testsGrid.appendChild(card);
        });
    };
    renderTests();

    // Attach function to global scope for onclick handler
    window.enterExam = (testId, proctorId) => {
        let store = getStore();
        let sessionsList = store.sessions.filter(s => s.testId === testId);
        let existing = sessionsList.find(s => s.studentId === user.id);
        
        if (!existing) {
            createSession({
                id: 'sess_' + Date.now(),
                testId: testId,
                studentId: user.id,
                proctorId: proctorId,
                startedAt: null,
                endedAt: null,
                status: 'not_started',
                violationCount: { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 },
                totalViolations: 0,
                riskScore: 0
            });
        }
        window.location.href = `student-view.html?id=${testId}`;
    };

    // Render Violations Table
    const vContainer = document.getElementById('violations-container');
    const getSeverityColor = (t) => {
        if (t === 'gaze_away') return '#f59e0b';
        if (t === 'face_not_visible') return '#e05c5c';
        if (t === 'multiple_faces') return '#a78bfa';
        return '#888';
    };
    const getSeverityLabel = (t) => {
        if (t === 'gaze_away') return 'Low';
        if (t === 'face_not_visible') return 'Medium';
        if (t === 'multiple_faces') return 'High';
        return 'Unknown';
    };

    if (violations.length === 0) {
        vContainer.innerHTML = `
            <div class="violations-empty">
                <div class="violations-empty-icon">
                    <svg width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>No violations recorded. Keep it up! ✅</div>
            </div>
        `;
    } else {
        let rows = '';
        violations.slice(0, 10).forEach(v => {
            const test = tests.find(t => t.id === v.testId);
            const testName = test ? test.title : 'Unknown Test';
            const color = getSeverityColor(v.type);

            rows += `
                <tr>
                    <td>${new Date(v.timestamp).toLocaleString()}</td>
                    <td class="text-white">${testName}</td>
                    <td class="capitalize">
                        <div class="violation-pill">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}"></span>
                            ${v.type.replace(/_/g, ' ')}
                        </div>
                    </td>
                    <td>
                        <span class="severity-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                            ${getSeverityLabel(v.type)}
                        </span>
                    </td>
                </tr>
            `;
        });
        vContainer.innerHTML = `
            <table class="violations-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Test</th>
                        <th>Violation Type</th>
                        <th>Severity</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
});
