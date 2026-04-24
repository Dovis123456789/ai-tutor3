import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

export default function MistakeBookModal({ theme, onClose, onSendToChat }) {
    const [mistakes, setMistakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatedMap, setGeneratedMap] = useState({});

    useEffect(() => { loadMistakes(); }, []);

    const loadMistakes = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/mistakes');
            setMistakes(res.data.mistakes || []);
        } catch { setMistakes([]); }
        finally { setLoading(false); }
    };

    const handleReview = async (id) => {
        try { await API.post(`/api/mistakes/${id}/review`); loadMistakes(); } catch { alert('标记失败'); }
    };

    const handleGenerateSimilar = async (mistake) => {
        const key = mistake.id;
        if (generatedMap[key]) return;
        try {
            const res = await API.post('/api/mistakes/similar', {
                question: mistake.question,
                correct_answer: mistake.correct_answer
            });
            setGeneratedMap(prev => ({ ...prev, [key]: res.data.question }));
        } catch { alert('生成失败'); }
    };

    const handleSendToChat = (text) => { if (onSendToChat) onSendToChat(text); };

    const handleGenerateAnother = async (mistake) => {
        try {
            const res = await API.post('/api/mistakes/similar', {
                question: mistake.question,
                correct_answer: mistake.correct_answer
            });
            setGeneratedMap(prev => ({ ...prev, [mistake.id]: res.data.question }));
        } catch { alert('生成失败'); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-[94%] max-w-3xl max-h-[85vh] p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📚 我的错题本</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-400">加载中...</div>
                ) : mistakes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">✨ 暂无错题，继续加油！</div>
                ) : (
                    <div className="space-y-6">
                        {mistakes.map((m) => (
                            <div key={m.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-700">📝 题目：{m.question}</p>
                                        <p className="text-sm text-green-600 mt-1">✔ 正确答案：{m.correct_answer}</p>
                                        <p className="text-sm text-gray-500 mt-1">🏷 错误类型：{m.error_type || '未分类'}</p>
                                        {/* 不显示 reviewd 数字，改为状态标签 */}
                                        {m.reviewed === 1 ? (
                                            <span className="inline-block mt-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">已复习</span>
                                        ) : (
                                            <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">未复习</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {m.reviewed !== 1 && (
                                            <button onClick={() => handleReview(m.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition">✅ 已复习</button>
                                        )}
                                        <button onClick={() => handleGenerateSimilar(m)} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition">🎯 生成相似题</button>
                                    </div>
                                </div>
                                {generatedMap[m.id] && (
                                    <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                                        <p className="text-sm font-medium text-purple-800">✨ 相似题：</p>
                                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{generatedMap[m.id]}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleSendToChat(generatedMap[m.id])} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 transition">📤 发送到聊天区解答</button>
                                            <button onClick={() => handleGenerateAnother(m)} className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 rounded-lg text-xs hover:bg-purple-100 transition">🔄 再做一题</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}