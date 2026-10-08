import * as XLSX from 'xlsx';

export interface ParsedQuestion {
  question_text: string;
  code_snippet: string;
  explanation: string;
  options: { option_text: string; is_correct: boolean }[];
}

export const downloadQuizTemplate = () => {
  const headers = [
    'Câu hỏi (Bắt buộc)',
    'Đoạn code Python (Tùy chọn)',
    'Đáp án A (Bắt buộc)',
    'Đáp án B (Bắt buộc)',
    'Đáp án C (Bắt buộc)',
    'Đáp án D (Bắt buộc)',
    'Đáp án đúng (A, B, C hoặc D)',
    'Giải thích chi tiết (Tùy chọn)',
  ];

  const sampleData = [
    [
      'Hàm nào dùng để xuất dữ liệu ra màn hình trong Python?',
      '',
      'print()',
      'echo()',
      'console.log()',
      'printf()',
      'A',
      'Hàm print() là hàm tích hợp sẵn trong Python để in dữ liệu ra terminal.',
    ],
    [
      'Kết quả in ra màn hình của đoạn code sau là gì?',
      'x = 10\ny = 5\nprint(x > y)',
      'True',
      'False',
      'None',
      'Báo lỗi',
      'A',
      'Phép so sánh 10 > 5 trả về giá trị boolean True.',
    ],
    [
      'Cấu trúc dữ liệu nào trong Python được biểu diễn bằng cặp ngoặc vuông []?',
      '',
      'Tuple',
      'Dictionary',
      'List',
      'Set',
      'C',
      'List (danh sách) trong Python được định nghĩa bằng cặp ngoặc vuông [].',
    ],
    [
      'Đoạn code sau đây sẽ in ra bao nhiêu lần chữ "MindX"?',
      'for i in range(3):\n    print("MindX")',
      '2',
      '3',
      '4',
      '0',
      'B',
      'range(3) sinh ra các giá trị 0, 1, 2 (tổng cộng 3 lần lặp).',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  ws['!cols'] = [
    { wch: 45 }, // Câu hỏi
    { wch: 30 }, // Code
    { wch: 20 }, // Đáp án A
    { wch: 20 }, // Đáp án B
    { wch: 20 }, // Đáp án C
    { wch: 20 }, // Đáp án D
    { wch: 15 }, // Đáp án đúng
    { wch: 40 }, // Giải thích
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Cau_Hoi_MindX');

  XLSX.writeFile(wb, 'mau_cau_hoi_trac_nghiem_mindx.xlsx');
};

export const parseQuizExcel = (file: File): Promise<ParsedQuestion[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          throw new Error('File Excel rỗng hoặc không có dữ liệu câu hỏi!');
        }

        const parsedQuestions: ParsedQuestion[] = [];

        // Skip header row (index 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const questionText = String(row[0] || '').trim();
          if (!questionText) continue; // Skip empty question

          const codeSnippet = String(row[1] || '').trim();
          const optA = String(row[2] || '').trim();
          const optB = String(row[3] || '').trim();
          const optC = String(row[4] || '').trim();
          const optD = String(row[5] || '').trim();

          const rawCorrect = String(row[6] || '')
            .trim()
            .toUpperCase();
          const explanation = String(row[7] || '').trim();

          // Determine correct index: default to 0 (A)
          let correctIndex = 0;
          if (rawCorrect === 'B' || rawCorrect === '2') correctIndex = 1;
          else if (rawCorrect === 'C' || rawCorrect === '3') correctIndex = 2;
          else if (rawCorrect === 'D' || rawCorrect === '4') correctIndex = 3;

          const options = [
            { option_text: optA || 'Đáp án A', is_correct: correctIndex === 0 },
            { option_text: optB || 'Đáp án B', is_correct: correctIndex === 1 },
            { option_text: optC || 'Đáp án C', is_correct: correctIndex === 2 },
            { option_text: optD || 'Đáp án D', is_correct: correctIndex === 3 },
          ];

          parsedQuestions.push({
            question_text: questionText,
            code_snippet: codeSnippet,
            explanation: explanation,
            options,
          });
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không đọc được câu hỏi nào từ file Excel. Vui lòng kiểm tra lại định dạng!');
        }

        resolve(parsedQuestions);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

