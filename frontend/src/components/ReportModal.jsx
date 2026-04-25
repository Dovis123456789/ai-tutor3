import React from 'react';

export default function ReportModal({ report, theme, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-[94%] max-w-3xl max-h-[85vh] p-6 overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📊 学习周报</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>
                <div className="prose max-w-none whitespace-pre-wrap text-gray-700 text-[15px] leading-relaxed">
                    {report || '生成中...'}
                </div>
            </div>
        </div>
    );
}