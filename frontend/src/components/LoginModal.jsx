import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

export default function LoginModal({ theme, onClose, onLoginSuccess }) {
    const [tab, setTab] = useState('login'); // login | register
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [msg, setMsg] = useState('');

    const handleSubmit = async () => {
        try {
            const endpoint = tab === 'login' ? '/api/login' : '/api/register';
            const res = await API.post(endpoint, { username: user, password: pass });
            setMsg(res.data.message);
            if (res.data.success) {
                onLoginSuccess(user);
            }
        } catch {
            setMsg('网络错误');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className={`${theme.modal} w-80 p-6 rounded-3xl shadow-2xl space-y-4`} onClick={e => e.stopPropagation()}>
                <div className="flex border-b border-gray-200/50">
                    <button onClick={() => setTab('login')} className={`flex-1 pb-3 text-sm font-semibold ${tab === 'login' ? 'text-gray-800 border-b-2 border-rose-400' : 'text-gray-400'}`}>登录</button>
                    <button onClick={() => setTab('register')} className={`flex-1 pb-3 text-sm font-semibold ${tab === 'register' ? 'text-gray-800 border-b-2 border-rose-400' : 'text-gray-400'}`}>注册</button>
                </div>
                <input type="text" placeholder="用户名" value={user} onChange={e => setUser(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 text-sm" />
                <input type="password" placeholder="密码" value={pass} onChange={e => setPass(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 text-sm" />
                <button onClick={handleSubmit} className={`w-full py-2.5 rounded-xl ${theme.sendBtn} text-sm font-semibold`}>
                    {tab === 'login' ? '🔑 登录' : '📝 注册'}
                </button>
                {msg && <p className="text-xs text-center text-gray-500">{msg}</p>}
                <button onClick={onClose} className="w-full text-xs text-gray-400 hover:text-gray-600">取消</button>
            </div>
        </div>
    );
}