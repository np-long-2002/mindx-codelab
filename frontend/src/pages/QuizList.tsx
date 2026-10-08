import React, { useState, useEffect } from 'react';
import type { Quiz } from '../types';
import { quizzesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Clock, BookCheck, PlusCircle, Trash2, ArrowRight, Sparkles } from 'lucide-react';

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

  const handleStart = (quizId: number) => {
    if (!user) {
      openAuthModal();
      return;
    }
    onStartQuiz(quizId);
  };

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
            Thử thách với các câu hỏi trắc nghiệm về cú pháp, tư duy thuật toán, cấu trúc dữ liệu và phân tích code Python.
            Xem giải thích chi tiết ngay sau khi nộp bài!
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

      {/* Quizzes Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Đang tải danh sách bài trắc nghiệm...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">Chưa có bài trắc nghiệm nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Giáo viên có thể bấm nút "Tạo đề trắc nghiệm mới" để bắt đầu soạn đề cho học viên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg font-medium">
                    <BookCheck className="w-3.5 h-3.5" />
                    <span>{quiz.question_count} Câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{quiz.time_limit_minutes} phút</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition mb-2">
                  {quiz.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {quiz.description || 'Bài tập trắc nghiệm kiểm tra kiến thức.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                {isTeacher ? (
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    title="Xóa đề trắc nghiệm"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">Trắc nghiệm Online</span>
                )}

                <button
                  onClick={() => handleStart(quiz.id)}
                  className="inline-flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  <span>Làm bài</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

