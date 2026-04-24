import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ProfileModal from './components/ProfileModal';
import SettingsPanel from './components/SettingsPanel';
import LoginModal from './components/LoginModal';
import MistakeBookModal from './components/MistakeBookModal';
import ReportModal from './components/ReportModal';
import axios from 'axios';
import { themes } from './themeConfig';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('游客');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const theme = themes.rose;   // 黑白极简

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMistakeBook, setShowMistakeBook] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (loggedIn) {
      API.get(`/api/history?username=${username}`)
        .then(res => {
          const msgs = res.data.history.map(h => ({ sender: h.role, text: h.content }));
          setMessages(msgs);
        })
        .catch(() => { });
    }
  }, [loggedIn, username]);

  // 文件批改
  const uploadHomework = async (file) => {
    const userMsg = { sender: 'user', text: '📎 作业文件已上传' };
    setMessages(prev => [...prev, userMsg]);
    const loadingMsg = { sender: 'assistant', text: 'loading' };
    setMessages(prev => [...prev, loadingMsg]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/api/upload-homework', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '❌ 批改上传失败，请稍后重试' }]);
    }
  };

  // 拍照搜题
  const photoSearch = async (file) => {
    const userMsg = { sender: 'user', text: '📷 拍照搜题' };
    setMessages(prev => [...prev, userMsg]);
    const loadingMsg = { sender: 'assistant', text: 'loading' };
    setMessages(prev => [...prev, loadingMsg]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/api/photo-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '📷 搜题失败，请稍后重试' }]);
    }
  };

  // 文本发送
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const loadingMsg = { sender: 'assistant', text: 'loading' };
    setMessages(prev => [...prev, loadingMsg]);
    try {
      const res = await API.post('/api/chat', { message: input, username, logged_in: loggedIn });
      const data = res.data;
      const aiMsg = { sender: 'assistant', text: data.reply, download: data.worksheet_ready ? { title: data.title } : null };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '❌ 小智老师走神了，请稍后再试~' }]);
    }
  };

  // 发送错题本中的题目到聊天区
  const handleSendToChat = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
    (async () => {
      const loadingMsg = { sender: 'assistant', text: 'loading' };
      setMessages(prev => [...prev, loadingMsg]);
      try {
        const res = await API.post('/api/chat', { message: text, username, logged_in: loggedIn });
        setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: res.data.reply }]);
      } catch {
        setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '❌ 老师暂时不在，请稍后再试~' }]);
      }
    })();
    setShowMistakeBook(false);
  };

  const clearHistory = async () => {
    if (loggedIn) { try { await API.post(`/api/clear-history?username=${username}`); } catch { } }
    setMessages([]);
  };

  const downloadWorksheet = (answers) => {
    const url = `http://localhost:8000/api/download-worksheet?answers=${answers}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoginSuccess = (user) => {
    setLoggedIn(true);
    setUsername(user);
    setShowLogin(false);
    setMessages([]);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUsername('游客');
    setShowSettings(false);
    setShowProfile(false);
    setMessages([]);
  };

  return (
    <div className="h-screen flex transition-all duration-700 bg-white">
      <div className="hidden md:block">
        <Sidebar
          loggedIn={loggedIn} username={username} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
          theme={theme}
          onAvatarClick={() => loggedIn ? setShowProfile(true) : setShowLogin(true)}
          onFetchMistakes={() => setShowMistakeBook(true)}
          onFetchReport={() => setShowReport(true)}
          onUploadHomework={uploadHomework}
          onClearHistory={clearHistory}
          isMobile={false}
          onCloseMobile={() => { }}
        />
      </div>
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 animate-slideInLeft">
            <Sidebar
              loggedIn={loggedIn} username={username} sidebarOpen={true} setSidebarOpen={() => setMobileDrawerOpen(false)}
              theme={theme}
              onAvatarClick={() => loggedIn ? setShowProfile(true) : setShowLogin(true)}
              onFetchMistakes={() => setShowMistakeBook(true)}
              onFetchReport={() => setShowReport(true)}
              onUploadHomework={uploadHomework}
              onClearHistory={clearHistory}
              isMobile={true}
              onCloseMobile={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
      <ChatWindow
        messages={messages} input={input} setInput={setInput} onSend={sendMessage}
        theme={theme} sidebarOpen={sidebarOpen}
        onOpenMobileSidebar={() => setMobileDrawerOpen(true)}
        onDownload={downloadWorksheet} onPhotoSearch={photoSearch}
      />
      {showProfile && (
        <ProfileModal
          username={username} theme={theme}
          onClose={() => setShowProfile(false)}
          onOpenSettings={() => { setShowProfile(false); setShowSettings(true); }}
        />
      )}
      {showSettings && (
        <SettingsPanel theme={theme} onClose={() => setShowSettings(false)} onLogout={handleLogout}
          onSwitchAccount={() => { setShowSettings(false); setShowLogin(true); handleLogout(); }}
        />
      )}
      {showLogin && <LoginModal theme={theme} onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />}
      {showMistakeBook && <MistakeBookModal theme={theme} onClose={() => setShowMistakeBook(false)} onSendToChat={handleSendToChat} />}
      {showReport && <ReportModal theme={theme} onClose={() => setShowReport(false)} />}
    </div>
  );
}

export default App;