import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Editor from '@monaco-editor/react';
import type { QuizDetail, QuizSubmitResult, TestResult } from '../types';
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
  Check,
  BookOpen,
} from 'lucide-react';

interface QuizPlayerProps {
  quizId: number;
  onBack: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onBack }) => {
  const { runCode, evaluateTestCases, isReady: isPyodideReady } = usePyodide();
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

  // Question Test Cases States
  const [sandboxTab, setSandboxTab] = useState<'terminal' | 'tests'>('terminal');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Synchronize sandbox when current question changes
  useEffect(() => {
    if (quiz && quiz.questions[currentIndex]) {
      const q = quiz.questions[currentIndex];
      const snip = q.code_snippet || '';
      setSandboxCode(snip);
      setSandboxOutput('');
      setSandboxError(null);
      setTestResults([]);
      const hasTests = Boolean(q.test_cases && q.test_cases.length > 0);
      setSandboxTab(hasTests ? 'tests' : 'terminal');
      setIsSandboxOpen(Boolean(snip) || hasTests);
    }
  }, [currentIndex, quiz]);

  const handleRunTestCases = async () => {
    if (!quiz) return;
    const q = quiz.questions[currentIndex];
    if (!q.test_cases || q.test_cases.length === 0 || isRunningTests) return;

    setIsRunningTests(true);
    setSandboxTab('tests');

    try {
      const formattedCases = q.test_cases.map((tc: any, idx) => ({
        input_data: tc.input ?? tc.input_data ?? '',
        expected_output: tc.expected ?? tc.expected_output ?? '',
        is_hidden: tc.is_hidden || false,
        order: idx + 1,
      }));

      const evalRes = await evaluateTestCases(sandboxCode, formattedCases);
      setTestResults(evalRes.results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunningTests(false);
    }
  };

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
  const isCurrentPractice =
    currentQ.question_type === 'PRACTICE' ||
    Boolean(currentQ.test_cases && currentQ.test_cases.length > 0);
  const currentTestCasesCount = currentQ.test_cases?.length || 0;

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

            {(() => {
              const theoryList = result.results.filter((r) => r.question_type !== 'PRACTICE');
              const practiceList = result.results.filter((r) => r.question_type === 'PRACTICE');
              const theoryPassed = theoryList.filter((r) => r.is_correct).length;
              const practicePassed = practiceList.filter((r) => r.is_correct).length;

              return (
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-6">
                  <div className="bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl">
                    <div className="text-[11px] text-slate-400">Tổng điểm</div>
                    <div className="text-xl font-bold text-emerald-400">
                      {result.score} / {result.total_questions} ({result.percentage}%)
                    </div>
                  </div>

                  {theoryList.length > 0 && (
                    <div className="bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lý thuyết</span>
                      </div>
                      <div className="text-lg font-bold text-cyan-300">
                        {theoryPassed} / {theoryList.length}
                      </div>
                    </div>
                  )}

                  {practiceList.length > 0 && (
                    <div className="bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Thực hành</span>
                      </div>
                      <div className="text-lg font-bold text-purple-300">
                        {practicePassed} / {practiceList.length}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-sm text-white">
                    <span className="text-slate-400">Câu {idx + 1}:</span>
                    {qRes.question_type === 'PRACTICE' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        <span>Thực hành</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Lý thuyết</span>
                      </span>
                    )}
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
          {/* Question Nav Bar (1, 2, 3...) & Legend */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {quiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                const isPractice =
                  q.question_type === 'PRACTICE' ||
                  Boolean(q.test_cases && q.test_cases.length > 0);

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
                    className={`relative w-9 h-9 rounded-xl border text-xs font-bold transition flex items-center justify-center flex-shrink-0 ${btnStyle}`}
                    title={`Câu ${idx + 1}: ${
                      isPractice ? 'Thực hành (Có Test Cases)' : 'Lý thuyết'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isPractice && (
                      <span
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-900"
                        title="Câu hỏi thực hành"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>Câu Lý thuyết</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-purple-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Câu Thực hành (Có code & Test Cases)</span>
              </span>
            </div>
          </div>

          {/* Current Question Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            {/* Header with Type Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold uppercase tracking-wider text-purple-400">
                  Câu hỏi {currentIndex + 1} / {totalQuestions}
                </span>

                {isCurrentPractice ? (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CÂU HỎI THỰC HÀNH</span>
                    {currentTestCasesCount > 0 && (
                      <span className="bg-purple-500/30 text-purple-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {currentTestCasesCount} Test Cases
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span>CÂU HỎI LÝ THUYẾT</span>
                  </span>
                )}
              </div>

              <span className="text-slate-400">
                Đã trả lời: {Object.keys(selectedAnswers).length} / {totalQuestions}
              </span>
            </div>

            {/* Practical Question Helper Alert */}
            {isCurrentPractice && (
              <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 rounded-2xl p-3 text-xs text-purple-200 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 flex-shrink-0">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Câu hỏi Thực hành Lập trình</span>
                    <span className="text-purple-300/90 text-[11px]">
                      Bạn có thể chạy thử chương trình hoặc bấm <strong>"Kiểm tra Test Cases"</strong> để xác thực kết quả thực thi trước khi chọn đáp án!
                    </span>
                  </div>
                </div>
                {currentTestCasesCount > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2.5 py-1 rounded-xl flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentTestCasesCount} Test Cases</span>
                  </div>
                )}
              </div>
            )}

            <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
              {currentQ.question_text}
            </h3>

            {/* Interactive Live Python Sandbox with Test Cases */}
            {currentQ.code_snippet || isSandboxOpen ? (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Chạy thử & Kiểm tra Test Cases (Live Sandbox)
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
                      className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 text-emerald-400 ${isRunningCode ? 'animate-spin' : ''}`} />
                      <span>{isRunningCode ? 'Đang chạy...' : 'Chạy thử Console'}</span>
                    </button>

                    {currentQ.test_cases && currentQ.test_cases.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRunTestCases}
                        disabled={isRunningTests || !isPyodideReady}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                      >
                        <Check className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-bounce' : ''}`} />
                        <span>
                          {isRunningTests
                            ? 'Đang kiểm tra...'
                            : `Kiểm tra Test Cases (${currentQ.test_cases.length})`}
                        </span>
                      </button>
                    )}
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

                {/* Sandbox Tabs (Terminal / Test Cases) */}
                <div className="bg-slate-900 border-t border-slate-800">
                  <div className="flex items-center px-3 pt-2 gap-2 border-b border-slate-800/80">
                    {currentQ.test_cases && currentQ.test_cases.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSandboxTab('tests')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                          sandboxTab === 'tests'
                            ? 'border-indigo-500 text-indigo-400 bg-slate-950/40'
                            : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Bộ Test Cases ({currentQ.test_cases.length})</span>
                        {testResults.length > 0 && (
                          <span
                            className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                              testResults.every((r) => r.passed)
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {testResults.filter((r) => r.passed).length}/{testResults.length} Pass
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSandboxTab('terminal')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                        sandboxTab === 'terminal'
                          ? 'border-indigo-500 text-indigo-400 bg-slate-950/40'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Terminal Console</span>
                    </button>
                  </div>

                  {/* Tab Body */}
                  <div className="p-3 font-mono text-xs max-h-52 overflow-y-auto">
                    {sandboxTab === 'tests' ? (
                      /* Test Cases Result View */
                      <div className="space-y-2">
                        {testResults.length === 0 ? (
                          <div className="text-slate-400 text-center py-4 font-sans text-xs">
                            Bấm nút <strong className="text-indigo-400">"Kiểm tra Test Cases"</strong> ở trên để tự động chạy và chấm thử mã nguồn của bạn.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {testResults.every((r) => r.passed) && (
                              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-sans text-xs flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span>Tuyệt vời! Mã nguồn của bạn đã vượt qua tất cả test cases của câu hỏi này!</span>
                              </div>
                            )}

                            {testResults.map((tr) => (
                              <div
                                key={tr.order}
                                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                  tr.passed
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : 'bg-rose-950/20 border-rose-500/30'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200">
                                      Test Case #{tr.order}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                        tr.passed
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-rose-500/20 text-rose-400'
                                      }`}
                                    >
                                      {tr.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    <span>Input: </span>
                                    <span className="text-slate-300">{tr.input || '(None)'}</span>
                                    <span className="mx-2">|</span>
                                    <span>Kỳ vọng: </span>
                                    <span className="text-emerald-400">{tr.expected}</span>
                                    <span className="mx-2">|</span>
                                    <span>Thực tế: </span>
                                    <span className={tr.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                      {tr.actual || tr.error || '(Rỗng)'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Terminal Console View */
                      <div>
                        {sandboxError ? (
                          <pre className="text-rose-400 whitespace-pre-wrap bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
                            {sandboxError}
                          </pre>
                        ) : (
                          <pre className="text-emerald-400 whitespace-pre-wrap bg-slate-950 p-2 rounded-lg border border-slate-800">
                            {sandboxOutput || 'Chưa có output. Nhấn "Chạy thử Console" để thực thi.'}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
