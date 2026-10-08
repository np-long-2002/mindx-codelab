from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class TestCaseBase(BaseModel):
    input_data: str = ""
    expected_output: str
    is_hidden: bool = False
    order: int = 0

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseOut(TestCaseBase):
    id: int
    problem_id: int

    class Config:
        from_attributes = True

class ProblemBase(BaseModel):
    title: str
    description: str
    difficulty: str = "EASY"
    starter_code: Optional[str] = "# Viết code của bạn ở đây\n"
    solution_guide: Optional[str] = None

class ProblemCreate(ProblemBase):
    test_cases: List[TestCaseCreate] = []

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    starter_code: Optional[str] = None
    solution_guide: Optional[str] = None
    test_cases: Optional[List[TestCaseCreate]] = None

class ProblemOut(ProblemBase):
    id: int
    slug: str
    author_id: int
    created_at: datetime
    updated_at: datetime
    test_case_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ProblemDetailOut(ProblemOut):
    test_cases: List[TestCaseOut] = []

