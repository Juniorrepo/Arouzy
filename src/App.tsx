import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import Profile from './pages/Profile';

// Pages
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Upload from './pages/Upload';
import ChatHeader from './components/chat/chatHeader';
import ChatContainer from './components/chat/chatContainer';
import ChatUI from './components/chat/chatContainer';
import ChatHomePage from './components/chat/chatHome';
import MessageInput from './components/chat/messageInput';

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/" /> : <SignUp />
        } />
        <Route path="/login" element={<Login />} />
        
        {/* Public Profile Page */}
        <Route path="/profile/:username" element={<Profile />} />
        

        {/* Chat Page */}
       <Route path="/chat" element={<ChatHomePage />} />

        {/* Upload Page */}
        <Route path="/upload" element={
          isAuthenticated
            ? <Upload />
            : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;