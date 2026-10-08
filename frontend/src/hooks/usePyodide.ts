import { useState, useEffect, useRef, useCallback } from 'react';
import type { TestCase, TestResult } from '../types';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
  }
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

export const usePyodide = () => {
  const [isLoading, setIsLoading] = useState<boolean>(!pyodideInstance);
  const [isReady, setIsReady] = useState<boolean>(!!pyodideInstance);
  const [loadingProgress, setLoadingProgress] = useState<string>('Khởi tạo môi trường Python...');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const initPyodide = async () => {
      if (pyodideInstance) {
        setIsReady(true);
        setIsLoading(false);
        return;
      }

      if (!pyodideLoadingPromise) {
        pyodideLoadingPromise = (async () => {
          let retry = 0;
          while (!window.loadPyodide && retry < 20) {
            await new Promise((r) => setTimeout(r, 200));
            retry++;
          }

          if (!window.loadPyodide) {
            throw new Error('Không thể tải thư viện Pyodide từ CDN');
          }

          const py = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
          });

          return py;
        })();
      }

      try {
        setLoadingProgress('Đang nạp trình thông dịch Python WebAssembly...');
        pyodideInstance = await pyodideLoadingPromise;
        if (isMounted.current) {
          setIsReady(true);
          setIsLoading(false);
          setLoadingProgress('Sẵn sàng');
        }
      } catch (err) {
        console.error('Failed to load Pyodide', err);
        if (isMounted.current) {
          setIsLoading(false);
          setLoadingProgress('Lỗi khi tải Python WebAssembly');
        }
      }
    };

    initPyodide();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const runCode = useCallback(
    async (
      code: string,
      stdinInput: string = ''
    ): Promise<{ stdout: string; stderr: string; error?: string; executionTimeMs: number }> => {
      if (!pyodideInstance) {
        return {
          stdout: '',
          stderr: '',
          error: 'Trình biên dịch Python chưa sẵn sàng, vui lòng đợi trong giây lát...',
          executionTimeMs: 0,
        };
      }

      const startTime = performance.now();

      // Python execution wrapper capturing stdin and stdout/stderr
      const pythonRunner = `
import sys
import io

stdin_buffer = io.StringIO(${JSON.stringify(stdinInput)})
stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()

orig_stdin = sys.stdin
orig_stdout = sys.stdout
orig_stderr = sys.stderr

sys.stdin = stdin_buffer
sys.stdout = stdout_buffer
sys.stderr = stderr_buffer

error_msg = None

try:
    # Run user code in clean global scope
    exec(${JSON.stringify(code)}, {})
except Exception as e:
    import traceback
    error_msg = traceback.format_exc()
finally:
    sys.stdin = orig_stdin
    sys.stdout = orig_stdout
    sys.stderr = orig_stderr

__runner_result = {
    "stdout": stdout_buffer.getvalue(),
    "stderr": stderr_buffer.getvalue(),
    "error": error_msg
}
`;

      try {
        await pyodideInstance.runPythonAsync(pythonRunner);
        const resultPy = pyodideInstance.globals.get('__runner_result');
        const result = resultPy.toJs();
        const endTime = performance.now();

        return {
          stdout: result.get ? result.get('stdout') : result.stdout || '',
          stderr: result.get ? result.get('stderr') : result.stderr || '',
          error: result.get ? result.get('error') : result.error || undefined,
          executionTimeMs: Math.round(endTime - startTime),
        };
      } catch (err: any) {
        const endTime = performance.now();
        return {
          stdout: '',
          stderr: '',
          error: err.message || String(err),
          executionTimeMs: Math.round(endTime - startTime),
        };
      }
    },
    []
  );

  const evaluateTestCases = useCallback(
    async (
      code: string,
      testCases: TestCase[]
    ): Promise<{
      results: TestResult[];
      passedCount: number;
      totalCount: number;
      allPassed: boolean;
      totalTimeMs: number;
    }> => {
      const results: TestResult[] = [];
      let totalTimeMs = 0;

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await runCode(code, tc.input_data || '');
        totalTimeMs += res.executionTimeMs;

        const actualTrimmed = (res.stdout || '').trim();
        const expectedTrimmed = (tc.expected_output || '').trim();
        const passed = !res.error && actualTrimmed === expectedTrimmed;

        results.push({
          order: tc.order || i + 1,
          input: tc.input_data || '',
          expected: tc.expected_output || '',
          actual: actualTrimmed,
          passed,
          isHidden: tc.is_hidden,
          error: res.error,
          executionTimeMs: res.executionTimeMs,
        });
      }

      const passedCount = results.filter((r) => r.passed).length;
      const totalCount = results.length;
      const allPassed = passedCount === totalCount && totalCount > 0;

      return {
        results,
        passedCount,
        totalCount,
        allPassed,
        totalTimeMs,
      };
    },
    [runCode]
  );

  return {
    isReady,
    isLoading,
    loadingProgress,
    runCode,
    evaluateTestCases,
  };
};
