from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SubmissionCreate(BaseModel):
    problem_id: int
    code: str
    status: str = "PASSED"
    passed_cases: int
    total_cases: int
    execution_time_ms: float = 0.0
    error_message: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    user_id: int
    problem_id: int
    code: str
    status: str
    passed_cases: int
    total_cases: int
    execution_time_ms: float
    error_message: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None
    problem_title: Optional[str] = None

    class Config:
        from_attributes = True

