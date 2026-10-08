import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, UserCheck, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, fullName, password, role);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể đăng nhập tài khoản mẫu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-1">
              {isLoginMode ? 'Đăng nhập MindX CodeLab' : 'Đăng ký tài khoản mới'}
            </h3>
            <p className="text-xs text-slate-400">
              {isLoginMode
                ? 'Luyện code Python và làm bài tập được giao trực tuyến'
                : 'Tạo tài khoản để bắt đầu trải nghiệm'}
            </p>
          </div>

          {/* Quick Demo Login Cards */}
          {isLoginMode && (
            <div className="mb-6 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tài khoản Demo thử nghiệm nhanh</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('teacher@mindx.edu.vn', 'mindx123')}
                  className="flex flex-col items-center p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition text-left group"
                >
                  <Shield className="w-5 h-5 text-rose-400 mb-1" />
                  <span className="text-xs font-medium text-rose-300">Giáo viên (Thầy Hoàng)</span>
                  <span className="text-[10px] text-rose-400/80">Có quyền giao bài & chấm</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student@mindx.edu.vn', 'mindx123')}
                  className="flex flex-col items-center p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition text-left group"
                >
                  <UserCheck className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-xs font-medium text-indigo-300">Học viên (Văn An)</span>
                  <span className="text-[10px] text-indigo-400/80">Vào làm & nộp bài</span>
                </button>
              </div>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[11px] text-slate-500">hoặc đăng nhập thủ công</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vai trò của bạn</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-2 text-xs rounded-xl font-medium border transition ${
                        role === 'STUDENT'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Học viên
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('TEACHER')}
                      className={`py-2 text-xs rounded-xl font-medium border transition ${
                        role === 'TEACHER'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Giáo viên
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@mindx.edu.vn"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              {isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Quay lại đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

