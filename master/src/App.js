import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StageMaster from './components/StageMaster';
import SkillMaster from './components/SkillMaster';
import UserSkills from './components/UserSkills';
import UserShiftUpload from './components/UserShiftUpload';
import UserShiftReport from './components/UserShiftReport';
import Attendance from './components/Attendance';

const darkDrawerTheme = createTheme({
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#333',
          color: '#fff',
        },
      },
    },
  },
});

const AppContent = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  const location = useLocation();

  // Determine if the current route is "/login"
  const showNavbar = !(location.pathname === "/login" || location.pathname === "/home");

  return (
    <div>
      {showNavbar && isAuthenticated && <HomePage />}
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => {
          localStorage.setItem('authToken', 'dummyToken'); // Simulate setting an auth token
          window.location.href = "/home"; // Navigate to the home page after login
        }} />} />
        <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/stage-master" element={isAuthenticated ? <StageMaster /> : <Navigate to="/login" />} />
        <Route path="/skill-master" element={isAuthenticated ? <SkillMaster /> : <Navigate to="/login" />} />
        <Route path="/user-skills" element={isAuthenticated ? <UserSkills /> : <Navigate to="/login" />} />
        <Route path="/user-shift-upload" element={isAuthenticated ? <UserShiftUpload /> : <Navigate to="/login" />} />
        <Route path="/user-shift-report" element={isAuthenticated ? <UserShiftReport /> : <Navigate to="/login" />} />
        <Route path="/attendance" element={isAuthenticated ? <Attendance /> : <Navigate to="/login" />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/login" /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={darkDrawerTheme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;
