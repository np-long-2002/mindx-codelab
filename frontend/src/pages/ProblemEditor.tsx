import React, { useState, useEffect } from 'react';
import type { Difficulty, TestCase } from '../types';
import { problemsApi } from '../services/api';
import { ArrowLeft, Plus, Trash2, Save, FileCode } from 'lucide-react';

interface ProblemEditorProps {
  editProblemId?: number | null;
  onBack: () => void;
  onSaved: () => void;
}

export const ProblemEditor: React.FC<ProblemEditorProps> = ({
  editProblemId,
  onBack,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [description, setDescription] = useState('');
  const [starterCode, setStarterCode] = useState(
    '# Nhập dữ liệu và viết giải thuật tại đây\n'
  );
  const [solutionGuide, setSolutionGuide] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input_data: '', expected_output: '', is_hidden: false, order: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editProblemId) {
      setLoading(true);
      problemsApi
        .get(editProblemId)
        .then((data) => {
          setTitle(data.title);
          setDifficulty(data.difficulty);
          setDescription(data.description);
          setStarterCode(data.starter_code);
          setSolutionGuide(data.solution_guide || '');
          setTestCases(data.test_cases || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [editProblemId]);

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      {
        input_data: '',
        expected_output: '',
        is_hidden: false,
        order: testCases.length + 1,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const handleTestCaseChange = (
    index: number,
    field: keyof TestCase,
    value: any
  ) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Vui lòng điền tiêu đề và mô tả đề bài!');
      return;
    }

    if (testCases.length === 0) {
      alert('Vui lòng tạo ít nhất 1 test case để kiểm thử!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        difficulty,
        description,
        starter_code: starterCode,
        solution_guide: solutionGuide,
        test_cases: testCases.map((tc, idx) => ({
          ...tc,
          order: idx + 1,
        })),
      };

      if (editProblemId) {
        await problemsApi.update(editProblemId, payload);
      } else {
        await problemsApi.create(payload);
      }

      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Có lỗi xảy ra khi lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-white">
          {editProblemId ? 'Chỉnh sửa bài tập' : 'Giao bài tập mới cho học viên'}
        </h1>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span>Thông tin cơ bản</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tiêu đề bài tập *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tìm số lớn nhất trong mảng"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Độ khó *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="EASY">Dễ (Easy)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HARD">Khó (Hard)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mô tả chi tiết đề bài (Hỗ trợ định dạng Markdown) *
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="### Đề bài&#10;Mô tả yêu cầu bài toán...&#10;&#10;### Đầu vào (Input)&#10;...&#10;&#10;### Đầu ra (Output)&#10;..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mẫu code khởi tạo ban đầu (Starter Code)
            </label>
            <textarea
              rows={4}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Gợi ý giải bài (Tùy chọn)
            </label>
            <input
              type="text"
              value={solutionGuide}
              onChange={(e) => setSolutionGuide(e.target.value)}
              placeholder="Ví dụ: Sử dụng vòng lặp for hoặc hàm max()"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Test Cases Builder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Bộ Test Cases kiểm thử tự động
              </h2>
              <p className="text-xs text-slate-400">
                Hệ thống sẽ chạy code của học viên với Input và so khớp với Expected Output.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="inline-flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Test Case</span>
            </button>
          </div>

          <div className="space-y-3">
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    Test Case #{idx + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={tc.is_hidden}
                        onChange={(e) =>
                          handleTestCaseChange(idx, 'is_hidden', e.target.checked)
                        }
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Ẩn đối với học viên (Hidden)</span>
                    </label>

                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Input (Đầu vào từ bàn phím)
                    </label>
                    <textarea
                      rows={2}
                      value={tc.input_data}
                      onChange={(e) =>
                        handleTestCaseChange(idx, 'input_data', e.target.value)
                      }
                      placeholder="Ví dụ: 5\n7"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Expected Output (Kết quả mong muốn) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={tc.expected_output}
                      onChange={(e) =>
                        handleTestCaseChange(idx, 'expected_output', e.target.value)
                      }
                      placeholder="Ví dụ: 12"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
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
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : editProblemId ? 'Cập nhật bài tập' : 'Xuất bản bài tập'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
