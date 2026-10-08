import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Editor from '@monaco-editor/react';
import type { QuizDetail, QuizSubmitResult } from '../types';
import { quizzesApi } from '../services/api';
import { usePyodide } from '../hooks/usePyodide';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  Play,
  Terminal,
  Code2,
} from 'lucide-react';

interface QuizPlayerProps {
  quizId: number;
  onBack: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onBack }) => {
  const { runCode, isReady: isPyodideReady } = usePyodide();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await quizzesApi.get(quizId);
        setQuiz(data);
        setTimeRemaining(data.time_limit_minutes * 60);
      } catch (err) {
        console.error('Failed to load quiz', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (!quiz || result || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, result, timeRemaining]);

  // Code Sandbox States
  const [sandboxCode, setSandboxCode] = useState<string>('');
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<string>('');
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  // Synchronize sandbox when current question changes
  useEffect(() => {
    if (quiz && quiz.questions[currentIndex]) {
      const snip = quiz.questions[currentIndex].code_snippet || '';
      setSandboxCode(snip);
      setSandboxOutput('');
      setSandboxError(null);
      setIsSandboxOpen(!!snip);
    }
  }, [currentIndex, quiz]);

  const handleRunSandbox = async () => {
    if (!sandboxCode.trim() || isRunningCode) return;
    setIsRunningCode(true);
    setSandboxOutput('Đang thực thi code Python...\n');
    setSandboxError(null);

    try {
      const res = await runCode(sandboxCode, '');
      if (res.error) {
        setSandboxError(res.error);
        setSandboxOutput(res.stdout || '');
      } else {
        setSandboxOutput(
          res.stdout || 'Chương trình thực thi thành công không có output (bạn có thể thêm hàm print() để xem kết quả).'
        );
      }
    } catch (err: any) {
      setSandboxError(err.message || String(err));
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleResetSandbox = () => {
    if (quiz && quiz.questions[currentIndex]) {
      setSandboxCode(quiz.questions[currentIndex].code_snippet || '');
      setSandboxOutput('');
      setSandboxError(null);
    }
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    if (result) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleAutoSubmit = () => {
    alert('Hết thời gian làm bài! Hệ thống đang tự động nộp bài của bạn.');
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return;

    const answeredCount = Object.keys(selectedAnswers).length;
    if (
      timeRemaining > 0 &&
      answeredCount < quiz.questions.length &&
      !confirm(
        `Bạn mới trả lời ${answeredCount}/${quiz.questions.length} câu. Bạn có chắc chắn muốn nộp bài?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await quizzesApi.submit(quiz.id, selectedAnswers, timeSpent);
      setResult(data);

      if (data.percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi nộp bài');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Đang chuẩn bị đề thi trắc nghiệm...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-20 text-slate-400">
        Không tìm thấy bài trắc nghiệm.
      </div>
    );
  }

  const currentQ = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách Quiz</span>
        </button>

        <h2 className="text-sm font-bold text-white max-w-sm truncate text-center">
          {quiz.title}
        </h2>

        {!result ? (
          <div
            className={`flex items-center gap-1.5 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border ${
              timeRemaining < 120
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-amber-400 border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã hoàn thành</span>
          </div>
        )}
      </div>

      {/* Review Screen after submission */}
      {result ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Result Banner */}
          <div
            className={`p-6 rounded-3xl border text-center relative overflow-hidden shadow-2xl ${
              result.percentage >= 80
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-500/30'
                : result.percentage >= 50
                ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30'
                : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30'
            }`}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/80 mb-3 border border-slate-700">
              <Award className="w-7 h-7 text-amber-400" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">
              Kết Quả Bài Làm
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Thời gian hoàn thành: {formatTime(result.time_spent_seconds)}
            </p>

            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl">
                <div className="text-[11px] text-slate-400">Số câu đúng</div>
                <div className="text-xl font-bold text-emerald-400">
                  {result.score} / {result.total_questions}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl">
                <div className="text-[11px] text-slate-400">Điểm số</div>
                <div className="text-xl font-bold text-indigo-400">
                  {result.percentage}%
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setSelectedAnswers({});
                  setTimeRemaining(quiz.time_limit_minutes * 60);
                  setTimeSpent(0);
                  setCurrentIndex(0);
                }}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại đề này</span>
              </button>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition"
              >
                <span>Về danh sách Quiz</span>
              </button>
            </div>
          </div>

          {/* Question-by-Question Review */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Xem lại chi tiết từng câu hỏi & giải thích</span>
            </h4>

            {result.results.map((qRes, idx) => (
              <div
                key={qRes.question_id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-3 transition ${
                  qRes.is_correct
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-white">
                    <span className="text-slate-400">Câu {idx + 1}:</span>
                    <span>{qRes.question_text}</span>
                  </div>
                  {qRes.is_correct ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đúng</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Sai</span>
                    </span>
                  )}
                </div>

                {qRes.code_snippet && (
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
                    {qRes.code_snippet}
                  </pre>
                )}

                {/* Options Review */}
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {qRes.options.map((opt) => {
                    const isSelected = qRes.selected_option_id === opt.id;
                    const isCorrect = qRes.correct_option_id === opt.id;

                    let optStyle =
                      'bg-slate-950/60 border-slate-800 text-slate-300';
                    if (isCorrect) {
                      optStyle =
                        'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optStyle =
                        'bg-rose-500/10 border-rose-500/50 text-rose-300';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] flex items-center justify-center font-bold">
                            {String.fromCharCode(64 + opt.order)}
                          </span>
                          <span>{opt.option_text}</span>
                        </div>

                        {isCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                            Đáp án đúng
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                            Lựa chọn của bạn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {qRes.explanation && (
                  <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Giải thích:</span>
                      <span className="text-purple-200/90 leading-relaxed">
                        {qRes.explanation}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Quiz Active Taking Interface */
        <div className="space-y-6">
          {/* Question Nav Bar (1, 2, 3...) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
            {quiz.questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;

              let btnStyle =
                'bg-slate-950 border-slate-800 text-slate-400 hover:text-white';
              if (isCurrent) {
                btnStyle =
                  'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30';
              } else if (isAnswered) {
                btnStyle =
                  'bg-purple-500/20 border-purple-500/40 text-purple-300';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-xl border text-xs font-bold transition flex items-center justify-center flex-shrink-0 ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-purple-400">
                Câu hỏi {currentIndex + 1} / {totalQuestions}
              </span>
              <span>
                Đã trả lời: {Object.keys(selectedAnswers).length} / {totalQuestions}
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
              {currentQ.question_text}
            </h3>

            {/* Interactive Live Python Sandbox */}
            {currentQ.code_snippet || isSandboxOpen ? (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Chạy thử & Thực hành code trực tiếp (Live Sandbox)
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Python 3 WASM
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentQ.code_snippet && (
                      <button
                        type="button"
                        onClick={handleResetSandbox}
                        title="Khôi phục lại code gốc của đề bài"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleRunSandbox}
                      disabled={isRunningCode || !isPyodideReady}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 ${isRunningCode ? 'animate-spin' : ''}`} />
                      <span>{isRunningCode ? 'Đang chạy...' : 'Chạy thử nghiệm (Run)'}</span>
                    </button>
                  </div>
                </div>

                {/* Editor Container */}
                <div className="h-44 relative bg-slate-950">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={sandboxCode}
                    onChange={(val) => setSandboxCode(val || '')}
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      tabSize: 4,
                      lineNumbers: 'on',
                      padding: { top: 8, bottom: 8 },
                    }}
                  />
                </div>

                {/* Console Output */}
                {(sandboxOutput || sandboxError) && (
                  <div className="bg-slate-900 border-t border-slate-800 p-3 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 font-semibold">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Kết quả in ra (Console Output):</span>
                    </div>
                    {sandboxError ? (
                      <pre className="text-rose-400 whitespace-pre-wrap bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
                        {sandboxError}
                      </pre>
                    ) : (
                      <pre className="text-emerald-400 whitespace-pre-wrap bg-slate-950 p-2 rounded-lg border border-slate-800">
                        {sandboxOutput}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSandboxCode('# Bạn có thể viết code thử nghiệm tại đây\n');
                    setIsSandboxOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>💡 Mở Python Sandbox để tự gõ code kiểm tra câu này</span>
                </button>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition flex items-center justify-between group ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {String.fromCharCode(64 + opt.order)}
                      </span>
                      <span>{opt.option_text}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'border-purple-500 bg-purple-600'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                }
                className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang nộp bài...' : 'Nộp bài thi'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
