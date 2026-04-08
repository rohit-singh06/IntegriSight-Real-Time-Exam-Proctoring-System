// js/proctor-dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // 1. Core State & Setup
    const userStr = sessionStorage.getItem('integrisight_user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);
    
    // Auth Check
    document.getElementById('greeting-text').innerHTML = `Loading...`;
    document.getElementById('nav-initials').textContent = user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('integrisight_user');
        window.location.href = 'login.html';
    });

    let currentFilter = 'all'; // all, scheduled, active, completed
    let confirmActionData = null;

    // Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'});
        document.getElementById('clock-time').textContent = now.toLocaleTimeString();
        
        const hour = now.getHours();
        const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
        document.getElementById('greeting-text').textContent = `${greeting}, ${user.name}`;
    }, 1000);

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderAll();
        });
    });

    const showToast = (msg) => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // Modal Handling
    const modal = document.getElementById('confirm-modal');
    document.getElementById('btn-modal-cancel').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-modal-confirm').addEventListener('click', () => {
        if (confirmActionData) {
            updateTest(confirmActionData.id, { status: confirmActionData.newStatus });
            showToast(`Test ended successfully`);
            confirmActionData = null;
            modal.classList.add('hidden');
            renderAll();
        }
    });

    // Chart.js Instances
    let chartViolations, chartTimeline, chartPie;

    // ─────────────────────────────────────────────────────────
    // RENDER LOGIC
    // ─────────────────────────────────────────────────────────
    const renderAll = () => {
        const store = getStore();
        const tests = getTestsForProctor(user.id);
        const testIds = tests.map(t => t.id);
        const sessions = store.sessions.filter(s => testIds.includes(s.testId));
        const violations = store.violations.filter(v => testIds.includes(v.testId));

        const getOrganicStatus = (t) => {
            if (t.status === 'completed') return 'completed';
            const scheduledMs = new Date(t.scheduledAt).getTime();
            const endMs = scheduledMs + (t.duration || 60) * 60000;
            const now = Date.now();
            if (now >= endMs) return 'completed';
            if (now >= scheduledMs) return 'active';
            return 'scheduled';
        };
        tests.forEach(t => t.organicStatus = getOrganicStatus(t));

        // Derived Stats
        const totalTests = tests.length;
        const activeTests = tests.filter(t => t.organicStatus === 'active').length;
        const scheduledCount = tests.filter(t => t.organicStatus === 'scheduled').length;
        const completedCount = tests.filter(t => t.organicStatus === 'completed').length;
        
        const uniqueStudents = new Set();
        tests.forEach(t => t.assignedStudents.forEach(sid => uniqueStudents.add(sid)));
        
        const liveSessionsList = sessions.filter(s => s.status === 'in_progress');
        const flaggedSessionsCount = sessions.filter(s => s.status === 'flagged').length;

        // Top Status Badges
        if (activeTests > 0) document.getElementById('live-session-badge').classList.remove('hidden');
        else document.getElementById('live-session-badge').classList.add('hidden');

        // Render Stat Cards
        const statsRowObj = [
            { title: 'Total Tests', val: totalTests, color: '#6352dd', trend: `${scheduledCount} scheduled · ${completedCount} completed`, bgIcon: '📋', isAlert: false },
            { title: 'Active Now', val: activeTests, color: '#10b981', trend: activeTests ? 'Tests in progress' : 'No active tests', bgIcon: '⚡', isAlert: false },
            { title: 'Students', val: uniqueStudents.size, color: '#00d4ff', trend: `Across ${totalTests} tests`, bgIcon: '👥', isAlert: false },
            { title: 'Live Sessions', val: liveSessionsList.length, color: '#f59e0b', trend: `${liveSessionsList.length} in progress`, bgIcon: '🔴', isAlert: false },
            { title: 'Flagged', val: flaggedSessionsCount, color: '#e05c5c', trend: `Risk score > 50`, bgIcon: '🚩', isAlert: flaggedSessionsCount > 0 }
        ];

        document.getElementById('stats-container').innerHTML = statsRowObj.map((s) => `
            <div class="stat-card" style="${s.isAlert ? 'border-color: rgba(224,92,92,0.3); animation: flaggedPulse 2s ease-in-out infinite;' : ''}">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; background: ${s.color}"></div>
                <div style="position: absolute; bottom: -8px; right: -8px; font-size: 64px; opacity: 0.04; pointer-events: none;">${s.bgIcon}</div>
                <div style="font-size: 11px; font-weight: 700; color: #555; letter-spacing: 0.1em; text-transform: uppercase;">${s.title}</div>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: -0.03em; color: ${s.val > 0 ? s.color : '#ffffff'}; margin-top: 12px;">${s.val}</div>
                <div style="margin-top: 8px; font-size: 12px; color: #555;">${s.trend}</div>
            </div>
        `).join('');

        // Live Sessions Panel
        const liveWrapper = document.getElementById('live-sessions-wrapper');
        const liveGrid = document.getElementById('live-sessions-grid');
        document.getElementById('live-active-count').textContent = liveSessionsList.length;

        if (activeTests > 0 && liveSessionsList.length > 0) {
            liveWrapper.classList.remove('hidden');
            liveGrid.innerHTML = liveSessionsList.map(sess => {
                const student = store.students.find(s => s.id === sess.studentId);
                const test = tests.find(t => t.id === sess.testId);
                const initials = student ? student.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'U';
                const isFlagged = sess.status === 'flagged';
                const v = sess.violationCount || { gaze_away: 0, face_not_visible: 0, multiple_faces: 0 };
                
                const currentMs = Date.now();
                const sessionStart = new Date(sess.startedAt).getTime() || currentMs;
                const elapsedSecs = Math.floor((currentMs - sessionStart)/1000);
                const hs = Math.floor(elapsedSecs / 3600).toString().padStart(2, '0');
                const ms = Math.floor((elapsedSecs % 3600) / 60).toString().padStart(2, '0');
                const ss = (elapsedSecs % 60).toString().padStart(2, '0');

                const riskColor = sess.riskScore > 60 ? '#e05c5c' : (sess.riskScore > 30 ? '#f59e0b' : '#10b981');
                const riskGradient = sess.riskScore > 60 ? 'linear-gradient(90deg, #e05c5c, #f87171)' : (sess.riskScore > 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10b981, #34d399)');

                return `
                <div style="background: ${isFlagged ? 'rgba(224,92,92,0.04)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isFlagged ? 'rgba(224,92,92,0.35)' : 'rgba(255,255,255,0.08)'}; border-radius: 14px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6352dd, #8b5cf6); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center;">${initials}</div>
                            <div>
                                <div style="font-size: 14px; color: #fff; font-weight: 600;">${student?.name || 'Unknown'}</div>
                                <div style="font-size: 12px; color: #555; margin-top: 2px;">${student?.enrollmentNo || 'N/A'}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            ${isFlagged ? 
                                `<div style="background: rgba(224,92,92,0.1); border: 1px solid rgba(224,92,92,0.25); color: #e05c5c; border-radius: 20px; padding: 4px 10px; font-size: 10px; font-weight: 700;">⚠ FLAGGED</div>` : 
                                `<div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; border-radius: 20px; padding: 4px 10px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 6px;"><div style="width: 4px; height: 4px; border-radius: 50%; background: #10b981; animation: pulseDot 1.5s infinite;"></div> IN PROGRESS</div>`
                            }
                            <div style="font-size: 12px; color: #555; font-family: monospace; margin-top: 6px;">${hs}:${ms}:${ss}</div>
                        </div>
                    </div>
                    <div style="margin-top: 14px; font-size: 12px; color: #555;">${test?.subject} · ${test?.title}</div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 4px 8px; font-size: 12px; color: ${v.gaze_away > 0 ? '#f59e0b' : '#888'};">👁 ${v.gaze_away}</div>
                      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 4px 8px; font-size: 12px; color: ${v.face_not_visible > 0 ? '#e05c5c' : '#888'};">🚫 ${v.face_not_visible}</div>
                      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 4px 8px; font-size: 12px; color: ${v.multiple_faces > 0 ? '#e05c5c' : '#888'};">👥 ${v.multiple_faces}</div>
                    </div>

                    <div style="margin-top: 14px;">
                      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600;">
                        <span style="color: #555;">Risk Score</span>
                        <span style="color: ${riskColor};">${sess.riskScore || 0}</span>
                      </div>
                      <div style="height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); margin-top: 6px; overflow: hidden;">
                        <div style="height: 100%; width: ${Math.min(100, sess.riskScore || 0)}%; background: ${riskGradient}; transition: width 0.5s ease;"></div>
                      </div>
                    </div>

                    <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px;">
                      <button class="ghost-btn" style="flex: 1; padding: 6px 0; color: #c0c0d8;">→ Details</button>
                    </div>
                </div>`;
            }).join('');
        } else {
            liveWrapper.classList.add('hidden');
        }

        // Manage Tests Table
        const filteredTests = tests.filter(t => currentFilter === 'all' || t.organicStatus === currentFilter);
        document.getElementById('manage-tests-desc').textContent = `${tests.length} tests · ${activeTests} active`;

        if (filteredTests.length === 0) {
            document.getElementById('table-body').innerHTML = '';
            document.getElementById('table-empty').classList.remove('hidden');
            document.getElementById('empty-msg-title').textContent = `No ${currentFilter === 'all' ? '' : currentFilter} tests found`;
        } else {
            document.getElementById('table-empty').classList.add('hidden');
            document.getElementById('table-body').innerHTML = filteredTests.map((t) => {
                
                let actionHTML = '';
                if (t.organicStatus === 'active') {
                    actionHTML = `
                        <button onclick="event.stopPropagation(); window.location.href='proctor-test-monitor.html?id=${t.id}'" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; border-radius: 6px; height: 30px; padding: 0 12px; font-size: 12px; cursor: pointer; font-weight: 600;">Monitor</button>
                        <button onclick="event.stopPropagation(); triggerEndTest('${t.id}', '${t.title}')" style="background: rgba(224,92,92,0.08); border: 1px solid rgba(224,92,92,0.2); color: #e05c5c; border-radius: 6px; height: 30px; padding: 0 12px; font-size: 12px; cursor: pointer; font-weight: 600;">End Test</button>
                    `;
                } else if (t.organicStatus === 'scheduled') {
                    actionHTML = `
                        <button class="ghost-btn" style="height: 30px; padding: 0 12px; font-size: 12px;" onclick="event.stopPropagation(); window.location.href='create-test.html?id=${t.id}'">Edit</button>
                    `;
                } else {
                    actionHTML = `
                        <button onclick="event.stopPropagation(); window.location.href='test-results.html?id=${t.id}'" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 6px; height: 30px; padding: 0 12px; font-size: 12px; cursor: pointer; font-weight: 600;">View Results</button>
                    `;
                }

                let badgeHTML = '';
                if (t.organicStatus === 'scheduled') badgeHTML = `<span style="background: rgba(99,82,221,0.1); border: 1px solid rgba(99,82,221,0.25); color: #a78bfa; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;">SCHEDULED</span>`;
                else if (t.organicStatus === 'active') badgeHTML = `<span style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; display: inline-flex; align-items:center; gap: 6px;"><div style="width: 4px; height: 4px; border-radius: 50%; background: #10b981; animation: pulseDot 1.5s infinite;"></div> LIVE</span>`;
                else badgeHTML = `<span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #555; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;">COMPLETED</span>`;

                return `
                <div class="table-row">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 3px; height: 32px; border-radius: 2px; background: ${t.organicStatus === 'scheduled' ? '#6352dd' : (t.organicStatus === 'active' ? '#10b981' : 'rgba(255,255,255,0.15)')};"></div>
                        <div>
                            <div style="font-size: 15px; color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                ${t.title}
                                ${t.questions?.length > 0 ? `<span style="background: rgba(99,82,221,0.12); border: 1px solid rgba(99,82,221,0.2); color: #a78bfa; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600;">${t.questions.length} Qs</span>` : ''}
                            </div>
                            <div style="font-size: 12px; color: #555; margin-top: 2px;">${t.questions?.length || 0} Questions · ${t.totalMarks || 0} marks</div>
                        </div>
                    </div>
                    <div style="font-size: 14px; color: #888;">${t.subject}</div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div style="font-size: 13px; color: #c0c0d8; font-weight: 500;">${new Date(t.scheduledAt).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                        <div style="font-size: 12px; color: #555;">${new Date(t.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                    <div style="font-size: 14px; color: #c0c0d8;">${t.duration}m</div>
                    <div>
                        <span style="background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.15); color: #00d4ff; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600;">
                            ${t.assignedStudents.length} students
                        </span>
                    </div>
                    <div>${badgeHTML}</div>
                    <div style="display: flex; gap: 6px; justify-content: flex-end;">${actionHTML}</div>
                </div>
                `;
            }).join('');
        }

        renderCharts(sessions, violations);
    };

    // Chart Options & rendering
    Chart.defaults.color = '#555';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = '#1a1a2e';
    Chart.defaults.plugins.tooltip.titleColor = '#fff';

    const renderCharts = (sessions, violations) => {
        // Bar Chart (Type)
        const vTypes = { 'gaze_away': 0, 'face_not_visible': 0, 'multiple_faces': 0 };
        violations.forEach(v => { if (vTypes[v.type] !== undefined) vTypes[v.type]++; });
        
        if(chartViolations) chartViolations.destroy();
        chartViolations = new Chart(document.getElementById('chart-violations'), {
            type: 'bar',
            data: {
                labels: ['Gaze Away', 'No Face', 'Multiple'],
                datasets: [{
                    label: 'Count',
                    data: [vTypes.gaze_away, vTypes.face_not_visible, vTypes.multiple_faces],
                    backgroundColor: ['#f59e0b', '#e05c5c', '#6352dd'],
                    borderRadius: 4,
                    barThickness: 30
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { 
                    x: { grid: { display: false } }, 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: {display: false} }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Line/Area Chart (Time)
        let last12Hrs = [];
        let counts = [];
        const currentMs = Date.now();
        
        for (let i = 11; i >= 0; i--) {
            const targetTime = currentMs - (i * 3600000);
            const hd = new Date(targetTime);
            last12Hrs.push(`${hd.getHours().toString().padStart(2,'0')}:00`);
            
            // Slice real violations that fall in this rolling 1-hour window
            const rangeStart = targetTime - 3600000;
            let realCount = violations.filter(v => {
                const vTime = new Date(v.timestamp).getTime();
                return vTime > rangeStart && vTime <= targetTime;
            }).length;
            
            counts.push(realCount);
        }

        if(chartTimeline) chartTimeline.destroy();
        chartTimeline = new Chart(document.getElementById('chart-timeline'), {
            type: 'line',
            data: {
                labels: last12Hrs,
                datasets: [{
                    label: 'Violations',
                    data: counts,
                    borderColor: '#6352dd',
                    borderWidth: 3,
                    fill: {
                        target: 'origin',
                        above: 'rgba(99,82,221,0.2)'
                    },
                    tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { 
                    x: { grid: { display: false } }, 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: {display: false} }
                },
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                elements: { point: { radius: 0 } }
            }
        });

        // Pie Chart
        const inProg = sessions.filter(s => s.status === 'in_progress').length;
        const sub = sessions.filter(s => s.status === 'submitted').length;
        const flag = sessions.filter(s => s.status === 'flagged').length;

        document.getElementById('pie-stat-prog').textContent = inProg;
        document.getElementById('pie-stat-sub').textContent = sub;
        document.getElementById('pie-stat-flag').textContent = flag;

        if(chartPie) chartPie.destroy();
        chartPie = new Chart(document.getElementById('chart-pie'), {
            type: 'doughnut',
            data: {
                labels: ['In Progress', 'Submitted', 'Flagged'],
                datasets: [{
                    data: [inProg || 1, sub || 1, flag || 1],
                    backgroundColor: ['#f59e0b', '#10b981', '#e05c5c'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
    };

    // Global Wrapper Functions

    window.triggerEndTest = (id, title) => {
        confirmActionData = { id, newStatus: 'completed', title };
        document.getElementById('modal-title').textContent = `End '${title}'?`;
        document.getElementById('confirm-modal').classList.remove('hidden');
    };

    // Bind monitor live top card
    document.getElementById('btn-monitor-live').addEventListener('click', () => {
        const tests = getTestsForProctor(user.id);
        const active = tests.find(t => t.status === 'active');
        if (active) window.location.href = `proctor-test-monitor.html?id=${active.id}`;
        else showToast('No active tests to monitor');
    });

    // Start loop
    renderAll();
    setInterval(renderAll, 5000); // refresh DB data periodically
});
