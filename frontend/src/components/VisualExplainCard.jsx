/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } from 'react';
import { BlockMath } from 'react-katex';
import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

function VisualExplainCard({ imageBase64, steps }) {
  const canvasRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [avatarAnimating, setAvatarAnimating] = useState(false);
  const audioRef = useRef(null);
  const stoppedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const safeSteps = Array.isArray(steps) ? steps : [];

  // 停止所有音频和请求
  const forceStop = () => {
    // 取消进行中的 TTS 请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 停止并销毁音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setAutoPlay(false);
    setIsLoadingAudio(false);
    setAvatarAnimating(false);
    stoppedRef.current = true;
  };

  // 开始自动播放
  const startAutoPlay = () => {
    stoppedRef.current = false;
    setAutoPlay(true);
    setCurrentStep(0);
  };

  // 步骤点击处理
  const handleStepClick = (idx) => {
    if (autoPlay) {
      // 如果正在自动播放，先中止当前音频和请求，再跳转
      forceStop();
      // 短暂延迟后重启自动播放（从新步骤开始）
      setTimeout(() => {
        stoppedRef.current = false;
        setCurrentStep(idx);
        setAutoPlay(true);
      }, 100);
    } else {
      setCurrentStep(idx);
    }
  };

  // 自动播放核心逻辑
  useEffect(() => {
    if (!autoPlay || safeSteps.length === 0 || stoppedRef.current) return;

    const stepText = safeSteps[currentStep]?.text;
    if (!stepText) {
      setAutoPlay(false);
      return;
    }

    // 创建 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAvatarAnimating(true);
    setIsLoadingAudio(true);

    const formData = new URLSearchParams();
    formData.append('text', stepText);

    API.post('/api/tts', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    })
      .then(res => {
        if (controller.signal.aborted || stoppedRef.current) return;

        const url = res.data.url;
        if (!url) {
          setIsLoadingAudio(false);
          setAvatarAnimating(false);
          return;
        }

        // 清理旧音频
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setAvatarAnimating(false);
          if (stoppedRef.current) {
            setAutoPlay(false);
            return;
          }
          if (currentStep < safeSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
          } else {
            setAutoPlay(false);
          }
          setIsLoadingAudio(false);
        };
        audio.play().catch(() => {
          setAvatarAnimating(false);
          setIsLoadingAudio(false);
        });
      })
      .catch(err => {
        if (axios.isCancel(err)) return; // 被取消
        setAvatarAnimating(false);
        setIsLoadingAudio(false);
      });
  }, [autoPlay, currentStep, safeSteps]);

  // 绘制题目图片
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageBase64) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = `data:image/png;base64,${imageBase64}`;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  }, [imageBase64]);

  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs);
    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$'))
        return <BlockMath key={idx} math={part.slice(2, -2)} />;
      if (part.startsWith('$') && part.endsWith('$'))
        return <BlockMath key={idx} math={part.slice(1, -1)} />;
      return <span key={idx}>{part}</span>;
    });
  };

  if (safeSteps.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-md my-2">
        <p className="text-gray-500 text-sm">讲解内容正在准备中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md my-2 max-w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">👩‍🏫 好奇星老师</h3>
        <div className="flex gap-2">
          <button
            onClick={autoPlay ? forceStop : startAutoPlay}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold ${autoPlay ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            disabled={isLoadingAudio && !autoPlay}
          >
            {autoPlay ? '⏹ 停止' : isLoadingAudio ? '加载中...' : '▶ 自动播放讲解'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-w-0">
          {imageBase64 && (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-3">
              <canvas ref={canvasRef} className="w-full" style={{ maxHeight: '40vh' }} />
            </div>
          )}

          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <div
              className="bg-purple-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / safeSteps.length) * 100}%` }}
            />
          </div>

          {safeSteps[currentStep] && (
            <div className={`p-4 rounded-xl border mb-3 transition-colors duration-300 ${avatarAnimating ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
              }`}>
              <div className="text-sm text-gray-800 font-medium leading-relaxed">
                <span className={`mr-2 font-bold ${avatarAnimating ? 'text-purple-600' : 'text-blue-600'}`}>
                  步骤 {currentStep + 1}/{safeSteps.length}
                </span>
                {renderText(safeSteps[currentStep].text)}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2 mb-2">
            {safeSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleStepClick(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-purple-500' : 'w-2 bg-gray-300'
                  }`}
              />
            ))}
          </div>

          {currentStep === safeSteps.length - 1 && (
            <div className="text-center mt-2">
              <span className="text-sm text-gray-500">✨ 讲解完成！你学会了吗？</span>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col items-center justify-start pt-2" style={{ width: '120px' }}>
          <div className="bg-gradient-to-b from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 shadow-inner">
            <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center shadow-lg overflow-hidden">
              <span className="text-4xl">👩‍🏫</span>
              {avatarAnimating && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-white rounded-full animate-pulse" />
              )}
            </div>
            <p className="text-xs text-center mt-2 text-purple-700 font-medium">好奇星老师</p>
            {avatarAnimating && (
              <p className="text-xs text-center text-gray-500 mt-1 animate-pulse">讲解中...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisualExplainCard;