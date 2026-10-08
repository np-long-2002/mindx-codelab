import React, { useState, useEffect } from 'react';
import type { Submission } from '../types';
import { submissionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, CheckCircle, XCircle, Clock, Eye, X, ArrowRight } from 'lucide-react';

interface SubmissionsPageProps {
  onSelectProblem: (problemId: number) => void;
}

export const SubmissionsPage: React.FC<SubmissionsPageProps> = ({ onSelectProblem }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const data = await submissionsApi.list();
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to load submissions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Lịch sử nộp bài</h1>
          <p className="text-xs text-slate-400">
            {user?.role === 'TEACHER'
              ? 'Tất cả các lượt nộp bài của học sinh trong hệ thống'
              : 'Theo dõi tiến độ và các lần nộp bài của bạn'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Đang tải lịch sử...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          Chưa có lượt nộp bài nào được ghi nhận. Hãy bắt đầu giải bài tập!
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Bài tập</th>
                  {user?.role === 'TEACHER' && <th className="px-5 py-3.5">Học viên</th>}
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Test Cases Pass</th>
                  <th className="px-5 py-3.5">Thời gian thực thi</th>
                  <th className="px-5 py-3.5">Ngày nộp</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-5 py-3.5 font-medium text-white">{sub.problem_title}</td>
                    {user?.role === 'TEACHER' && (
                      <td className="px-5 py-3.5 text-slate-300">{sub.user_name}</td>
                    )}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          sub.status === 'PASSED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {sub.status === 'PASSED' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Accepted</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Wrong Answer</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {sub.passed_cases}/{sub.total_cases}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {Math.round(sub.execution_time_ms)} ms
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(sub.created_at).toLocaleString('vi-VN')}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem code</span>
                      </button>
                      <button
                        onClick={() => onSelectProblem(sub.problem_id)}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 p-1 hover:bg-slate-800 rounded-lg transition"
                      >
                        <span>Làm lại</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Code Viewer Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Mã nguồn đã nộp</h3>
                <p className="text-xs text-slate-400">Bài tập: {selectedSub.problem_title}</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-950">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {selectedSub.code}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
