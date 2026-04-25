import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import VisualExplainCard from './VisualExplainCard';

function ChatWindow({
  messages,
  input,
  setInput,
  onSend,
  theme,
  sidebarOpen,
  onOpenMobileSidebar,
  onDownload,
  onPhotoSearch,
  onFileUpload,
  ttsEnabled,
  onToggleTts,
}) {
  const bottomRef = useRef();
  const photoInputRef = useRef();
  const fileInputRef = useRef();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [pendingImage, setPendingImage] = useState(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 语音识别初始化
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [setInput]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器。');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFileToBase64 = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setPendingImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileToBase64(file);
      e.target.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFileToBase64(file);
      } else {
        setPendingImage({ name: file.name, type: 'file' });
      }
      e.target.value = '';
    }
  };

  const handleSend = () => {
    if (!input.trim() && !pendingImage) return;
    onSend(input, pendingImage);
    setInput('');
    setPendingImage(null);
  };

  const hasText = input.trim().length > 0;

  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$\$.*?\$\$)/gs);
    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        return <BlockMath key={idx} math={formula} />;
      }
      const inlineParts = part.split(/(\$.*?\$)/gs);
      return inlineParts.map((sub, subIdx) => {
        if (sub.startsWith('$') && sub.endsWith('$') && !sub.startsWith('$$')) {
          const formula = sub.slice(1, -1).trim();
          return <InlineMath key={`${idx}-${subIdx}`} math={formula} />;
        }
        return <span key={`${idx}-${subIdx}`}>{sub}</span>;
      });
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm relative">
      <div
        className="flex-1 relative overflow-y-auto px-4 md:px-6 py-4 space-y-4"
        style={{
          backgroundImage: `url('/chat-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex relative z-10 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[78%] px-4 py-3 rounded-3xl transition-all duration-300 ${msg.sender === 'user'
              ? theme.userBubble + ' rounded-br-lg'
              : theme.aiBubble + ' rounded-bl-lg'
              }`}>
              {msg.text === 'loading' ? (
                <div className="flex items-center gap-2 animate-pulse">
                  <span className="text-lg">🤔</span>
                  <span className="text-sm text-gray-600 font-medium">
                    小智老师正在努力思考
                  </span>
                  <div className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              ) : (
                <div>
                  {msg.visualExplain && (
                    <VisualExplainCard
                      imageBase64={msg.visualExplain.imageBase64}
                      steps={msg.visualExplain.steps}
                    />
                  )}
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {renderContent(msg.text)}
                  </div>
                  {msg.image && (
                    <img
                      src={`data:image/png;base64,${msg.image}`}
                      alt="uploaded"
                      className="mt-2 rounded-lg max-w-full max-h-48 object-cover"
                    />
                  )}
                  {msg.download && (
                    <div className="mt-3 flex gap-2 justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDownload(false); }}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition shadow-sm"
                      >
                        📥 下载作业
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDownload(true); }}
                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-full hover:bg-gray-800 transition shadow-sm"
                      >
                        📥 下载作业（含答案）
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="p-3 md:p-4 bg-white/70 backdrop-blur-md border-t border-gray-200/50">
        <div className="flex gap-2 max-w-3xl mx-auto items-center">
          {/* 朗读开关 */}
          <button
            onClick={onToggleTts}
            className={`px-2 text-2xl hover:scale-110 transition ${ttsEnabled ? 'text-blue-600' : 'text-gray-400'}`}
            title={ttsEnabled ? '朗读已开启' : '朗读已关闭'}
          >
            {ttsEnabled ? '🔊' : '🔇'}
          </button>

          {/* 拍照 */}
          <input type="file" ref={photoInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoChange} />
          <button onClick={() => photoInputRef.current.click()} className="px-2 text-2xl hover:scale-110 transition" title="拍照搜题">📷</button>

          {/* 输入框 */}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            className={`flex-1 resize-none rounded-2xl border ${theme.input} bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition`}
            placeholder="✨ 问小智老师问题..."
          />

          {/* 语音输入 */}
          <button onClick={toggleListening} className={`px-2 text-2xl hover:scale-110 transition ${isListening ? 'text-red-500 animate-pulse' : ''}`} title="语音输入">🎤</button>

          {/* 发送/上传 */}
          {hasText || pendingImage ? (
            <button onClick={handleSend} className={`px-5 h-10 rounded-2xl font-semibold text-sm ${theme.sendBtn} transition-all hover:scale-105`}>发送 ↑</button>
          ) : (
            <>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.docx,.txt,.pdf" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current.click()} className="px-2 text-2xl hover:scale-110 transition" title="上传文件">📎</button>
            </>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-2">回车发送 · Shift+回车换行 · 点击🔊朗读开关</p>
      </div>

      {/* 移动端浮动工具箱按钮 */}
      <button onClick={onOpenMobileSidebar} className={`md:hidden fixed bottom-24 right-4 w-12 h-12 rounded-full ${theme.sidebar} shadow-lg flex items-center justify-center text-xl hover:scale-110 transition z-40`}>🧰</button>
    </div>
  );
}

export default ChatWindow;