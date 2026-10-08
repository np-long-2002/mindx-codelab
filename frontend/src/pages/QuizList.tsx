import React, { useState, useEffect } from 'react';
import type { Quiz } from '../types';
import { quizzesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  Clock,
  BookCheck,
  PlusCircle,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Send,
  Layers,
  Lock,
} from 'lucide-react';

interface QuizListProps {
  onStartQuiz: (quizId: number) => void;
  onCreateQuiz: () => void;
  openAuthModal: () => void;
}

export const QuizList: React.FC<QuizListProps> = ({
  onStartQuiz,
  onCreateQuiz,
  openAuthModal,
}) => {
  const { user, isTeacher } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ASSIGNED' | 'DRAFT'>('ALL');

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizzesApi.list();
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (quizId: number, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa bài trắc nghiệm "${title}" không?`)) {
      try {
        await quizzesApi.delete(quizId);
        fetchQuizzes();
      } catch (err) {
        alert('Có lỗi xảy ra khi xóa bài trắc nghiệm');
      }
    }
  };

  const handleToggleAssign = async (quizId: number) => {
    try {
      const updated = await quizzesApi.toggleAssign(quizId);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, is_assigned: updated.is_assigned } : q))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Có lỗi khi cập nhật trạng thái giao bài');
    }
  };

  const handleStart = (quizId: number) => {
    if (!user) {
      openAuthModal();
      return;
    }
    onStartQuiz(quizId);
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (!isTeacher) return true;
    if (filterTab === 'ASSIGNED') return q.is_assigned !== false;
    if (filterTab === 'DRAFT') return q.is_assigned === false;
    return true;
  });

  const assignedCount = quizzes.filter((q) => q.is_assigned !== false).length;
  const draftCount = quizzes.filter((q) => q.is_assigned === false).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-950/60 border border-purple-500/20 p-8 mb-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ôn Tập & Đánh Giá Kiến Thức Lập Trình</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Trắc Nghiệm Lập Trình Python
          </h1>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Kết hợp câu hỏi lý thuyết thuật toán và các bài tập thực hành gõ code chạy tự động với Test Cases.
            Giáo viên có thể phân phối và giao từng bộ đề cụ thể cho học viên!
          </p>
          {isTeacher && (
            <button
              onClick={onCreateQuiz}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/20 transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tạo đề trắc nghiệm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Teacher Filter Controls */}
      {isTeacher && !loading && quizzes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === 'ALL'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Tất cả bộ đề ({quizzes.length})
            </button>
            <button
              onClick={() => setFilterTab('ASSIGNED')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === 'ASSIGNED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã giao cho học viên ({assignedCount})</span>
            </button>
            <button
              onClick={() => setFilterTab('DRAFT')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === 'DRAFT'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bản nháp / Chưa giao ({draftCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 px-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Giáo viên có thể bấm "Giao bài" hoặc "Thu hồi" trực tiếp trên từng thẻ</span>
          </div>
        </div>
      )}

      {/* Quizzes Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Đang tải danh sách bài trắc nghiệm...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">
            {isTeacher && filterTab !== 'ALL'
              ? 'Không có đề thi nào trong mục này'
              : 'Chưa có bài trắc nghiệm nào'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {isTeacher
              ? 'Giáo viên có thể tạo đề mới hoặc chuyển đổi trạng thái giao đề.'
              : 'Hiện chưa có đề thi nào được giáo viên giao. Vui lòng quay lại sau!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const isAssigned = quiz.is_assigned !== false;

            return (
              <div
                key={quiz.id}
                className={`bg-slate-900/80 hover:bg-slate-850 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:-translate-y-1 ${
                  isAssigned
                    ? 'border-slate-800 hover:border-purple-500/40 hover:shadow-purple-500/5'
                    : 'border-slate-800/80 bg-slate-900/40 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg font-medium">
                        <BookCheck className="w-3.5 h-3.5" />
                        <span>{quiz.question_count} Câu</span>
                      </div>

                      {/* Status badge */}
                      {isTeacher && (
                        isAssigned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Đã giao
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Bản nháp
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{quiz.time_limit_minutes}p</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition mb-2">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                    {quiz.description || 'Bài tập trắc nghiệm & thực hành kiểm tra kiến thức.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isTeacher ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAssign(quiz.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition ${
                          isAssigned
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-rose-950/40 hover:border-rose-500/30 hover:text-rose-300'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        }`}
                        title={
                          isAssigned
                            ? 'Học sinh đang nhìn thấy đề này. Bấm để thu hồi.'
                            : 'Bấm để giao đề này cho học sinh làm bài'
                        }
                      >
                        {isAssigned ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đã giao • Thu hồi</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Giao bài</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(quiz.id, quiz.title)}
                        title="Xóa đề trắc nghiệm"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đề được giao</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleStart(quiz.id)}
                    className="inline-flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                  >
                    <span>{isTeacher ? 'Xem trước' : 'Làm bài'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
