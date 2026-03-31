import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentView from './pages/StudentView';
import ProctorDashboard from './pages/ProctorDashboard';
import CreateTest from './pages/CreateTest';
import ProctorTestMonitor from './pages/ProctorTestMonitor';
import AboutPage from './pages/AboutPage';
import TestResults from './pages/TestResults';
import StudentResult from './pages/StudentResult';
import ProtectedRoute from './components/ProtectedRoute';
import { ViolationProvider } from './context/ViolationContext';
import './App.css';

function App() {
  return (
    <ViolationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          
          <Route path="/student/dashboard" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/student" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student/test/:testId" element={
            <ProtectedRoute role="student">
              <StudentView />
            </ProtectedRoute>
          } />

          <Route path="/proctor/dashboard" element={
            <ProtectedRoute role="proctor">
              <ProctorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/proctor/create-test" element={
            <ProtectedRoute role="proctor">
              <CreateTest />
            </ProtectedRoute>
          } />

          <Route path="/proctor/edit-test/:testId" element={
            <ProtectedRoute role="proctor">
              <CreateTest />
            </ProtectedRoute>
          } />

          <Route path="/proctor/test/:testId" element={
            <ProtectedRoute role="proctor">
              <ProctorTestMonitor />
            </ProtectedRoute>
          } />

          <Route path="/proctor/test/:testId/results" element={
            <ProtectedRoute role="proctor">
              <TestResults />
            </ProtectedRoute>
          } />

          <Route path="/proctor/test/:testId/student/:studentId" element={
            <ProtectedRoute role="proctor">
              <StudentResult />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ViolationProvider>
  );
}

export default App;
