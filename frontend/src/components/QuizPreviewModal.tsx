import React, { useState, useEffect } from 'react';
import type { Quiz, QuizDetail } from '../types';
import { quizzesApi } from '../services/api';
import {
  X,
  BookOpen,
  CheckCircle,
  Clock,
  Terminal,
  Code2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface QuizPreviewModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const QuizPreviewModal: React.FC<QuizPreviewModalProps> = ({
  quiz,
  onClose,
}) => {
  const [detail, setDetail] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await quizzesApi.get(quiz.id);
        setDetail(data);
      } catch (err) {
        console.error('Failed to load quiz preview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [quiz.id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Đáp án & Đề thi chi tiết (Dành cho Giáo viên)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Đề: <span className="text-purple-300 font-semibold">{quiz.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quiz Info Banner */}
          <div className="bg-gradient-to-r from-purple-950/30 via-slate-950 to-indigo-950/30 border border-purple-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="flex items-center gap-1.5 text-purple-300">
                <HelpCircle className="w-4 h-4" />
                Tổng số câu: <strong className="text-white">{detail?.questions.length || quiz.question_count} câu</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <Clock className="w-4 h-4" />
                Thời gian: <strong className="text-white">{quiz.time_limit_minutes} phút</strong>
              </span>
            </div>

            <div className="text-slate-400">
              {quiz.is_assigned ? (
                <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  ● Đang mở cho học sinh làm
                </span>
              ) : (
                <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  ● Bản nháp (Chưa giao)
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Đang tải đề thi và đáp án...</p>
            </div>
          ) : !detail || detail.questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Đề thi chưa có câu hỏi nào.
            </div>
          ) : (
            <div className="space-y-5">
              {detail.questions.map((q, idx) => {
                const isPractice =
                  q.question_type === 'PRACTICE' ||
                  Boolean(q.test_cases && q.test_cases.length > 0);

                return (
                  <div
                    key={q.id || idx}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                          Câu #{idx + 1}
                        </span>
                        {isPractice ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono">
                            <Code2 className="w-3.5 h-3.5 text-purple-400" />
                            Thực hành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                            Trắc nghiệm ABCD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="text-sm text-slate-100 font-medium leading-relaxed">
                      {q.question_text}
                    </div>

                    {/* Code Snippet */}
                    {q.code_snippet && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block mb-1">
                          {isPractice ? 'Mã nguồn khởi tạo (Starter code):' : 'Đoạn code minh họa:'}
                        </span>
                        <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                          {q.code_snippet}
                        </pre>
                      </div>
                    )}

                    {/* Practical: Test Cases */}
                    {isPractice ? (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-purple-400" />
                          <span>Bộ Test Cases kiểm thử tự động ({q.test_cases?.length || 0}):</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.test_cases || []).map((tc: any, tcIdx) => (
                            <div
                              key={tcIdx}
                              className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1"
                            >
                              <div className="text-[10px] text-purple-400 font-bold">
                                Test Case #{tcIdx + 1}
                              </div>
                              <div className="text-slate-400">
                                Input: <span className="text-slate-200">{tc.input || tc.input_data || '(Trống)'}</span>
                              </div>
                              <div className="text-emerald-400">
                                Output: <span className="text-emerald-300 font-bold">{tc.expected || tc.expected_output}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Theory: 4 Options with Correct Answer Highlighted */
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-300 block mb-1">
                          Các đáp án trắc nghiệm:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {(q.options || []).map((opt) => {
                            const isCorrect = Boolean(opt.is_correct);

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                                  isCorrect
                                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold shadow-sm'
                                    : 'bg-slate-900 border-slate-800 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {String.fromCharCode(64 + opt.order)}
                                  </span>
                                  <span>{opt.option_text}</span>
                                </div>

                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Đáp án đúng</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-purple-300 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-purple-200">Giải thích / Hướng dẫn: </span>
                          <span className="text-purple-200/90">{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

