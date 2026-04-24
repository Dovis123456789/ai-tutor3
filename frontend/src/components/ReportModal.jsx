import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

export default function ReportModal({ theme, onClose }) {
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/report');
            setReport(res.data.report);
        } catch (err) {
            setReport('生成失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

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

                {loading ? (
                    <div className="text-center py-10 text-gray-400">生成中...</div>
                ) : (
                    <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                        {report}
                    </div>
                )}
            </div>
        </div>
    );
}