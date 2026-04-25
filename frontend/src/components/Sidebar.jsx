import React, { useRef, useState } from 'react';

export default function Sidebar({
  loggedIn,
  username,
  sidebarOpen,
  setSidebarOpen,
  theme,
  onAvatarClick,
  onFetchMistakes,
  onFetchReport,
  onUploadHomework,
  onVisualTeacher,   // 🔥 恢复
  onClearHistory,
  isMobile,
  onCloseMobile,
}) {
  const fileInputRef = useRef(null);
  const visualInputRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUploadHomework(file);
      event.target.value = '';
    }
  };

  const handleVisualUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        onVisualTeacher(base64);
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };

  if (!isMobile && !sidebarOpen) {
    return (
      <div className={`${theme.sidebar} w-14 flex flex-col items-center py-4`}>
        <button onClick={() => setSidebarOpen(true)} className="text-xl hover:scale-110 transition">
          📂
        </button>
      </div>
    );
  }

  return (
    <div className={`${theme.sidebar} h-full flex flex-col p-5 gap-5 overflow-y-auto`}>
      {isMobile && (
        <div className="flex justify-end">
          <button onClick={onCloseMobile} className="text-2xl hover:scale-110 transition">
            ✕
          </button>
        </div>
      )}

      {/* 头像区 */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-200/50">
        <div
          onClick={onAvatarClick}
          className={`relative w-16 h-16 rounded-full cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 ${loggedIn
            ? theme.avatarRing + ' bg-gradient-to-br from-rose-300 to-amber-200'
            : 'ring-2 ring-gray-300/60 bg-gray-100'
            }`}
        >
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {loggedIn ? '🧑‍🎓' : '👤'}
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {loggedIn ? username : '点击登录'}
          </p>
          {loggedIn && (
            <p className={`text-xs ${theme.textMuted}`}>在线努力学习 ✨</p>
          )}
        </div>
      </div>

      {/* 学习工具组 */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.sectionTitle}`}>
          📚 学习工具
        </h3>
        <div className="space-y-2">
          <button onClick={onFetchMistakes} className={`w-full flex items-center gap-3 px-4 py-3 ${theme.btn}`}>
            <span className="text-lg">📖</span>
            <span className="flex-1 text-left">错题本</span>
            <span className={`text-[10px] ${theme.textMuted}`}>薄弱点</span>
          </button>
          <button onClick={onFetchReport} className={`w-full flex items-center gap-3 px-4 py-3 ${theme.btn}`}>
            <span className="text-lg">📊</span>
            <span className="flex-1 text-left">学习周报</span>
            <span className={`text-[10px] ${theme.textMuted}`}>进步哦</span>
          </button>

          {/* 批改作业 */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.docx,.txt"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className={`w-full flex items-center gap-3 px-4 py-3 ${theme.btn}`}
          >
            <span className="text-lg">✏️</span>
            <span className="flex-1 text-left">批改作业</span>
            <span className={`text-[10px] ${theme.textMuted}`}>上传文件</span>
          </button>

          {/* 拟人讲解 */}
          <input
            type="file"
            ref={visualInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleVisualUpload}
          />
          <button
            onClick={() => visualInputRef.current.click()}
            className={`w-full flex items-center gap-3 px-4 py-3 ${theme.btn}`}
          >
            <span className="text-lg">🧑‍🏫</span>
            <span className="flex-1 text-left">拟人讲解</span>
            <span className={`text-[10px] ${theme.textMuted}`}>智能画图</span>
          </button>
        </div>
      </div>

      {/* 作业操作组 */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.sectionTitle}`}>
          📝 作业操作
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 ${theme.btnDanger}`}
          >
            <span className="text-lg">🗑️</span>
            <span className="flex-1 text-left">清空对话</span>
            <span className={`text-[10px] ${theme.textMuted}`}>谨慎</span>
          </button>
          {showClearConfirm && (
            <div className="mt-1 p-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
              <span>确定清空所有对话吗？</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { onClearHistory(); setShowClearConfirm(false); }}
                  className="text-red-500 font-bold"
                >
                  确定
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setSidebarOpen(false)}
            className={`text-xs ${theme.textMuted} hover:text-gray-500 transition`}
          >
            ◀ 收起
          </button>
        </div>
      )}
    </div>
  );
}