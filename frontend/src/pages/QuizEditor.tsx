import React, { useState } from 'react';
import { quizzesApi } from '../services/api';
import { ArrowLeft, Plus, Trash2, Save, HelpCircle, CheckCircle } from 'lucide-react';

interface QuizEditorProps {
  onBack: () => void;
  onSaved: () => void;
}

interface NewQuestion {
  question_text: string;
  code_snippet: string;
  explanation: string;
  options: { option_text: string; is_correct: boolean }[];
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ onBack, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<NewQuestion[]>([
    {
      question_text: '',
      code_snippet: '',
      explanation: '',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        code_snippet: '',
        explanation: '',
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
        ],
      },
    ]);
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
      const hasEmptyOption = q.options.some((o) => !o.option_text.trim());
      if (hasEmptyOption) {
        alert(`Câu hỏi số ${i + 1} có đáp án còn để trống, vui lòng điền đầy đủ!`);
        return;
      }
    }

    setSaving(true);
    try {
      await quizzesApi.create({
        title,
        description,
        time_limit_minutes: timeLimitMinutes,
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          code_snippet: q.code_snippet || null,
          explanation: q.explanation || null,
          order: idx + 1,
          options: q.options.map((opt, oIdx) => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order: oIdx + 1,
          })),
        })),
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
        </div>

        {/* Questions Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Danh sách câu hỏi ({questions.length} câu)
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi</span>
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Câu hỏi #{qIdx + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nội dung câu hỏi *
                </label>
                <input
                  type="text"
                  required
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                  placeholder="Ví dụ: Lệnh nào sau đây dùng để xóa phần tử cuối cùng của list?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Đoạn code minh họa (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={q.code_snippet}
                  onChange={(e) => handleQuestionChange(qIdx, 'code_snippet', e.target.value)}
                  placeholder="def my_func(): ... (nếu có)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 4 Options */}
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

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Giải thích đáp án (Học sinh sẽ xem được sau khi nộp bài)
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                  placeholder="Giải thích tại sao đáp án này đúng..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          ))}
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
