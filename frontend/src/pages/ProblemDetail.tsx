import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import type { ProblemDetail as IProblemDetail, Submission, TestResult } from '../types';
import { problemsApi, submissionsApi } from '../services/api';
import { usePyodide } from '../hooks/usePyodide';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Send,
  RotateCcw,
  Terminal,
  CheckCircle,
  XCircle,
  FileText,
  History,
  Clock,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface ProblemDetailProps {
  problemId: number;
  onBack: () => void;
  openAuthModal: () => void;
}

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  problemId,
  onBack,
  openAuthModal,
}) => {
  const { user } = useAuth();
  const { runCode, evaluateTestCases, isReady, isLoading, loadingProgress } = usePyodide();

  const [problem, setProblem] = useState<IProblemDetail | null>(null);
  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'history'>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'tests'>('tests');

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [consoleError, setConsoleError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Test results state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submissionStats, setSubmissionStats] = useState<{
    passed: number;
    total: number;
    allPassed: boolean;
  } | null>(null);

  // Submissions history
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const loadProblem = async () => {
      try {
        const data = await problemsApi.get(problemId);
        setProblem(data);
        setCode(data.starter_code || '# Viết code của bạn ở đây\n');
      } catch (err) {
        console.error('Failed to load problem', err);
      }
    };
    loadProblem();
    loadSubmissions();
  }, [problemId]);

  const loadSubmissions = async () => {
    if (!user) return;
    try {
      const subs = await submissionsApi.list(problemId, user.id);
      setSubmissions(subs);
    } catch (err) {
      console.error('Failed to load submissions', err);
    }
  };

  const handleRunCode = async () => {
    if (!isReady || isRunning) return;
    setIsRunning(true);
    setActiveBottomTab('terminal');
    setConsoleOutput('Đang chạy code...\n');
    setConsoleError(null);

    // Get input from first test case as sample input
    const sampleInput = problem?.test_cases[0]?.input_data || '';
    const res = await runCode(code, sampleInput);

    setIsRunning(false);
    setExecutionTime(res.executionTimeMs);
    if (res.error) {
      setConsoleError(res.error);
      setConsoleOutput(res.stdout || '');
    } else {
      setConsoleOutput(res.stdout || 'Chương trình thực thi thành công không có output.');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!isReady || !problem || isSubmitting) return;

    setIsSubmitting(true);
    setActiveBottomTab('tests');
    setConsoleOutput('Đang chấm bài và kiểm thử toàn bộ test cases...\n');

    const evalResult = await evaluateTestCases(code, problem.test_cases);
    setTestResults(evalResult.results);
    setSubmissionStats({
      passed: evalResult.passedCount,
      total: evalResult.totalCount,
      allPassed: evalResult.allPassed,
    });
    setExecutionTime(evalResult.totalTimeMs);

    // If all passed, celebration!
    if (evalResult.allPassed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Save submission to backend
    try {
      await submissionsApi.create({
        problem_id: problem.id,
        code: code,
        status: evalResult.allPassed ? 'PASSED' : 'FAILED',
        passed_cases: evalResult.passedCount,
        total_cases: evalResult.totalCount,
        execution_time_ms: evalResult.totalTimeMs,
        error_message: evalResult.results.find((r) => r.error)?.error,
      });
      loadSubmissions();
    } catch (err) {
      console.error('Failed to record submission', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCode = () => {
    if (confirm('Khôi phục lại mã nguồn mẫu ban đầu của bài tập?')) {
      setCode(problem?.starter_code || '# Viết code của bạn ở đây\n');
    }
  };

  if (!problem) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Top IDE Toolbar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kho bài</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <h2 className="text-sm font-bold text-white max-w-xs sm:max-w-md truncate">
            {problem.title}
          </h2>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              problem.difficulty === 'EASY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : problem.difficulty === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {problem.difficulty === 'EASY'
              ? 'Dễ'
              : problem.difficulty === 'MEDIUM'
              ? 'Trung bình'
              : 'Khó'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetCode}
            title="Khôi phục lại mẫu code ban đầu"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={!isReady || isRunning || isSubmitting}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Đang chạy...' : 'Chạy thử'}</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isReady || isRunning || isSubmitting}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 active:scale-95"
          >
            <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-bounce' : ''}`} />
            <span>{isSubmitting ? 'Đang chấm bài...' : 'Nộp bài'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Split 2 Columns) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Problem description & Submissions */}
        <div className="w-full md:w-5/12 border-r border-slate-800 flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900 px-2 pt-1 gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                activeLeftTab === 'description'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đề bài</span>
            </button>
            <button
              onClick={() => setActiveLeftTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                activeLeftTab === 'history'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử nộp ({submissions.length})</span>
            </button>
          </div>

          {/* Left Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300 leading-relaxed">
            {activeLeftTab === 'description' ? (
              <div className="space-y-4">
                <div className="prose prose-invert max-w-none text-xs sm:text-sm whitespace-pre-wrap font-sans">
                  {problem.description}
                </div>

                {/* Sample Test Cases Display */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Ví dụ minh họa (Sample Cases)
                  </h4>
                  <div className="space-y-3">
                    {problem.test_cases
                      .filter((tc) => !tc.is_hidden)
                      .slice(0, 3)
                      .map((tc, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs"
                        >
                          <div className="text-[11px] font-semibold text-indigo-400 mb-1">
                            Ví dụ {idx + 1}:
                          </div>
                          <div className="mb-2">
                            <span className="text-slate-500 block mb-0.5">Input:</span>
                            <pre className="bg-slate-900 p-2 rounded border border-slate-800/80 font-mono text-[11px] text-slate-200">
                              {tc.input_data || '(Không có)'}
                            </pre>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Expected Output:</span>
                            <pre className="bg-slate-900 p-2 rounded border border-slate-800/80 font-mono text-[11px] text-emerald-400">
                              {tc.expected_output}
                            </pre>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {problem.solution_guide && (
                  <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    <div className="flex items-center gap-1.5 font-semibold mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gợi ý hướng giải</span>
                    </div>
                    <p className="text-amber-200/80">{problem.solution_guide}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Submissions History */
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Bạn chưa nộp bài lần nào cho bài tập này.
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              sub.status === 'PASSED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {sub.status === 'PASSED' ? 'Accepted (AC)' : 'Wrong Answer (WA)'}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {sub.passed_cases}/{sub.total_cases} test cases
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(sub.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {Math.round(sub.execution_time_ms)} ms
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Panel */}
        <div className="w-full md:w-7/12 flex flex-col bg-slate-950 overflow-hidden">
          {/* Monaco Editor Container */}
          <div className="flex-1 relative min-h-[300px]">
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-indigo-300 font-medium">{loadingProgress}</p>
                <p className="text-[11px] text-slate-500 mt-1">Đang tải Python WASM (chỉ tải một lần)</p>
              </div>
            )}
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                lineNumbers: 'on',
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Bottom Output / Test Cases Panel */}
          <div className="h-64 border-t border-slate-800 flex flex-col bg-slate-900/90 flex-shrink-0">
            {/* Bottom Tabs Bar */}
            <div className="h-10 border-b border-slate-800 px-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveBottomTab('tests')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeBottomTab === 'tests'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Test Cases</span>
                  {submissionStats && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                        submissionStats.allPassed
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {submissionStats.passed}/{submissionStats.total}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveBottomTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeBottomTab === 'terminal'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal Console</span>
                </button>
              </div>

              {executionTime !== null && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Thời gian: {executionTime} ms
                </div>
              )}
            </div>

            {/* Bottom Content Body */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
              {activeBottomTab === 'terminal' ? (
                /* Terminal Output */
                <div className="space-y-2">
                  {consoleError ? (
                    <pre className="text-rose-400 whitespace-pre-wrap bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-xl">
                      {consoleError}
                    </pre>
                  ) : null}
                  <pre className="text-slate-200 whitespace-pre-wrap">{consoleOutput}</pre>
                </div>
              ) : (
                /* Test Cases Result View */
                <div className="space-y-2">
                  {submissionStats && (
                    <div
                      className={`p-3 rounded-xl mb-3 flex items-center justify-between border ${
                        submissionStats.allPassed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {submissionStats.allPassed ? (
                          <Sparkles className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        )}
                        <div>
                          <div className="font-bold text-sm">
                            {submissionStats.allPassed
                              ? 'Chúc mừng! Bạn đã hoàn thành xuất sắc tất cả test cases!'
                              : 'Chưa đạt! Một số test case trả về kết quả chưa chính xác.'}
                          </div>
                          <div className="text-[11px] opacity-80">
                            Vượt qua {submissionStats.passed} trên tổng số {submissionStats.total} test
                            cases
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {testResults.length === 0 ? (
                    <div className="text-slate-500 text-center py-6">
                      Nhấn <strong className="text-indigo-400">"Nộp bài"</strong> để kiểm thử toàn bộ test cases, hoặc nhấn <strong className="text-emerald-400">"Chạy thử"</strong> để chạy với input mẫu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {testResults.map((tr) => (
                        <div
                          key={tr.order}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            tr.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-rose-950/20 border-rose-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {tr.passed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold text-slate-200">
                                Test Case #{tr.order} {tr.isHidden ? '(Ẩn)' : ''}
                              </span>
                              {!tr.passed && !tr.isHidden && (
                                <div className="text-[11px] text-slate-400 mt-1">
                                  <span>Kỳ vọng: </span>
                                  <span className="text-emerald-400 font-bold">{tr.expected}</span>
                                  <span className="mx-2">|</span>
                                  <span>Thực tế: </span>
                                  <span className="text-rose-400 font-bold">
                                    {tr.actual || tr.error || '(Rỗng)'}
                                  </span>
                                </div>
                              )}
                              {!tr.passed && tr.isHidden && (
                                <div className="text-[11px] text-rose-400/80 mt-0.5">
                                  Kết quả trả về không khớp với output kỳ vọng của test case ẩn.
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              tr.passed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {tr.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
