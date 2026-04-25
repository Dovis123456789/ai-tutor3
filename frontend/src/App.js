import React, { useState, useEffect, useRef } from 'react';
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

const API = axios.create({ baseURL: 'https://ai-tutor3-production.up.railway.app' });

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('游客');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const theme = themes.rose;

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMistakeBook, setShowMistakeBook] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState('');

  const audioQueue = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef(null);  // 当前正在播放的音频对象

  // 播放音频队列
  const playNextAudio = () => {
    if (audioQueue.current.length === 0) {
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      return;
    }
    isPlayingRef.current = true;
    const url = audioQueue.current.shift();
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    audio.onended = () => playNextAudio();
    audio.play().catch(() => playNextAudio());
  };

  // 清空队列并停止当前音频
  const clearAudio = () => {
    audioQueue.current = [];
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    isPlayingRef.current = false;
  };

  // 调用 TTS 加入队列
  const speakText = async (text) => {
    if (!ttsEnabled || !text.trim()) return;
    try {
      const formData = new URLSearchParams();
      formData.append('text', text);
      const res = await API.post('/api/tts', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.data && res.data.url) {
        audioQueue.current.push(res.data.url);
        if (!isPlayingRef.current) {
          playNextAudio();
        }
      }
    } catch (e) {
      console.error('TTS 请求失败', e);
    }
  };

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
      const aiMsg = { sender: 'assistant', text: res.data.reply };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
      speakText(res.data.reply);
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
      const aiMsg = { sender: 'assistant', text: res.data.reply };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
      speakText(res.data.reply);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '📷 搜题失败，请稍后重试' }]);
    }
  };

  // 文件上传对话
  const fileMessage = async (file) => {
    const userMsg = { sender: 'user', text: '📎 文件已上传' };
    setMessages(prev => [...prev, userMsg]);
    const loadingMsg = { sender: 'assistant', text: 'loading' };
    setMessages(prev => [...prev, loadingMsg]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/api/photo-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const aiMsg = { sender: 'assistant', text: res.data.reply };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
      speakText(res.data.reply);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '📎 文件处理失败，请稍后重试' }]);
    }
  };

  // 文本发送（含多模态）
  const sendMessage = async (text, imageBase64 = null) => {
    if (!text.trim() && !imageBase64) return;

    const userMsg = {
      sender: 'user',
      text: text || ' ',
      image: imageBase64
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const loadingMsg = { sender: 'assistant', text: 'loading' };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      let res;
      if (imageBase64) {
        res = await API.post('/api/chat-multimodal', {
          message: text,
          image_base64: imageBase64
        });
      } else {
        res = await API.post('/api/chat', {
          message: text,
          username,
          logged_in: loggedIn
        });
      }
      const data = res.data;
      const aiMsg = {
        sender: 'assistant',
        text: data.reply,
        download: data.worksheet_ready ? { title: data.title } : null
      };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
      speakText(data.reply);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: '❌ 小智老师走神了，请稍后再试~' }]);
    }
  };

  // 从错题本发送题目到聊天区
  const handleSendToChat = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
    (async () => {
      const loadingMsg = { sender: 'assistant', text: 'loading' };
      setMessages(prev => [...prev, loadingMsg]);
      try {
        const res = await API.post('/api/chat', { message: text, username, logged_in: loggedIn });
        setMessages(prev => [...prev.slice(0, -1), { sender: 'assistant', text: res.data.reply }]);
        speakText(res.data.reply);
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
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/download-worksheet?answers=${answers}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 超拟人老师
  const visualTeacher = async (imageBase64) => {
    const notifyMsg = {
      sender: 'assistant',
      text: '🧑‍🏫 超拟人老师正在后台为你生成讲解，你可以继续提问哦～'
    };
    setMessages(prev => [...prev, notifyMsg]);

    API.post('/api/visual-teacher-plain', { image_base64: imageBase64 })
      .then(res => {
        if (res.data.error) {
          setMessages(prev => [...prev, { sender: 'assistant', text: `❌ 讲解生成失败：${res.data.error}` }]);
          return;
        }

        const aiMsg = {
          sender: 'assistant',
          text: '📺 讲解已完成，点击卡片中的自动播放按钮收听',
          visualExplain: {
            imageBase64: imageBase64,
            steps: res.data.steps || []
          }
        };
        setMessages(prev => [...prev, aiMsg]);
      })
      .catch(err => {
        setMessages(prev => [...prev, { sender: 'assistant', text: '❌ 超拟人老师暂不可用，请稍后重试' }]);
      });
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

  const openReport = async () => {
    try {
      const res = await API.get('/api/report');
      setReportData(res.data.report);
    } catch {
      setReportData("抱歉，生成周报失败，请稍后重试。");
    }
    setShowReport(true);
  };

  return (
    <div className="h-screen flex transition-all duration-700 bg-white">
      <div className="hidden md:block">
        <Sidebar
          loggedIn={loggedIn} username={username} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
          theme={theme}
          onAvatarClick={() => loggedIn ? setShowProfile(true) : setShowLogin(true)}
          onFetchMistakes={() => setShowMistakeBook(true)}
          onFetchReport={openReport}
          onUploadHomework={uploadHomework}
          onVisualTeacher={visualTeacher}
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
              onFetchReport={openReport}
              onUploadHomework={uploadHomework}
              onVisualTeacher={visualTeacher}
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
        onDownload={downloadWorksheet}
        onPhotoSearch={photoSearch}
        onFileUpload={fileMessage}
        ttsEnabled={ttsEnabled}
        onToggleTts={() => {
          const newState = !ttsEnabled;
          setTtsEnabled(newState);
          if (!newState) {
            clearAudio();  // 关闭时立即清空队列并停止播放
          }
        }}
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
      {showReport && <ReportModal report={reportData} theme={theme} onClose={() => setShowReport(false)} />}
    </div>
  );
}

export default App;