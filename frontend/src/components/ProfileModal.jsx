import React from 'react';

export default function ProfileModal({ username, theme, onClose, onOpenSettings }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className={`${theme.modal} w-80 p-6 rounded-3xl shadow-2xl space-y-5 animate-scaleIn`} onClick={e => e.stopPropagation()}>
                {/* 头像 */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-300 to-amber-200 flex items-center justify-center text-4xl ring-4 ring-white shadow-lg">
                        🧑‍🎓
                    </div>
                    <p className="text-lg font-bold text-gray-800">{username}</p>
                    <p className="text-xs text-gray-400">爱学习的小天才 🌟</p>
                </div>
                {/* 数据概览可加 */}
                <div className="flex justify-around text-sm text-gray-600 bg-white/50 rounded-2xl py-3">
                    <div className="text-center"><div className="font-bold">12</div><div className="text-xs">错题</div></div>
                    <div className="text-center"><div className="font-bold">3</div><div className="text-xs">周报</div></div>
                    <div className="text-center"><div className="font-bold">5</div><div className="text-xs">作业</div></div>
                </div>
                {/* 操作按钮 */}
                <div className="space-y-2">
                    <button onClick={onOpenSettings} className="w-full py-2.5 rounded-xl bg-gray-100/80 text-sm font-medium hover:bg-gray-200 transition">⚙️ 设置</button>
                    <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/60 text-sm hover:bg-gray-100 transition">✕ 关闭</button>
                </div>
            </div>
        </div>
    );
}