import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, PlusCircle, BookOpen, LogOut, LogIn, History, Shield, User as UserIcon, HelpCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
  isPyodideReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  isPyodideReady,
}) => {
  const { user, logout, isTeacher } = useAuth();

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('problems')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                MindX CodeLab
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPyodideReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span>{isPyodideReady ? 'Python WASM Ready' : 'Python Loading...'}</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('problems')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentTab === 'problems'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Kho bài tập</span>
            </button>

            <button
              onClick={() => setCurrentTab('quizzes')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentTab === 'quizzes' || currentTab === 'quiz-player' || currentTab === 'create-quiz'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Trắc nghiệm</span>
            </button>

            {isTeacher && (
              <>
                <button
                  onClick={() => setCurrentTab('create-problem')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'create-problem'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Giao bài mới</span>
                </button>
                <button
                  onClick={() => setCurrentTab('teacher-dashboard')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'teacher-dashboard'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Quản lý lớp học</span>
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentTab('submissions')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentTab === 'submissions'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch sử nộp bài</span>
            </button>
          </div>

          {/* User Auth Info */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user.full_name}</div>
                  <div className="text-[10px] flex items-center gap-1 font-mono">
                    <span
                      className={`px-1.5 py-0.2 rounded font-medium ${
                        user.role === 'TEACHER'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {user.role === 'TEACHER' ? 'Giáo viên' : 'Học viên'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition transform active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

