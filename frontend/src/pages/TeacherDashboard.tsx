import React, { useState, useEffect } from 'react';
import type { Submission, Problem } from '../types';
import { submissionsApi, problemsApi } from '../services/api';
import { Shield, CheckCircle, XCircle, Clock, Eye, X, BookOpen, Users } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filterProblemId, setFilterProblemId] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subsData, probsData] = await Promise.all([
          submissionsApi.list(),
          problemsApi.list(),
        ]);
        setSubmissions(subsData);
        setProblems(probsData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSubmissions =
    filterProblemId === 'ALL'
      ? submissions
      : submissions.filter((s) => s.problem_id === parseInt(filterProblemId));

  const totalSubs = submissions.length;
  const passedSubs = submissions.filter((s) => s.status === 'PASSED').length;
  const passRate = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Khu vực Giáo viên</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Quản lý lớp học & Chấm bài</h1>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tổng số bài tập đã giao</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{problems.length}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tổng lượt nộp bài</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSubs}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tỷ lệ bài đạt (Pass Rate)</span>
            <CheckCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{passRate}%</div>
        </div>
      </div>

      {/* Filter by problem */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Danh sách bài nộp của học viên</h2>
        <div className="w-64">
          <select
            value={filterProblemId}
            onChange={(e) => setFilterProblemId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Tất cả bài tập</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Đang tải lịch sử làm bài...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          Chưa có lượt nộp bài nào được ghi nhận.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Học viên</th>
                  <th className="px-5 py-3.5">Bài tập</th>
                  <th className="px-5 py-3.5">Kết quả</th>
                  <th className="px-5 py-3.5">Test Cases</th>
                  <th className="px-5 py-3.5">Thời gian thực thi</th>
                  <th className="px-5 py-3.5">Thời điểm nộp</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-5 py-3.5 font-medium text-white">{sub.user_name}</td>
                    <td className="px-5 py-3.5 text-slate-300">{sub.problem_title}</td>
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
                            <span>Failed</span>
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
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold p-1 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem code</span>
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
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Bài làm của {selectedSubmission.user_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Bài tập: {selectedSubmission.problem_title} | Kết quả:{' '}
                  <span
                    className={
                      selectedSubmission.status === 'PASSED'
                        ? 'text-emerald-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {selectedSubmission.passed_cases}/{selectedSubmission.total_cases} Pass
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-950">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {selectedSubmission.code}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900">
              <button
                onClick={() => setSelectedSubmission(null)}
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
