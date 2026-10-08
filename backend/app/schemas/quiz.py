from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Options
class QuizOptionBase(BaseModel):
    option_text: str
    is_correct: bool = False
    order: int = 0

class QuizOptionCreate(QuizOptionBase):
    pass

class QuizOptionOut(QuizOptionBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True

class QuizOptionStudentOut(BaseModel):
    id: int
    option_text: str
    order: int

    class Config:
        from_attributes = True

# Questions
class QuizQuestionBase(BaseModel):
    question_text: str
    code_snippet: Optional[str] = None
    explanation: Optional[str] = None
    order: int = 0

class QuizQuestionCreate(QuizQuestionBase):
    options: List[QuizOptionCreate]

class QuizQuestionOut(QuizQuestionBase):
    id: int
    quiz_id: int
    options: List[QuizOptionOut]

    class Config:
        from_attributes = True

class QuizQuestionStudentOut(BaseModel):
    id: int
    question_text: str
    code_snippet: Optional[str] = None
    order: int
    options: List[QuizOptionStudentOut]

    class Config:
        from_attributes = True

# Quiz
class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit_minutes: int = 15

class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate]

class QuizOut(QuizBase):
    id: int
    author_id: int
    created_at: datetime
    question_count: int = 0

    class Config:
        from_attributes = True

class QuizDetailOut(QuizOut):
    questions: List[QuizQuestionStudentOut]

class QuizDetailTeacherOut(QuizOut):
    questions: List[QuizQuestionOut]

# Submit & Attempts
class QuizSubmitIn(BaseModel):
    answers: Dict[int, int]  # {question_id: option_id}
    time_spent_seconds: int = 0

class QuestionResultOut(BaseModel):
    question_id: int
    question_text: str
    code_snippet: Optional[str] = None
    selected_option_id: Optional[int] = None
    correct_option_id: int
    is_correct: bool
    explanation: Optional[str] = None
    options: List[QuizOptionOut]

class QuizSubmitResult(BaseModel):
    attempt_id: int
    score: int
    total_questions: int
    percentage: float
    time_spent_seconds: int
    results: List[QuestionResultOut]

class QuizAttemptOut(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    user_name: Optional[str] = None
    score: int
    total_questions: int
    percentage: float
    time_spent_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True
