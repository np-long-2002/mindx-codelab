import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.problem import Problem, TestCase
from app.models.user import User
from app.schemas.problem import ProblemCreate, ProblemUpdate, ProblemOut, ProblemDetailOut
from app.core.dependencies import get_current_user, require_teacher

router = APIRouter(prefix="/problems", tags=["problems"])

def generate_slug(title: str, db: Session, current_id: Optional[int] = None) -> str:
    # Basic slugify
    base = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')
    if not base:
        base = "problem"
    slug = base
    counter = 1
    while True:
        query = db.query(Problem).filter(Problem.slug == slug)
        if current_id:
            query = query.filter(Problem.id != current_id)
        if not query.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1

@router.get("", response_model=List[ProblemOut])
def list_problems(
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Problem)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty.upper())
    if search:
        query = query.filter(Problem.title.ilike(f"%{search}%"))
    
    problems = query.order_by(Problem.created_at.desc()).all()
    results = []
    for p in problems:
        p_dict = ProblemOut.model_validate(p)
        p_dict.test_case_count = len(p.test_cases)
        results.append(p_dict)
    return results

@router.get("/{problem_id}", response_model=ProblemDetailOut)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    p_dict = ProblemDetailOut.model_validate(problem)
    p_dict.test_case_count = len(problem.test_cases)
    return p_dict

@router.post("", response_model=ProblemDetailOut)
def create_problem(
    problem_in: ProblemCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    slug = generate_slug(problem_in.title, db)
    problem = Problem(
        title=problem_in.title,
        slug=slug,
        description=problem_in.description,
        difficulty=problem_in.difficulty.upper(),
        starter_code=problem_in.starter_code or "# Viết code của bạn ở đây\n",
        solution_guide=problem_in.solution_guide,
        author_id=teacher.id
    )
    db.add(problem)
    db.flush()

    for idx, tc in enumerate(problem_in.test_cases):
        test_case = TestCase(
            problem_id=problem.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_hidden=tc.is_hidden,
            order=idx
        )
        db.add(test_case)

    db.commit()
    db.refresh(problem)
    p_dict = ProblemDetailOut.model_validate(problem)
    p_dict.test_case_count = len(problem.test_cases)
    return p_dict

@router.put("/{problem_id}", response_model=ProblemDetailOut)
def update_problem(
    problem_id: int,
    problem_in: ProblemUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )

    if problem_in.title is not None:
        problem.title = problem_in.title
        problem.slug = generate_slug(problem_in.title, db, current_id=problem.id)
    if problem_in.description is not None:
        problem.description = problem_in.description
    if problem_in.difficulty is not None:
        problem.difficulty = problem_in.difficulty.upper()
    if problem_in.starter_code is not None:
        problem.starter_code = problem_in.starter_code
    if problem_in.solution_guide is not None:
        problem.solution_guide = problem_in.solution_guide

    if problem_in.test_cases is not None:
        # replace existing test cases
        db.query(TestCase).filter(TestCase.problem_id == problem.id).delete()
        for idx, tc in enumerate(problem_in.test_cases):
            test_case = TestCase(
                problem_id=problem.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                is_hidden=tc.is_hidden,
                order=idx
            )
            db.add(test_case)

    db.commit()
    db.refresh(problem)
    p_dict = ProblemDetailOut.model_validate(problem)
    p_dict.test_case_count = len(problem.test_cases)
    return p_dict

@router.delete("/{problem_id}")
def delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    db.delete(problem)
    db.commit()
    return {"message": "Đã xóa bài tập thành công"}

