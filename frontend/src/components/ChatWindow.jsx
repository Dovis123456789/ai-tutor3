import React, { useEffect, useRef } from 'react';

function ChatWindow({ messages, input, setInput, onSend, theme, sidebarOpen, onOpenMobileSidebar, onDownload, onPhotoSearch }) {
  const bottomRef = useRef();
  const photoInputRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { onPhotoSearch(file); e.target.value = ''; }
  };

  return (
    <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm relative">
      <div className="flex-1 relative overflow-y-auto px-4 md:px-6 py-4 space-y-4"
        style={{ backgroundImage: `url('/chat-bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex relative z-10 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[78%] px-4 py-3 rounded-3xl transition-all duration-300 ${msg.sender === 'user' ? theme.userBubble + ' rounded-br-lg' : theme.aiBubble + ' rounded-bl-lg'}`}>
              {msg.text === 'loading' ? (
                <div className="flex items-center gap-2 animate-pulse">
                  <span className="text-lg">🤔</span><span className="text-sm text-gray-600 font-medium">小智老师正在努力思考</span>
                  <div className="flex gap-1 ml-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span></div>
                </div>
              ) : (
                <div>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.download && (
                    <div className="mt-3 flex gap-2 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); onDownload(false) }} className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition shadow-sm">📥 下载作业</button>
                      <button onClick={(e) => { e.stopPropagation(); onDownload(true) }} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-full hover:bg-gray-800 transition shadow-sm">📥 下载作业（含答案）</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 md:p-4 bg-white/70 backdrop-blur-md border-t border-gray-200/50">
        <div className="flex gap-2 max-w-3xl mx-auto items-center">
          <input type="file" ref={photoInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoChange} />
          <button onClick={() => photoInputRef.current.click()} className="px-2 text-2xl hover:scale-110 transition" title="拍照搜题">📷</button>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
            rows={1} className={`flex-1 resize-none rounded-2xl border ${theme.input} bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 transition`}
            placeholder="✨ 问小智老师问题..." />
          <button onClick={onSend} className={`px-5 rounded-2xl font-semibold text-sm ${theme.sendBtn} transition-all hover:scale-105`}>发送 ↑</button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-2">回车发送 · Shift+回车换行</p>
      </div>
      <button onClick={onOpenMobileSidebar} className={`md:hidden fixed bottom-24 right-4 w-12 h-12 rounded-full ${theme.sidebar} shadow-lg flex items-center justify-center text-xl hover:scale-110 transition z-40`}>🧰</button>
    </div>
  );
}

export default ChatWindow;