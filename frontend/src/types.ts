export type Role = 'TEACHER' | 'STUDENT';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface TestCase {
  id?: number;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  order: number;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Problem {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  starter_code: string;
  solution_guide?: string;
  author_id: number;
  created_at: string;
  updated_at: string;
  test_case_count: number;
}

export interface ProblemDetail extends Problem {
  test_cases: TestCase[];
}

export interface Submission {
  id: number;
  user_id: number;
  problem_id: number;
  code: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  passed_cases: number;
  total_cases: number;
  execution_time_ms: number;
  error_message?: string;
  created_at: string;
  user_name?: string;
  problem_title?: string;
}

export interface TestResult {
  order: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
  error?: string;
  executionTimeMs: number;
}

