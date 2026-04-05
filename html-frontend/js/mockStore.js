// js/mockStore.js
// central data layer for the whole app
// using sessionStorage for tab isolation (Proctor in one tab, Student in another)
// structure: students, proctors, tests, sessions, violations

const INITIAL_DATA = {
  students: [
    { id: "s1", name: "Rohit Singh", email: "rohit@gmail.com", 
      password: "username123", role: "student", enrollmentNo: "2319451" },
    { id: "s2", name: "Anushka Dandriyal", email: "anushka@gmail.com", 
      password: "username123", role: "student", enrollmentNo: "230112555" },
    { id: "s3", name: "Kartik", email: "kartik@gmail.com", 
      password: "username123", role: "student", enrollmentNo: "230112556" },
    { id: "s4", name: "Karan Joshi", email: "karan@gmail.com", 
      password: "username123", role: "student", enrollmentNo: "230198712" },
    { id: "s5", name: "Sneha Rawat", email: "sneha@gmail.com", 
      password: "username123", role: "student", enrollmentNo: "230187634" }
  ],
  proctors: [
    { id: "p1", name: "Dr. A. Kumar",   email: "proctor@gmail.com", 
      password: "proctor123", role: "proctor", subject: "Computer Science" },
    { id: "p2", name: "Prof. R. Singh", email: "proctor2@gmail.com",
      password: "proctor123", role: "proctor", subject: "Mathematics" }
  ],
  tests: [],
  sessions: [],
  violations: []
};

// TODO: add proper validation before saving to store
// right now nothing stops you from saving garbage data

async function initStore() {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
        const data = await res.json();
        if (data) {
            sessionStorage.setItem('integrisight_store_v2', JSON.stringify(data));
            return;
        }
    }
  } catch(e) { console.error('API /db load failed', e); }

  // if no data from API, try local storage, else initialize and POST to API
  const exist = sessionStorage.getItem('integrisight_store_v2');
  if (!exist) {
      sessionStorage.setItem('integrisight_store_v2', JSON.stringify(INITIAL_DATA));
      try {
        await fetch('/api/db', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(INITIAL_DATA)
        });
      } catch(e) {}
  } else {
      try {
        await fetch('/api/db', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: exist
        });
      } catch(e) {}
  }
}

function getStore() {
  const storeStr = sessionStorage.getItem('integrisight_store_v2');
  if (storeStr) {
    try {
      return JSON.parse(storeStr);
    } catch(err) {
      console.error(err);
    }
  }
  return INITIAL_DATA;
}

function saveStore(storeObj) {
  const payload = JSON.stringify(storeObj);
  sessionStorage.setItem('integrisight_store_v2', payload);
  window.dispatchEvent(new Event('integrisight_store_update'));
  
  // async save to backend silently
  fetch('/api/db', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: payload
  }).catch(e => console.error('Failed to save to backend', e));
}

function getTestsForStudent(studentId) {
  const store = getStore();
  return store.tests.filter(t => t.assignedStudents.includes(studentId));
}

function getTestsForProctor(pid) {
  const s = getStore();
  return s.tests.filter(test => test.createdBy === pid);
}


function getSessionsForTest(tid) {
  const store = getStore();
  return store.sessions.filter(s => s.testId === tid);
}

function getViolationsForSession(sessionId) {
  const store = getStore();
  return store.violations.filter(v => v.sessionId === sessionId);
}


function createTest(newTest) {
  const store = getStore();
  store.tests.push(newTest);
  
  saveStore(store);
}

function updateTest(targetId, updateData) {
  const store = getStore();
  const i = store.tests.findIndex(t => t.id === targetId);
  if (i > -1) {
    store.tests[i] = { ...store.tests[i], ...updateData };
    saveStore(store);
  }
}

function createSession(sess) {
  const st = getStore();
  st.sessions.push(sess);
  saveStore(st);
}

function updateSession(sid, updates) {
  const store = getStore();
  const idx = store.sessions.findIndex(s => s.id === sid);
  if (idx > -1) {
    store.sessions[idx] = { ...store.sessions[idx], ...updates };
    saveStore(store);
  }
}

function addViolation(v) {
  const store = getStore();
  store.violations.push(v);
  saveStore(store);
}

function addQuestionToTest(tid, q) {
  const store = getStore();
  const test = store.tests.find(t => t.id === tid);
  
  if (test) {
    if (!test.questions) test.questions = [];
    test.questions.push(q);
    saveStore(store);
  }
}

function updateQuestionInTest(tid, qid, updates) {
  const store = getStore();
  const test = store.tests.find(t => t.id === tid);
  if (test && test.questions) {
    const i = test.questions.findIndex(q => q.id === qid);
    if (i > -1) {
      test.questions[i] = { ...test.questions[i], ...updates };
      saveStore(store);
    }
  }
}

function deleteQuestionFromTest(testId, qid) {
  const store = getStore();
  const test = test.tests.find(t => t.id === testId);
  if (test && test.questions) {
    test.questions = test.questions.filter(q => q.id !== qid);
    saveStore(store);
  }
}

function saveStudentAnswer(sid, qid, optIdx) {
  const store = getStore();
  const session = store.sessions.find(s => s.id === sid);
  if (session) {
    if (!session.answers) session.answers = {};
    session.answers[qid] = optIdx;
    saveStore(store);
  }
}

function computeAndSaveScore(sessionId) {
  const store = getStore();
  const session = store.sessions.find(s => s.id === sessionId);
  if (!session) return 0;
  
  const test = store.tests.find(t => t.id === session.testId);
  if (!test || !test.questions) return 0;
  
  let score = 0;
  let totalMarks = test.totalMarks || 0;
  
  test.questions.forEach(q => {
    if (session.answers && session.answers[q.id] === q.correct) {
      score += (q.marks || 0);
    }
  });
  
  session.score = score;
  session.totalMarks = totalMarks;
  saveStore(store);
  return score;
}
