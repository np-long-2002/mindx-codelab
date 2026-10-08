import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttempt, QuizDetail } from '../types';
import { quizzesApi } from '../services/api';
import {
  X,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Eye,
  ArrowLeft,
  Code2,
  BookOpen,
  Terminal,
  Award,
  Search,
} from 'lucide-react';

interface QuizSubmissionsModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const QuizSubmissionsModal: React.FC<QuizSubmissionsModalProps> = ({
  quiz,
  onClose,
}) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      try {
        const [data, qd] = await Promise.all([
          quizzesApi.getAttempts(quiz.id),
          quizzesApi.get(quiz.id).catch(() => null),
        ]);
        setAttempts(data);
        if (qd) setQuizDetail(qd);
      } catch (err) {
        console.error('Failed to load attempts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [quiz.id]);

  const handleViewDetail = async (attempt: QuizAttempt) => {
    setLoadingDetail(true);
    try {
      const detail = await quizzesApi.getAttemptDetail(quiz.id, attempt.id);
      setSelectedAttempt(detail);
    } catch (err) {
      alert('Không thể tải chi tiết bài làm này');
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}p ${s.toString().padStart(2, '0')}s`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const filteredAttempts = attempts.filter((att) => {
    const q = searchTerm.toLowerCase();
    const name = (att.user_name || '').toLowerCase();
    const email = (att.user_email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const avgScore =
    attempts.length > 0
      ? (
          attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
        ).toFixed(1)
      : '0';

  const avgPercentage =
    attempts.length > 0
      ? (
          attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
        ).toFixed(1)
      : '0';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            {selectedAttempt ? (
              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Quay lại danh sách bài nộp"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Users className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {selectedAttempt ? (
                  <span>Chi tiết bài làm: {selectedAttempt.user_name}</span>
                ) : (
                  <span>Danh sách bài nộp của học viên</span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Đề thi: <span className="text-purple-300 font-semibold">{quiz.title}</span> ({quiz.question_count} câu hỏi)
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedAttempt ? (
            /* Student Attempt Detail View */
            <div className="space-y-6">
              {/* Score Card Header */}
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-500/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedAttempt.user_name || 'Học viên'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedAttempt.user_email || 'Không có email'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Thời gian: <strong className="text-white">{formatTime(selectedAttempt.time_spent_seconds)}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Nộp lúc: <strong className="text-white">{formatDate(selectedAttempt.created_at)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Kết quả đạt được</div>
                    <div className="text-2xl font-extrabold text-white">
                      <span className="text-purple-400">{selectedAttempt.score}</span> / {selectedAttempt.total_questions}
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${
                    selectedAttempt.percentage >= 70
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : selectedAttempt.percentage >= 50
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}>
                    {selectedAttempt.percentage}%
                  </div>
                </div>
              </div>

              {/* Questions Review Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Chi tiết câu trả lời ({selectedAttempt.results?.length || 0} câu)</span>
                </h4>

                {selectedAttempt.results && selectedAttempt.results.length > 0 ? (
                  selectedAttempt.results.map((qRes, idx) => {
                    const isPractice = qRes.question_type === 'PRACTICE';

                    return (
                      <div
                        key={idx}
                        className={`bg-slate-950/80 border rounded-2xl p-5 space-y-4 shadow-sm transition ${
                          qRes.is_correct
                            ? 'border-emerald-500/30 bg-emerald-950/5'
                            : 'border-rose-500/30 bg-rose-950/5'
                        }`}
                      >
                        {/* Question Title & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
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
                                Trắc nghiệm
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {qRes.is_correct ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Chính xác</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Chưa chính xác</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="text-sm text-slate-100 font-medium leading-relaxed">
                          {qRes.question_text}
                        </div>

                        {/* Starter Code snippet if any */}
                        {qRes.code_snippet && (
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block mb-1">
                              Mã nguồn đề bài:
                            </span>
                            <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                              {qRes.code_snippet}
                            </pre>
                          </div>
                        )}

                        {/* Practical: Student Code & Test results */}
                        {isPractice ? (
                          <div className="space-y-3 pt-1">
                            <div>
                              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                                <span className="flex items-center gap-1.5 text-purple-300">
                                  <Terminal className="w-4 h-4 text-purple-400" />
                                  <span>Mã nguồn học viên đã làm:</span>
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Python 3
                                </span>
                              </div>
                              <pre className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                {qRes.student_code?.trim() || '(Học viên không viết hoặc không nộp code cho câu này)'}
                              </pre>
                            </div>

                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                              <span className="text-slate-400">Kết quả Test Cases tự động:</span>
                              {qRes.is_correct ? (
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                  Đạt ({qRes.tests_passed ?? qRes.total_tests ?? 0}/{qRes.total_tests ?? 0} Test Cases)
                                </span>
                              ) : (
                                <span className="font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                                  Chưa đạt ({qRes.tests_passed ?? 0}/{qRes.total_tests ?? 0} Test Cases)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Theory: ABCD Options Breakdown */
                          (() => {
                            const questionOptions =
                              qRes.options && qRes.options.length > 0
                                ? qRes.options
                                : quizDetail?.questions.find((q) => q.id === qRes.question_id)?.options || [];

                            const effectiveExplanation =
                              qRes.explanation ||
                              quizDetail?.questions.find((q) => q.id === qRes.question_id)?.explanation;

                            return (
                              <div className="space-y-3 pt-1">
                                <span className="text-xs font-semibold text-slate-400 block">
                                  Các đáp án (Màu xanh: đáp án đúng, Màu đỏ: học viên chọn sai):
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {questionOptions.map((opt) => {
                                    const isSelected =
                                      qRes.selected_option_id !== null &&
                                      qRes.selected_option_id !== undefined &&
                                      String(qRes.selected_option_id) === String(opt.id);

                                    const isCorrect =
                                      Boolean(opt.is_correct) ||
                                      (qRes.correct_option_id !== null &&
                                        qRes.correct_option_id !== undefined &&
                                        String(qRes.correct_option_id) === String(opt.id));

                                    let optStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                                    if (isCorrect) {
                                      optStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold';
                                    } else if (isSelected && !isCorrect) {
                                      optStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-200 font-semibold';
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

                                        <div>
                                          {isSelected && isCorrect && (
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                              Học viên chọn ✓
                                            </span>
                                          )}
                                          {isSelected && !isCorrect && (
                                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                                              Học viên chọn ✗
                                            </span>
                                          )}
                                          {!isSelected && isCorrect && (
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                              Đáp án đúng
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Explanation */}
                                {effectiveExplanation && (
                                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 text-xs text-purple-300">
                                    <span className="font-semibold text-purple-200">💡 Giải thích / Hướng dẫn: </span>
                                    {effectiveExplanation}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Không tìm thấy dữ liệu chi tiết của lượt làm bài này.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Submissions List Table */
            <div className="space-y-6">
              {/* Stat Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Tổng lượt nộp</div>
                    <div className="text-xl font-bold text-white">{attempts.length} học viên</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Điểm trung bình</div>
                    <div className="text-xl font-bold text-white">
                      {avgScore} / {quiz.question_count} ({avgPercentage}%)
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Thời gian giới hạn</div>
                    <div className="text-xl font-bold text-white">{quiz.time_limit_minutes} phút</div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tên hoặc email học viên..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Đang tải danh sách bài nộp...</p>
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-10 text-center">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">
                    {searchTerm ? 'Không tìm thấy học viên phù hợp' : 'Chưa có học viên nào nộp bài'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm
                      ? 'Thử tìm với từ khóa khác.'
                      : 'Khi học viên làm và nộp bài, kết quả chi tiết sẽ xuất hiện tại đây.'}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Học viên</th>
                        <th className="py-3 px-4">Điểm số</th>
                        <th className="py-3 px-4">Thời gian làm</th>
                        <th className="py-3 px-4">Thời điểm nộp</th>
                        <th className="py-3 px-4 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-xs">
                      {filteredAttempts.map((att) => (
                        <tr
                          key={att.id}
                          className="hover:bg-slate-850/50 transition group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white group-hover:text-purple-300 transition">
                              {att.user_name || 'Học viên'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {att.user_email || '—'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {att.score}/{att.total_questions}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  att.percentage >= 70
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : att.percentage >= 50
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {att.percentage}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {formatTime(att.time_spent_seconds)}
                          </td>

                          <td className="py-3.5 px-4 text-slate-400">
                            {formatDate(att.created_at)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleViewDetail(att)}
                              disabled={loadingDetail}
                              className="inline-flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem bài làm</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

