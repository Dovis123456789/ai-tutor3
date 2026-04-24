import React from 'react';

const themePreviews = {
    rose: { border: 'from-rose-300 to-pink-200', label: '柔雾蔷薇' },
    aqua: { border: 'from-sky-300 to-blue-200', label: '晴空浅岚' },
    warm: { border: 'from-amber-300 to-orange-200', label: '暖绒松茶' },
};

export default function SettingsPanel({ theme, currentTheme, setCurrentTheme, onClose, onLogout, onSwitchAccount }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className={`${theme.modal} w-80 p-6 rounded-3xl shadow-2xl space-y-5`} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800">⚙️ 设置</h3>
                <div>
                    <p className="text-xs font-semibold text-gray-400 mb-3">🎨 主题切换</p>
                    <div className="flex gap-3">
                        {Object.keys(themePreviews).map(key => (
                            <button
                                key={key}
                                onClick={() => setCurrentTheme(key)}
                                className={`flex-1 h-10 rounded-xl bg-gradient-to-br ${themePreviews[key].border} flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${currentTheme === key ? 'ring-2 ring-offset-2 ring-gray-800/30' : ''
                                    }`}
                            >
                                {themePreviews[key].label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <button onClick={onSwitchAccount} className="w-full py-2.5 rounded-xl bg-gray-100/80 text-sm hover:bg-gray-200 transition">🔄 切换账号</button>
                    <button onClick={onLogout} className="w-full py-2.5 rounded-xl bg-rose-100/80 text-sm text-rose-600 hover:bg-rose-200 transition">🚪 退出登录</button>
                    <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/60 text-sm hover:bg-gray-100 transition">✕ 关闭</button>
                </div>
            </div>
        </div>
    );
}