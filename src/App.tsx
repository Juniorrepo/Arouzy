import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import Profile from './pages/Profile';

// Pages
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/" /> : <SignUp />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login />
        } />
        
        {/* Public Profile Page */}
        <Route path="/profile/:username" element={<Profile />} />
        
        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;