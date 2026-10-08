import React, { useState, useEffect } from 'react';
import type { Problem, Difficulty } from '../types';
import { problemsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Code2, CheckCircle2, Flame, Sparkles, Edit3, Trash2, ArrowRight } from 'lucide-react';

interface ProblemListProps {
  onSelectProblem: (id: number) => void;
  onEditProblem?: (id: number) => void;
  onCreateNew?: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  onSelectProblem,
  onEditProblem,
  onCreateNew,
}) => {
  const { isTeacher } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const diffParam = selectedDifficulty === 'ALL' ? undefined : selectedDifficulty;
      const data = await problemsApi.list(diffParam, search || undefined);
      setProblems(data);
    } catch (err) {
      console.error('Failed to load problems', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedDifficulty, search]);

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa bài tập "${title}" không?`)) {
      try {
        await problemsApi.delete(id);
        fetchProblems();
      } catch (err) {
        alert('Có lỗi xảy ra khi xóa bài tập');
      }
    }
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'EASY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Dễ
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Trung bình
          </span>
        );
      case 'HARD':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Khó
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-950/60 border border-indigo-500/20 p-8 mb-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Môi trường Luyện Code Chuẩn Quốc Tế Cho Học Viên MindX</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            MindX Python CodeLab
          </h1>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Nền tảng thực hành viết code Python trực tuyến với trình thông dịch WebAssembly chạy ngay trên trình duyệt.
            Thực hành các bài tập từ cơ bản đến nâng cao, kiểm tra test case tự động tức thì!
          </p>
          {isTeacher && onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            >
              <span>+ Tạo bài tập giao cho học viên</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedDifficulty === diff
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {diff === 'ALL'
                ? 'Tất cả'
                : diff === 'EASY'
                ? 'Dễ'
                : diff === 'MEDIUM'
                ? 'Trung bình'
                : 'Khó'}
            </button>
          ))}
        </div>
      </div>

      {/* Problems List / Cards */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Đang tải danh sách bài tập...</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Code2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">Chưa tìm thấy bài tập nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Không có bài tập nào phù hợp với bộ lọc tìm kiếm hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getDifficultyBadge(problem.difficulty)}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md font-mono">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                    <span>{problem.test_case_count} Test Cases</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1 mb-2">
                  {problem.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {problem.description.replace(/[#*`$]/g, '')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {isTeacher ? (
                  <div className="flex items-center gap-1">
                    {onEditProblem && (
                      <button
                        onClick={() => onEditProblem(problem.id)}
                        title="Chỉnh sửa bài"
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(problem.id, problem.title)}
                      title="Xóa bài"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sẵn sàng luyện tập</span>
                  </div>
                )}

                <button
                  onClick={() => onSelectProblem(problem.id)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
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
