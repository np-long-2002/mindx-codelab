import axios from 'axios';
import type { User, Problem, ProblemDetail, Submission, Quiz, QuizDetail, QuizSubmitResult, QuizAttempt } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  register: async (email: string, fullName: string, password: string, role: string) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/register', {
      email,
      full_name: fullName,
      password,
      role,
    });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const problemsApi = {
  list: async (difficulty?: string, search?: string) => {
    const params: Record<string, string> = {};
    if (difficulty) params.difficulty = difficulty;
    if (search) params.search = search;
    const res = await api.get<Problem[]>('/problems', { params });
    return res.data;
  },
  get: async (id: number) => {
    const res = await api.get<ProblemDetail>(`/problems/${id}`);
    return res.data;
  },
  create: async (data: Partial<ProblemDetail>) => {
    const res = await api.post<ProblemDetail>('/problems', data);
    return res.data;
  },
  update: async (id: number, data: Partial<ProblemDetail>) => {
    const res = await api.put<ProblemDetail>(`/problems/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/problems/${id}`);
    return res.data;
  },
};

export const submissionsApi = {
  create: async (data: {
    problem_id: number;
    code: string;
    status: string;
    passed_cases: number;
    total_cases: number;
    execution_time_ms: number;
    error_message?: string;
  }) => {
    const res = await api.post<Submission>('/submissions', data);
    return res.data;
  },
  list: async (problemId?: number, userId?: number) => {
    const params: Record<string, number> = {};
    if (problemId) params.problem_id = problemId;
    if (userId) params.user_id = userId;
    const res = await api.get<Submission[]>('/submissions', { params });
    return res.data;
  },
  get: async (id: number) => {
    const res = await api.get<Submission>(`/submissions/${id}`);
    return res.data;
  },
};

export const quizzesApi = {
  list: async () => {
    const res = await api.get<Quiz[]>('/quizzes');
    return res.data;
  },
  get: async (id: number) => {
    const res = await api.get<QuizDetail>(`/quizzes/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<QuizDetail>('/quizzes', data);
    return res.data;
  },
  toggleAssign: async (id: number) => {
    const res = await api.patch<Quiz>(`/quizzes/${id}/toggle-assign`);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/quizzes/${id}`);
    return res.data;
  },
  submit: async (
    quizId: number,
    answers: Record<string | number, any>,
    timeSpentSeconds: number,
    practiceAnswers?: Record<string | number, any>
  ) => {
    const res = await api.post<QuizSubmitResult>(`/quizzes/${quizId}/submit`, {
      answers,
      practice_answers: practiceAnswers || {},
      time_spent_seconds: timeSpentSeconds,
    });
    return res.data;
  },
  getAttempts: async (quizId: number) => {
    const res = await api.get<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);
    return res.data;
  },
};

export default api;
