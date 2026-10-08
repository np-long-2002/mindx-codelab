import React, { useState } from 'react';
import { quizzesApi } from '../services/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  HelpCircle,
  CheckCircle,
  FileSpreadsheet,
  Download,
  Upload,
  BookOpen,
  Code2,
  Terminal,
} from 'lucide-react';
import { downloadQuizTemplate, parseQuizExcel } from '../utils/excelQuizHelper';

interface QuizEditorProps {
  onBack: () => void;
  onSaved: () => void;
}

interface NewQuestion {
  question_text: string;
  question_type?: 'THEORY' | 'PRACTICE';
  code_snippet: string;
  explanation: string;
  test_cases?: { input: string; expected: string; is_hidden?: boolean }[];
  options: { option_text: string; is_correct: boolean }[];
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ onBack, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [isAssigned, setIsAssigned] = useState(true);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<NewQuestion[]>([
    {
      question_text: '',
      question_type: 'THEORY',
      code_snippet: '',
      explanation: '',
      test_cases: [],
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    },
  ]);

  const handleAddQuestion = (type: 'THEORY' | 'PRACTICE' = 'THEORY') => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: type,
        code_snippet: '',
        explanation: '',
        test_cases: type === 'PRACTICE' ? [{ input: '', expected: '', is_hidden: false }] : [],
        options:
          type === 'PRACTICE'
            ? []
            : [
                { option_text: '', is_correct: true },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
              ],
      },
    ]);
  };

  const handleToggleQuestionType = (qIndex: number, type: 'THEORY' | 'PRACTICE') => {
    const updated = [...questions];
    updated[qIndex].question_type = type;
    if (type === 'PRACTICE') {
      if (!updated[qIndex].test_cases || updated[qIndex].test_cases!.length === 0) {
        updated[qIndex].test_cases = [{ input: '', expected: '', is_hidden: false }];
      }
    } else {
      if (!updated[qIndex].options || updated[qIndex].options.length === 0) {
        updated[qIndex].options = [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
        ];
      }
    }
    setQuestions(updated);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionChange = (qIndex: number, field: keyof NewQuestion, value: any) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].option_text = text;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.forEach((opt, idx) => {
      opt.is_correct = idx === optIndex;
    });
    setQuestions(updated);
  };

  const handleAddTestCase = (qIndex: number) => {
    const updated = [...questions];
    const currentTC = updated[qIndex].test_cases || [];
    updated[qIndex].question_type = 'PRACTICE';
    updated[qIndex].test_cases = [
      ...currentTC,
      { input: '', expected: '', is_hidden: false },
    ];
    setQuestions(updated);
  };

  const handleRemoveTestCase = (qIndex: number, tcIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].test_cases) {
      updated[qIndex].test_cases = updated[qIndex].test_cases!.filter(
        (_, idx) => idx !== tcIndex
      );
    }
    setQuestions(updated);
  };

  const handleTestCaseChange = (
    qIndex: number,
    tcIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...questions];
    if (updated[qIndex].test_cases) {
      updated[qIndex].test_cases![tcIndex] = {
        ...updated[qIndex].test_cases![tcIndex],
        [field]: value,
      };
    }
    setQuestions(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseQuizExcel(file);
      if (parsed.length === 0) return;

      const isDefaultInitial =
        questions.length === 1 && !questions[0].question_text.trim();

      const replace =
        isDefaultInitial ||
        confirm(
          `Đã đọc thành công ${parsed.length} câu hỏi từ file Excel!\n\n- Bấm "OK" để THAY THẾ danh sách câu hỏi hiện tại.\n- Bấm "Cancel" để THÊM VÀO CUỐI danh sách.`
        );

      if (replace) {
        setQuestions(parsed);
      } else {
        setQuestions([...questions, ...parsed]);
      }

      alert(`Đã nạp thành công ${parsed.length} câu hỏi từ file Excel!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đọc file Excel');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề đề trắc nghiệm!');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        alert(`Vui lòng nhập nội dung cho câu hỏi số ${i + 1}!`);
        return;
      }
      const isPractice =
        q.question_type === 'PRACTICE' || (q.test_cases && q.test_cases.length > 0);
      if (!isPractice) {
        if (!q.options || q.options.length === 0) {
          alert(`Câu hỏi trắc nghiệm số ${i + 1} phải có các đáp án lựa chọn!`);
          return;
        }
        const hasEmptyOption = q.options.some((o) => !o.option_text.trim());
        if (hasEmptyOption) {
          alert(`Câu hỏi số ${i + 1} có đáp án còn để trống, vui lòng điền đầy đủ!`);
          return;
        }
      } else {
        if (!q.test_cases || q.test_cases.length === 0) {
          alert(`Câu hỏi thực hành số ${i + 1} cần có ít nhất 1 test case để chấm điểm!`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await quizzesApi.create({
        title,
        description,
        time_limit_minutes: timeLimitMinutes,
        is_assigned: isAssigned,
        questions: questions.map((q, idx) => {
          const isPractice =
            q.question_type === 'PRACTICE' || (q.test_cases && q.test_cases.length > 0);
          return {
            question_text: q.question_text,
            question_type: isPractice ? 'PRACTICE' : 'THEORY',
            code_snippet: q.code_snippet || null,
            explanation: q.explanation || null,
            test_cases: q.test_cases || [],
            order: idx + 1,
            options: isPractice
              ? []
              : (q.options || []).map((opt, oIdx) => ({
                  option_text: opt.option_text,
                  is_correct: opt.is_correct,
                  order: oIdx + 1,
                })),
          };
        }),
      });

      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo bài trắc nghiệm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Soạn đề trắc nghiệm mới</h1>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <span>Thông tin đề thi</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tiêu đề đề thi trắc nghiệm *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ôn tập Hàm & Đệ quy trong Python"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Thời gian làm bài (Phút) *
              </label>
              <input
                type="number"
                min="1"
                max="180"
                required
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 15)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mô tả nội dung kiểm tra
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi kiến thức, mục tiêu của bài trắc nghiệm..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Assignment Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Giao bài ngay cho học sinh</span>
                {isAssigned ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                    Đang bật (Học viên thấy đề này)
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-medium">
                    Bản nháp (Chỉ giáo viên thấy)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nếu tắt, bài thi sẽ lưu ở trạng thái bản nháp. Giáo viên có thể bật giao bài sau ở danh sách đề.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={isAssigned}
                onChange={(e) => setIsAssigned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Excel Import Bar */}
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 flex-shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Nhập câu hỏi từ file Excel</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  Chuẩn Quizizz
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tải file mẫu Excel, điền câu hỏi và đáp án, sau đó tải lên để tạo đề thi nhanh chóng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-shrink-0">
            <button
              type="button"
              onClick={downloadQuizTemplate}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tải file mẫu (.xlsx)</span>
            </button>

            <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Chọn file Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Questions Builder */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Danh sách câu hỏi ({questions.length} câu)
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  <BookOpen className="w-3.5 h-3.5" />
                  {questions.filter((q) => !(q.question_type === 'PRACTICE' || (q.test_cases && q.test_cases.length > 0))).length} câu lý thuyết
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-400 font-semibold">
                  <Code2 className="w-3.5 h-3.5" />
                  {questions.filter((q) => q.question_type === 'PRACTICE' || (q.test_cases && q.test_cases.length > 0)).length} câu thực hành (có Test Cases)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddQuestion('THEORY')}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Câu Lý thuyết</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('PRACTICE')}
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-purple-600/30 transition"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>+ Câu Thực hành</span>
              </button>
            </div>
          </div>

          {questions.map((q, qIdx) => {
            const isPractice =
              q.question_type === 'PRACTICE' || (q.test_cases && q.test_cases.length > 0);

            return (
              <div
                key={qIdx}
                className={`bg-slate-900 border rounded-2xl p-6 space-y-4 shadow-lg transition ${
                  isPractice
                    ? 'border-purple-500/40 shadow-purple-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Header with Type Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                      Câu #{qIdx + 1}
                    </span>

                    {/* Question Type Toggle */}
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionType(qIdx, 'THEORY')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          !isPractice
                            ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Lý thuyết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionType(qIdx, 'PRACTICE')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          isPractice
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Thực hành (Code + Test Cases)</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPractice && (
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-purple-400" />
                        <span>Thực hành ({q.test_cases?.length || 0} Test Cases)</span>
                      </span>
                    )}
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Practical Question Info Banner */}
                {isPractice && (
                  <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-3.5 text-xs text-purple-200 flex items-start gap-3">
                    <Terminal className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Chế độ Thực hành (Tự động chấm bằng Test Cases):</span>{' '}
                      Học viên sẽ trực tiếp gõ code trong Monaco Editor và chạy kiểm thử với các Test Cases bên dưới. Không cần tạo các đáp án trắc nghiệm A, B, C, D cho câu hỏi này.
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nội dung câu hỏi / Đề bài *
                </label>
                <input
                  type="text"
                  required
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                  placeholder={
                    isPractice
                      ? 'Ví dụ: Viết chương trình tính tổng hai số a và b nhập từ bàn phím.'
                      : 'Ví dụ: Lệnh nào sau đây dùng để xóa phần tử cuối cùng của list?'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {isPractice
                    ? 'Mã nguồn khởi tạo / gợi ý (Starter code trong editor của học viên)'
                    : 'Đoạn code minh họa (Tùy chọn)'}
                </label>
                <textarea
                  rows={isPractice ? 3 : 2}
                  value={q.code_snippet}
                  onChange={(e) => handleQuestionChange(qIdx, 'code_snippet', e.target.value)}
                  placeholder={
                    isPractice
                      ? '# Nhập code gợi ý hoặc hàm khởi tạo cho học viên...\ndef solution():\n    pass'
                      : 'def my_func(): ... (nếu có)'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 4 Options only for Theory questions */}
              {!isPractice ? (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-medium text-slate-400">
                    4 Lựa chọn (Chọn nút tròn để chỉ định đáp án đúng):
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                          opt.is_correct
                            ? 'bg-emerald-950/30 border-emerald-500/50'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition flex-shrink-0 ${
                            opt.is_correct
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                          title="Đánh dấu đây là đáp án đúng"
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>
                        <input
                          type="text"
                          required
                          value={opt.option_text}
                          onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                          placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                        {opt.is_correct && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-purple-500/20 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <span>Bài thực hành được chấm điểm tự động dựa trên số Test Cases vượt qua (không dùng đáp án A, B, C, D).</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {isPractice
                    ? 'Giải thích / Hướng dẫn giải thuật (Học sinh xem sau khi nộp bài)'
                    : 'Giải thích đáp án (Học sinh sẽ xem được sau khi nộp bài)'}
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                  placeholder={
                    isPractice
                      ? 'Gợi ý thuật toán hoặc hướng dẫn giải quyết bài toán...'
                      : 'Giải thích tại sao đáp án này đúng...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Test cases builder for this question */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bộ Test Cases kiểm thử cho câu này ({q.test_cases?.length || 0})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTestCase(qIdx)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm Test Case</span>
                  </button>
                </div>

                {q.test_cases && q.test_cases.length > 0 && (
                  <div className="space-y-2">
                    {q.test_cases.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2"
                      >
                        <span className="text-[10px] font-mono text-slate-500">#{tcIdx + 1}</span>
                        <input
                          type="text"
                          value={tc.input}
                          onChange={(e) =>
                            handleTestCaseChange(qIdx, tcIdx, 'input', e.target.value)
                          }
                          placeholder="Input (ví dụ: 5\n10)"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={tc.expected}
                          onChange={(e) =>
                            handleTestCaseChange(qIdx, tcIdx, 'expected', e.target.value)
                          }
                          placeholder="Expected Output (ví dụ: 15)"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(qIdx, tcIdx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm font-medium transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Xuất bản đề trắc nghiệm'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

