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

// Quiz Types
export interface QuizOption {
  id: number;
  option_text: string;
  is_correct?: boolean;
  order: number;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type?: 'THEORY' | 'PRACTICE';
  code_snippet?: string;
  explanation?: string;
  test_cases?: { input: string; expected: string; is_hidden?: boolean }[];
  order: number;
  options?: QuizOption[];
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  time_limit_minutes: number;
  is_assigned?: boolean;
  author_id: number;
  created_at: string;
  question_count: number;
  attempt_count?: number;
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestion[];
}

export interface QuestionResult {
  question_id: number;
  question_text: string;
  question_type?: 'THEORY' | 'PRACTICE';
  code_snippet?: string;
  selected_option_id?: number;
  correct_option_id?: number;
  is_correct: boolean;
  explanation?: string;
  student_code?: string;
  tests_passed?: number;
  total_tests?: number;
  options?: QuizOption[];
}

export interface QuizSubmitResult {
  attempt_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent_seconds: number;
  results: QuestionResult[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent_seconds: number;
  created_at: string;
  results?: QuestionResult[];
}


